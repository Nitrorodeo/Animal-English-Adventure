/**
 * Tous les lieux du jeu (un lieu = un décor). Les décors illustrés sont décrits dans les fichiers
 * JSON de ce dossier (un par continent : objets à toucher, emplacements, météo, sol) ; la savane
 * historique et l'Antarctique (décor provisoire, pas encore d'image) sont décrits ici.
 */
import type { Anchor, AnchorTag, BiomeDef, ContinentId, Line, PlaceId, Spot, Weather } from '../types';
import africa from './africa.json';
import asia from './asia.json';
import europe from './europe.json';
import northAmerica from './north_america.json';
import oceania from './oceania.json';
import southAmerica from './south_america.json';

interface RawAnchor {
  id: string;
  word: string;
  wordFr: string;
  icon: string;
  hit: Anchor['hit'];
  crop?: Anchor['crop'];
  stand?: { x: number; y: number };
  tags?: string[];
  check?: { q: Line; yes: boolean };
}
interface RawPlace {
  id: string;
  background: string;
  nameEn: string;
  nameFr: string;
  weather: string;
  groundY: number;
  anchors: RawAnchor[];
  spots: Spot[];
}
interface RawFile {
  continentId: string;
  places: RawPlace[];
  nouns: Record<string, { en: string; fr: string }>;
}

const GRADIENTS: Record<ContinentId, string> = {
  africa: 'linear-gradient(#8fd3ff, #f6d27a 55%, #d9a441)',
  asia: 'linear-gradient(#cfe8d0, #5fb36b 60%, #2f7a3e)',
  europe: 'linear-gradient(#e6f2d8, #8dbb5a 55%, #7a5a33)',
  north_america: 'linear-gradient(#cde8ff, #6fae6a 55%, #3d7f9e)',
  south_america: 'linear-gradient(#a8e6cf, #2e9b5a 55%, #135c34)',
  oceania: 'linear-gradient(#ffe2b8, #8fbf8a 50%, #4c8db0)',
  antarctica: 'linear-gradient(#d9f3ff, #ffffff 55%, #9fd8f0)',
};

function fromFile(file: RawFile): BiomeDef[] {
  const continentId = file.continentId as ContinentId;
  return file.places.map((p) => ({
    id: p.id,
    continentId,
    nameEn: p.nameEn,
    nameFr: p.nameFr,
    background: p.background,
    placeholderGradient: GRADIENTS[continentId],
    weather: p.weather as Weather,
    groundY: p.groundY,
    spots: p.spots,
    anchors: p.anchors.map((a) => ({ ...a, tags: (a.tags ?? []) as AnchorTag[] })),
  }));
}

const L = (en: string, fr: string): Line => ({ en, fr });

// Savane (V1) : points interactifs en % de l'image savanna (1672×941).
const SAVANNA: BiomeDef = {
  id: 'savanna',
  continentId: 'africa',
  nameEn: 'the savanna',
  nameFr: 'la savane',
  background: 'savanna',
  placeholderGradient: GRADIENTS.africa,
  weather: 'hot',
  groundY: 80,
  spots: [{ x: 6, y: 58 }, { x: 19, y: 42 }, { x: 33, y: 57 }, { x: 40, y: 47 }, { x: 47, y: 46 }, { x: 52, y: 57 }, { x: 58, y: 47 }, { x: 26, y: 40 }],
  anchors: [
    { id: 'waterhole', word: 'water', wordFr: "l'eau", icon: '💧', hit: { x: 17, y: 48, w: 33, h: 16 }, crop: { x: 13, y: 40, w: 40, h: 28 }, stand: { x: 42, y: 70 }, tags: ['water'], check: { q: L('Is the water blue?', "Est-ce que l'eau est bleue ?"), yes: true } },
    { id: 'acacia', word: 'tree', wordFr: "l'arbre", icon: '🌳', hit: { x: 0, y: 4, w: 20, h: 46 }, crop: { x: 0, y: 0, w: 46, h: 62 }, stand: { x: 10, y: 66 }, tags: ['climb', 'hide'], check: { q: L('Is the tree big?', "Est-ce que l'arbre est grand ?"), yes: true } },
    { id: 'shade', word: 'shade', wordFr: "l'ombre", icon: '⛱️', hit: { x: 0, y: 50, w: 13, h: 12 }, crop: { x: 0, y: 44, w: 18, h: 24 }, stand: { x: 12, y: 70 }, tags: [], check: { q: L('Is the shade hot?', "Est-ce que l'ombre est chaude ?"), yes: false } },
    { id: 'sun', word: 'sun', wordFr: 'le soleil', icon: '☀️', hit: { x: 82, y: 0, w: 15, h: 17 }, crop: { x: 77, y: 0, w: 23, h: 22 }, tags: ['sky'], check: { q: L('Is the sun cold?', 'Est-ce que le soleil est froid ?'), yes: false } },
    { id: 'rock', word: 'rock', wordFr: 'le rocher', icon: '🪨', hit: { x: 72, y: 70, w: 19, h: 17 }, crop: { x: 70, y: 66, w: 24, h: 24 }, stand: { x: 66, y: 86 }, tags: ['hide', 'climb'], check: { q: L('Is the rock big?', 'Est-ce que le rocher est gros ?'), yes: true } },
    { id: 'flower', word: 'flower', wordFr: 'la fleur', icon: '🌺', hit: { x: 2, y: 78, w: 12, h: 12 }, crop: { x: 0, y: 75, w: 18, h: 17 }, tags: ['plant'], check: { q: L('Is the flower orange?', 'Est-ce que la fleur est orange ?'), yes: true } },
    { id: 'grass', word: 'grass', wordFr: "l'herbe", icon: '🌾', hit: { x: 88, y: 58, w: 12, h: 18 }, crop: { x: 84, y: 55, w: 16, h: 25 }, tags: ['plant'], check: { q: L('Is the grass yellow?', "Est-ce que l'herbe est jaune ?"), yes: true } },
    { id: 'path', word: 'path', wordFr: 'le chemin', icon: '🛤️', hit: { x: 46, y: 74, w: 22, h: 18 }, crop: { x: 36, y: 58, w: 46, h: 42 }, stand: { x: 55, y: 80 }, tags: ['path'], check: { q: L('Is the path long?', 'Est-ce que le chemin est long ?'), yes: true } },
    { id: 'cloud', word: 'cloud', wordFr: 'le nuage', icon: '☁️', hit: { x: 51, y: 2, w: 21, h: 11 }, crop: { x: 50, y: 0, w: 24, h: 15 }, tags: ['sky'], check: { q: L('Is the cloud white?', 'Est-ce que le nuage est blanc ?'), yes: true } },
    { id: 'waterfall', word: 'waterfall', wordFr: 'la cascade', icon: '🌊', hit: { x: 16, y: 43, w: 8, h: 8 }, crop: { x: 13, y: 39, w: 13, h: 15 }, tags: [], check: { q: L('Is the waterfall big?', 'Est-ce que la cascade est grande ?'), yes: false } },
  ],
};

/**
 * Antarctique : pas encore d'image. Décor provisoire (dégradé) où les objets sont dessinés par
 * leur pictogramme, à l'endroit de leur zone tactile.
 */
const ICE_COAST: BiomeDef = {
  id: 'ice_coast',
  continentId: 'antarctica',
  nameEn: 'the ice',
  nameFr: 'la banquise',
  placeholderGradient: 'linear-gradient(#bfe6ff 0%, #e8f7ff 38%, #ffffff 39%, #eaf6fb 70%, #cdeaf5 100%)',
  weather: 'cold',
  groundY: 80,
  spots: [{ x: 8, y: 52 }, { x: 16, y: 44 }, { x: 24, y: 55 }, { x: 31, y: 46 }, { x: 38, y: 56 }, { x: 45, y: 47 }, { x: 52, y: 56 }, { x: 58, y: 45 }],
  anchors: [
    { id: 'iceberg', word: 'iceberg', wordFr: "l'iceberg", icon: '🧊', hit: { x: 6, y: 14, w: 16, h: 22 }, stand: { x: 16, y: 62 }, tags: ['hide', 'climb'], check: { q: L('Is the iceberg white?', "Est-ce que l'iceberg est blanc ?"), yes: true } },
    { id: 'sea', word: 'sea', wordFr: 'la mer', icon: '🌊', hit: { x: 28, y: 24, w: 22, h: 12 }, tags: ['sea'], check: { q: L('Is the sea hot?', 'Est-ce que la mer est chaude ?'), yes: false } },
    { id: 'snow', word: 'snow', wordFr: 'la neige', icon: '❄️', hit: { x: 30, y: 62, w: 14, h: 14 }, stand: { x: 36, y: 80 }, tags: [], check: { q: L('Is the snow cold?', 'Est-ce que la neige est froide ?'), yes: true } },
    { id: 'sun', word: 'sun', wordFr: 'le soleil', icon: '☀️', hit: { x: 84, y: 2, w: 12, h: 16 }, tags: ['sky'], check: { q: L('Is the sun blue?', 'Est-ce que le soleil est bleu ?'), yes: false } },
    { id: 'cloud', word: 'cloud', wordFr: 'le nuage', icon: '☁️', hit: { x: 56, y: 4, w: 16, h: 12 }, tags: ['sky'], check: { q: L('Is the cloud white?', 'Est-ce que le nuage est blanc ?'), yes: true } },
    { id: 'rock', word: 'rock', wordFr: 'le rocher', icon: '🪨', hit: { x: 4, y: 64, w: 12, h: 14 }, stand: { x: 12, y: 84 }, tags: ['hide'], check: { q: L('Is the rock grey?', 'Est-ce que le rocher est gris ?'), yes: true } },
    { id: 'mountain', word: 'mountain', wordFr: 'la montagne', icon: '🏔️', hit: { x: 64, y: 16, w: 22, h: 22 }, tags: [], check: { q: L('Is the mountain small?', 'Est-ce que la montagne est petite ?'), yes: false } },
    { id: 'igloo', word: 'ice cave', wordFr: 'la grotte de glace', icon: '🕳️', hit: { x: 48, y: 62, w: 12, h: 14 }, stand: { x: 54, y: 82 }, tags: ['hide'], check: { q: L('Is the ice cave cold?', 'Est-ce que la grotte de glace est froide ?'), yes: true } },
  ],
};

const OPEN_SEA: BiomeDef = {
  id: 'open_sea',
  continentId: 'antarctica',
  nameEn: 'the sea',
  nameFr: 'la mer',
  placeholderGradient: 'linear-gradient(#d9f3ff 0%, #b5e2fa 30%, #4fa3d1 31%, #2f7fb5 65%, #1b5e8c 100%)',
  weather: 'windy',
  groundY: 80,
  spots: [{ x: 8, y: 48 }, { x: 16, y: 56 }, { x: 24, y: 46 }, { x: 32, y: 57 }, { x: 40, y: 47 }, { x: 48, y: 56 }, { x: 55, y: 45 }, { x: 59, y: 56 }],
  anchors: [
    { id: 'iceberg', word: 'iceberg', wordFr: "l'iceberg", icon: '🧊', hit: { x: 8, y: 12, w: 18, h: 22 }, stand: { x: 18, y: 66 }, tags: ['hide'], check: { q: L('Is the iceberg big?', "Est-ce que l'iceberg est grand ?"), yes: true } },
    { id: 'sea', word: 'sea', wordFr: 'la mer', icon: '🌊', hit: { x: 30, y: 62, w: 24, h: 14 }, tags: ['sea'], check: { q: L('Is the sea blue?', 'Est-ce que la mer est bleue ?'), yes: true } },
    { id: 'wave', word: 'wave', wordFr: 'la vague', icon: '🌊', hit: { x: 4, y: 64, w: 14, h: 12 }, tags: [], check: { q: L('Is the wave white?', 'Est-ce que la vague est blanche ?'), yes: true } },
    { id: 'ice', word: 'ice', wordFr: 'la glace', icon: '🧊', hit: { x: 34, y: 22, w: 14, h: 10 }, stand: { x: 40, y: 66 }, tags: ['climb'], check: { q: L('Is the ice hot?', 'Est-ce que la glace est chaude ?'), yes: false } },
    { id: 'sun', word: 'sun', wordFr: 'le soleil', icon: '🌤️', hit: { x: 84, y: 2, w: 12, h: 16 }, tags: ['sky'], check: { q: L('Is the sun yellow?', 'Est-ce que le soleil est jaune ?'), yes: true } },
    { id: 'cloud', word: 'cloud', wordFr: 'le nuage', icon: '☁️', hit: { x: 56, y: 4, w: 16, h: 12 }, tags: ['sky'], check: { q: L('Is the cloud green?', 'Est-ce que le nuage est vert ?'), yes: false } },
    { id: 'boat', word: 'boat', wordFr: 'le bateau', icon: '⛵', hit: { x: 62, y: 16, w: 12, h: 14 }, tags: [], check: { q: L('Is the boat small?', 'Est-ce que le bateau est petit ?'), yes: true } },
    { id: 'bird', word: 'bird', wordFr: "l'oiseau", icon: '🕊️', hit: { x: 30, y: 6, w: 10, h: 10 }, tags: ['sky'], check: { q: L('Is the bird white?', "Est-ce que l'oiseau est blanc ?"), yes: true } },
  ],
};

const FILES = [africa, asia, europe, northAmerica, southAmerica, oceania] as unknown as RawFile[];

const LIST: BiomeDef[] = [SAVANNA, ...FILES.flatMap(fromFile), ICE_COAST, OPEN_SEA];

export const PLACES: Readonly<Record<PlaceId, BiomeDef>> = Object.fromEntries(LIST.map((p) => [p.id, p]));

/** Lieux d'un continent, dans l'ordre des fichiers. */
export function placesOf(continentId: ContinentId): BiomeDef[] {
  return LIST.filter((p) => p.continentId === continentId);
}

/** Réponse à « What's this? » pour chaque mot des décors (article correct). */
export const NOUNS: Readonly<Record<string, Line>> = {
  shade: L('Shade', "De l'ombre"),
  iceberg: L('An iceberg', 'Un iceberg'),
  'ice cave': L('An ice cave', 'Une grotte de glace'),
  ice: L('Ice', 'De la glace'),
  boat: L('A boat', 'Un bateau'),
  bird: L('A bird', 'Un oiseau'),
  ...Object.assign({}, ...FILES.map((f) => f.nouns)),
  // corrections de la V1 (savane) : le soleil est unique
  sun: L('The sun', 'Le soleil'),
  water: L('Water', "De l'eau"),
};
