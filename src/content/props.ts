/**
 * Petits objets des jeux, posés sur les emplacements (spots) d'un lieu : nourriture, objets à
 * compter, objets colorés (formes dessinées), habits. Couleurs et nombres.
 */
import type { ColorId, ContinentId, Line, PropDef, Weather } from './types';

const L = (en: string, fr: string): Line => ({ en, fr });

type P = Omit<PropDef, 'id'>;
const food = (word: string, plural: string, wordFr: string, pluralFr: string, noun: Line, emoji: string, eat: PropDef['eat'], fem = false): P => ({ word, plural, wordFr, pluralFr, noun, emoji, kind: 'food', eat, fem });
const thing = (word: string, plural: string, wordFr: string, pluralFr: string, noun: Line, look: { emoji?: string; shape?: PropDef['shape'] }, fem = false): P => ({ word, plural, wordFr, pluralFr, noun, ...look, kind: 'thing', fem });
const clothes = (word: string, wordFr: string, need: Line, emoji: string): P => ({ word, plural: word, wordFr, pluralFr: wordFr, noun: L(need.en.charAt(0).toUpperCase() + need.en.slice(1), need.fr.charAt(0).toUpperCase() + need.fr.slice(1)), emoji, kind: 'clothes', need });

const RAW: Record<string, P> = {
  // --- nourriture : chaque espèce ne reçoit QUE ce qu'elle mange vraiment (species.foods) ---
  meat: food('meat', 'meat', 'la viande', 'viande', L('Meat', 'De la viande'), '🍖', { en: 'meat', fr: 'de la viande', frNo: 'de viande' }, true),
  grass: food('grass', 'grass', "l'herbe", 'herbe', L('Grass', "De l'herbe"), '🌾', { en: 'grass', fr: "de l'herbe", frNo: "d'herbe" }, true),
  leaves: food('leaf', 'leaves', 'la feuille', 'feuilles', L('A leaf', 'Une feuille'), '🍃', { en: 'leaves', fr: 'des feuilles', frNo: 'de feuilles' }, true),
  mango: food('mango', 'mangoes', 'la mangue', 'mangues', L('A mango', 'Une mangue'), '🥭', { en: 'mangoes', fr: 'des mangues', frNo: 'de mangues' }, true),
  bamboo: food('bamboo', 'bamboo', 'le bambou', 'bambou', L('Bamboo', 'Du bambou'), '🎋', { en: 'bamboo', fr: 'du bambou', frNo: 'de bambou' }),
  berries: food('berry', 'berries', 'la baie', 'baies', L('A berry', 'Une baie'), '🫐', { en: 'berries', fr: 'des baies', frNo: 'de baies' }, true),
  banana: food('banana', 'bananas', 'la banane', 'bananes', L('A banana', 'Une banane'), '🍌', { en: 'bananas', fr: 'des bananes', frNo: 'de bananes' }, true),
  fish: food('fish', 'fish', 'le poisson', 'poissons', L('A fish', 'Un poisson'), '🐟', { en: 'fish', fr: 'du poisson', frNo: 'de poisson' }),
  krill: food('krill', 'krill', 'le krill', 'krill', L('Krill', 'Du krill'), '🦐', { en: 'krill', fr: 'du krill', frNo: 'de krill' }),
  worm: food('worm', 'worms', 'le ver', 'vers', L('A worm', 'Un ver'), '🪱', { en: 'worms', fr: 'des vers', frNo: 'de vers' }),
  bug: food('bug', 'bugs', "l'insecte", 'insectes', L('A bug', 'Un insecte'), '🐞', { en: 'bugs', fr: 'des insectes', frNo: "d'insectes" }),
  honey: food('honey', 'honey', 'le miel', 'miel', L('Honey', 'Du miel'), '🍯', { en: 'honey', fr: 'du miel', frNo: 'de miel' }),
  eucalyptus: food('eucalyptus leaf', 'eucalyptus leaves', "la feuille d'eucalyptus", "feuilles d'eucalyptus", L('A eucalyptus leaf', "Une feuille d'eucalyptus"), '🌿', { en: 'eucalyptus leaves', fr: "des feuilles d'eucalyptus", frNo: "de feuilles d'eucalyptus" }, true),

  // --- objets à compter et formes colorées ---
  flower: thing('flower', 'flowers', 'la fleur', 'fleurs', L('A flower', 'Une fleur'), { shape: 'flower' }, true),
  pebble: thing('pebble', 'pebbles', 'le caillou', 'cailloux', L('A pebble', 'Un caillou'), { shape: 'pebble' }),
  feather: thing('feather', 'feathers', 'la plume', 'plumes', L('A feather', 'Une plume'), { shape: 'feather' }, true),
  leaf: thing('leaf', 'leaves', 'la feuille', 'feuilles', L('A leaf', 'Une feuille'), { shape: 'leaf' }, true),
  butterfly: thing('butterfly', 'butterflies', 'le papillon', 'papillons', L('A butterfly', 'Un papillon'), { shape: 'butterfly' }),
  shell: thing('shell', 'shells', 'le coquillage', 'coquillages', L('A shell', 'Un coquillage'), { shape: 'shell' }),
  koi: thing('fish', 'fish', 'le poisson', 'poissons', L('A fish', 'Un poisson'), { shape: 'fish' }),
  lantern: thing('lantern', 'lanterns', 'la lanterne', 'lanternes', L('A lantern', 'Une lanterne'), { emoji: '🏮' }, true),
  mushroom: thing('mushroom', 'mushrooms', 'le champignon', 'champignons', L('A mushroom', 'Un champignon'), { emoji: '🍄' }),
  acorn: thing('acorn', 'acorns', 'le gland', 'glands', L('An acorn', 'Un gland'), { emoji: '🌰' }),
  strawberry: thing('strawberry', 'strawberries', 'la fraise', 'fraises', L('A strawberry', 'Une fraise'), { emoji: '🍓' }, true),
  blueberry: thing('blueberry', 'blueberries', 'la myrtille', 'myrtilles', L('A blueberry', 'Une myrtille'), { emoji: '🫐' }, true),
  apple: thing('apple', 'apples', 'la pomme', 'pommes', L('An apple', 'Une pomme'), { emoji: '🍎' }, true),
  maple_leaf: thing('maple leaf', 'maple leaves', "la feuille d'érable", "feuilles d'érable", L('A maple leaf', "Une feuille d'érable"), { shape: 'maple' }, true),
  frog: thing('frog', 'frogs', 'la grenouille', 'grenouilles', L('A frog', 'Une grenouille'), { emoji: '🐸' }, true),
  egg: thing('egg', 'eggs', "l'œuf", 'œufs', L('An egg', 'Un œuf'), { emoji: '🥚' }),
  star: thing('star', 'stars', "l'étoile", 'étoiles', L('A star', 'Une étoile'), { emoji: '⭐' }, true),
  snowflake: thing('snowflake', 'snowflakes', 'le flocon', 'flocons', L('A snowflake', 'Un flocon'), { emoji: '❄️' }),
  ice: thing('ice cube', 'ice cubes', 'le glaçon', 'glaçons', L('An ice cube', 'Un glaçon'), { emoji: '🧊' }),
  coconut: thing('coconut', 'coconuts', 'la noix de coco', 'noix de coco', L('A coconut', 'Une noix de coco'), { emoji: '🥥' }, true),
  duck: thing('duck', 'ducks', 'le canard', 'canards', L('A duck', 'Un canard'), { emoji: '🦆' }),
  bird: thing('bird', 'birds', "l'oiseau", 'oiseaux', L('A bird', 'Un oiseau'), { emoji: '🐦' }),
  nest: thing('nest', 'nests', 'le nid', 'nids', L('A nest', 'Un nid'), { emoji: '🪺' }),
  zebra: thing('zebra', 'zebras', 'le zèbre', 'zèbres', L('A zebra', 'Un zèbre'), { emoji: '🦓' }),
  rabbit: thing('rabbit', 'rabbits', 'le lapin', 'lapins', L('A rabbit', 'Un lapin'), { emoji: '🐇' }),
  deer: thing('deer', 'deer', 'le cerf', 'cerfs', L('A deer', 'Un cerf'), { emoji: '🦌' }),
  penguin: thing('penguin', 'penguins', 'le manchot', 'manchots', L('A penguin', 'Un manchot'), { emoji: '🐧' }),
  footprint: thing('footprint', 'footprints', "l'empreinte", 'empreintes', L('A footprint', 'Une empreinte'), { emoji: '🐾' }, true),
  // même mot, trace différente : sabots (zèbre, cerf) et pattes à trois doigts (manchot)
  hoofprint: thing('footprint', 'footprints', "l'empreinte", 'empreintes', L('A footprint', 'Une empreinte'), { shape: 'hoof' }, true),
  birdprint: thing('footprint', 'footprints', "l'empreinte", 'empreintes', L('A footprint', 'Une empreinte'), { shape: 'birdfoot' }, true),
  moon: thing('moon', 'moons', 'la lune', 'lunes', L('The moon', 'La lune'), { emoji: '🌙' }, true),
  pinecone: thing('pine cone', 'pine cones', 'la pomme de pin', 'pommes de pin', L('A pine cone', 'Une pomme de pin'), { emoji: '🌲' }, true),
  // Amérique du Nord : troupeau du bison, branches du castor
  bison: thing('bison', 'bison', 'le bison', 'bisons', L('A bison', 'Un bison'), { emoji: '🦬' }),
  stick: thing('stick', 'sticks', 'la branche', 'branches', L('A stick', 'Une branche'), { emoji: '🪵' }, true),
  // Europe : la tanière du renard, le scarabée du hérisson (jeux propres aux espèces, 2026-11-21)
  den: thing('den', 'dens', 'la tanière', 'tanières', L('A den', 'Une tanière'), { emoji: '🕳️' }, true),
  beetle: thing('beetle', 'beetles', 'le scarabée', 'scarabées', L('A beetle', 'Un scarabée'), { emoji: '🪲' }),

  // --- habits (météo) ---
  hat: clothes('hat', 'le chapeau', L('a hat', 'un chapeau'), '👒'),
  sunglasses: clothes('sunglasses', 'les lunettes de soleil', L('sunglasses', 'des lunettes de soleil'), '🕶️'),
  scarf: clothes('scarf', "l'écharpe", L('a scarf', 'une écharpe'), '🧣'),
  coat: clothes('coat', 'le manteau', L('a coat', 'un manteau'), '🧥'),
  umbrella: clothes('umbrella', 'le parapluie', L('an umbrella', 'un parapluie'), '☂️'),
  boots: clothes('boots', 'les bottes', L('boots', 'des bottes'), '🥾'),
  gloves: clothes('gloves', 'les gants', L('gloves', 'des gants'), '🧤'),
};

export const PROPS: Readonly<Record<string, PropDef>> = Object.fromEntries(Object.entries(RAW).map(([id, p]) => [id, { id, ...p }]));

export function getProp(id: string): PropDef {
  const p = PROPS[id];
  if (!p) throw new Error(`Objet inconnu : ${id}`);
  return p;
}

/** Objets à compter propres à chaque continent (chaque continent a son vocabulaire). */
export const COUNTABLES: Readonly<Record<ContinentId, string[]>> = {
  africa: ['pebble', 'feather', 'flower', 'mango', 'egg', 'butterfly'],
  asia: ['lantern', 'koi', 'flower', 'leaf', 'butterfly'],
  europe: ['mushroom', 'acorn', 'apple', 'leaf', 'butterfly'],
  north_america: ['maple_leaf', 'pinecone', 'feather', 'pebble', 'berries'],
  south_america: ['banana', 'butterfly', 'frog', 'feather', 'flower'],
  oceania: ['shell', 'pebble', 'flower', 'butterfly', 'star'],
  antarctica: ['fish', 'snowflake', 'pebble', 'ice', 'feather'],
};

/** Formes à colorier par continent (la mer et la glace : poissons, coquillages, cailloux, plumes). */
export const COLOR_SHAPES: Readonly<Record<ContinentId, string[]>> = {
  africa: ['flower', 'butterfly', 'feather', 'pebble'],
  asia: ['koi', 'flower', 'butterfly', 'leaf'],
  europe: ['flower', 'leaf', 'butterfly', 'pebble'],
  north_america: ['leaf', 'feather', 'flower', 'pebble'],
  south_america: ['butterfly', 'feather', 'flower', 'leaf'],
  oceania: ['shell', 'flower', 'butterfly', 'koi'],
  antarctica: ['koi', 'shell', 'pebble', 'feather'],
};

export interface ColorDef {
  id: ColorId;
  en: string;
  fr: string;
  frFem: string;
  hex: string;
  icon: string;
}

export const COLORS: Readonly<Record<ColorId, ColorDef>> = {
  red: { id: 'red', en: 'red', fr: 'rouge', frFem: 'rouge', hex: '#e53935', icon: '🔴' },
  blue: { id: 'blue', en: 'blue', fr: 'bleu', frFem: 'bleue', hex: '#1e88e5', icon: '🔵' },
  yellow: { id: 'yellow', en: 'yellow', fr: 'jaune', frFem: 'jaune', hex: '#fdd835', icon: '🟡' },
  green: { id: 'green', en: 'green', fr: 'vert', frFem: 'verte', hex: '#43a047', icon: '🟢' },
  orange: { id: 'orange', en: 'orange', fr: 'orange', frFem: 'orange', hex: '#fb8c00', icon: '🟠' },
  pink: { id: 'pink', en: 'pink', fr: 'rose', frFem: 'rose', hex: '#f06292', icon: '🩷' },
  purple: { id: 'purple', en: 'purple', fr: 'violet', frFem: 'violette', hex: '#8e24aa', icon: '🟣' },
  white: { id: 'white', en: 'white', fr: 'blanc', frFem: 'blanche', hex: '#fafafa', icon: '⚪' },
};
export const COLOR_IDS = Object.keys(COLORS) as ColorId[];

export const colorFr = (c: ColorId, fem: boolean | undefined) => (fem ? COLORS[c].frFem : COLORS[c].fr);

export const NUMBERS: readonly Line[] = [
  L('Zero', 'Zéro'),
  L('One', 'Un'),
  L('Two', 'Deux'),
  L('Three', 'Trois'),
  L('Four', 'Quatre'),
  L('Five', 'Cinq'),
  L('Six', 'Six'),
  L('Seven', 'Sept'),
  L('Eight', 'Huit'),
  L('Nine', 'Neuf'),
  L('Ten', 'Dix'),
];

/** Météo : phrase de réponse et habits utiles (aucun habit pour « cloudy »). */
export const WEATHER_WORDS: Readonly<Record<Weather, { en: string; fr: string; icon: string; clothes: string[] }>> = {
  sunny: { en: "It's sunny!", fr: 'Il fait beau !', icon: '☀️', clothes: ['hat', 'sunglasses'] },
  hot: { en: "It's hot!", fr: 'Il fait chaud !', icon: '🥵', clothes: ['hat', 'sunglasses'] },
  cloudy: { en: "It's cloudy!", fr: 'Il y a des nuages !', icon: '☁️', clothes: [] },
  rainy: { en: "It's rainy!", fr: 'Il pleut !', icon: '🌧️', clothes: ['umbrella', 'boots'] },
  windy: { en: "It's windy!", fr: 'Il y a du vent !', icon: '🌬️', clothes: ['scarf', 'coat'] },
  snowy: { en: "It's snowy!", fr: 'Il neige !', icon: '🌨️', clothes: ['coat', 'gloves'] },
  misty: { en: "It's misty!", fr: 'Il y a du brouillard !', icon: '🌫️', clothes: ['coat'] },
  cold: { en: "It's cold!", fr: 'Il fait froid !', icon: '🥶', clothes: ['coat', 'scarf', 'gloves'] },
};

/** Emplacements dans le ciel (étoiles, lune), en % du décor. */
export const SKY_SPOTS: readonly { x: number; y: number }[] = [
  { x: 12, y: 8 }, { x: 24, y: 15 }, { x: 36, y: 6 }, { x: 48, y: 13 }, { x: 60, y: 5 }, { x: 70, y: 14 }, { x: 82, y: 7 }, { x: 92, y: 15 },
];

export const CLOTHES = Object.values(PROPS).filter((p) => p.kind === 'clothes').map((p) => p.id);
