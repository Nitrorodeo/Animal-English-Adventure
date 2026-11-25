/**
 * Jeux bonus de la mer (demande du parent du 2026-11-20 : « Je veux qu'on se serve de ces 3 animaux
 * marins pour faire des jeux bonus. Ils doivent aussi être interactifs. »).
 *
 * La baleine, la tortue et les dauphins sont peints sur la carte du monde ; leurs découpes
 * (`public/assets/sea/*.webp`, fabriquées par `scripts/sea_sprites.py`) se posent exactement
 * par-dessus. Sur la carte, on les touche : ils bougent, disent bonjour et proposent leur jeu.
 *
 * - La baleine : « Count my splashes! » — elle souffle 1 à 5 jets d'eau, on touche le bon nombre.
 * - La tortue : « Find it! » — trouver le poisson, le crabe, le coquillage ou la pieuvre au fond de l'eau.
 * - Les dauphins : « Big or little? » — « Big dolphin, jump! » : toucher le bon dauphin, qui le fait.
 *
 * Ces animaux ne sont pas des familles (pas de bébés) : ce sont des amis de passage, hors des continents.
 */
import type { VoiceRole } from '../audio/voiceKey';
import type { Line, Rect } from './types';

const L = (en: string, fr: string): Line => ({ en, fr });

export type SeaGameId = 'whale' | 'turtle' | 'dolphins';
export type SeaSprite = 'whale' | 'turtle' | 'turtle_baby' | 'dolphin_big' | 'dolphin_little';

/**
 * Grandes images HD des jeux bonus (dessins fournis par le parent dans `Animaux/Ocean map/`,
 * découpés par `scripts/sea_hd.py`, 2026-11-20). La carte du monde garde les petites découpes
 * ci-dessus, posées exactement sur sa peinture.
 */
export const SEA_HD: Readonly<Record<SeaSprite, string>> = {
  // 2026-11-23 : les planches « Baleines à bosse complices » (maman + baleineau, ensemble) et « Tortues de mer joyeuses
  // en nageant » (la grande et la petite) remplacent la baleine et la tortue seules (`scripts/sea_famille.py`) ;
  // `whale_hd` et `turtle_hd` restent dans le dossier, plus utilisées par le jeu.
  whale: 'whale_family_hd',
  turtle: 'turtle_mother_hd',
  turtle_baby: 'turtle_baby_hd',
  dolphin_big: 'dolphin_big_hd',
  dolphin_little: 'dolphin_little_hd',
};

/**
 * Les deux décors sous-marins de chaque animal (dessins du parent dans `Animaux/Ocean map/<animal>/`,
 * `scripts/sea_famille.py`, 2026-11-23). Le jeu change de décor à chaque manche : en une partie, l'enfant voit les deux.
 *   baleine : la cathédrale de glace puis le panorama de l'Antarctique ·
 *   dauphins : le paradis lumineux puis le canyon de kelp · tortue : le jardin corallien puis le canyon turquoise.
 */
export const SEA_DECORS: Readonly<Record<SeaGameId, readonly [string, string]>> = {
  whale: ['bg_whale_1', 'bg_whale_2'],
  dolphins: ['bg_dolphins_1', 'bg_dolphins_2'],
  turtle: ['bg_turtle_1', 'bg_turtle_2'],
};

/** nom (anglais) de chaque décor, sous sa vignette : l'enfant peut changer de fond à tout moment */
export const SEA_DECOR_NAMES: Readonly<Record<string, string>> = {
  bg_whale_1: 'the ice cathedral',
  bg_whale_2: 'the polar sea',
  bg_dolphins_1: 'the bright paradise',
  bg_dolphins_2: 'the kelp canyon',
  bg_turtle_1: 'the coral garden',
  bg_turtle_2: 'the turquoise canyon',
};

/** décor de la manche `index` (−1 = l'introduction : le premier décor) : un puis l'autre, en alternance */
export const seaDecor = (game: SeaGameId, index: number): string => SEA_DECORS[game][Math.max(index, 0) % 2]!;

export interface SeaFriend {
  id: SeaGameId;
  icon: string;
  nameEn: string;
  nameFr: string;
  titleEn: string;
  titleFr: string;
  /** voix de l'animal (les dauphins : le grand parle avec la voix du garçon, le petit avec celle de la fille) */
  voice: VoiceRole;
  hello: Line;
  /** découpes posées sur la carte, en % de la carte (même cadre que le découpage) */
  sprites: { sprite: SeaSprite; box: Rect }[];
}

export const SEA_FRIENDS: readonly SeaFriend[] = [
  {
    id: 'whale',
    icon: '🐋',
    nameEn: 'Whale',
    nameFr: 'Baleine',
    titleEn: 'Count my splashes!',
    titleFr: 'Compte mes jets d’eau !',
    voice: 'father',
    hello: L("Splash! I'm a big whale! Let's play!", 'Splash ! Je suis une grosse baleine ! On joue ?'), // dessin : baleine à bosse, pas une baleine bleue
    sprites: [{ sprite: 'whale', box: { x: 67.45, y: 42.5, w: 9.67, h: 12.5 } }],
  },
  {
    id: 'turtle',
    icon: '🐢',
    nameEn: 'Turtle',
    nameFr: 'Tortue',
    titleEn: 'Find it!',
    titleFr: 'Trouve-le !',
    voice: 'mother',
    hello: L("Hello! I'm a sea turtle! Let's play!", 'Bonjour ! Je suis une tortue de mer ! On joue ?'),
    sprites: [{ sprite: 'turtle', box: { x: 71.11, y: 70, w: 6.67, h: 9 } }],
  },
  {
    id: 'dolphins',
    icon: '🐬',
    nameEn: 'Dolphins',
    nameFr: 'Dauphins',
    titleEn: 'Big or little?',
    titleFr: 'Grand ou petit ?',
    voice: 'boy',
    hello: L("Wheee! We are dolphins! Let's play!", 'Youpi ! Nous sommes des dauphins ! On joue ?'),
    sprites: [
      { sprite: 'dolphin_big', box: { x: 22.5, y: 64, w: 6.67, h: 11.5 } },
      { sprite: 'dolphin_little', box: { x: 25.16, y: 67, w: 6.67, h: 9 } },
    ],
  },
];

export const seaFriend = (id: SeaGameId): SeaFriend => SEA_FRIENDS.find((f) => f.id === id)!;

// ---------------------------------------------------------------------------
// Baleine : compter les jets d'eau
// ---------------------------------------------------------------------------

export const WHALE = {
  intro: L('Count my splashes! Ready?', 'Compte mes jets d’eau ! Prête ?'),
  ask: L('How many splashes?', 'Combien de jets d’eau ?'),
  again: L('Oops! Watch again!', 'Oups ! Regarde encore !'),
  end: L('Super counting! Bye-bye!', 'Tu comptes super bien ! Au revoir !'),
} as const;

const NUM = ['One', 'Two', 'Three', 'Four', 'Five'] as const;
const NUM_FR = ['Un', 'Deux', 'Trois', 'Quatre', 'Cinq'] as const;

/** « Yes! Three splashes! » */
export const whaleYes = (n: number): Line =>
  L(`Yes! ${NUM[n - 1]} ${n === 1 ? 'splash' : 'splashes'}!`, `Oui ! ${NUM_FR[n - 1]} ${n === 1 ? 'jet' : 'jets'} d’eau !`);

/** La baleine compte avec l'enfant après deux erreurs : « One, two, three! » */
export const whaleCount = (n: number): Line => L(`${NUM.slice(0, n).join(', ')}!`, `${NUM_FR.slice(0, n).join(', ')} !`);

export const numberWord = (n: number): Line => L(NUM[n - 1]!, NUM_FR[n - 1]!);

// ---------------------------------------------------------------------------
// Tortue : trouver un animal ou un objet au fond de l'eau
// ---------------------------------------------------------------------------

export interface SeaThing {
  id: 'fish' | 'crab' | 'shell' | 'octopus';
  icon: string;
  find: Line;
  yes: Line;
  oops: Line;
}

const thing = (id: SeaThing['id'], icon: string, en: string, fr: string, a: string, un: string): SeaThing => ({
  id,
  icon,
  find: L(`Find the ${en}!`, `Trouve ${fr} !`),
  yes: L(`Yes! ${a} ${en}! Thank you!`, `Oui ! ${un} ! Merci !`),
  oops: L(`Oops! Find the ${en}!`, `Oups ! Trouve ${fr} !`),
});

export const SEA_THINGS: readonly SeaThing[] = [
  thing('fish', '🐟', 'fish', 'le poisson', 'A', 'Un poisson'),
  thing('crab', '🦀', 'crab', 'le crabe', 'A', 'Un crabe'),
  thing('shell', '🐚', 'shell', 'le coquillage', 'A', 'Un coquillage'),
  thing('octopus', '🐙', 'octopus', 'la pieuvre', 'An', 'Une pieuvre'),
];

export const TURTLE = {
  intro: L('Help me find my friends! Ready?', 'Aide-moi à trouver mes amis ! Prête ?'),
  end: L('Thank you, my friend! Bye-bye!', 'Merci, mon amie ! Au revoir !'),
} as const;

// ---------------------------------------------------------------------------
// Dauphins : le grand ou le petit ?
// ---------------------------------------------------------------------------

export type DolphinId = 'big' | 'little';
export type DolphinMove = 'jump' | 'swim' | 'splash';

export const DOLPHINS = {
  intro: L('Big dolphin or little dolphin? Listen!', 'Le grand dauphin ou le petit dauphin ? Écoute !'),
  end: L('Wheee! You listen so well! Bye-bye!', 'Youpi ! Tu écoutes trop bien ! Au revoir !'),
  voice: { big: 'boy', little: 'girl' } as Record<DolphinId, VoiceRole>,
  name: { big: L('Big dolphin', 'Grand dauphin'), little: L('Little dolphin', 'Petit dauphin') } as Record<DolphinId, Line>,
  notMe: { big: L("Not me! I'm the big dolphin!", 'Pas moi ! Je suis le grand dauphin !'), little: L("Not me! I'm the little dolphin!", 'Pas moi ! Je suis le petit dauphin !') } as Record<DolphinId, Line>,
  hint: { big: L('Touch the big dolphin!', 'Touche le grand dauphin !'), little: L('Touch the little dolphin!', 'Touche le petit dauphin !') } as Record<DolphinId, Line>,
  move: { jump: L('jump!', 'saute !'), swim: L('swim!', 'nage !'), splash: L('splash!', 'éclabousse !') } as Record<DolphinMove, Line>,
  reply: { jump: L("Wheee! I'm jumping!", 'Youpi ! Je saute !'), swim: L("I'm swimming! Look!", 'Je nage ! Regarde !'), splash: L('Splish, splash!', 'Plouf, plouf !') } as Record<DolphinMove, Line>,
} as const;

/**
 * Les deux dauphins du jeu (2026-11-24) : la planche « Dauphins joyeux » (la maman et son petit qui NAGENT, sous
 * l'eau), gardés ensemble sur une seule image comme les baleines (`scripts/sea_famille.py`). Les anciennes images
 * `dolphin_*_hd` sautaient hors de l'eau avec leur flaque : absurde en plein fond marin.
 */
export const DOLPHIN_FAMILY = 'dolphin_family_hd';

/** Où toucher chaque dauphin sur cette image (en % de l'image) : le petit en bas à gauche, la maman en haut. */
export const DOLPHIN_ZONES: Readonly<Record<DolphinId, readonly { x: number; y: number; w: number; h: number }[]>> = {
  big: [
    { x: 0, y: 0, w: 100, h: 54 },
    { x: 57, y: 54, w: 30, h: 26 },
  ],
  little: [{ x: 4, y: 54, w: 53, h: 46 }],
};

/** « Big dolphin, jump! » */
export const dolphinOrder = (d: DolphinId, m: DolphinMove): Line => L(`${DOLPHINS.name[d].en}, ${DOLPHINS.move[m].en}`, `${DOLPHINS.name[d].fr}, ${DOLPHINS.move[m].fr}`);

/**
 * Largeur de chaque animal dans son jeu, en % de la scène. Les dauphins sont plus petits que les baleines.
 * Le 2026-11-24, ils passent de 56 à 34 (« les dauphins sont beaucoup trop gros »).
 */
export const SEA_WIDTH = { whale: 40, dolphins: 34, turtle: 22 } as const;
/** places de départ (coin haut-gauche, en % de la scène) ; l'enfant les déplace ensuite au doigt */
export const SEA_START = { whale: { x: 4, y: 20 }, dolphins: { x: 33, y: 22 } } as const;
