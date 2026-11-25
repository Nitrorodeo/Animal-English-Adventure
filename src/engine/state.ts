import type { AlbumRec } from './photoAlbum';
import type { NamePron } from './nameVoice';
import type { ActorSpot } from './spots';
import type { OwnedGift } from './gifts';
import type { ContinentId, GrowthStage, ParentRole, PlaceId, Sex, Tier } from '../content/types';

/** v2 (2026-11-19) : trésors, aventures, lieux visités, mots découverts par continent. */
export const SAVE_VERSION = 2;

/**
 * Génération des parties. Le 2026-11-25, le parent a demandé de remettre TOUTES les parties à zéro (« on recommence à zéro
 * avec ma fille ») : une partie d'une génération plus ancienne repart de zéro, sur n'importe quel appareil, à son ouverture
 * (engine/save.ts, `fromOldEra`). Augmenter ce nombre refait une remise à zéro générale.
 */
export const SAVE_ERA = 1;

/** Suivi d'une expression pour la joueuse. */
export interface ItemProgress {
  /** nombre de fois rencontrée (une fois par quête au plus) */
  seen: number;
  correctUnaided: number;
  correctAided: number;
  /** contextes distincts de réussite : archetype:espèce:rôle */
  contexts: string[];
}

export interface HistoryEntry {
  archetypeId: string;
  speciesId: string;
  actorId: string;
  mechanic: string;
  at: number; // compteur d'activités
  /** variante jouée (objet, couleur, cachette…), pour varier la suivante */
  choice?: string;
}

export interface PlayerState {
  name: string;
  /** prononciation du prénom choisie à l'oreille (src/engine/nameVoice.ts) ; null = pas encore choisie */
  namePron: NamePron | null;
  items: Record<string, ItemProgress>;
  visitedContinents: ContinentId[];
  /** 10 dernières activités (anti-répétition) */
  history: HistoryEntry[];
  /** nombre total d'activités terminées : horloge logique du jeu (pas de temps réel) */
  activityCounter: number;
  /** trésors gagnés dans les aventures (passeport) */
  treasures: string[];
  /** aventures terminées → nombre de fois */
  adventuresDone: Record<string, number>;
  /**
   * jeux réussis avec chaque animal (clé `gameKey`) → nombre de fois ; la carte du jeu passe en vert avec une coche
   * (« qu'elle sache où elle en est dans chaque animal », 2026-11-25). L'historique, lui, ne garde que 10 jeux.
   */
  gamesDone: Record<string, number>;
  /** lieux visités (carte, passeport) */
  placesVisited: PlaceId[];
  /** mots découverts, par continent (album du passeport) */
  words: Partial<Record<ContinentId, string[]>>;
  /** album photo : « lieu:point du décor » photographiés */
  photos: string[];
  /** album 📷 de la joueuse : scènes photographiées, rangées par famille (engine/photoAlbum.ts) ; absent = aucune */
  album?: AlbumRec;
  /** autocollants collés sur la carte du monde (un par jour au plus, voir engine/stickers.ts) */
  stickers: PlacedSticker[];
  /** jour (AAAA-MM-JJ, heure de l'appareil) du dernier autocollant reçu ; null = jamais */
  stickerDay: string | null;
  /** cadeaux du soir reçus par les familles, avec leur place décor par décor (voir engine/gifts.ts) */
  gifts: OwnedGift[];
  /** jour (AAAA-MM-JJ, heure de l'appareil) du dernier cadeau du soir reçu ; null = jamais */
  giftDay: string | null;
  /** animaux posés au doigt dans les décors, « lieu|personnage » → place (voir engine/spots.ts) */
  spots: Record<string, ActorSpot>;
}

/** Autocollant collé sur la carte : position en % de la carte. */
export interface PlacedSticker {
  id: string;
  continentId: ContinentId;
  x: number;
  y: number;
  /**
   * 3 = carte élargie puis recentrée (2026-11-20) ; 2 = carte élargie avant recentrage ; absent = ancienne
   * carte. Les positions anciennes sont recalées au chargement.
   */
  map?: 2 | 3;
}

export interface Baby {
  id: string;
  familyId: string;
  name: string;
  sex: Sex;
  birthOrder: 1 | 2;
  stage: GrowthStage;
  personality: 'curious' | 'playful' | 'gentle' | 'funny';
  /** mots enseignés par la joueuse → valeur de activityCounter au moment de l'enseignement */
  taughtWords: Record<string, number>;
  /** mots réutilisés avec succès plus tard, dans un autre moment */
  retainedWords: string[];
  /** expressions rencontrées avec la joueuse */
  seenItems: string[];
  /** archétypes d'aventures différentes vécues */
  activities: string[];
  /** souvenirs structurés (ex. found_waterhole) */
  questMemory: string[];
  milestones: string[];
  /** jeux préférés : mécanique → nombre de parties jouées ensemble (absent dans les anciennes sauvegardes) */
  likes?: Record<string, number>;
}

export interface FamilyState {
  speciesId: string;
  babies: Baby[];
  /** souvenirs familiaux structurés */
  memories: string[];
  /** souvenirs par parent */
  parentMemory: Record<ParentRole, string[]>;
  /** prénoms donnés aux parents à la place de ceux du jeu (« changer le nom des animaux », 2026-11-25) ; absent = nom d'origine */
  parentNames?: Partial<Record<ParentRole, string>>;
}

export interface Settings {
  muted: boolean;
  slowVoice: boolean;
  /** affiche le bouton d'aide en français */
  frenchHelp: boolean;
  levelOverride: 'auto' | Tier;
  /** vitesse des voix réglée par les parents, en part de la vitesse NATURELLE (1 = 100 % = naturelle) */
  speechSpeed: number;
  /** mot de la semaine choisi par le parent (un mot des décors, content/weekWord.ts) ; absent = aucun */
  weekWord?: string;
  /** « Répète après moi » : bouton 🎤 qui enregistre sa voix pour la réécouter, sur l'appareil seulement ; absent = coupé */
  micRepeat?: boolean;
}

/**
 * Curseur « Vitesse des voix » (espace parents, demande du parent du 2026-11-19 :
 * « le 100 % est le réel, et je peux ralentir ou accélérer »). Par défaut 80 % : la vitesse
 * validée le 2026-11-18, qui est aussi celle des enregistrements (lecture sans retouche).
 */
export const SPEECH_SPEED = { min: 0.5, max: 1.5, step: 0.05, natural: 1, default: 0.8 } as const;

/** Vitesse valide : nombre dans la plage, arrondi au cran de 5 % ; sinon la valeur par défaut. */
export function clampSpeechSpeed(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return SPEECH_SPEED.default;
  const bounded = Math.min(SPEECH_SPEED.max, Math.max(SPEECH_SPEED.min, v));
  const steps = Math.round(1 / SPEECH_SPEED.step); // 20 crans par unité : évite 0.8500000001
  return Math.round(bounded * steps) / steps;
}

export interface GameState {
  version: number;
  /** génération de la partie (SAVE_ERA) ; 0 = partie d'avant la remise à zéro du 2026-11-25 */
  era: number;
  player: PlayerState;
  families: Record<string, FamilyState>;
  settings: Settings;
  /** l'introduction (prénom de la joueuse) a été vue */
  onboarded: boolean;
  /**
   * Cercle d'amis de la famille (engine/circle.ts), gardé DANS la partie : une fois entré, le code reste, même si le
   * navigateur est vidé, et suit la partie partagée sur tous les appareils. Absent = aucun cercle.
   */
  circle?: CircleRef;
}

/** Le cercle rejoint : son code et l'identifiant de cette famille dedans (une seule carte par enfant, quel que soit l'appareil). */
export interface CircleRef {
  code: string;
  id: string;
}

export function newGameState(): GameState {
  return {
    version: SAVE_VERSION,
    era: SAVE_ERA,
    player: { name: 'Explorer', namePron: null, items: {}, visitedContinents: [], history: [], activityCounter: 0, treasures: [], adventuresDone: {}, gamesDone: {}, placesVisited: [], words: {}, photos: [], stickers: [], stickerDay: null, gifts: [], giftDay: null, spots: {} },
    families: {},
    settings: { muted: false, slowVoice: false, frenchHelp: true, levelOverride: 'auto', speechSpeed: SPEECH_SPEED.default },
    onboarded: false,
  };
}

export function getFamily(state: GameState, speciesId: string): FamilyState {
  return state.families[speciesId] ?? { speciesId, babies: [], memories: [], parentMemory: { father: [], mother: [] } };
}

/** Identifiant d'acteur : "lion:father", "lion:mother", "lion:baby:<id>" */
export type ActorRef =
  | { speciesId: string; kind: 'adult'; role: ParentRole }
  | { speciesId: string; kind: 'baby'; babyId: string };

export function actorId(a: ActorRef): string {
  return a.kind === 'adult' ? `${a.speciesId}:${a.role}` : `${a.speciesId}:baby:${a.babyId}`;
}

/** clé d'un jeu réussi avec un animal précis (Papa, Maman ou un bébé) dans `player.gamesDone` */
export const gameKey = (a: ActorRef, archetypeId: string): string => `${actorId(a)}|${archetypeId}`;

/** ce jeu a-t-il déjà été réussi avec cet animal ? */
export const gameDone = (state: GameState, a: ActorRef, archetypeId: string): boolean => (state.player.gamesDone[gameKey(a, archetypeId)] ?? 0) > 0;

export function withFamily(state: GameState, family: FamilyState): GameState {
  return { ...state, families: { ...state.families, [family.speciesId]: family } };
}

/** Prénoms choisis en jeu (joueuse, bébés, parents renommés), pour reconnaître les phrases enregistrées. */
export function variableNames(state: GameState): string[] {
  return [state.player.name, ...Object.values(state.families).flatMap((f) => [...f.babies.map((b) => b.name), ...Object.values(f.parentNames ?? {}).filter((n): n is string => !!n)])];
}

/** Toute la famille d'une espèce : Papa, Maman, puis les bébés. */
export function familyActors(state: GameState, speciesId: string): ActorRef[] {
  return [
    { speciesId, kind: 'adult', role: 'father' },
    { speciesId, kind: 'adult', role: 'mother' },
    ...getFamily(state, speciesId).babies.map((b): ActorRef => ({ speciesId, kind: 'baby', babyId: b.id })),
  ];
}
