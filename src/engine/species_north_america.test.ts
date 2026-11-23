/**
 * Amérique du Nord (2026-11-22) : chaque espèce a son jeu à elle et son vocabulaire à elle
 * (ours : paws, claws, fur, sniff, honey, den, stand up tall, growl ; bison : horns, hump, herd,
 * stomp, dust ; castor : teeth, chew, sticks, dam, flat tail, slap, lodge), et chaque décor
 * d'Amérique du Nord a au moins deux mots qu'aucun autre décor du jeu n'a.
 */
import { describe, expect, it } from 'vitest';
import { getArchetype } from '../content/archetypes';
import { photoSubjects } from '../content/activities/africa';
import { itemInfo } from '../content/items';
import { NOUNS, PLACES } from '../content/places';
import { inWater } from '../content/places/depth';
import { getSpecies, SPECIES } from '../content/species';
import type { ActivityCtx, ActorRole, GrowthStage, QuestScript, Tier } from '../content/types';
import { getBiome } from '../content/world';
import { stepUtterances } from './dialogue';
import { createBaby } from './family';
import { buildQuest, selectActivities, type QuestContext } from './quests';
import { createRng } from './rng';
import { canAdvance, isFinished, runAction, startRun, type RunResult } from './runner';
import { scriptItems } from './skills';
import { actorId, getFamily, newGameState, withFamily, type ActorRef, type GameState } from './state';
import { activityVariants, STRUCTURAL_CONFIGS } from './variants';

const NA_PLACES = Object.values(PLACES).filter((p) => p.continentId === 'north_america').map((p) => p.id);
const TIERS: readonly Tier[] = ['beginner', 'intermediate', 'expert'];
/** Tanière enneigée de l'ours (2026-11-23) : pas de miel ni de baies sous la neige, des pommes de pin à la place. */
const WINTER_DEN = 'na_bear_den';

/** Jeu de chaque espèce, et les mots propres qu'on doit entendre (débutant, puis en plus à l'expert). */
const GAMES = [
  { id: 'bear_honey', species: 'bear', words: ['paws', 'claws', 'fur', 'sniff', 'honey', 'den'], expert: ['berries', 'stand up tall', 'growl', "can't fly"] },
  { id: 'bison_herd', species: 'bison', words: ['horns', 'hump', 'herd', 'grass', 'stomp', 'dust'], expert: ['deer', 'stomping', "can't climb"] },
  { id: 'beaver_dam', species: 'beaver', words: ['teeth', 'chew', 'sticks', 'dam', 'flat tail', 'slap', 'lodge'], expert: ['door', 'pine cone', "can't climb"] },
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
const script = (g: (typeof GAMES)[number], p: string, role: ActorRole, tier: Tier, babies: 0 | 1 | 2 = 1) =>
  buildQuest(getArchetype(g.id), ctx(family(g.species, babies, 'little', tier), g.species, p, actorOf(g.species, role)))!.script;

/** Tout ce que l'on entend dans un script (phrases, réponses, cartes, réponses des cartes). */
const heard = (s: QuestScript) => s.steps.flatMap((st) => stepUtterances(st).map((u) => u.line.en)).join(' ').toLowerCase();

describe('jeux propres aux espèces d’Amérique du Nord', () => {
  it('chaque jeu se construit aux 3 niveaux, dans chaque décor de l’espèce, pour chaque rôle prévu', () => {
    for (const g of GAMES) {
      const arch = getArchetype(g.id);
      expect(arch.speciesIds, g.id).toEqual([g.species]);
      expect(arch.allowedBiomes, g.id).toEqual([]);
      expect(arch.roles, g.id).toEqual(['father', 'mother', 'baby']);
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
      for (const role of getArchetype(g.id).roles ?? []) {
        for (const p of getSpecies(g.species).allowedBiomes) {
          const len = (t: Tier) => script(g, p, role, t, 2).steps.length;
          expect(len('intermediate'), `${g.id}@${p} ${role}`).toBeGreaterThan(len('beginner'));
          expect(len('expert'), `${g.id}@${p} ${role}`).toBeGreaterThan(len('intermediate'));
        }
      }
    }
  });

  it('chaque jeu est réservé à son espèce (jamais proposé à une autre espèce du même décor)', () => {
    for (const g of GAMES) {
      const arch = getArchetype(g.id);
      for (const p of NA_PLACES) {
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
      const wet = place.anchors.filter((a) => a.tags?.includes('water') || a.tags?.includes('sea')).map((a) => a.hit);
      for (const s of v.script.steps) {
        if (s.kind !== 'props') continue;
        for (const x of s.show) {
          if (x.sky) continue;
          const spot = place.spots[x.spot]!;
          expect(inWater(place.water, spot.x, spot.y), `${v.script.id} ${x.id}`).toBe(false);
          expect(wet.some((h) => spot.x >= h.x && spot.x <= h.x + h.w && spot.y >= h.y && spot.y <= h.y + h.h), `${v.script.id} ${x.id} (zone d'eau)`).toBe(false);
        }
      }
    }
    expect(n).toBeGreaterThan(0);
  });

  it('chaque jeu se joue jusqu’au bout, même avec des erreurs (jamais bloqué)', () => {
    for (const g of GAMES) {
      for (const p of getSpecies(g.species).allowedBiomes) {
        for (const tier of TIERS) {
          for (const role of ['father', 'baby'] as const) {
            const sc = script(g, p, role, tier);
            let r: RunResult = startRun(sc);
            for (let guard = 0; guard < 300 && !isFinished(sc, r.state); guard++) {
              const step = sc.steps[r.state.index]!;
              const go = (a: Parameters<typeof runAction>[2]) => (r = runAction(sc, r.state, a));
              if (step.kind === 'ask') {
                const bad = step.options.findIndex((o) => !o.correct);
                if (bad >= 0) go({ type: 'choose', option: bad });
                go({ type: 'choose', option: step.options.findIndex((o) => o.correct) });
              } else if (step.kind === 'tapAnchor') go({ type: 'tapAnchor', anchor: step.anchor });
              else if (step.kind === 'tapProps') {
                for (const w of Object.keys(step.wrong ?? {})) go({ type: 'tapProp', prop: w });
                for (const t of step.targets) go({ type: 'tapProp', prop: t });
              } else if (step.kind === 'tapActor') go({ type: 'tapActor', who: ['actor', step.target] });
              else if (step.kind === 'command') step.options.forEach((_o, i) => r.state.feedback !== 'ok' && go({ type: 'choose', option: i }));
              expect(canAdvance(sc, r.state), `${sc.id} bloqué à l'étape ${r.state.index} (${step.kind})`).toBe(true);
              go({ type: 'advance' });
            }
            expect(isFinished(sc, r.state), `${sc.id} jamais terminé`).toBe(true);
          }
        }
      }
    }
  });

  it('les mots propres de l’animal sont entendus dans le script', () => {
    for (const g of GAMES) {
      for (const p of getSpecies(g.species).allowedBiomes) {
        for (const role of getArchetype(g.id).roles ?? []) {
          const beginner = heard(script(g, p, role, 'beginner'));
          const expert = heard(script(g, p, role, 'expert'));
          const winter = g.id === 'bear_honey' && p === WINTER_DEN;
          const words = winter ? [...g.words.filter((w) => w !== 'honey'), 'pine cone'] : g.words;
          const more = winter ? g.expert.filter((w) => w !== 'berries') : g.expert;
          for (const w of words) expect(beginner, `${g.id}@${p} ${role} débutant : ${w}`).toContain(w);
          for (const w of [...words, ...more]) expect(expert, `${g.id}@${p} ${role} expert : ${w}`).toContain(w);
          if (winter) for (const w of ['honey', 'berries']) expect(expert, `${g.id}@${p} ${role} : pas de ${w} sous la neige`).not.toContain(w);
        }
      }
    }
  });

  it('la nourriture montrée est la vraie, et les capacités montrées sont réelles', () => {
    for (const p of getSpecies('bear').allowedBiomes.filter((x) => x !== WINTER_DEN)) {
      const t = heard(script(GAMES[0], p, 'mother', 'expert'));
      expect(t).toContain("i don't eat grass");
      expect(t).toContain("i don't eat bamboo");
    }
    for (const p of getSpecies('bison').allowedBiomes) {
      const sc = script(GAMES[1], p, 'father', 'expert');
      const food = sc.steps.find((s) => s.kind === 'ask' && s.line.en.includes('What do I eat'));
      expect(food && food.kind === 'ask' && food.options.find((o) => o.correct)!.line.en).toBe('Grass!');
    }
    expect(getSpecies('bear').foods).toEqual(expect.arrayContaining(['honey', 'berries']));
    expect(getSpecies('bear').notFoods).toEqual(expect.arrayContaining(['bamboo', 'grass']));
    expect(getSpecies('bison').foods).toContain('grass');
    expect(getSpecies('bear').can).toContain('climb');
    expect(getSpecies('bison').cannot).toContain('climb');
    expect(getSpecies('beaver').can).toEqual(expect.arrayContaining(['swim', 'dig']));
    expect(getSpecies('beaver').cannot).toContain('climb');
  });

  it('le castor touche sa hutte dessinée à l’étang, et ne nage (carte) que là où il y a de l’eau', () => {
    const g = GAMES[2];
    const steps = (p: string) => script(g, p, 'father', 'expert').steps;
    expect(steps('na_beaver_pond').some((s) => s.kind === 'tapAnchor' && s.anchor === 'lodge')).toBe(true);
    for (const p of getSpecies('beaver').allowedBiomes) {
      const wet = PLACES[p]!.anchors.some((a) => a.tags?.includes('water') || a.tags?.includes('sea'));
      const cards = steps(p).flatMap((s) => (s.kind === 'command' ? s.options.map((o) => o.line.en) : []));
      expect(cards.includes('Swim!'), p).toBe(wet);
    }
  });
});

describe('vocabulaire propre à chaque décor d’Amérique du Nord', () => {
  it('chaque décor d’Amérique du Nord a au moins 2 mots qu’aucun autre décor du jeu n’a', () => {
    const where = new Map<string, Set<string>>();
    for (const p of Object.values(PLACES)) for (const a of p.anchors) where.set(a.word, (where.get(a.word) ?? new Set()).add(p.id));
    expect(NA_PLACES.length).toBe(12);
    for (const id of NA_PLACES) {
      const own = [...new Set(PLACES[id]!.anchors.map((a) => a.word))].filter((w) => where.get(w)!.size === 1);
      expect(own.length, `${id} : ${own.join(', ')}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('les nouveaux mots des décors se nomment, ont leur question, et se photographient', () => {
    const expected: Record<string, { words: string[]; photo: string }> = {
      na_redwoods: { words: ['sunbeam', 'poppy'], photo: 'sunbeam' },
      na_prairie: { words: ['boulder', 'red bush'], photo: 'boulder' },
      na_lake: { words: ['canoe', 'reflection'], photo: 'reflection' },
      na_desert: { words: ['agave'], photo: 'agave' },
      na_coast: { words: ['lighthouse', 'lupine'], photo: 'lupine' },
      na_beaver_pond: { words: ['lodge', 'reed'], photo: 'reed' },
      na_redwood_trail: { words: ['clover', 'moss'], photo: 'moss' },
      na_bear_den: { words: ['straw bed', 'bare bush'], photo: 'straw' },
      na_bison_prairie: { words: ['oak tree', 'golden grass'], photo: 'oak_tree' },
      na_bison_alpine: { words: ['fir forest', 'fallen log'], photo: 'fir_forest' },
      na_bison_canyon: { words: ['red rock', 'mesa'], photo: 'mesa' },
      na_beaver_falls: { words: ['torrent', 'mossy rock'], photo: 'torrent' },
    };
    for (const [id, x] of Object.entries(expected)) {
      for (const w of x.words) {
        const a = PLACES[id]!.anchors.find((y) => y.word === w);
        expect(a, `${id} : ${w}`).toBeDefined();
        expect(a!.check, `${id} : ${w}`).toBeDefined();
        expect(a!.crop, `${id} : ${w}`).toBeDefined();
        expect(NOUNS[w], `${id} : ${w}`).toBeDefined();
      }
      // Les décors sortis des parcours (prairie, désert, côte) n'ont plus de famille : on prend le bison.
      const sp = SPECIES.find((s) => s.allowedBiomes.includes(id)) ?? getSpecies('bison');
      const c = { species: sp, place: getBiome(id) } as unknown as ActivityCtx;
      expect(photoSubjects(c), id).toContain(x.photo);
    }
  });
});
