import type { ClipName } from './puppet';
import type { GrowthStage, Mobility, Rect } from '../content/types';
import { inWater, type Water } from '../content/places/depth';

export { inWater, type Water };

/** Durée d'un trajet dans le décor : la même que la transition CSS de `.char` (left / top). */
export const WALK_MS = 1600;

/** Animation de marionnette à jouer selon ce que fait le personnage. */
export function puppetClip(s: { walking: boolean; action?: string; speaking?: boolean; flies?: boolean }): ClipName {
  if (s.walking) return s.flies ? 'fly' : 'walk';
  if (s.action === 'walk' || s.action === 'sniff') return 'walk';
  if (s.action === 'drink_lap') return 'drink';
  if (s.speaking) return 'talk';
  return 'idle';
}

/** Les oiseaux (hibou, toucan) volent pour changer de place ; un oisillon nouveau-né ne vole pas encore. */
export function canFly(mobility: Mobility, stage?: GrowthStage): boolean {
  return mobility === 'fly' && stage !== 'newborn';
}

/**
 * Perspective : un personnage qui s'éloigne vers le fond du décor (plus haut à l'écran) rapetisse,
 * et grandit en revenant. `fromY` = sa place habituelle, `toY` = là où il va (en % de la scène).
 */
export function depthScale(fromY: number, toY: number): number {
  return Math.max(0.7, Math.min(1.15, 1 - (fromY - toY) * 0.012));
}

/**
 * Perspective du décor pour les animaux posés au doigt (demandes du parent, 2026-11-20 : « qu'on le rende
 * encore plus performant et adapté », puis « il doit pouvoir aller quand même assez loin… les lions…
 * complètement au fond du chemin »). Vraie perspective : la taille est proportionnelle à la distance à
 * l'horizon. Un animal à mi-chemin entre ses pieds habituels et l'horizon fait la moitié de sa taille.
 * `FARTHEST` = plus petite taille permise : tout au fond, il reste visible et on peut encore le reprendre.
 */
export const NEAREST = 1.3;
export const FARTHEST = 0.14;
/** décor sans mesure : on ne va pas plus loin qu'à cette taille (ancienne règle, prudente) */
const UNMEASURED_FAR = 0.42;

/** Ligne d'horizon du décor (en % de la hauteur) : mesurée sur le dessin, sinon estimée depuis le sol. */
export function horizonOf(groundY: number, measured?: number): number {
  return measured ?? Math.max(35, Math.min(62, groundY - 30));
}

/** Taille relative d'un animal posé en `y` (pieds), sa place habituelle étant `homeY`. */
export function groundScale(homeY: number, y: number, horizon: number): number {
  const span = Math.max(5, homeY - horizon);
  return Math.max(FARTHEST, Math.min(NEAREST, (y - horizon) / span));
}

/**
 * Point le plus au fond où l'on peut poser l'animal : le sol mesuré du décor (`far`), jamais dans le ciel.
 * Décor sans mesure : on reste prudent.
 */
export function farthestY(homeY: number, horizon: number, far?: number | readonly (readonly [number, number])[], x = 50): number {
  if (far !== undefined) return Math.min(farAt(far, x), homeY);
  return horizon + UNMEASURED_FAR * Math.max(5, homeY - horizon);
}

/**
 * Taille gardée au point le plus au fond où l'on peut poser l'animal. Demande du parent (2026-11-23, capture de la
 * cascade de la jungle : la tigresse au fond du chemin, minuscule à côté du papa) : « Les perspectives ne sont
 * vraiment pas bonnes… ils sont trop petits quand ils sont au fond, c'est pas logique ». Le calcul jusqu'à l'horizon
 * dessiné les réduisait à 15–25 % au bout du chemin : les décors peints tassent la profondeur, le fond du sol n'est
 * pas si loin. Au plus loin, un peu plus de la moitié de sa taille ; entre les deux, la taille diminue régulièrement.
 */
export const FAR_SIZE = 0.55;

/**
 * Horizon « ressenti » pour la taille : le plus haut de l'horizon dessiné et de celui qui donne `FAR_SIZE` au fond du
 * sol (`far`, sa partie la plus lointaine : la taille ne saute pas quand on glisse de côté). Décor sans mesure : le
 * fond prudent de `farthestY`.
 */
export function sizeHorizon(homeY: number, horizon: number, far?: number | readonly (readonly [number, number])[]): number {
  const back = far === undefined ? horizon + UNMEASURED_FAR * Math.max(5, homeY - horizon) : typeof far === 'number' ? far : Math.min(...far.map((p) => p[1]));
  const f = Math.min(back, homeY - 5);
  return Math.min(horizon, (f - FAR_SIZE * homeY) / (1 - FAR_SIZE));
}

/** Échelle d'un animal posé au doigt dans ce décor (même calcul dans le jeu et dans les tests). */
export function placeScale(place: { groundY: number; horizonY?: number; farY?: number | readonly (readonly [number, number])[] }, homeY: number): (fromY: number, toY: number) => number {
  const hz = sizeHorizon(homeY, horizonOf(place.groundY, place.horizonY), place.farY);
  return (from, to) => groundScale(from, to, hz);
}

/** Fond du sol à l'abscisse `x` : une hauteur unique, ou un bord tracé point par point (bord de la mer). */
export function farAt(far: number | readonly (readonly [number, number])[], x: number): number {
  if (typeof far === 'number') return far;
  const pts = [...far].sort((a, b) => a[0] - b[0]);
  if (x <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]!;
    const [x1, y1] = pts[i]!;
    if (x <= x1) return x1 === x0 ? y1 : y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);
  }
  return pts[pts.length - 1]![1];
}

/**
 * Décor perché (demande du parent, 2026-11-21 : « les toucans ne peuvent être déplacés que sur la branche, ils ne
 * peuvent pas être dans le vide… ils deviennent beaucoup trop petits sur la branche »). Le seul sol est le dessus de
 * la branche : `[x, fond, devant]` = pour cette abscisse, la bande de la branche où se posent les pieds (en %).
 * Pas de perspective sur une branche : l'animal garde sa taille (à peine plus petit au fond, plus grand devant).
 */
export type Lane = readonly (readonly [number, number, number])[];

/** Les petits écarts de taille entre le bord arrière et le bord avant de la branche. */
const LANE_SCALE_BACK = 0.94;
const LANE_SCALE_FRONT = 1.06;

/** Bande de la branche à l'abscisse `x` (bornée aux deux bouts de la branche). */
export function laneAt(lane: Lane, x: number): { x: number; back: number; front: number } {
  const pts = [...lane].sort((a, b) => a[0] - b[0]);
  const cx = Math.max(pts[0]![0], Math.min(pts[pts.length - 1]![0], x));
  let back = pts[0]![1];
  let front = pts[0]![2];
  for (let i = 1; i < pts.length; i++) {
    const [x0, b0, f0] = pts[i - 1]!;
    const [x1, b1, f1] = pts[i]!;
    if (cx <= x1) {
      const t = x1 === x0 ? 1 : (cx - x0) / (x1 - x0);
      back = b0 + (b1 - b0) * t;
      front = f0 + (f1 - f0) * t;
      break;
    }
    back = b1;
    front = f1;
  }
  return { x: cx, back, front };
}

/** Pose un animal sur la branche : l'abscisse et les pieds sont ramenés sur la bande, la taille suit la profondeur. */
export function snapToLane(lane: Lane, home: { h: number }, x: number, y: number): { x: number; y: number; h: number } {
  const L = laneAt(lane, x);
  const py = Math.max(L.back, Math.min(L.front, y));
  const t = L.front > L.back ? (py - L.back) / (L.front - L.back) : 0.5;
  return { x: L.x, y: py, h: home.h * (LANE_SCALE_BACK + (LANE_SCALE_FRONT - LANE_SCALE_BACK) * t) };
}

/** Milieu de la bande de la branche à l'abscisse `x` : là où se tient la famille au départ. */
export function laneMid(lane: Lane, x: number): { x: number; y: number } {
  const L = laneAt(lane, x);
  return { x: L.x, y: (L.back + L.front) / 2 };
}

/** Endroit où se percher : bande `[x, fond, devant, taille]` (voir `Seat` dans places/depth.ts). */
export interface SeatLike {
  id: string;
  band: readonly (readonly [number, number, number, number])[];
}

/** Bande et taille d'un endroit où se percher, à l'abscisse `x` (bornée aux deux bouts de l'endroit). */
export function seatAt(seat: SeatLike, x: number): { x: number; back: number; front: number; scale: number } {
  const pts = [...seat.band].sort((a, b) => a[0] - b[0]);
  const cx = Math.max(pts[0]![0], Math.min(pts[pts.length - 1]![0], x));
  let [, back, front, scale] = pts[0]!;
  for (let i = 1; i < pts.length; i++) {
    const [x0, b0, f0, s0] = pts[i - 1]!;
    const [x1, b1, f1, s1] = pts[i]!;
    if (cx <= x1) {
      const t = x1 === x0 ? 1 : (cx - x0) / (x1 - x0);
      back = b0 + (b1 - b0) * t;
      front = f0 + (f1 - f0) * t;
      scale = s0 + (s1 - s0) * t;
      break;
    }
    [, back, front, scale] = pts[i]!;
  }
  return { x: cx, back, front, scale };
}

/**
 * Décor à percher (hiboux) : l'animal lâché en (x, y) va sur l'endroit le plus proche du doigt (rocher, branche,
 * nid…), les pieds sur sa bande, à la taille de cet endroit (`naturalH` = sa taille normale au premier plan).
 */
export function snapToSeats(seats: readonly SeatLike[], naturalH: number, x: number, y: number): { x: number; y: number; h: number; seat: string } {
  return nearSeat(seats, naturalH, x, y)!;
}

/** Distance (en % de la largeur de la scène) en dessous de laquelle un animal lâché au sol se pose sur un endroit à percher. */
export const SEAT_REACH = 7;

/**
 * Comme `snapToSeats`, mais seulement si le doigt est à moins de `reach` d'un endroit (décor où le sol reste libre :
 * le nid du chêne). Sinon `undefined` : l'animal reste au sol.
 */
export function nearSeat(seats: readonly SeatLike[], naturalH: number, x: number, y: number, reach = Infinity): { x: number; y: number; h: number; seat: string } | undefined {
  let best: { x: number; y: number; h: number; seat: string; d: number } | undefined;
  for (const seat of seats) {
    const S = seatAt(seat, x);
    const py = Math.max(S.back, Math.min(S.front, y));
    // distance à l'écran (les % de hauteur valent 9/16 des % de largeur)
    const d = Math.hypot(S.x - x, ((py - y) * 9) / 16);
    if (!best || d < best.d) {
      const t = S.front > S.back ? (py - S.back) / (S.front - S.back) : 0.5;
      best = { x: S.x, y: py, h: naturalH * S.scale * (LANE_SCALE_BACK + (LANE_SCALE_FRONT - LANE_SCALE_BACK) * t), seat: seat.id, d };
    }
  }
  if (!best || best.d > reach) return undefined;
  const { d: _d, ...spot } = best;
  return spot;
}

/** Ce qu'il faut du décor pour savoir où un animal peut se poser en hauteur. */
export interface Perches {
  horizonY?: number;
  groundY: number;
  perches?: (Rect & { base: number })[];
  anchors?: readonly { id: string; hit: Rect; tags?: readonly string[] }[];
}

/** objets du décor sur lesquels on grimpe et qui posent sur le sol (pas les arbres : leur zone est le feuillage) */
const SOLID = new Set(['rock', 'stone', 'log', 'iceberg', 'ice', 'arch']);

/**
 * Animal posé sur un rocher (demande du parent : « je dois pouvoir le poser sur la Pierre ») : s'il est
 * lâché sur le dessus d'un gros rocher, renvoie le pied de ce rocher (sa profondeur : l'animal a la taille
 * qu'il aurait au pied du rocher, et on peut le poser plus haut que le sol). Sinon `undefined`.
 * Rochers mesurés (`perches`) et rochers « à escalader » du décor (moitié haute de leur zone).
 */
export function perchAt(place: Perches, x: number, y: number): number | undefined {
  const hz = horizonOf(place.groundY, place.horizonY);
  const tops: { x: number; y: number; w: number; h: number; base: number }[] = [...(place.perches ?? [])];
  for (const a of place.anchors ?? []) {
    const base = a.hit.y + a.hit.h;
    if (a.tags?.includes('climb') && SOLID.has(a.id) && base > hz + 2) tops.push({ x: a.hit.x, y: a.hit.y, w: a.hit.w, h: a.hit.h * 0.55, base });
  }
  let best: number | undefined;
  for (const t of tops) {
    if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h && y < t.base) best = Math.max(best ?? -1, t.base); // le plus proche devant
  }
  return best;
}


/**
 * Demande du parent : « il faut bien que les animaux soient posés sur la terre et pas au milieu de l'eau ».
 * Lâché dans un lac ou une rivière, l'animal va sur la berge la plus proche (pas plus au fond que `floor`).
 */
export function dryNear(water: Water | undefined, x: number, y: number, floor: (x: number) => number): { x: number; y: number } {
  if (!inWater(water, x, y)) return { x, y };
  let best: { x: number; y: number; d: number } | undefined;
  for (let px = 3; px <= 97; px += 0.5) {
    const top = Math.min(floor(px), 99.5);
    for (let py = top; py <= 99.5; py += 0.5) {
      if (inWater(water, px, py)) continue;
      const d = Math.hypot(px - x, (py - y) * (9 / 16));
      if (!best || d < best.d) best = { x: px, y: py, d };
    }
  }
  return best ?? { x, y };
}

/** Durée d'un trajet : vitesse de marche constante (un petit pas est court, une traversée plus longue). */
export function walkMs(dx: number, dy: number): number {
  const dist = Math.hypot(dx, dy * (9 / 16)); // en % de la largeur de la scène
  return Math.round(Math.max(450, Math.min(2600, 380 + dist * 48)));
}
