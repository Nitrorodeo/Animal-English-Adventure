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
}

export const PLACE_DEPTH: Record<string, PlaceDepth> = {
  // Afrique
  savanna: { horizonY: 31, farY: 35 }, // le chemin se perd vers y 41, la plaine continue jusqu'à 35
  africa_waterhole: { horizonY: 27, farY: 31 },
  africa_baobab: { horizonY: 52, farY: 56 },
  africa_desert: { horizonY: 33, farY: 36 },
  africa_canyon: { horizonY: 28, farY: 36 },
  africa_plains: { horizonY: 33, farY: 37 },
  // Antarctique
  ice_coast: { horizonY: 33, farY: 36 },
  an_ice_cave: { horizonY: 46, farY: 52 },
  an_snowfield: { horizonY: 35, farY: 38 },
  open_sea: { horizonY: 50, farY: 54 },
  an_aurora: { horizonY: 47, farY: 50 },
  // Asie
  asia_bamboo: { horizonY: 52, farY: 57 },
  asia_pagoda: { horizonY: 38, farY: 50 },
  asia_mountain: { horizonY: 35, farY: 58 },
  asia_arch: { horizonY: 45, farY: 52 },
  asia_garden: { horizonY: 42, farY: 58 },
  // Europe
  europe_forest: { horizonY: 40, farY: 52 },
  europe_alps: { horizonY: 38, farY: 42 },
  europe_coast: { horizonY: 47, farY: [[0, 70], [25, 68], [55, 68], [60, 64], [65, 58], [70, 53], [78, 52], [100, 62]] },
  europe_lake: { horizonY: 47, farY: 60 },
  europe_farm: { horizonY: 38, farY: 56 },
  // Amérique du Nord
  na_redwoods: { horizonY: 55, farY: 60 },
  na_prairie: { horizonY: 42, farY: 46 },
  na_lake: { horizonY: 52, farY: 68 },
  na_desert: { horizonY: 38, farY: 44 },
  na_coast: { horizonY: 44, farY: [[0, 57], [30, 58], [35, 60], [40, 63], [45, 65], [50, 66], [60, 69], [70, 70], [82, 72], [100, 72]] },
  // étang des castors (image retournée) : l'eau occupe la gauche jusqu'en bas ; la rive va de la bûche jusque
  // derrière la hutte (x 88–100, y 46–50)
  na_beaver_pond: { horizonY: 42, farY: [[0, 90], [45, 92], [50, 84], [56, 76], [62, 72], [72, 68], [80, 62], [85, 56], [88, 50], [100, 46]] },
  // sentier des séquoias : le chemin se perd vers x 55–65, y 58 ; à droite, le tas de bûches ferme le fond
  na_redwood_trail: { horizonY: 52, farY: [[0, 66], [20, 64], [30, 62], [45, 60], [55, 58], [65, 58], [75, 61], [85, 68], [100, 68]] },
  // Océanie
  oc_outback: { horizonY: 47, farY: 50 },
  oc_eucalyptus: { horizonY: 52, farY: 60 },
  oc_gorge: { horizonY: 48, farY: 60 },
  // la grosse pierre ronde à gauche, au fond de la plage : dessus vers y 33–42, pied à y 50
  oc_beach: {
    horizonY: 45,
    farY: [[0, 51], [22, 52], [26, 56], [30, 60], [35, 63], [40, 66], [45, 69], [50, 72], [55, 74], [60, 76], [70, 80], [78, 82], [100, 84]],
    perches: [{ x: 14, y: 32, w: 15, h: 10, base: 50 }] },
  oc_fern_forest: { horizonY: 48, farY: 62 },
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
  sa_waterfall: { horizonY: 45, farY: 60 },
  sa_river: { horizonY: 45, farY: 50 },
  sa_andes: { horizonY: 50, farY: 56 },
  sa_wetland: { horizonY: 52, farY: 62 },
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
};
