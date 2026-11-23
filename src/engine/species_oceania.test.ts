/**
 * Océanie (2026-11-21) : chaque espèce a son jeu et son vocabulaire (kangourou, koala, lézard à
 * collerette), et chaque décor d'Océanie a au moins deux mots qu'aucun autre décor du jeu n'a.
 */
import { describe, expect, it } from 'vitest';
import { getArchetype } from '../content/archetypes';
import { OCEANIA_SPECIES_ACTIVITIES } from '../content/activities/species/oceania';
import { OCEANIA_SPECIES_ARCHETYPES } from '../content/activities/species/oceania.arch';
import { photoSubjects } from '../content/activities/africa';
import { itemInfo } from '../content/items';
import { NOUNS, PLACES } from '../content/places';
import { inWater } from '../content/places/depth';
import { getSpecies, SPECIES } from '../content/species';
import type { QuestScript, Tier } from '../content/types';
import { getBiome } from '../content/world';
import { createBaby } from './family';
import { activityCtx, buildQuest, selectActivities, type QuestContext } from './quests';
import { createRng } from './rng';
import { canAdvance, isFinished, runAction, startRun, type RunResult } from './runner';
import { walkSteps } from './script';
import { getFamily, newGameState, withFamily, type ActorRef, type GameState } from './state';

const TIERS: Tier[] = ['beginner', 'intermediate', 'expert'];
const GAMES = [
  { id: 'kangaroo_hop', sp: 'kangaroo', words: ['pouch', 'joey', 'big feet', 'strong tail', 'hop'] },
  { id: 'koala_sleepy', sp: 'koala', words: ['eucalyptus leaves', 'hug', 'fluffy ears', 'nose', 'claws', 'sleepy'] },
  { id: 'lizard_frill', sp: 'frilled_lizard', words: ['frill', 'hiss', 'warm', 'two legs', 'long tail', 'bugs'] },
] as const;
const OC_PLACES = Object.values(PLACES).filter((p) => p.continentId === 'oceania');

const father = (sp: string): ActorRef => ({ speciesId: sp, kind: 'adult', role: 'father' });
const mother = (sp: string): ActorRef => ({ speciesId: sp, kind: 'adult', role: 'mother' });
const baby = (sp: string): ActorRef => ({ speciesId: sp, kind: 'baby', babyId: 'b1' });

/** Famille avec un bébé du stade voulu (l'acteur bébé et le joey en ont besoin). */
function withBaby(sp: string): GameState {
  const r = createBaby(getFamily(newGameState(), sp), 'girl', 'Mia', 'b1');
  if (!r.ok) throw new Error(r.error);
  return withFamily(newGameState(), { ...r.family, babies: r.family.babies.map((b) => ({ ...b, stage: 'companion' as const })) });
}
/** Famille neuve, déjà saluée (la salutation est jouée). */
function greeted(sp: string): GameState {
  const st = newGameState();
  return { ...st, player: { ...st.player, activityCounter: 1, history: [{ archetypeId: 'greeting', speciesId: sp, actorId: 'none', mechanic: 'talk', at: 0 }] } };
}
const atTier = (st: GameState, tier: Tier): GameState => ({ ...st, settings: { ...st.settings, levelOverride: tier } });
const ctx = (state: GameState, sp: string, place: string, actor: ActorRef, seed = 5): QuestContext => ({ state, species: getSpecies(sp), biome: getBiome(place), actor, rng: createRng(seed) });
const text = (sc: QuestScript) => JSON.stringify(sc.steps).toLowerCase();

describe('Océanie : un jeu à soi pour chaque espèce', () => {
  it('chaque espèce d’Océanie a son jeu, réservé à elle seule', () => {
    for (const sp of SPECIES.filter((s) => s.continentId === 'oceania')) {
      const mine = OCEANIA_SPECIES_ARCHETYPES.filter((a) => a.speciesIds?.includes(sp.id));
      expect(mine.length, sp.id).toBeGreaterThan(0);
      for (const a of mine) {
        expect(a.speciesIds, a.id).toEqual([sp.id]);
        expect(a.allowedBiomes, a.id).toEqual([]);
        expect(OCEANIA_SPECIES_ACTIVITIES.some((x) => x.id === a.id), a.id).toBe(true);
      }
    }
  });

  it('chaque jeu se construit aux 3 niveaux, dans chaque décor de l’espèce, pour chacun de ses rôles (koala et lézard : Maman et le bébé)', () => {
    for (const g of GAMES) {
      const arch = getArchetype(g.id);
      const sp = getSpecies(g.sp);
      for (const place of sp.allowedBiomes) {
        for (const actor of [father(g.sp), mother(g.sp), baby(g.sp)].filter((x) => !arch.roles || arch.roles.includes(x.kind === 'baby' ? 'baby' : x.role))) {
          for (const tier of TIERS) {
            const st = atTier(withBaby(g.sp), tier);
            const q = buildQuest(arch, ctx(st, g.sp, place, actor));
            const where = `${g.id}@${place}/${actor.kind}${actor.kind === 'adult' ? actor.role : ''}/${tier}`;
            expect(q, where).toBeTruthy();
            expect(q!.script.tier, where).toBe(tier);
            expect(walkSteps(q!.script, { babies: 1, actorKind: actor.kind, allowedPlaces: sp.allowedBiomes }), where).toEqual([]);
          }
        }
        // sans bébé aussi (famille neuve) : le joey n'est appelé que s'il existe
        const q = buildQuest(arch, ctx(atTier(newGameState(), 'expert'), g.sp, place, mother(g.sp)));
        expect(q, `${g.id}@${place} sans bébé`).toBeTruthy();
        expect(text(q!.script)).not.toMatch(/touch the joey/);
      }
    }
  });

  it('les niveaux diffèrent : plus d’étapes et des phrases plus riches en montant', () => {
    for (const g of GAMES) {
      const place = getSpecies(g.sp).allowedBiomes[0]!;
      const len = TIERS.map((t) => buildQuest(getArchetype(g.id), ctx(atTier(withBaby(g.sp), t), g.sp, place, mother(g.sp)))!.script.steps.length);
      expect(len[1]!, g.id).toBeGreaterThan(len[0]!);
      expect(len[2]!, g.id).toBeGreaterThan(len[1]!);
      const expert = text(buildQuest(getArchetype(g.id), ctx(atTier(withBaby(g.sp), 'expert'), g.sp, place, mother(g.sp)))!.script);
      expect(expert, g.id).toMatch(/\bhe('s| can|'s| hasn't)/);
    }
  });

  it('le jeu n’est pas proposé à une autre espèce, même dans le même décor', () => {
    for (const g of GAMES) {
      const arch = getArchetype(g.id);
      const act = OCEANIA_SPECIES_ACTIVITIES.find((a) => a.id === g.id)!;
      for (const sp of SPECIES.filter((s) => s.id !== g.sp)) {
        for (const place of sp.allowedBiomes.filter((p) => PLACES[p]?.continentId === 'oceania' || p === sp.allowedBiomes[0])) {
          const c = ctx(withBaby(sp.id), sp.id, place, father(sp.id));
          expect(buildQuest(arch, c), `${g.id} pour ${sp.id}@${place}`).toBeUndefined();
          expect(act.choices(activityCtx(c)), `${g.id} (variantes) pour ${sp.id}@${place}`).toEqual([]);
        }
      }
    }
  });

  it('le jeu sort dans le menu d’une famille neuve déjà saluée (≥ 25 tirages sur 40), dans chaque décor', () => {
    for (const g of GAMES) {
      for (const place of getSpecies(g.sp).allowedBiomes) {
        const st = greeted(g.sp);
        const best = Math.max(
          ...[father(g.sp), mother(g.sp)].map((actor) => {
            let n = 0;
            for (let seed = 0; seed < 40; seed++) if (selectActivities(ctx(st, g.sp, place, actor, seed)).some((x) => x.archetype.id === g.id)) n++;
            return n;
          }),
        );
        expect(best, `${g.id}@${place}`).toBeGreaterThanOrEqual(25);
      }
    }
  });

  it('aucun objet n’est posé dans l’eau, et le koala grimpe à un vrai arbre (pas au pandanus)', () => {
    let n = 0;
    for (const g of GAMES) {
      for (const place of getSpecies(g.sp).allowedBiomes) {
        const p = PLACES[place]!;
        for (const tier of TIERS) {
          const q = buildQuest(getArchetype(g.id), ctx(atTier(withBaby(g.sp), tier), g.sp, place, mother(g.sp)))!;
          for (const s of q.script.steps) if (s.kind === 'props') for (const x of s.show) {
            const spot = p.spots[x.spot]!;
            expect(inWater(p.water, spot.x, spot.y), `${q.script.id}: ${x.id} dans l'eau`).toBe(false);
            n++;
          }
          if (g.id === 'koala_sleepy') {
            const t = q.script.steps.find((s) => s.kind === 'tapAnchor');
            expect(t && t.kind === 'tapAnchor' && ['eucalyptus', 'gum_tree', 'tree'].includes(t.anchor), place).toBe(true);
            if (place === 'oc_rocky_cove') expect(t && t.kind === 'tapAnchor' && t.anchor).toBe('gum_tree');
            if (place === 'oc_eucalyptus') expect(t && t.kind === 'tapAnchor' && t.anchor).toBe('eucalyptus');
          }
        }
      }
    }
    expect(n).toBeGreaterThan(50);
  });

  it('chaque jeu se joue jusqu’au bout, même avec des erreurs (jamais bloqué)', () => {
    for (const g of GAMES) {
      for (const place of getSpecies(g.sp).allowedBiomes) {
        for (const tier of TIERS) {
          const sc = buildQuest(getArchetype(g.id), ctx(atTier(withBaby(g.sp), tier), g.sp, place, mother(g.sp)))!.script;
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
  });

  it('les mots propres à l’animal sont entendus, et chaque expression travaillée est connue', () => {
    for (const g of GAMES) {
      for (const place of getSpecies(g.sp).allowedBiomes) {
        const sc = buildQuest(getArchetype(g.id), ctx(atTier(withBaby(g.sp), 'expert'), g.sp, place, mother(g.sp)))!.script;
        for (const w of g.words) expect(text(sc), `${g.id}@${place}: « ${w} »`).toContain(w);
        for (const s of sc.steps) if ('items' in s && s.items) for (const it of s.items) expect(itemInfo(it), `${g.id}: ${it}`).toBeTruthy();
      }
    }
  });
});

describe('Océanie : un vocabulaire à soi pour chaque décor', () => {
  const placesOf = new Map<string, Set<string>>();
  for (const p of Object.values(PLACES)) for (const a of p.anchors) {
    const w = a.word.toLowerCase();
    if (!placesOf.has(w)) placesOf.set(w, new Set());
    placesOf.get(w)!.add(p.id);
  }

  it('chaque décor d’Océanie a au moins deux mots qu’aucun autre décor du jeu n’a, avec leur nom', () => {
    for (const p of OC_PLACES) {
      const own = p.anchors.filter((a) => placesOf.get(a.word.toLowerCase())!.size === 1);
      expect(own.length, `${p.id}: ${own.map((a) => a.word).join(', ')}`).toBeGreaterThanOrEqual(2);
      for (const a of own) {
        expect(NOUNS[a.word], `${p.id}: ${a.word}`).toBeTruthy();
        expect(a.check, `${p.id}: ${a.word}`).toBeTruthy();
        // la zone à toucher reste dans l'image
        expect(a.hit.x + a.hit.w, a.id).toBeLessThanOrEqual(100);
        expect(a.hit.y + a.hit.h, a.id).toBeLessThanOrEqual(100);
      }
    }
  });

  it('la photo propose aussi un sujet propre au décor', () => {
    for (const p of OC_PLACES) {
      const c = { species: getSpecies('kangaroo'), place: getBiome(p.id) } as Parameters<typeof photoSubjects>[0];
      const own = photoSubjects(c).filter((id) => {
        const a = p.anchors.find((x) => x.id === id)!;
        return placesOf.get(a.word.toLowerCase())!.size === 1;
      });
      expect(own.length, p.id).toBeGreaterThan(0);
    }
  });
});
