import type { QuestArchetype } from '../../types';

/**
 * Jeux propres à une espèce (« chaque animal a son jeu et son vocabulaire »).
 * Un fichier par continent : `<continent>.arch.ts` (la fiche du jeu, sans dépendance) et
 * `<continent>.ts` (son déroulé). `speciesIds` réserve le jeu à ces espèces ; `allowedBiomes`
 * peut en plus le limiter à certains décors.
 */
type G = Omit<QuestArchetype, 'allowedBiomes' | 'implemented' | 'actorKinds' | 'speciesIds'> &
  Partial<Pick<QuestArchetype, 'allowedBiomes' | 'actorKinds'>> & { speciesIds: string[] };
export const speciesGame = (x: G): QuestArchetype => ({ allowedBiomes: [], actorKinds: ['adult', 'baby'], implemented: true, ...x });
