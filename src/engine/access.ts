/**
 * Version en ligne du jeu (GitHub Pages, demande du parent du 2026-11-21) : un code est demandé au
 * premier lancement, une seule fois par appareil, pour qu'une personne tombée là par hasard n'entre pas.
 * Ce n'est pas une protection forte (le dépôt est public) : juste une porte fermée.
 *
 * Le code n'est pas écrit en clair : on compare son empreinte, sans tenir compte des majuscules,
 * des accents ni des espaces autour.
 *
 * Le jeu servi par l'ordinateur de la maison (npm run dev, Wi-Fi) ne demande rien et garde la copie de la
 * partie et les voix du prénom sur l'ordinateur. La version en ligne n'envoie rien à personne.
 */
import { hashSeed } from './rng';

/** Empreinte du code d'accès. */
export const ACCESS_HASH = 0xcbe1690d;
/** Clé du navigateur qui retient que l'appareil a déjà donné le bon code. */
export const ACCESS_KEY = 'aea.access';

export function normalizeCode(raw: string): string {
  return raw.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function accessHash(raw: string): number {
  return hashSeed(`aea-access:${normalizeCode(raw)}`);
}

export function isAccessCode(raw: string): boolean {
  return accessHash(raw) === ACCESS_HASH;
}

/** Ce que l'appareil garde une fois le bon code donné (l'empreinte, jamais le code). */
export function accessToken(): string {
  return ACCESS_HASH.toString(16);
}

export function hasAccess(stored: string | null): boolean {
  return stored === accessToken();
}

/** Réglages de construction utiles ici (import.meta.env). */
export type BuildEnv = Readonly<Record<string, unknown>>;

/** Version en ligne : construite par .github/workflows/deploy.yml avec VITE_STATIC_SITE=1. */
export function isStaticSite(env: BuildEnv): boolean {
  return env.VITE_STATIC_SITE === '1';
}
