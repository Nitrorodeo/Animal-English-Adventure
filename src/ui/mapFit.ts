/**
 * Taille de la carte du monde en plein écran (demande du parent, 2026-11-20 : « je veux qu'elle soit full
 * écran, je ne veux pas tes bords bleus sur le côté »).
 *
 * La carte remplit toujours tout l'écran, sans bande. Pour en couper le moins possible, elle peut être
 * légèrement étirée (au plus `maxStretch`, invisible à l'œil) ; ce qui dépasse encore se voit en faisant
 * glisser la carte au doigt (haut/bas sur un écran large, gauche/droite sur un écran en hauteur).
 */
/** carte élargie (continents écartés, scripts/map_wide.py) : 2:1, la forme des écrans larges et des tablettes */
export const MAP_RATIO = 2172 / 1086;
export const MAP_MAX_STRETCH = 1.12;

export interface MapFit {
  /** taille de la carte, en px */
  w: number;
  h: number;
}

export function mapFit(viewW: number, viewH: number, ratio = MAP_RATIO, maxStretch = MAP_MAX_STRETCH): MapFit {
  if (viewW <= 0 || viewH <= 0) return { w: Math.max(0, viewW), h: Math.max(0, viewH) };
  const screen = viewW / viewH;
  const target = Math.min(ratio * maxStretch, Math.max(ratio / maxStretch, screen));
  // écran plus large que la carte (même étirée) : toute la largeur, on fait défiler en hauteur
  if (screen >= target) return { w: viewW, h: Math.ceil(viewW / target - 1e-6) };
  // écran plus haut : toute la hauteur, on fait défiler en largeur
  return { w: Math.ceil(viewH * target - 1e-6), h: viewH };
}

/** Nom d'un continent : à sa place sur la carte, mais toujours à l'écran (carte plus haute que l'écran). */
export function labelY(y: number, seen: { top: number; bottom: number }): number {
  const span = seen.bottom - seen.top;
  return Math.min(seen.bottom - span * 0.07, Math.max(seen.top + span * 0.06, y));
}
