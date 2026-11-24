import { dryNear, inWater, nearSeat, SEAT_REACH, snapToLane, snapToSeats, type Lane, type SeatLike, type Water } from '../game/staging';

/** Déplacement de la bulle de dialogue au doigt ou à la souris (fonctions pures, testées). */

export interface Offset {
  dx: number;
  dy: number;
}

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Distance (px) en dessous de laquelle un appui reste un simple toucher, pas un glisser. */
export const DRAG_THRESHOLD = 6;

/**
 * Décalage à appliquer à la bulle : décalage de départ + mouvement du doigt, borné pour que la bulle
 * (à sa place d'origine `base`, sans décalage) reste entière dans la scène (`bounds`).
 */
export function clampOffset(start: Offset, move: { x: number; y: number }, base: Box, bounds: Box): Offset {
  const clamp = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));
  return {
    dx: clamp(start.dx + move.x, bounds.left - base.left, bounds.right - base.right),
    dy: clamp(start.dy + move.y, bounds.top - base.top, bounds.bottom - base.bottom),
  };
}

export function isDrag(move: { x: number; y: number }): boolean {
  return Math.hypot(move.x, move.y) >= DRAG_THRESHOLD;
}

/** Personnage posé par la joueuse : x = milieu, y = pieds, h = hauteur, en % de la scène. */
export interface Spot {
  x: number;
  y: number;
  h: number;
  /** sens où il regarde à l'écran (1 = droite, -1 = gauche) ; absent = sens du dessin */
  f?: 1 | -1;
}

/**
 * Nouvelle place d'un animal déplacé au doigt, n'importe où dans le décor. `pointer` = doigt en % de la
 * scène ; `grabDy` = écart (en %) entre le doigt et les pieds au moment de la prise (l'animal ne saute
 * pas sous le doigt). Perspective : plus haut dans le décor = plus loin = plus petit (`scaleFor`).
 * L'animal reste entier dans la scène, et pas plus au fond que `minY` (sur le sol, pas dans le ciel)…
 * sauf sur le dessus d'un rocher (`perchAt` renvoie alors le pied du rocher : sa profondeur, donc sa taille).
 */
export function dragSpot(
  home: Spot,
  pointer: { x: number; y: number },
  grabDy: number,
  scaleFor: (fromY: number, toY: number) => number,
  minY: number | ((x: number) => number) = 0,
  perchAt?: (x: number, y: number) => number | undefined,
  lane?: Lane,
  water?: Water,
  seats?: { list: readonly SeatLike[]; naturalH: number; groundToo?: boolean },
  floes?: Water,
): Spot {
  // décor à percher (hiboux) : seulement sur le rocher, la branche ou un nid, l'endroit le plus proche du doigt ;
  // si le sol reste libre (chêne), seulement quand on le lâche tout près du nid
  if (seats?.list.length) {
    const feet = { x: pointer.x, y: pointer.y + grabDy };
    const on = seats.groundToo ? nearSeat(seats.list, seats.naturalH, feet.x, feet.y, SEAT_REACH) : snapToSeats(seats.list, seats.naturalH, feet.x, feet.y);
    if (on) {
      const { seat: _seat, ...spot } = on;
      return spot;
    }
  }
  // décor perché : on ne quitte jamais la branche (règle des toucans), et on garde sa taille
  if (lane) return snapToLane(lane, home, pointer.x, pointer.y + grabDy);
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const x = clamp(pointer.x, 3, 97);
  const settle = (raw: number) => {
    const base = perchAt?.(x, raw);
    const floor = typeof minY === 'number' ? minY : minY(x);
    const y = base === undefined ? Math.max(raw, Math.min(floor, 99.5)) : raw;
    return { y, h: home.h * scaleFor(home.y, base ?? y) };
  };
  let { y, h } = settle(clamp(pointer.y + grabDy, 0, 99.5));
  if (y < h + 1) {
    // tête hors du haut de la scène : on redescend jusqu'à ce qu'il tienne entier
    ({ y, h } = settle(Math.min(99.5, h + 1)));
    y = Math.max(y, h + 1);
  }
  // jamais dans l'eau d'un lac ou d'une rivière (sauf sur un rocher qui en sort) : sur la berge la plus proche
  if (inWater(water, x, y, floes) && perchAt?.(x, y) === undefined) {
    const dry = dryNear(water, x, y, (px) => (typeof minY === 'number' ? minY : minY(px)), floes);
    return { x: dry.x, y: dry.y, h: home.h * scaleFor(home.y, dry.y) };
  }
  return { x, y, h };
}

/**
 * Animal de la mer déplacé au doigt (2026-11-24) : coin haut-gauche de départ + mouvement du doigt (en % de la
 * scène), borné pour qu'il ne sorte pas de l'eau (au moins 70 % de sa largeur `w` reste visible).
 */
export function seaDragPos(start: { x: number; y: number }, move: { x: number; y: number }, w: number): { x: number; y: number } {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return { x: clamp(start.x + move.x, -w * 0.3, 100 - w * 0.7), y: clamp(start.y + move.y, -15, 75) };
}
