import type { QuestArchetype } from '../../types';
import { speciesGame } from './def';

/** Jeux propres aux espèces de ce continent : fox, owl, hedgehog (déroulés dans `europe.ts`). */
export const EUROPE_SPECIES_ARCHETYPES: readonly QuestArchetype[] = [
  // le renard : son cri, sa queue touffue, ses grandes oreilles, ses tours (bondir, creuser), son flair, sa tanière
  speciesGame({ id: 'fox_tricks', speciesIds: ['fox'], titleEn: 'Fox tricks!', titleFr: 'Les tours du renard', icon: '🦊', skillIds: ['1.5', '2.2'], mechanic: 'plan', requiredAnchors: [], roles: ['father', 'baby'], minStage: 'little' }),
  // le hibou : la nuit, son cri, ses grands yeux, sa tête qui tourne, ses plumes, ses ailes, l'« owlet »
  speciesGame({ id: 'owl_night', speciesIds: ['owl'], titleEn: 'Night owl!', titleFr: 'Hibou de nuit', icon: '🦉', skillIds: ['1.5', '2.2'], mechanic: 'observe', requiredAnchors: [], roles: ['mother', 'baby'], minStage: 'little' }),
  // le hérisson : ses piquants, la boule, le lit de feuilles, les scarabées et les vers, le « hoglet »
  speciesGame({ id: 'hedgehog_ball', speciesIds: ['hedgehog'], titleEn: 'Curl up, hedgehog!', titleFr: 'En boule, petit hérisson !', icon: '🦔', skillIds: ['1.5', '1.6'], mechanic: 'build', requiredAnchors: [], roles: ['mother', 'baby'], minStage: 'little' }),
];
