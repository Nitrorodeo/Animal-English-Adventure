import type { Anchor } from '../content/types';

/**
 * Cache-cache (2026-11-24, « il est vraiment caché car je ne le vois pas ») : l'animal caché n'est plus invisible,
 * il dépasse à moitié du bord de sa cachette, tourné vers l'extérieur, comme un enfant qui regarde si on le cherche.
 *
 * `side` = côté où il dépasse (1 = à droite de la cachette, -1 = à gauche), et donc où il regarde ; jamais collé au cadre.
 * `y` = ses pieds : le sol devant la cachette (`stand`), sinon le bas de la cachette.
 */
export function peekSpot(a: Pick<Anchor, 'hit' | 'stand'>): { x: number; y: number; side: 1 | -1 } {
  const left = a.hit.x;
  const right = a.hit.x + a.hit.w;
  const y = a.stand?.y ?? a.hit.y + a.hit.h;
  // la zone à toucher est large (feuillage compris) : il se cache tout près de l'endroit où il réapparaîtra
  // (`stand`, au pied de la cachette), au plus PEEK_REACH plus loin, vers le bord le plus proche
  const from = a.stand?.x ?? a.hit.x + a.hit.w / 2;
  const toLeft = from - left <= right - from;
  let side: 1 | -1 = toLeft ? -1 : 1;
  let x = toLeft ? Math.max(left, from - PEEK_REACH) : Math.min(right, from + PEEK_REACH);
  if (x < 6 || x > 94) {
    side = side === 1 ? -1 : 1;
    x = side === 1 ? Math.min(right, from + PEEK_REACH) : Math.max(left, from - PEEK_REACH);
  }
  return { x: Math.min(94, Math.max(6, x)), y, side };
}

/** distance maximale (en % de la scène) entre sa cachette et l'endroit où il réapparaît */
export const PEEK_REACH = 6;
