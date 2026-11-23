/**
 * Décors de chaque famille (2026-11-23) : vu à l'écran, les cailloux de « Le bain à l'étang » étaient
 * dessinés sur Papa et Maman éléphant. Aucun objet d'une histoire ni d'un jeu ne se pose sur un membre
 * de la famille, dans aucun décor, à aucun niveau. Écrit pour l'Afrique, étendu le soir même à tous les
 * continents : chaque continent a son bloc (`npx vitest run decors_famille -t asia`).
 */
import { describe, expect, it } from 'vitest';
import { PLACES } from '../content/places';
import { inWater } from '../content/places/depth';
import { getSpecies, SPECIES } from '../content/species';
import type { GrowthStage, QuestStep } from '../content/types';
import { bubbleSide } from '../ui/bubbleSide';
import { homePlacement } from '../ui/scene';
import { createBaby } from './family';
import { getFamily, newGameState, type ActorRef } from './state';
import { activityVariants, adventureVariants, STRUCTURAL_CONFIGS, type Variant } from './variants';

/** Les décors de chaque famille, tels que validés dans docs/CARTOGRAPHIE_PARCOURS.md (« Les 69 décors en un
 *  tableau »). Une famille ne joue que dans ses 3 décors, et un décor n'appartient qu'à une famille. */
const FAMILY_DECORS: Record<string, Record<string, readonly string[]>> = {
  africa: {
    lion: ['africa_baobab', 'africa_desert', 'africa_canyon'],
    elephant: ['africa_pond', 'africa_acacia_plain', 'africa_forest'],
    giraffe: ['africa_waterhole', 'africa_plains', 'africa_green_meadow'],
  },
  north_america: {
    bear: ['na_redwoods', 'na_lake', 'na_bear_den'],
    bison: ['na_bison_prairie', 'na_bison_alpine', 'na_bison_canyon'],
    beaver: ['na_beaver_pond', 'na_redwood_trail', 'na_beaver_falls'],
  },
  south_america: {
    jaguar: ['sa_wetland', 'sa_river', 'sa_andes'],
    sloth: ['sa_sloth_canopy', 'sa_sloth_roots', 'sa_sloth_refuge'],
    toucan: ['sa_canopy_branch', 'sa_canopy_treehouse', 'sa_canopy_sunrise'],
  },
  antarctica: {
    polar_bear: ['ice_coast', 'an_ice_cave', 'an_snowfield'],
    seal: ['an_seal_aurora', 'an_seal_rocks', 'an_seal_sunset'],
    penguin: ['open_sea', 'an_aurora', 'an_penguin_cave'],
  },
  asia: {
    giant_panda: ['asia_bamboo', 'asia_garden', 'asia_pavilion'],
    tiger: ['asia_pagoda', 'asia_mountain', 'asia_jungle_falls'],
    snow_leopard: ['asia_snow_den', 'asia_snow_cave', 'asia_arch'],
  },
  europe: {
    fox: ['europe_fox_glade', 'europe_fox_autumn', 'europe_fox_snow'],
    owl: ['europe_owl_nest', 'europe_owl_moon', 'europe_owl_oak'],
    hedgehog: ['europe_hog_stream', 'europe_hog_lake', 'europe_hog_log'],
  },
  oceania: {
    kangaroo: ['oc_red_plain', 'oc_waterhole', 'oc_bush_coast'],
    koala: ['oc_eucalyptus', 'oc_gum_woodland', 'oc_rocky_cove'],
    frilled_lizard: ['oc_outback', 'oc_gorge', 'oc_beach'],
  },
};

/** Membres de la famille à leur place d'origine (bébés au plus grand stade : la place la plus large). */
function familyBoxes(speciesId: string, babies: number, placeId: string) {
  let fam = getFamily(newGameState(), speciesId);
  const sexes = ['girl', 'boy'] as const;
  for (let i = 0; i < babies; i++) {
    const r = createBaby(fam, sexes[i]!, i === 0 ? 'Mia' : 'Leo', `b${i + 1}`);
    if (!r.ok) throw new Error(r.error);
    fam = r.family;
  }
  fam = { ...fam, babies: fam.babies.map((b) => ({ ...b, stage: 'companion' as GrowthStage })) };
  const refs: ActorRef[] = [
    { speciesId, kind: 'adult', role: 'father' },
    { speciesId, kind: 'adult', role: 'mother' },
    ...fam.babies.map((b): ActorRef => ({ speciesId, kind: 'baby', babyId: b.id })),
  ];
  return refs.map((a) => ({ who: a.kind === 'adult' ? a.role : a.babyId, h: homePlacement(a, fam, PLACES[placeId]!.groundY, PLACES[placeId]!.lane) }));
}

/** Même règle que la piste d'empreintes (ecran.test.ts) : dans la silhouette, au-dessus des pieds.
 *  L'éléphant est bien plus large que haut : mesuré à l'écran, Papa occupe x 50–78 pour une hauteur de 44. */
const HALF_WIDTH: Record<string, number> = { elephant: 0.34 };
const onActor = (s: { x: number; y: number }, h: { x: number; y: number; h: number }, sp: string) =>
  Math.abs(s.x - h.x) < h.h * (HALF_WIDTH[sp] ?? 0.22) && s.y > h.y - h.h * 0.85 && s.y < h.y - 2;

function check(v: Variant, errors: string[]) {
  let place = v.script.biomeId;
  for (const s of v.script.steps as readonly QuestStep[]) {
    if (s.kind === 'travel') place = s.to;
    if (s.kind !== 'props') continue;
    const boxes = familyBoxes(v.species.id, v.config.babies.length, place);
    for (const x of s.show) {
      if (x.sky) continue;
      const spot = PLACES[place]!.spots[x.spot]!;
      for (const b of boxes) {
        if (onActor(spot, b.h, v.species.id)) errors.push(`${place} spot ${x.spot} (${spot.x},${spot.y}) sur ${b.who}`);
      }
    }
  }
}

for (const [continent, decors] of Object.entries(FAMILY_DECORS)) {
  const FAMILIES = Object.keys(decors);
  describe(`décors de chaque famille, ${continent} : rien n’est posé sur la famille`, () => {
    it('chaque famille joue dans ses 3 décors, et seulement ceux-là ; chaque décor a son image', () => {
      const got = Object.fromEntries(SPECIES.filter((sp) => sp.continentId === continent).map((sp) => [sp.id, [...sp.allowedBiomes].sort()]));
      expect(got).toEqual(Object.fromEntries(FAMILIES.map((f) => [f, [...decors[f]!].sort()])));
      const missing = Object.values(decors).flat().filter((p) => !PLACES[p]);
      expect(missing).toEqual([]);
    });
    it('aucun objet des histoires', () => {
      const errors: string[] = [];
      for (const v of adventureVariants(STRUCTURAL_CONFIGS)) if (FAMILIES.includes(v.species.id)) check(v, errors);
      expect([...new Set(errors)].sort()).toEqual([]);
    });
    it('aucun objet des jeux', () => {
      const errors: string[] = [];
      for (const v of activityVariants(STRUCTURAL_CONFIGS, FAMILIES.map(getSpecies))) check(v, errors);
      expect([...new Set(errors)].sort()).toEqual([]);
    });

    // La rive compte comme le bord (objets posés au bord de l'eau, comme au point d'eau vérifié à l'écran) :
    // un objet est « dans l'eau » s'il y est et que l'eau continue 5 points plus bas.
    it('dans l’eau, seulement ce qui vit ou pousse dans l’eau (poisson, canard, grenouille, fleur d’eau)', () => {
      const AQUATIC = new Set(['koi', 'fish', 'duck', 'frog', 'water_lily', 'lily_pad', 'lotus']);
      const errors = new Set<string>();
      const all = [...adventureVariants(STRUCTURAL_CONFIGS)].filter((v) => FAMILIES.includes(v.species.id));
      for (const v of [...all, ...activityVariants(STRUCTURAL_CONFIGS, FAMILIES.map(getSpecies))]) {
        let place = v.script.biomeId;
        for (const s of v.script.steps) {
          if (s.kind === 'travel') place = s.to;
          if (s.kind !== 'props') continue;
          for (const x of s.show) {
            if (x.sky) continue;
            const spot = PLACES[place]!.spots[x.spot]!;
            if (inWater(PLACES[place]!.water, spot.x, spot.y) && inWater(PLACES[place]!.water, spot.x, spot.y + 5) && !AQUATIC.has(x.prop)) errors.add(`${place} spot ${x.spot} ${x.prop}`);
          }
        }
      }
      expect([...errors].sort()).toEqual([]);
    });

    // Vu à l'écran (2026-11-23) : deux herbes du repas sous la bulle (plaine aux acacias), un oiseau à moitié
    // caché (forêt). La bulle va à gauche (x 1,5–59) ou à droite (x 41–98,5) ; avec deux lignes et le compteur,
    // elle monte jusqu'à ~66 % de la hauteur. Un objet occupe ~6 % de large et 10 % de haut au-dessus de son
    // point : pas plus d'un quart caché.
    it('aucun objet caché sous la bulle de dialogue', () => {
      const ZONES = { left: [1.5, 59], right: [41, 98.5] } as const;
      const errors = new Set<string>();
      const all = [...adventureVariants(STRUCTURAL_CONFIGS)].filter((v) => FAMILIES.includes(v.species.id));
      for (const v of [...all, ...activityVariants(STRUCTURAL_CONFIGS, FAMILIES.map(getSpecies))]) {
        let place = v.script.biomeId;
        const steps = v.script.steps as readonly QuestStep[];
        steps.forEach((s, k) => {
          if (s.kind === 'travel') place = s.to;
          if (s.kind !== 'props') return;
          // Vu à l'écran (prairie, « How many butterflies? ») : avec 3 ou 4 réponses à choisir, le panneau
          // monte jusqu'à ~44 % de la hauteur. Les objets restent affichés jusqu'à la question suivante.
          const next = steps.slice(k + 1).find((t) => t.kind === 'ask' || t.kind === 'props');
          const top = next?.kind === 'ask' && next.options.length >= 3 ? 44 : 66;
          const ground = s.show.filter((x) => !x.sky).map((x) => ({ x, spot: PLACES[place]!.spots[x.spot]! }));
          const [x0, x1] = ZONES[bubbleSide(ground.map((g) => g.spot))];
          for (const g of ground) {
            const w = Math.max(0, Math.min(g.spot.x + 3, x1) - Math.max(g.spot.x - 3, x0));
            const h = Math.max(0, g.spot.y - Math.max(g.spot.y - 10, top));
            if ((w * h) / 60 > 0.25) errors.add(`${place} spot ${g.x.spot} (${g.spot.x},${g.spot.y})${top < 66 ? ' sous les réponses' : ''}`);
          }
        });
      }
      expect([...errors].sort()).toEqual([]);
    });

    // Vu à l'écran (2026-11-23, forêt) : la cachette « derrière la grande feuille » posait le bébé derrière
    // Maman éléphant, donc invisible quand on le trouve. Une cachette (ou un endroit où l'on va) se voit.
    it('aucune cachette ni aucun point de rendez-vous derrière Papa ou Maman', () => {
      const errors = new Set<string>();
      const used = new Set<string>();
      const all = [...adventureVariants(STRUCTURAL_CONFIGS)].filter((v) => FAMILIES.includes(v.species.id));
      for (const v of [...all, ...activityVariants(STRUCTURAL_CONFIGS, FAMILIES.map(getSpecies))]) {
        let place = v.script.biomeId;
        for (const s of v.script.steps as readonly QuestStep[]) {
          if (s.kind === 'travel') place = s.to;
          if (s.kind === 'seek') used.add(`${v.species.id}|${place}|${s.hideAt}`);
          if (s.kind === 'moveTo') used.add(`${v.species.id}|${place}|${s.anchor}`);
        }
      }
      for (const key of used) {
        const [sp, place, id] = key.split('|') as [string, string, string];
        const stand = PLACES[place]!.anchors.find((a) => a.id === id)?.stand;
        if (!stand) continue;
        for (const b of familyBoxes(sp, 0, place)) if (onActor(stand, b.h, sp)) errors.add(`${place} ${id} (${stand.x},${stand.y}) derrière ${b.who}`);
      }
      expect([...errors].sort()).toEqual([]);
    });

    // Vu à l'écran (2026-11-23, prairie) : « Where is the path? » montrait un chemin presque tout entier sous la
    // bulle. Quand une zone est la cible, la bulle prend le côté qui la cache le moins : il doit en rester au
    // moins la moitié de visible.
    it('chaque zone à toucher reste visible à moitié au moins, la bulle placée au mieux', () => {
      const errors: string[] = [];
      const places = new Set(FAMILIES.flatMap((id) => getSpecies(id).allowedBiomes));
      for (const pid of places) {
        for (const a of PLACES[pid]!.anchors) {
          const r = a.hit;
          const part = (x0: number, x1: number) => {
            const w = Math.max(0, Math.min(r.x + r.w, x1) - Math.max(r.x, x0));
            const h = Math.max(0, Math.min(r.y + r.h, 100) - Math.max(r.y, 66));
            return (w * h) / (r.w * r.h);
          };
          const best = Math.min(part(1.5, 59), part(41, 98.5));
          if (best > 0.5) errors.push(`${pid} ${a.id} caché à ${Math.round(best * 100)} %`);
        }
      }
      expect(errors).toEqual([]);
    });

  });
}
