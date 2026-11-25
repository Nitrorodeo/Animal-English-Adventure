/**
 * Jeux courts : compter, trouver la couleur, cache-cache, météo et habits, capacités de
 * l'animal, grand / petit, « que fait Papa ? ». Les objets à compter et les formes colorées
 * viennent du vocabulaire propre au continent (props.ts).
 */
import { COLOR_SHAPES, COLORS, colorFr, COUNTABLES, NUMBERS, PROPS, WEATHER_WORDS } from '../props';
import type { ActivityCtx, ActivityDef, ColorId, Line, PropDef, QuestStep, ResponseOption, Sex, Weather } from '../types';
import {
  ABILITY_WORDS,
  ACTION_WORDS,
  act,
  anchor,
  ask,
  cap,
  clearProps,
  end,
  heShe,
  hidingPlaces,
  L,
  nameable,
  no,
  ok,
  pickStable,
  prop,
  props,
  say,
  seek,
  sibWord,
  spotsFor,
  tapProps,
} from './kit';

export const numberId = (n: number) => NUMBERS[n]!.en.toLowerCase();

/** Sexe du bébé « baby » de la scène (le personnage joué, ou l'aîné si un parent joue). */
export function babySex(c: ActivityCtx): Sex | undefined {
  return c.actorKind === 'baby' ? c.actorSex : c.babies[0];
}
export const other = (s: Sex): Sex => (s === 'girl' ? 'boy' : 'girl');

// ---------------------------------------------------------------------------
// 1.3 — Compter
// ---------------------------------------------------------------------------

const COUNT_BY_TIER = { beginner: 3, intermediate: 5, expert: 7 } as const;

const KEYCAPS = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

export function numberOptions(n: number): ResponseOption[] {
  const ks = [n, n - 1, n + 1, n + 2].filter((k) => k >= 1 && k <= 10);
  // le chiffre sur la carte : l'enfant ne lit pas encore « Five »
  return ks.map((k) => ({ line: L(`${NUMBERS[k]!.en}!`, `${NUMBERS[k]!.fr} !`), icon: KEYCAPS[k], correct: k === n }));
}

export const countObjects: ActivityDef = {
  id: 'count_objects',
  choices: (c) => (c.place.spots.length >= 8 ? COUNTABLES[c.place.continentId].filter((id) => PROPS[id]) : []),
  build(c, tier, choice) {
    const p = PROPS[choice];
    if (!p) return undefined;
    const n = COUNT_BY_TIER[tier];
    const intruder = tier === 'beginner' ? undefined : PROPS[pickStable(COUNTABLES[c.place.continentId].filter((id) => id !== choice && PROPS[id]!.word !== p.word), choice)];
    const spots = spotsFor(c.place, n + 1, choice + c.place.id);
    const shown = spots.slice(0, n).map((s, i) => prop(`c${i}`, p.id, s));
    if (intruder) shown.push(prop('intruder', intruder.id, spots[n]!));
    const targets = shown.filter((x) => x.id !== 'intruder').map((x) => x.id);
    const steps: QuestStep[] = [
      props(shown),
      say('actor', `Look! ${cap(p.plural)}! Let's count them!`, `Regarde ! Des ${p.pluralFr} ! Comptons-les !`, {}, 'happy'),
      tapProps('actor', `Touch the ${p.plural} and count with me!`, `Touche les ${p.pluralFr} et compte avec moi !`, targets, L(`Touch every ${p.word}!`, `Touche chaque ${p.pluralFr.replace(/s$/, '')} !`), [p.word, 'count'], {
        count: true,
        onCorrect: L(`${NUMBERS[n]!.en} ${p.plural}!`, `${NUMBERS[n]!.fr} ${p.pluralFr} !`),
        ...(intruder ? { wrong: { intruder: L(`That's not ${p.noun.en.toLowerCase()}! It's ${intruder.noun.en.toLowerCase()}!`, `Ce n'est pas ça ! C'est ${intruder.noun.fr.toLowerCase()} !`) } } : {}),
      }),
      ask('actor', `How many ${p.plural}?`, `Combien de ${p.pluralFr} ?`, numberOptions(n), ['Count again: one, two, three…', 'Recompte : one, two, three…'], [numberId(n), 'how_many'], { onCorrect: L(`Yes! ${NUMBERS[n]!.en}!`, `Oui ! ${NUMBERS[n]!.fr} !`), keepOrder: false }),
    ];
    if (tier === 'expert') {
      const more = [...spots.slice(0, n), spots[n]!].map((s, i) => prop(`m${i}`, p.id, s));
      steps.push(
        props(more),
        ask('actor', `Look! One more ${p.word}! How many now?`, `Regarde ! Un de plus ! Combien maintenant ?`, numberOptions(n + 1), ['Count them all again!', 'Recompte tout !'], [numberId(n + 1), 'how_many'], { onCorrect: L(`Yes! ${NUMBERS[n + 1]!.en}!`, `Oui ! ${NUMBERS[n + 1]!.fr} !`) }),
      );
    }
    steps.push(clearProps(), end('actor', 'Great counting! You are so clever!', 'Super, tu sais compter ! Tu es trop forte !'));
    return steps;
  },
  memoryEvent: (_c, choice) => `counted:${choice}`,
};

// ---------------------------------------------------------------------------
// 1.2 — Couleurs
// ---------------------------------------------------------------------------

export const TARGET_COLORS: readonly ColorId[] = ['red', 'blue', 'yellow', 'green', 'orange', 'pink'];
const ALL_COLORS = Object.keys(COLORS) as ColorId[];
const COLOR_COUNT = { beginner: 2, intermediate: 3, expert: 4 } as const;

function touchColor(p: PropDef, target: ColorId, others: { id: string; color: ColorId }[], targetId: string, first: boolean): QuestStep {
  const col = COLORS[target];
  return tapProps(
    'actor',
    first ? `Touch the ${col.en} ${p.word}!` : `Now touch the ${col.en} ${p.word}!`,
    `${first ? 'Touche' : 'Maintenant, touche'} ${p.wordFr} ${colorFr(target, p.fem)} !`,
    [targetId],
    L(`Look for the ${col.en} one!`, `Cherche ${p.fem ? 'la' : 'le'} ${colorFr(target, p.fem)} !`),
    [target, p.word],
    { onCorrect: L(`Yes! The ${col.en} ${p.word}!`, `Oui ! ${cap(p.wordFr)} ${colorFr(target, p.fem)} !`), wrong: Object.fromEntries(others.map((o) => [o.id, L(`No, that one is ${COLORS[o.color].en}!`, `Non, celui-là est ${colorFr(o.color, p.fem)} !`)])) },
  );
}

export const identifyColors: ActivityDef = {
  id: 'identify_colors',
  choices: (c) => (c.place.spots.length >= 4 ? COLOR_SHAPES[c.place.continentId].flatMap((s) => TARGET_COLORS.map((col) => `${s}|${col}`)) : []),
  build(c, tier, choice) {
    const [shapeId, target] = choice.split('|') as [string, ColorId];
    const p = PROPS[shapeId];
    if (!p?.shape) return undefined;
    const n = COLOR_COUNT[tier];
    const rest = ALL_COLORS.filter((x) => x !== target);
    const start = (shapeId.length + target.length) % rest.length;
    const colors = [target, ...Array.from({ length: n - 1 }, (_, i) => rest[(start + i * 2) % rest.length]!)];
    const spots = spotsFor(c.place, n, choice + c.place.id);
    const placed = colors.map((col, i) => ({ id: `col_${col}`, color: col, spot: spots[i]! }));
    const steps: QuestStep[] = [
      props(placed.map((x) => prop(x.id, p.id, x.spot, x.color))),
      say('actor', `Look! Colourful ${p.plural}!`, `Regarde ! Des ${p.pluralFr} de toutes les couleurs !`, {}, 'happy'),
      touchColor(p, target, placed.slice(1), placed[0]!.id, true),
    ];
    if (tier !== 'beginner') {
      const second = placed[1]!;
      steps.push(touchColor(p, second.color, placed.filter((x) => x !== second), second.id, false));
    }
    if (tier === 'expert') {
      steps.push(
        ask('actor', "What's your favourite colour?", 'Quelle est ta couleur préférée ?', TARGET_COLORS.slice(0, 4).map((col) => ({ line: L(`${cap(COLORS[col].en)}!`, `${cap(COLORS[col].fr)} !`), icon: COLORS[col].icon, correct: true })), ['Choose your favourite colour!', 'Choisis ta couleur préférée !'], ['favourite_colour'], { onCorrect: L('I love that colour too!', "Moi aussi, j'adore cette couleur !"), keepOrder: true }),
      );
    }
    steps.push(clearProps(), end('actor', 'You know your colours! Bravo!', 'Tu connais tes couleurs ! Bravo !'));
    return steps;
  },
};

// ---------------------------------------------------------------------------
// 2.3 — Cache-cache (derrière un objet du décor marqué « hide »)
// ---------------------------------------------------------------------------

export const hideAndSeek: ActivityDef = {
  id: 'hide_and_seek',
  choices: (c) => (nameable(c.place).length >= 3 ? hidingPlaces(c.place).map((a) => a.id) : []),
  build(c, _tier, choice) {
    const a = anchor(c.place, choice);
    if (!a) return undefined;
    const others = nameable(c.place).filter((x) => x.word !== a.word);
    const where: ResponseOption[] = [ok(`Behind the ${a.word}!`, `Derrière ${a.wordFr} !`), ...others.slice(0, 3).map((x) => no(`Behind the ${x.word}!`, `Derrière ${x.wordFr} !`))];
    const second = hidingPlaces(c.place).find((x) => x.id !== a.id) ?? a;
    const sex = babySex(c);
    const babyActor = c.actorKind === 'baby';
    const hider = babyActor ? 'sibling' : 'baby';
    const who: Line = babyActor ? (sex ? L(`Now my ${sibWord(other(sex)).en} is hiding!`, `Maintenant, c'est mon ${sibWord(other(sex)).fr} qui se cache !`) : L('Now my little one is hiding!', 'Maintenant, mon petit se cache !')) : L(`Now our ${c.species.babyWord.en} is hiding!`, `Maintenant, notre ${c.species.babyWord.fr} se cache !`);
    return [
      say('actor', "Let's play hide and seek! Close your eyes! One, two, three…", 'Jouons à cache-cache ! Ferme les yeux ! Un, deux, trois…', {}, 'happy'),
      seek('actor', 'actor', a.id, { line: ['Ready! Where am I? Find me!', 'Prêt ! Où suis-je ? Trouve-moi !'], hint: [`I'm behind the ${a.word}!`, `Je suis derrière ${a.wordFr} !`], notHere: ['Not here! Look again!', 'Pas ici ! Cherche encore !'], found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'] }, ['hide_and_seek', a.word]),
      ask('actor', 'Where was I hiding?', 'Où étais-je caché ?', where, [`I was behind the ${a.word}!`, `J'étais derrière ${a.wordFr} !`], ['behind', a.word], { minTier: 'intermediate', onCorrect: L(`Yes! Behind the ${a.word}!`, `Oui ! Derrière ${a.wordFr} !`) }),
      say('actor', who.en, who.fr, { minTier: 'expert', needs: babyActor ? 'sibling' : 'baby' }),
      seek(hider, hider, second.id, { line: ['Hee hee! Where am I?', 'Hi hi ! Où suis-je ?'], hint: [`I'm behind the ${second.word}!`, `Je suis derrière ${second.wordFr} !`], notHere: ['Not here!', 'Pas ici !'], found: ['Oh! You found me!', 'Oh ! Tu m’as trouvé !'] }, ['hide_and_seek', second.word], { minTier: 'expert', needs: babyActor ? 'sibling' : 'baby' }),
      end('actor', 'That was fun! You are good at hide and seek!', 'Trop drôle ! Tu es forte à cache-cache !'),
    ];
  },
  memoryEvent: () => 'played_hide_and_seek',
};

// ---------------------------------------------------------------------------
// 1.7 / 2.7 — Météo et habits (la météo est celle de l'image du lieu)
// ---------------------------------------------------------------------------

const WRONG_WEATHER: Readonly<Record<Weather, Weather[]>> = {
  sunny: ['rainy', 'snowy', 'misty'],
  hot: ['snowy', 'rainy', 'cold'],
  cloudy: ['sunny', 'snowy', 'hot'],
  rainy: ['sunny', 'hot', 'snowy'],
  windy: ['hot', 'rainy', 'misty'],
  snowy: ['hot', 'sunny', 'rainy'],
  misty: ['hot', 'snowy', 'rainy'],
  cold: ['hot', 'rainy', 'misty'],
};
const WRONG_CLOTHES: Readonly<Record<Weather, string[]>> = {
  sunny: ['coat', 'gloves'],
  hot: ['coat', 'gloves'],
  cloudy: [],
  rainy: ['sunglasses', 'gloves'],
  windy: ['sunglasses', 'umbrella'],
  snowy: ['sunglasses', 'umbrella'],
  misty: ['sunglasses', 'umbrella'],
  cold: ['sunglasses', 'umbrella'],
};

export const weatherCheck: ActivityDef = {
  id: 'weather_check',
  choices: (c) => [c.place.weather],
  build(c) {
    const w = c.place.weather;
    const ww = WEATHER_WORDS[w];
    const opt = (x: Weather, correct: boolean): ResponseOption => ({ line: L(WEATHER_WORDS[x].en, WEATHER_WORDS[x].fr), icon: WEATHER_WORDS[x].icon, correct });
    const good = ww.clothes.slice(0, 2).map((id) => PROPS[id]!);
    const bad = WRONG_CLOTHES[w].map((id) => PROPS[id]!);
    const steps: QuestStep[] = [
      ask('actor', "Look at the sky! What's the weather like today?", 'Regarde le ciel ! Quel temps fait-il aujourd’hui ?', [opt(w, true), ...WRONG_WEATHER[w].map((x) => opt(x, false))], ['Look at the sky and the trees!', 'Regarde le ciel et les arbres !'], [w, 'weather'], { onCorrect: L(`Yes! ${ww.en}`, `Oui ! ${ww.fr}`) }),
    ];
    if (good.length && bad.length && c.place.spots.length >= 4) {
      const spots = spotsFor(c.place, good.length + bad.length, 'weather' + c.place.id);
      const all = [...good, ...bad];
      const goodIds = good.map((g) => `w_${g.id}`);
      // les habits sont pour l'enfant, pas pour l'animal : un ours polaire qui réclame un manteau
      // et une écharpe était absurde (audit du 2026-11-25)
      const de = (fr: string) => fr.replace(/^(un|une|des) /, (m) => (m === 'des ' ? 'de ' : `d'${m}`));
      const needLine = good.length === 2 ? L(`Yes! You need ${good[0]!.need!.en} and ${good[1]!.need!.en}!`, `Oui ! Tu as besoin ${de(good[0]!.need!.fr)} et ${de(good[1]!.need!.fr)} !`) : L(`Yes! You need ${good[0]!.need!.en}!`, `Oui ! Tu as besoin ${de(good[0]!.need!.fr)} !`);
      steps.push(
        props(all.map((p, i) => prop(`w_${p.id}`, p.id, spots[i]!)), { minTier: 'intermediate' }),
        tapProps('actor', `${ww.en} What do you need? Touch the good things!`, `${ww.fr} De quoi as-tu besoin ? Touche les bonnes choses !`, goodIds, ['Think about the weather!', 'Pense à la météo !'], [...good.map((g) => g.word), 'need'], {
          minTier: 'intermediate',
          onCorrect: needLine,
          wrong: Object.fromEntries(bad.map((b) => [`w_${b.id}`, L(`You don't need ${b.need!.en} today!`, `Tu n'as pas besoin de ça aujourd'hui !`)])),
        }),
        ask('actor', `Do you need ${bad[0]!.need!.en} today?`, `As-tu besoin de ça aujourd'hui ?`, [ok("No, I don't!", 'Non !', '👎'), no('Yes, I do!', 'Oui !', '👍')], [`${ww.en} You don't need ${bad[0]!.need!.en}!`, `${ww.fr} Tu n'en as pas besoin !`], ['need', bad[0]!.word], { keepOrder: true, minTier: 'expert', onCorrect: L("That's right!", "C'est ça !") }),
        clearProps({ minTier: 'intermediate' }),
      );
    }
    steps.push(end('actor', 'You know the weather! Thank you!', 'Tu sais quel temps il fait ! Merci !'));
    return steps;
  },
  memoryEvent: (c) => `weather:${c.place.weather}`,
};

// ---------------------------------------------------------------------------
// 1.5 / 2.2 — Que sais-tu faire ? (capacités réelles de l'espèce)
// ---------------------------------------------------------------------------

export const animalAbilities: ActivityDef = {
  id: 'animal_abilities',
  choices: (c) => [...c.species.can],
  build(c, _tier, choice) {
    const aw = ABILITY_WORDS[choice as keyof typeof ABILITY_WORDS];
    const cant = c.species.cannot[0];
    if (!aw || !cant) return undefined;
    const cw = ABILITY_WORDS[cant];
    const kidCant = choice === 'fly';
    return [
      act('actor', aw.act, `Look at me! I can ${aw.en}!`, `Regarde-moi ! Je sais ${aw.fr} !`, 'actor'),
      ask('actor', 'What can I do?', 'Qu’est-ce que je sais faire ?', [ok(`You can ${aw.en}!`, `Tu sais ${aw.fr} !`, aw.icon), no(`You can ${cw.en}!`, `Tu sais ${cw.fr} !`, cw.icon), no('You can drive a car!', 'Tu sais conduire une voiture !', '🚗'), no('You can ride a bike!', 'Tu sais faire du vélo !', '🚲')], [`Look! I can ${aw.en}!`, `Regarde ! Je sais ${aw.fr} !`], [choice, 'can'], { onCorrect: L(`Yes! I can ${aw.en}!`, `Oui ! Je sais ${aw.fr} !`) }),
      ask('actor', `Can I ${cw.en}?`, `Est-ce que je sais ${cw.fr} ?`, [ok("No, you can't!", 'Non, tu ne sais pas !', '👎'), no('Yes, you can!', 'Oui, tu sais !', '👍')], [`I can't ${cw.en}!`, `Je ne sais pas ${cw.fr} !`], ['cant', cant], { keepOrder: true, minTier: 'intermediate', onCorrect: L(`That's right! I can't ${cw.en}!`, `C'est ça ! Je ne sais pas ${cw.fr} !`) }),
      ask('actor', `And you? Can you ${aw.en}?`, `Et toi ? Tu sais ${aw.fr} ?`, kidCant ? [ok("No, I can't!", 'Non !', '🙅'), no('Yes, I can!', 'Oui !', '🙋')] : [ok('Yes, I can!', 'Oui, je sais !', '🙋'), ok("No, I can't.", 'Non.', '🙅')], kidCant ? ['Children have no wings!', "Les enfants n'ont pas d'ailes !"] : ['You can say: yes, I can!', 'Tu peux dire : yes, I can!'], ['can', 'cant'], { keepOrder: true, minTier: 'expert', onCorrect: kidCant ? L('Ha ha! Only birds can fly!', 'Ha ha ! Seuls les oiseaux savent voler !') : L(`Let's ${aw.en} together!`, `Allez, on va ${aw.fr} ensemble !`) }),
      act('actor', kidCant ? 'dance' : aw.act, kidCant ? "Let's dance instead! Ready? Go!" : 'Ready? Go!', kidCant ? 'Dansons plutôt ! Prête ? Partez !' : 'Prête ? Partez !', 'actor', { minTier: 'expert' }),
      end('actor', 'You are a super animal expert!', 'Tu es une super experte des animaux !'),
    ];
  },
};

// ---------------------------------------------------------------------------
// 1.4 / 3.4 — Grand ou petit ?
// ---------------------------------------------------------------------------

export const compareObjects: ActivityDef = {
  id: 'compare_objects',
  choices: (c) => (c.place.spots.length >= 2 ? COUNTABLES[c.place.continentId].filter((id) => PROPS[id]) : []),
  build(c, _tier, choice) {
    const p = PROPS[choice];
    if (!p) return undefined;
    const [s1, s2] = spotsFor(c.place, 2, 'cmp' + choice + c.place.id) as [number, number];
    return [
      props([prop('big', p.id, s1, undefined, 'big'), prop('small', p.id, s2, undefined, 'small')]),
      tapProps('actor', `Touch the big ${p.word}!`, `Touche ${p.wordFr} ${p.fem ? 'grande' : 'grand'} !`, ['big'], ['The big one!', 'Le grand !'], ['big', p.word], { onCorrect: L("Yes! It's big!", 'Oui ! Il est grand !'), wrong: { small: L('No, that one is small!', 'Non, celui-là est petit !') } }),
      tapProps('actor', `Now touch the small ${p.word}!`, `Maintenant, touche ${p.wordFr} ${p.fem ? 'petite' : 'petit'} !`, ['small'], ['The small one!', 'Le petit !'], ['small', p.word], { minTier: 'intermediate', onCorrect: L("Yes! It's small!", 'Oui ! Il est petit !'), wrong: { big: L('No, that one is big!', 'Non, celui-là est grand !') } }),
      ask('actor', 'Who is bigger: the dad or the baby?', 'Qui est le plus grand : le papa ou le bébé ?', [ok('The dad is bigger!', 'Le papa est plus grand !', '⬆️'), no('The baby is bigger!', 'Le bébé est plus grand !', '⬇️')], ['Look at the dad and the baby!', 'Regarde le papa et le bébé !'], ['bigger', 'big', 'small'], { keepOrder: true, minTier: 'expert', needs: 'baby', onCorrect: L('Yes! The baby is small… for now!', 'Oui ! Le bébé est petit… pour l’instant !') }),
      clearProps(),
      end('actor', 'Big and small! You are so smart!', 'Grand et petit ! Tu es trop maligne !'),
    ];
  },
};

// ---------------------------------------------------------------------------
// 3.1 — Que fait Papa ? (actions en cours)
// ---------------------------------------------------------------------------

const ACTION_KEYS = Object.keys(ACTION_WORDS);

function doingOptions(key: string, subject: Line): ResponseOption[] {
  const wrong = ACTION_KEYS.filter((k) => k !== key);
  const start = (key.length * 5) % wrong.length;
  const picks = [wrong[start]!, wrong[(start + 4) % wrong.length]!, wrong[(start + 7) % wrong.length]!];
  const opt = (k: string, correct: boolean): ResponseOption => ({ line: L(`${subject.en}'s ${ACTION_WORDS[k]!.ing}!`, `${subject.fr} ${ACTION_WORDS[k]!.ingFr} !`), icon: ACTION_WORDS[k]!.icon, correct });
  return [opt(key, true), ...picks.map((k) => opt(k, false))];
}

export const describeActions: ActivityDef = {
  id: 'describe_actions',
  choices: (c) => [...c.species.can, 'sleep', 'eat', 'dance', 'wave'],
  build(c, _tier, choice) {
    const fa = ACTION_WORDS[choice];
    if (!fa) return undefined;
    const pool = [...c.species.can, 'sleep', 'eat', 'dance', 'wave'].filter((k) => k !== choice);
    const mk = pickStable(pool, choice);
    const bk = pickStable(pool.filter((k) => k !== mk), choice, 1);
    const ma = ACTION_WORDS[mk]!;
    const ba = ACTION_WORDS[bk]!;
    const sex = babySex(c);
    const babySubject = sex ? heShe(sex) : L('He', 'Il');
    return [
      act('father', fa.act, 'Look at me!', 'Regarde-moi !', 'father'),
      ask('mother', 'What is Dad doing?', 'Que fait Papa ?', doingOptions(choice, L('He', 'Il')), [`Look at Dad! He's ${fa.ing}!`, `Regarde Papa ! Il ${fa.ingFr} !`], [choice, 'doing', 'dad'], { onCorrect: L(`Yes! He's ${fa.ing}!`, `Oui ! Il ${fa.ingFr} !`) }),
      act('mother', ma.act, 'Now look at me!', 'Maintenant, regarde-moi !', 'mother', { minTier: 'intermediate' }),
      ask('father', 'What is Mum doing?', 'Que fait Maman ?', doingOptions(mk, L('She', 'Elle')), [`Look at Mum! She's ${ma.ing}!`, `Regarde Maman ! Elle ${ma.ingFr} !`], [mk, 'doing', 'mum'], { minTier: 'intermediate', onCorrect: L(`Yes! She's ${ma.ing}!`, `Oui ! Elle ${ma.ingFr} !`) }),
      act('baby', ba.act, 'Look at me too!', 'Regarde-moi aussi !', 'baby', { minTier: 'expert', needs: 'baby' }),
      ask('mother', 'And what is our baby doing?', 'Et que fait notre bébé ?', doingOptions(bk, babySubject), [`Look at our baby! ${babySubject.en}'s ${ba.ing}!`, `Regarde notre bébé ! ${babySubject.fr} ${ba.ingFr} !`], [bk, 'doing', 'baby'], { minTier: 'expert', needs: 'baby', onCorrect: L(`Yes! ${babySubject.en}'s ${ba.ing}!`, `Oui ! ${babySubject.fr} ${ba.ingFr} !`) }),
      end('father', 'You see everything! Well done!', 'Tu vois tout ! Bravo !'),
    ];
  },
};
