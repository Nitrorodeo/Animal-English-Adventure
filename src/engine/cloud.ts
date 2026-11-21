/**
 * Partie partagée entre les appareils de la famille (version en ligne, demande du parent du 2026-11-21 :
 * « pouvoir s'y connecter du PC, de la tablette, du téléphone »).
 *
 * Un petit service en ligne (cloud/worker.mjs, Cloudflare) garde UNE partie par famille, rangée sous un
 * code de famille (ex. « lion-mango-4271 ») tapé une fois sur chaque appareil. Le serveur date chaque
 * envoi (son horloge, pas celle des appareils). Sans réseau, on joue normalement : la partie part dès
 * que la connexion revient.
 *
 * Ce fichier ne contient que les décisions (testées). Réseau : src/ui/useCloudSync.ts ;
 * écran du code : src/ui/FamilyGate.tsx.
 */
import { hasProgress } from './backup';
import { migrate, type StorageLike } from './save';
import type { GameState } from './state';

/** Ce que l'appareil retient du partage. */
export interface CloudMeta {
  /** code de famille, ou null : cet appareil joue seul (choix « seulement ici ») */
  code: string | null;
  /** date (serveur) de la version partagée que cet appareil a reçue ou envoyée en dernier */
  syncedAt: number;
  /** l'appareil a joué depuis : sa partie n'est pas encore partie au serveur */
  dirty: boolean;
}

export const CLOUD_META_KEY = 'aea.cloud';
/** Délai avant l'envoi : on groupe les changements (le service gratuit compte les écritures). */
export const CLOUD_DELAY_MS = 8000;
/** Taille maximale d'une partie envoyée (une vraie partie fait quelques Ko). */
export const CLOUD_MAX_BYTES = 1_000_000;

// mots connus du jeu, faciles à lire et à taper sur une tablette
const WORDS_A = [
  'lion', 'panda', 'tiger', 'zebra', 'koala', 'otter', 'whale', 'eagle', 'llama', 'camel', 'horse', 'sheep', 'mouse', 'goose', 'shark', 'snake',
  'bear', 'wolf', 'frog', 'duck', 'seal', 'deer', 'fox', 'owl', 'cat', 'dog', 'bee', 'ant', 'yak', 'emu', 'bat', 'cow',
] as const;
const WORDS_B = [
  'mango', 'apple', 'berry', 'lemon', 'melon', 'peach', 'plum', 'pear', 'cake', 'honey', 'river', 'cloud', 'star', 'moon', 'sun', 'rain',
  'snow', 'leaf', 'tree', 'rock', 'sand', 'wave', 'shell', 'flower', 'grass', 'hill', 'lake', 'nest', 'egg', 'seed', 'kite', 'drum',
] as const;

/** Nouveau code de famille : deux mots et quatre chiffres (≈ 10 millions de codes). `rand` : 0 ≤ x < 1. */
export function newFamilyCode(rand: () => number): string {
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length) % list.length]!;
  const digits = String(Math.floor(rand() * 10000) % 10000).padStart(4, '0');
  return `${pick(WORDS_A)}-${pick(WORDS_B)}-${digits}`;
}

/** Code tapé à la main : majuscules, accents, espaces ou soulignés à la place des tirets sont acceptés. */
export function normalizeFamilyCode(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[\s_.]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export const FAMILY_CODE_PATTERN = /^[a-z]{2,12}-[a-z]{2,12}-\d{4}$/;

export function isFamilyCode(code: string): boolean {
  return FAMILY_CODE_PATTERN.test(code);
}

/** Lit ce que l'appareil retient ; `null` si le partage n'a jamais été réglé ici. */
export function readCloudMeta(storage: StorageLike): CloudMeta | null {
  try {
    const raw: unknown = JSON.parse(storage.getItem(CLOUD_META_KEY) ?? 'null');
    if (typeof raw !== 'object' || raw === null) return null;
    const m = raw as Record<string, unknown>;
    const code = typeof m.code === 'string' && isFamilyCode(m.code) ? m.code : null;
    if (code === null && m.code !== null) return null;
    return { code, syncedAt: typeof m.syncedAt === 'number' && m.syncedAt >= 0 ? m.syncedAt : 0, dirty: m.dirty === true };
  } catch {
    return null;
  }
}

export function writeCloudMeta(storage: StorageLike, meta: CloudMeta): void {
  try {
    storage.setItem(CLOUD_META_KEY, JSON.stringify(meta));
  } catch {
    /* stockage indisponible : le partage reprendra à la prochaine ouverture */
  }
}

/** Partie reçue du serveur. */
export interface RemoteSave {
  savedAt: number;
  state: GameState;
}

/** Lit la réponse du serveur ; `null` si elle est illisible ou d'une version future du jeu. */
export function parseRemote(text: string | null | undefined): RemoteSave | null {
  if (!text) return null;
  try {
    const raw: unknown = JSON.parse(text);
    if (typeof raw !== 'object' || raw === null) return null;
    const { savedAt, state } = raw as { savedAt?: unknown; state?: unknown };
    if (typeof savedAt !== 'number' || !Number.isFinite(savedAt)) return null;
    const s = migrate(state);
    return s ? { savedAt, state: s } : null;
  } catch {
    return null;
  }
}

export type PullDecision = 'adopt' | 'push' | 'none';

/**
 * Après avoir demandé la partie partagée :
 * - rien au serveur → on y envoie la partie de cet appareil (premier appareil de la famille) ;
 * - cet appareil a joué sans pouvoir envoyer → sa partie est la plus récente, on l'envoie ;
 * - sinon, si un autre appareil a envoyé une version plus récente → on la reprend.
 * (La joueuse joue sur un appareil à la fois : en cas de doute, ce qu'elle vient de faire ici l'emporte.)
 */
export function decidePull(meta: CloudMeta, remote: RemoteSave | null): PullDecision {
  if (remote === null) return 'push';
  if (meta.dirty) return 'push';
  return remote.savedAt > meta.syncedAt ? 'adopt' : 'none';
}

/** En rejoignant une famille depuis un appareil qui a déjà une partie : faut-il prévenir avant de la remplacer ? */
export function joinReplacesProgress(local: GameState | null, remote: RemoteSave | null): boolean {
  return local !== null && remote !== null && hasProgress(local);
}

/** Corps envoyé au serveur ; `null` si la partie est trop grosse (ne devrait jamais arriver). */
export function pushBody(state: GameState): string | null {
  const body = JSON.stringify({ state });
  return body.length <= CLOUD_MAX_BYTES ? body : null;
}

/** Adresse du service, réglée à la construction (VITE_CLOUD_URL) ; `null` si le partage n'est pas installé. */
export function cloudUrl(env: Readonly<Record<string, unknown>>): string | null {
  const u = env.VITE_CLOUD_URL;
  if (typeof u !== 'string' || !/^https?:\/\/[^\s/]+\/?$/.test(u.trim())) return null;
  return u.trim().replace(/\/$/, '');
}
