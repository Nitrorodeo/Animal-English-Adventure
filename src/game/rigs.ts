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

type Wing = readonly [P, P, P];
/**
 * Oiseaux (2026-11-26) : réglés à la main sur chaque dessin pour qu'ils battent des ailes (`flyPose`). Corps droit
 * (du bas du ventre au cou), tête, bec (toucan, pour qu'il suive la tête et pas l'aile), les deux ailes de l'épaule
 * au bout en deux parties (`near` = l'aile devant le corps, `far` = celle du fond), les pattes et la queue.
 * Les pattes n'ont pas de parent : elles restent au sol quand l'oiseau posé respire.
 */
function bird(sprite: string, width: number, height: number, facing: 1 | -1, mouth: P, flapRate: number, b: { body: [P, P]; head: [P, P]; beak?: [P, P]; crown?: [P, P]; near: Wing; far: Wing; feet: [P, P]; feet2?: [P, P]; tail?: [P, P]; wingLayer?: number; cheeks?: [P, P][]; landFold?: true }): RigDef {
  return {
    ...(b.landFold ? { landFold: true as const } : {}),
    sprite,
    width,
    height,
    facing,
    mouth,
    drinkDip: 0,
    flapRate,
    bones: [
      { id: 'body', pivot: b.body[0], tip: b.body[1], strength: 1.1, layer: 2 },
      { id: 'head', parent: 'body', pivot: b.head[0], tip: b.head[1], strength: 2.2, layer: 4 },
      ...(b.beak ? [{ id: 'beak', parent: 'head', pivot: b.beak[0], tip: b.beak[1], strength: 1.3, layer: 4 }] : []),
      // côté de la tête éloigné de l'axe (aigrette, nœud) : il suit la tête, pas l'aile qui se lève à côté
      ...(b.crown ? [{ id: 'crown', parent: 'head', pivot: b.crown[0], tip: b.crown[1], strength: 1.3, layer: 4 }] : []),
      // grosse tête ronde (hibou de face) : ses côtés suivent la tête, pas l'aile qui s'abaisse juste en dessous
      ...(b.cheeks ?? []).map(([pivot, tip], i) => ({ id: `cheek${i + 1}`, parent: 'head', pivot, tip, strength: 1.6, layer: 4 })),
      ...(b.tail ? [{ id: 'tail', parent: 'body', pivot: b.tail[0], tip: b.tail[1], layer: 1 }] : []),
      { id: 'wing2', parent: 'body', pivot: b.far[0], tip: b.far[1], layer: 1 },
      { id: 'wing2Tip', parent: 'wing2', pivot: b.far[1], tip: b.far[2], layer: 1 },
      { id: 'feet', pivot: b.feet[0], tip: b.feet[1], layer: 3 },
      ...(b.feet2 ? [{ id: 'feet2', pivot: b.feet2[0], tip: b.feet2[1], layer: 1 }] : []),
      // dessin de face aux ailes déployées : l'aile levée passe derrière la tête (`wingLayer` 3.5), pas devant les yeux
      { id: 'wing', parent: 'body', pivot: b.near[0], tip: b.near[1], strength: 1.15, layer: b.wingLayer ?? 5 },
      { id: 'wingTip', parent: 'wing', pivot: b.near[1], tip: b.near[2], strength: 1.15, layer: b.wingLayer ?? 5 },
    ],
  };
}
/**
 * Dessins « en vol » (2026-11-26) : un oiseau posé garde son dessin naturel, ailes repliées, et prend pour voler
 * un second dessin aux deux ailes déployées, dégagées du corps et de la queue (le battement ne déforme alors que
 * les ailes). Le fichier est à côté du dessin posé, avec le suffixe `_fly`.
 */
export const FLY_SPRITES: Readonly<Record<string, string>> = Object.fromEntries(
  ['toucan', 'owl'].flatMap((a) =>
    ['father', 'mother', 'boy_companion', 'girl_companion', 'boy_young', 'girl_young', 'boy_little', 'girl_little'].map((s) => [`${a}_${s}`, `${a}_${s}_fly`]),
  ),
);

const BIRD_RIGS: Record<string, RigDef> = Object.fromEntries(
  [
    // Oscar, le papa hibou (402 × 474), ailes repliées le long du corps
    bird('owl_father', 402, 474, 1, [268, 138], 2.4, { body: [[230, 410], [235, 230]], head: [[235, 230], [240, 40]], near: [[150, 230], [105, 320], [45, 425]], far: [[335, 240], [355, 300], [372, 365]], feet: [[230, 420], [230, 465]] }),
    // Olive, la maman hibou (322 × 465), regarde vers la gauche
    bird('owl_mother', 322, 465, -1, [149, 146], 2.4, { body: [[150, 410], [145, 220]], head: [[145, 220], [140, 40]], near: [[205, 245], [250, 330], [295, 425]], far: [[40, 250], [32, 300], [35, 355]], feet: [[150, 420], [150, 460]] }),
    bird('owl_boy_companion', 251, 297, 1, [180, 93], 2.8, { body: [[140, 250], [150, 140]], head: [[150, 140], [150, 20]], near: [[115, 160], [72, 210], [22, 262]], far: [[218, 170], [230, 195], [235, 222]], feet: [[150, 255], [150, 290]] }),
    bird('owl_girl_companion', 253, 302, 1, [156, 96], 2.8, { body: [[145, 255], [150, 145]], head: [[150, 145], [155, 20]], near: [[110, 165], [68, 215], [18, 268]], far: [[228, 170], [236, 200], [240, 228]], feet: [[150, 260], [150, 295]] }),
    // les jeunes hiboux ont déjà les ailes ouvertes sur leur dessin
    bird('owl_boy_young', 346, 262, 1, [224, 89], 2.8, { body: [[175, 225], [180, 130]], head: [[180, 130], [185, 25]], near: [[140, 170], [80, 155], [15, 135]], far: [[245, 165], [290, 120], [330, 75]], feet: [[180, 230], [180, 258]], tail: [[130, 200], [72, 222]], crown: [[180, 90], [100, 45]] }),
    bird('owl_girl_young', 355, 277, 1, [226, 92], 2.8, { body: [[180, 240], [185, 140]], head: [[185, 140], [190, 25]], near: [[145, 180], [85, 165], [15, 145]], far: [[250, 175], [300, 125], [345, 80]], feet: [[185, 245], [185, 272]], tail: [[130, 213], [72, 232]], crown: [[185, 95], [110, 70]] }),
    bird('owl_boy_little', 198, 250, 1, [108, 81], 3.2, { body: [[115, 215], [115, 125]], head: [[115, 125], [115, 15]], near: [[62, 145], [38, 178], [12, 205]], far: [[172, 145], [182, 170], [188, 198]], feet: [[115, 220], [115, 245]] }),
    bird('owl_girl_little', 197, 271, 1, [105, 90], 3.2, { body: [[110, 235], [110, 140]], head: [[110, 140], [110, 15]], near: [[62, 160], [38, 192], [12, 225]], far: [[168, 165], [180, 190], [185, 213]], feet: [[110, 240], [110, 265]] }),
    // les hiboux en vol, découpés dans la planche de Westimmo du 2026-11-26 (« Famille de hiboux aux ailes déployées »), vus de face
    bird('owl_father_fly', 645, 455, 1, [440, 140], 2.4, { body: [[385, 390], [390, 185]], head: [[390, 185], [385, 10]], near: [[310, 262], [160, 190], [15, 165]], far: [[470, 262], [570, 200], [625, 120]], tail: [[290, 340], [190, 410]], feet: [[340, 400], [330, 440]], feet2: [[440, 400], [460, 440]], wingLayer: 3.5, cheeks: [[[300, 200], [280, 120]], [[480, 200], [515, 120]]], landFold: true }),
    bird('owl_mother_fly', 582, 444, -1, [185, 145], 2.4, { body: [[210, 380], [205, 180]], head: [[205, 180], [200, 10]], crown: [[240, 80], [330, 70]], near: [[285, 258], [420, 180], [565, 140]], far: [[140, 258], [65, 190], [15, 150]], tail: [[330, 350], [390, 405]], feet: [[170, 390], [155, 425]], feet2: [[245, 390], [260, 425]], wingLayer: 3.5, cheeks: [[[140, 200], [118, 120]], [[300, 200], [325, 120]]], landFold: true }),
    bird('owl_boy_companion_fly', 418, 289, 1, [230, 90], 2.8, { body: [[210, 250], [215, 130]], head: [[215, 130], [225, 8]], near: [[150, 172], [75, 130], [8, 100]], far: [[275, 172], [345, 120], [410, 85]], tail: [[150, 240], [95, 258]], feet: [[180, 260], [165, 275]], feet2: [[240, 260], [265, 272]], wingLayer: 3.5, cheeks: [[[150, 140], [128, 80]], [[255, 140], [272, 80]]], landFold: true }),
    bird('owl_girl_companion_fly', 413, 307, 1, [235, 105], 2.8, { body: [[215, 265], [220, 140]], head: [[220, 140], [230, 10]], crown: [[180, 60], [115, 50]], near: [[160, 185], [75, 135], [8, 105]], far: [[275, 185], [340, 130], [405, 70]], tail: [[150, 250], [90, 272]], feet: [[180, 275], [165, 292]], feet2: [[245, 275], [265, 290]], wingLayer: 3.5, cheeks: [[[155, 160], [130, 95]], [[270, 160], [280, 95]]], landFold: true }),
    bird('owl_boy_young_fly', 382, 262, 1, [215, 85], 2.8, { body: [[195, 225], [195, 120]], head: [[195, 120], [200, 8]], near: [[142, 158], [70, 120], [8, 100]], far: [[248, 158], [315, 110], [370, 75]], tail: [[140, 210], [100, 225]], feet: [[170, 230], [155, 248]], feet2: [[220, 230], [245, 245]], wingLayer: 3.5, cheeks: [[[140, 130], [120, 75]], [[250, 130], [262, 75]]], landFold: true }),
    bird('owl_girl_young_fly', 379, 278, 1, [225, 105], 2.8, { body: [[205, 240], [210, 130]], head: [[210, 130], [220, 10]], crown: [[185, 60], [125, 50]], near: [[152, 172], [75, 130], [8, 110]], far: [[258, 172], [320, 120], [375, 90]], tail: [[145, 225], [95, 240]], feet: [[170, 248], [160, 265]], feet2: [[225, 248], [245, 265]], wingLayer: 3.5, cheeks: [[[150, 145], [130, 85]], [[255, 145], [268, 85]]], landFold: true }),
    bird('owl_boy_little_fly', 301, 243, 1, [175, 95], 3.2, { body: [[150, 205], [150, 115]], head: [[150, 115], [145, 8]], near: [[115, 160], [55, 130], [10, 110]], far: [[195, 160], [245, 128], [290, 105]], tail: [[95, 195], [65, 215]], feet: [[125, 215], [115, 232]], feet2: [[180, 215], [195, 232]], wingLayer: 3.5, cheeks: [[[95, 130], [75, 75]], [[205, 130], [225, 75]]], landFold: true }),
    bird('owl_girl_little_fly', 303, 266, 1, [185, 105], 3.2, { body: [[160, 225], [165, 125]], head: [[165, 125], [165, 15]], crown: [[140, 60], [95, 40]], near: [[120, 172], [55, 140], [8, 130]], far: [[210, 172], [250, 138], [295, 105]], tail: [[105, 215], [75, 235]], feet: [[130, 240], [120, 258]], feet2: [[185, 240], [200, 258]], wingLayer: 3.5, cheeks: [[[100, 145], [78, 85]], [[215, 145], [228, 85]]], landFold: true }),
    // Tico, le papa toucan (498 × 417), une aile ouverte à droite, l'autre et la queue à gauche
    bird('toucan_father', 498, 417, 1, [325, 123], 3.2, { body: [[260, 340], [275, 190]], head: [[275, 190], [290, 40]], beak: [[300, 90], [430, 140]], near: [[210, 185], [140, 225], [70, 270]], far: [[320, 200], [400, 215], [485, 220]], tail: [[170, 320], [20, 355]], feet: [[150, 340], [130, 400]], feet2: [[260, 340], [280, 390]] }),
    // Tico en vol (564 × 417), redessiné le 2026-11-26 les deux ailes déployées, dégagées de la queue
    bird('toucan_father_fly', 564, 417, 1, [320, 120], 3.2, { body: [[280, 330], [285, 170]], head: [[285, 170], [265, 25]], beak: [[300, 60], [440, 120]], near: [[225, 170], [115, 155], [12, 125]], far: [[350, 185], [455, 170], [555, 160]], tail: [[185, 300], [60, 310]], feet: [[205, 345], [195, 405]], feet2: [[300, 345], [320, 400]], landFold: true }),
    // les toucans en vol, découpés dans la planche de Westimmo du 2026-11-26 (« Famille de toucans aux ailes déployées »)
    bird('toucan_mother_fly', 459, 383, -1, [125, 115], 3.2, { body: [[205, 310], [195, 150]], head: [[195, 150], [185, 15]], beak: [[160, 85], [68, 135]], crown: [[200, 60], [290, 45]], near: [[240, 170], [350, 144], [450, 125]], far: [[134, 188], [69, 182], [10, 172]], tail: [[250, 275], [365, 315]], feet: [[156, 325], [144, 362]], feet2: [[256, 325], [262, 362]], wingLayer: 3.5, landFold: true }),
    bird('toucan_boy_companion_fly', 401, 333, 1, [240, 115], 3.6, { body: [[188, 262], [206, 137]], head: [[206, 137], [175, 12]], beak: [[206, 69], [338, 112]], near: [[169, 156], [81, 144], [12, 131]], far: [[250, 180], [325, 150], [388, 137]], tail: [[130, 235], [40, 275]], feet: [[150, 265], [125, 315]], feet2: [[225, 265], [285, 285]], wingLayer: 3.5, landFold: true }),
    bird('toucan_girl_companion_fly', 404, 357, 1, [255, 130], 3.6, { body: [[195, 285], [215, 150]], head: [[215, 150], [200, 20]], beak: [[230, 85], [330, 115]], crown: [[190, 70], [115, 40]], near: [[175, 170], [90, 155], [10, 150]], far: [[275, 185], [330, 165], [395, 150]], tail: [[130, 260], [45, 290]], feet: [[145, 295], [135, 330]], feet2: [[255, 290], [310, 295]], wingLayer: 3.5, landFold: true }),
    bird('toucan_boy_young_fly', 323, 287, 1, [205, 100], 3.6, { body: [[165, 225], [180, 115]], head: [[180, 115], [150, 10]], beak: [[175, 55], [262, 90]], near: [[142, 160], [70, 145], [8, 148]], far: [[220, 165], [265, 150], [315, 138]], tail: [[100, 200], [40, 225]], feet: [[110, 235], [105, 270]], feet2: [[195, 235], [245, 245]], wingLayer: 3.5, landFold: true }),
    bird('toucan_girl_young_fly', 326, 319, 1, [205, 125], 3.6, { body: [[160, 260], [180, 140]], head: [[180, 140], [165, 15]], beak: [[185, 80], [270, 115]], crown: [[155, 65], [100, 40]], near: [[148, 185], [70, 168], [8, 168]], far: [[230, 190], [270, 172], [315, 158]], tail: [[105, 235], [40, 255]], feet: [[120, 270], [115, 295]], feet2: [[215, 270], [265, 270]], wingLayer: 3.5, landFold: true }),
    bird('toucan_boy_little_fly', 266, 252, 1, [170, 100], 4, { body: [[150, 205], [150, 115]], head: [[150, 115], [130, 10]], beak: [[160, 60], [215, 75]], near: [[118, 160], [60, 145], [10, 150]], far: [[188, 160], [225, 138], [255, 125]], tail: [[85, 190], [35, 205]], feet: [[100, 210], [95, 240]], feet2: [[160, 210], [165, 240]], wingLayer: 3.5, landFold: true }),
    bird('toucan_girl_little_fly', 289, 293, 1, [195, 130], 4, { body: [[165, 250], [175, 150]], head: [[175, 150], [150, 10]], beak: [[185, 100], [240, 110]], crown: [[155, 60], [115, 35]], near: [[135, 195], [65, 178], [12, 172]], far: [[212, 195], [245, 172], [280, 155]], tail: [[95, 230], [45, 245]], feet: [[110, 255], [105, 280]], feet2: [[165, 255], [180, 280]], wingLayer: 3.5, landFold: true }),
    // Tina, la maman toucan (336 × 384), regarde vers la gauche
    bird('toucan_mother', 336, 384, -1, [150, 115], 3.2, { body: [[170, 320], [160, 190]], head: [[160, 190], [140, 30]], beak: [[120, 100], [10, 160]], near: [[195, 190], [240, 240], [280, 280]], far: [[90, 200], [70, 250], [65, 290]], tail: [[240, 300], [330, 320]], feet: [[130, 320], [110, 365]], feet2: [[200, 320], [220, 365]] }),
    bird('toucan_boy_companion', 337, 332, 1, [229, 104], 3.6, { body: [[170, 270], [185, 160]], head: [[185, 160], [190, 20]], beak: [[220, 70], [325, 125]], near: [[150, 165], [90, 195], [25, 225]], far: [[235, 175], [275, 195], [320, 205]], tail: [[100, 250], [10, 275]], feet: [[110, 270], [110, 310]], feet2: [[220, 265], [270, 290]] }),
    bird('toucan_girl_companion', 318, 353, 1, [181, 110], 3.6, { body: [[165, 280], [180, 170]], head: [[180, 170], [170, 20]], beak: [[220, 80], [300, 125]], near: [[145, 175], [85, 215], [25, 250]], far: [[225, 180], [260, 195], [300, 210]], tail: [[90, 270], [10, 300]], feet: [[110, 290], [115, 330]], feet2: [[220, 285], [265, 300]] }),
    bird('toucan_boy_young', 260, 286, 1, [173, 88], 3.6, { body: [[140, 230], [155, 140]], head: [[155, 140], [150, 15]], beak: [[180, 60], [255, 95]], near: [[135, 135], [75, 160], [15, 190]], far: [[205, 145], [225, 160], [245, 180]], tail: [[70, 210], [10, 225]], feet: [[100, 235], [100, 270]], feet2: [[180, 235], [215, 245]] }),
    bird('toucan_girl_young', 263, 314, 1, [169, 102], 3.6, { body: [[140, 255], [155, 160]], head: [[155, 160], [150, 15]], beak: [[180, 70], [255, 110]], near: [[130, 160], [75, 185], [15, 210]], far: [[205, 165], [225, 180], [240, 200]], tail: [[70, 240], [10, 255]], feet: [[95, 265], [100, 300]], feet2: [[175, 255], [225, 265]] }),
    bird('toucan_boy_little', 208, 251, 1, [133, 82], 4, { body: [[105, 210], [115, 125]], head: [[115, 125], [110, 15]], beak: [[140, 55], [200, 85]], near: [[90, 130], [50, 145], [10, 160]], far: [[160, 135], [185, 155], [200, 185]], feet: [[75, 210], [70, 245]], feet2: [[125, 210], [125, 245]] }),
    bird('toucan_girl_little', 228, 287, 1, [129, 95], 4, { body: [[120, 240], [130, 150]], head: [[130, 150], [120, 15]], beak: [[160, 80], [215, 100]], near: [[100, 150], [55, 160], [10, 175]], far: [[180, 160], [200, 180], [205, 210]], feet: [[85, 245], [80, 280]], feet2: [[140, 245], [150, 280]] }),
  ].map((r) => [r.sprite, FLY_SPRITES[r.sprite] ? { ...r, flutter: false as const } : r]),
);

export const RIGS: Readonly<Record<string, RigDef>> = { ...(autoRigs as unknown as Record<string, RigDef>), ...KANGAROO_RIGS, ...BIRD_RIGS, ...HAND_RIGS };

export function rigFor(sprite: string | undefined): RigDef | undefined {
  return sprite ? RIGS[sprite] : undefined;
}

export function flyRigFor(sprite: string | undefined): RigDef | undefined {
  const fly = sprite ? FLY_SPRITES[sprite] : undefined;
  return fly ? RIGS[fly] : undefined;
}

/** cadre du dessin en vol, en fractions du cadre du dessin posé */
export interface Frame { x: number; y: number; w: number; h: number }

/**
 * Place le dessin en vol sur le dessin posé : même point d'attache du corps (au-dessus des pattes) et même
 * taille d'oiseau (longueur du corps à la pointe de la tête), pour que le fondu ne fasse ni sauter ni grandir.
 */
export function flyFrame(rest: RigDef, fly: RigDef): Frame {
  const reach = (r: RigDef) => {
    const body = r.bones.find((b) => b.id === 'body')!, head = r.bones.find((b) => b.id === 'head')!;
    return { at: body.pivot, len: Math.hypot(head.tip[0] - body.pivot[0], head.tip[1] - body.pivot[1]) };
  };
  const a = reach(rest), b = reach(fly);
  const s = a.len / b.len; // pixels du dessin posé par pixel du dessin en vol
  return {
    x: (a.at[0] - b.at[0] * s) / rest.width,
    y: (a.at[1] - b.at[1] * s) / rest.height,
    w: (fly.width * s) / rest.width,
    h: (fly.height * s) / rest.height,
  };
}
