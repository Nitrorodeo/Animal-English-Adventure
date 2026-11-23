import type { QuestArchetype } from '../../types';
import { speciesGame } from './def';

/** Jeux propres aux espèces de ce continent : giant_panda, tiger, snow_leopard (déroulés dans `asia.ts`). */
export const ASIA_SPECIES_ARCHETYPES: readonly QuestArchetype[] = [
  // le panda : noir et blanc, les oreilles noires, le bambou (sa vraie nourriture), « munch », le ventre rond, la roulade
  speciesGame({ id: 'panda_picnic', speciesIds: ['giant_panda'], titleEn: 'Bamboo picnic!', titleFr: 'Le pique-nique de bambou', icon: '🐼', skillIds: ['1.6', '1.5'], mechanic: 'fetch', requiredAnchors: [], roles: ['mother', 'baby'], minStage: 'little' }),
  // le tigre : les rayures, la fourrure orange, « Roar! », se cacher dans les bambous, il adore nager ; jamais de chasse
  speciesGame({ id: 'tiger_stripes', speciesIds: ['tiger'], titleEn: 'Tiger stripes!', titleFr: 'Les rayures du tigre', icon: '🐯', skillIds: ['1.5', '1.2', '2.2'], mechanic: 'identify', requiredAnchors: [], roles: ['father', 'baby'], minStage: 'little' }),
  // la panthère des neiges : « Chuff, chuff! » (elle ne rugit pas), la queue touffue sur le nez, les grosses pattes poilues, la fourrure épaisse, les grands bonds
  speciesGame({ id: 'leopard_leap', speciesIds: ['snow_leopard'], titleEn: 'Snow leopard leaps!', titleFr: 'Les grands bonds de la panthère', icon: '🐆', skillIds: ['1.5', '2.2', '1.3'], mechanic: 'guide', requiredAnchors: [], roles: ['mother', 'baby'], minStage: 'little' }),
];
