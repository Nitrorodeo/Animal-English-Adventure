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

type P = readonly [number, number];
/**
 * Kangourous (2026-11-26) : réglés à la main sur chaque dessin pour qu'ils bondissent (`hopPose`) : hanche
 * (corps), tête, queue en deux parties, et les pattes arrière (`feet`, et `feet2` pour la patte du fond).
 * Les petits regardent vers la droite (le calcul automatique les croyait tournés vers la gauche).
 */
function kangaroo(sprite: string, width: number, height: number, facing: 1 | -1, mouth: P, b: { body: [P, P]; head: [P, P]; tail: [P, P, P]; feet: [P, P]; feet2: [P, P] }): RigDef {
  return {
    sprite,
    width,
    height,
    facing,
    mouth,
    drinkDip: 0,
    bones: [
      { id: 'body', pivot: b.body[0], tip: b.body[1], strength: 1.1, layer: 2 },
      { id: 'head', parent: 'body', pivot: b.head[0], tip: b.head[1], strength: 1.6, layer: 4 },
      { id: 'tail', parent: 'body', pivot: b.tail[0], tip: b.tail[1], layer: 1 },
      { id: 'tailTip', parent: 'tail', pivot: b.tail[1], tip: b.tail[2], layer: 1 },
      { id: 'feet', pivot: b.feet[0], tip: b.feet[1], layer: 3 },
      { id: 'feet2', pivot: b.feet2[0], tip: b.feet2[1], layer: 1 },
    ],
  };
}
const companion = (sprite: string, width: number, height: number, headTop: number) =>
  kangaroo(sprite, width, height, 1, [240, 105], { body: [[140, 215], [215, 150]], head: [[210, 140], [225, headTop]], tail: [[110, 255], [60, 276], [10, 278]], feet: [[165, 245], [185, 292]], feet2: [[215, 245], [255, 285]] });
const young = (sprite: string, width: number, height: number, dy: number) =>
  kangaroo(sprite, width, height, 1, [202, 100 + dy], { body: [[110, 190 + dy], [175, 140 + dy]], head: [[180, 130 + dy], [188, 42 + dy]], tail: [[80, 210 + dy], [40, 235 + dy], [10, 226 + dy]], feet: [[115, 225 + dy], [132, 280 + dy]], feet2: [[160, 225 + dy], [205, 233 + dy]] });
const little = (sprite: string, width: number, height: number, dy: number) =>
  kangaroo(sprite, width, height, 1, [180, 115 + dy], { body: [[110, 200 + dy], [165, 150 + dy]], head: [[160, 140 + dy], [165, 48 + dy]], tail: [[70, 225 + dy], [35, 245 + dy], [5, 230 + dy]], feet: [[115, 225 + dy], [127, 262 + dy]], feet2: [[150, 225 + dy], [200, 250 + dy]] });
const KANGAROO_RIGS: Record<string, RigDef> = Object.fromEntries(
  [
    // Kip, le papa (486 × 472), regarde vers la droite
    kangaroo('kangaroo_father', 486, 472, 1, [430, 150], { body: [[320, 350], [395, 230]], head: [[395, 200], [425, 70]], tail: [[250, 400], [140, 435], [30, 440]], feet: [[330, 400], [440, 452]], feet2: [[420, 400], [485, 450]] }),
    // Kira, la maman (416 × 465), regarde vers la gauche
    kangaroo('kangaroo_mother', 416, 465, -1, [150, 160], { body: [[230, 345], [140, 240]], head: [[140, 195], [130, 60]], tail: [[270, 400], [330, 440], [405, 425]], feet: [[150, 405], [60, 448]], feet2: [[240, 410], [195, 455]] }),
    companion('kangaroo_boy_companion', 279, 310, 50),
    companion('kangaroo_girl_companion', 278, 307, 40),
    young('kangaroo_boy_young', 235, 291, 0),
    young('kangaroo_girl_young', 233, 300, 10),
    little('kangaroo_boy_little', 215, 269, 0),
    little('kangaroo_girl_little', 216, 273, 5),
  ].map((r) => [r.sprite, r]),
);

export const RIGS: Readonly<Record<string, RigDef>> = { ...(autoRigs as unknown as Record<string, RigDef>), ...KANGAROO_RIGS, ...HAND_RIGS };

export function rigFor(sprite: string | undefined): RigDef | undefined {
  return sprite ? RIGS[sprite] : undefined;
}
