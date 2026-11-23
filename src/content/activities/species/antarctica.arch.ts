import type { QuestArchetype } from '../../types';
import { speciesGame } from './def';

/** Jeux propres aux espèces de ce continent : penguin, seal, polar_bear. */
export const ANTARCTICA_SPECIES_ARCHETYPES: readonly QuestArchetype[] = [
  // le manchot : se dandiner, les nageoires, glisser sur le ventre, se serrer contre le froid, le nid de cailloux
  speciesGame({ id: 'penguin_waddle', speciesIds: ['penguin'], allowedBiomes: ['open_sea', 'an_aurora', 'an_penguin_cave'], titleEn: 'Waddle and slide!', titleFr: 'Dandine et glisse !', icon: '🐧', skillIds: ['1.5', '2.2', '1.3'], mechanic: 'tell', requiredAnchors: [], roles: ['father', 'mother', 'baby'], minStage: 'little' }),
  // le phoque : les moustaches, plonger, applaudir avec les nageoires, le bébé (pup), le trou pour respirer
  speciesGame({ id: 'seal_whiskers', speciesIds: ['seal'], allowedBiomes: ['an_seal_aurora', 'an_seal_rocks', 'an_seal_sunset'], titleEn: "The seal's whiskers", titleFr: 'Les moustaches du phoque', icon: '🦭', skillIds: ['1.5', '2.5', '2.1'], mechanic: 'observe', requiredAnchors: [], roles: ['mother', 'father', 'baby'], minStage: 'little' }),
  // l'ours polaire : la fourrure blanche, le nez noir, nager en pagayant, se rouler dans la neige, l'ourson
  speciesGame({ id: 'polar_bear_fur', speciesIds: ['polar_bear'], allowedBiomes: ['ice_coast', 'an_ice_cave', 'an_snowfield'], titleEn: 'White like the snow', titleFr: 'Blanc comme la neige', icon: '🐻‍❄️', skillIds: ['1.2', '1.5', '2.2'], mechanic: 'identify', requiredAnchors: [], roles: ['mother', 'father', 'baby'], minStage: 'little' }),
];
