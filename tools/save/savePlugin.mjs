/**
 * Plugin Vite : garde sur l'ordinateur une copie de la partie de la tablette (dossier `saves/`).
 * Servi par `npm run dev` et `npm run preview`. Décisions (testées) : src/engine/backup.ts.
 *
 *   GET    …/api/save  → la dernière copie (204 s'il n'y en a pas)
 *   PUT    …/api/save  → remplace la copie (+ une copie par jour dans saves/historique/)
 *   DELETE …/api/save  → « Effacer la partie » : la copie part dans l'historique, rien n'est détruit
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { acceptableBackup, BACKUP_MAX_BYTES, BACKUP_PATH, historyFileName } from '../../src/engine/backup.ts';

export function savePlugin() {
  let dir = join(process.cwd(), 'saves');
  const file = () => join(dir, 'save.json');
  const history = () => join(dir, 'historique');

  const readBody = (req) =>
    new Promise((resolve, reject) => {
      let size = 0;
      const chunks = [];
      req.on('data', (c) => {
        size += c.length;
        if (size > BACKUP_MAX_BYTES + 1) {
          reject(new Error('trop gros'));
          req.destroy();
        } else chunks.push(c);
      });
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });

  const handler = (req, res, next) => {
    const url = (req.url || '').split('?')[0];
    if (!url.endsWith('/' + BACKUP_PATH)) return next();
    res.setHeader('Cache-Control', 'no-store');
    const done = (code, body) => {
      res.statusCode = code;
      if (body) res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(body);
    };
    try {
      if (req.method === 'GET') {
        return existsSync(file()) ? done(200, readFileSync(file(), 'utf8')) : done(204);
      }
      if (req.method === 'PUT' || req.method === 'POST') {
        readBody(req)
          .then((body) => {
            if (!acceptableBackup(body)) return done(400);
            mkdirSync(history(), { recursive: true });
            const tmp = file() + '.tmp';
            writeFileSync(tmp, body, 'utf8');
            renameSync(tmp, file());
            writeFileSync(join(history(), historyFileName(new Date(), 'day')), body, 'utf8');
            done(204);
          })
          .catch(() => done(413));
        return;
      }
      if (req.method === 'DELETE') {
        if (existsSync(file())) {
          mkdirSync(history(), { recursive: true });
          renameSync(file(), join(history(), historyFileName(new Date(), 'erased')));
        }
        return done(204);
      }
      return done(405);
    } catch (e) {
      console.warn('[sauvegarde PC]', e);
      return done(500);
    }
  };

  return {
    name: 'aea-save-backup',
    config: () => ({ server: { watch: { ignored: ['**/saves/**'] } } }),
    configResolved(config) {
      dir = join(config.root, 'saves');
    },
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
