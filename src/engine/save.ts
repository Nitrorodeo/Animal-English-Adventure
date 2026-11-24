import { parseNamePron } from './nameVoice';
import { parseSpots } from './spots';
import { parseGiftDay, parseGifts } from './gifts';
import { toWideMap } from './stickers';
import { clampSpeechSpeed, newGameState, SAVE_VERSION, type CircleRef, type GameState, type PlacedSticker } from './state';

/** Adaptateur de stockage (localStorage dans le navigateur, mémoire en test). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const SAVE_KEY = 'aea.save';
export const CORRUPT_KEY = 'aea.save.corrupt';

export type LoadStatus = 'new' | 'loaded' | 'migrated' | 'corrupt';

export function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k]! : null),
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

const isPlacedSticker = (v: unknown): v is PlacedSticker =>
  isObj(v) && typeof v.id === 'string' && typeof v.continentId === 'string' && typeof v.x === 'number' && typeof v.y === 'number';

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function migrateSettings(base: GameState['settings'], raw: unknown): GameState['settings'] {
  // « voiceSpeed » (essai du 2026-11-18, 1 = vitesse des enregistrements) est abandonné.
  const { voiceSpeed: _old, ...s } = { ...base, ...(isObj(raw) ? (raw as Partial<GameState['settings']> & { voiceSpeed?: unknown }) : {}) };
  return { ...s, speechSpeed: clampSpeechSpeed(s.speechSpeed) };
}

/**
 * Migration vers le format courant. Les champs manquants reprennent leur valeur par défaut ;
 * une sauvegarde d'une version future ou sans joueuse est refusée (rien n'est écrasé à l'aveugle).
 */
/** Cercle d'amis gardé dans la partie ; mêmes règles que engine/cloud.ts (code) et engine/circle.ts (identifiant). */
function parseCircleRef(v: unknown): CircleRef | null {
  if (!isObj(v) || typeof v.code !== 'string' || typeof v.id !== 'string') return null;
  const codeOk = /^(?=.{4,40}$)[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.code);
  return codeOk && /^[a-z0-9]{8,32}$/.test(v.id) ? { code: v.code, id: v.id } : null;
}

export function migrate(raw: unknown): GameState | null {
  if (!isObj(raw) || typeof raw.version !== 'number' || raw.version > SAVE_VERSION) return null;
  if (!isObj(raw.player) || !isObj(raw.families)) return null;
  const base = newGameState();
  const p = raw.player;
  const circle = parseCircleRef(raw.circle);
  return {
    version: SAVE_VERSION,
    player: {
      name: typeof p.name === 'string' ? p.name : base.player.name,
      namePron: parseNamePron(p.namePron),
      items: isObj(p.items) ? (p.items as GameState['player']['items']) : {},
      visitedContinents: Array.isArray(p.visitedContinents) ? (p.visitedContinents as GameState['player']['visitedContinents']) : [],
      history: Array.isArray(p.history) ? (p.history as GameState['player']['history']) : [],
      activityCounter: typeof p.activityCounter === 'number' ? p.activityCounter : 0,
      treasures: Array.isArray(p.treasures) ? (p.treasures as string[]).filter((t) => typeof t === 'string') : [],
      adventuresDone: isObj(p.adventuresDone) ? (p.adventuresDone as Record<string, number>) : {},
      placesVisited: Array.isArray(p.placesVisited) ? (p.placesVisited as GameState['player']['placesVisited']) : [],
      words: isObj(p.words) ? (p.words as GameState['player']['words']) : {},
      photos: Array.isArray(p.photos) ? (p.photos as unknown[]).filter((x): x is string => typeof x === 'string') : [],
      stickers: Array.isArray(p.stickers) ? (p.stickers as unknown[]).filter(isPlacedSticker).map(toWideMap) : [],
      stickerDay: typeof p.stickerDay === 'string' ? p.stickerDay : null,
      gifts: parseGifts(p.gifts),
      giftDay: parseGiftDay(p.gifts, p.giftDay),
      spots: parseSpots(p.spots),
    },
    families: raw.families as GameState['families'],
    settings: migrateSettings(base.settings, raw.settings),
    onboarded: raw.onboarded === true,
    ...(circle ? { circle } : {}),
  };
}

export function loadGame(storage: StorageLike): { state: GameState; status: LoadStatus } {
  let text: string | null = null;
  try {
    text = storage.getItem(SAVE_KEY);
  } catch {
    return { state: newGameState(), status: 'new' };
  }
  if (text === null) return { state: newGameState(), status: 'new' };
  try {
    const raw: unknown = JSON.parse(text);
    const state = migrate(raw);
    if (!state) throw new Error('format');
    return { state, status: isObj(raw) && raw.version === SAVE_VERSION ? 'loaded' : 'migrated' };
  } catch {
    // on garde une copie de la sauvegarde illisible, puis on repart proprement
    try {
      storage.setItem(CORRUPT_KEY, text);
    } catch {
      /* stockage plein : tant pis pour la copie */
    }
    return { state: newGameState(), status: 'corrupt' };
  }
}

export function saveGame(storage: StorageLike, state: GameState): boolean {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function resetGame(storage: StorageLike): void {
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    /* rien */
  }
}
