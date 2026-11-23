import type { SpeciesDef } from './types';

type Base = Omit<SpeciesDef, 'playable' | 'familyReady' | 'drinkStyle'> & Partial<Pick<SpeciesDef, 'playable' | 'familyReady' | 'drinkStyle'>>;

function sp(s: Base): SpeciesDef {
  return { playable: true, familyReady: true, drinkStyle: 'lap', ...s };
}

// 2026-11-23 (ordre de production du parent, docs/CARTOGRAPHIE_PARCOURS.md) : chaque famille garde ses 3 décors à elle,
// jamais mélangés. La savane d'origine (savanna) reste dans le code mais ne fait plus partie d'un parcours.
const AFRICA_LION = ['africa_baobab', 'africa_desert', 'africa_canyon'];
const AFRICA_ELEPHANT = ['africa_pond', 'africa_acacia_plain', 'africa_forest'];
const AFRICA_GIRAFFE = ['africa_waterhole', 'africa_plains', 'africa_green_meadow'];
// Amérique du Sud (2026-11-23) : chaque famille garde ses 3 décors. sa_jungle et sa_waterfall restent dans le code, hors parcours.
const SA_JAGUAR = ['sa_wetland', 'sa_river', 'sa_andes'];
const SA_SLOTH = ['sa_sloth_canopy', 'sa_sloth_roots', 'sa_sloth_refuge'];
const SA_TOUCAN = ['sa_canopy_branch', 'sa_canopy_treehouse', 'sa_canopy_sunrise'];
const ASIA_PANDA = ['asia_bamboo', 'asia_mountain', 'asia_arch', 'asia_garden', 'asia_pagoda'];
/** la panthère des neiges ne vit que sur les hauteurs : ni bambous, ni jardin, ni pagode (demande du parent, 2026-11-21) */
// + sa tanière enneigée, propre à elle seule (2026-11-21 : un 3e décor par animal, « mondes différents »)
const ASIA_HEIGHTS = ['asia_mountain', 'asia_arch', 'asia_snow_den'];

/**
 * 21 espèces principales (orque retirée le 2026-11-20, à la demande du parent) (cahier des charges §3). V2 : toutes jouables avec leur famille complète
 * (pictogramme provisoire tant que les dessins manquent). Chaque habitat est un lieu de SON continent
 * où l'espèce est plausible ; nourriture et capacités sont des faits simples, sans incohérence
 * (jamais de panda qui mange du poisson, jamais de manchot qui vole).
 */
export const SPECIES: readonly SpeciesDef[] = [
  sp({ id: 'lion', nameEn: 'lion', nameFr: 'lion', continentId: 'africa', allowedBiomes: AFRICA_LION, diet: 'carnivore', mobility: 'walk', icon: '🦁', drinkStyle: 'lap', foods: ['meat'], notFoods: ['bamboo', 'banana'], can: ['run', 'jump', 'roar', 'climb'], cannot: ['fly'], father: { name: 'Leo', personality: 'brave' }, mother: { name: 'Lola', personality: 'gentle' }, babyWord: { en: 'cub', fr: 'lionceau' } }),
  sp({ id: 'elephant', nameEn: 'elephant', nameFr: 'éléphant', continentId: 'africa', allowedBiomes: AFRICA_ELEPHANT, diet: 'herbivore', mobility: 'walk', icon: '🐘', drinkStyle: 'trunk', foods: ['grass', 'leaves', 'mango'], notFoods: ['meat', 'fish'], can: ['swim', 'run'], cannot: ['fly', 'jump'], father: { name: 'Bongo', personality: 'funny' }, mother: { name: 'Ellie', personality: 'wise' }, babyWord: { en: 'calf', fr: 'éléphanteau' } }),
  sp({ id: 'giraffe', nameEn: 'giraffe', nameFr: 'girafe', continentId: 'africa', allowedBiomes: AFRICA_GIRAFFE, diet: 'herbivore', mobility: 'walk', icon: '🦒', drinkStyle: 'splay', foods: ['leaves'], notFoods: ['meat', 'fish'], can: ['run'], cannot: ['fly', 'climb'], father: { name: 'Gus', personality: 'calm' }, mother: { name: 'Gina', personality: 'curious' }, babyWord: { en: 'calf', fr: 'girafon' } }),

  sp({ id: 'giant_panda', nameEn: 'panda', nameFr: 'panda géant', continentId: 'asia', allowedBiomes: ASIA_PANDA, diet: 'bamboo', mobility: 'walk', icon: '🐼', foods: ['bamboo'], notFoods: ['fish', 'meat'], can: ['climb'], cannot: ['fly'], father: { name: 'Bao', personality: 'sleepy' }, mother: { name: 'Mei', personality: 'gentle' }, babyWord: { en: 'cub', fr: 'bébé panda' } }),
  sp({ id: 'tiger', nameEn: 'tiger', nameFr: 'tigre', continentId: 'asia', allowedBiomes: ['asia_bamboo', 'asia_mountain', 'asia_arch'], diet: 'carnivore', mobility: 'walk', icon: '🐯', foods: ['meat'], notFoods: ['bamboo', 'berries'], can: ['swim', 'run', 'jump', 'roar'], cannot: ['fly'], father: { name: 'Raj', personality: 'proud' }, mother: { name: 'Tara', personality: 'calm' }, babyWord: { en: 'cub', fr: 'bébé tigre' } }),
  // la panthère des neiges remplace le panda roux (demande du parent, 2026-11-21 : « on a remplacé les pandarous par les panthères des neiges »)
  sp({ id: 'snow_leopard', nameEn: 'snow leopard', nameFr: 'panthère des neiges', continentId: 'asia', allowedBiomes: ASIA_HEIGHTS, diet: 'carnivore', mobility: 'walk', icon: '🐆', foods: ['meat'], notFoods: ['bamboo', 'berries'], can: ['climb', 'jump', 'run'], cannot: ['fly'], father: { name: 'Sasha', personality: 'quiet' }, mother: { name: 'Shanti', personality: 'gentle' }, babyWord: { en: 'cub', fr: 'bébé panthère' } }),

  sp({ id: 'fox', nameEn: 'fox', nameFr: 'renard', continentId: 'europe', allowedBiomes: ['europe_forest', 'europe_farm', 'europe_alps', 'europe_lake'], diet: 'omnivore', mobility: 'walk', icon: '🦊', foods: ['berries', 'worm'], notFoods: ['bamboo', 'grass'], can: ['run', 'jump', 'dig'], cannot: ['fly'], father: { name: 'Felix', personality: 'clever' }, mother: { name: 'Fiona', personality: 'kind' }, babyWord: { en: 'cub', fr: 'renardeau' } }),
  sp({ id: 'owl', nameEn: 'owl', nameFr: 'hibou', continentId: 'europe', allowedBiomes: ['europe_forest', 'europe_lake', 'europe_farm'], diet: 'carnivore', mobility: 'fly', icon: '🦉', drinkStyle: 'sip', foods: ['bug'], notFoods: ['bamboo', 'grass'], can: ['fly'], cannot: ['swim', 'run'], father: { name: 'Oscar', personality: 'wise' }, mother: { name: 'Olive', personality: 'calm' }, babyWord: { en: 'owlet', fr: 'petit hibou' } }),
  sp({ id: 'hedgehog', nameEn: 'hedgehog', nameFr: 'hérisson', continentId: 'europe', allowedBiomes: ['europe_forest', 'europe_farm', 'europe_coast'], diet: 'insectivore', mobility: 'walk', icon: '🦔', foods: ['bug', 'worm'], notFoods: ['fish', 'bamboo'], can: ['run'], cannot: ['fly', 'jump'], father: { name: 'Hugo', personality: 'shy' }, mother: { name: 'Hazel', personality: 'funny' }, babyWord: { en: 'hoglet', fr: 'bébé hérisson' } }),

  sp({ id: 'bear', nameEn: 'bear', nameFr: 'ours', continentId: 'north_america', allowedBiomes: ['na_redwoods', 'na_lake', 'na_coast', 'na_beaver_pond', 'na_redwood_trail'], diet: 'omnivore', mobility: 'walk', icon: '🐻', foods: ['fish', 'berries', 'honey'], notFoods: ['bamboo', 'grass'], can: ['climb', 'swim', 'run'], cannot: ['fly'], father: { name: 'Bruno', personality: 'strong' }, mother: { name: 'Bella', personality: 'warm' }, babyWord: { en: 'cub', fr: 'ourson' } }),
  sp({ id: 'bison', nameEn: 'bison', nameFr: 'bison', continentId: 'north_america', allowedBiomes: ['na_prairie', 'na_desert', 'na_lake'], diet: 'herbivore', mobility: 'walk', icon: '🦬', foods: ['grass'], notFoods: ['meat', 'fish'], can: ['run'], cannot: ['fly', 'climb'], father: { name: 'Buck', personality: 'calm' }, mother: { name: 'Daisy', personality: 'kind' }, babyWord: { en: 'calf', fr: 'bisonneau' } }),
  sp({ id: 'beaver', nameEn: 'beaver', nameFr: 'castor', continentId: 'north_america', allowedBiomes: ['na_lake', 'na_redwoods', 'na_beaver_pond', 'na_redwood_trail'], diet: 'herbivore', mobility: 'swim', icon: '🦫', foods: ['leaves'], notFoods: ['meat', 'fish'], can: ['swim', 'dig'], cannot: ['fly', 'climb'], father: { name: 'Benny', personality: 'busy' }, mother: { name: 'Bonnie', personality: 'clever' }, babyWord: { en: 'kit', fr: 'bébé castor' } }),

  sp({ id: 'jaguar', nameEn: 'jaguar', nameFr: 'jaguar', continentId: 'south_america', allowedBiomes: SA_JAGUAR, diet: 'carnivore', mobility: 'walk', icon: '🐆', foods: ['meat', 'fish'], notFoods: ['banana', 'grass'], can: ['swim', 'climb', 'run', 'roar'], cannot: ['fly'], father: { name: 'Juan', personality: 'quiet' }, mother: { name: 'Jade', personality: 'brave' }, babyWord: { en: 'cub', fr: 'bébé jaguar' } }),
  sp({ id: 'toucan', nameEn: 'toucan', nameFr: 'toucan', continentId: 'south_america', allowedBiomes: SA_TOUCAN, diet: 'frugivore', mobility: 'fly', icon: '🐦', drinkStyle: 'sip', foods: ['banana', 'berries', 'mango'], notFoods: ['meat', 'fish'], can: ['fly', 'hop'], cannot: ['swim', 'run'], father: { name: 'Tico', personality: 'chatty' }, mother: { name: 'Tina', personality: 'cheerful' }, babyWord: { en: 'chick', fr: 'bébé toucan' } }),
  sp({ id: 'sloth', nameEn: 'sloth', nameFr: 'paresseux', continentId: 'south_america', allowedBiomes: SA_SLOTH, diet: 'herbivore', mobility: 'climb', icon: '🦥', foods: ['leaves'], notFoods: ['meat', 'fish'], can: ['climb', 'swim'], cannot: ['fly', 'run', 'jump'], father: { name: 'Nico', personality: 'dreamy' }, mother: { name: 'Nina', personality: 'gentle' }, babyWord: { en: 'cub', fr: 'bébé paresseux' } }),

  sp({ id: 'kangaroo', nameEn: 'kangaroo', nameFr: 'kangourou', continentId: 'oceania', allowedBiomes: ['oc_outback', 'oc_eucalyptus', 'oc_gorge', 'oc_beach', 'oc_fern_forest', 'oc_gum_woodland', 'oc_rocky_cove'], diet: 'herbivore', mobility: 'jump', icon: '🦘', foods: ['grass'], notFoods: ['meat', 'fish'], can: ['hop', 'jump', 'run'], cannot: ['fly', 'climb'], father: { name: 'Kip', personality: 'bouncy' }, mother: { name: 'Kira', personality: 'caring' }, babyWord: { en: 'joey', fr: 'bébé kangourou' } }),
  sp({ id: 'koala', nameEn: 'koala', nameFr: 'koala', continentId: 'oceania', allowedBiomes: ['oc_eucalyptus', 'oc_beach', 'oc_gum_woodland', 'oc_rocky_cove'], diet: 'eucalyptus', mobility: 'climb', icon: '🐨', drinkStyle: 'none', foods: ['eucalyptus'], notFoods: ['meat', 'fish'], can: ['climb'], cannot: ['fly', 'swim'], father: { name: 'Kobi', personality: 'sleepy' }, mother: { name: 'Kali', personality: 'gentle' }, babyWord: { en: 'joey', fr: 'bébé koala' } }),
  sp({ id: 'frilled_lizard', nameEn: 'frilled lizard', nameFr: 'lézard à collerette', continentId: 'oceania', allowedBiomes: ['oc_outback', 'oc_eucalyptus', 'oc_gorge', 'oc_beach', 'oc_gum_woodland', 'oc_rocky_cove'], diet: 'insectivore', mobility: 'climb', icon: '🦎', foods: ['bug', 'worm'], notFoods: ['meat', 'banana'], can: ['climb', 'run'], cannot: ['fly'], father: { name: 'Frankie', personality: 'brave' }, mother: { name: 'Frida', personality: 'funny' }, babyWord: { en: 'hatchling', fr: 'bébé lézard' } }),

  sp({ id: 'penguin', nameEn: 'penguin', nameFr: 'manchot', continentId: 'antarctica', allowedBiomes: ['ice_coast', 'an_ice_cave', 'an_snowfield', 'open_sea', 'an_aurora'], diet: 'fish', mobility: 'walk_swim', icon: '🐧', drinkStyle: 'none', foods: ['fish', 'krill'], notFoods: ['banana', 'grass'], can: ['swim', 'hop'], cannot: ['fly', 'climb'], father: { name: 'Pip', personality: 'funny' }, mother: { name: 'Penny', personality: 'caring' }, babyWord: { en: 'chick', fr: 'poussin' } }),
  sp({ id: 'seal', nameEn: 'seal', nameFr: 'phoque', continentId: 'antarctica', allowedBiomes: ['ice_coast', 'open_sea', 'an_aurora'], diet: 'fish', mobility: 'swim', icon: '🦭', drinkStyle: 'none', foods: ['fish', 'krill'], notFoods: ['banana', 'grass'], can: ['swim'], cannot: ['fly', 'climb'], father: { name: 'Sam', personality: 'lazy' }, mother: { name: 'Sally', personality: 'playful' }, babyWord: { en: 'pup', fr: 'bébé phoque' } }),
  sp({ id: 'polar_bear', nameEn: 'polar bear', nameFr: 'ours polaire', continentId: 'antarctica', allowedBiomes: ['ice_coast', 'an_ice_cave', 'an_snowfield', 'open_sea', 'an_aurora'], diet: 'fish', mobility: 'walk_swim', icon: '🐻‍❄️', foods: ['fish'], notFoods: ['banana', 'grass'], can: ['swim', 'run'], cannot: ['fly', 'hop'], father: { name: 'Polo', personality: 'strong' }, mother: { name: 'Snowy', personality: 'gentle' }, babyWord: { en: 'cub', fr: 'ourson' } }),
];

export function getSpecies(id: string): SpeciesDef {
  const s = SPECIES.find((x) => x.id === id);
  if (!s) throw new Error(`Espèce inconnue : ${id}`);
  return s;
}

export function speciesOfContinent(continentId: SpeciesDef['continentId']): SpeciesDef[] {
  return SPECIES.filter((s) => s.continentId === continentId);
}

/** Espèces qui peuvent vivre dans un lieu. */
export function speciesOfPlace(placeId: string): SpeciesDef[] {
  return SPECIES.filter((s) => s.allowedBiomes.includes(placeId));
}
