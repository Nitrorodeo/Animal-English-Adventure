/**
 * Croissance des bébés, pour TOUTES les familles (demande du parent du 2026-11-23) :
 * évolution progressive, quatre phases affichées, deux bébés indépendants, sauvegarde,
 * progression conservée quand on change de décor. Les règles (src/engine/family.ts) ne sont
 * pas modifiées : ce fichier les vérifie avec les vraies activités du jeu.
 */
// @ts-expect-error -- module Node sans types dans ce projet (les tests tournent sous Node)
import { existsSync } from 'node:fs';
// @ts-expect-error -- module Node sans types dans ce projet (les tests tournent sous Node)
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SPECIES } from '../content/species';
import { getBiome } from '../content/world';
import { GROWTH_STAGES, type BiomeId, type QuestScript } from '../content/types';
import { applyQuestOutcome } from './events';
import { createBaby, GROWTH_THRESHOLDS } from './family';
import { selectActivities } from './quests';
import { createRng } from './rng';
import { loadGame, memoryStorage, saveGame } from './save';
import type { AnswerRecord } from './skills';
import { getFamily, newGameState, withFamily, type ActorRef, type GameState } from './state';
import { spriteFor } from '../ui/scene';

const FAMILIES = SPECIES.filter((s) => s.playable && s.familyReady);
const ORDER = [...GROWTH_STAGES];
const rank = (s: string) => ORDER.indexOf(s as (typeof ORDER)[number]);
/**
 * Familles dont les bébés n'ont qu'une image par sexe. Vide depuis le 2026-11-23 : la planche
 * « Famille de lions en évolution.png » est découpée (autorisation du parent), ses 8 phases sont dans le jeu.
 */
const ONE_SPRITE_ONLY: string[] = [];

function answersFor(script: QuestScript): AnswerRecord[] {
  return script.steps.flatMap((s) => (s.kind === 'ask' || s.kind === 'tapAnchor' || s.kind === 'tapProps' || s.kind === 'seek' || s.kind === 'tapActor' ? [{ items: s.items, correct: true, aided: false }] : []));
}

function withTwoBabies(speciesId: string): GameState {
  let fam = getFamily(newGameState(), speciesId);
  const a = createBaby(fam, 'girl', 'Mia', 'girl1');
  if (!a.ok) throw new Error(a.error);
  const b = createBaby(a.family, 'boy', 'Tom', 'boy1');
  if (!b.ok) throw new Error(b.error);
  fam = b.family;
  return withFamily(newGameState(), fam);
}

/** Joue la première activité proposée au personnage, dans ce décor. */
function playOnce(state: GameState, speciesId: string, place: BiomeId, actor: ActorRef, seed: number): GameState {
  const species = FAMILIES.find((s) => s.id === speciesId)!;
  const acts = selectActivities({ state, species, biome: getBiome(place), actor, rng: createRng(seed) });
  const a = acts[0];
  if (!a) throw new Error(`aucune activité : ${speciesId} @ ${place}`);
  return applyQuestOutcome(state, { script: a.script, mechanic: a.archetype.mechanic, actor, answers: answersFor(a.script), teach: a.teach, continentId: getBiome(place).continentId }).state;
}

describe('croissance des bébés — règles validées inchangées', () => {
  it('seuils de croissance du 2026-11-19 (little 6/2/2, young 16/6/5, companion 30/12/9)', () => {
    expect(GROWTH_THRESHOLDS).toEqual({
      little: { seen: 6, retained: 2, activities: 2 },
      young: { seen: 16, retained: 6, activities: 5 },
      companion: { seen: 30, retained: 12, activities: 9 },
    });
    expect(ORDER).toEqual(['newborn', 'little', 'young', 'companion']);
  });
});

describe.each(FAMILIES.map((s) => [s.id, s.allowedBiomes] as const))('croissance — %s', (speciesId, places) => {
  it('les quatre phases ont leur image, pour la fille et pour le garçon, et les deux parents aussi', () => {
    for (const role of ['father', 'mother'] as const) {
      const p = spriteFor(speciesId, { role });
      expect(p, `${speciesId} ${role}`).toBeDefined();
      expect(existsSync(resolve('public', p!.path)), p!.path).toBe(true);
    }
    for (const sex of ['girl', 'boy'] as const)
      for (const stage of ORDER) {
        const s = spriteFor(speciesId, { sex, stage });
        expect(s, `${speciesId} ${sex} ${stage}`).toBeDefined();
        expect(existsSync(resolve('public', s!.path)), s!.path).toBe(true);
      }
    // quatre images différentes par bébé : la croissance se voit
    const distinct = (['girl', 'boy'] as const).map((sex) => new Set(ORDER.map((stage) => spriteFor(speciesId, { sex, stage })!.path)).size);
    expect(distinct, speciesId).toEqual(ONE_SPRITE_ONLY.includes(speciesId) ? [1, 1] : [4, 4]);
  });

  it('la fille grandit pas à pas en jouant dans tous ses décors, sans sauter ni reculer ; le garçon garde sa propre progression ; tout survit à la sauvegarde et au changement de décor', () => {
    let state = withTwoBabies(speciesId);
    const girl: ActorRef = { speciesId, kind: 'baby', babyId: 'girl1' };
    const seen: string[] = ['newborn'];
    const storage = memoryStorage();
    for (let i = 0; i < 160 && seen.at(-1) !== 'companion'; i++) {
      const place = places[i % places.length]!;
      state = playOnce(state, speciesId, place, girl, 1000 + i);
      const stage = getFamily(state, speciesId).babies.find((b) => b.id === 'girl1')!.stage;
      // progressif : jamais de recul, jamais deux phases d'un coup
      expect(rank(stage) - rank(seen.at(-1)!), `${speciesId} tour ${i}`).toBeGreaterThanOrEqual(0);
      expect(rank(stage) - rank(seen.at(-1)!), `${speciesId} tour ${i}`).toBeLessThanOrEqual(1);
      if (stage !== seen.at(-1)) {
        seen.push(stage);
        // sauvegarde à chaque nouvelle phase : relue à l'identique
        expect(saveGame(storage, state)).toBe(true);
        const back = loadGame(storage);
        expect(back.status).toBe('loaded');
        expect(back.state).toEqual(state);
        state = back.state;
        // changement de décor : la phase suit le bébé, quel que soit le lieu
        const other = places[(i + 1) % places.length]!;
        const acts = selectActivities({ state, species: FAMILIES.find((s) => s.id === speciesId)!, biome: getBiome(other), actor: girl, rng: createRng(i) });
        expect(acts.length, `${speciesId} @ ${other}`).toBeGreaterThan(0);
        expect(getFamily(state, speciesId).babies.find((b) => b.id === 'girl1')!.stage).toBe(stage);
      }
    }
    expect(seen, speciesId).toEqual(ORDER);
    // indépendance : le garçon n'a appris aucun mot de la joueuse et n'a pas suivi sa sœur jusqu'au bout
    const boy = getFamily(state, speciesId).babies.find((b) => b.id === 'boy1')!;
    expect(Object.keys(boy.taughtWords)).toHaveLength(0);
    expect(boy.retainedWords).toHaveLength(0);
    expect(rank(boy.stage)).toBeLessThan(rank('companion'));
  }, 120000);

  it('le garçon grandit à son tour, avec ses propres mots, sans toucher à la phase de sa sœur', () => {
    let state = withTwoBabies(speciesId);
    const boy: ActorRef = { speciesId, kind: 'baby', babyId: 'boy1' };
    for (let i = 0; i < 40; i++) state = playOnce(state, speciesId, places[i % places.length]!, boy, 5000 + i);
    const [g, b] = ['girl1', 'boy1'].map((id) => getFamily(state, speciesId).babies.find((x) => x.id === id)!);
    expect(rank(b!.stage)).toBeGreaterThanOrEqual(rank('little'));
    expect(Object.keys(b!.taughtWords).length).toBeGreaterThan(0);
    expect(Object.keys(g!.taughtWords)).toHaveLength(0);
    expect(rank(g!.stage)).toBeLessThanOrEqual(rank(b!.stage));
  }, 120000);
});
