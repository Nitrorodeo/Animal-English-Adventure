/** Registre des aventures de tous les continents et de leurs trésors. */
import type { AdventureDef, TreasureDef } from '../types';
import { AFRICA } from './africa';
import { ANTARCTICA } from './antarctica';
import { ASIA } from './asia';
import { EUROPE } from './europe';
import type { AdventurePack } from './kit';
import { NORTH_AMERICA } from './north_america';
import { OCEANIA } from './oceania';
import { SOUTH_AMERICA } from './south_america';

const PACKS: readonly AdventurePack[] = [AFRICA, ASIA, EUROPE, NORTH_AMERICA, SOUTH_AMERICA, OCEANIA, ANTARCTICA];

export const ADVENTURES: readonly AdventureDef[] = PACKS.flatMap((p) => p.adventures);
export const ADVENTURE_BY_ID: Readonly<Record<string, AdventureDef>> = Object.fromEntries(ADVENTURES.map((a) => [a.id, a]));
export const TREASURES: Readonly<Record<string, TreasureDef>> = Object.fromEntries(PACKS.flatMap((p) => p.treasures).map((t) => [t.id, t]));

export const adventuresOf = (continentId: string) => ADVENTURES.filter((a) => a.continentId === continentId).sort((a, b) => a.order - b.order);
