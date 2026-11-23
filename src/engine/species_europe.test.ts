/**
 * Europe (2026-11-21) : chaque espèce a son jeu à elle et son vocabulaire à elle
 * (renard : bushy tail, yip, pounce, den ; hibou : hoot, big eyes, wings, owlet ;
 * hérisson : spikes, curl up into a ball, bed of leaves, beetles, hoglet), et chaque décor
 * d'Europe a au moins deux mots qu'aucun autre décor du jeu n'a.
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

const EUROPE_PLACES = Object.values(PLACES).filter((p) => p.continentId === 'europe').map((p) => p.id);
const TIERS: readonly Tier[] = ['beginner', 'intermediate', 'expert'];

/** Jeu de chaque espèce, et les mots propres qu'on doit entendre (débutant, puis en plus à l'expert). */
const GAMES = [
  { id: 'fox_tricks', species: 'fox', words: ['yip', 'bushy tail', 'big ears', 'pounce', 'sniff', 'den'], expert: ['hear with', "can't fly"] },
  { id: 'owl_night', species: 'owl', words: ['hoot', 'big eyes', 'feathers', 'wings', 'night', 'moon'], expert: ['turn their heads', 'owlet'] },
  { id: 'hedgehog_ball', species: 'hedgehog', words: ['spikes', 'curl up into a ball', 'bed of leaves', 'beetles', 'worms'], expert: ['hoglet', "can't jump"] },
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

describe('jeux propres aux espèces d’Europe', () => {
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
      for (const p of EUROPE_PLACES) {
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

  it('la nourriture montrée est celle de l’espèce, et les capacités montrées sont réelles', () => {
    const arch = getArchetype('hedgehog_ball');
    for (const p of getSpecies('hedgehog').allowedBiomes) {
      const text = heard(buildQuest(arch, ctx(family('hedgehog', 0, 'little', 'expert'), 'hedgehog', p, actorOf('hedgehog', 'mother')))!.script);
      expect(text).toContain("i don't eat fish");
      expect(text).not.toContain('i eat fish');
    }
    // le renard creuse et bondit (il sait), le hibou vole (il sait), le hérisson ne saute pas
    expect(getSpecies('fox').can).toEqual(expect.arrayContaining(['dig', 'jump']));
    expect(getSpecies('owl').can).toContain('fly');
    expect(getSpecies('hedgehog').can).not.toContain('jump');
  });

  it('le renard touche sa tanière dessinée dans la forêt, et une tanière posée ailleurs', () => {
    const arch = getArchetype('fox_tricks');
    const steps = (p: string) => buildQuest(arch, ctx(family('fox', 0, 'little', 'beginner'), 'fox', p, actorOf('fox', 'father')))!.script.steps;
    expect(steps('europe_forest').some((s) => s.kind === 'tapAnchor' && s.anchor === 'den')).toBe(true);
    expect(steps('europe_farm').some((s) => s.kind === 'props' && s.show.some((x) => x.prop === 'den'))).toBe(true);
  });
});

describe('vocabulaire propre à chaque décor d’Europe', () => {
  it('chaque décor d’Europe a au moins 2 mots qu’aucun autre décor du jeu n’a', () => {
    const where = new Map<string, Set<string>>();
    for (const p of Object.values(PLACES)) for (const a of p.anchors) where.set(a.word, (where.get(a.word) ?? new Set()).add(p.id));
    for (const id of EUROPE_PLACES) {
      const own = [...new Set(PLACES[id]!.anchors.map((a) => a.word))].filter((w) => where.get(w)!.size === 1);
      expect(own.length, `${id} : ${own.join(', ')}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('les nouveaux mots des décors se nomment, ont leur question, et se photographient', () => {
    const expected: Record<string, { words: string[]; photo: string }> = {
      europe_forest: { words: ['den'], photo: 'den' },
      europe_alps: { words: ['edelweiss', 'meadow'], photo: 'edelweiss' },
      europe_coast: { words: ['cypress tree', 'window'], photo: 'cypress' },
      europe_lake: { words: ['mist', 'heather'], photo: 'mist' },
      europe_farm: { words: ['village'], photo: 'village' },
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
