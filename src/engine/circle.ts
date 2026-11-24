/**
 * Cercle d'amis (demande du parent, 2026-11-24) : « que ma fille voie la progression de ses amis, pas pour les
 * mettre en concurrence, juste pour les motiver » ; « à chaque nouvel enfant inscrit, un petit tableau de bord
 * très simple ».
 *
 * Chaque famille garde sa partie et son code de famille. Un second code, celui du CERCLE, est donné aux parents
 * des amis : chaque appareil y publie un tout petit résumé (prénom, étoiles, aventures), jamais la partie.
 * Pas de classement : ordre alphabétique, aucun « premier » ni « dernier », aucun message négatif.
 *
 * Ce fichier ne contient que les décisions (testées). Réseau : src/ui/useCircle.ts ; service :
 * cloud/worker.mjs (/v1/circle) ; écran : src/ui/Friends.tsx.
 */
import { DEFAULT_PLAYER_NAME } from '../audio/voiceKey';
import { itemStatus, type ItemStatus } from './skills';
import { isFamilyCode, newFamilyCode } from './cloud';
import type { StorageLike } from './save';
import type { GameState } from './state';

/** Ce que l'appareil retient du cercle. */
export interface CircleMeta {
  /** code du cercle ; null : cet appareil n'est dans aucun cercle */
  code: string | null;
  /** identifiant de cette famille dans le cercle (aléatoire, sans lien avec le code de famille) */
  id: string;
  /** amis dont la carte a déjà été vue : les autres sont « nouveaux » */
  seen: string[];
}

export const CIRCLE_META_KEY = 'aea.circle';
/** Délai avant l'envoi du résumé (le service gratuit compte les écritures). */
export const CIRCLE_DELAY_MS = 8000;
/** Au plus 12 enfants par cercle (même règle dans cloud/worker.mjs). */
export const CIRCLE_MAX_MEMBERS = 12;
export const MEMBER_ID_PATTERN = /^[a-z0-9]{8,32}$/;
const NAME_MAX = 20;

/** Le petit tableau de bord d'un enfant : deux chiffres, rien de plus. */
export interface Summary {
  name: string;
  stars: number;
  adventures: number;
}

export interface Friend extends Summary {
  id: string;
}

const STAR_VALUE: Record<ItemStatus, number> = { new: 0, recognised: 1, supported: 2, independent: 3 };

/** Étoiles du passeport (★ par mot : 1 reconnu, 2 avec aide, 3 seul) et aventures terminées. */
export function summaryOf(state: GameState): Summary {
  const stars = Object.values(state.player.items).reduce((sum, it) => sum + STAR_VALUE[itemStatus(it)], 0);
  const adventures = Object.values(state.player.adventuresDone).reduce((sum, n) => sum + (typeof n === 'number' && n > 0 ? n : 0), 0);
  return { name: state.player.name, stars, adventures };
}

/** Le résumé peut-il être publié ? Pas avant que l'enfant ait donné son prénom. */
export function publishable(s: Summary): boolean {
  return s.name.trim() !== '' && s.name !== DEFAULT_PLAYER_NAME;
}

/** Code de cercle proposé (« amis-lion-mango-4271 ») : le parent peut l'effacer et choisir le sien. */
export function newCircleCode(rand: () => number): string {
  return `amis-${newFamilyCode(rand)}`;
}

/** Identifiant de famille dans le cercle. `rand` : 0 ≤ x < 1. */
export function newMemberId(rand: () => number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 16; i++) id += chars[Math.floor(rand() * chars.length) % chars.length];
  return id;
}

export function readCircleMeta(storage: StorageLike): CircleMeta | null {
  try {
    const raw: unknown = JSON.parse(storage.getItem(CIRCLE_META_KEY) ?? 'null');
    if (typeof raw !== 'object' || raw === null) return null;
    const m = raw as Record<string, unknown>;
    const code = typeof m.code === 'string' && isFamilyCode(m.code) ? m.code : null;
    if (typeof m.id !== 'string' || !MEMBER_ID_PATTERN.test(m.id)) return null;
    const seen = Array.isArray(m.seen) ? m.seen.filter((x): x is string => typeof x === 'string' && MEMBER_ID_PATTERN.test(x)).slice(0, CIRCLE_MAX_MEMBERS * 4) : [];
    return { code, id: m.id, seen };
  } catch {
    return null;
  }
}

export function writeCircleMeta(storage: StorageLike, meta: CircleMeta): void {
  try {
    storage.setItem(CIRCLE_META_KEY, JSON.stringify(meta));
  } catch {
    /* stockage indisponible : le cercle se retrouvera avec le code */
  }
}

/** Un nombre entier raisonnable ; sinon 0. */
const count = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.min(Math.max(Math.floor(v), 0), 99999) : 0);

/** Texte court sans caractère de commande, ou null s'il est vide. */
export function cleanName(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
  return t === '' ? null : t;
}

/** Lit la réponse du service ; liste vide si elle est illisible. Un enfant au résumé invalide est ignoré. */
export function parseCircle(text: string | null | undefined): Friend[] {
  if (!text) return [];
  try {
    const raw: unknown = JSON.parse(text);
    const members = typeof raw === 'object' && raw !== null ? (raw as { members?: unknown }).members : null;
    if (!Array.isArray(members)) return [];
    const out: Friend[] = [];
    for (const m of members.slice(0, CIRCLE_MAX_MEMBERS)) {
      if (typeof m !== 'object' || m === null) continue;
      const r = m as Record<string, unknown>;
      const name = cleanName(r.name);
      if (typeof r.id !== 'string' || !MEMBER_ID_PATTERN.test(r.id) || name === null) continue;
      out.push({ id: r.id, name, stars: count(r.stars), adventures: count(r.adventures) });
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Les amis, sans moi, en ordre alphabétique : jamais trié par étoiles, pour que rien ne ressemble à un classement.
 */
export function friendsList(members: readonly Friend[], myId: string): Friend[] {
  return members.filter((f) => f.id !== myId).sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }) || a.id.localeCompare(b.id));
}

/** Amis dont la carte n'a pas encore été vue : ils portent la pastille « nouveau ». */
export function newFriendIds(friends: readonly Friend[], seen: readonly string[]): string[] {
  return friends.filter((f) => !seen.includes(f.id)).map((f) => f.id);
}

/** Marque toutes les cartes comme vues (à l'ouverture de l'écran des amis). */
export function markSeen(meta: CircleMeta, friends: readonly Friend[]): CircleMeta {
  const seen = [...new Set([...meta.seen, ...friends.map((f) => f.id)])].slice(-CIRCLE_MAX_MEMBERS * 4);
  return seen.length === meta.seen.length && seen.every((x, i) => x === meta.seen[i]) ? meta : { ...meta, seen };
}

/** Clé de comparaison : le résumé a-t-il changé depuis le dernier envoi ? */
export function summaryKey(s: Summary): string {
  return `${s.name}|${s.stars}|${s.adventures}`;
}

/** Corps envoyé au service. */
export function circleBody(id: string, s: Summary): string {
  return JSON.stringify({ id, name: s.name, stars: s.stars, adventures: s.adventures });
}
