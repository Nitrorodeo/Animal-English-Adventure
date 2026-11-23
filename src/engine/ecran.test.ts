/**
 * Défauts vus à l'écran lors des parcours des jeux (2026-11-21) : chaque test garde la correction.
 */
import { describe, expect, it } from 'vitest';
import { getArchetype } from '../content/archetypes';
import { numberOptions } from '../content/activities/games';
import { iconOf } from '../content/activities/world';
import { PLACES } from '../content/places';
import { inWater } from '../content/places/depth';
import { PROPS } from '../content/props';
import { getSpecies, SPECIES } from '../content/species';
import type { GrowthStage, QuestStep, Tier } from '../content/types';
import { getBiome } from '../content/world';
import { bubbleSide, frTypo, nameInside, wornSlot } from '../ui/bubbleSide';
import { homePlacement } from '../ui/scene';
import { propDepth } from '../ui/PropLayer';
import { createBaby } from './family';
import { buildQuest, type QuestContext } from './quests';
import { createRng } from './rng';
import { getFamily, newGameState, withFamily, type ActorRef, type GameState } from './state';

function withBaby(speciesId: string, stage: GrowthStage, tier: Tier): GameState {
  const r = createBaby(getFamily(newGameState(), speciesId), 'girl', 'Mia', 'b1');
  if (!r.ok) throw new Error(r.error);
  const st = withFamily(newGameState(), { ...r.family, babies: r.family.babies.map((b) => ({ ...b, stage })) });
  return { ...st, settings: { ...st.settings, levelOverride: tier } };
}
const ctx = (state: GameState, speciesId: string, placeId: string, actor: ActorRef): QuestContext => ({ state, species: getSpecies(speciesId), biome: getBiome(placeId), actor, rng: createRng(5) });
const adult = (speciesId: string, role: 'father' | 'mother'): ActorRef => ({ speciesId, kind: 'adult', role });
const lines = (steps: readonly QuestStep[]) => steps.map((s) => ('line' in s ? s.line.en : ''));

describe('la bulle ne cache pas ce qu’il faut voir', () => {
  it('reste à gauche quand rien n’est dessous', () => {
    expect(bubbleSide([{ x: 70, y: 70 }], [{ x: 60, y: 20, w: 10, h: 10 }])).toBe('left');
    expect(bubbleSide([])).toBe('left');
  });
  it('passe à droite quand la cible est sous elle (sable, fleur du quiz)', () => {
    expect(bubbleSide([], [{ x: 20, y: 72, w: 40, h: 20 }])).toBe('right');
    expect(bubbleSide([], [{ x: 2, y: 78, w: 12, h: 12 }])).toBe('right');
  });
  it('passe à droite quand des objets à compter sont dessous, pas si la droite en cache plus', () => {
    expect(bubbleSide([{ x: 20, y: 70 }, { x: 30, y: 75 }, { x: 70, y: 40 }])).toBe('right');
    expect(bubbleSide([{ x: 20, y: 70 }, { x: 70, y: 70 }, { x: 80, y: 75 }])).toBe('left');
  });
});

describe('textes et images des jeux communs', () => {
  it('Papa ne parle pas de lui à la troisième personne (« And me? I’m Daddy! »)', () => {
    const dad = buildQuest(getArchetype('quiz_intermediate'), ctx(withBaby('lion', 'young', 'expert'), 'lion', 'africa_baobab', adult('lion', 'father')))!;
    expect(lines(dad.script.steps)).toContain("And me? I'm Daddy! He or she?");
    const kid = buildQuest(getArchetype('quiz_intermediate'), ctx(withBaby('lion', 'companion', 'expert'), 'lion', 'africa_baobab', { speciesId: 'lion', kind: 'baby', babyId: 'b1' }))!;
    expect(lines(kid.script.steps)).toContain('Look at Mummy! Do we say he or she?');
    expect(lines(kid.script.steps)).toContain('And Daddy? He or she?');
  });

  it('énigme : le papillon est en couleur, chaque réponse a une image, erreur sans « No! »', () => {
    const q = buildQuest(getArchetype('solve_mystery'), ctx(withBaby('giraffe', 'young', 'expert'), 'giraffe', 'africa_waterhole', adult('giraffe', 'father')))!;
    const json = JSON.stringify(q.script.steps);
    expect(iconOf('butterfly')).toBe('🦋');
    const fly = q.script.steps.flatMap((s) => (s.kind === 'props' ? s.show : [])).find((p) => p.prop === 'butterfly');
    if (fly) expect(fly.color).toBeTruthy();
    for (const s of q.script.steps) if (s.kind === 'ask') for (const o of s.options) expect(o.icon, o.line.en).toBeTruthy();
    expect(json).not.toMatch(/"No! That's/);
  });

  it('les réponses chiffrées montrent le chiffre', () => {
    for (const o of numberOptions(5)) expect(o.icon).toMatch(/\d|🔟/u);
  });

  it('lanternes : « What a beautiful evening! » est dit avant le retour du jour', () => {
    const q = buildQuest(getArchetype('lanterns'), ctx(withBaby('tiger', 'young', 'beginner'), 'tiger', 'asia_pagoda', adult('tiger', 'mother')))!;
    const st = q.script.steps;
    const day = st.findIndex((s) => s.kind === 'scene' && !s.night);
    const eve = st.findIndex((s) => 'line' in s && s.line.en.includes('evening'));
    expect(eve).toBeGreaterThan(-1);
    expect(eve).toBeLessThan(day);
  });

  it('flocons : pas « It’s snowing! » sous le soleil', () => {
    const q = buildQuest(getArchetype('snowflakes'), ctx(withBaby('penguin', 'young', 'beginner'), 'penguin', 'an_snowfield', adult('penguin', 'father')));
    expect(q).toBeTruthy();
    if (q) expect(JSON.stringify(q.script.steps)).not.toMatch(/It's snowing/);
  });
});

describe('petits détails d’affichage', () => {
  it('papa et maman ne se cachent pas la tête (écart d’au moins 22 % de largeur)', () => {
    const fam = getFamily(newGameState(), 'giant_panda');
    const dad = homePlacement({ speciesId: 'giant_panda', kind: 'adult', role: 'father' }, fam);
    const mum = homePlacement({ speciesId: 'giant_panda', kind: 'adult', role: 'mother' }, fam);
    expect(mum.x - dad.x).toBeGreaterThanOrEqual(22);
  });
  it('le prénom d’un personnage tout en bas reste dans le décor', () => {
    expect(nameInside(97)).toBe(true);
    expect(nameInside(88)).toBe(false);
  });
  it('un objet posé au loin est plus petit, mais reste assez grand pour le doigt', () => {
    expect(propDepth(75)).toBe(1);
    expect(propDepth(55)).toBeLessThan(0.8);
    expect(propDepth(20)).toBe(0.75);
    expect(propDepth(95)).toBeLessThanOrEqual(1.1);
  });
  it('un habit se porte à sa place', () => {
    expect(wornSlot('hat')).toBe('head');
    expect(wornSlot('coat')).toBe('body');
    expect(wornSlot('sunglasses')).toBe('eyes');
    expect(wornSlot('boots')).toBe('feet');
  });
  it('aide française : jamais de « ! » seul en début de ligne', () => {
    expect(frTypo('Touche le sable !')).toBe('Touche le sable !');
    expect(frTypo('Où ? Ici : là ; « oui »')).toBe('Où ? Ici : là ; « oui »');
  });
});

describe('décors et objets corrigés (2026-11-22)', () => {
  const steps = (arch: string, sp: string, place: string, tier: Tier = 'beginner') =>
    buildQuest(getArchetype(arch), ctx(withBaby(sp, 'young', tier), sp, place, adult(sp, 'father')))!.script.steps;
  const shown = (st: readonly QuestStep[]) => st.flatMap((s) => (s.kind === 'props' ? s.show : []));

  it('empreintes : sabots pour le zèbre et le cerf, trois doigts pour le manchot, jamais dans la mare', () => {
    for (const [sp, place, print] of [['giraffe', 'africa_plains', 'hoofprint'], ['elephant', 'africa_acacia_plain', 'hoofprint'], ['giraffe', 'africa_green_meadow', 'hoofprint'], ['fox', 'europe_forest', 'hoofprint'], ['penguin', 'an_snowfield', 'birdprint']] as const) {
      for (const tier of ['beginner', 'intermediate', 'expert'] as const) {
        const st = steps('follow_tracks', sp, place, tier);
        const prints = shown(st).filter((p) => p.id.startsWith('fp'));
        expect(prints.length, `${place} ${tier}`).toBeGreaterThan(2);
        for (const p of prints) {
          expect(p.prop).toBe(print);
          const s = PLACES[place]!.spots[p.spot]!;
          expect(inWater(PLACES[place]!.water, s.x, s.y), `${place} ${p.id}`).toBe(false);
        }
      }
    }
    expect(PROPS.hoofprint!.word).toBe('footprint');
    expect(PROPS.birdprint!.word).toBe('footprint');
  });

  it('aucune empreinte ni l’animal du bout de la piste n’est posé sur Papa ou Maman', () => {
    for (const place of ['africa_plains', 'africa_acacia_plain', 'africa_green_meadow', 'na_prairie', 'europe_forest', 'an_snowfield', 'na_redwoods', 'na_redwood_trail']) {
      const sp = SPECIES.find((x) => x.allowedBiomes.includes(place))!.id;
      for (const tier of ['beginner', 'intermediate', 'expert'] as const) {
        const st = steps('follow_tracks', sp, place, tier);
        for (const x of SPECIES.filter((y) => y.allowedBiomes.includes(place))) {
          const fam = getFamily(newGameState(), x.id);
          for (const role of ['father', 'mother'] as const) {
            const h = homePlacement({ speciesId: x.id, kind: 'adult', role }, fam, PLACES[place]!.groundY);
            for (const p of shown(st)) {
              const s = PLACES[place]!.spots[p.spot]!;
              const on = Math.abs(s.x - h.x) < h.h * 0.22 && s.y > h.y - h.h * 0.85 && s.y < h.y - 2;
              expect(on, `${place} ${tier} ${p.id} (${s.x},${s.y}) sur ${x.id} ${role}`).toBe(false);
            }
          }
        }
      }
    }
  });

  it('la mare de la savane et la mer de la plage sont de l’eau ; les emplacements de la plage sont sur le sable', () => {
    expect(inWater(PLACES.savanna!.water, 35, 56)).toBe(true);
    expect(inWater(PLACES.oc_beach!.water, 60, 60)).toBe(true);
    for (const s of PLACES.oc_beach!.spots) expect(inWater(PLACES.oc_beach!.water, s.x, s.y), `${s.x},${s.y}`).toBe(false);
    for (const s of PLACES.savanna!.spots) expect(inWater(PLACES.savanna!.water, s.x, s.y), `${s.x},${s.y}`).toBe(false);
  });

  it('canyon d’écho : pas de grenouille dans la neige', () => {
    for (const [sp, place] of [['penguin', 'an_ice_cave'], ['snow_leopard', 'asia_snow_den'], ['lion', 'africa_canyon']] as const) {
      expect(JSON.stringify(steps('echo_canyon', sp, place, 'intermediate')), place).not.toMatch(/frog|🐸/);
    }
  });

  it('la feuille d’érable est dessinée (pas d’émoji), le pommier se touche sur tout l’arbre', () => {
    expect(PROPS.maple_leaf!.shape).toBe('maple');
    expect(PROPS.maple_leaf!.emoji).toBeUndefined();
    const tree = PLACES.europe_farm!.anchors.find((a) => a.id === 'appletree')!;
    expect(tree.hit.w).toBeGreaterThanOrEqual(40);
    expect(tree.hit.y).toBe(0);
    expect(PLACES.europe_farm!.anchors[0]!.id).toBe('appletree'); // la maison et le mur, posés après, restent touchables
  });
});

describe('relecture des jeux par espèce (2026-11-22)', () => {
  const all = (sp: string, place: string, arch: string, actor: ActorRef) =>
    (['beginner', 'intermediate', 'expert'] as const).map((t) => JSON.stringify(buildQuest(getArchetype(arch), ctx(withBaby(sp, 'young', t), sp, place, actor))?.script.steps ?? [])).join('');
  it('pas de chasse montrée, pas de défenses chez la girafe, pas de « petit manchot » pour la joueuse', () => {
    const pb = "an_snowfield";
    expect(all('polar_bear', pb, 'polar_bear_fur', adult('polar_bear', 'mother'))).not.toMatch(/catch it|attrape/);
    const el = "savanna";
    expect(all('elephant', el, 'elephant_trunk', adult('elephant', 'mother'))).not.toMatch(/No tusks|have no tusks/);
    const pg = "an_snowfield";
    expect(all('penguin', pg, 'penguin_waddle', adult('penguin', 'father'))).not.toMatch(/super petit manchot/);
  });
  it('Océanie : Papa ne parle jamais de lui comme « Daddy »', () => {
    expect(getArchetype('koala_sleepy').roles).not.toContain('father');
    expect(getArchetype('lizard_frill').roles).not.toContain('father');
    expect(getArchetype('kangaroo_hop').roles).toEqual(['father', 'mother', 'baby']);
  });
});
