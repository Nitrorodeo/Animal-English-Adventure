import { weekWordChoice } from '../content/weekWord';
import { parseAlbum } from './photoAlbum';
import { parseNamePron } from './nameVoice';
import { parseSpots } from './spots';
import { parseGiftDay, parseGifts } from './gifts';
import { clampSpeechSpeed, newGameState, SAVE_ERA, SAVE_VERSION, type Baby, type CircleRef, type GameState } from './state';
import { GROWTH_STAGES } from '../content/types';
import { sanitizeName } from './family';

/** Adaptateur de stockage (localStorage dans le navigateur, mémoire en test). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const SAVE_KEY = 'aea.save';
export const CORRUPT_KEY = 'aea.save.corrupt';
/** partie d'avant la remise à zéro générale, gardée sur l'appareil (jamais effacée) */
export const OLD_ERA_KEY = 'aea.save.avant-remise-a-zero';

/** Partie d'avant la dernière remise à zéro générale (voir SAVE_ERA). */
export function fromOldEra(state: GameState): boolean {
  return state.era < SAVE_ERA;
}

/** Partie neuve qui garde ce qui n'est pas de la progression : le cercle d'amis et les réglages du parent. */
export function startOver(state: GameState): GameState {
  return { ...newGameState(), settings: state.settings, ...(state.circle ? { circle: state.circle } : {}) };
}

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

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function migrateSettings(base: GameState['settings'], raw: unknown): GameState['settings'] {
  // « voiceSpeed » (essai du 2026-11-18, 1 = vitesse des enregistrements) est abandonné.
  const { voiceSpeed: _old, ...s } = { ...base, ...(isObj(raw) ? (raw as Partial<GameState['settings']> & { voiceSpeed?: unknown }) : {}) };
  const { weekWord, micRepeat, snow, ...rest } = s;
  return {
    ...rest,
    speechSpeed: clampSpeechSpeed(s.speechSpeed),
    // mot de la semaine : seulement un mot des décors ; micro : seulement s'il a été allumé par le parent
    ...(weekWordChoice(typeof weekWord === 'string' ? weekWord : undefined) ? { weekWord } : {}),
    ...(micRepeat === true ? { micRepeat: true } : {}),
    // neige allumée au bouton ❄️ du décor ; absente = éteinte
    ...(snow === true ? { snow: true } : {}),
  };
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

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const counts = (v: unknown): Record<string, number> => {
  if (!isObj(v)) return {};
  const out: Record<string, number> = {};
  for (const [k, n] of Object.entries(v)) if (typeof n === 'number' && Number.isFinite(n)) out[k] = n;
  return out;
};
const PERSONALITIES = ['curious', 'playful', 'gentle', 'funny'] as const;
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/**
 * Champs de la joueuse relus un par un (audit du 2026-11-25, suite) : un historique contenant `null` ou un mot
 * d'un autre type faisait encore planter l'écran au démarrage (vu à l'écran : écran de secours « Oops! »).
 */
function parseItems(v: unknown): GameState['player']['items'] {
  const out: GameState['player']['items'] = {};
  if (!isObj(v)) return out;
  for (const [k, it] of Object.entries(v)) {
    if (isObj(it)) out[k] = { seen: num(it.seen), correctUnaided: num(it.correctUnaided), correctAided: num(it.correctAided), contexts: strings(it.contexts) };
  }
  return out;
}

function parseHistory(v: unknown): GameState['player']['history'] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((h) => {
    if (!isObj(h) || typeof h.archetypeId !== 'string' || typeof h.speciesId !== 'string' || typeof h.actorId !== 'string' || typeof h.mechanic !== 'string') return [];
    return [{ archetypeId: h.archetypeId, speciesId: h.speciesId, actorId: h.actorId, mechanic: h.mechanic, at: num(h.at), ...(typeof h.choice === 'string' ? { choice: h.choice } : {}) }];
  });
}

function parseWords(v: unknown): GameState['player']['words'] {
  const out: Record<string, string[]> = {};
  if (!isObj(v)) return out;
  for (const [k, w] of Object.entries(v)) if (Array.isArray(w)) out[k] = strings(w);
  return out as GameState['player']['words'];
}

/** Bébé relu champ par champ ; sans identifiant ni prénom il est écarté (rien à montrer). */
function parseBaby(v: unknown, familyId: string): Baby | null {
  if (!isObj(v) || typeof v.id !== 'string' || !v.id || typeof v.name !== 'string') return null;
  const likes = counts(v.likes);
  return {
    id: v.id,
    familyId: typeof v.familyId === 'string' ? v.familyId : familyId,
    name: v.name,
    sex: v.sex === 'boy' ? 'boy' : 'girl',
    birthOrder: v.birthOrder === 2 ? 2 : 1,
    stage: (GROWTH_STAGES as readonly unknown[]).includes(v.stage) ? (v.stage as Baby['stage']) : 'newborn',
    personality: (PERSONALITIES as readonly unknown[]).includes(v.personality) ? (v.personality as Baby['personality']) : 'curious',
    taughtWords: counts(v.taughtWords),
    retainedWords: strings(v.retainedWords),
    seenItems: strings(v.seenItems),
    activities: strings(v.activities),
    questMemory: strings(v.questMemory),
    milestones: strings(v.milestones),
    ...(isObj(v.likes) ? { likes } : {}),
  };
}

/** Prénoms donnés aux parents : relus avec les mêmes garde-fous que ceux des bébés. */
function parseParentNames(v: unknown): { parentNames?: GameState['families'][string]['parentNames'] } {
  if (!isObj(v)) return {};
  const out: Partial<Record<'father' | 'mother', string>> = {};
  for (const role of ['father', 'mother'] as const) {
    const raw = v[role];
    const r = typeof raw === 'string' ? sanitizeName(raw) : null;
    if (r?.ok) out[role] = r.name;
  }
  return Object.keys(out).length ? { parentNames: out } : {};
}

/**
 * Familles relues champ par champ : une famille abîmée (bébés absents, souvenirs d'un autre type…)
 * faisait planter l'écran au démarrage, à chaque rechargement (audit du 2026-11-25).
 */
function parseFamilies(raw: Record<string, unknown>): GameState['families'] {
  const out: GameState['families'] = {};
  for (const [key, v] of Object.entries(raw)) {
    if (!isObj(v)) continue;
    const pm = isObj(v.parentMemory) ? v.parentMemory : {};
    out[key] = {
      speciesId: typeof v.speciesId === 'string' ? v.speciesId : key,
      babies: (Array.isArray(v.babies) ? v.babies : []).map((b) => parseBaby(b, key)).filter((b): b is Baby => b !== null).slice(0, 2),
      memories: strings(v.memories),
      parentMemory: { father: strings(pm.father), mother: strings(pm.mother) },
      ...parseParentNames(v.parentNames),
    };
  }
  return out;
}

export function migrate(raw: unknown): GameState | null {
  if (!isObj(raw) || typeof raw.version !== 'number' || raw.version > SAVE_VERSION) return null;
  if (!isObj(raw.player) || !isObj(raw.families)) return null;
  const base = newGameState();
  const p = raw.player;
  const circle = parseCircleRef(raw.circle);
  return {
    version: SAVE_VERSION,
    era: num(raw.era),
    player: {
      name: typeof p.name === 'string' ? p.name : base.player.name,
      namePron: parseNamePron(p.namePron),
      items: parseItems(p.items),
      visitedContinents: strings(p.visitedContinents) as GameState['player']['visitedContinents'],
      history: parseHistory(p.history),
      activityCounter: num(p.activityCounter),
      treasures: Array.isArray(p.treasures) ? (p.treasures as string[]).filter((t) => typeof t === 'string') : [],
      adventuresDone: counts(p.adventuresDone),
      gamesDone: counts(p.gamesDone),
      placesVisited: strings(p.placesVisited) as GameState['player']['placesVisited'],
      words: parseWords(p.words),
      photos: Array.isArray(p.photos) ? (p.photos as unknown[]).filter((x): x is string => typeof x === 'string') : [],
      // anciens autocollants du jour retirés des parties : le cadeau du soir les remplace (« il reste les anciens stickers », 2026-11-24)
      stickers: [],
      stickerDay: typeof p.stickerDay === 'string' ? p.stickerDay : null,
      gifts: parseGifts(p.gifts),
      giftDay: parseGiftDay(p.gifts, p.giftDay),
      spots: parseSpots(p.spots),
      // album photo : absent tant qu'aucune photo n'est prise (une partie sans photo reste identique)
      ...(p.album !== undefined && Object.keys(parseAlbum(p.album)).length ? { album: parseAlbum(p.album) } : {}),
    },
    families: parseFamilies(raw.families),
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
    if (fromOldEra(state)) {
      // remise à zéro générale : l'ancienne partie est mise de côté sur l'appareil, le jeu repart de l'accueil
      try {
        storage.setItem(OLD_ERA_KEY, text);
        storage.removeItem(SAVE_KEY);
      } catch {
        /* stockage plein : la partie neuve remplacera l'ancienne */
      }
      return { state: startOver(state), status: 'new' };
    }
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

/**
 * Écran de secours (le jeu a planté) : la partie est mise de côté dans `aea.save.corrupt`
 * — jamais effacée — et le jeu repart d'une nouvelle partie. Renvoie false si rien n'a pu être fait.
 */
export function setAsideSave(storage: StorageLike): boolean {
  try {
    const text = storage.getItem(SAVE_KEY);
    if (text !== null) storage.setItem(CORRUPT_KEY, text);
    storage.removeItem(SAVE_KEY);
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
