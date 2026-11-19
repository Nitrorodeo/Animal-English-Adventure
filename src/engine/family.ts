import type { GrowthStage, Sex } from '../content/types';
import { GROWTH_STAGES } from '../content/types';
import type { Baby, FamilyState } from './state';

export const MAX_BABIES = 2;
export const NAME_MAX = 18;

export type NameResult = { ok: true; name: string } | { ok: false; error: 'empty' | 'too_long' };

function graphemeCount(s: string): number {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return [...new Intl.Segmenter('fr', { granularity: 'grapheme' }).segment(s)].length;
  }
  return Array.from(s).length;
}

/**
 * Prénom libre et sûr : lettres de toutes langues, chiffres, espaces, tiret et apostrophe.
 * Emojis, balises et caractères de contrôle sont retirés. 1 à 18 caractères.
 */
export function sanitizeName(raw: string): NameResult {
  const cleaned = raw
    .normalize('NFC')
    .replace(/[^\p{L}\p{M}\p{N} '’-]/gu, '')
    .replace(/’/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/-{2,}/g, '-')
    .replace(/'{2,}/g, "'")
    .trim()
    .replace(/^[-']+|[-']+$/g, '')
    .trim();
  if (cleaned.length === 0) return { ok: false, error: 'empty' };
  if (graphemeCount(cleaned) > NAME_MAX) return { ok: false, error: 'too_long' };
  return { ok: true, name: cleaned };
}

/** Sexe imposé pour le prochain bébé : null = libre choix, 'none' = famille complète. */
export function nextBabySex(family: FamilyState): Sex | null | 'none' {
  if (family.babies.length >= MAX_BABIES) return 'none';
  const first = family.babies[0];
  if (!first) return null;
  return first.sex === 'boy' ? 'girl' : 'boy';
}

export type CreateBabyResult =
  | { ok: true; family: FamilyState; baby: Baby }
  | { ok: false; error: 'family_complete' | 'sex_not_allowed' | 'empty' | 'too_long' | 'same_name' };

export function createBaby(family: FamilyState, sex: Sex, rawName: string, id: string): CreateBabyResult {
  const allowed = nextBabySex(family);
  if (allowed === 'none') return { ok: false, error: 'family_complete' };
  if (allowed !== null && allowed !== sex) return { ok: false, error: 'sex_not_allowed' };
  const n = sanitizeName(rawName);
  if (!n.ok) return { ok: false, error: n.error };
  if (family.babies.some((b) => b.name.toLocaleLowerCase('fr') === n.name.toLocaleLowerCase('fr'))) return { ok: false, error: 'same_name' };
  if (family.babies.some((b) => b.id === id)) return { ok: false, error: 'family_complete' };
  const personalities: Baby['personality'][] = ['curious', 'playful', 'gentle', 'funny'];
  const baby: Baby = {
    id,
    familyId: family.speciesId,
    name: n.name,
    sex,
    birthOrder: family.babies.length === 0 ? 1 : 2,
    stage: 'newborn',
    personality: personalities[(n.name.length + family.babies.length) % personalities.length]!,
    taughtWords: {},
    retainedWords: [],
    seenItems: [],
    activities: [],
    questMemory: [],
    milestones: ['born'],
    likes: {},
  };
  return {
    ok: true,
    baby,
    family: { ...family, babies: [...family.babies, baby], memories: [...family.memories, `baby_born:${id}`] },
  };
}

// ---------------------------------------------------------------------------
// Croissance multicritère (FAMILLES_ET_CROISSANCE §3) — seuils indicatifs POUR TESTS
// ---------------------------------------------------------------------------

export interface GrowthThreshold {
  seen: number;
  retained: number;
  activities: number;
}

export const GROWTH_THRESHOLDS: Readonly<Record<Exclude<GrowthStage, 'newborn'>, GrowthThreshold>> = {
  // V2 (2026-11-19) : le bébé apprend aussi en vivant les aventures avec la famille.
  little: { seen: 6, retained: 2, activities: 2 },
  young: { seen: 16, retained: 6, activities: 5 },
  companion: { seen: 30, retained: 12, activities: 9 },
};

export function growthProgress(baby: Baby) {
  return { seen: baby.seenItems.length, retained: baby.retainedWords.length, activities: baby.activities.length };
}

/** Stade atteint ; ne recule jamais (aucune perte d'habiletés). */
export function computeStage(baby: Baby): GrowthStage {
  const p = growthProgress(baby);
  let reached: GrowthStage = 'newborn';
  for (const stage of ['little', 'young', 'companion'] as const) {
    const t = GROWTH_THRESHOLDS[stage];
    if (p.seen >= t.seen && p.retained >= t.retained && p.activities >= t.activities) reached = stage;
    else break;
  }
  return GROWTH_STAGES.indexOf(reached) > GROWTH_STAGES.indexOf(baby.stage) ? reached : baby.stage;
}

/**
 * Avancée vers le stade suivant, de 0 à 1 (moyenne des trois critères, chacun plafonné) :
 * sert à la barre de croissance. 1 au dernier stade.
 */
export function growthPercent(baby: Baby): number {
  const goal = nextStageGoal(baby);
  if (!goal) return 1;
  const p = growthProgress(baby);
  const t = goal.threshold;
  const part = (v: number, max: number) => Math.min(1, max ? v / max : 1);
  return (part(p.seen, t.seen) + part(p.retained, t.retained) + part(p.activities, t.activities)) / 3;
}

/** Jeux préférés d'un bébé (mécaniques les plus jouées ensemble), du plus aimé au moins aimé. */
export function favouriteMechanics(baby: Baby, max = 2): string[] {
  return Object.entries(baby.likes ?? {})
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([m]) => m);
}

export function nextStageGoal(baby: Baby): { stage: GrowthStage; threshold: GrowthThreshold } | null {
  const i = GROWTH_STAGES.indexOf(baby.stage);
  const next = GROWTH_STAGES[i + 1];
  if (!next || next === 'newborn') return null;
  return { stage: next, threshold: GROWTH_THRESHOLDS[next] };
}
