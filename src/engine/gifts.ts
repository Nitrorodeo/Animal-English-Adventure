/**
 * Cadeau du soir (demande du parent, 2026-11-24) : après la première activité terminée d'une journée, le
 * personnage avec qui l'enfant jouait apporte trois paquets ; elle en ouvre un et pose l'objet du doigt dans le
 * décor de la famille. Il remplace l'autocollant du jour (les autocollants déjà collés restent sur la carte).
 *
 * - Un cadeau par jour au plus ; aucun compteur de jours, rien ne se perd si elle ne joue pas.
 * - Les trois paquets sont tirés parmi les objets qui ont du sens dans CE décor pour CETTE famille
 *   (pas de bonhomme de neige dans la savane, pas de cerf-volant dans la grotte de glace, seulement des petits
 *   objets sur une branche), sans redonner un objet que la famille a déjà.
 * - Un objet appartient à la famille : il la suit dans ses autres décors quand il y a du sens, avec une place
 *   gardée décor par décor (là où l'enfant l'a laissé).
 *
 * Les objets et leurs règles viennent de `content/gifts.json`, produit par `tools/cadeaux/exporter.py` à partir de
 * `tools/cadeaux/catalogue.json` ; les classes de décor reprennent `tools/cadeaux/carte.py`.
 */
import GIFTS_JSON from '../content/gifts.json';
import type { BiomeDef } from '../content/types';
import { createRng, hashSeed } from './rng';
import type { GameState } from './state';

export type PlaceClass = 'any' | 'outdoor' | 'warm' | 'cold' | 'trees' | 'water' | 'beach' | 'perched';

export interface GiftDef {
  id: string;
  /** mot anglais dit à l'ouverture, avec son article : « a kite » */
  en: string;
  fr: string;
  /** couleurs du dessin (questions « Is the kite red? ») */
  colors: string[];
  /** hauteur de l'objet en fraction de la hauteur du papa de la famille */
  h: number;
  /** classes de décor toutes requises */
  where: PlaceClass[];
  /** objet propre à une famille */
  species?: string;
  /**
   * objet qui se porte (`worn` : couronne, lunettes…) ou se tient (`held` : flûte, livre…) : absurde posé par terre,
   * donc pas offert tant que les animaux ne peuvent pas le porter ou s'en servir (essai de Westimmo, 2026-11-24).
   * `object` : ni un jouet ni un objet lié à l'animal (coffre au trésor, couverture, banc, tente…), sans intérêt pour
   * l'enfant ni pour la famille (« faut plutôt que ce soit des jouets ou des choses réellement en rapport avec
   * l'animal », Westimmo, 2026-11-24) : pas offert non plus.
   * Absent = jouet ou objet propre à l'animal, posé au sol, qui a du sens dans le décor sans que l'animal le tienne.
   */
  use?: 'worn' | 'held' | 'object';
  /** peut flotter sur l'eau */
  float?: boolean;
  /** largeur / hauteur de l'image */
  ratio: number;
}

export const GIFTS = GIFTS_JSON.gifts as GiftDef[];
/** sur une branche ou un perchoir : seulement des petits objets */
export const BRANCH_MAX_H: number = GIFTS_JSON.branchMaxH;

/** Place d'un objet dans un décor, en % de la scène : x = milieu, y = base. */
export interface GiftSpot {
  x: number;
  y: number;
}

/** Objet reçu par une famille ; `spots` : place gardée décor par décor. */
export interface OwnedGift {
  id: string;
  speciesId: string;
  spots: Record<string, GiftSpot>;
}

export function giftDef(id: string): GiftDef | undefined {
  return GIFTS.find((g) => g.id === id);
}

/** seul décor vraiment intérieur (les autres « grottes » sont des paysages avec une entrée, vérifié à l'œil) */
const INDOOR = new Set(['an_ice_cave']);
/** décors de neige ou de glace dont la météo dit autre chose */
const COLD_TOO = new Set(['ice_coast', 'open_sea', 'asia_snow_den', 'asia_snow_cave', 'europe_fox_snow', 'na_bear_den']);
const BEACH = new Set(['oc_bush_coast', 'oc_rocky_cove', 'oc_beach', 'an_seal_rocks', 'an_seal_sunset']);
const TREE_WORDS = ['tree', 'forest', 'bamboo', 'pine', 'oak', 'redwood', 'birch', 'fir', 'gum', 'acacia', 'baobab', 'eucalyptus', 'trunk', 'branch', 'aspen', 'spruce'];
const WATER_WORDS = new Set(['pond', 'lake', 'river', 'stream', 'sea', 'waterhole', 'water', 'torrent', 'basin', 'lagoon']);

/** Ce que le décor permet : froid ou chaud, dehors, arbres, eau, plage, perché. */
export function placeClasses(b: BiomeDef): Set<PlaceClass> {
  const words = b.anchors.map((a) => a.word.toLowerCase());
  const c = new Set<PlaceClass>(['any']);
  c.add(b.weather === 'cold' || b.weather === 'snowy' || COLD_TOO.has(b.id) ? 'cold' : 'warm');
  if (!INDOOR.has(b.id)) c.add('outdoor');
  if (words.some((w) => TREE_WORDS.some((t) => w.includes(t)))) c.add('trees');
  if ((b.water?.length ?? 0) > 0 || BEACH.has(b.id) || words.some((w) => WATER_WORDS.has(w))) c.add('water');
  if (BEACH.has(b.id)) c.add('beach');
  if ((b.lane?.length ?? 0) > 0 || ((b.seats?.length ?? 0) > 0 && !b.groundToo)) c.add('perched');
  return c;
}

/** L'objet a-t-il du sens pour cette famille dans ce décor ? */
export function giftAllowed(g: GiftDef, speciesId: string, b: BiomeDef): boolean {
  if (g.use) return false;
  if (g.species && g.species !== speciesId) return false;
  const cl = placeClasses(b);
  if (!g.where.every((w) => cl.has(w))) return false;
  return !(cl.has('perched') && g.h > BRANCH_MAX_H);
}

/** Les trois paquets de ce soir, ou null si le cadeau du jour est déjà reçu (ou s'il ne reste rien à offrir ici). */
/**
 * Seule une vraie activité apporte le cadeau du soir : la petite conversation de repli (« Do you want to play? »
 * → « Not now, thank you. ») n'en est pas une (audit du 2026-11-25).
 */
export function earnsGift(script: { archetypeId: string }): boolean {
  return script.archetypeId !== 'chat';
}

export function giftOffer(state: GameState, speciesId: string, b: BiomeDef, today: string): GiftDef[] | null {
  if (state.player.giftDay === today) return null;
  const owned = new Set(state.player.gifts.filter((g) => g.speciesId === speciesId).map((g) => g.id));
  const pool = GIFTS.filter((g) => !owned.has(g.id) && giftAllowed(g, speciesId, b));
  if (pool.length === 0) return null;
  const rng = createRng(hashSeed(`${today}:${speciesId}:${owned.size}`));
  // l'un des trois est, quand il en reste, un objet propre à la famille (la couronne des lions…)
  const own = rng.shuffle(pool.filter((g) => g.species === speciesId));
  const rest = rng.shuffle(pool.filter((g) => g.species !== speciesId));
  return rng.shuffle([...own.slice(0, 1), ...rest].slice(0, 3));
}

const round = (v: number) => Math.round(v * 100) / 100;

/** L'enfant a choisi son paquet : l'objet rejoint la famille, posé à `spot` dans ce décor, et le jour est noté. */
export function receiveGift(state: GameState, giftId: string, speciesId: string, placeId: string, spot: GiftSpot, today: string): GameState {
  if (state.player.giftDay === today || !giftDef(giftId)) return state;
  if (state.player.gifts.some((g) => g.id === giftId && g.speciesId === speciesId)) return state;
  const gift: OwnedGift = { id: giftId, speciesId, spots: { [placeId]: { x: round(spot.x), y: round(spot.y) } } };
  return { ...state, player: { ...state.player, gifts: [...state.player.gifts, gift], giftDay: today } };
}

/** L'enfant a déplacé l'objet du doigt : sa place dans ce décor est gardée. */
export function moveGift(state: GameState, giftId: string, speciesId: string, placeId: string, spot: GiftSpot): GameState {
  const i = state.player.gifts.findIndex((g) => g.id === giftId && g.speciesId === speciesId);
  if (i < 0) return state;
  const g = state.player.gifts[i]!;
  const gifts = [...state.player.gifts];
  gifts[i] = { ...g, spots: { ...g.spots, [placeId]: { x: round(spot.x), y: round(spot.y) } } };
  return { ...state, player: { ...state.player, gifts } };
}

/** Les objets de la famille visibles dans ce décor (ceux qui y ont du sens), dans l'ordre où ils ont été reçus. */
export function giftsHere(state: GameState, speciesId: string, b: BiomeDef): { def: GiftDef; spot?: GiftSpot }[] {
  const out: { def: GiftDef; spot?: GiftSpot }[] = [];
  for (const g of state.player.gifts) {
    if (g.speciesId !== speciesId) continue;
    const def = giftDef(g.id);
    if (def && giftAllowed(def, speciesId, b)) out.push({ def, spot: g.spots[b.id] });
  }
  return out;
}

const isNum = (v: unknown, lo: number, hi: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;

/** Lecture d'une sauvegarde : seuls les objets connus et les places lisibles sont gardés, sans doublon. */
/**
 * Jour du dernier cadeau, à la lecture de la sauvegarde. Si l'on a repris un objet qui n'est plus offert (essais du
 * 2026-11-24 : la couronne, le coffre au trésor du lion), le cadeau du jour est rendu : l'enfant rouvre des paquets aujourd'hui.
 */
export function parseGiftDay(rawGifts: unknown, rawDay: unknown): string | null {
  if (typeof rawDay !== 'string') return null;
  const tookBack = Array.isArray(rawGifts) && rawGifts.some((v) => typeof v === 'object' && v !== null && !!giftDef(String((v as { id?: unknown }).id))?.use);
  return tookBack ? null : rawDay;
}

export function parseGifts(raw: unknown): OwnedGift[] {
  if (!Array.isArray(raw)) return [];
  const out: OwnedGift[] = [];
  for (const v of raw) {
    if (typeof v !== 'object' || v === null) continue;
    const g = v as Record<string, unknown>;
    if (typeof g.id !== 'string' || typeof g.speciesId !== 'string' || !giftDef(g.id)) continue;
    // objet qui n'est plus offert, reçu pendant les essais (couronne, coffre au trésor…) : on le reprend
    if (giftDef(g.id)!.use) continue;
    if (out.some((o) => o.id === g.id && o.speciesId === g.speciesId)) continue;
    const spots: Record<string, GiftSpot> = {};
    if (typeof g.spots === 'object' && g.spots !== null && !Array.isArray(g.spots)) {
      for (const [k, s] of Object.entries(g.spots as Record<string, unknown>)) {
        const p = s as Record<string, unknown> | null;
        if (p && isNum(p.x, 0, 100) && isNum(p.y, 0, 100)) spots[k] = { x: p.x, y: p.y };
      }
    }
    out.push({ id: g.id, speciesId: g.speciesId, spots });
  }
  return out;
}
