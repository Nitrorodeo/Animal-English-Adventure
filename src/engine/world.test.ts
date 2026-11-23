/**
 * Les six autres continents (2026-11-21) : chaque décor a un jeu à lui comme en Afrique, la photo
 * a partout des sujets propres au décor, les révisions (1.8, 2.8, 3.8) existent, l'énigme se
 * résout, et aucun objet n'est posé au milieu de l'eau dessinée.
 */
import { describe, expect, it } from 'vitest';
import { getArchetype, ARCHETYPES } from '../content/archetypes';
import { frDefinite, ON_WATER, WORLD_ACTIVITIES } from '../content/activities/world';
import { photoSubjects } from '../content/activities/africa';
import { inWater } from '../content/places/depth';
import { PLACES } from '../content/places';
import { getSpecies, SPECIES } from '../content/species';
import type { GrowthStage } from '../content/types';
import { getBiome } from '../content/world';
import { createBaby } from './family';
import { buildQuest, rankActivity, type QuestContext } from './quests';
import { createRng } from './rng';
import { getFamily, newGameState, withFamily, type ActorRef, type GameState } from './state';
import { activityVariants, STRUCTURAL_CONFIGS } from './variants';

function withBaby(speciesId: string, stage: GrowthStage): GameState {
  const r = createBaby(getFamily(newGameState(), speciesId), 'girl', 'Mia', 'b1');
  if (!r.ok) throw new Error(r.error);
  return withFamily(newGameState(), { ...r.family, babies: r.family.babies.map((b) => ({ ...b, stage })) });
}
const ctx = (state: GameState, speciesId: string, placeId: string, actor: ActorRef): QuestContext => ({ state, species: getSpecies(speciesId), biome: getBiome(placeId), actor, rng: createRng(5) });
const father = (speciesId: string): ActorRef => ({ speciesId, kind: 'adult', role: 'father' });
const mother = (speciesId: string): ActorRef => ({ speciesId, kind: 'adult', role: 'mother' });
const baby = (speciesId: string): ActorRef => ({ speciesId, kind: 'baby', babyId: 'b1' });
const offered = (state: GameState, sp: string, p: string, a: ActorRef) => new Set(ARCHETYPES.filter((x) => buildQuest(x, ctx(state, sp, p, a))).map((x) => x.id));
const everyone = (sp: string, p: string) => {
  const st = withBaby(sp, 'companion');
  return new Set([...offered(st, sp, p, father(sp)), ...offered(st, sp, p, mother(sp)), ...offered(st, sp, p, baby(sp))]);
};

const OTHERS = SPECIES.filter((s) => s.continentId !== 'africa');

describe('les autres continents', () => {
  it('chaque décor a au moins un jeu qu’on ne trouve que là ou presque (pour chaque espèce qui y vit)', () => {
    for (const sp of OTHERS) {
      const continent = Object.values(PLACES).filter((p) => p.continentId === sp.continentId).map((p) => p.id);
      for (const p of sp.allowedBiomes) {
        const here = (id: string) => getArchetype(id).allowedBiomes.filter((b) => continent.includes(b)).length;
        const local = [...everyone(sp.id, p)].filter((id) => here(id) > 0 && here(id) < continent.length);
        expect(local.length, `${sp.id}@${p}`).toBeGreaterThan(0);
      }
    }
  });

  it('la photo a au moins deux sujets propres au décor partout où vit une espèce', () => {
    for (const sp of SPECIES) for (const p of sp.allowedBiomes) {
      const c = { species: sp, place: getBiome(p) } as Parameters<typeof photoSubjects>[0];
      expect(photoSubjects(c).length, `${sp.id}@${p}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('les jeux signatures vont aux bons décors', () => {
    expect(everyone('beaver', 'na_beaver_falls').has('maple_leaves'), 'maple_leaves@na_beaver_falls').toBe(true);
    expect(everyone('tiger', 'asia_pagoda').has('lanterns'), 'lanterns@asia_pagoda').toBe(true);
    expect(everyone('koala', 'oc_beach').has('beach_shells') || everyone('kangaroo', 'oc_beach').has('beach_shells')).toBe(true);
    expect(everyone('polar_bear', 'an_snowfield').has('snowflakes'), 'snowflakes@an_snowfield').toBe(true);
    expect(everyone('polar_bear', 'an_snowfield').has('follow_tracks'), 'follow_tracks@an_snowfield').toBe(true);
    expect(everyone('polar_bear', 'an_ice_cave').has('echo_canyon'), 'echo_canyon@an_ice_cave').toBe(true);
    // jamais de lanternes en Antarctique, ni de flocons dans la savane
    expect(everyone('polar_bear', 'an_snowfield').has('lanterns'), 'lanterns@an_snowfield').toBe(false);
    expect(everyone('lion', 'africa_baobab').has('snowflakes'), 'snowflakes@africa_baobab').toBe(false);
  });

  it('les révisions 1.8, 2.8 et 3.8 existent et s’ouvrent en grandissant', () => {
    for (const skill of ['1.8', '2.8', '3.8']) expect(ARCHETYPES.some((a) => a.implemented && a.skillIds.includes(skill)), skill).toBe(true);
    const young = withBaby('lion', 'young');
    const comp = withBaby('lion', 'companion');
    expect(offered(young, 'lion', 'africa_baobab', mother('lion')).has('quiz_beginner')).toBe(true);
    expect(offered(young, 'lion', 'africa_baobab', father('lion')).has('solve_mystery')).toBe(true);
    expect(offered(young, 'lion', 'africa_baobab', baby('lion')).has('quiz_intermediate')).toBe(false);
    expect(offered(comp, 'lion', 'africa_baobab', father('lion')).has('quiz_intermediate')).toBe(true);
  });

  it('une révision ne passe pas devant les jeux du lieu tant qu’on a peu joué', () => {
    const st = withBaby('lion', 'young');
    const c = ctx(st, 'lion', 'africa_baobab', mother('lion'));
    const q = buildQuest(getArchetype('quiz_beginner'), c)!;
    const played = { ...st, player: { ...st.player, history: Array.from({ length: 6 }, (_, i) => ({ ...(st.player.history[0] ?? {}), archetypeId: `x${i}`, actorId: 'none', mechanic: 'count', speciesId: 'lion' })) } } as GameState;
    expect(rankActivity(q, { ...c, rng: createRng(1) })).toBeLessThan(rankActivity(q, { ...c, state: played, rng: createRng(1) }));
  });

  it('l’énigme : la bonne réponse est l’animal décrit, et il est dans les choix', () => {
    const q = buildQuest(getArchetype('solve_mystery'), ctx(withBaby('giraffe', 'young'), 'giraffe', 'africa_waterhole', father('giraffe')))!;
    const asks = q.script.steps.filter((s) => s.kind === 'ask' || s.kind === 'tapProps');
    expect(asks.length).toBeGreaterThan(0);
    // sans eau dessinée : un lapin au lieu du canard et de la grenouille ; sur la banquise sans eau, pas d'énigme (le poisson n'est pas posé sur la glace)
    const dry = buildQuest(getArchetype('solve_mystery'), ctx(withBaby('lion', 'young'), 'lion', 'africa_desert', father('lion')))!;
    expect(JSON.stringify(dry.script.steps)).toMatch(/"prop":"rabbit"/);
    expect(buildQuest(getArchetype('solve_mystery'), ctx(withBaby('penguin', 'young'), 'penguin', 'an_snowfield', father('penguin')))).toBeFalsy();
  });

  it('aucun objet des nouveaux jeux n’est posé dans l’eau dessinée', () => {
    const ids = new Set([...WORLD_ACTIVITIES.map((a) => a.id), 'follow_tracks']);
    let n = 0;
    for (const v of activityVariants(STRUCTURAL_CONFIGS)) {
      if (!ids.has(v.script.archetypeId)) continue;
      const place = PLACES[v.script.biomeId]!;
      for (const s of v.script.steps) if (s.kind === 'props') for (const p of s.show) {
        if (p.sky) continue;
        if (ON_WATER.has(p.prop)) {
          expect(inWater(place.water, place.spots[p.spot]!.x, place.spots[p.spot]!.y), `${v.script.id}: ${p.prop} hors de l'eau`).toBe(true);
          continue;
        }
        const spot = place.spots[p.spot]!;
        expect(spot, `${v.script.id}: ${p.id}`).toBeTruthy();
        expect(inWater(place.water, spot.x, spot.y), `${v.script.id}: ${p.id} dans l'eau`).toBe(false);
        n++;
      }
    }
    expect(n).toBeGreaterThan(50);
  });

  // défauts relevés à la relecture du 2026-11-21
  let cache: ReturnType<typeof activityVariants> extends Iterable<infer V> ? V[] : never;
  const scripts = () => (cache ??= [...activityVariants(STRUCTURAL_CONFIGS)]).map((v) => v.script);
  const text = (sc: { steps: unknown[] }) => JSON.stringify(sc.steps);

  it('relecture : pas de fleurs dans la neige, pas de canard ni de grenouille au désert, pas de zèbre sur la banquise', () => {
    let quizzes = 0;
    for (const sc of scripts()) {
      const place = PLACES[sc.biomeId]!;
      if (sc.archetypeId === 'quiz_beginner' && place.continentId === 'antarctica') {
        quizzes++;
        expect(text(sc), sc.id).not.toMatch(/"flower"|flowers/);
        expect(text(sc), sc.id).toMatch(/snowflakes/);
      }
      if (sc.archetypeId === 'solve_mystery' && !(place.water ?? []).length) expect(text(sc), sc.id).not.toMatch(/"prop":"(duck|frog|fish)"/);
      if (sc.archetypeId === 'follow_tracks' && place.continentId === 'antarctica') expect(text(sc), sc.id).not.toMatch(/zebra|frog|duck/);
    }
    expect(quizzes).toBeGreaterThan(0);
  });

  it('relecture : la météo n’a jamais deux bonnes réponses, et « Yes! I can’t » n’existe plus', () => {
    for (const sc of scripts()) {
      const t = text(sc);
      expect(t, sc.id).not.toMatch(/Yes! I can't/);
      if (!['quiz_beginner'].includes(sc.archetypeId)) continue;
      const place = PLACES[sc.biomeId]!;
      if (place.weather !== 'sunny' && place.weather !== 'hot') expect(t, `${sc.id} (${place.weather})`).not.toMatch(/"en":"It's sunny!"/);
    }
  });

  it('relecture : un animal qui ne nage pas ne fait pas « Splash! »', () => {
    let n = 0;
    for (const sc of scripts()) {
      if (sc.archetypeId !== 'who_in_water') continue;
      const sp = getSpecies(sc.speciesId);
      if (sp.can.includes('swim')) continue;
      n++;
      expect(text(sc), sc.id).not.toMatch(/Splash! I love the water/);
    }
    expect(n).toBeGreaterThan(0);
  });

  it('relecture : « J’aime l’herbe », pas « J’aime de l’herbe »', () => {
    expect(frDefinite("de l'herbe")).toBe("l'herbe");
    expect(frDefinite('du bambou')).toBe('le bambou');
    expect(frDefinite('de la viande')).toBe('la viande');
    expect(frDefinite('des feuilles')).toBe('les feuilles');
  });
});
