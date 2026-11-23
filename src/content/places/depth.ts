import type { Rect } from '../types';

/**
 * Profondeur de chaque décor, mesurée sur l'image (planches quadrillées, 2026-11-20 ; demande du parent :
 * « il doit pouvoir aller quand même assez loin… les lions… complètement au fond du chemin »).
 * Tout est en % de la hauteur de la scène (16:9).
 *
 * - `horizonY` : ligne d'horizon du dessin (mer, pied des montagnes lointaines, fond de la plaine). Un animal
 *   rapetisse en proportion de sa distance à cette ligne (vraie perspective).
 * - `farY` : sol le plus au fond où l'on peut encore poser un animal (fond du chemin, bord de l'eau…). Sur les
 *   plages, c'est le bord de la mer, tracé point par point `[x, y]` : on ne pose pas un lézard dans l'océan.
 * - `perches` : dessus d'un gros rocher dessiné dans le décor, plus haut que `farY`, où l'on peut poser un
 *   petit animal (le lézard sur la grosse pierre de la plage). `base` = pied du rocher : l'animal posé dessus
 *   a la taille qu'il aurait au pied du rocher.
 */
export interface Perch extends Rect {
  base: number;
}

export interface PlaceDepth {
  horizonY: number;
  farY: number | [number, number][];
  perches?: Perch[];
  /** décor perché : bande de la branche `[x, fond, devant]` ; le seul endroit où se posent les pieds (toucans) */
  lane?: [number, number, number][];
  /** eau dessinée au sol (lac, rivière, mer devant) : polygones `[x, y]` en % ; on n'y pose aucun animal */
  water?: [number, number][][];
}

export type Water = readonly (readonly (readonly [number, number])[])[];

/** Le point (x, y), en % de la scène, est-il dans l'eau dessinée du décor (lac, rivière, mer devant) ? */
export function inWater(water: Water | undefined, x: number, y: number): boolean {
  for (const poly of water ?? []) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i]!;
      const [xj, yj] = poly[j]!;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}

export const PLACE_DEPTH: Record<string, PlaceDepth> = {
  // Afrique
  savanna: { horizonY: 31, farY: 35, // le chemin se perd vers y 41, la plaine continue jusqu'à 35
    water: [[[17, 52], [20, 49], [30, 49], [45, 50], [52, 52], [53, 57], [48, 61], [38, 64], [25, 63], [17, 60]]] }, // la mare sous la cascade
  africa_waterhole: { horizonY: 27, farY: 31, water: [[[27, 40], [35, 38], [50, 38], [65, 38], [72, 41], [74, 50], [70, 58], [60, 62], [45, 63], [35, 61], [28, 56], [26, 48]]] },
  africa_baobab: { horizonY: 52, farY: 56 },
  africa_desert: { horizonY: 33, farY: 36 },
  africa_canyon: { horizonY: 28, farY: 36 },
  africa_plains: { horizonY: 33, farY: 37 },
  // 2026-11-23 : décors de l'éléphant et de la girafe (images de Animaux/Afrique/, quadrillées à 5 %)
  africa_pond: { horizonY: 35, farY: 42, // pied des collines vers 35 ; l'herbe dorée derrière l'étang jusqu'à 42
    water: [[[18, 52], [24, 48], [30, 46], [45, 45], [60, 45], [70, 46], [80, 47], [88, 50], [90, 55], [85, 58], [75, 61], [60, 61.5], [45, 61], [35, 60], [25, 57]]] },
  africa_acacia_plain: { horizonY: 37, farY: 41 },
  africa_forest: { horizonY: 50, farY: 59 }, // la clairière s'arrête au pied des buissons (y 57-60)
  africa_green_meadow: { horizonY: 41, farY: 48 },
  // Antarctique
  ice_coast: { horizonY: 33, farY: 36, water: [[[0, 30], [30, 30], [60, 30], [88, 33], [95, 40], [80, 44], [72, 48], [70, 55], [60, 59], [45, 62], [30, 61], [18, 58], [10, 52], [0, 48]]] },
  an_ice_cave: { horizonY: 46, farY: 52 },
  an_snowfield: { horizonY: 35, farY: 38 },
  open_sea: { horizonY: 50, farY: 54, water: [[[10, 48], [30, 48], [60, 48], [90, 50], [97, 55], [88, 62], [85, 70], [70, 73], [50, 73], [30, 72], [18, 70], [12, 62]]] },
  an_aurora: { horizonY: 47, farY: 50 },
  // Antarctique : décors du phoque et du manchot (2026-11-23)
  an_seal_aurora: { horizonY: 36, farY: 40, water: [[[44, 40], [100, 40], [100, 68], [80, 68], [60, 64], [48, 58], [44, 50]]] },
  an_seal_rocks: { horizonY: 32, farY: 36, water: [[[44, 34], [100, 34], [100, 63], [80, 63], [65, 60], [45, 50]], [[24, 72], [40, 70], [57, 72], [58, 86], [45, 92], [26, 90]]] },
  an_seal_sunset: { horizonY: 38, farY: 42, water: [[[34, 40], [100, 40], [100, 70], [85, 70], [70, 66], [55, 62], [40, 57], [34, 52]]] },
  an_penguin_cave: { horizonY: 44, farY: 48, water: [[[40, 46], [100, 46], [100, 67], [80, 67], [60, 65], [44, 60], [40, 54]]] },
  // Asie
  asia_bamboo: { horizonY: 52, farY: 57, water: [[[20, 50], [30, 50], [40, 51], [46, 57], [42, 60], [30, 61], [22, 60]]] },
  asia_pagoda: { horizonY: 38, farY: 50, water: [[[18, 46], [30, 46], [45, 46], [52, 52], [45, 55], [30, 57], [20, 56]]] },
  asia_mountain: { horizonY: 35, farY: 58 },
  asia_arch: { horizonY: 45, farY: 52 },
  asia_garden: { horizonY: 42, farY: 58, water: [[[20, 48], [45, 47], [50, 52], [42, 57], [25, 58], [20, 55]]] },
  // tanière de la panthère des neiges (2026-11-21) : pied des montagnes et mer de nuages vers y 45 ; le sol va
  // jusqu'à l'entrée de la grotte (y 57) et au pied du grand rocher plat (y 62) ; à droite, le bord du bassin
  // turquoise. L'eau = la cascade (x 74–89, y 44–58) et le bassin (x 57–100, y 58–69).
  asia_snow_den: {
    horizonY: 45,
    farY: [[0, 57], [26, 57], [29, 62], [48, 62], [52, 60], [56, 61], [58, 64], [62, 65], [66, 66.5], [70, 68.5], [76, 69.5], [84, 69.5], [90, 68.5], [94, 68], [100, 67.5]],
    water: [[[57, 61], [60, 59.5], [67, 59], [71, 58], [73, 52], [74, 46], [76, 44], [89, 44], [89, 50], [87, 54], [84, 57.5], [82, 60], [86, 62], [90, 63.5], [100, 63.5], [100, 67], [94, 67.5], [90, 68], [84, 69], [76, 69], [70, 68], [66, 66], [60, 64], [57, 63]]],
  },
  // 2026-11-23 : les trois décors nouveaux de l'Asie (mesurés sur les images quadrillées)
  // pavillon rouge : la rivière sort de la petite chute sous le pont (x 50-62, y 65-75) et coule vers l'avant jusqu'au bas (x 55-78, y 76-90)
  asia_pavilion: { horizonY: 50, farY: 62, water: [[[50, 65], [62, 65], [64, 70], [70, 75], [78, 77], [78, 90], [72, 91], [68, 86], [65, 79], [56, 72]]] },
  // cascade de la jungle : bassin turquoise au pied de la chute (x 55-96, y 53-74) ; le sol de terre commence vers y 72
  asia_jungle_falls: { horizonY: 52, farY: 62, water: [[[55, 58], [72, 53], [88, 52], [95, 56], [96, 66], [88, 71], [78, 74], [66, 72], [55, 70]]] },
  // grotte enneigée : brume dans la vallée jusqu'à y 50, neige au premier plan, aucune eau
  asia_snow_cave: { horizonY: 42, farY: 58 },
  // Europe
  europe_forest: { horizonY: 40, farY: 52 },
  europe_alps: { horizonY: 38, farY: 42, water: [[[37, 42], [60, 41], [85, 42], [100, 44], [100, 52], [92, 56], [80, 58], [65, 58], [55, 56], [48, 52], [42, 47]]] },
  europe_coast: { horizonY: 47, farY: [[0, 70], [25, 68], [55, 68], [60, 64], [65, 58], [70, 53], [78, 52], [100, 62]] },
  europe_lake: { horizonY: 47, farY: 60, water: [[[12, 44], [80, 44], [78, 52], [70, 58], [55, 60], [35, 59], [25, 55], [15, 50]]] },
  europe_farm: { horizonY: 38, farY: 56, water: [[[70, 55], [86, 54], [86, 60], [95, 66], [93, 71], [80, 70], [68, 66], [66, 62]]] },
  // Amérique du Nord
  na_redwoods: { horizonY: 55, farY: 60 },
  na_prairie: { horizonY: 42, farY: 46 },
  na_lake: { horizonY: 52, farY: 68, water: [[[15, 48], [100, 48], [100, 62], [92, 68], [70, 72], [60, 77], [45, 77], [35, 73], [25, 66], [18, 58]]] },
  na_desert: { horizonY: 38, farY: 44 },
  na_coast: { horizonY: 44, farY: [[0, 57], [30, 58], [35, 60], [40, 63], [45, 65], [50, 66], [60, 69], [70, 70], [82, 72], [100, 72]] },
  // étang des castors (image retournée) : l'eau occupe la gauche jusqu'en bas ; la rive va de la bûche jusque
  // derrière la hutte (x 88–100, y 46–50)
  na_beaver_pond: { horizonY: 42, farY: [[0, 90], [45, 92], [50, 84], [56, 76], [62, 72], [72, 68], [80, 62], [85, 56], [88, 50], [100, 46]] },
  // sentier des séquoias : le chemin se perd vers x 55–65, y 58 ; à droite, le tas de bûches ferme le fond
  na_redwood_trail: { horizonY: 52, farY: [[0, 66], [20, 64], [30, 62], [45, 60], [55, 58], [65, 58], [75, 61], [85, 68], [100, 68]] },
  // 2026-11-23 : les décors des familles d'Amérique du Nord (tanière de l'ours, trois décors du bison, chutes du castor)
  na_bear_den: { horizonY: 40, farY: 58 },
  // le ruisseau du fond à droite, à gauche de la famille ; l'herbe commence sous les collines (y 47)
  na_bison_prairie: { horizonY: 47, farY: 50, water: [[[68, 58], [100, 58], [100, 70], [92, 72], [78, 72], [68, 66]]] },
  // la rivière aux rapides (droite) et le petit lac devant la forêt de sapins
  na_bison_alpine: { horizonY: 40, farY: 58, water: [[[55, 55], [100, 55], [100, 72], [92, 73], [75, 72], [62, 70], [55, 64]], [[38, 47], [52, 47], [52, 52], [40, 52]]] },
  // la rivière turquoise en méandre, du fond à la rive devant la famille
  na_bison_canyon: { horizonY: 45, farY: 60, water: [[[44, 57], [90, 56], [90, 70], [80, 75], [60, 76], [48, 70]]] },
  // le torrent au pied de la cascade ; la clairière de terre rouge commence vers y 60
  na_beaver_falls: { horizonY: 45, farY: 60, water: [[[28, 43], [78, 43], [78, 58], [60, 59], [40, 58], [28, 53]]] },
  // Océanie
  oc_outback: { horizonY: 47, farY: 50 },
  oc_eucalyptus: { horizonY: 52, farY: 60, water: [[[40, 64], [55, 63], [65, 56], [75, 55], [80, 58], [78, 64], [68, 70], [55, 71], [42, 69]]] },
  oc_gorge: { horizonY: 48, farY: 60, water: [[[33, 57], [50, 52], [70, 52], [78, 55], [70, 60], [60, 64], [48, 65], [36, 62]]] },
  // la grosse pierre ronde à gauche, au fond de la plage : dessus vers y 33–42, pied à y 50
  oc_beach: {
    horizonY: 45,
    farY: [[0, 51], [22, 52], [26, 56], [30, 60], [35, 63], [40, 66], [45, 69], [50, 72], [55, 74], [60, 76], [70, 80], [78, 82], [100, 84]],
    perches: [{ x: 14, y: 32, w: 15, h: 10, base: 50 }],
    // la mer jusqu'au bord des vagues, et le reflet mouillé en bas à droite
    water: [[[26, 52], [30, 48], [60, 47], [100, 47], [100, 62], [92, 66], [80, 70], [76, 74], [75, 80], [70, 82], [60, 78], [50, 70], [40, 64], [30, 58], [27, 55]]] },
  oc_fern_forest: { horizonY: 48, farY: 62, water: [[[12, 52], [32, 52], [33, 60], [30, 66], [42, 70], [55, 72], [60, 78], [60, 88], [65, 95], [65, 100], [10, 100], [10, 88], [15, 80], [12, 70], [14, 62]]] },
  // bois d'eucalyptus : la prairie dorée va jusqu'au pied des collines (y 59)
  oc_gum_woodland: { horizonY: 55, farY: 59 },
  // crique aux rochers (image retournée) : bord de la mer tracé point par point ; les gros rochers du fond
  // (dessus vers y 36–46, pied à y 50)
  oc_rocky_cove: {
    horizonY: 40,
    farY: [[0, 80], [25, 80], [30, 78], [40, 73], [50, 68], [60, 62], [66, 58], [70, 55], [75, 52], [85, 52], [100, 56]],
    perches: [{ x: 57, y: 36, w: 17, h: 10, base: 50 }] },
  // Amérique du Sud
  sa_jungle: { horizonY: 52, farY: 60 },
  sa_waterfall: { horizonY: 45, farY: 60, water: [[[22, 62], [40, 58], [55, 60], [65, 62], [75, 64], [72, 72], [65, 78], [55, 80], [40, 85], [30, 90], [15, 92], [2, 92], [0, 85], [5, 78], [8, 72], [18, 68]]] },
  sa_river: { horizonY: 45, farY: 50, water: [[[55, 52], [68, 45], [70, 40], [78, 40], [80, 46], [88, 50], [85, 56], [95, 62], [100, 64], [95, 72], [85, 78], [78, 85], [70, 85], [62, 82], [55, 80], [45, 78], [42, 72], [48, 66], [55, 60], [52, 56]]] },
  sa_andes: { horizonY: 50, farY: 56 },
  sa_wetland: { horizonY: 52, farY: 62, water: [[[12, 58], [30, 57], [50, 58], [50, 64], [42, 68], [30, 74], [20, 78], [8, 80], [4, 74], [10, 66]]] },
  // canopée (2026-11-21) : le sol est le dessus d'une grosse branche, bord arrière de l'écorce tracé point par point
  sa_canopy_branch: {
    horizonY: 38,
    farY: [[0, 55], [20, 54], [30, 57], [45, 59], [60, 60], [75, 60], [90, 57], [100, 56]],
    lane: [[20, 56, 66], [30, 57, 68], [40, 59, 69], [50, 60, 69], [60, 60, 69], [70, 60, 68], [80, 58, 66], [90, 57, 63], [96, 56, 61]] },
  sa_canopy_treehouse: {
    horizonY: 44,
    farY: [[0, 70], [30, 68], [38, 66], [45, 65], [60, 64], [68, 63], [80, 62], [90, 60], [100, 58]],
    lane: [[25, 70, 77], [35, 68, 77], [45, 67, 78], [55, 66, 78], [65, 66, 77], [75, 66, 75], [85, 64, 72], [91, 62, 69]] },
  sa_canopy_sunrise: {
    horizonY: 36,
    farY: [[0, 64], [18, 62], [30, 60], [40, 60], [50, 62], [60, 64], [70, 62], [78, 58], [85, 52], [92, 46], [100, 40]],
    lane: [[20, 66, 74], [28, 63, 72], [36, 62, 71], [45, 63, 70], [55, 66, 71], [65, 67, 72], [75, 64, 70], [82, 59, 66], [88, 54, 62], [94, 47, 56], [98, 43, 52]] },
  // paresseux (2026-11-23) : la branche moussue (la famille y marche, comme sur les branches du toucan), le pied des racines
  // géantes (rivière à droite) et le refuge au creux de l'arbre (bassin au pied de la cascade, ruisseau en bas à gauche)
  sa_sloth_canopy: {
    horizonY: 40,
    farY: [[0, 66], [20, 66], [30, 66], [44, 66], [60, 64], [74, 61], [88, 56], [100, 52]] },
  sa_sloth_roots: { horizonY: 50, farY: 62, water: [[[70, 50], [80, 49], [92, 52], [98, 56], [98, 62], [90, 63], [80, 62], [72, 60], [68, 55]]] },
  sa_sloth_refuge: {
    horizonY: 52,
    farY: 68,
    water: [
      [[8, 60], [22, 59], [40, 62], [42, 68], [38, 72], [28, 73], [12, 72], [8, 66]],
      [[22, 73], [42, 73], [46, 80], [44, 90], [40, 100], [22, 100], [18, 92], [20, 80]],
    ] },
};
