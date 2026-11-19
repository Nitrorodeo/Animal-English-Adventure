/**
 * Album souvenir de la famille (passeport) : une photo à chaque naissance et à chaque stade atteint.
 *
 * Rien n'est stocké en plus : l'album se déduit des bébés (un stade ne recule jamais), ce qui le
 * remplit aussi pour les parties commencées avant son arrivée (2026-11-19).
 */
import { GROWTH_STAGES, type GrowthStage, type Sex } from '../content/types';
import type { GameState } from './state';

export interface AlbumPhoto {
  key: string;
  speciesId: string;
  babyId: string;
  babyName: string;
  sex: Sex;
  /** stade montré sur la photo */
  stage: GrowthStage;
  /** naissance (avec les parents) ou nouveau stade */
  kind: 'born' | 'grew';
}

/** Photos de toutes les familles, dans l'ordre : famille, puis bébé (aîné d'abord), puis stade. */
export function familyAlbum(state: GameState): AlbumPhoto[] {
  const out: AlbumPhoto[] = [];
  for (const family of Object.values(state.families)) {
    const babies = [...family.babies].sort((a, b) => a.birthOrder - b.birthOrder);
    for (const b of babies) {
      const reached = Math.max(0, GROWTH_STAGES.indexOf(b.stage));
      for (let i = 0; i <= reached; i++) {
        const stage = GROWTH_STAGES[i]!;
        out.push({ key: `${family.speciesId}:${b.id}:${stage}`, speciesId: family.speciesId, babyId: b.id, babyName: b.name, sex: b.sex, stage, kind: i === 0 ? 'born' : 'grew' });
      }
    }
  }
  return out;
}
