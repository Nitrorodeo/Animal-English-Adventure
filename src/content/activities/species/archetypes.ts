import type { QuestArchetype } from '../../types';
import { AFRICA_SPECIES_ARCHETYPES } from './africa.arch';
import { ASIA_SPECIES_ARCHETYPES } from './asia.arch';
import { EUROPE_SPECIES_ARCHETYPES } from './europe.arch';
import { NORTH_AMERICA_SPECIES_ARCHETYPES } from './north_america.arch';
import { SOUTH_AMERICA_SPECIES_ARCHETYPES } from './south_america.arch';
import { OCEANIA_SPECIES_ARCHETYPES } from './oceania.arch';
import { ANTARCTICA_SPECIES_ARCHETYPES } from './antarctica.arch';

/** Fiches des jeux propres à chaque espèce, tous continents. */
export const SPECIES_ARCHETYPES: readonly QuestArchetype[] = [
  ...AFRICA_SPECIES_ARCHETYPES,
  ...ASIA_SPECIES_ARCHETYPES,
  ...EUROPE_SPECIES_ARCHETYPES,
  ...NORTH_AMERICA_SPECIES_ARCHETYPES,
  ...SOUTH_AMERICA_SPECIES_ARCHETYPES,
  ...OCEANIA_SPECIES_ARCHETYPES,
  ...ANTARCTICA_SPECIES_ARCHETYPES,
];
