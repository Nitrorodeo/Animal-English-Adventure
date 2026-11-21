import type { GameState } from './state';

/**
 * Places des animaux posés au doigt dans les décors (demande du parent, 2026-11-20 : « chaque animal
 * reste à l'endroit où l'enfant l'a laissé, même le lendemain »). Sauvegardées avec la partie.
 * Clé : « lieu|personnage » ; x = milieu, y = pieds, h = hauteur, en % de la scène.
 */
export interface ActorSpot {
  x: number;
  y: number;
  h: number;
  /** sens où il regarde (1 = droite, -1 = gauche), gardé là où l'enfant l'a laissé */
  f?: 1 | -1;
}

export const spotKey = (placeId: string, actorId: string) => `${placeId}|${actorId}`;

const isNum = (v: unknown, lo: number, hi: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;

/** Lecture d'une sauvegarde : seules les places lisibles et dans le décor sont gardées. */
export function parseSpots(raw: unknown): Record<string, ActorSpot> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
  const out: Record<string, ActorSpot> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!k.includes('|') || typeof v !== 'object' || v === null) continue;
    const s = v as Record<string, unknown>;
    if (isNum(s.x, 0, 100) && isNum(s.y, 0, 100) && isNum(s.h, 0.5, 100)) out[k] = { x: s.x, y: s.y, h: s.h, ...(s.f === 1 || s.f === -1 ? { f: s.f } : {}) };
  }
  return out;
}

/** Pose un animal : nouvel état, la place est gardée dans la partie. */
export function placeActor(state: GameState, placeId: string, actorId: string, spot: ActorSpot): GameState {
  const key = spotKey(placeId, actorId);
  const r = (n: number) => Math.round(n * 100) / 100;
  const f = spot.f === 1 || spot.f === -1 ? { f: spot.f } : {};
  return { ...state, player: { ...state.player, spots: { ...state.player.spots, [key]: { x: r(spot.x), y: r(spot.y), h: r(spot.h), ...f } } } };
}
