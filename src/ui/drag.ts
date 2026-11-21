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
): Spot {
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
  return { x, y, h };
}
