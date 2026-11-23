import manifest from '../content/assetManifest.json';
import type { Anchor, GrowthStage, Rect, Sex } from '../content/types';
import type { ActorRef, Baby, FamilyState } from '../engine/state';
import { laneMid, seatAt, snapToSeats, type Lane, type SeatLike } from '../game/staging';

export interface AssetInfo {
  path: string;
  width: number;
  height: number;
}

const M = manifest as { backgrounds: Record<string, AssetInfo>; characters: Record<string, AssetInfo> };

export function background(key: string | undefined): AssetInfo | undefined {
  return key ? M.backgrounds[key] : undefined;
}

/** Sprite d'un parent ou d'un bébé ; repli sur un sprite unique par sexe, sinon undefined (pictogramme). */
export function spriteFor(speciesId: string, who: { role: 'father' | 'mother' } | { sex: Sex; stage: GrowthStage }): AssetInfo | undefined {
  if ('role' in who) return M.characters[`${speciesId}_${who.role}`];
  return M.characters[`${speciesId}_${who.sex}_${who.stage}`] ?? M.characters[`${speciesId}_${who.sex}`];
}

/** Vrai si le stade est montré par un sprite dédié (sinon : simple mise à l'échelle). */
export function hasStageSprite(speciesId: string, sex: Sex, stage: GrowthStage): boolean {
  return `${speciesId}_${sex}_${stage}` in M.characters;
}

export function assetUrl(info: AssetInfo): string {
  return `${import.meta.env.BASE_URL}${info.path}`;
}

/** Style CSS d'une carte-image recadrée dans le décor (repère en %). */
export function cropStyle(bg: AssetInfo, crop: Rect): { backgroundImage: string; backgroundSize: string; backgroundPosition: string; aspectRatio: string } {
  const px = crop.w >= 100 ? 0 : (crop.x / (100 - crop.w)) * 100;
  const py = crop.h >= 100 ? 0 : (crop.y / (100 - crop.h)) * 100;
  return {
    backgroundImage: `url("${assetUrl(bg)}")`,
    backgroundSize: `${(100 / crop.w) * 100}% ${(100 / crop.h) * 100}%`,
    backgroundPosition: `${px}% ${py}%`,
    aspectRatio: `${(crop.w * bg.width) / (crop.h * bg.height)}`,
  };
}

// ---------------------------------------------------------------------------
// Placement dans la scène (pieds du personnage, en % de la scène)
// ---------------------------------------------------------------------------

export interface Placement {
  x: number;
  y: number;
  /** hauteur en % de la scène */
  h: number;
}

/** Hauteur des parents en % de la scène, selon la taille réelle de l'espèce (lion = 34, référence).
 * Les petits animaux restent assez grands pour être touchés du doigt (≥ 22). */
const ADULT_HEIGHT: Record<string, number> = {
  // panda géant : 32 depuis qu'il est dessiné assis (2026-11-23, demande du parent : « mets plutôt les pandas assis…
  // proportionnels aux 3 décors ») ; couché, il fallait 36
  elephant: 44, giraffe: 54, lion: 34, tiger: 34, giant_panda: 32, bear: 36, polar_bear: 38, bison: 36,
  kangaroo: 38, jaguar: 30, koala: 30, fox: 30, snow_leopard: 31, sloth: 30, penguin: 30, owl: 28, toucan: 28, beaver: 27, seal: 25, frilled_lizard: 24, hedgehog: 22,
};
/** Bébés : proportionnels aux parents (ADULT_HEIGHT / 34) sauf réglage dessiné à la main. */
const BABY_SCALE: Record<string, number> = { elephant: 1.15, giraffe: 1.35 };
const BABY_HEIGHT: Record<GrowthStage, number> = { newborn: 14, little: 18, young: 22, companion: 27 };

/** Sol de référence des positions ci-dessous (savane). */
export const REF_GROUND = 78;

/** Sur une branche : où se tient chaque membre de la famille (x), l'un à côté de l'autre le long de la branche. */
const LANE_X = { father: 44, mother: 60, baby1: 74, baby2: 88 };

/** Décor à percher (hiboux) : les endroits où se poser et la place de départ de chacun. */
export interface SeatPlan {
  seats?: readonly SeatLike[];
  seatHome?: Record<'father' | 'mother' | 'baby1' | 'baby2', readonly [string, number]>;
  groundToo?: boolean;
}

/** Rôle d'un personnage dans la famille : papa, maman, premier ou second bébé. */
export function roleOf(actor: ActorRef, family: FamilyState): 'father' | 'mother' | 'baby1' | 'baby2' {
  if (actor.kind === 'adult') return actor.role === 'father' ? 'father' : 'mother';
  return family.babies.find((b) => b.id === actor.babyId)?.birthOrder === 2 ? 'baby2' : 'baby1';
}

export function homePlacement(actor: ActorRef, family: FamilyState, groundY = REF_GROUND, lane?: Lane, plan?: SeatPlan): Placement {
  if (plan?.seats?.length && !plan.groundToo) {
    // décor à percher : chacun à sa place de départ (papa sur la branche, maman sur le rocher…), à la taille de l'endroit
    const natural = homePlacement(actor, family, groundY).h;
    const [seatId, x] = plan.seatHome?.[roleOf(actor, family)] ?? [plan.seats[0]!.id, 50];
    const seat = plan.seats.find((s) => s.id === seatId) ?? plan.seats[0]!;
    const S = seatAt(seat, x);
    const { seat: _s, ...spot } = snapToSeats([seat], natural, x, (S.back + S.front) / 2);
    return spot;
  }
  const adultH = ADULT_HEIGHT[actor.speciesId] ?? 34;
  if (lane) {
    // décor perché : toute la famille est sur la branche, taille normale
    const baby = actor.kind === 'adult' ? undefined : family.babies.find((b) => b.id === actor.babyId);
    const x = actor.kind === 'adult' ? (actor.role === 'father' ? LANE_X.father : LANE_X.mother) : baby?.birthOrder === 2 ? LANE_X.baby2 : LANE_X.baby1;
    const h = actor.kind === 'adult' ? adultH * (actor.role === 'father' ? 1 : 0.94) : BABY_HEIGHT[baby?.stage ?? 'newborn'] * (BABY_SCALE[actor.speciesId] ?? adultH / 34);
    const mid = laneMid(lane, x);
    return { x: mid.x, y: mid.y, h };
  }
  // la famille se tient sur le sol du décor (groundY), sans sortir de la scène
  const dy = Math.max(-8, Math.min(6, groundY - REF_GROUND));
  const at = (p: Placement): Placement => ({ ...p, y: Math.min(98, p.y + dy) });
  // famille groupée à droite : la bulle de dialogue occupe la gauche de la scène
  // papa un peu plus à gauche : la tête de maman (devant) ne cache plus celle de papa (pandas, jaguars couchés)
  if (actor.kind === 'adult') return at(actor.role === 'father' ? { x: 64, y: 80, h: adultH } : { x: 87, y: 82, h: adultH * 0.94 });
  const baby = family.babies.find((b) => b.id === actor.babyId);
  const i = baby?.birthOrder === 2 ? 1 : 0;
  const scale = BABY_SCALE[actor.speciesId] ?? adultH / 34;
  return at({ x: i === 0 ? 77 : 94, y: i === 0 ? 95 : 96, h: BABY_HEIGHT[baby?.stage ?? 'newborn'] * scale });
}

export function babyLabel(b: Baby): string {
  return b.name;
}

/**
 * Point du décor compté pour un toucher. Si l'endroit touché est la même chose que celui demandé
 * (`sameAs` : « Touch the eucalyptus! » et l'enfant touche le grand eucalyptus marqué « tree »),
 * c'est une bonne réponse.
 */
export function tappedAnchor(place: { anchors: readonly Anchor[] }, tapped: string, wanted: string | undefined): string {
  if (!wanted || tapped === wanted) return tapped;
  return place.anchors.find((a) => a.id === tapped)?.sameAs?.includes(wanted) ? wanted : tapped;
}

/**
 * Ordre d'empilement des zones à toucher (2026-11-23, vu à l'écran dans la prairie : le buisson recouvrait
 * la fleur violette). Les plus grandes d'abord : une petite zone posée sur une grande reste au-dessus.
 */
export function tapOrder<T extends { hit: { w: number; h: number } }>(anchors: readonly T[]): T[] {
  return [...anchors].sort((a, b) => b.hit.w * b.hit.h - a.hit.w * a.hit.h);
}

/** Zone qui reçoit un toucher en (x, y), en % du décor (la dernière empilée qui le contient). */
export function anchorAt<T extends { hit: { x: number; y: number; w: number; h: number } }>(anchors: readonly T[], x: number, y: number): T | undefined {
  return tapOrder(anchors).reverse().find((a) => x >= a.hit.x && x <= a.hit.x + a.hit.w && y >= a.hit.y && y <= a.hit.y + a.hit.h);
}
