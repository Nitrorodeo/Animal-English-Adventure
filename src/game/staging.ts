import type { ClipName } from './puppet';

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
