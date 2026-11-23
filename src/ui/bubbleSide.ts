/**
 * Côté de la bulle de dialogue. Elle est posée en bas à gauche du décor (x 1,5–59 %) ; quand ce qu'il
 * faut regarder ou toucher est dessous (sable, fleur, empreintes, objets à compter), elle passe en bas
 * à droite (x 41–98,5 %), si c'est mieux de ce côté-là.
 * Tout est en % du décor.
 */
export type Side = 'left' | 'right';
export interface Pt {
  x: number;
  y: number;
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** haut de la bulle quand elle est la plus grande (4 réponses sur deux rangées, aide française) */
export const BUBBLE_TOP = 48;
const LEFT = { x0: 1.5, x1: 59 };
const RIGHT = { x0: 41, x1: 98.5 };

/** Part d'un rectangle cachée par une bulle placée de ce côté (0 à 1). */
function hidden(r: Rect, z: { x0: number; x1: number }): number {
  const w = Math.max(0, Math.min(r.x + r.w, z.x1) - Math.max(r.x, z.x0));
  const h = Math.max(0, Math.min(r.y + r.h, 100) - Math.max(r.y, BUBBLE_TOP));
  return r.w > 0 && r.h > 0 ? (w * h) / (r.w * r.h) : 0;
}

/**
 * Choix du côté : on compte ce que chaque côté cacherait (un point compte pour 1, un rectangle pour la
 * part cachée). La cible de l'étape (`main`) compte triple. À égalité, la bulle reste à gauche.
 */
export function bubbleSide(points: readonly Pt[], main: readonly Rect[] = []): Side {
  // un objet est accroché par le bas : environ 6 % de large et 10 % de haut au-dessus de son point
  const box = (p: Pt): Rect => ({ x: p.x - 3, y: p.y - 10, w: 6, h: 10 });
  const cost = (z: { x0: number; x1: number }) =>
    points.reduce((s, p) => s + hidden(box(p), z), 0) + main.reduce((s, r) => s + 3 * hidden(r, z), 0);
  const l = cost(LEFT);
  return l > 0.05 && cost(RIGHT) < l ? 'right' : 'left';
}

/** Typographie française : espace insécable avant « ! ? : ; » (jamais de « ! » seul en début de ligne). */
export const frTypo = (s: string) => s.replace(/ ([!?:;»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');

/** Où se porte un habit sur le personnage. */
export type WornSlot = 'head' | 'eyes' | 'neck' | 'body' | 'hand' | 'feet';
const SLOTS: Readonly<Record<string, WornSlot>> = { hat: 'head', sunglasses: 'eyes', scarf: 'neck', coat: 'body', gloves: 'hand', umbrella: 'hand', boots: 'feet' };
export const wornSlot = (prop: string): WornSlot => SLOTS[prop] ?? 'head';

/** Le prénom sous les pieds sortirait du décor (pied du personnage à `y` %, étiquette ≈ 3,5 % de haut). */
export const nameInside = (y: number) => y > 95;
