import { GROWTH_STAGES, WEATHERS, type GrowthStage, type PlaceId, type Sex, type Weather } from '../content/types';
import { stickerDef } from './stickers';
import type { GameState } from './state';

/**
 * Album photo de la joueuse (demande du parent, 2026-11-25 : « un album photo qu'elle peut choisir par animaux et y
 * mettre autant de photos qu'elle veut. Mais il faut vraiment que les photos ne tiennent aucune place »).
 *
 * Une photo n'est PAS une image : c'est la description de la scène au moment du déclic (le décor, où était chaque
 * animal, dans quel sens, l'âge des bébés ce jour-là, les cadeaux posés). L'album la redessine avec les dessins du
 * jeu, déjà sur l'appareil. Écrite en abrégé dans la partie, une photo pèse environ 200 octets, contre 20 à 200 Ko
 * pour une vraie image : 100 photos pour chacun des animaux du jeu tiennent encore largement dans la sauvegarde.
 */

/** Nombre maximal de photos par famille (une famille = une espèce). */
export const ALBUM_MAX_PER_FAMILY = 100;

// --- forme rangée dans la partie (abrégée) -----------------------------------------------------------------------

/** animal : [qui, x, y, taille, sens, âge du bébé (0 à 3), sexe du bébé ('g' / 'b')] ; qui = 'f', 'm', 'b1', 'b2' */
export type ActorRec = [string, number, number, number, 1 | -1] | [string, number, number, number, 1 | -1, number, 'g' | 'b'];
/** cadeau posé : [objet, x, y, taille] */
export type GiftRec = [string, number, number, number];
export interface PhotoRec {
  /** date du déclic (ms), unique dans la famille : sert aussi d'identifiant */
  t: number;
  /** décor */
  p: PlaceId;
  a: ActorRec[];
  g?: GiftRec[];
  /** prise pendant le « Good night » */
  n?: 1;
  /** météo du jour (rang dans WEATHERS), quand il ne faisait pas simplement beau */
  w?: number;
  /** photo d'anniversaire du bébé né en 1er ou 2e (prise toute seule quand il grandit) */
  b?: 1 | 2;
  /** autocollants collés sur la photo : 6 caractères chacun, code + x + y en % (« he5030 » = cœur au milieu) */
  s?: string;
  /** taille de chaque autocollant, un chiffre par autocollant (rang dans STICKER_SIZES) ; absent = tous à la taille normale */
  z?: string;
}
/** album rangé par famille (espèce) */
export type AlbumRec = Record<string, PhotoRec[]>;

// --- forme lisible, pour le jeu ----------------------------------------------------------------------------------

export interface SnapActor {
  /** « father », « mother », ou « baby » avec son rang de naissance */
  who: 'father' | 'mother' | 'baby';
  birthOrder?: 1 | 2;
  x: number;
  y: number;
  h: number;
  /** sens où il regarde (1 = droite) */
  f: 1 | -1;
  /** bébé : son âge et son sexe au moment de la photo (il reste petit sur la photo, même s'il a grandi depuis) */
  stage?: GrowthStage;
  sex?: Sex;
}

export interface SnapGift {
  id: string;
  x: number;
  y: number;
  h: number;
}

export interface Photo {
  /** « espèce:date » */
  id: string;
  t: number;
  sp: string;
  p: PlaceId;
  a: SnapActor[];
  g: SnapGift[];
  night: boolean;
  /** météo du jour ; null = beau temps (ou photo d'avant la météo) */
  weather: Weather | null;
  /** anniversaire du bébé né en 1er ou 2e */
  birthday: 1 | 2 | null;
  stickers: PhotoSticker[];
}

export interface PhotoSticker {
  id: string;
  icon: string;
  x: number;
  y: number;
  /** rang de taille dans STICKER_SIZES (STICKER_SIZE_DEFAULT = taille normale) */
  size: number;
}

/** Ce que le décor donne au moment du déclic (positions déjà calculées à l'écran). */
export interface Shot {
  sp: string;
  p: PlaceId;
  a: SnapActor[];
  g: SnapGift[];
  night?: boolean;
  weather?: Weather;
  birthday?: 1 | 2;
}

/** Autocollants qu'on peut coller sur une photo (ceux de la carte du monde, dits à voix haute par say.sticker). */
export const PHOTO_STICKERS = ['heart', 'star', 'rainbow', 'flower', 'butterfly', 'crown', 'balloon', 'sun'] as const;
/** au plus 6 autocollants par photo : la photo reste lisible, et légère */
export const PHOTO_STICKERS_MAX = 6;
const STICKER_CODE: Readonly<Record<string, string>> = { heart: 'he', star: 'st', rainbow: 'rb', flower: 'fl', butterfly: 'bf', crown: 'cr', balloon: 'ba', sun: 'su' };
const CODE_STICKER: Readonly<Record<string, string>> = Object.fromEntries(Object.entries(STICKER_CODE).map(([k, v]) => [v, k]));
const pct = (v: number) => String(Math.max(0, Math.min(99, Math.round(v)))).padStart(2, '0');

/** tailles possibles d'un autocollant (facteur de la taille normale), du plus petit au plus grand */
export const STICKER_SIZES = [0.5, 0.7, 1, 1.35, 1.8, 2.4] as const;
export const STICKER_SIZE_DEFAULT = 2;

interface StickRec {
  code: string;
  x: string;
  y: string;
  z: number;
}

/** autocollants d'une photo enregistrée (les tailles absentes ou illisibles valent la taille normale) */
function readStickers(s: string | undefined, z: string | undefined): StickRec[] {
  const out: StickRec[] = [];
  for (let i = 0; s && i + 6 <= s.length; i += 6) {
    const code = s.slice(i, i + 2);
    const x = s.slice(i + 2, i + 4);
    const y = s.slice(i + 4, i + 6);
    if (!CODE_STICKER[code] || !/^\d\d$/.test(x) || !/^\d\d$/.test(y)) continue;
    const k = Number(z?.[i / 6]);
    out.push({ code, x, y, z: Number.isInteger(k) && k >= 0 && k < STICKER_SIZES.length ? k : STICKER_SIZE_DEFAULT });
  }
  return out.slice(0, PHOTO_STICKERS_MAX);
}

/** réécrit les autocollants d'une photo ; rien n'est gardé quand il n'y en a plus, ni les tailles quand toutes sont normales */
function withStickers(r: PhotoRec, list: readonly StickRec[]): PhotoRec {
  const { s: _s, z: _z, ...rest } = r;
  if (!list.length) return rest;
  const z = list.some((k) => k.z !== STICKER_SIZE_DEFAULT) ? list.map((k) => k.z).join('') : '';
  return { ...rest, s: list.map((k) => k.code + k.x + k.y).join(''), ...(z ? { z } : {}) };
}

function decodeStickers(s: string | undefined, z: string | undefined): PhotoSticker[] {
  const out: PhotoSticker[] = [];
  for (const k of readStickers(s, z)) {
    const def = stickerDef(CODE_STICKER[k.code]!);
    if (def) out.push({ id: def.id, icon: def.icon, x: Number(k.x), y: Number(k.y), size: k.z });
  }
  return out;
}

/** arrondi au dixième : la précision de l'écran, et des nombres courts */
const r1 = (v: number) => Math.round(v * 10) / 10;

function encodeActor(a: SnapActor): ActorRec {
  const k = a.who === 'father' ? 'f' : a.who === 'mother' ? 'm' : `b${a.birthOrder ?? 1}`;
  const f: 1 | -1 = a.f === -1 ? -1 : 1;
  const head: [string, number, number, number, 1 | -1] = [k, r1(a.x), r1(a.y), r1(a.h), f];
  return a.who === 'baby' && a.stage && a.sex ? [...head, GROWTH_STAGES.indexOf(a.stage), a.sex === 'girl' ? 'g' : 'b'] : head;
}

function decodeActor(r: ActorRec): SnapActor {
  const [k, x, y, h, f, st, sx] = r;
  if (k === 'f' || k === 'm') return { who: k === 'f' ? 'father' : 'mother', x, y, h, f };
  return { who: 'baby', birthOrder: k === 'b2' ? 2 : 1, x, y, h, f, ...(st !== undefined ? { stage: GROWTH_STAGES[st], sex: sx === 'g' ? ('girl' as const) : ('boy' as const) } : {}) };
}

const decode = (sp: string, r: PhotoRec): Photo => ({
  id: `${sp}:${r.t}`,
  t: r.t,
  sp,
  p: r.p,
  a: r.a.map(decodeActor),
  g: (r.g ?? []).map(([id, x, y, h]) => ({ id, x, y, h })),
  night: r.n === 1,
  weather: r.w !== undefined ? (WEATHERS[r.w] ?? null) : null,
  birthday: r.b ?? null,
  stickers: decodeStickers(r.s, r.z),
});

const albumOf = (state: GameState): AlbumRec => state.player.album ?? {};

/** Photos d'une famille, la plus récente d'abord. */
export function familyPhotos(state: GameState, speciesId: string): Photo[] {
  return (albumOf(state)[speciesId] ?? []).map((r) => decode(speciesId, r)).sort((a, b) => b.t - a.t);
}

/** Familles qui ont au moins une photo, avec leur nombre de photos. */
export function albumFamilies(state: GameState): { speciesId: string; count: number }[] {
  return Object.entries(albumOf(state))
    .filter(([, list]) => list.length > 0)
    .map(([speciesId, list]) => ({ speciesId, count: list.length }));
}

const sameScene = (a: PhotoRec, b: PhotoRec) => a.p === b.p && !!a.n === !!b.n && a.w === b.w && a.b === b.b && JSON.stringify([a.a, a.g ?? []]) === JSON.stringify([b.a, b.g ?? []]);

export type TakeResult = { ok: true; state: GameState; photo: Photo } | { ok: false; reason: 'full' | 'same' };

/**
 * Le déclic : la scène est rangée dans l'album de la famille. Refusé si la famille a déjà 100 photos (« full »), ou
 * si rien n'a bougé depuis la photo précédente (« same » : dix appuis de suite ne font pas dix photos identiques).
 */
export function takePhoto(state: GameState, shot: Shot, now: number): TakeResult {
  const album = albumOf(state);
  const list = album[shot.sp] ?? [];
  if (list.length >= ALBUM_MAX_PER_FAMILY) return { ok: false, reason: 'full' };
  let t = Math.round(now);
  while (list.some((r) => r.t === t)) t++;
  const g = shot.g.map((x): GiftRec => [x.id, r1(x.x), r1(x.y), r1(x.h)]);
  const w = shot.weather && shot.weather !== 'sunny' ? WEATHERS.indexOf(shot.weather) : -1;
  const rec: PhotoRec = { t, p: shot.p, a: shot.a.map(encodeActor), ...(g.length ? { g } : {}), ...(shot.night ? { n: 1 as const } : {}), ...(w >= 0 ? { w } : {}), ...(shot.birthday ? { b: shot.birthday } : {}) };
  const last = list.reduce<PhotoRec | undefined>((m, r) => (!m || r.t > m.t ? r : m), undefined);
  if (last && sameScene(last, rec)) return { ok: false, reason: 'same' };
  return { ok: true, photo: decode(shot.sp, rec), state: { ...state, player: { ...state.player, album: { ...album, [shot.sp]: [...list, rec] } } } };
}

/** Retirer une photo de l'album (identifiant « espèce:date »). */
export function deletePhoto(state: GameState, id: string): GameState {
  const cut = id.lastIndexOf(':');
  const sp = id.slice(0, cut);
  const t = Number(id.slice(cut + 1));
  const album = albumOf(state);
  const list = album[sp];
  if (!list?.some((r) => r.t === t)) return state;
  return { ...state, player: { ...state.player, album: { ...album, [sp]: list.filter((r) => r.t !== t) } } };
}

/** change une photo de l'album (identifiant « espèce:date ») ; absente : rien ne change */
function updatePhoto(state: GameState, id: string, fn: (r: PhotoRec) => PhotoRec | null): GameState {
  const cut = id.lastIndexOf(':');
  const sp = id.slice(0, cut);
  const t = Number(id.slice(cut + 1));
  const album = albumOf(state);
  const list = album[sp];
  const i = list?.findIndex((r) => r.t === t) ?? -1;
  if (!list || i < 0) return state;
  const next = fn(list[i]!);
  if (!next) return state;
  return { ...state, player: { ...state.player, album: { ...album, [sp]: list.map((r, k) => (k === i ? next : r)) } } };
}

/** Coller un autocollant sur une photo (x, y en % de la photo) ; refusé au-delà de 6. */
export function stickOnPhoto(state: GameState, id: string, stickerId: string, x: number, y: number): GameState {
  const code = STICKER_CODE[stickerId];
  if (!code) return state;
  return updatePhoto(state, id, (r) => {
    const list = readStickers(r.s, r.z);
    return list.length >= PHOTO_STICKERS_MAX ? null : withStickers(r, [...list, { code, x: pct(x), y: pct(y), z: STICKER_SIZE_DEFAULT }]);
  });
}

/** Déplacer l'autocollant n° `index` (x, y en % de la photo). */
export function moveSticker(state: GameState, id: string, index: number, x: number, y: number): GameState {
  return updatePhoto(state, id, (r) => {
    const list = readStickers(r.s, r.z);
    const k = list[index];
    if (!k || (k.x === pct(x) && k.y === pct(y))) return null;
    return withStickers(r, list.map((o, i) => (i === index ? { ...o, x: pct(x), y: pct(y) } : o)));
  });
}

/** Agrandir (+1) ou rapetisser (-1) l'autocollant n° `index`, dans les tailles de STICKER_SIZES. */
export function resizeSticker(state: GameState, id: string, index: number, step: number): GameState {
  return updatePhoto(state, id, (r) => {
    const list = readStickers(r.s, r.z);
    const k = list[index];
    const z = k ? Math.max(0, Math.min(STICKER_SIZES.length - 1, k.z + Math.sign(step))) : -1;
    if (!k || z === k.z) return null;
    return withStickers(r, list.map((o, i) => (i === index ? { ...o, z } : o)));
  });
}

/** Décoller l'autocollant n° `index` d'une photo. */
export function unstickPhoto(state: GameState, id: string, index: number): GameState {
  return updatePhoto(state, id, (r) => {
    const list = readStickers(r.s, r.z);
    if (!list[index]) return null;
    return withStickers(r, list.filter((_, i) => i !== index));
  });
}

/** Photo d'anniversaire d'un bébé à un stade donné (pour le livre du bébé), la plus récente. */
export function birthdayPhoto(state: GameState, speciesId: string, birthOrder: 1 | 2, stage: GrowthStage): Photo | undefined {
  return familyPhotos(state, speciesId).find((p) => p.birthday === birthOrder && p.a.some((a) => a.who === 'baby' && a.birthOrder === birthOrder && a.stage === stage));
}

// --- lecture d'une sauvegarde : seules les photos lisibles sont gardées -------------------------------------------

const num = (v: unknown, lo: number, hi: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 80;
const coords = (r: unknown[], from: number) => num(r[from], -50, 150) && num(r[from + 1], -50, 150) && num(r[from + 2], 0.1, 200);

function parseActor(v: unknown): ActorRec | null {
  if (!Array.isArray(v) || !['f', 'm', 'b1', 'b2'].includes(v[0] as string) || !coords(v, 1)) return null;
  const head: [string, number, number, number, 1 | -1] = [v[0] as string, v[1] as number, v[2] as number, v[3] as number, v[4] === -1 ? -1 : 1];
  if (v[0] !== 'f' && v[0] !== 'm' && num(v[5], 0, GROWTH_STAGES.length - 1) && Number.isInteger(v[5]) && (v[6] === 'g' || v[6] === 'b')) return [...head, v[5], v[6]];
  return head;
}

function parseGift(v: unknown): GiftRec | null {
  return Array.isArray(v) && str(v[0]) && coords(v, 1) ? [v[0], v[1] as number, v[2] as number, v[3] as number] : null;
}

export function parseAlbum(raw: unknown): AlbumRec {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: AlbumRec = {};
  for (const [sp, list] of Object.entries(raw as Record<string, unknown>)) {
    if (!str(sp) || !Array.isArray(list)) continue;
    const kept: PhotoRec[] = [];
    for (const v of list) {
      if (kept.length >= ALBUM_MAX_PER_FAMILY) break;
      if (!v || typeof v !== 'object') continue;
      const o = v as Record<string, unknown>;
      if (!num(o.t, 0, 1e14) || !str(o.p) || !Array.isArray(o.a) || kept.some((r) => r.t === o.t)) continue;
      const a = o.a.map(parseActor).filter((x): x is ActorRec => !!x).slice(0, 4);
      const g = (Array.isArray(o.g) ? o.g : []).map(parseGift).filter((x): x is GiftRec => !!x).slice(0, 30);
      const stickers = typeof o.s === 'string' ? readStickers(o.s.slice(0, PHOTO_STICKERS_MAX * 6), typeof o.z === 'string' ? o.z : undefined) : [];
      kept.push({
        t: o.t,
        p: o.p,
        a,
        ...(g.length ? { g } : {}),
        ...(o.n === 1 ? { n: 1 as const } : {}),
        ...(num(o.w, 0, WEATHERS.length - 1) && Number.isInteger(o.w) ? { w: o.w } : {}),
        ...(o.b === 1 || o.b === 2 ? { b: o.b } : {}),
      });
      kept[kept.length - 1] = withStickers(kept[kept.length - 1]!, stickers);
    }
    if (kept.length) out[sp] = kept;
  }
  return out;
}
