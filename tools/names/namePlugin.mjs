/**
 * Plugin Vite : enregistre sur l'ordinateur les phrases dites avec le prénom de la joueuse
 * (dossier `prenoms/`, privé). Servi par `npm run dev` et `npm run preview`.
 * Décisions (testées) : src/engine/nameVoice.ts ; voix : tools/tts/name_voices.py.
 *
 *   POST …/api/name/preview  {name, spelling?}  → {fr, en, spelled?} : « Hello, <prénom>! » à écouter
 *   POST …/api/name/voices   {name, pron}       → {status: 'ready', clips} | {status: 'working', done, total}
 *   GET  …/api/name/<id>/<fichier>.mp3 et …/api/name/essais/<id>/<fichier>.mp3
 *
 * Sans moteur de voix (tools/tts/.venv) ou sans liste de phrases (npm run voices) : {status: 'unavailable'},
 * le jeu dit alors les phrases sans le prénom, comme avant.
 */
import { spawn } from 'node:child_process';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { linesTag, NAME_API, nameVoiceId, parseNameRequest, previewId, safeClipPath, sanitizeSpelling } from '../../src/engine/nameVoice.ts';

const BODY_MAX = 4000;

export function namePlugin() {
  let root = process.cwd();
  const dir = () => join(root, 'prenoms');
  const tts = () => join(root, 'tools', 'tts');
  const python = () => [join(tts(), '.venv', 'Scripts', 'python.exe'), join(tts(), '.venv', 'bin', 'python')].find(existsSync);
  const linesFile = () => join(tts(), 'lines.json');
  /** id → { running, failed, failedAt } */
  const jobs = new Map();
  /** id → Promise des essais d'écoute en cours */
  const previews = new Map();
  let linesCache = { mtime: 0, tag: '', total: 0 };

  const readLines = () => {
    if (!existsSync(linesFile())) return null;
    const mtime = statSync(linesFile()).mtimeMs;
    if (mtime !== linesCache.mtime) {
      const lines = JSON.parse(readFileSync(linesFile(), 'utf8'));
      linesCache = { mtime, tag: linesTag(lines), total: lines.filter((e) => e.player).length };
    }
    return linesCache;
  };

  const runPython = (args) =>
    new Promise((resolve) => {
      const py = python();
      if (!py) return resolve(null);
      const p = spawn(py, [join(tts(), 'name_voices.py'), ...args], { env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, windowsHide: true });
      let out = '';
      let err = '';
      p.stdout.on('data', (c) => (out += c));
      p.stderr.on('data', (c) => (err += c));
      p.on('error', () => resolve(null));
      p.on('close', (code) => {
        if (code !== 0) console.warn('[voix du prénom]', err.trim().split('\n').slice(-3).join(' | '));
        try {
          resolve(code === 0 ? JSON.parse(out.trim().split('\n').pop() || 'null') : null);
        } catch {
          resolve(null);
        }
      });
    });

  const readBody = (req) =>
    new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (c) => {
        body += c;
        if (body.length > BODY_MAX) {
          reject(new Error('trop gros'));
          req.destroy();
        }
      });
      req.on('end', () => resolve(body));
      req.on('error', reject);
    });

  const json = (res, code, data) => {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(data));
  };

  const readJson = (file) => {
    try {
      return JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      return null;
    }
  };

  /** « Hello, <prénom>! » dit des trois façons, pour choisir à l'oreille. */
  const preview = async (body) => {
    let raw = {};
    try {
      raw = JSON.parse(body);
    } catch {
      /* rien */
    }
    const req = parseNameRequest(JSON.stringify({ name: raw.name, pron: { mode: 'fr' } }));
    if (!req) return [400, { error: 'name' }];
    const spelling = sanitizeSpelling(raw.spelling);
    const id = previewId(req.name, spelling);
    const out = join(dir(), 'essais', id);
    const modes = spelling ? ['fr', 'en', 'spelled'] : ['fr', 'en'];
    const urls = () => Object.fromEntries(modes.map((m) => [m, `${NAME_API}/essais/${id}/${m}.mp3`]));
    if (modes.every((m) => existsSync(join(out, `${m}.mp3`)))) return [200, urls()];
    if (!previews.has(id)) {
      const args = ['preview', '--name', req.name, '--out', out, ...(spelling ? ['--spelling', spelling] : [])];
      previews.set(id, runPython(args).finally(() => previews.delete(id)));
    }
    const r = await previews.get(id);
    return r ? [200, urls()] : [503, { status: 'unavailable' }];
  };

  /** Toutes les phrases adressées à la joueuse, avec son prénom : une fois prêtes, gardées dans prenoms/<id>/. */
  const voices = (body) => {
    const req = parseNameRequest(body);
    if (!req) return [400, { error: 'name' }];
    const lines = readLines();
    if (!lines || !python()) return [503, { status: 'unavailable' }];
    const id = nameVoiceId(req);
    const out = join(dir(), id);
    const manifest = readJson(join(out, 'manifest.json'));
    if (manifest && manifest.tag === lines.tag) {
      const clips = Object.fromEntries(Object.entries(manifest.clips).map(([k, f]) => [k, `${NAME_API}/${id}/${f}`]));
      return [200, { status: 'ready', id, clips }];
    }
    const job = jobs.get(id);
    if (job?.running) {
      const p = readJson(join(out, 'progress.json'));
      return [200, { status: 'working', done: p?.done ?? 0, total: p?.total ?? lines.total }];
    }
    // échec : on réessaie au plus une fois par minute
    if (job?.failed && Date.now() - job.failedAt < 60_000) return [503, { status: 'unavailable' }];
    // une seule génération à la fois : les autres attendent leur tour
    if ([...jobs.values()].some((j) => j.running)) return [200, { status: 'working', done: 0, total: lines.total }];
    const entry = { running: true, failed: false };
    jobs.set(id, entry);
    const { pron } = req;
    const args = ['generate', '--name', req.name, '--mode', pron.mode, '--lines', linesFile(), '--tag', lines.tag, '--out', out];
    if (pron.spelling) args.push('--spelling', pron.spelling);
    console.log(`[voix du prénom] enregistrement de ${lines.total} phrases (${pron.mode})…`);
    void runPython(args).then((r) => {
      entry.running = false;
      entry.failed = !r;
      entry.failedAt = Date.now();
      if (r) console.log(`[voix du prénom] prêt : ${r.clips} phrases`);
    });
    return [200, { status: 'working', done: 0, total: lines.total }];
  };

  const handler = (req, res, next) => {
    const url = decodeURIComponent((req.url || '').split('?')[0]);
    const at = url.indexOf('/' + NAME_API + '/');
    if (at < 0) return next();
    const rest = url.slice(at + NAME_API.length + 2);
    try {
      if (req.method === 'GET') {
        const m = /^(?:(essais)\/)?([^/]+)\/([^/]+)$/.exec(rest);
        if (!m || !safeClipPath(m[2], m[3])) return json(res, 404, {});
        const file = m[1] ? join(dir(), 'essais', m[2], m[3]) : join(dir(), m[2], m[3]);
        if (!existsSync(file)) return json(res, 404, {});
        res.statusCode = 200;
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'no-cache');
        createReadStream(file).pipe(res);
        return;
      }
      if (req.method !== 'POST' || (rest !== 'preview' && rest !== 'voices')) return json(res, 405, {});
      readBody(req)
        .then(async (body) => {
          const [code, data] = rest === 'preview' ? await preview(body) : voices(body);
          json(res, code, data);
        })
        .catch(() => json(res, 413, {}));
    } catch (e) {
      console.warn('[voix du prénom]', e);
      json(res, 500, {});
    }
  };

  return {
    name: 'aea-name-voices',
    config: () => ({ server: { watch: { ignored: ['**/prenoms/**'] } } }),
    configResolved(config) {
      root = config.root;
    },
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
