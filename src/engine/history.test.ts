/** Revenir à la question d'avant (demande du parent, 2026-11-23) : sans pénalité, sans rien casser. */
import { describe, expect, it } from 'vitest';
import type { Line, QuestScript, QuestStep } from '../content/types';
import { canGoBack, isQuestion, remember, stepBack } from './history';
import { runAction, startRun, type RunResult } from './runner';

const L = (en: string): Line => ({ en, fr: en });
const opts = (good: string, bad: string) => [
  { line: L(good), correct: true },
  { line: L(bad), correct: false },
];
const steps: QuestStep[] = [
  { kind: 'say', speaker: 'narrator', line: L('Welcome!') },
  { kind: 'ask', speaker: 'father', line: L('Is the sun yellow?'), options: opts('Yes', 'No'), hint: L('Look!'), items: ['sun'] },
  { kind: 'say', speaker: 'mother', line: L('Good!') },
  { kind: 'ask', speaker: 'mother', line: L('Is the sky green?'), options: opts('No', 'Yes'), hint: L('Look up!'), items: ['sky'] },
  { kind: 'ask', speaker: 'father', line: L('Is snow cold?'), options: opts('Yes', 'No'), hint: L('Touch it!'), items: ['snow'] },
  { kind: 'celebrate', speaker: 'mother', line: L('Hooray!') },
];
const script: QuestScript = { id: 't', archetypeId: 'test', speciesId: 'hedgehog', biomeId: 'europe_hog_stream', actorKind: 'adult', tier: 'beginner', steps };

const go = (r: RunResult, a: Parameters<typeof runAction>[2]) => runAction(script, r.state, a);
const choose = (r: RunResult, option: number) => go(r, { type: 'choose', option });
/** joue comme le fait l'écran : mémorise l'arrivée sur chaque question */
function play(...acts: ((r: RunResult) => RunResult)[]) {
  let r = startRun(script);
  let past: readonly RunResult[] = remember([], script, r);
  for (const f of acts) {
    r = f(r);
    past = remember(past, script, r);
  }
  return { r, past };
}
const advance = (r: RunResult) => go(r, { type: 'advance' });

describe('revenir à la question d’avant', () => {
  it('reconnaît les questions', () => {
    expect(steps.map((s) => isQuestion(s))).toEqual([false, true, false, true, true, false]);
  });

  it('au début, rien à défaire', () => {
    const { r, past } = play(advance);
    expect(r.state.index).toBe(1);
    expect(canGoBack(past, script, r)).toBe(false);
  });

  it('sur la deuxième question, on revient à la première, réponse effacée, question redite', () => {
    const { r, past } = play(advance, (x) => choose(x, 0), advance, advance);
    expect(r.state.index).toBe(3);
    expect(r.state.answers).toHaveLength(1);
    const b = stepBack(past, script, r)!;
    expect(b).not.toBeNull();
    expect(b.to.state.index).toBe(1);
    expect(b.to.state.answers).toHaveLength(0);
    expect(b.to.state.feedback).toBeNull();
    expect(b.to.say.length).toBeGreaterThan(0);
  });

  it('depuis le récit qui suit une réponse, on revient à cette question', () => {
    const { r, past } = play(advance, (x) => choose(x, 0), advance);
    expect(r.state.index).toBe(2);
    expect(stepBack(past, script, r)!.to.state.index).toBe(1);
  });

  it('après une erreur sur la question 2, on revient à la question 1 (l’erreur n’est pas gardée)', () => {
    const { r, past } = play(advance, (x) => choose(x, 0), advance, advance, (x) => choose(x, 1));
    expect(r.state.wrong).toBe(1);
    expect(stepBack(past, script, r)!.to.state.index).toBe(1);
  });

  it('on peut revenir plusieurs fois, puis refaire tout le parcours jusqu’au bout', () => {
    let { r, past } = play(advance, (x) => choose(x, 0), advance, advance, (x) => choose(x, 0), advance, (x) => choose(x, 0), advance);
    expect(r.state.index).toBe(5);
    expect(r.state.answers).toHaveLength(3);
    // retour sur « Is snow cold? » puis sur « Is the sky green? » puis sur « Is the sun yellow? »
    for (const want of [4, 3, 1]) {
      const b = stepBack(past, script, r)!;
      expect(b.to.state.index).toBe(want);
      r = b.to;
      past = remember(b.stack, script, r);
    }
    expect(canGoBack(past, script, r)).toBe(false);
    expect(r.state.answers).toHaveLength(0);
    // on rejoue : le parcours se termine, avec une réponse par question (pas de doublon)
    r = advance(choose(r, 0)); // question 1 → récit
    r = advance(r); // → question 2
    r = advance(choose(r, 0)); // question 2 → question 3
    r = advance(choose(r, 0)); // question 3 → fin
    expect(r.state.index).toBe(5);
    expect(r.state.answers).toHaveLength(3);
  });
});
