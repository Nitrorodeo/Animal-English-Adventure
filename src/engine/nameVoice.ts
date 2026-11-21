/**
 * Le prénom de la joueuse dit par les animaux, avec la bonne prononciation.
 *
 * Les voix du jeu sont enregistrées à l'avance ; un prénom ne peut pas l'être. L'ordinateur qui sert
 * le jeu enregistre donc, après coup, les phrases adressées à la joueuse avec SON prénom
 * (tools/tts/name_voices.py, lancé par tools/names/namePlugin.mjs). Le parent choisit à l'oreille
 * comment le prénom se prononce : à la française, à l'anglaise, ou comme il l'écrit.
 *
 * Sans ordinateur (jeu copié ailleurs, voix pas encore prêtes), les phrases restent dites sans le
 * prénom, comme avant. Ce fichier ne contient que les décisions (testées).
 */
import { clipKey, DEFAULT_PLAYER_NAME, NAME_TOKEN, normalizeNames, VOICE_OF_ROLE, type VoiceRole } from '../audio/voiceKey';
import { sanitizeName } from './family';

export type NamePronMode = 'fr' | 'en' | 'spelled';
export const NAME_PRON_MODES: readonly NamePronMode[] = ['fr', 'en', 'spelled'];

/** Prononciation choisie pour le prénom de la joueuse (gardée dans la partie). */
export interface NamePron {
  mode: NamePronMode;
  /** mode « spelled » : le prénom écrit pour l'oreille, lu à la française (« Ma-é-la ») */
  spelling?: string;
}

/** Adresse des voix du prénom, relative au jeu. */
export const NAME_API = 'api/name';
export const SPELLING_MAX = 30;
/** Délai entre deux nouvelles demandes pendant que l'ordinateur enregistre. */
export const NAME_POLL_MS = 3000;

/** Écriture « pour l'oreille » : lettres, espaces, traits d'union, apostrophes ; null si inutilisable. */
export function sanitizeSpelling(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw
    .normalize('NFC')
    .replace(/[^\p{L}\p{M} '’-]/gu, '')
    .replace(/’/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    // jamais de tiret en tête : la valeur est passée en argument au script de voix
    .replace(/^[-']+|[-']+$/g, '')
    .trim();
  return s.length > 0 && s.length <= SPELLING_MAX && /\p{L}/u.test(s) ? s : null;
}

/** Prononciation lue dans une sauvegarde ou une demande ; null si absente ou invalide. */
export function parseNamePron(raw: unknown): NamePron | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (!NAME_PRON_MODES.includes(r.mode as NamePronMode)) return null;
  const mode = r.mode as NamePronMode;
  if (mode !== 'spelled') return { mode };
  const spelling = sanitizeSpelling(r.spelling);
  return spelling ? { mode, spelling } : null;
}

export interface NameRequest {
  name: string;
  pron: NamePron;
}

/** Côté ordinateur : demande reçue de la tablette ; null si elle est invalide (rien n'est lancé). */
export function parseNameRequest(body: string): NameRequest | null {
  let raw: unknown;
  try {
    raw = JSON.parse(body);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const n = sanitizeName(typeof r.name === 'string' ? r.name : '');
  if (!n.ok || n.name === DEFAULT_PLAYER_NAME) return null;
  const pron = parseNamePron(r.pron ?? { mode: 'fr' });
  return pron ? { name: n.name, pron } : null;
}

/** Empreinte courte et stable (FNV-1a 32 bits) : sert aux noms de dossiers, pas à la sécurité. */
export function shortHash(text: string): string {
  let h = 0x811c9dc5;
  for (const c of new TextEncoder().encode(text)) {
    h ^= c;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** Dossier des voix d'un prénom et d'une prononciation (lettres simples et chiffres seulement). */
export function nameVoiceId(req: NameRequest): string {
  const slug = req.name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 16);
  return `${slug || 'prenom'}-${shortHash(`${req.name}|${req.pron.mode}|${req.pron.spelling ?? ''}`)}`;
}

/** Dossier des essais d'écoute d'un prénom (les trois prononciations ensemble). */
export function previewId(name: string, spelling: string | null): string {
  return nameVoiceId({ name, pron: spelling ? { mode: 'spelled', spelling } : { mode: 'fr' } });
}

export interface CatalogLine {
  voice: string;
  key: string;
  player?: boolean;
}

/** Phrases à enregistrer avec le prénom (même filtre que name_entries dans name_voices.py). */
export function playerLines<T extends CatalogLine>(lines: readonly T[]): T[] {
  return lines.filter((e) => e.player === true && e.key.split(NAME_TOKEN).length === 2);
}

/** Version de la liste des phrases : si le jeu en ajoute, l'ordinateur ré-enregistre. */
export function linesTag(lines: readonly CatalogLine[]): string {
  return shortHash(playerLines(lines).map((e) => e.key).sort().join('\n'));
}

/** Nom de fichier sûr pour l'adresse …/api/name/<id>/<fichier>. */
export function safeClipPath(id: string, file: string): boolean {
  return /^[a-z0-9]{1,16}-[0-9a-f]{8}$/.test(id) && /^[a-z0-9]{1,20}\.mp3$/.test(file);
}

/** Voix du prénom prêtes : phrase normalisée (clé du catalogue) → adresse de l'enregistrement. */
export type NameClips = Readonly<Record<string, string>>;

/**
 * Enregistrement à jouer pour une phrase qui contient le prénom de la joueuse.
 * Seul SON prénom est remplacé : une phrase qui contient le prénom d'un bébé ne correspond à
 * aucune clé et reste dite comme avant.
 */
export function nameClipFor(text: string, role: VoiceRole | undefined, playerName: string, clips: NameClips | null): string | undefined {
  if (!clips || playerName === DEFAULT_PLAYER_NAME || playerName.trim().length < 2) return undefined;
  const normalized = normalizeNames(text.trim(), [playerName]);
  if (!normalized.includes(NAME_TOKEN)) return undefined;
  return clips[clipKey(VOICE_OF_ROLE[role ?? 'narrator'], normalized)];
}

/** Réponse de l'ordinateur à « prépare les voix de ce prénom ». */
export type NameVoiceStatus =
  | { status: 'ready'; id: string; clips: NameClips }
  | { status: 'working'; done: number; total: number }
  | { status: 'unavailable' };

export function parseNameStatus(raw: unknown): NameVoiceStatus {
  if (typeof raw !== 'object' || raw === null) return { status: 'unavailable' };
  const r = raw as Record<string, unknown>;
  if (r.status === 'working') return { status: 'working', done: Number(r.done) || 0, total: Number(r.total) || 0 };
  if (r.status === 'ready' && typeof r.id === 'string' && typeof r.clips === 'object' && r.clips !== null) {
    const clips: Record<string, string> = {};
    for (const [k, v] of Object.entries(r.clips as Record<string, unknown>)) if (typeof v === 'string') clips[k] = v;
    return { status: 'ready', id: r.id, clips };
  }
  return { status: 'unavailable' };
}
