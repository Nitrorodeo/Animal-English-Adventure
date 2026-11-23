import type { ActivityDef } from '../../types';
import { AFRICA_SPECIES_ACTIVITIES } from './africa';
import { ASIA_SPECIES_ACTIVITIES } from './asia';
import { EUROPE_SPECIES_ACTIVITIES } from './europe';
import { NORTH_AMERICA_SPECIES_ACTIVITIES } from './north_america';
import { SOUTH_AMERICA_SPECIES_ACTIVITIES } from './south_america';
import { OCEANIA_SPECIES_ACTIVITIES } from './oceania';
import { ANTARCTICA_SPECIES_ACTIVITIES } from './antarctica';

/** Déroulés des jeux propres à chaque espèce, tous continents. */
export const SPECIES_ACTIVITIES: readonly ActivityDef[] = [
  ...AFRICA_SPECIES_ACTIVITIES,
  ...ASIA_SPECIES_ACTIVITIES,
  ...EUROPE_SPECIES_ACTIVITIES,
  ...NORTH_AMERICA_SPECIES_ACTIVITIES,
  ...SOUTH_AMERICA_SPECIES_ACTIVITIES,
  ...OCEANIA_SPECIES_ACTIVITIES,
  ...ANTARCTICA_SPECIES_ACTIVITIES,
];
