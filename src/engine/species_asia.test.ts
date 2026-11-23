/**
 * Asie (2026-11-22) : chaque espèce a son jeu à elle et son vocabulaire à elle
 * (panda : black and white, black ears, bamboo, munch, round tummy, roll over ;
 * tigre : stripes, orange fur, roar, hide, love to swim, tiger cub ;
 * panthère des neiges : chuff, fluffy tail, big furry paws, thick fur, leap),
 * et chaque décor d'Asie a au moins deux mots qu'aucun autre décor du jeu n'a.
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

const ASIA_PLACES = Object.values(PLACES).filter((p) => p.continentId === 'asia').map((p) => p.id);
const TIERS: readonly Tier[] = ['beginner', 'intermediate', 'expert'];

/** Jeu de chaque espèce, et les mots propres qu'on doit entendre (débutant, puis en plus à l'expert). */
const GAMES = [
  { id: 'panda_picnic', species: 'giant_panda', words: ['black and white', 'bamboo', 'munch', 'round tummy', 'roll over'], expert: ['black ears', 'can a panda climb'] },
  { id: 'tiger_stripes', species: 'tiger', words: ['stripes', 'orange fur', 'roar', 'hide', 'love to swim'], expert: ['tiger cub', "can't fly"] },
  { id: 'leopard_leap', species: 'snow_leopard', words: ['chuff', 'fluffy tail', 'big furry paws', 'thick fur', 'leap'], expert: ['how many leaps', "can't roar"] },
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
const script = (id: string, sp: string, place: string, role: ActorRole, tier: Tier, babies: 0 | 1 | 2 = 1) => buildQuest(getArchetype(id), ctx(family(sp, babies, 'little', tier), sp, place, actorOf(sp, role)))!.script;

describe('jeux propres aux espèces d’Asie', () => {
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
          const len = (t: Tier) => script(g.id, g.species, p, role, t, 2).steps.length;
          expect(len('intermediate'), `${g.id}@${p} ${role}`).toBeGreaterThan(len('beginner'));
          expect(len('expert'), `${g.id}@${p} ${role}`).toBeGreaterThan(len('intermediate'));
        }
      }
    }
  });

  it('chaque jeu est réservé à son espèce (jamais proposé à une autre espèce du même décor)', () => {
    for (const g of GAMES) {
      const arch = getArchetype(g.id);
      for (const p of ASIA_PLACES) {
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
      const place = PLACES[v.script.biomeId]!;
      const wet = place.anchors.filter((a) => a.tags?.includes('water') || a.tags?.includes('sea')).map((a) => a.hit);
      for (const s of v.script.steps) {
        if (s.kind !== 'props') continue;
        for (const x of s.show) {
          if (x.sky) continue;
          n++;
          const spot = place.spots[x.spot]!;
          expect(inWater(place.water, spot.x, spot.y), `${v.script.id} ${x.id}`).toBe(false);
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
          const beginner = heard(script(g.id, g.species, p, role, 'beginner'));
          const expert = heard(script(g.id, g.species, p, role, 'expert'));
          for (const w of g.words) expect(beginner, `${g.id}@${p} ${role} débutant : ${w}`).toContain(w);
          for (const w of [...g.words, ...g.expert]) expect(expert, `${g.id}@${p} ${role} expert : ${w}`).toContain(w);
        }
      }
    }
  });

  it('le panda mange du bambou (jamais de poisson ni de viande), et les capacités montrées sont réelles', () => {
    for (const p of getSpecies('giant_panda').allowedBiomes) {
      const s = script('panda_picnic', 'giant_panda', p, 'mother', 'expert', 0);
      const text = heard(s);
      expect(text).toContain("i don't eat fish");
      expect(text).toContain("i don't eat meat");
      expect(text).not.toMatch(/\bi eat (fish|meat)/);
      const shown = s.steps.flatMap((x) => (x.kind === 'props' ? x.show.map((y) => y.prop) : []));
      expect(shown).toContain('bamboo');
      for (const t of s.steps) if (t.kind === 'tapProps' && t.items.includes('hungry')) expect(t.targets.every((id) => id.startsWith('panda_bamboo')), p).toBe(true);
    }
    expect(getSpecies('giant_panda').foods).toEqual(['bamboo']);
    expect(getSpecies('giant_panda').can).toContain('climb');
    expect(getSpecies('tiger').can).toEqual(expect.arrayContaining(['swim', 'roar', 'jump', 'run']));
    expect(getSpecies('snow_leopard').can).not.toContain('roar');
    expect(getSpecies('snow_leopard').can).toContain('jump');
  });

  it('les cartes « je ne sais pas » ne jouent aucune animation (le tigre ne vole pas, la panthère ne rugit pas)', () => {
    const cards = (id: string, sp: string, p: string, role: ActorRole) => script(id, sp, p, role, 'expert').steps.flatMap((s) => (s.kind === 'command' ? s.options : []));
    for (const p of getSpecies('tiger').allowedBiomes) expect(cards('tiger_stripes', 'tiger', p, 'father').find((o) => o.line.en === 'Fly!')!.action).toBeUndefined();
    for (const p of getSpecies('snow_leopard').allowedBiomes) {
      const c = cards('leopard_leap', 'snow_leopard', p, 'mother');
      expect(c.find((o) => o.line.en === 'Roar!')!.action).toBeUndefined();
      expect(c.find((o) => o.line.en === 'Leap!')!.action).toBe('jump');
    }
  });

  it('le tigre se baigne seulement là où il y a un bassin, et ne chasse jamais', () => {
    const swims = (p: string) => script('tiger_stripes', 'tiger', p, 'father', 'beginner').steps.some((s) => s.kind === 'act' && s.action === 'swim');
    expect(swims('asia_jungle_falls')).toBe(true);
    expect(swims('asia_mountain')).toBe(false);
    for (const p of getSpecies('tiger').allowedBiomes) {
      const text = heard(script('tiger_stripes', 'tiger', p, 'father', 'expert'));
      expect(text).not.toMatch(/\b(hunt|prey|catch|chase|kill)/);
    }
  });

  it('la panthère des neiges ne reprend pas les mots du jeu de sa grotte (cave, flag, morning, wake up, footprint)', () => {
    for (const p of getSpecies('snow_leopard').allowedBiomes) {
      for (const role of ['mother', 'baby'] as const) {
        const s = script('leopard_leap', 'snow_leopard', p, role, 'expert');
        const text = heard(s);
        for (const w of ['cave', 'flag', 'morning', 'wake up', 'footprint']) expect(text, `${p} ${role} : ${w}`).not.toContain(w);
        for (const w of ['cave', 'flag', 'morning', 'wake_up', 'footprint']) expect(scriptItems(s), `${p} ${role} : ${w}`).not.toContain(w);
      }
    }
  });
});

describe('vocabulaire propre à chaque décor d’Asie', () => {
  it('chaque décor d’Asie a au moins 2 mots qu’aucun autre décor du jeu n’a', () => {
    const where = new Map<string, Set<string>>();
    for (const p of Object.values(PLACES)) for (const a of p.anchors) where.set(a.word, (where.get(a.word) ?? new Set()).add(p.id));
    for (const id of ASIA_PLACES) {
      const own = [...new Set(PLACES[id]!.anchors.map((a) => a.word))].filter((w) => where.get(w)!.size === 1);
      expect(own.length, `${id} : ${own.join(', ')}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('les mots propres des décors se nomment, ont leur question, et se photographient', () => {
    const expected: Record<string, { words: string[]; photo: string }> = {
      asia_bamboo: { words: ['sunray', 'fallen leaf'], photo: 'sunray' },
      asia_pagoda: { words: ['pagoda', 'stairs'], photo: 'pagoda' },
      asia_mountain: { words: ['fog', 'azalea'], photo: 'azalea' },
      asia_arch: { words: ['daisy', 'peak'], photo: 'peak' },
      asia_garden: { words: ['lotus', 'iris'], photo: 'lotus' },
      asia_snow_den: { words: ['cave'], photo: 'cave' },
      asia_pavilion: { words: ['pavilion', 'stone bridge'], photo: 'pavilion' },
      asia_clearing: { words: ['field', 'shadow'], photo: 'field' },
      asia_jungle_falls: { words: ['roots', 'red flower'], photo: 'roots' },
      asia_snow_cave: { words: ['lichen', 'icicle'], photo: 'icicle' },
    };
    for (const [id, x] of Object.entries(expected)) {
      for (const w of x.words) {
        const a = PLACES[id]!.anchors.find((y) => y.word === w);
        expect(a, `${id} : ${w}`).toBeDefined();
        expect(a!.check, `${id} : ${w}`).toBeDefined();
        expect(a!.crop, `${id} : ${w}`).toBeDefined();
        expect(NOUNS[w], `${id} : ${w}`).toBeDefined();
      }
      const sp = SPECIES.find((s) => s.allowedBiomes.includes(id))!;
      const c = { species: sp, place: getBiome(id) } as unknown as ActivityCtx;
      expect(photoSubjects(c), id).toContain(x.photo);
    }
  });
});
