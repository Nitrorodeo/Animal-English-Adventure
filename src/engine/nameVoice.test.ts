import { describe, expect, it } from 'vitest';
import { buildVoiceCatalog } from '../audio/voiceCatalog';
import { clipKey, VOICE_OF_ROLE } from '../audio/voiceKey';
import { say } from '../content/utterances';
import {
  linesTag,
  nameClipFor,
  nameVoiceId,
  parseNamePron,
  parseNameRequest,
  parseNameStatus,
  playerLines,
  previewId,
  safeClipPath,
  sanitizeSpelling,
} from './nameVoice';
import { migrate } from './save';
import { newGameState } from './state';

describe('prononciation du prénom', () => {
  it('écriture pour l’oreille : lettres, espaces, tirets, apostrophes', () => {
    expect(sanitizeSpelling('  Ma-é-la ')).toBe('Ma-é-la');
    expect(sanitizeSpelling('Lay<script>ah')).toBe('Layscriptah');
    expect(sanitizeSpelling('123')).toBeNull();
    expect(sanitizeSpelling('')).toBeNull();
    expect(sanitizeSpelling('a'.repeat(31))).toBeNull();
    expect(sanitizeSpelling(42)).toBeNull();
  });

  it('prononciation lue dans une sauvegarde', () => {
    expect(parseNamePron({ mode: 'fr' })).toEqual({ mode: 'fr' });
    expect(parseNamePron({ mode: 'en', spelling: 'x' })).toEqual({ mode: 'en' });
    expect(parseNamePron({ mode: 'spelled', spelling: 'Klo-é' })).toEqual({ mode: 'spelled', spelling: 'Klo-é' });
    expect(parseNamePron({ mode: 'spelled' })).toBeNull();
    expect(parseNamePron({ mode: 'robot' })).toBeNull();
    expect(parseNamePron(null)).toBeNull();
  });

  it('la partie garde la prononciation ; une ancienne partie n’en a pas', () => {
    const s = newGameState();
    expect(s.player.namePron).toBeNull();
    const saved = { ...s, player: { ...s.player, name: 'Chloé', namePron: { mode: 'spelled', spelling: 'Klo-é' } } };
    expect(migrate(JSON.parse(JSON.stringify(saved)))?.player.namePron).toEqual({ mode: 'spelled', spelling: 'Klo-é' });
    const { namePron: _gone, ...oldPlayer } = s.player;
    expect(migrate({ ...s, player: oldPlayer })?.player.namePron).toBeNull();
    expect(migrate({ ...s, player: { ...s.player, namePron: { mode: 'robot' } } })?.player.namePron).toBeNull();
  });
});

describe('demande de voix reçue par l’ordinateur', () => {
  it('accepte un vrai prénom, refuse le reste', () => {
    expect(parseNameRequest(JSON.stringify({ name: ' Chloé ', pron: { mode: 'fr' } }))).toEqual({ name: 'Chloé', pron: { mode: 'fr' } });
    expect(parseNameRequest(JSON.stringify({ name: 'Inès' }))).toEqual({ name: 'Inès', pron: { mode: 'fr' } });
    expect(parseNameRequest(JSON.stringify({ name: 'Explorer', pron: { mode: 'fr' } }))).toBeNull();
    expect(parseNameRequest(JSON.stringify({ name: '', pron: { mode: 'fr' } }))).toBeNull();
    expect(parseNameRequest(JSON.stringify({ name: 'Chloé', pron: { mode: 'spelled' } }))).toBeNull();
    expect(parseNameRequest('pas du json')).toBeNull();
    // caractères dangereux retirés avant tout lancement
    expect(parseNameRequest(JSON.stringify({ name: 'Zoé"; rm -rf', pron: { mode: 'en' } }))?.name).toBe('Zoé rm -rf');
  });

  it('dossiers : stables, différents par prononciation, toujours sûrs', () => {
    const fr = nameVoiceId({ name: 'Chloé', pron: { mode: 'fr' } });
    expect(fr).toBe(nameVoiceId({ name: 'Chloé', pron: { mode: 'fr' } }));
    expect(fr).toMatch(/^chloe-[0-9a-f]{8}$/);
    expect(nameVoiceId({ name: 'Chloé', pron: { mode: 'en' } })).not.toBe(fr);
    expect(nameVoiceId({ name: '李娜', pron: { mode: 'fr' } })).toMatch(/^prenom-[0-9a-f]{8}$/);
    expect(previewId('Chloé', null)).toBe(fr);
    for (const id of [fr, previewId('Chloé', 'Klo-é'), nameVoiceId({ name: 'Marie-Ève', pron: { mode: 'en' } })]) expect(safeClipPath(id, 'fr.mp3')).toBe(true);
    expect(safeClipPath('../saves', 'save.json')).toBe(false);
    expect(safeClipPath(fr, '../../x.mp3')).toBe(false);
  });
});

describe('phrases dites avec le prénom de la joueuse', () => {
  const { entries } = buildVoiceCatalog();
  const player = playerLines(entries);
  const keys = new Set(player.map((e) => e.key));

  it('les animaux s’adressent à elle : accueil, merci, bravo, bonne nuit', () => {
    expect(keys.has(clipKey(VOICE_OF_ROLE.narrator, say.title('{name}')))).toBe(true);
    expect(keys.has(clipKey(VOICE_OF_ROLE.mother, say.hello('{name}')))).toBe(true);
    for (const r of ['father', 'mother', 'girl', 'boy'] as const) expect(keys.has(clipKey(VOICE_OF_ROLE[r], say.bravo('{name}')))).toBe(true);
    expect(keys.has(clipKey(VOICE_OF_ROLE.mother, 'Good night, {name}!'))).toBe(true);
    expect(player.length).toBeLessThan(60); // assez peu pour être prêt en moins d'une minute
  });

  it('les phrases où un bébé dit SON prénom ne sont pas pour la joueuse', () => {
    expect([...keys].some((k) => k.includes("I'm {name}"))).toBe(false);
    expect([...keys].some((k) => k.includes('{name} is growing up'))).toBe(false);
    expect([...keys].some((k) => k.includes('Welcome to our family'))).toBe(false);
  });

  it('la version change quand les phrases changent', () => {
    expect(linesTag(entries)).toBe(linesTag([...entries].reverse()));
    expect(linesTag(entries)).not.toBe(linesTag(player.slice(1)));
  });

  it('seul le prénom de la joueuse est reconnu', () => {
    const clips = { [clipKey(VOICE_OF_ROLE.mother, 'Hello, {name}!')]: 'api/name/chloe-00000000/a.mp3' };
    expect(nameClipFor('Hello, Chloé!', 'mother', 'Chloé', clips)).toBe('api/name/chloe-00000000/a.mp3');
    expect(nameClipFor('Hello, Mia!', 'mother', 'Chloé', clips)).toBeUndefined(); // prénom d'un bébé
    expect(nameClipFor('Hello, Chloé!', 'father', 'Chloé', clips)).toBeUndefined(); // autre voix
    expect(nameClipFor('Hello!', 'mother', 'Chloé', clips)).toBeUndefined();
    expect(nameClipFor('Hello, Explorer!', 'mother', 'Explorer', clips)).toBeUndefined();
    expect(nameClipFor('Hello, Chloé!', 'mother', 'Chloé', null)).toBeUndefined();
  });

  it('réponse de l’ordinateur lue prudemment', () => {
    expect(parseNameStatus({ status: 'ready', id: 'x', clips: { a: 'b', c: 3 } })).toEqual({ status: 'ready', id: 'x', clips: { a: 'b' } });
    expect(parseNameStatus({ status: 'working', done: '4', total: 27 })).toEqual({ status: 'working', done: 4, total: 27 });
    expect(parseNameStatus({ status: 'unavailable' })).toEqual({ status: 'unavailable' });
    expect(parseNameStatus('n’importe quoi')).toEqual({ status: 'unavailable' });
  });
});
