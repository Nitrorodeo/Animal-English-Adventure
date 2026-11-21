/**
 * Le lecteur de scènes joue chaque variante (aventures et activités) du début à la fin :
 * toutes les phrases dites sont enregistrables (prévues par stepUtterances), chaque cible à
 * toucher est visible dans le lieu courant, et la fin est toujours atteinte.
 */
import { describe, expect, it } from 'vitest';
import { PLACES } from '../content/places';
import type { QuestScript } from '../content/types';
import { stepUtterances } from './dialogue';
import { autoDelay, canAdvance, isFinished, revealTarget, runAction, startRun, type RunResult, type RunState, type Utter } from './runner';
import { activityVariants, adventureVariants, STRUCTURAL_CONFIGS } from './variants';

const key = (u: Utter) => `${u.who}|${u.retry ? 'R:' : ''}${u.line.en}`;

/** Joue un script : `mistakes` erreurs avant chaque bonne réponse. Retourne les erreurs trouvées. */
function play(script: QuestScript, mistakes: number): string[] {
  const errors: string[] = [];
  const allowed = new Set(script.steps.flatMap((s) => stepUtterances(s).map(key)));
  let r: RunResult = startRun(script);
  const said = (x: RunResult) => {
    for (const u of x.say) if (!allowed.has(key(u))) errors.push(`${script.id} #${x.state.index}: phrase non prévue « ${u.line.en} » (${u.who})`);
  };
  said(r);
  for (let guard = 0; guard < 500 && !isFinished(script, r.state); guard++) {
    const s: RunState = r.state;
    const step = script.steps[s.index]!;
    const place = PLACES[s.place]!;
    const act = (a: Parameters<typeof runAction>[2]) => {
      r = runAction(script, r.state, a);
      said(r);
    };
    if (step.kind === 'ask') {
      const good = step.options.findIndex((o) => o.correct);
      const bad = step.options.findIndex((o) => !o.correct);
      for (let m = 0; m < mistakes && bad >= 0; m++) act({ type: 'choose', option: bad });
      if (mistakes >= 2 && bad >= 0 && revealTarget(script, r.state)?.option !== good) errors.push(`${script.id} #${s.index}: aide absente`);
      act({ type: 'choose', option: good });
    } else if (step.kind === 'tapAnchor' || step.kind === 'seek') {
      const target = step.kind === 'seek' ? step.hideAt : step.anchor;
      if (!place.anchors.some((a) => a.id === target)) errors.push(`${script.id} #${s.index}: ${target} absent de ${s.place}`);
      const other = place.anchors.find((a) => a.id !== target);
      for (let m = 0; m < mistakes && other; m++) act({ type: 'tapAnchor', anchor: other.id });
      act({ type: 'tapAnchor', anchor: target });
    } else if (step.kind === 'tapProps') {
      for (const t of step.targets) if (!s.props.some((p) => p.id === t)) errors.push(`${script.id} #${s.index}: objet ${t} non affiché`);
      const intruder = s.props.find((p) => !step.targets.includes(p.id));
      for (let m = 0; m < mistakes && intruder; m++) act({ type: 'tapProp', prop: intruder.id });
      if (step.ordered && mistakes && step.targets.length > 1) {
        // dans l'ordre : toucher le deuxième en premier ne compte pas, et l'aide montre le premier
        act({ type: 'tapProp', prop: step.targets[1]! });
        if (r.state.tapped.length) errors.push(`${script.id} #${s.index}: ordre non respecté accepté`);
        act({ type: 'tapProp', prop: step.targets[1]! });
        const rv = revealTarget(script, r.state)?.props;
        if (!rv || rv.length !== 1 || rv[0] !== step.targets[0]) errors.push(`${script.id} #${s.index}: aide de l'ordre absente`);
      }
      for (const t of step.targets) act({ type: 'tapProp', prop: t });
    } else if (step.kind === 'tapActor') {
      // un autre membre de la famille d'abord (« Not me! »), puis le bon
      const wrongWho = step.target === 'father' ? 'mother' : 'father';
      for (let m = 0; m < mistakes; m++) act({ type: 'tapActor', who: [wrongWho] });
      if (mistakes >= 2 && revealTarget(script, r.state)?.actor !== step.target) errors.push(`${script.id} #${s.index}: aide absente`);
      act({ type: 'tapActor', who: ['actor', step.target] });
      if (r.state.acting?.who !== step.target) errors.push(`${script.id} #${s.index}: le personnage touché ne bouge pas`);
    } else if (step.kind === 'command') {
      // « Fly! » d'abord (réponse drôle, sans progrès), puis les ordres faisables jusqu'au compte
      const silly = step.options.findIndex((o) => !o.action);
      if (mistakes && silly >= 0) {
        act({ type: 'choose', option: silly });
        if (r.state.tapped.length) errors.push(`${script.id} #${s.index}: ordre impossible compté`);
      }
      step.options.forEach((o, i) => {
        if (o.action && r.state.feedback !== 'ok') act({ type: 'choose', option: i });
      });
    }
    if (!canAdvance(script, r.state)) {
      errors.push(`${script.id} #${r.state.index}: bloqué (${step.kind})`);
      break;
    }
    if (autoDelay(step) === null && r.state.index !== s.index) errors.push(`${script.id}: saut inattendu`);
    act({ type: 'advance' });
  }
  if (!isFinished(script, r.state)) errors.push(`${script.id}: fin jamais atteinte`);
  if (r.state.place !== (script.endPlace ?? script.biomeId)) errors.push(`${script.id}: lieu final ${r.state.place}`);
  return errors;
}

describe('lecteur de scènes', () => {
  it('joue toutes les aventures sans faute et avec deux erreurs à chaque question', () => {
    const errors: string[] = [];
    for (const v of adventureVariants(STRUCTURAL_CONFIGS)) {
      errors.push(...play(v.script, 0), ...play(v.script, 2));
      if (errors.length > 20) break;
    }
    expect(errors.slice(0, 20)).toEqual([]);
  });

  it('joue toutes les activités', () => {
    const errors: string[] = [];
    let n = 0;
    for (const v of activityVariants(STRUCTURAL_CONFIGS)) {
      // une erreur à chaque question sur une variante sur deux : couvre les deux chemins
      errors.push(...play(v.script, n++ % 2));
      if (errors.length > 20) break;
    }
    expect(errors.slice(0, 20)).toEqual([]);
  });

  it('compte à voix haute, ne compte pas deux fois le même objet et note la réussite aidée', () => {
    const script: QuestScript = {
      id: 't', archetypeId: 'count_objects', speciesId: 'lion', biomeId: 'savanna', actorKind: 'adult', tier: 'beginner',
      steps: [
        { kind: 'props', show: [{ id: 'a', prop: 'pebble', spot: 0 }, { id: 'b', prop: 'pebble', spot: 1 }, { id: 'x', prop: 'flower', spot: 2 }] },
        { kind: 'tapProps', speaker: 'actor', line: { en: 'Count!', fr: 'Compte !' }, targets: ['a', 'b'], count: true, hint: { en: 'Pebbles!', fr: 'Les cailloux !' }, items: ['count'], wrong: { x: { en: 'A flower!', fr: 'Une fleur !' } } },
        { kind: 'celebrate', speaker: 'actor', line: { en: 'Yay!', fr: 'Youpi !' } },
      ],
    };
    let r = startRun(script);
    r = runAction(script, r.state, { type: 'advance' });
    r = runAction(script, r.state, { type: 'tapProp', prop: 'x' });
    expect(r.say[0]?.line.en).toBe('A flower!');
    r = runAction(script, r.state, { type: 'tapProp', prop: 'a' });
    expect(r.say.map((u) => u.line.en)).toEqual(['One!']);
    r = runAction(script, r.state, { type: 'tapProp', prop: 'a' });
    expect(r.say).toEqual([]);
    r = runAction(script, r.state, { type: 'tapProp', prop: 'b' });
    expect(r.say.map((u) => u.line.en)).toEqual(['Two!', 'Well done!']);
    expect(r.state.answers).toEqual([{ items: ['count'], correct: true, aided: true }]);
    r = runAction(script, r.state, { type: 'advance' });
    expect(isFinished(script, r.state)).toBe(true);
  });
});
