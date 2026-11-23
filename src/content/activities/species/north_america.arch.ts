import type { QuestArchetype } from '../../types';
import { speciesGame } from './def';

/** Jeux propres aux espèces de ce continent : bear, bison, beaver. */
export const NORTH_AMERICA_SPECIES_ARCHETYPES: readonly QuestArchetype[] = [
  // l'ours : ses pattes, ses griffes, sa fourrure ; il renifle le miel et dort dans sa tanière
  speciesGame({ id: 'bear_honey', speciesIds: ['bear'], titleEn: 'Sniff, sniff! Honey!', titleFr: 'Snif, snif ! Du miel !', icon: '🍯', skillIds: ['1.5', '1.6', '2.2'], mechanic: 'fetch', requiredAnchors: [], roles: ['father', 'mother', 'baby'], minStage: 'little' }),
  // le bison : ses cornes, sa bosse, son troupeau ; il tape des sabots et se roule dans la poussière
  speciesGame({ id: 'bison_herd', speciesIds: ['bison'], titleEn: 'The bison herd', titleFr: 'Le troupeau de bisons', icon: '🦬', skillIds: ['1.5', '1.3', '2.2'], mechanic: 'count', requiredAnchors: [], roles: ['father', 'mother', 'baby'], minStage: 'little' }),
  // le castor : ses grandes dents, sa queue plate ; il ronge le bois, construit un barrage et vit dans sa hutte
  speciesGame({ id: 'beaver_dam', speciesIds: ['beaver'], titleEn: "The beaver's dam", titleFr: 'Le barrage du castor', icon: '🦫', skillIds: ['1.5', '1.3', '2.3'], mechanic: 'build', requiredAnchors: [], roles: ['father', 'mother', 'baby'], minStage: 'little' }),
];
