/**
 * Tous les lieux du jeu (un lieu = un décor). Les décors illustrés sont décrits dans les fichiers
 * JSON de ce dossier (un par continent : objets à toucher, emplacements, météo, sol) ; seule la
 * savane historique est décrite ici.
 */
import type { Anchor, AnchorTag, BiomeDef, ContinentId, Line, PlaceId, Spot, Weather } from '../types';
import africa from './africa.json';
import antarctica from './antarctica.json';
import asia from './asia.json';
import europe from './europe.json';
import northAmerica from './north_america.json';
import oceania from './oceania.json';
import southAmerica from './south_america.json';
import { PLACE_DEPTH } from './depth';

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
  // 2026-11-22 : tous sur la terre ferme (deux tombaient dans la mare, un sur les rochers de la cascade)
  spots: [{ x: 6, y: 72 }, { x: 18, y: 73 }, { x: 30, y: 74 }, { x: 42, y: 77 }, { x: 48, y: 68 }, { x: 66, y: 64 }, { x: 80, y: 60 }, { x: 47, y: 46 }],
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
    { id: 'acacia_far', word: 'acacia', wordFr: "l'acacia", icon: '🌳', hit: { x: 79, y: 22, w: 20, h: 22 }, crop: { x: 75, y: 18, w: 25, h: 30 }, tags: ['plant'], check: { q: L('Is the acacia tree green?', "Est-ce que l'acacia est vert ?"), yes: true } },
  ],
};

const FILES = [africa, asia, europe, northAmerica, southAmerica, oceania, antarctica] as unknown as RawFile[];

// horizon, fond et rochers mesurés sur chaque décor (perspective des animaux posés au doigt)
const LIST: BiomeDef[] = [SAVANNA, ...FILES.flatMap(fromFile)].map((p) => ({ ...p, ...PLACE_DEPTH[p.id] }));

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
