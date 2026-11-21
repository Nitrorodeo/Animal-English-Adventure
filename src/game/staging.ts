import type { ClipName } from './puppet';
import type { Rect } from '../content/types';

/** Durée d'un trajet dans le décor : la même que la transition CSS de `.char` (left / top). */
export const WALK_MS = 1600;

/** Animation de marionnette à jouer selon ce que fait le personnage. */
export function puppetClip(s: { walking: boolean; action?: string; speaking?: boolean }): ClipName {
  if (s.walking) return 'walk';
  if (s.action === 'walk' || s.action === 'sniff') return 'walk';
  if (s.action === 'drink_lap') return 'drink';
  if (s.speaking) return 'talk';
  return 'idle';
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

/** Durée d'un trajet : vitesse de marche constante (un petit pas est court, une traversée plus longue). */
export function walkMs(dx: number, dy: number): number {
  const dist = Math.hypot(dx, dy * (9 / 16)); // en % de la largeur de la scène
  return Math.round(Math.max(450, Math.min(2600, 380 + dist * 48)));
}
