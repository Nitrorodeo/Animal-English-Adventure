import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { speech, type VoiceRole } from '../audio/speech';
import { FAMILY_LINES } from '../content/dialogues';
import type { Line, QuestScript, Speaker } from '../content/types';
import { say as sayUi } from '../content/utterances';
import { fillLine, type Vars } from '../engine/dialogue';
import { canGoBack, remember, stepBack } from '../engine/history';
import { autoDelay, canAdvance, isFinished, revealTarget, runAction, startRun, type RunAction, type RunResult, type Utter } from '../engine/runner';
import type { AnswerRecord } from '../engine/skills';

/** Qui joue chaque rôle de la scène : nom affiché et voix (null = absent de la famille). */
export type Cast = Record<Speaker, { name: string; role: VoiceRole } | null>;

/**
 * Relie le lecteur de scènes (engine/runner, pur) à l'écran : minuteries des étapes
 * automatiques et voix de chaque personnage, phrase après phrase.
 */
export function useQuest(script: QuestScript, vars: (place: string) => Vars, cast: Cast, slow: boolean, onFinish: (answers: AnswerRecord[]) => void) {
  const [run, setRun] = useState<RunResult>(() => startRun(script));
  const state = run.state;
  /** états d'arrivée de chaque question, pour pouvoir revenir en arrière */
  const [past, setPast] = useState<readonly RunResult[]>([]);
  const step = script.steps[state.index];
  const v = useMemo(() => vars(state.place), [vars, state.place]);
  const token = useRef(0);

  const text = useCallback(
    (u: Utter): Line => {
      const l = fillLine(u.line, v);
      return u.retry ? { en: sayUi.tryAgain(l.en), fr: `${FAMILY_LINES.tryAgain.fr} ${l.fr}` } : l;
    },
    [v],
  );

  const speakAll = useCallback(
    async (list: Utter[], slowNow = slow) => {
      const my = ++token.current;
      for (const u of list) {
        if (my !== token.current) return;
        const who = cast[u.who];
        await speech.speak(text(u).en, { role: who?.role ?? 'narrator', slow: slowNow });
      }
    },
    [cast, text, slow],
  );

  // phrases produites par la dernière action
  useEffect(() => {
    if (run.say.length) void speakAll(run.say);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  useEffect(() => setPast((p) => remember(p, script, run)), [run, script]);

  // étapes automatiques (déplacements, objets posés)
  useEffect(() => {
    const d = autoDelay(step);
    if (d === null) return;
    const t = setTimeout(() => setRun((r) => runAction(script, r.state, { type: 'advance' })), d);
    return () => clearTimeout(t);
  }, [state.index, step, script]);

  useEffect(
    () => () => {
      token.current++;
      speech.stop();
    },
    [],
  );

  const act = useCallback((a: RunAction) => setRun((r) => runAction(script, r.state, a)), [script]);

  /** revient à la question d'avant : tout redevient comme à ce moment-là, la question est redite */
  const back = useCallback(() => {
    const b = stepBack(past, script, run);
    if (!b) return;
    setPast(b.stack);
    setRun(b.to);
  }, [past, script, run]);

  const replay = useCallback(
    (slowNow?: boolean) => {
      if (state.bubble) void speakAll([state.bubble], slowNow ?? slow);
    },
    [state.bubble, speakAll, slow],
  );

  const finish = useCallback(() => {
    token.current++;
    speech.stop();
    onFinish(state.answers);
  }, [onFinish, state.answers]);

  return {
    state,
    step,
    vars: v,
    bubble: state.bubble ? { who: state.bubble.who, line: text(state.bubble) } : null,
    canAdvance: canAdvance(script, state) && autoDelay(step) === null,
    finished: isFinished(script, state),
    canBack: canGoBack(past, script, run) && !isFinished(script, state),
    back,
    reveal: revealTarget(script, state),
    advance: () => act({ type: 'advance' }),
    choose: (option: number) => act({ type: 'choose', option }),
    tapAnchor: (anchor: string) => act({ type: 'tapAnchor', anchor }),
    tapProp: (prop: string) => act({ type: 'tapProp', prop }),
    tapActor: (who: Speaker[]) => act({ type: 'tapActor', who }),
    /** l'étape attend un toucher sur le décor */
    wantsAnchor: !!step && (step.kind === 'tapAnchor' || step.kind === 'seek') && state.feedback !== 'ok',
    wantsProp: !!step && step.kind === 'tapProps' && state.feedback !== 'ok',
    /** l'étape attend un toucher sur un membre de la famille (« Simon says! ») */
    wantsActor: !!step && step.kind === 'tapActor' && state.feedback !== 'ok',
    replay,
    finish,
    filled: (l: Line) => fillLine(l, v),
  };
}
