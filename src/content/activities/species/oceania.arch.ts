import type { QuestArchetype } from '../../types';
import { speciesGame } from './def';

/** Jeux propres aux espèces de ce continent : kangaroo, koala, frilled_lizard. */
export const OCEANIA_SPECIES_ARCHETYPES: readonly QuestArchetype[] = [
  // le kangourou : la poche de Maman, le joey, les grands pieds, la queue solide, sauter sur les empreintes
  speciesGame({ id: 'kangaroo_hop', speciesIds: ['kangaroo'], titleEn: 'Hop like a kangaroo!', titleFr: 'Saute comme un kangourou !', icon: '🦘', skillIds: ['1.5', '2.2'], mechanic: 'guide', requiredAnchors: [], roles: ['father', 'mother', 'baby'] }),
  // le koala : son arbre (eucalyptus), le câlin à l'arbre, les feuilles d'eucalyptus, les oreilles toutes douces, la sieste
  speciesGame({ id: 'koala_sleepy', speciesIds: ['koala'], titleEn: 'The sleepy koala', titleFr: 'Le koala qui dort', icon: '🐨', skillIds: ['1.5', '1.6'], mechanic: 'teach', requiredAnchors: [], roles: ['mother', 'baby'] }),  // Maman ou le bébé : « Look at Daddy! » ne sort jamais de la bouche de Papa
  // le lézard à collerette : la collerette orange, « Hsss! », se chauffer au soleil, les insectes, courir sur deux pattes
  speciesGame({ id: 'lizard_frill', speciesIds: ['frilled_lizard'], titleEn: 'Open your frill!', titleFr: 'Ouvre ta collerette !', icon: '🦎', skillIds: ['1.5', '2.2'], mechanic: 'puzzle', requiredAnchors: [], roles: ['mother', 'baby'] }),  // idem : « Can Daddy open his frill? »
];
