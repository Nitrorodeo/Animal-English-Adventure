/**
 * Écrit tools/tts/lines.json : la liste des phrases à enregistrer (voix, clé, texte parlé).
 * Lancé par `npm run voices` avant tools/tts/generate_voices.py.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildVoiceCatalog } from '../../src/audio/voiceCatalog';

const here = dirname(fileURLToPath(import.meta.url));
const { entries, unsupported } = buildVoiceCatalog();
if (unsupported.length) {
  console.error('Phrases avec prénom sans variante parlée (voir NAME_RULES dans src/audio/voiceKey.ts) :');
  for (const u of unsupported) console.error(' -', u);
  process.exit(1);
}
writeFileSync(join(here, 'lines.json'), JSON.stringify(entries, null, 1) + '\n', 'utf-8');
const voices = new Map<string, number>();
for (const e of entries) voices.set(e.voice, (voices.get(e.voice) ?? 0) + 1);
console.log(`${entries.length} phrases →`, Object.fromEntries(voices));
