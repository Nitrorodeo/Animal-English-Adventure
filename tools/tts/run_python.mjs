// Lance un script Python avec l'environnement local tools/tts/.venv (Windows ou Unix).
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const py = [join(here, '.venv', 'Scripts', 'python.exe'), join(here, '.venv', 'bin', 'python')].find(existsSync);
if (!py) {
  console.error('Environnement Python absent : voir docs/ETAT_DU_PROJET.md, section « Voix ».');
  process.exit(1);
}
const r = spawnSync(py, process.argv.slice(2), { stdio: 'inherit' });
process.exit(r.status ?? 1);
