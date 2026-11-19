/**
 * Autocollant du jour : après la PREMIÈRE activité terminée d'une journée, l'enfant choisit un
 * autocollant parmi trois ; il est collé sur la carte du monde, sur le continent où elle jouait.
 *
 * Une petite récompense sans obligation : aucun compteur de jours, rien ne se perd si elle ne
 * joue pas. Le jour vient de l'horloge de l'appareil (seul usage du temps réel dans le jeu).
 */
import type { ContinentId } from '../content/types';
import { CONTINENTS } from '../content/world';
import { createRng, hashSeed } from './rng';
import type { GameState, PlacedSticker } from './state';

export interface StickerDef {
  id: string;
  icon: string;
  en: string;
  fr: string;
}

export const STICKERS: readonly StickerDef[] = [
  { id: 'star', icon: '⭐', en: 'a star', fr: 'une étoile' },
  { id: 'rainbow', icon: '🌈', en: 'a rainbow', fr: 'un arc-en-ciel' },
  { id: 'heart', icon: '❤️', en: 'a heart', fr: 'un cœur' },
  { id: 'flower', icon: '🌸', en: 'a flower', fr: 'une fleur' },
  { id: 'butterfly', icon: '🦋', en: 'a butterfly', fr: 'un papillon' },
  { id: 'sun', icon: '☀️', en: 'a sun', fr: 'un soleil' },
  { id: 'balloon', icon: '🎈', en: 'a balloon', fr: 'un ballon' },
  { id: 'ice_cream', icon: '🍦', en: 'an ice cream', fr: 'une glace' },
  { id: 'apple', icon: '🍎', en: 'an apple', fr: 'une pomme' },
  { id: 'shell', icon: '🐚', en: 'a shell', fr: 'un coquillage' },
  { id: 'crown', icon: '👑', en: 'a crown', fr: 'une couronne' },
  { id: 'rocket', icon: '🚀', en: 'a rocket', fr: 'une fusée' },
  { id: 'cake', icon: '🎂', en: 'a cake', fr: 'un gâteau' },
  { id: 'paw', icon: '🐾', en: 'a paw print', fr: 'une empreinte de patte' },
  { id: 'ladybird', icon: '🐞', en: 'a ladybird', fr: 'une coccinelle' },
  { id: 'moon', icon: '🌙', en: 'a moon', fr: 'une lune' },
];

/** Nombre d'autocollants gardés sur la carte (les plus anciens laissent la place). */
export const MAX_STICKERS = 40;

export function stickerDef(id: string): StickerDef | undefined {
  return STICKERS.find((s) => s.id === id);
}

/** Clé du jour, heure locale de l'appareil : « 2026-11-19 ». */
export function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Les trois autocollants proposés aujourd'hui, ou null si celui du jour a déjà été reçu. */
export function stickerOffer(state: GameState, today: string): StickerDef[] | null {
  if (state.player.stickerDay === today) return null;
  const rng = createRng(hashSeed(`${today}:${state.player.stickers.length}`));
  // on évite de reproposer les trois derniers choisis
  const recent = new Set(state.player.stickers.slice(-3).map((s) => s.id));
  const pool = STICKERS.filter((s) => !recent.has(s.id));
  return rng.shuffle(pool).slice(0, 3);
}

/**
 * Colle l'autocollant sur le continent (position déterministe à l'intérieur de sa zone de la carte,
 * loin des bords) et note le jour. Sans effet si l'autocollant du jour a déjà été reçu.
 */
export function placeSticker(state: GameState, stickerId: string, continentId: ContinentId, today: string): GameState {
  if (state.player.stickerDay === today || !stickerDef(stickerId)) return state;
  const c = CONTINENTS.find((x) => x.id === continentId);
  if (!c) return state;
  const rng = createRng(hashSeed(`${today}:${stickerId}:${state.player.stickers.length}`));
  const r = c.mapHit;
  const round = (v: number) => Math.round(v * 10) / 10;
  const placed: PlacedSticker = { id: stickerId, continentId, x: round(r.x + r.w * (0.2 + 0.6 * rng.next())), y: round(r.y + r.h * (0.25 + 0.5 * rng.next())) };
  return { ...state, player: { ...state.player, stickers: [...state.player.stickers, placed].slice(-MAX_STICKERS), stickerDay: today } };
}
