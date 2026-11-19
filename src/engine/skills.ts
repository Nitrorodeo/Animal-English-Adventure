import type { QuestScript, Tier } from '../content/types';
import type { ItemProgress, PlayerState } from './state';

export type ItemStatus = 'new' | 'recognised' | 'supported' | 'independent';
const RANK: Record<ItemStatus, number> = { new: 0, recognised: 1, supported: 2, independent: 3 };

/**
 * Statut d'une expression. Répéter 10 fois la même quête ne suffit pas (EDU-03) :
 * `supported` exige 2 contextes différents, `independent` 3 réussites sans aide dans 2 contextes.
 * Une réussite tactile n'est jamais une preuve de prononciation.
 */
export function itemStatus(p: ItemProgress | undefined): ItemStatus {
  if (!p) return 'new';
  const correct = p.correctUnaided + p.correctAided;
  if (correct === 0) return 'new';
  const ctx = p.contexts.length;
  if (p.correctUnaided >= 3 && ctx >= 2) return 'independent';
  if (correct >= 2 && ctx >= 2) return 'supported';
  return 'recognised';
}

export function statusAtLeast(s: ItemStatus, min: ItemStatus): boolean {
  return RANK[s] >= RANK[min];
}

/**
 * Niveau de dialogue : on monte d'un niveau quand toutes les expressions du niveau
 * courant sont au moins `supported`. Indépendant du continent.
 */
export function chooseTier(player: PlayerState, scriptFor: (tier: Tier) => QuestScript | undefined, override: 'auto' | Tier = 'auto'): Tier {
  if (override !== 'auto' && scriptFor(override)) return override;
  for (const tier of ['beginner', 'intermediate'] as const) {
    const script = scriptFor(tier);
    if (!script) return 'beginner';
    const items = scriptItems(script);
    const mastered = items.every((id) => statusAtLeast(itemStatus(player.items[id]), 'supported'));
    if (!mastered) return tier;
    const nextTier = tier === 'beginner' ? 'intermediate' : 'expert';
    if (!scriptFor(nextTier)) return tier;
  }
  return 'expert';
}

export function scriptItems(script: QuestScript): string[] {
  const set = new Set<string>();
  for (const s of script.steps) if (s.kind === 'ask' || s.kind === 'tapAnchor' || s.kind === 'tapProps' || s.kind === 'seek') s.items.forEach((i) => set.add(i));
  return [...set];
}

export interface AnswerRecord {
  items: string[];
  correct: boolean;
  /** réussite obtenue après une erreur ou un indice */
  aided: boolean;
}

/** Met à jour la progression : chaque expression compte au plus une fois par quête. */
export function recordQuestAnswers(player: PlayerState, answers: AnswerRecord[], context: string): PlayerState {
  const items = { ...player.items };
  const touched = new Map<string, { correct: boolean; aided: boolean }>();
  for (const a of answers) {
    for (const id of a.items) {
      const prev = touched.get(id);
      // on garde la meilleure réponse de la quête pour cet item
      if (!prev || (a.correct && (!prev.correct || (prev.aided && !a.aided)))) touched.set(id, { correct: a.correct, aided: a.aided });
    }
  }
  for (const [id, r] of touched) {
    const p: ItemProgress = items[id] ? { ...items[id]!, contexts: [...items[id]!.contexts] } : { seen: 0, correctUnaided: 0, correctAided: 0, contexts: [] };
    p.seen += 1;
    if (r.correct) {
      if (r.aided) p.correctAided += 1;
      else p.correctUnaided += 1;
      if (!p.contexts.includes(context)) p.contexts.push(context);
    }
    items[id] = p;
  }
  return { ...player, items };
}
