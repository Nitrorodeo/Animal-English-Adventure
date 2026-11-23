import type { QuestArchetype } from '../../types';
import { speciesGame } from './def';

/** Jeux propres aux espèces de ce continent : lion, elephant, giraffe. */
export const AFRICA_SPECIES_ARCHETYPES: readonly QuestArchetype[] = [
  // le lion : la crinière, la patte, le rugissement, la sieste à l'ombre, le lionceau, la troupe
  speciesGame({ id: 'lion_mane', speciesIds: ['lion'], titleEn: "The lion's mane", titleFr: 'La crinière du lion', icon: '🦁', skillIds: ['1.5', '2.5', '2.3'], mechanic: 'tell', requiredAnchors: [], roles: ['mother', 'baby'], minStage: 'little' }),
  // l'éléphant : la trompe, les oreilles, les défenses, le barrissement, le troupeau
  speciesGame({ id: 'elephant_trunk', speciesIds: ['elephant'], titleEn: "The elephant's trunk", titleFr: "La trompe de l'éléphant", icon: '🐘', skillIds: ['1.5', '2.2', '1.3'], mechanic: 'fetch', requiredAnchors: [], roles: ['mother', 'baby'], minStage: 'little' }),
  // la girafe : le long cou, les feuilles tout en haut, la langue, les taches, la plus grande
  speciesGame({ id: 'giraffe_neck', speciesIds: ['giraffe'], titleEn: "The giraffe's long neck", titleFr: 'Le long cou de la girafe', icon: '🦒', skillIds: ['1.4', '2.2', '3.4'], mechanic: 'tell', requiredAnchors: [], roles: ['father', 'mother', 'baby'], minStage: 'little' }),
];
