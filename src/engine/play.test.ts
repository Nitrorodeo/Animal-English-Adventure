import { describe, expect, it } from 'vitest';
import { clipFor } from '../audio/clips';
import { ORDERS } from '../content/activities/africa';
import { canDo } from '../content/activities/kit';
import { familyOrders, SILLY_QUESTIONS, yesOrNo } from '../content/activities/play';
import { PLACES } from '../content/places';
import { PROPS } from '../content/props';
import { SPECIES } from '../content/species';
import type { ActivityCtx, QuestScript, QuestStep, Sex, SpeciesDef, StepOf, Tier } from '../content/types';
import { CUDDLES } from '../content/utterances';
import { cuddleLine } from './cuddles';
import { revealTarget, runAction, startRun } from './runner';
import { finalizeSteps } from './script';
import { scriptItems } from './skills';

function ctx(sp: SpeciesDef, babies: Sex[] = [], actorKind: 'adult' | 'baby' = 'adult'): ActivityCtx {
  return { species: sp, place: PLACES[sp.allowedBiomes[0]!]!, actorKind, babies, memories: [], ...(actorKind === 'adult' ? { role: 'father' as const } : { actorSex: babies[0] }) };
}

function steps(def: typeof familyOrders, c: ActivityCtx, tier: Tier, choice: string): QuestStep[] {
  return finalizeSteps(def.build(c, tier, choice)!, { tier, babies: c.babies.length, seed: 1 });
}

const orders = (s: QuestStep[]) => s.filter((x): x is StepOf<'tapActor'> => x.kind === 'tapActor');
const lion = SPECIES.find((s) => s.id === 'lion')!;

describe('Simon says! (toucher le bon membre de la famille)', () => {
  it('débutant : Papa et Maman ; puis le bébé ; expert : les deux bébés', () => {
    for (const choice of familyOrders.choices(ctx(lion))) {
      expect(orders(steps(familyOrders, ctx(lion), 'beginner', choice)).map((o) => o.target).sort()).toEqual(['father', 'mother']);
      expect(orders(steps(familyOrders, ctx(lion, ['girl']), 'intermediate', choice)).map((o) => o.target).sort()).toEqual(['baby', 'father', 'mother']);
      expect(orders(steps(familyOrders, ctx(lion, ['girl', 'boy']), 'expert', choice)).map((o) => o.target).sort()).toEqual(['baby', 'father', 'mother', 'sibling']);
      // sans bébé, jamais d'ordre pour un bébé
      expect(orders(steps(familyOrders, ctx(lion), 'expert', choice)).map((o) => o.target).sort()).toEqual(['father', 'mother']);
    }
  });

  it('des gestes que l’espèce sait faire, tous différents dans une partie', () => {
    for (const sp of SPECIES) {
      for (const choice of familyOrders.choices(ctx(sp))) {
        const os = orders(steps(familyOrders, ctx(sp, ['boy', 'girl']), 'expert', choice));
        // un geste par personnage dès que l'espèce en connaît assez (le panda n'en a que 3 pour 4)
        const known = 3 + (['jump', 'run', 'roar'] as const).filter((x) => canDo(sp, x)).length;
        expect(new Set(os.map((o) => o.action)).size, `${sp.id}/${choice}`).toBe(Math.min(os.length, known));
        for (const o of os) {
          if (o.action === 'jump') expect(canDo(sp, 'jump'), sp.id).toBe(true);
          if (o.action === 'run' || o.action === 'roar') expect(['father', 'mother']).toContain(o.target);
          expect(o.reply).toEqual(Object.values(ORDERS).find((x) => x.action === o.action)!.reply);
        }
      }
    }
  });

  it('nomme les bébés par leur sexe (baby girl / baby boy), même quand un bébé joue', () => {
    const os = orders(steps(familyOrders, ctx(lion, ['boy', 'girl']), 'expert', 'a'));
    expect(os.find((o) => o.target === 'baby')!.line.en).toMatch(/^Baby boy, /);
    expect(os.find((o) => o.target === 'sibling')!.line.en).toMatch(/^Baby girl, /);
    const asBaby = orders(steps(familyOrders, ctx(lion, ['girl', 'boy'], 'baby'), 'expert', 'a'));
    expect(asBaby.find((o) => o.target === 'baby')!.line.en).toMatch(/^Baby girl, /);
  });

  it('les mots travaillés comptent (passeport, choix des jeux)', () => {
    const s = steps(familyOrders, ctx(lion), 'beginner', 'a');
    const items = scriptItems({ id: 't', archetypeId: 'family_orders', speciesId: 'lion', biomeId: 'savanna', actorKind: 'adult', tier: 'beginner', steps: s });
    expect(items).toEqual(expect.arrayContaining(['dad', 'mum', ...orders(s).map((o) => o.items[0]!)]));
  });

  it('mauvais personnage : « Not me! » dit par lui, puis l’indice, puis la bonne réponse brille', () => {
    const script: QuestScript = { id: 't', archetypeId: 'family_orders', speciesId: 'lion', biomeId: 'savanna', actorKind: 'adult', tier: 'beginner', steps: steps(familyOrders, ctx(lion), 'beginner', 'a') };
    let r = runAction(script, startRun(script).state, { type: 'advance' });
    const step = script.steps[r.state.index] as StepOf<'tapActor'>;
    expect(step.target).toBe('father');
    r = runAction(script, r.state, { type: 'tapActor', who: ['mother'] });
    expect(r.say).toEqual([{ who: 'mother', line: step.notMe }]);
    r = runAction(script, r.state, { type: 'tapActor', who: ['mother'] });
    expect(r.say[0]).toMatchObject({ who: 'narrator', retry: true });
    expect(revealTarget(script, r.state)?.actor).toBe('father');
    r = runAction(script, r.state, { type: 'tapActor', who: ['actor', 'father'] });
    expect(r.state.feedback).toBe('ok');
    expect(r.state.acting).toEqual({ who: 'father', action: step.action });
    expect(r.say).toEqual([{ who: 'father', line: step.reply }]);
    expect(r.state.answers.at(-1)).toMatchObject({ correct: true, aided: true });
  });
});

describe('Yes or no? (questions rigolotes)', () => {
  const asks = (s: QuestStep[]) => s.filter((x): x is StepOf<'ask'> => x.kind === 'ask');
  const yes = (a: StepOf<'ask'>) => a.options.find((o) => o.correct)!.line.en === 'Yes!';

  it('les réponses sur l’animal suivent ses vraies capacités et sa vraie nourriture', () => {
    for (const sp of SPECIES) {
      for (const choice of yesOrNo.choices(ctx(sp))) {
        for (const a of asks(steps(yesOrNo, ctx(sp), 'expert', choice))) {
          const can = /^Can I (\w+)\?$/.exec(a.line.en);
          if (can) expect(yes(a), `${sp.id}: ${a.line.en}`).toBe(sp.can.some((x) => x === can[1]));
          const eat = /^Do I eat (.+)\?$/.exec(a.line.en);
          if (eat) expect(yes(a), `${sp.id}: ${a.line.en}`).toBe(sp.foods.some((f) => PROPS[f]?.eat?.en === eat[1]));
          if (can) expect(sp.can.includes(can[1] as never) || sp.cannot.includes(can[1] as never), `${sp.id}: ${a.line.en}`).toBe(true);
        }
      }
    }
  });

  it('on répond 👍 / 👎 sans lire, et le niveau ajoute des questions', () => {
    const n = (t: Tier) => asks(steps(yesOrNo, ctx(lion), t, '0')).length;
    expect([n('beginner'), n('intermediate'), n('expert')]).toEqual([3, 5, 6]);
    for (const a of asks(steps(yesOrNo, ctx(lion), 'expert', '1'))) {
      expect(a.listen).toBe(true);
      expect(a.options.map((o) => o.icon)).toEqual(['👍', '👎']);
    }
  });

  it('chaque variante pose des questions générales différentes, avec autant de oui que de non', () => {
    const seen = new Set<string>();
    for (const choice of yesOrNo.choices(ctx(lion))) for (const a of asks(steps(yesOrNo, ctx(lion), 'expert', choice))) seen.add(a.line.en);
    for (const q of SILLY_QUESTIONS) expect(seen.has(q.q.en), q.q.en).toBe(true);
    expect(SILLY_QUESTIONS.filter((q) => q.yes).length).toBeGreaterThanOrEqual(3);
    expect(SILLY_QUESTIONS.filter((q) => !q.yes).length).toBeGreaterThanOrEqual(3);
  });
});

describe('chatouilles et câlins', () => {
  it('les phrases tournent : bébés qui rient, parents qui font un câlin', () => {
    expect(cuddleLine('baby', 0).en).toBe('Hee, hee! That tickles!');
    expect(cuddleLine('baby', CUDDLES.baby.length)).toEqual(cuddleLine('baby', 0));
    expect(cuddleLine('adult', 1).en).toBe('I love you too!');
    expect(cuddleLine('adult', -1)).toEqual(cuddleLine('adult', CUDDLES.parent.length - 1));
  });

  it('chaque phrase est enregistrée dans la bonne voix', () => {
    for (const l of CUDDLES.baby) for (const r of ['girl', 'boy'] as const) expect(clipFor(l.en, r, []), `${r}: ${l.en}`).toBeDefined();
    for (const l of CUDDLES.parent) for (const r of ['father', 'mother'] as const) expect(clipFor(l.en, r, []), `${r}: ${l.en}`).toBeDefined();
  });
});
