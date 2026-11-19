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
