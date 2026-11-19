import { PLACES, placesOf } from './places';
import type { BiomeDef, BiomeId, ContinentDef, ContinentId } from './types';

type ContinentBase = Omit<ContinentDef, 'biomes'>;

// Zones cliquables en % de l'image world_map (1448×1086).
const BASE: readonly ContinentBase[] = [
  { id: 'north_america', nameEn: 'North America', nameFr: 'Amérique du Nord', mapHit: { x: 2, y: 8, w: 32, h: 34 }, label: { x: 17, y: 9 } },
  { id: 'south_america', nameEn: 'South America', nameFr: 'Amérique du Sud', mapHit: { x: 6, y: 43, w: 26, h: 37 }, label: { x: 19, y: 81 } },
  { id: 'europe', nameEn: 'Europe', nameFr: 'Europe', mapHit: { x: 35, y: 9, w: 25, h: 21 }, label: { x: 47, y: 8 } },
  { id: 'africa', nameEn: 'Africa', nameFr: 'Afrique', mapHit: { x: 31, y: 31, w: 30, h: 39 }, label: { x: 46, y: 71 } },
  { id: 'asia', nameEn: 'Asia', nameFr: 'Asie', mapHit: { x: 60, y: 9, w: 38, h: 36 }, label: { x: 80, y: 8 } },
  { id: 'oceania', nameEn: 'Oceania', nameFr: 'Océanie', mapHit: { x: 68, y: 47, w: 29, h: 28 }, label: { x: 83, y: 76 } },
  { id: 'antarctica', nameEn: 'Antarctica', nameFr: 'Antarctique', mapHit: { x: 22, y: 75, w: 54, h: 21 }, label: { x: 49, y: 95 } },
];

/** Les 7 continents, chacun avec tous ses lieux (décors). Aucun n'est verrouillé. */
export const CONTINENTS: readonly ContinentDef[] = BASE.map((c) => ({ ...c, biomes: placesOf(c.id).map((p) => p.id) }));

/** Tous les lieux, par identifiant (nom historique : BIOMES). */
export const BIOMES: Readonly<Record<BiomeId, BiomeDef>> = PLACES;

export function getContinent(id: ContinentId): ContinentDef {
  const c = CONTINENTS.find((x) => x.id === id);
  if (!c) throw new Error(`Continent inconnu : ${id}`);
  return c;
}

export function getBiome(id: BiomeId): BiomeDef {
  const b = PLACES[id];
  if (!b) throw new Error(`Lieu inconnu : ${id}`);
  return b;
}

export const getPlace = getBiome;

export function getAnchor(biomeId: BiomeId, anchorId: string) {
  return PLACES[biomeId]?.anchors.find((a) => a.id === anchorId);
}
