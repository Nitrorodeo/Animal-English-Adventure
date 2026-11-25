import { describe, expect, it } from 'vitest';
import { FAMILY_LINES } from '../content/dialogues';
import { NOUNS, PLACES } from '../content/places';
import { SPECIES } from '../content/species';
import { say, SPEED_SAMPLE } from '../content/utterances';
import manifest from '../content/voiceManifest.json';
import { fill, fillLine, stepUtterances } from '../engine/dialogue';
import { newGameState, variableNames, withFamily, getFamily } from '../engine/state';
import { createBaby } from '../engine/family';
import { clipFor } from './clips';
import { RECORDED_SPEED } from './speech';
import generatorSource from '../../tools/tts/generate_voices.py?raw';
import { buildVoiceCatalog } from './voiceCatalog';
import { activityVariants, adventureVariants, STRUCTURAL_CONFIGS, voiceOfSpeaker, type Variant } from '../engine/variants';
import { clipKey, normalizeNames, spokenForm, VOICE_OF_ROLE } from './voiceKey';

const clips: Record<string, string> = manifest.clips;

describe('clé des enregistrements', () => {
  it('remplace les prénoms variables par mot entier, le plus long d’abord', () => {
    expect(normalizeNames('Hello, Mia! Miami is far.', ['Mia'])).toBe('Hello, {name}! Miami is far.');
    expect(normalizeNames('Hi Anna and Ann!', ['Ann', 'Anna'])).toBe('Hi {name} and {name}!');
    expect(normalizeNames('Hello, Léa!', ['Léa'])).toBe('Hello, {name}!');
    expect(normalizeNames('I am A.', ['A'])).toBe('I am A.'); // prénom d'une lettre ignoré
  });

  it('dit une variante sans prénom, rédigée à la main', () => {
    expect(spokenForm('Thank you, {name}!')).toBe('Thank you!');
    expect(spokenForm('Hi! I\'m {name}! I\'m a little lion cub!')).toBe('Hi! I\'m a little lion cub!');
    expect(spokenForm('{name} learned a new word!')).toBe('Your baby learned a new word!');
    expect(spokenForm('No name here.')).toBe('No name here.');
    expect(spokenForm('Where is {name} going today?')).toBeNull(); // aucune règle : signalé
  });
});

describe('catalogue des voix', () => {
  const catalog = buildVoiceCatalog();

  it('toutes les phrases avec prénom ont une variante parlée', () => {
    expect(catalog.unsupported).toEqual([]);
  });

  it('chaque phrase du catalogue a son enregistrement (sinon : npm run voices)', () => {
    const missing = catalog.entries.filter((e) => !clips[e.key]).map((e) => e.key);
    expect(missing).toEqual([]);
  });

  it('chaque phrase des scènes, remplie comme à l’écran avec les prénoms de la partie, a son enregistrement', () => {
    const africa = SPECIES.filter((sp) => sp.continentId === 'africa');
    const variants: Variant[] = [...activityVariants(STRUCTURAL_CONFIGS, africa), ...[...adventureVariants(STRUCTURAL_CONFIGS)].filter((v) => v.species.continentId === 'africa')];
    const names = ['Ava', 'Mia', 'Tom'];
    const missing = new Set<string>();
    for (const v of variants) {
      const actorName = v.config.actorKind === 'baby' ? 'Mia' : v.config.role === 'mother' ? v.species.mother.name : v.species.father.name;
      const vars = { actorName, playerName: 'Ava', babyName: 'Mia', siblingName: 'Tom', placeName: PLACES[v.script.biomeId]?.nameEn ?? '' };
      for (const step of v.script.steps) {
        for (const u of stepUtterances(step)) {
          const role = voiceOfSpeaker(u.who, v.config);
          if (!role) continue;
          const text = fill(u.line.en, vars);
          expect(text, u.line.en).not.toMatch(/\{/);
          const spoken = u.retry ? say.tryAgain(text) : text;
          if (!clipFor(spoken, role, names)) missing.add(`${role}|${spoken}`);
        }
      }
    }
    expect([...missing].slice(0, 20)).toEqual([]);
  }, 60000);
});

describe('le jeu retrouve les enregistrements', () => {
  it('titre, avec ou sans prénom de joueuse', () => {
    expect(clipFor(say.title('Explorer'), undefined, [])).toBeDefined();
    expect(clipFor(say.title('Ava'), undefined, ['Ava'])).toBeDefined();
    expect(clipFor(say.title('Ava'), undefined, ['Ava'])).toBe(clipFor(say.title('Zoé'), 'narrator', ['Zoé']));
  });

  it('bouton « Écouter » du réglage de vitesse : la phrase d’exemple est enregistrée', () => {
    expect(clipFor(SPEED_SAMPLE.text, SPEED_SAMPLE.role, [])).toBeDefined();
  });

  it('scène de famille et annonces, une fois le bébé nommé', () => {
    const r = createBaby(getFamily(newGameState(), 'lion'), 'girl', 'Mia', 'lion-b1');
    if (!r.ok) throw new Error(r.error);
    const state = withFamily({ ...newGameState(), player: { ...newGameState().player, name: 'Ava' } }, r.family);
    const names = variableNames(state);
    expect(names).toEqual(['Ava', 'Mia']);
    for (const l of Object.values(FAMILY_LINES)) {
      const text = fillLine(l, { babyName: 'Mia', siblingName: 'Mia', playerName: 'Ava' }).en;
      for (const r of ['girl', 'boy'] as const) expect(clipFor(text, r, names), text).toBeDefined();
    }
    expect(clipFor(say.growUp('Mia', 'little'), 'narrator', names)).toBeDefined();
    expect(clipFor(say.actorCall('Mia'), 'girl', names)).toBeDefined();
    expect(clipFor(say.actorCall('Mia'), 'boy', names)).toBeDefined();
    expect(clipFor(say.actorCall('Mia'), 'girl', names)).not.toBe(clipFor(say.actorCall('Mia'), 'boy', names));
  });

  it('mots du décor, continents et choix d’espèce', () => {
    for (const a of PLACES.savanna!.anchors) expect(clipFor(say.decorWord(NOUNS[a.word], a.word), undefined, []), a.word).toBeDefined();
    expect(clipFor(say.continentPrompt('Africa'), undefined, [])).toBeDefined();
    expect(clipFor(say.speciesPick(SPECIES[0]!), undefined, [])).toBeDefined();
  });

  it('une phrase inconnue n’a pas d’enregistrement (repli sur la voix de l’appareil)', () => {
    expect(clipFor('A sentence nobody wrote.', 'father', [])).toBeUndefined();
    expect(clips[clipKey(VOICE_OF_ROLE.father, 'A sentence nobody wrote.')]).toBeUndefined();
  });
});

describe('vitesse des enregistrements', () => {
  it('RECORDED_SPEED du jeu = SPEED du générateur (sinon 100 % ne serait plus la vitesse naturelle)', () => {
    const m = generatorSource.match(/^SPEED = ([0-9.]+)/m);
    expect(m, 'SPEED introuvable dans generate_voices.py').not.toBeNull();
    expect(Number(m![1])).toBe(RECORDED_SPEED);
  });
});
