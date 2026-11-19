/**
 * Génère dist/sw.js (service worker du mode hors-ligne) après `vite build`.
 * Liste tous les fichiers de dist/ avec l'empreinte de leur contenu, puis remplit tools/pwa/sw-template.js.
 * Lancé par `npm run build`. Logique de répartition : src/pwa/precache.ts (testée).
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parseRange, planPrecache, staleMedia, type BuiltFile } from '../../src/pwa/precache';

const ROOT = join(import.meta.dirname ?? __dirname, '..', '..');
const DIST = join(ROOT, 'dist');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files: BuiltFile[] = walk(DIST).map((p) => ({
  path: relative(DIST, p).split(sep).join('/'),
  rev: createHash('md5').update(readFileSync(p)).digest('hex').slice(0, 10),
}));
const plan = planPrecache(files);

const sw = readFileSync(join(ROOT, 'tools', 'pwa', 'sw-template.js'), 'utf8')
  .replace('__PLAN__', () => JSON.stringify(plan))
  .replace('__PARSE_RANGE__', () => parseRange.toString())
  .replace('__STALE_MEDIA__', () => staleMedia.toString());
if (/__[A-Z_]+__/.test(sw)) throw new Error('sw.js : un emplacement du modèle n’a pas été rempli');
writeFileSync(join(DIST, 'sw.js'), sw);
console.log(`sw.js : version ${plan.version}, ${plan.shell.length} fichiers au démarrage, ${plan.media.length} médias en arrière-plan`);
