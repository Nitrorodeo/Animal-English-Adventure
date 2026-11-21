import { PLACES, placesOf } from './places';
import type { BiomeDef, BiomeId, ContinentDef, ContinentId } from './types';

type ContinentBase = Omit<ContinentDef, 'biomes'>;

// Zones cliquables en % de l'image world_map élargie (2172×1086, voir scripts/map_wide.py), recentrée le
// 2026-11-20 (scripts/map_center.py : tout le dessin a reculé de 135 px, soit 6,2 %).
const BASE: readonly ContinentBase[] = [
  { id: 'north_america', nameEn: 'North America', nameFr: 'Amérique du Nord', mapHit: { x: 2.4, y: 8, w: 34.2, h: 34 }, label: { x: 17.5, y: 9 } },
  { id: 'south_america', nameEn: 'South America', nameFr: 'Amérique du Sud', mapHit: { x: 6, y: 43, w: 24.2, h: 37 }, label: { x: 18.9, y: 81 } },
  { id: 'europe', nameEn: 'Europe', nameFr: 'Europe', mapHit: { x: 37.6, y: 9, w: 22.5, h: 21 }, label: { x: 49.9, y: 8 } },
  { id: 'africa', nameEn: 'Africa', nameFr: 'Afrique', mapHit: { x: 31, y: 31, w: 34.7, h: 39 }, label: { x: 40.5, y: 66 } },
  { id: 'asia', nameEn: 'Asia', nameFr: 'Asie', mapHit: { x: 60.6, y: 9, w: 36, h: 36 }, label: { x: 80.5, y: 8 } },
  { id: 'oceania', nameEn: 'Oceania', nameFr: 'Océanie', mapHit: { x: 72.5, y: 47, w: 22, h: 28 }, label: { x: 82.5, y: 76 } },
  { id: 'antarctica', nameEn: 'Antarctica', nameFr: 'Antarctique', mapHit: { x: 20.6, y: 75, w: 57.1, h: 21 }, label: { x: 33, y: 88 } },
];

/** Zones de l'ancienne carte (1448×1086) : pour recaler les autocollants des parties d'avant l'élargissement. */
export const OLD_MAP_HITS: Readonly<Record<ContinentId, { x: number; w: number }>> = {
  north_america: { x: 2, w: 32 },
  south_america: { x: 6, w: 26 },
  europe: { x: 35, w: 25 },
  africa: { x: 31, w: 30 },
  asia: { x: 60, w: 38 },
  oceania: { x: 68, w: 29 },
  antarctica: { x: 22, w: 54 },
};

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
