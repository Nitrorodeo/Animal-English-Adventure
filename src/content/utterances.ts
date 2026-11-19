/**
 * Phrases d'interface prononcées à voix haute. Elles sont construites ICI, et seulement ici,
 * pour que le catalogue des voix (src/audio/voiceCatalog.ts) génère exactement les mêmes textes
 * que ceux que l'interface demande de dire.
 */
import { GREETING_WELCOMES } from './activities/basic';
import { FAMILY_LINES, STAGE_NAMES } from './dialogues';
import { fillLine } from '../engine/dialogue';
import type { BiomeDef, SpeciesDef } from './types';

export const NAME_ERRORS: Readonly<Record<string, { fr: string; en: string }>> = {
  empty: { en: 'Please type a name!', fr: 'Écris un prénom avec des lettres.' },
  too_long: { en: 'This name is too long!', fr: 'Ce prénom est trop long (18 lettres au plus).' },
  same_name: { en: 'This name is taken!', fr: 'Le frère ou la sœur porte déjà ce prénom.' },
};

export const SEX_CHOICE = { boy: 'A boy', girl: 'A girl' } as const;

/** Phrase du bouton « Écouter » du réglage de vitesse : l'accueil de Leo, déjà enregistré. */
export const SPEED_SAMPLE = {
  text: fillLine(GREETING_WELCOMES.lion!.adult, { actorName: 'Leo' }).en,
  role: 'father',
} as const;

/**
 * Ce que dit un bébé quand on le touche : sa façon de parler grandit avec lui
 * (demande du parent du 2026-11-19 : « un système cohérent pour faire grandir les bébés »).
 */
export const STAGE_OPENERS: Readonly<Record<string, { en: string; fr: string }>> = {
  newborn: { en: 'Goo goo! Play with me!', fr: 'Areuh ! Joue avec moi !' },
  little: { en: 'Can we play?', fr: 'On joue ?' },
  young: { en: "Let's go on an adventure!", fr: 'On part à l’aventure !' },
  companion: { en: 'I have an idea!', fr: 'J’ai une idée !' },
};

/** Ce que dit le bébé sur la carte « il grandit ». */
export const BIGGER_NOW = { en: "Look at me! I'm bigger now!", fr: 'Regarde-moi ! Je suis plus grand maintenant !' } as const;

export const say = {
  title: (playerName: string) => `Hello, ${playerName}! Let's go on an adventure!`,
  biomeWelcome: (biome: Pick<BiomeDef, 'nameEn'>) => `Welcome to ${biome.nameEn}! ${FAMILY_LINES.tapAnimal.en}`,
  actorCall: (actorName: string) => `${actorName}! ${FAMILY_LINES.whoToPlay.en}`,
  /** appel d'un bébé : selon son stade de croissance */
  babyCall: (babyName: string, stageId: string) => `${babyName}! ${STAGE_OPENERS[stageId]?.en ?? FAMILY_LINES.whoToPlay.en}`,
  growUp: (babyName: string, stageId: string) => `${fillLine(FAMILY_LINES.growUp, { babyName }).en} ${babyName} is a ${STAGE_NAMES[stageId]?.en ?? stageId} now!`,
  continent: (nameEn: string) => nameEn,
  continentPrompt: (nameEn: string) => `${nameEn}. Choose an animal!`,
  speciesPick: (s: Pick<SpeciesDef, 'nameEn'>) => `The ${s.nameEn}!`,
  /** mot du décor touché : groupe nominal validé, sinon le mot seul */
  decorWord: (np: { en: string } | undefined, word: string) => (np ? `${np.en}!` : word),
  /** « Try again! » suivi de l'indice déjà rempli */
  tryAgain: (hintEn: string) => `${FAMILY_LINES.tryAgain.en} ${hintEn}`,
  /** titre d'une aventure ou d'une activité (carte « 🔊 ») */
  cardTitle: (titleEn: string) => titleEn,
  treasure: (nameEn: string) => `A new treasure: ${nameEn}!`,
  placeName: (p: Pick<BiomeDef, 'nameEn'>) => `${p.nameEn}!`,
};
