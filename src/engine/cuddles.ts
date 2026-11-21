/**
 * Chatouilles et câlins : un appui long sur un personnage de la famille (hors activité).
 * Fonctions pures ; l'écran garde seulement le compteur pour faire tourner les phrases.
 */
import { CUDDLES } from '../content/utterances';

/** Durée de l'appui (ms) avant la réaction : un simple toucher ouvre toujours le menu. */
export const HOLD_MS = 550;

export interface CuddleLine {
  en: string;
  fr: string;
  icon: string;
}

/** Réaction n° n (0, 1, 2…) : les bébés rient, les parents font un câlin. */
export function cuddleLine(kind: 'baby' | 'adult', n: number): CuddleLine {
  const list = kind === 'baby' ? CUDDLES.baby : CUDDLES.parent;
  return list[((n % list.length) + list.length) % list.length]!;
}
