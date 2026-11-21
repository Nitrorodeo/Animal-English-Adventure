/**
 * Deux jeux pour rire, partout dans le monde (demande du parent du 2026-11-20) :
 *
 * - « Simon says! » : la voix dit « Mummy, dance! » ; la joueuse touche le bon membre de la
 *   famille, qui le fait aussitôt. Jeu d'écoute (verbes d'action + Daddy / Mummy / baby).
 *   C'est l'inverse de « You are the boss! » (Afrique), où la joueuse donne les ordres.
 * - « Yes or no? » : questions rigolotes (« Can I fly? », « Do cats say woof? ») auxquelles on
 *   répond 👍 ou 👎, sans rien lire. Les questions sur l'animal viennent de ses vraies
 *   capacités et de sa vraie nourriture : jamais de réponse fausse sur l'espèce.
 *
 * Les questions sont à la première personne (« Can I… », « Do I eat… ») : la même phrase sert à
 * toutes les espèces, ce qui garde le nombre d'enregistrements raisonnable.
 */
import { PROPS } from '../props';
import type { ActivityCtx, ActivityDef, Line, QuestStep, ResponseOption, Sex, Speaker } from '../types';
import { ORDERS } from './africa';
import { babySex, other } from './games';
import { ABILITY_WORDS, act, ask, canDo, end, hash, L, low, say, tapActor } from './kit';

// ---------------------------------------------------------------------------
// « Simon says! » — écouter et toucher le bon personnage
// ---------------------------------------------------------------------------

type OrderKey = keyof typeof ORDERS;

/** Comment on appelle chaque membre de la famille. */
function calledOf(who: Speaker, c: ActivityCtx): { name: Line; obj: Line; item: string } {
  if (who === 'father') return { name: L('Daddy', 'Papa'), obj: L('Daddy', 'Papa'), item: 'dad' };
  if (who === 'mother') return { name: L('Mummy', 'Maman'), obj: L('Mummy', 'Maman'), item: 'mum' };
  const first: Sex = babySex(c) ?? 'girl';
  const sex = who === 'baby' ? first : other(first);
  return sex === 'girl'
    ? { name: L('Baby girl', 'Petite fille'), obj: L('the baby girl', 'la petite fille'), item: 'baby' }
    : { name: L('Baby boy', 'Petit garçon'), obj: L('the baby boy', 'le petit garçon'), item: 'baby' };
}

/** Ordres faisables sur place, sans aller à l'eau. Les bébés : seulement les gestes simples. */
function ordersOf(c: ActivityCtx, who: Speaker): OrderKey[] {
  const out: OrderKey[] = [];
  if (canDo(c.species, 'jump')) out.push('jump');
  if (who === 'father' || who === 'mother') {
    if (canDo(c.species, 'run')) out.push('run');
    if (canDo(c.species, 'roar')) out.push('roar');
  }
  out.push('dance', 'wave', 'sleep');
  return out;
}

/** Ordre de passage des personnages selon la variante : les parents d'abord au niveau débutant. */
const ORDER_SEQUENCES: Readonly<Record<string, readonly Speaker[]>> = {
  a: ['father', 'mother', 'baby', 'sibling'],
  b: ['mother', 'baby', 'father', 'sibling'],
  c: ['baby', 'father', 'sibling', 'mother'],
};

export const familyOrders: ActivityDef = {
  id: 'family_orders',
  choices: () => Object.keys(ORDER_SEQUENCES),
  build(c, _tier, choice) {
    const seq = ORDER_SEQUENCES[choice];
    if (!seq) return undefined;
    // Les bébés choisissent d'abord (moins de gestes possibles), pour que chacun ait un geste à lui.
    const used = new Set<OrderKey>();
    const pick = new Map<Speaker, OrderKey>();
    for (const who of [...seq].sort((x, y) => Number(x === 'father' || x === 'mother') - Number(y === 'father' || y === 'mother'))) {
      const pool = ordersOf(c, who);
      const start = hash(`${choice}:${c.species.id}:${who}`) % pool.length;
      const key = [...pool.slice(start), ...pool.slice(0, start)].find((k) => !used.has(k)) ?? pool[start]!;
      used.add(key);
      pick.set(who, key);
    }
    const steps: QuestStep[] = [say('actor', "Let's play Simon says! Listen, then touch the right animal!", 'On joue à Jacques a dit ! Écoute bien, puis touche le bon animal !', {}, 'happy')];
    seq.forEach((who) => {
      const key = pick.get(who)!;
      const o = ORDERS[key];
      const call = calledOf(who, c);
      const gate = who === 'baby' ? { needs: 'baby' as const, minTier: 'intermediate' as const } : who === 'sibling' ? { needs: 'sibling' as const, minTier: 'expert' as const } : {};
      steps.push(
        tapActor(
          'narrator',
          L(`${call.name.en}, ${low(o.line.en)}`, `${call.name.fr}, ${low(o.line.fr)}`),
          who,
          o.action,
          o.reply,
          L(`Not me! Find ${call.obj.en}!`, `Pas moi ! Trouve ${call.obj.fr} !`),
          L(`Touch ${call.obj.en}!`, `Touche ${call.obj.fr} !`),
          [key, call.item],
          gate,
        ),
      );
    });
    steps.push(end('actor', 'You listen so well! Bravo!', 'Tu écoutes trop bien ! Bravo !'));
    return steps;
  },
  memoryEvent: () => 'played_simon_says',
};

// ---------------------------------------------------------------------------
// « Yes or no? » — questions rigolotes
// ---------------------------------------------------------------------------

const YES_NO = (yes: boolean): ResponseOption[] => [
  { line: L('Yes!', 'Oui !'), icon: '👍', correct: yes },
  { line: L('No!', 'Non !'), icon: '👎', correct: !yes },
];

interface Silly {
  q: Line;
  yes: boolean;
  reply: Line;
  hint: Line;
}

/** Questions valables partout (rien qui dépende du décor ou de l'espèce). */
export const SILLY_QUESTIONS: readonly Silly[] = [
  { q: L('Is the sun cold?', 'Est-ce que le soleil est froid ?'), yes: false, reply: L('Ha, ha! No! The sun is hot!', 'Ha, ha ! Non ! Le soleil est chaud !'), hint: L('The sun is hot!', 'Le soleil est chaud !') },
  { q: L('Do ducks say quack?', 'Est-ce que les canards font coin-coin ?'), yes: true, reply: L('Yes! Quack, quack!', 'Oui ! Coin-coin !'), hint: L('Ducks say quack, quack!', 'Les canards font coin-coin !') },
  { q: L('Is the grass blue?', "Est-ce que l'herbe est bleue ?"), yes: false, reply: L('Ha, ha! No! The grass is green!', "Ha, ha ! Non ! L'herbe est verte !"), hint: L('The grass is green!', "L'herbe est verte !") },
  { q: L('Is snow cold?', 'Est-ce que la neige est froide ?'), yes: true, reply: L('Yes! Brr! Snow is cold!', 'Oui ! Brr ! La neige est froide !'), hint: L('Brr! Snow is cold!', 'Brr ! La neige est froide !') },
  { q: L('Do fish live in trees?', 'Est-ce que les poissons vivent dans les arbres ?'), yes: false, reply: L('Ha, ha! No! Fish live in the water!', "Ha, ha ! Non ! Les poissons vivent dans l'eau !"), hint: L('Fish live in the water!', "Les poissons vivent dans l'eau !") },
  { q: L('Is a banana yellow?', 'Est-ce qu’une banane est jaune ?'), yes: true, reply: L('Yes! A banana is yellow!', 'Oui ! Une banane est jaune !'), hint: L('A banana is yellow!', 'Une banane est jaune !') },
  { q: L('Do cats say woof?', 'Est-ce que les chats font ouaf ?'), yes: false, reply: L('Ha, ha! No! Cats say meow!', 'Ha, ha ! Non ! Les chats font miaou !'), hint: L('Cats say meow!', 'Les chats font miaou !') },
  { q: L('Can cars fly?', 'Est-ce que les voitures volent ?'), yes: false, reply: L("Ha, ha! No! Cars can't fly!", 'Ha, ha ! Non ! Les voitures ne volent pas !'), hint: L('Cars drive on the road!', 'Les voitures roulent sur la route !') },
];

const sillyAsk = (x: Silly, gate = {}): QuestStep =>
  ask('actor', x.q.en, x.q.fr, YES_NO(x.yes), x.hint, [x.yes ? 'yes' : 'no'], { keepOrder: true, listen: true, onCorrect: x.reply, ...gate });

/** « des feuilles » → « les feuilles » (j'adore les feuilles). */
const loveFr = (fr: string) => fr.replace(/^(du|de la|de l'|des) /, (m) => ({ 'du ': 'le ', 'de la ': 'la ', "de l'": "l'", 'des ': 'les ' })[m] ?? m);

export const yesOrNo: ActivityDef = {
  id: 'yes_or_no',
  choices: () => ['0', '1', '2', '3'],
  build(c, _tier, choice) {
    const i = Number(choice);
    const sp = c.species;
    const can = ABILITY_WORDS[sp.can[i % sp.can.length]!];
    const cant = ABILITY_WORDS[sp.cannot[i % sp.cannot.length]!];
    const good = PROPS[sp.foods[i % sp.foods.length] ?? '']?.eat;
    const bad = PROPS[sp.notFoods[i % sp.notFoods.length] ?? '']?.eat;
    if (!can || !cant || !good || !bad) return undefined;
    const s1 = SILLY_QUESTIONS[(i * 2) % SILLY_QUESTIONS.length]!;
    const s2 = SILLY_QUESTIONS[(i * 2 + 1) % SILLY_QUESTIONS.length]!;
    return [
      say('actor', 'Silly questions! Yes or no? Ready?', 'Des questions rigolotes ! Oui ou non ? Prête ?', {}, 'happy'),
      ask('actor', `Can I ${can.en}?`, `Est-ce que je sais ${can.fr} ?`, YES_NO(true), [`Look! I can ${can.en}!`, `Regarde ! Je sais ${can.fr} !`], [can.en, 'can'], { keepOrder: true, listen: true, onCorrect: L(`Yes! I can ${can.en}! Look!`, `Oui ! Je sais ${can.fr} ! Regarde !`) }),
      act('actor', can.act, 'Look at me!', 'Regarde-moi !', 'actor'),
      sillyAsk(s1),
      ask('actor', `Can I ${cant.en}?`, `Est-ce que je sais ${cant.fr} ?`, YES_NO(false), [`Oh no, I can't ${cant.en}!`, `Oh non, je ne sais pas ${cant.fr} !`], [cant.en, 'cant'], { keepOrder: true, listen: true, onCorrect: L(`Ha, ha! No! I can't ${cant.en}!`, `Ha, ha ! Non ! Je ne sais pas ${cant.fr} !`) }),
      ask('actor', `Do I eat ${bad.en}?`, `Est-ce que je mange ${bad.fr} ?`, YES_NO(false), [`I don't eat ${bad.en}!`, `Je ne mange pas ${bad.frNo} !`], ['eat'], { minTier: 'intermediate', keepOrder: true, listen: true, onCorrect: L(`Ha, ha! No! I don't eat ${bad.en}! Yuck!`, `Ha, ha ! Non ! Je ne mange pas ${bad.frNo} ! Beurk !`) }),
      sillyAsk(s2, { minTier: 'intermediate' }),
      ask('actor', `Do I eat ${good.en}?`, `Est-ce que je mange ${good.fr} ?`, YES_NO(true), [`Yum! I eat ${good.en}!`, `Miam ! Je mange ${good.fr} !`], ['eat'], { minTier: 'expert', keepOrder: true, listen: true, onCorrect: L(`Yes! Yum! I love ${good.en}!`, `Oui ! Miam ! J'adore ${loveFr(good.fr)} !`) }),
      end('actor', 'Ha, ha! You are so funny and so clever!', 'Ha, ha ! Tu es trop drôle et trop maligne !'),
    ];
  },
  memoryEvent: () => 'played_yes_or_no',
};
