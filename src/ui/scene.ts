import manifest from '../content/assetManifest.json';
import type { GrowthStage, Rect, Sex } from '../content/types';
import type { ActorRef, Baby, FamilyState } from '../engine/state';

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
  elephant: 44, giraffe: 54, lion: 34, tiger: 34, giant_panda: 36, bear: 36, polar_bear: 38, bison: 36,
  kangaroo: 38, jaguar: 30, koala: 30, fox: 30, red_panda: 29, sloth: 30, penguin: 30, owl: 28, toucan: 28, beaver: 27, seal: 25, frilled_lizard: 24, hedgehog: 22,
};
/** Bébés : proportionnels aux parents (ADULT_HEIGHT / 34) sauf réglage dessiné à la main. */
const BABY_SCALE: Record<string, number> = { elephant: 1.15, giraffe: 1.35 };
const BABY_HEIGHT: Record<GrowthStage, number> = { newborn: 14, little: 18, young: 22, companion: 27 };

/** Sol de référence des positions ci-dessous (savane). */
export const REF_GROUND = 78;

export function homePlacement(actor: ActorRef, family: FamilyState, groundY = REF_GROUND): Placement {
  const adultH = ADULT_HEIGHT[actor.speciesId] ?? 34;
  // la famille se tient sur le sol du décor (groundY), sans sortir de la scène
  const dy = Math.max(-8, Math.min(6, groundY - REF_GROUND));
  const at = (p: Placement): Placement => ({ ...p, y: Math.min(98, p.y + dy) });
  // famille groupée à droite : la bulle de dialogue occupe la gauche de la scène
  if (actor.kind === 'adult') return at(actor.role === 'father' ? { x: 68, y: 80, h: adultH } : { x: 87, y: 82, h: adultH * 0.94 });
  const baby = family.babies.find((b) => b.id === actor.babyId);
  const i = baby?.birthOrder === 2 ? 1 : 0;
  const scale = BABY_SCALE[actor.speciesId] ?? adultH / 34;
  return at({ x: i === 0 ? 77 : 94, y: i === 0 ? 95 : 96, h: BABY_HEIGHT[baby?.stage ?? 'newborn'] * scale });
}

export function babyLabel(b: Baby): string {
  return b.name;
}
