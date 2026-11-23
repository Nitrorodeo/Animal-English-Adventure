import type { QuestArchetype } from '../../types';
import { speciesGame } from './def';

/** Jeux propres aux espèces de ce continent : jaguar, toucan, sloth. */
export const SOUTH_AMERICA_SPECIES_ARCHETYPES: readonly QuestArchetype[] = [
  // le jaguar : les taches, les empreintes de pattes, marcher sans bruit, il nage, des yeux perçants la nuit
  speciesGame({ id: 'jaguar_quiet_paws', speciesIds: ['jaguar'], titleEn: 'Quiet paws', titleFr: 'Des pattes sans bruit', icon: '🐆', skillIds: ['1.5', '2.2', '1.3'], mechanic: 'observe', requiredAnchors: [], roles: ['father', 'mother', 'baby'], minStage: 'little' }),
  // le toucan : le grand bec plein de couleurs, lancer et rattraper les fruits, le trou dans l'arbre, les ailes
  speciesGame({ id: 'toucan_big_beak', speciesIds: ['toucan'], titleEn: 'My big beak', titleFr: 'Mon grand bec', icon: '🦜', skillIds: ['1.5', '1.2', '1.6'], mechanic: 'observe', requiredAnchors: [], roles: ['father', 'mother', 'baby'], minStage: 'little' }),
  // le paresseux : très lent, les longues griffes, se suspendre la tête en bas, les feuilles, dormir beaucoup
  speciesGame({ id: 'sloth_slow_slow', speciesIds: ['sloth'], titleEn: 'Slow, slow sloth', titleFr: 'Le paresseux tout lent', icon: '🦥', skillIds: ['1.5', '2.2', '3.3'], mechanic: 'observe', requiredAnchors: [], roles: ['father', 'mother', 'baby'], minStage: 'little' }),
];
