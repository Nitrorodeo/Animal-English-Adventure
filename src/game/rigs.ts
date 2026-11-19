import type { RigDef } from './puppet';
import autoRigs from './autoRigs.json';

/**
 * Squelettes des personnages animés (repères en pixels de l'image `public/assets/characters/<sprite>.webp`).
 * Tous les personnages ont un squelette : calculé sur la silhouette par `tools/auto_rigs.py`
 * (src/game/autoRigs.json, à relancer après `npm run assets`), sauf ceux réglés à la main ci-dessous,
 * prioritaires. Un personnage sans squelette garderait son image fixe et les animations CSS.
 * Les pattes n'ont pas de parent : elles restent au sol quand le corps se penche.
 */
const HAND_RIGS: Record<string, RigDef> = {
  // Leo, le papa lion (527 × 720), de trois quarts, regarde vers la droite
  lion_father: {
    sprite: 'lion_father',
    width: 527,
    height: 720,
    facing: 1,
    mouth: [372, 262],
    bones: [
      { id: 'body', pivot: [125, 470], tip: [300, 440], strength: 1.1, layer: 2 },
      { id: 'head', parent: 'body', pivot: [295, 420], tip: [370, 170], strength: 1.6, layer: 4 },
      { id: 'tail', parent: 'body', pivot: [100, 455], tip: [25, 430], layer: 1 },
      { id: 'tailTip', parent: 'tail', pivot: [25, 430], tip: [60, 300], layer: 1 },
      { id: 'legFL', pivot: [222, 500], tip: [232, 700], layer: 3 },
      { id: 'legFR', pivot: [355, 505], tip: [385, 690], layer: 3 },
      { id: 'legBL', pivot: [85, 530], tip: [60, 680] },
      { id: 'legBR', pivot: [150, 560], tip: [150, 670], strength: 0.8 },
    ],
  },
};

export const RIGS: Readonly<Record<string, RigDef>> = { ...(autoRigs as unknown as Record<string, RigDef>), ...HAND_RIGS };

export function rigFor(sprite: string | undefined): RigDef | undefined {
  return sprite ? RIGS[sprite] : undefined;
}
