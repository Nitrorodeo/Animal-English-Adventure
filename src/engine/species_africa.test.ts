/**
 * Afrique (2026-11-21) : chaque espèce a son jeu à elle et son vocabulaire à elle
 * (lion : la crinière ; éléphant : la trompe ; girafe : le long cou), et chaque décor
 * d'Afrique a au moins deux mots qu'aucun autre décor du jeu n'a.
 */
import { describe, expect, it } from 'vitest';
import { getArchetype } from '../content/archetypes';
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

const AFRICA_PLACES = Object.values(PLACES).filter((p) => p.continentId === 'africa').map((p) => p.id);
const TIERS: readonly Tier[] = ['beginner', 'intermediate', 'expert'];

/** Jeu de chaque espèce, et les mots propres qu'on doit entendre (débutant, puis en plus à l'expert). */
const GAMES = [
  { id: 'lion_mane', species: 'lion', words: ['mane', 'paw', 'nap', 'roar'], expert: ['cub', 'pride'] },
  { id: 'elephant_trunk', species: 'elephant', words: ['trunk', 'leaves', 'tusks', 'ears', 'trumpet'], expert: ['herd'] },
  { id: 'giraffe_neck', species: 'giraffe', words: ['neck', 'up high', 'leaves', 'spots'], expert: ['tongue', 'tallest'] },
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

describe('jeux propres aux espèces d’Afrique', () => {
  it('chaque jeu se construit aux 3 niveaux, dans chaque décor de l’espèce, pour chaque rôle prévu', () => {
    for (const g of GAMES) {
      const arch = getArchetype(g.id);
      expect(arch.speciesIds, g.id).toEqual([g.species]);
      expect(arch.allowedBiomes, g.id).toEqual([]);
      for (const p of getSpecies(g.species).allowedBiomes) {
        for (const role of arch.roles ?? []) {
          for (const tier of TIERS) {
            const configs = role === 'baby' ? ([1, 2] as const) : ([0, 1, 2] as const);
            for (const n of configs) {
              const q = buildQuest(arch, ctx(family(g.species, n, 'little', tier), g.species, p, actorOf(g.species, role)));
              expect(q, `${g.id}@${p} ${role} ${tier} ${n} bébé(s)`).toBeDefined();
              expect(q!.script.tier, `${g.id}@${p} ${role} ${tier}`).toBe(tier);
            }
          }
        }
      }
    }
  });

  it('les 3 niveaux diffèrent : l’expert a plus d’étapes que le débutant', () => {
    for (const g of GAMES) {
      const arch = getArchetype(g.id);
      const role = arch.roles![0]!;
      for (const p of getSpecies(g.species).allowedBiomes) {
        const len = (t: Tier) => buildQuest(arch, ctx(family(g.species, 2, 'little', t), g.species, p, actorOf(g.species, role)))!.script.steps.length;
        expect(len('intermediate'), `${g.id}@${p}`).toBeGreaterThan(len('beginner'));
        expect(len('expert'), `${g.id}@${p}`).toBeGreaterThan(len('intermediate'));
      }
    }
  });

  it('chaque jeu est réservé à son espèce (jamais proposé à une autre espèce du même décor)', () => {
    for (const g of GAMES) {
      const arch = getArchetype(g.id);
      for (const p of AFRICA_PLACES) {
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
      const arch = getArchetype(g.id);
      for (const p of getSpecies(g.species).allowedBiomes) {
        const role = arch.roles![0]!;
        const beginner = heard(buildQuest(arch, ctx(family(g.species, 1, 'little', 'beginner'), g.species, p, actorOf(g.species, role)))!.script);
        const expert = heard(buildQuest(arch, ctx(family(g.species, 1, 'little', 'expert'), g.species, p, actorOf(g.species, role)))!.script);
        for (const w of g.words) expect(beginner, `${g.id}@${p} débutant : ${w}`).toContain(w);
        for (const w of [...g.words, ...g.expert]) expect(expert, `${g.id}@${p} expert : ${w}`).toContain(w);
      }
    }
  });

  it('l’éléphant arrose dans un décor avec de l’eau, et se roule dans la poussière ailleurs', () => {
    const arch = getArchetype('elephant_trunk');
    const text = (p: string) => heard(buildQuest(arch, ctx(family('elephant', 0, 'little', 'beginner'), 'elephant', p, actorOf('elephant', 'mother')))!.script);
    expect(text('africa_waterhole')).toContain('spray water');
    expect(text('africa_desert')).toContain('dust');
    expect(text('africa_desert')).not.toContain('spray water');
  });
});

describe('vocabulaire propre à chaque décor d’Afrique', () => {
  it('chaque décor d’Afrique a au moins 2 mots qu’aucun autre décor du jeu n’a', () => {
    const where = new Map<string, Set<string>>();
    for (const p of Object.values(PLACES)) for (const a of p.anchors) where.set(a.word, (where.get(a.word) ?? new Set()).add(p.id));
    for (const id of AFRICA_PLACES) {
      const own = [...new Set(PLACES[id]!.anchors.map((a) => a.word))].filter((w) => where.get(w)!.size === 1);
      expect(own.length, `${id} : ${own.join(', ')}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('les nouveaux mots des décors se nomment et se photographient', () => {
    const expected: Record<string, string[]> = {
      savanna: ['acacia'],
      africa_waterhole: ['lily pad'],
      africa_baobab: ['hibiscus', 'red dirt'],
      africa_desert: ['sand dune', 'crack'],
      africa_canyon: ['valley', 'red boulder'],
      africa_plains: ['tall grass'],
    };
    for (const [id, words] of Object.entries(expected)) {
      for (const w of words) {
        const a = PLACES[id]!.anchors.find((x) => x.word === w);
        expect(a, `${id} : ${w}`).toBeDefined();
        expect(a!.check, `${id} : ${w}`).toBeDefined();
        expect(NOUNS[w], `${id} : ${w}`).toBeDefined();
      }
    }
  });
});
