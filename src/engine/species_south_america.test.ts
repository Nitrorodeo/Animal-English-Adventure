/**
 * Amérique du Sud (2026-11-22) : chaque espèce a son jeu à elle et son vocabulaire à elle
 * (jaguar : spots, paw prints, quiet paws, sharp eyes, in the dark ; toucan : a big beak, colourful,
 * toss and catch, a hole in a tree, wings ; paresseux : very slow, long claws, hang upside down,
 * leaves, sleep a lot), et chaque décor d'Amérique du Sud a au moins deux mots qu'aucun autre décor n'a.
 * Le jaguar ne chasse jamais : aucune proie, aucune viande montrée.
 */
import { describe, expect, it } from 'vitest';
import { getArchetype } from '../content/archetypes';
import { photoSubjects } from '../content/activities/africa';
import { inWater } from '../content/places/depth';
import { NOUNS, PLACES } from '../content/places';
import { getSpecies, SPECIES } from '../content/species';
import type { ActivityCtx, ActorRole, GrowthStage, QuestScript, Tier } from '../content/types';
import { getBiome } from '../content/world';
import { itemInfo } from '../content/items';
import { stepUtterances } from './dialogue';
import { createBaby } from './family';
import { buildQuest, selectActivities, type QuestContext } from './quests';
import { createRng } from './rng';
import { scriptItems } from './skills';
import { actorId, getFamily, newGameState, withFamily, type ActorRef, type GameState } from './state';
import { activityVariants, STRUCTURAL_CONFIGS } from './variants';

const SA_PLACES = Object.values(PLACES).filter((p) => p.continentId === 'south_america').map((p) => p.id);
const TIERS: readonly Tier[] = ['beginner', 'intermediate', 'expert'];

/** Jeu de chaque espèce, et les mots propres qu'on doit entendre (débutant, puis en plus à l'expert). */
const GAMES = [
  { id: 'jaguar_quiet_paws', species: 'jaguar', words: ['spots', 'paw prints', 'quiet paws', 'sharp eyes', 'in the dark'], expert: ['how do jaguars walk', 'can a jaguar swim', "can't fly"] },
  { id: 'toucan_big_beak', species: 'toucan', words: ['big beak', 'colourful', 'toss', 'catch it in my beak', 'hole in a tree', 'wings', 'berries', 'bananas'], expert: ['toss and catch', "can't swim"] },
  { id: 'sloth_slow_slow', species: 'sloth', words: ['very slow', 'long claws', 'upside down', 'hang', 'leaves'], expert: ['sleep a lot', 'can a sloth swim', "can't run"] },
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

describe('jeux propres aux espèces d’Amérique du Sud', () => {
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
              for (const id of scriptItems(q!.script)) expect(itemInfo(id), `${g.id} : expression ${id}`).toBeDefined();
            }
          }
        }
      }
    }
  });

  it('les 3 niveaux diffèrent : plus d’étapes à chaque niveau', () => {
    for (const g of GAMES) {
      const arch = getArchetype(g.id);
      for (const role of arch.roles ?? []) {
        for (const p of getSpecies(g.species).allowedBiomes) {
          const len = (t: Tier) => buildQuest(arch, ctx(family(g.species, 2, 'little', t), g.species, p, actorOf(g.species, role)))!.script.steps.length;
          expect(len('intermediate'), `${g.id}@${p} ${role}`).toBeGreaterThan(len('beginner'));
          expect(len('expert'), `${g.id}@${p} ${role}`).toBeGreaterThan(len('intermediate'));
        }
      }
    }
  });

  it('chaque jeu est réservé à son espèce (jamais proposé à une autre espèce du même décor)', () => {
    for (const g of GAMES) {
      const arch = getArchetype(g.id);
      for (const p of SA_PLACES) {
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
          // ni dans la mer de la côte, ni dans une zone d'eau du décor (lac, ruisseau)
          const wet = place.anchors.filter((a) => a.tags?.includes('water') || a.tags?.includes('sea')).map((a) => a.hit);
          expect(wet.some((h) => spot.x >= h.x && spot.x <= h.x + h.w && spot.y >= h.y && spot.y <= h.y + h.h), `${v.script.id} ${x.id} (zone d'eau)`).toBe(false);
        }
      }
    }
    expect(n).toBeGreaterThan(0);
  });

  it('les mots propres de l’animal sont entendus dans le script', () => {
    for (const g of GAMES) {
      const arch = getArchetype(g.id);
      for (const p of getSpecies(g.species).allowedBiomes) {
        for (const role of arch.roles ?? []) {
          const beginner = heard(buildQuest(arch, ctx(family(g.species, 1, 'little', 'beginner'), g.species, p, actorOf(g.species, role)))!.script);
          const expert = heard(buildQuest(arch, ctx(family(g.species, 1, 'little', 'expert'), g.species, p, actorOf(g.species, role)))!.script);
          for (const w of g.words) expect(beginner, `${g.id}@${p} ${role} débutant : ${w}`).toContain(w);
          for (const w of [...g.words, ...g.expert]) expect(expert, `${g.id}@${p} ${role} expert : ${w}`).toContain(w);
        }
      }
    }
  });

  it('la nourriture montrée est celle de l’espèce, et le jaguar ne chasse jamais', () => {
    for (const p of getSpecies('toucan').allowedBiomes) {
      const q = buildQuest(getArchetype('toucan_big_beak'), ctx(family('toucan', 0, 'little', 'expert'), 'toucan', p, actorOf('toucan', 'father')))!;
      const text = heard(q.script);
      expect(text).toContain("i don't eat fish");
      expect(text).toContain("i don't eat meat");
      const shown = q.script.steps.flatMap((s) => (s.kind === 'props' ? s.show.map((x) => x.prop) : []));
      expect(shown.filter((x) => (getSpecies('toucan').foods as readonly string[]).includes(x)).length).toBeGreaterThan(0);
    }
    for (const p of getSpecies('sloth').allowedBiomes) {
      const text = heard(buildQuest(getArchetype('sloth_slow_slow'), ctx(family('sloth', 0, 'little', 'expert'), 'sloth', p, actorOf('sloth', 'mother')))!.script);
      expect(text).toContain("i don't eat fish");
      expect(text).not.toContain('i eat fish');
    }
    for (const p of getSpecies('jaguar').allowedBiomes) {
      for (const role of ['father', 'mother', 'baby'] as const) {
        const q = buildQuest(getArchetype('jaguar_quiet_paws'), ctx(family('jaguar', 1, 'little', 'expert'), 'jaguar', p, actorOf('jaguar', role)))!;
        const text = heard(q.script);
        for (const w of ['hunt', 'prey', 'catch', 'meat', 'chase', 'bite']) expect(text, `${p} ${role} : ${w}`).not.toContain(w);
        const shown = q.script.steps.flatMap((s) => (s.kind === 'props' ? s.show.map((x) => x.prop) : []));
        expect(shown, `${p} ${role}`).not.toContain('meat');
        expect(shown.some((x) => ['bird', 'rabbit', 'deer', 'zebra', 'fish', 'frog', 'duck'].includes(x)), `${p} ${role}`).toBe(false);
      }
    }
    // capacités montrées réelles : le jaguar nage et grimpe, le toucan vole sans nager, le paresseux nage sans courir
    expect(getSpecies('jaguar').can).toEqual(expect.arrayContaining(['swim', 'climb']));
    expect(getSpecies('toucan').can).toContain('fly');
    expect(getSpecies('toucan').can).not.toContain('swim');
    expect(getSpecies('sloth').can).toContain('swim');
    expect(getSpecies('sloth').can).not.toContain('run');
  });

  it('la carte « Swim! » du jaguar n’apparaît que là où il y a de l’eau dessinée', () => {
    const arch = getArchetype('jaguar_quiet_paws');
    const cards = (p: string) =>
      buildQuest(arch, ctx(family('jaguar', 0, 'little', 'intermediate'), 'jaguar', p, actorOf('jaguar', 'father')))!
        .script.steps.flatMap((s) => (s.kind === 'command' ? s.options.map((o) => o.line.en) : []));
    expect(cards('sa_andes')).not.toContain('Swim!');
    expect(cards('sa_river')).toContain('Swim!');
  });
});

describe('vocabulaire propre à chaque décor d’Amérique du Sud', () => {
  it('chaque décor d’Amérique du Sud a au moins 2 mots qu’aucun autre décor du jeu n’a', () => {
    const where = new Map<string, Set<string>>();
    for (const p of Object.values(PLACES)) for (const a of p.anchors) where.set(a.word, (where.get(a.word) ?? new Set()).add(p.id));
    for (const id of SA_PLACES) {
      const own = [...new Set(PLACES[id]!.anchors.map((a) => a.word))].filter((w) => where.get(w)!.size === 1);
      expect(own.length, `${id} : ${own.join(', ')}`).toBeGreaterThanOrEqual(2);
    }
    expect(SA_PLACES.length).toBe(11);
  });

  it('les nouveaux mots des décors se nomment, ont leur question, et se photographient', () => {
    const expected: Record<string, { words: string[]; photo: string }> = {
      sa_jungle: { words: ['clearing', 'bird of paradise'], photo: 'bird_of_paradise' },
      sa_waterfall: { words: ['spray', 'pool'], photo: 'pool' },
      sa_river: { words: ['staircase', 'stepping stone'], photo: 'staircase' },
      sa_andes: { words: ['terrace', 'carving'], photo: 'terrace' },
      sa_wetland: { words: ['sunlight', 'liana'], photo: 'liana' },
      sa_canopy_branch: { words: ['blossom', 'rainforest'], photo: 'blossom' },
      sa_canopy_treehouse: { words: ['platform'], photo: 'platform' },
      sa_canopy_sunrise: { words: ['mango'], photo: 'mango' },
      sa_sloth_canopy: { words: ['bromeliad', 'heliconia'], photo: 'bromeliad' },
      sa_sloth_roots: { words: ['ground', 'riverbank'], photo: 'ground' },
      sa_sloth_refuge: { words: ['hollow', 'bed'], photo: 'hollow' },
    };
    for (const [id, x] of Object.entries(expected)) {
      for (const w of x.words) {
        const a = PLACES[id]!.anchors.find((y) => y.word === w);
        expect(a, `${id} : ${w}`).toBeDefined();
        expect(a!.check, `${id} : ${w}`).toBeDefined();
        expect(a!.crop, `${id} : ${w}`).toBeDefined();
        expect(NOUNS[w], `${id} : ${w}`).toBeDefined();
      }
      const sp = SPECIES.find((s) => s.allowedBiomes.includes(id)) ?? SPECIES[0]!;
      const c = { species: sp, place: getBiome(id) } as unknown as ActivityCtx;
      expect(photoSubjects(c), id).toContain(x.photo);
    }
  });
});
