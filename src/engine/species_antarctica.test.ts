/**
 * Antarctique (2026-11-21) : chaque espèce a son jeu à elle et son vocabulaire à elle
 * (manchot : se dandiner et glisser ; phoque : les moustaches ; ours polaire : la fourrure blanche),
 * et chaque décor d'Antarctique a au moins deux mots qu'aucun autre décor du jeu n'a.
 */
import { describe, expect, it } from 'vitest';
import { getArchetype } from '../content/archetypes';
import { photoSubjects } from '../content/activities/africa';
import { anchor, landSpots } from '../content/activities/kit';
import { inWater } from '../content/places/depth';
import { NOUNS, PLACES } from '../content/places';
import { getSpecies, SPECIES } from '../content/species';
import type { ActorRole, GrowthStage, QuestScript, Tier } from '../content/types';
import { getBiome } from '../content/world';
import { stepUtterances } from './dialogue';
import { createBaby } from './family';
import { buildQuest, selectActivities, type QuestContext } from './quests';
import { createRng } from './rng';
import { actorId, getFamily, newGameState, withFamily, type ActorRef, type GameState } from './state';
import { activityVariants, STRUCTURAL_CONFIGS } from './variants';

const AN_PLACES = Object.values(PLACES).filter((p) => p.continentId === 'antarctica').map((p) => p.id);
const TIERS: readonly Tier[] = ['beginner', 'intermediate', 'expert'];

/** Jeu de chaque espèce, et les mots propres qu'on doit entendre (débutant, puis en plus à l'expert). */
const GAMES = [
  { id: 'penguin_waddle', species: 'penguin', words: ['waddle', 'flippers', 'slide', 'belly'], expert: ['chick', 'huddle'] },
  { id: 'seal_whiskers', species: 'seal', words: ['whiskers', 'dive', 'clap', 'fish'], expert: ['pup'] },
  { id: 'polar_bear_fur', species: 'polar_bear', words: ['white', 'fur', 'black', 'nose', 'roll in the snow', 'paddle'], expert: ['cub'] },
] as const;

function family(speciesId: string, babies: 0 | 1 | 2, stage: GrowthStage = 'little', tier: Tier | 'auto' = 'auto'): GameState {
  const base = newGameState();
  let fam = getFamily(base, speciesId);
  for (const [i, sex] of (['girl', 'boy'] as const).slice(0, babies).entries()) {
    const r = createBaby(fam, sex, i === 0 ? 'Bebe' : 'Bambin', `b${i + 1}`);
    if (!r.ok) throw new Error(r.error);
    fam = r.family;
  }
  const st = withFamily(base, { ...fam, babies: fam.babies.map((b) => ({ ...b, stage })) });
  return { ...st, settings: { ...st.settings, levelOverride: tier } };
}

const actorOf = (speciesId: string, role: ActorRole): ActorRef => (role === 'baby' ? { speciesId, kind: 'baby', babyId: 'b1' } : { speciesId, kind: 'adult', role });
const ctx = (state: GameState, speciesId: string, placeId: string, actor: ActorRef, seed = 5): QuestContext => ({ state, species: getSpecies(speciesId), biome: getBiome(placeId), actor, rng: createRng(seed) });

/** Tout ce que l'on entend dans un script (phrases, réponses, cartes, réponses des cartes). */
const heard = (s: QuestScript) => s.steps.flatMap((st) => stepUtterances(st).map((u) => u.line.en)).join(' ').toLowerCase();
const build = (g: (typeof GAMES)[number], p: string, tier: Tier, role: ActorRole = 'father', babies: 0 | 1 | 2 = 1) =>
  buildQuest(getArchetype(g.id), ctx(family(g.species, babies, 'little', tier), g.species, p, actorOf(g.species, role)));

describe('jeux propres aux espèces de l’Antarctique', () => {
  it('chaque jeu se construit aux 3 niveaux, dans chaque décor de l’espèce, pour chaque rôle prévu', () => {
    for (const g of GAMES) {
      const arch = getArchetype(g.id);
      expect(arch.speciesIds, g.id).toEqual([g.species]);
      expect(arch.allowedBiomes, g.id).toEqual(getSpecies(g.species).allowedBiomes); // 2026-11-23 : le jeu est propre aux 3 décors de sa famille
      expect(arch.roles?.length, g.id).toBeGreaterThan(0);
      for (const p of getSpecies(g.species).allowedBiomes) {
        for (const role of arch.roles ?? []) {
          for (const tier of TIERS) {
            const configs = role === 'baby' ? ([1, 2] as const) : ([0, 1, 2] as const);
            for (const n of configs) {
              const q = build(g, p, tier, role, n);
              expect(q, `${g.id}@${p} ${role} ${tier} ${n} bébé(s)`).toBeDefined();
              expect(q!.script.tier, `${g.id}@${p} ${role} ${tier}`).toBe(tier);
            }
          }
        }
      }
    }
  });

  it('les 3 niveaux diffèrent : l’expert a plus d’étapes que l’intermédiaire, qui en a plus que le débutant', () => {
    for (const g of GAMES) {
      for (const p of getSpecies(g.species).allowedBiomes) {
        for (const role of getArchetype(g.id).roles ?? []) {
          const len = (t: Tier) => build(g, p, t, role, 2)!.script.steps.length;
          expect(len('intermediate'), `${g.id}@${p} ${role}`).toBeGreaterThan(len('beginner'));
          expect(len('expert'), `${g.id}@${p} ${role}`).toBeGreaterThan(len('intermediate'));
        }
      }
    }
  });

  it('chaque jeu est réservé à son espèce (jamais proposé à une autre espèce du même décor)', () => {
    for (const g of GAMES) {
      const arch = getArchetype(g.id);
      for (const p of AN_PLACES) {
        for (const sp of SPECIES.filter((s) => s.id !== g.species && s.allowedBiomes.includes(p))) {
          for (const role of ['father', 'mother', 'baby'] as const) {
            expect(buildQuest(arch, ctx(family(sp.id, 2, 'companion'), sp.id, p, actorOf(sp.id, role))), `${g.id} → ${sp.id}@${p} ${role}`).toBeUndefined();
          }
        }
      }
    }
  });

  it('le jeu sort souvent dans le menu d’une famille neuve déjà saluée (≥ 25 tirages sur 40), dans chaque décor', () => {
    for (const g of GAMES) {
      const arch = getArchetype(g.id);
      for (const p of getSpecies(g.species).allowedBiomes) {
        let best = 0;
        for (const role of (arch.roles ?? []).filter((r) => r !== 'baby')) {
          const actor = actorOf(g.species, role);
          const base = family(g.species, 0);
          const st: GameState = { ...base, player: { ...base.player, history: [{ archetypeId: 'greeting', speciesId: g.species, actorId: actorId(actor), mechanic: 'talk', at: 0 }] } };
          let hits = 0;
          for (let seed = 0; seed < 40; seed++) if (selectActivities(ctx(st, g.species, p, actor, seed)).some((q) => q.archetype.id === g.id)) hits++;
          best = Math.max(best, hits);
        }
        expect(best, `${g.id}@${p}`).toBeGreaterThanOrEqual(25);
      }
    }
  });

  it('aucun objet posé dans l’eau dessinée du décor', () => {
    const ids = new Set<string>(GAMES.map((g) => g.id));
    let n = 0;
    for (const v of activityVariants(STRUCTURAL_CONFIGS)) {
      if (!ids.has(v.script.archetypeId)) continue;
      n++;
      const place = PLACES[v.script.biomeId]!;
      for (const s of v.script.steps) {
        if (s.kind !== 'props') continue;
        for (const x of s.show) {
          if (x.sky) continue;
          const spot = place.spots[x.spot]!;
          expect(inWater(place.water, spot.x, spot.y), `${v.script.id} ${x.id}`).toBe(false);
        }
      }
    }
    expect(n).toBeGreaterThan(0);
  });

  it('les mots propres de l’animal sont entendus dans le script', () => {
    for (const g of GAMES) {
      for (const p of getSpecies(g.species).allowedBiomes) {
        const beginner = heard(build(g, p, 'beginner')!.script);
        const expert = heard(build(g, p, 'expert')!.script);
        for (const w of g.words) expect(beginner, `${g.id}@${p} débutant : ${w}`).toContain(w);
        for (const w of [...g.words, ...g.expert]) expect(expert, `${g.id}@${p} expert : ${w}`).toContain(w);
        // le phoque ne parle d'un trou dans la glace que là où il y a de la glace et de la neige (pas au rivage ni à la plage)
        if (g.id === 'seal_whiskers') {
          if (anchor(PLACES[p]!, 'snow')) expect(expert, `${p} : breathing hole`).toContain('breathing hole');
          else expect(expert, `${p} : pas de trou dans la glace`).not.toMatch(/breathing hole|snow|ice/);
        }
      }
    }
  });

  it('le manchot fait son nid de cailloux là où il y a du sol, jamais sur la mer ouverte', () => {
    const g = GAMES[0];
    for (const p of getSpecies('penguin').allowedBiomes) {
      const text = heard(build(g, p, 'intermediate')!.script);
      if (landSpots(PLACES[p]!).length >= 5) expect(text, p).toContain('pebbles');
      else expect(text, p).not.toContain('pebbles');
    }
    expect(heard(build(g, 'an_penguin_cave', 'expert')!.script)).toContain('egg');
  });

  it('l’ours polaire compte ses empreintes sur la neige, et ne pagaie (carte) que près de la mer', () => {
    const g = GAMES[2];
    const cards = (p: string) => build(g, p, 'expert')!.script.steps.flatMap((s) => (s.kind === 'command' ? s.options.map((o) => o.line.en) : []));
    expect(cards('ice_coast')).toContain('Paddle!');
    expect(cards('an_ice_cave')).not.toContain('Paddle!');
    expect(heard(build(g, 'an_snowfield', 'beginner')!.script)).toContain('footprints');
    // aucune prédation, aucune capacité inventée
    for (const p of getSpecies('polar_bear').allowedBiomes) {
      const t = heard(build(g, p, 'expert')!.script);
      expect(t).not.toMatch(/\bseals?\b(?! pup)/);
      expect(t).not.toContain('dig');
    }
  });
});

describe('vocabulaire propre à chaque décor de l’Antarctique', () => {
  it('chaque décor de l’Antarctique a au moins 2 mots qu’aucun autre décor du jeu n’a', () => {
    const where = new Map<string, Set<string>>();
    for (const p of Object.values(PLACES)) for (const a of p.anchors) where.set(a.word, (where.get(a.word) ?? new Set()).add(p.id));
    for (const id of AN_PLACES) {
      const own = [...new Set(PLACES[id]!.anchors.map((a) => a.word))].filter((w) => where.get(w)!.size === 1);
      expect(own.length, `${id} : ${own.join(', ')}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('les nouveaux mots des décors se nomment, se vérifient et se photographient', () => {
    const expected: Record<string, string[]> = {
      ice_coast: ['ice floe', 'ice shelf'],
      open_sea: ['ice block', 'ice ledge'],
      an_snowfield: ['glacier', 'snowdrift'],
      an_aurora: ['aurora', 'ice crack'],
      an_seal_aurora: ['ice cliff', 'northern lights'],
      an_seal_rocks: ['starfish', 'rock pool'],
      an_seal_sunset: ['sunset', 'flowers'],
      an_penguin_cave: ['ice wall', 'snowy rock'],
    };
    for (const [id, words] of Object.entries(expected)) {
      for (const w of words) {
        const a = PLACES[id]!.anchors.find((x) => x.word === w);
        expect(a, `${id} : ${w}`).toBeDefined();
        expect(a!.check, `${id} : ${w}`).toBeDefined();
        expect(NOUNS[w], `${id} : ${w}`).toBeDefined();
      }
      // la photo du décor peut viser un de ses mots propres
      const c = { species: getSpecies('penguin'), place: getBiome(id) } as Parameters<typeof photoSubjects>[0];
      expect(photoSubjects(c).some((s) => words.includes(PLACES[id]!.anchors.find((x) => x.id === s)!.word)), id).toBe(true);
    }
  });
});
