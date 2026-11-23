/**
 * Revenir en arrière sur les questions (demande du parent, 2026-11-23 : « Il faut que sur les questions, je
 * puisse revenir en arrière »). On garde l'état du lecteur de scènes à l'arrivée de chaque question ; revenir,
 * c'est reprendre l'un de ces états. Le lecteur est pur : rien d'autre à défaire (réponses, objets, lieu
 * reviennent comme avant), aucune pénalité, aucune phrase nouvelle.
 */
import type { QuestScript, QuestStep } from '../content/types';
import type { RunResult } from './runner';

const QUESTION_KINDS: readonly QuestStep['kind'][] = ['ask', 'tapAnchor', 'tapProps', 'command', 'tapActor', 'seek'];

/** Cette étape est-elle une question ou un toucher à faire ? */
export const isQuestion = (step: QuestStep | undefined): boolean => !!step && QUESTION_KINDS.includes(step.kind);

/** Mémorise l'arrivée sur une question (pas les étapes d'après : réponses, erreurs, récit). */
export function remember(stack: readonly RunResult[], script: QuestScript, now: RunResult): readonly RunResult[] {
  const s = now.state;
  if (!isQuestion(script.steps[s.index]) || s.feedback !== null || s.wrong > 0 || s.tapped.length > 0) return stack;
  const last = stack[stack.length - 1];
  if (last && last.state.index === s.index) return [...stack.slice(0, -1), now];
  return [...stack, now];
}

/** La question d'avant, ou null s'il n'y en a pas. `stack` revient sans la question quittée. */
export function stepBack(stack: readonly RunResult[], script: QuestScript, now: RunResult): { to: RunResult; stack: readonly RunResult[] } | null {
  const s = now.state;
  // sur une question : on remonte à la précédente ; ailleurs (récit après une question) : à la dernière posée
  const onQuestion = isQuestion(script.steps[s.index]);
  const rest = onQuestion && stack[stack.length - 1]?.state.index === s.index ? stack.slice(0, -1) : stack;
  const to = rest[rest.length - 1];
  if (!to || to.state.index >= s.index) return null;
  return { to, stack: rest };
}

/** Le bouton « retour » a-t-il quelque chose à faire ici ? */
export const canGoBack = (stack: readonly RunResult[], script: QuestScript, now: RunResult): boolean => stepBack(stack, script, now) !== null;
