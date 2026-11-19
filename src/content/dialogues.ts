/**
 * Répliques VALIDÉES communes à tout le jeu (anglais + traduction française de contrôle) :
 * scène de famille, annonces, stades de croissance et repli « conversation ».
 * Les activités sont dans content/activities, les aventures dans content/adventures.
 * Seules les variables {actorName} {playerName} {babyName} {siblingName} sont substituées.
 */
import type { ActorKind, BiomeId, Line, QuestScript, ResponseOption } from './types';

const L = (en: string, fr: string): Line => ({ en, fr });
const ok = (en: string, fr: string, icon?: string): ResponseOption => ({ line: L(en, fr), icon, correct: true });

// ---------------------------------------------------------------------------
// Famille : scène tendre, naissance, présentation
// ---------------------------------------------------------------------------

export const FAMILY_LINES = {
  intro: L('Look! Mum and Dad love each other very much.', "Regarde ! Maman et Papa s'aiment très fort."),
  surprise: L('Oh! A surprise! A baby is here!', 'Oh ! Une surprise ! Un bébé est arrivé !'),
  anotherSurprise: L('Oh! Another surprise! Another baby is here!', 'Oh ! Encore une surprise ! Un autre bébé est arrivé !'),
  tapAnimal: L('Tap an animal to play!', 'Touche un animal pour jouer !'),
  tryAgain: L('Try again!', 'Essaie encore !'),
  wellDone: L('Well done!', 'Bravo !'),
  whoToPlay: L('What do you want to do?', 'Que veux-tu faire ?'),
  learned: L('{babyName} learned a new word!', '{babyName} a appris un nouveau mot !'),
  remembers: L('{babyName} remembers the word!', '{babyName} se souvient du mot !'),
  boyOrGirl: L('Is it a boy or a girl?', 'Est-ce un garçon ou une fille ?'),
  itsABoy: L("It's a boy!", "C'est un garçon !"),
  itsAGirl: L("It's a girl!", "C'est une fille !"),
  chooseName: L('What is the baby’s name?', "Comment s'appelle le bébé ?"),
  babyHello: L("Hello! My name is {babyName}!", "Bonjour ! Je m'appelle {babyName} !"),
  brother: L('This is my brother, {siblingName}!', 'Voici mon frère, {siblingName} !'),
  sister: L('This is my sister, {siblingName}!', 'Voici ma sœur, {siblingName} !'),
  welcomeBaby: L('Welcome to our family, {babyName}!', 'Bienvenue dans notre famille, {babyName} !'),
  familyComplete: L('We have two babies. Our family is complete!', 'Nous avons deux bébés. Notre famille est au complet !'),
  growUp: L('Look! {babyName} is growing up!', 'Regarde ! {babyName} grandit !'),
} as const;

export const STAGE_NAMES: Readonly<Record<string, Line>> = {
  newborn: L('newborn', 'nouveau-né'),
  little: L('little explorer', 'petit explorateur'),
  young: L('young adventurer', 'jeune aventurier'),
  companion: L('big companion', 'grand compagnon'),
};

/** Repli toujours disponible (QUE-04) : petite conversation sans mission. */
export function chatScript(speciesId: string, biomeId: BiomeId, actorKind: ActorKind): QuestScript {
  return {
    id: `chat.${speciesId}.${actorKind}`,
    archetypeId: 'chat',
    speciesId,
    biomeId,
    actorKind,
    tier: 'beginner',
    steps: [
      {
        kind: 'ask', speaker: 'actor', emotion: 'happy', line: L('Hello, {playerName}! Do you want to play?', 'Bonjour {playerName} ! Tu veux jouer ?'),
        options: [ok('Yes, please!', "Oui, s'il te plaît !", '👍'), ok('Not now, thank you.', 'Pas maintenant, merci.', '🙂')],
        hint: L('You can say yes or no!', 'Tu peux dire oui ou non !'),
        items: ['please', 'thank_you'],
      },
      { kind: 'celebrate', speaker: 'actor', line: L('OK! See you soon!', "D'accord ! À bientôt !") },
    ],
  };
}
