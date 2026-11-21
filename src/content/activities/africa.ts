/**
 * Pilote Afrique (2026-11-19) : jeux propres à chaque décor, et jeux partagés par toute
 * l'Afrique (ordres, coucher, émotions, photo). Demande du parent : « vraiment différents
 * types de jeux et d'animation en fonction des 5 décors pour que ce ne soit pas répétitif ».
 *
 * Les lieux autorisés et les personnages qui proposent chaque jeu (papa, maman, bébés) sont
 * décrits dans content/archetypes.ts ; ici, seulement le contenu, en fonctions pures.
 */
import { NOUNS } from '../places';
import { NUMBERS, PROPS } from '../props';
import type { ActivityCtx, ActivityDef, CommandOption, Line, QuestStep, ResponseOption, Speaker, Tier } from '../types';
import { babySex } from './games';
import { numberId, numberOptions } from './games';
import {
  act,
  anchor,
  ask,
  back,
  canDo,
  clearProps,
  command,
  end,
  L,
  moveTo,
  nameable,
  no,
  ok,
  prop,
  props,
  say,
  scene,
  skyProp,
  tap,
  tapProps,
  waterPlaces,
} from './kit';

const byTier = <T>(tier: Tier, b: T, i: T, e: T): T => (tier === 'beginner' ? b : tier === 'intermediate' ? i : e);

// ---------------------------------------------------------------------------
// Point d'eau — « Qui vit dans l'eau ? » (canard, grenouille, poisson ; jeu d'écoute)
// ---------------------------------------------------------------------------

/** Emplacements au bord de l'eau, par lieu. */
const WATER_SPOTS: Readonly<Record<string, readonly [number, number, number]>> = {
  africa_waterhole: [2, 4, 5],
  savanna: [2, 5, 3],
};

const WATER_ANIMALS = {
  duck: { prop: 'duck', sound: L('Quack, quack!', 'Coin-coin !'), sayWord: 'quack', icon: '🦆' },
  frog: { prop: 'frog', sound: L('Ribbit, ribbit!', 'Croâ, croâ !'), sayWord: 'ribbit', icon: '🐸' },
} as const;

export const whoInWater: ActivityDef = {
  id: 'who_in_water',
  choices: (c) => (WATER_SPOTS[c.place.id] && waterPlaces(c.place).length ? Object.keys(WATER_ANIMALS) : []),
  build(c, tier, choice) {
    const t = WATER_ANIMALS[choice as keyof typeof WATER_ANIMALS];
    const spots = WATER_SPOTS[c.place.id];
    if (!t || !spots) return undefined;
    const other = choice === 'duck' ? WATER_ANIMALS.frog : WATER_ANIMALS.duck;
    const p = PROPS[t.prop]!;
    const o = PROPS[other.prop]!;
    const fish = PROPS.koi!;
    const sound = (x: typeof t) => (x.prop === 'duck' ? 'quack' : 'ribbit');
    return [
      props([prop('w_t', p.id, spots[0]), prop('w_o', o.id, spots[1])], { maxTier: 'beginner' }),
      props([prop('w_t', p.id, spots[0]), prop('w_o', o.id, spots[1]), prop('w_f', fish.id, spots[2])], { minTier: 'intermediate' }),
      say('actor', 'Look at the water! Who lives in the water?', "Regarde l'eau ! Qui vit dans l'eau ?", {}, 'curious'),
      tapProps('actor', `Touch the ${p.word}!`, `Touche ${p.wordFr} !`, ['w_t'], L(`Find the ${p.word}!`, `Cherche ${p.wordFr} !`), [p.word, 'water'], {
        onCorrect: L(`Yes! ${p.noun.en}! ${t.sound.en}`, `Oui ! ${p.noun.fr} ! ${t.sound.fr}`),
        wrong: {
          w_o: L(`No, that's a ${o.word}! ${other.sound.en}`, `Non, ça, c'est ${o.noun.fr.toLowerCase()} ! ${other.sound.fr}`),
          ...(tier === 'beginner' ? {} : { w_f: L("No, that's a fish! Blub, blub!", "Non, ça, c'est un poisson ! Blub, blub !") }),
        },
      }),
      ask(
        'actor',
        `Listen! ${other.sound.en} Who says ${sound(other)}?`,
        `Écoute ! ${other.sound.fr} Qui fait ce bruit ?`,
        [ok(`The ${o.word}!`, `${o.noun.fr} !`, other.icon), no(`The ${p.word}!`, `${p.noun.fr} !`, t.icon), no('The fish!', 'Le poisson !', '🐟')],
        [`Listen again! ${other.sound.en}`, `Écoute encore ! ${other.sound.fr}`],
        [o.word, sound(other)],
        { minTier: 'intermediate', listen: true, onCorrect: L(`Yes! The ${o.word} says ${sound(other)}!`, `Oui ! ${o.noun.fr} fait ce bruit !`) },
      ),
      ask(
        'actor',
        'Can a fish walk?',
        'Est-ce qu’un poisson sait marcher ?',
        [ok("No, it can't! It swims!", 'Non ! Il nage !', '🏊'), no('Yes, it can!', 'Oui !', '🚶')],
        ['A fish lives in the water. It swims!', "Un poisson vit dans l'eau. Il nage !"],
        ['fish', 'swim', 'cant'],
        { minTier: 'expert', keepOrder: true, onCorrect: L('Yes! A fish swims in the water!', "Oui ! Un poisson nage dans l'eau !") },
      ),
      act('actor', 'splash', 'Splash! I love the water!', "Splash ! J'adore l'eau !", 'actor'),
      clearProps(),
      end('actor', 'Bye, little friends! See you soon!', 'Au revoir, petits amis ! À bientôt !'),
    ];
  },
  memoryEvent: (_c, choice) => `met:${choice}`,
};

// ---------------------------------------------------------------------------
// Baobab — le nid de l'oiseau (compter les œufs, chut !)
// ---------------------------------------------------------------------------

export const baobabNest: ActivityDef = {
  id: 'baobab_nest',
  choices: (c) => (anchor(c.place, 'baobab') && c.place.spots.length >= 8 ? ['nest'] : []),
  build(_c, tier) {
    const n = byTier(tier, 2, 3, 4);
    const eggSpots = [4, 6, 3, 1].slice(0, n);
    const eggs = eggSpots.map((s, i) => prop(`egg${i}`, 'egg', s));
    return [
      tap('actor', 'Look! A big, big tree! It’s a baobab! Touch the baobab!', 'Regarde ! Un très grand arbre ! C’est un baobab ! Touche le baobab !', 'baobab', ['The very big tree!', 'Le très grand arbre !'], ['baobab', 'tree'], { onCorrect: ['Yes! The baobab is very big!', 'Oui ! Le baobab est très grand !'] }),
      props([prop('bird', 'bird', 7), prop('nest', 'nest', 5), ...eggs]),
      say('actor', 'Look! A bird lives here! And a nest!', 'Regarde ! Un oiseau vit ici ! Et un nid !', {}, 'happy'),
      tapProps('actor', 'Touch the bird!', "Touche l'oiseau !", ['bird'], ['Find the bird! Tweet, tweet!', "Cherche l'oiseau ! Cui-cui !"], ['bird', 'tweet'], {
        onCorrect: ['Tweet, tweet! Hello, bird!', 'Cui-cui ! Bonjour, l’oiseau !'],
        wrong: { nest: L("That's the nest!", "Ça, c'est le nid !"), egg0: L("That's an egg!", "Ça, c'est un œuf !") },
      }),
      tapProps('actor', "Let's count the eggs! Touch the eggs!", 'Comptons les œufs ! Touche les œufs !', eggs.map((e) => e.id), ['Touch every egg!', 'Touche chaque œuf !'], ['egg', 'count'], {
        count: true,
        onCorrect: L(`${NUMBERS[n]!.en} eggs!`, `${NUMBERS[n]!.fr} œufs !`),
        wrong: { nest: L("That's the nest! Count the eggs!", "Ça, c'est le nid ! Compte les œufs !") },
      }),
      ask('actor', 'How many eggs?', "Combien d'œufs ?", numberOptions(n), ['Count again!', 'Recompte !'], [numberId(n), 'how_many'], { minTier: 'intermediate', onCorrect: L(`Yes! ${NUMBERS[n]!.en} eggs!`, `Oui ! ${NUMBERS[n]!.fr} œufs !`) }),
      say('actor', 'Shh! The eggs are sleeping. Let’s be quiet!', 'Chut ! Les œufs dorment. Soyons sages !', {}, 'calm'),
      ask('actor', 'What do we say?', 'Que dit-on ?', [ok('Shh!', 'Chut !', '🤫'), no('Roar!', 'Rooar !', '📢')], ['Be very quiet!', 'Tout doucement !'], ['shh'], { minTier: 'intermediate', keepOrder: true, onCorrect: ['Shh… Thank you!', 'Chut… Merci !'] }),
      clearProps(),
      end('actor', 'Bye, bird! Bye, little eggs!', 'Au revoir, l’oiseau ! Au revoir, petits œufs !'),
    ];
  },
  memoryEvent: () => 'saw_nest',
};

// ---------------------------------------------------------------------------
// Désert et savane chaude — « Trop chaud ! » (chaud / froid, habits, ombre)
// ---------------------------------------------------------------------------

export const sunAndShade: ActivityDef = {
  id: 'sun_and_shade',
  choices: (c) => (c.place.weather === 'hot' && c.place.spots.length >= 4 ? c.place.anchors.filter((a) => a.stand && (a.word === 'tree' || a.word === 'bush')).map((a) => a.id) : []),
  build(c, _tier, choice) {
    const a = anchor(c.place, choice);
    if (!a) return undefined;
    const hat = PROPS.hat!;
    const glasses = PROPS.sunglasses!;
    const sp = [0, 2, 5, 7];
    const tooHot = (en: string, fr: string) => L(`${en}? No! It's too hot!`, `${fr} ? Non ! Il fait trop chaud !`);
    return [
      say('actor', 'Phew! The sun is very hot today!', 'Pfiou ! Le soleil est très chaud aujourd’hui !', {}, 'thirsty'),
      ask('actor', 'Is it hot or cold?', 'Il fait chaud ou froid ?', [ok("It's hot!", 'Il fait chaud !', '🥵'), no("It's cold!", 'Il fait froid !', '🥶')], ['Look at the big sun!', 'Regarde le gros soleil !'], ['hot', 'cold'], { keepOrder: true, onCorrect: ["Yes! It's hot! Very hot!", 'Oui ! Il fait chaud ! Très chaud !'] }),
      props([prop('hat', 'hat', sp[0]!), prop('coat', 'coat', sp[1]!)], { maxTier: 'beginner' }),
      props([prop('hat', 'hat', sp[0]!), prop('coat', 'coat', sp[1]!), prop('glasses', 'sunglasses', sp[2]!), prop('gloves', 'gloves', sp[3]!)], { minTier: 'intermediate' }),
      tapProps('actor', `I need ${hat.need!.en}! Touch the hat!`, 'J’ai besoin d’un chapeau ! Touche le chapeau !', ['hat'], ['A hat for the sun!', 'Un chapeau pour le soleil !'], ['hat', 'wear'], {
        maxTier: 'beginner',
        wear: 'actor',
        onCorrect: ['Thank you! I like my hat!', "Merci ! J'aime mon chapeau !"],
        wrong: { coat: tooHot('A coat', 'Un manteau') },
      }),
      tapProps('actor', 'What do I wear in the sun? Touch two things!', 'Qu’est-ce que je porte au soleil ? Touche deux choses !', ['hat', 'glasses'], ['Think about the hot sun!', 'Pense au soleil qui chauffe !'], ['hat', glasses.word, 'wear'], {
        minTier: 'intermediate',
        wear: 'actor',
        onCorrect: ['Thank you! A hat and sunglasses! Cool!', 'Merci ! Un chapeau et des lunettes de soleil ! Trop bien !'],
        wrong: { coat: tooHot('A coat', 'Un manteau'), gloves: tooHot('Gloves', 'Des gants') },
      }),
      clearProps(),
      tap('actor', `Let's find some shade! Touch the ${a.word}!`, `Cherchons de l'ombre ! Touche ${a.wordFr} !`, a.id, [`The shade is under the ${a.word}!`, `L'ombre est sous ${a.wordFr} !`], ['shade', a.word], { onCorrect: [`Yes! Shade under the ${a.word}!`, `Oui ! De l'ombre sous ${a.wordFr} !`] }),
      moveTo(a.id, 'rest'),
      say('actor', 'Ahh! The shade is nice and cool!', "Ahh ! L'ombre, c'est bien frais !", {}, 'calm'),
      ask('actor', 'In the shade, am I hot or cool?', "À l'ombre, j'ai chaud ou je suis au frais ?", [ok("You're cool!", 'Tu es au frais !', '😌'), no("You're hot!", 'Tu as chaud !', '🥵')], ['The shade is cool!', "L'ombre est fraîche !"], ['shade', 'cold'], { minTier: 'expert', keepOrder: true, onCorrect: ['Yes! Nice and cool!', 'Oui ! Bien au frais !'] }),
      back(),
      end('actor', "Thank you! Now I'm not too hot!", "Merci ! Maintenant, je n'ai plus trop chaud !"),
    ];
  },
  memoryEvent: () => 'found_shade',
};

// ---------------------------------------------------------------------------
// Canyon — l'écho
// ---------------------------------------------------------------------------

export const echoCanyon: ActivityDef = {
  id: 'echo_canyon',
  choices: (c) => (anchor(c.place, 'canyon') ? ['hello'] : []),
  build(c) {
    const path = c.place.anchors.find((a) => a.tags?.includes('path') && a.stand);
    return [
      ask('actor', 'Look at the canyon! Is it big or small?', 'Regarde le canyon ! Il est grand ou petit ?', [ok("It's big!", 'Il est grand !', '⬆️'), no("It's small!", 'Il est petit !', '⬇️')], ['Look! It’s very, very big!', 'Regarde ! Il est très, très grand !'], ['canyon', 'big'], { pointAt: 'canyon', keepOrder: true, onCorrect: ["Yes! It's very big!", 'Oui ! Il est très grand !'] }),
      say('actor', "Listen! Let's shout: Hello!", 'Écoute ! Crions : Hello !', {}, 'happy'),
      say('narrator', 'Hello… hello… hello…', 'Hello… hello… hello…'),
      ask('actor', 'Listen! What is it?', "Écoute ! Qu'est-ce que c'est ?", [ok('An echo!', 'Un écho !', '🗣️'), no('A bird!', 'Un oiseau !', '🐦'), no('A frog!', 'Une grenouille !', '🐸')], ['The canyon says it again! It’s an echo!', "Le canyon le répète ! C'est un écho !"], ['echo'], { minTier: 'intermediate', onCorrect: ["Yes! It's an echo!", "Oui ! C'est un écho !"] }),
      say('actor', 'Now you! Say: thank you!', 'À toi ! Dis : thank you !', { minTier: 'intermediate' }),
      say('narrator', 'Thank you… thank you… thank you…', 'Thank you… thank you… thank you…', { minTier: 'intermediate' }),
      ...(path
        ? [
            tap('actor', "Let's walk down the path! Touch the path!", 'Descendons le chemin ! Touche le chemin !', path.id, ['Find the path!', 'Cherche le chemin !'], ['path', 'down'], { minTier: 'expert', onCorrect: ["Let's go down!", 'On descend !'] }),
            moveTo(path.id, 'walk', undefined, { minTier: 'expert' }),
            back(undefined, { minTier: 'expert' }),
          ]
        : []),
      end('actor', 'Bye, canyon! Bye… bye… bye…', 'Au revoir, canyon ! Au revoir… revoir… revoir…'),
    ];
  },
  memoryEvent: () => 'heard_echo',
};

// ---------------------------------------------------------------------------
// Canyon et désert — en haut, en bas (grimper sur le rocher)
// ---------------------------------------------------------------------------

export const climbRock: ActivityDef = {
  id: 'climb_rock',
  choices: (c) => (canDo(c.species, 'climb') ? c.place.anchors.filter((a) => a.word === 'rock' && a.tags?.includes('climb')).map((a) => a.id) : []),
  build(c, _tier, choice) {
    if (!anchor(c.place, choice)) return undefined;
    const jumps = canDo(c.species, 'jump');
    return [
      tap('actor', "Let's go up the big rock! Touch the rock!", 'Montons sur le gros rocher ! Touche le rocher !', choice, ['Find the big rock!', 'Cherche le gros rocher !'], ['rock', 'up'], { onCorrect: ["Let's go up!", 'On monte !'] }),
      act('actor', 'climb', "Up, up, up! I'm at the top!", 'Monte, monte, monte ! Je suis tout en haut !', 'actor'),
      ask('actor', 'Am I up or down?', 'Je suis en haut ou en bas ?', [ok("You're up!", 'Tu es en haut !', '⬆️'), no("You're down!", 'Tu es en bas !', '⬇️')], ["I'm at the top!", 'Je suis tout en haut !'], ['up', 'top'], { keepOrder: true, onCorrect: ["Yes! I'm up! I can see everything!", 'Oui ! Je suis en haut ! Je vois tout !'] }),
      jumps
        ? act('actor', 'jump', 'Now I jump down! Wheee!', 'Maintenant, je saute en bas ! Youpi !', 'actor', { minTier: 'intermediate' })
        : act('actor', 'run', 'Now I go down! Down, down, down!', 'Maintenant, je descends ! Descends, descends !', 'actor', { minTier: 'intermediate' }),
      ask('actor', 'And now? Am I up or down?', 'Et maintenant ? En haut ou en bas ?', [no("You're up!", 'Tu es en haut !', '⬆️'), ok("You're down!", 'Tu es en bas !', '⬇️')], ["I'm down now!", 'Je suis en bas maintenant !'], ['down'], { minTier: 'intermediate', keepOrder: true, onCorrect: ["Yes! I'm down!", 'Oui ! Je suis en bas !'] }),
      ask('actor', 'Is the rock big or small?', 'Le rocher est grand ou petit ?', [ok("It's big!", 'Il est grand !', '⬆️'), no("It's small!", 'Il est petit !', '⬇️')], ['A big, big rock!', 'Un très gros rocher !'], ['big', 'rock'], { minTier: 'expert', keepOrder: true, pointAt: choice, onCorrect: ['Yes! A big rock!', 'Oui ! Un gros rocher !'] }),
      end('actor', 'Up and down! What fun!', 'En haut, en bas ! Trop drôle !'),
    ];
  },
};

// ---------------------------------------------------------------------------
// Plaines et savane — suivre les empreintes (dans l'ordre), puis le zèbre
// ---------------------------------------------------------------------------

/** Piste d'empreintes de gauche à droite, et place du zèbre au bout. */
const TRAILS: Readonly<Record<string, { prints: readonly number[]; zebra: number }>> = {
  africa_plains: { prints: [0, 1, 2, 3, 4], zebra: 7 },
  savanna: { prints: [0, 1, 2, 3, 4], zebra: 6 },
};

export const followTracks: ActivityDef = {
  id: 'follow_tracks',
  choices: (c) => (TRAILS[c.place.id] ? ['zebra'] : []),
  build(c, tier) {
    const trail = TRAILS[c.place.id];
    if (!trail) return undefined;
    const n = byTier(tier, 3, 4, 5);
    const prints = trail.prints.slice(0, n).map((s, i) => prop(`fp${i}`, 'footprint', s));
    const ids = prints.map((p) => p.id);
    const found = L('We followed the footprints!', 'On a suivi les empreintes !');
    return [
      props(prints),
      say('actor', 'Look! Footprints! Who made them? Let’s follow the footprints!', 'Regarde ! Des empreintes ! Qui les a faites ? Suivons les empreintes !', {}, 'curious'),
      tapProps('actor', 'Touch the footprints!', 'Touche les empreintes !', ids, ['Touch every footprint!', 'Touche chaque empreinte !'], ['footprints', 'count'], { maxTier: 'beginner', count: true, onCorrect: found }),
      tapProps('actor', 'Follow the footprints one by one!', 'Suis les empreintes une par une !', ids, ['Start on the left! One by one!', 'Commence à gauche ! Une par une !'], ['footprints', 'first'], { minTier: 'intermediate', ordered: true, count: true, onCorrect: found }),
      props([...prints, prop('zebra', 'zebra', trail.zebra)]),
      say('actor', 'Oh! Look! Who is it?', "Oh ! Regarde ! Qui est-ce ?", {}, 'curious'),
      ask('actor', 'Who made the footprints?', 'Qui a fait les empreintes ?', [ok('A zebra!', 'Un zèbre !', '🦓'), no('A duck!', 'Un canard !', '🦆'), no('A frog!', 'Une grenouille !', '🐸'), no('A bird!', 'Un oiseau !', '🐦')], ['Look at the end of the trail!', 'Regarde au bout de la piste !'], ['zebra', 'footprints'], { onCorrect: ['Yes! A zebra! Hello, zebra!', 'Oui ! Un zèbre ! Bonjour, le zèbre !'] }),
      ask('actor', 'How many legs does a zebra have?', 'Combien de pattes a un zèbre ?', numberOptions(4), ['Count the legs: one, two, three…', 'Compte les pattes : one, two, three…'], [numberId(4), 'how_many'], { minTier: 'expert', onCorrect: ['Yes! Four legs!', 'Oui ! Quatre pattes !'] }),
      clearProps(),
      end('actor', 'We found the zebra! You are a great explorer!', 'On a trouvé le zèbre ! Tu es une super exploratrice !'),
    ];
  },
  memoryEvent: () => 'met:zebra',
};

// ---------------------------------------------------------------------------
// Plaines et savane — la course (vite / lentement)
// ---------------------------------------------------------------------------

export const race: ActivityDef = {
  id: 'race',
  choices: (c) => (canDo(c.species, 'run') && c.place.anchors.some((a) => a.tags?.includes('path') && a.stand) ? ['race'] : []),
  build(c) {
    const path = c.place.anchors.find((a) => a.tags?.includes('path') && a.stand)!;
    return [
      say('actor', "Let's have a race! Ready, steady, go!", 'Faisons la course ! À vos marques, prêts, partez !', {}, 'happy'),
      act('actor', 'run', "Zoom! I'm running fast!", 'Zoum ! Je cours vite !', 'actor'),
      ask('actor', 'Am I fast or slow?', 'Je vais vite ou lentement ?', [ok("You're fast!", 'Tu vas vite !', '⚡'), no("You're slow!", 'Tu vas lentement !', '🐢')], ['Zoom! I run fast!', 'Zoum ! Je cours vite !'], ['fast', 'run'], { keepOrder: true, onCorrect: ["Yes! I'm fast!", 'Oui ! Je vais vite !'] }),
      moveTo(path.id, 'walk', undefined, { minTier: 'intermediate' }),
      say('actor', "Now I'm walking. Slow… slow… slow…", 'Maintenant, je marche. Lentement… lentement…', { minTier: 'intermediate' }, 'calm'),
      ask('actor', 'Am I fast or slow now?', 'Et maintenant, vite ou lentement ?', [no("You're fast!", 'Tu vas vite !', '⚡'), ok("You're slow!", 'Tu vas lentement !', '🐢')], ["I'm walking slowly!", 'Je marche lentement !'], ['slow'], { minTier: 'intermediate', keepOrder: true, onCorrect: ["Yes! I'm slow, like a snail!", 'Oui ! Je suis lent, comme un escargot !'] }),
      back(undefined, { minTier: 'intermediate' }),
      ask('actor', 'Who is slow?', 'Qui est lent ?', [ok('A snail!', 'Un escargot !', '🐌'), no('A zebra!', 'Un zèbre !', '🦓'), no('A horse!', 'Un cheval !', '🐎')], ['A snail is very, very slow!', 'Un escargot est très, très lent !'], ['slow'], { minTier: 'expert', onCorrect: ['Yes! A snail is slow!', 'Oui ! Un escargot est lent !'] }),
      act('baby', 'run', "Me too! I'm fast!", 'Moi aussi ! Je vais vite !', 'baby', { needs: 'baby' }),
      end('actor', 'Phew! What a race! Well done!', 'Pfiou ! Quelle course ! Bravo !'),
    ];
  },
};

// ---------------------------------------------------------------------------
// Toute l'Afrique — « Tu es le chef ! » (la joueuse donne des ordres à Papa)
// ---------------------------------------------------------------------------

export const ORDERS = {
  jump: { line: L('Jump!', 'Saute !'), icon: '🦘', reply: L("Boing! I'm jumping!", 'Boing ! Je saute !'), action: 'jump' },
  run: { line: L('Run!', 'Cours !'), icon: '🏃', reply: L("Zoom! I'm running!", 'Zoum ! Je cours !'), action: 'run' },
  roar: { line: L('Roar!', 'Rugis !'), icon: '📢', reply: L("ROAR! I'm roaring!", 'ROAAR ! Je rugis !'), action: 'roar' },
  swim: { line: L('Swim!', 'Nage !'), icon: '🏊', reply: L("Splash! I'm swimming!", 'Splash ! Je nage !'), action: 'swim' },
  splash: { line: L('Splash!', 'Éclabousse !'), icon: '💦', reply: L("Splish, splash! I'm splashing!", "Plouf, plouf ! J'éclabousse !"), action: 'splash' },
  dance: { line: L('Dance!', 'Danse !'), icon: '💃', reply: L("La, la, la! I'm dancing!", 'La, la, la ! Je danse !'), action: 'dance' },
  wave: { line: L('Wave!', 'Fais coucou !'), icon: '👋', reply: L("Hello! I'm waving!", 'Coucou ! Je fais coucou !'), action: 'wave' },
  sleep: { line: L('Sleep!', 'Dors !'), icon: '😴', reply: L("Zzz… I'm sleeping!", 'Zzz… Je dors !'), action: 'sleep' },
} as const satisfies Record<string, CommandOption>;

const FLY: CommandOption = { line: L('Fly!', 'Vole !'), icon: '🪽', reply: L("Fly? Ha, ha! I can't fly! I'm not a bird!", "Voler ? Ha, ha ! Je ne sais pas voler ! Je ne suis pas un oiseau !") };

/** Ordres possibles ici : ce que l'espèce sait faire, et l'eau seulement s'il y en a. */
export function ordersFor(c: ActivityCtx): (keyof typeof ORDERS)[] {
  const out: (keyof typeof ORDERS)[] = [];
  if (canDo(c.species, 'jump')) out.push('jump');
  if (canDo(c.species, 'run')) out.push('run');
  if (canDo(c.species, 'roar')) out.push('roar');
  if (waterPlaces(c.place).length) out.push(canDo(c.species, 'swim') ? 'swim' : 'splash');
  out.push('dance', 'wave', 'sleep');
  return out;
}

export const simonSays: ActivityDef = {
  id: 'simon_says',
  choices: () => ['boss'],
  build(c, tier) {
    const keys = ordersFor(c);
    const need = byTier(tier, 2, 3, 4);
    const cards = keys.slice(0, need + 1).map((k): CommandOption => ORDERS[k]);
    const flies = c.species.can.includes('fly');
    const options = flies ? cards : [...cards.slice(0, 2), FLY, ...cards.slice(2)];
    const babyCards = (['dance', 'wave', 'sleep'] as const).map((k): CommandOption => ({ ...ORDERS[k], who: 'baby' }));
    const items: string[] = keys.slice(0, need + 1);
    return [
      say('actor', "Let's play! You are the boss! Tell me what to do!", 'On joue ! Tu es le chef ! Dis-moi quoi faire !', {}, 'happy'),
      command('actor', 'Touch a card! What do I do?', 'Touche une carte ! Qu’est-ce que je fais ?', options, need, items, { onCorrect: ['Ha, ha! You are a great boss!', 'Ha, ha ! Tu es une super cheffe !'] }),
      command('baby', 'My turn! Tell me what to do!', 'À moi ! Dis-moi quoi faire !', babyCards, 2, ['dance', 'wave', 'sleep'], { minTier: 'expert', needs: 'baby', onCorrect: ['That was fun!', 'Trop drôle !'] }),
      end('actor', 'Phew! I’m tired now! Thank you, boss!', 'Pfiou ! Je suis fatigué maintenant ! Merci, cheffe !'),
    ];
  },
};

// ---------------------------------------------------------------------------
// Toute l'Afrique — « Bonne nuit ! » (la nuit tombe, étoiles et lune)
// ---------------------------------------------------------------------------

export const bedtime: ActivityDef = {
  id: 'bedtime',
  choices: () => ['night'],
  build(_c, tier) {
    const n = byTier(tier, 3, 4, 5);
    const starSpots = [0, 2, 3, 5, 7].slice(0, n);
    const stars = starSpots.map((s, i) => skyProp(`star${i}`, 'star', s));
    const moon = skyProp('moon', 'moon', 6);
    const steps: QuestStep[] = [
      say('actor', 'The day is over. It’s time for bed!', "La journée est finie. C'est l'heure d'aller au lit !", {}, 'calm'),
      scene(true),
      props([...stars, moon]),
      ask('actor', 'Look at the sky! Is it day or night?', 'Regarde le ciel ! Il fait jour ou nuit ?', [ok("It's night!", 'Il fait nuit !', '🌙'), no("It's day!", 'Il fait jour !', '🌞')], ['Look! The sky is dark!', 'Regarde ! Le ciel est tout noir !'], ['night', 'day'], { keepOrder: true, onCorrect: ["Yes! It's night!", 'Oui ! Il fait nuit !'] }),
      tapProps('actor', "Let's count the stars! Touch the stars!", 'Comptons les étoiles ! Touche les étoiles !', stars.map((s) => s.id), ['Touch every star!', 'Touche chaque étoile !'], ['stars', 'count'], {
        count: true,
        onCorrect: L(`${NUMBERS[n]!.en} stars!`, `${NUMBERS[n]!.fr} étoiles !`),
        wrong: { moon: L("That's the moon! Count the stars!", "Ça, c'est la lune ! Compte les étoiles !") },
      }),
      ask('actor', 'How many stars?', "Combien d'étoiles ?", numberOptions(n), ['Count again!', 'Recompte !'], [numberId(n), 'how_many'], { minTier: 'intermediate', onCorrect: L(`Yes! ${NUMBERS[n]!.en} stars!`, `Oui ! ${NUMBERS[n]!.fr} étoiles !`) }),
      tapProps('actor', 'Where is the moon? Touch the moon!', 'Où est la lune ? Touche la lune !', ['moon'], ['The moon is big and round!', 'La lune est grande et ronde !'], ['moon', 'night'], { onCorrect: ['Yes! Hello, moon!', 'Oui ! Bonjour, la lune !'], wrong: { star0: L("That's a star!", "Ça, c'est une étoile !") } }),
      act('baby', 'sleep', "Yawn… I'm tired…", 'Aaah… Je suis fatigué…', 'baby', { needs: 'baby' }),
      ask('actor', 'What do we say at bedtime?', 'Que dit-on pour aller dormir ?', [ok('Good night!', 'Bonne nuit !', '🌙'), no('Good morning!', 'Bonjour !', '☀️')], ['We say: good night!', 'On dit : good night !'], ['good_night'], { minTier: 'intermediate', keepOrder: true, onCorrect: ['Good night! Sweet dreams!', 'Bonne nuit ! Fais de beaux rêves !'] }),
      act('actor', 'sleep', 'Good night! Zzz…', 'Bonne nuit ! Zzz…', 'actor'),
      clearProps(),
      scene(false),
      end('actor', 'Good morning! The sun is up! What a lovely night!', 'Bonjour ! Le soleil est levé ! Quelle belle nuit !'),
    ];
    return steps;
  },
  memoryEvent: () => 'slept_under_stars',
};

// ---------------------------------------------------------------------------
// Toute l'Afrique — « Comment je me sens ? » (content, fatigué, faim, triste)
// ---------------------------------------------------------------------------

const FEELINGS = {
  happy: { icon: '😊', show: (who: Speaker) => act(who, 'dance', 'Yippee! La, la, la!', 'Youpi ! La, la, la !', who), answer: L("You're happy!", 'Tu es content !'), after: L("Yes! I'm happy!", 'Oui ! Je suis content !') },
  tired: { icon: '🥱', show: (who: Speaker) => act(who, 'sleep', 'Yawn… Zzz…', 'Aaah… Zzz…', who), answer: L("You're tired!", 'Tu es fatigué !'), after: L("Yes! I'm tired! I need a nap!", "Oui ! Je suis fatigué ! J'ai besoin d'une sieste !") },
  hungry: { icon: '😋', show: (who: Speaker) => say(who, 'Grrr… My tummy says grrr! I want food!', 'Grrr… Mon ventre gargouille ! Je veux manger !', {}, 'curious'), answer: L("You're hungry!", 'Tu as faim !'), after: L("Yes! I'm hungry! Yum, yum!", "Oui ! J'ai faim ! Miam, miam !") },
  sad: { icon: '😢', show: (who: Speaker) => say(who, 'Oh no… Boo hoo… I lost my flower…', "Oh non… Bouh hou… J'ai perdu ma fleur…", {}, 'calm'), answer: L("You're sad!", 'Tu es triste !'), after: L("Yes, I'm sad… Can you give me a hug?", "Oui, je suis triste… Tu me fais un câlin ?") },
} as const;

export const feelings: ActivityDef = {
  id: 'feelings',
  choices: () => Object.keys(FEELINGS),
  build(_c, _tier, choice) {
    const f = FEELINGS[choice as keyof typeof FEELINGS];
    if (!f) return undefined;
    const keys = Object.keys(FEELINGS) as (keyof typeof FEELINGS)[];
    const options: ResponseOption[] = [{ line: f.answer, icon: f.icon, correct: true }, ...keys.filter((k) => k !== choice).map((k): ResponseOption => ({ line: FEELINGS[k].answer, icon: FEELINGS[k].icon, correct: false }))];
    const steps: QuestStep[] = [
      say('actor', 'Look at me! Guess how I feel!', 'Regarde-moi ! Devine comment je me sens !', {}, 'curious'),
      f.show('actor'),
      ask('actor', 'How do I feel?', 'Comment je me sens ?', options, ['Look at my face!', 'Regarde ma tête !'], [choice], { onCorrect: f.after }),
    ];
    if (choice === 'sad') {
      steps.push(
        ask('actor', 'A hug?', 'Un câlin ?', [ok("Here's a big hug!", 'Voilà un gros câlin !', '🤗'), ok("Here's a flower!", 'Voilà une fleur !', '🌼')], ['You can give me a hug!', 'Tu peux me faire un câlin !'], ['happy'], { keepOrder: true, onCorrect: ["Thank you! Now I'm happy!", 'Merci ! Maintenant, je suis content !'] }),
      );
    }
    steps.push(
      ask('actor', 'And you? How do you feel today?', "Et toi ? Comment tu te sens aujourd'hui ?", keys.slice(0, 3).map((k): ResponseOption => ({ line: L(`I'm ${k}!`, FEELINGS[k].answer.fr.replace(/^Tu es/, 'Je suis').replace(/^Tu as/, "J'ai")), icon: FEELINGS[k].icon, correct: true })), ['Choose how you feel!', 'Choisis comment tu te sens !'], ['how_are_you'], { minTier: 'intermediate', keepOrder: true, onCorrect: ['Thank you for telling me!', 'Merci de me le dire !'] }),
      end('actor', 'I love playing with you!', "J'adore jouer avec toi !"),
    );
    return steps;
  },
};

// ---------------------------------------------------------------------------
// Toute l'Afrique — la photo (les mots propres au décor, rangés dans l'album)
// ---------------------------------------------------------------------------

/** Ce qu'on photographie dans chaque lieu (le mot propre au décor d'abord). */
const PHOTO_SUBJECTS: Readonly<Record<string, readonly string[]>> = {
  africa_waterhole: ['waterhole', 'water_lily', 'tree'],
  africa_baobab: ['baobab', 'flower', 'leaf'],
  africa_desert: ['sand', 'tree', 'hill'],
  africa_canyon: ['canyon', 'mountain', 'flower'],
  africa_plains: ['termite_mound', 'tree', 'mountain'],
  savanna: ['acacia', 'waterfall', 'flower'],
};

export function photoSubjects(c: ActivityCtx): string[] {
  const ok = new Set(nameable(c.place).map((a) => a.id));
  return (PHOTO_SUBJECTS[c.place.id] ?? []).filter((id) => ok.has(id));
}

export const photo: ActivityDef = {
  id: 'photo',
  choices: (c) => (photoSubjects(c).length >= 2 ? photoSubjects(c) : []),
  build(c, tier, choice) {
    const subjects = photoSubjects(c);
    const a = anchor(c.place, choice);
    const second = anchor(c.place, subjects.find((id) => id !== choice) ?? '');
    if (!a || !second) return undefined;
    const n1 = NOUNS[a.word]!;
    const others = nameable(c.place).filter((x) => x.word !== a.word && NOUNS[x.word]);
    const steps: QuestStep[] = [
      say('actor', "I have a camera! Let's take photos!", "J'ai un appareil photo ! Prenons des photos !", {}, 'happy'),
      tap('actor', `Let's take a photo of the ${a.word}! Touch the ${a.word}!`, `Prenons ${a.wordFr} en photo ! Touche ${a.wordFr} !`, a.id, [`Find the ${a.word}!`, `Cherche ${a.wordFr} !`], [a.word, 'photo'], { photo: true, onCorrect: ['Click! What a lovely photo!', 'Clic ! Quelle jolie photo !'] }),
    ];
    if (tier !== 'beginner') {
      steps.push(tap('actor', `Now a photo of the ${second.word}! Touch the ${second.word}!`, `Maintenant, ${second.wordFr} en photo ! Touche ${second.wordFr} !`, second.id, [`Find the ${second.word}!`, `Cherche ${second.wordFr} !`], [second.word, 'photo'], { photo: true, onCorrect: ['Click! Beautiful!', 'Clic ! Magnifique !'] }));
    }
    if (tier === 'expert' && others.length >= 2) {
      const opts: ResponseOption[] = [ok(`${n1.en}!`, `${n1.fr} !`), ...others.filter((x) => x.word !== second.word).slice(0, 3).map((x) => no(`${NOUNS[x.word]!.en}!`, `${NOUNS[x.word]!.fr} !`))];
      steps.push(ask('actor', 'Look at our first photo! What is it?', "Regarde notre première photo ! Qu'est-ce que c'est ?", opts, [`It's the ${a.word}!`, `C'est ${a.wordFr} !`], [a.word], { onCorrect: L(`Yes! ${n1.en}!`, `Oui ! ${n1.fr} !`) }));
    }
    steps.push(end('actor', 'Look at our photos! I love them!', "Regarde nos photos ! Je les adore !"));
    return steps;
  },
  memoryEvent: (c, choice) => `photo:${c.place.id}:${choice}`,
};

/** Bébé qui accompagne (pour les phrases « notre bébé »). */
export const hasBaby = (c: ActivityCtx) => babySex(c) !== undefined;

/**
 * Le vent dans le baobab (jeu de Papa au baobab) : le vent fait tomber des feuilles vertes,
 * jaunes, orange ; on attrape celle que Papa demande, puis on les compte.
 */
const LEAF_COLORS = [
  { c: 'green', en: 'green', fr: 'verte' },
  { c: 'yellow', en: 'yellow', fr: 'jaune' },
  { c: 'orange', en: 'orange', fr: 'orange' },
] as const;

export const windyBaobab: ActivityDef = {
  id: 'windy_baobab',
  choices: (c) => (anchor(c.place, 'baobab') && c.place.spots.length >= 6 ? ['wind'] : []),
  build(c, tier) {
    const cols = LEAF_COLORS.slice(0, byTier(tier, 2, 3, 3));
    const leaves = cols.map((x, i) => prop(`leaf_${x.c}`, 'leaf', [2, 4, 6][i]!, x.c));
    const jump = canDo(c.species, 'jump');
    const steps: QuestStep[] = [
      say('actor', 'Whoosh! Whoosh! The wind blows!', 'Whoosh ! Whoosh ! Le vent souffle !', {}, 'curious'),
      tap('actor', 'Look! Leaves fall from the baobab! Touch the baobab!', 'Regarde ! Des feuilles tombent du baobab ! Touche le baobab !', 'baobab', ['The very big tree!', 'Le très grand arbre !'], ['baobab', 'wind']),
      props(leaves),
    ];
    // l'ordre des demandes change d'une couleur à l'autre (jaune d'abord, puis verte, puis orange)
    for (const x of [cols[1]!, cols[0]!, ...cols.slice(2)]) {
      steps.push(
        tapProps('actor', `Catch the ${x.en} leaf!`, `Attrape la feuille ${x.fr} !`, [`leaf_${x.c}`], [`Look for the ${x.en} one!`, `Cherche la ${x.fr} !`], [x.c, 'leaf'], {
          onCorrect: L(`Yes! The ${x.en} leaf!`, `Oui ! La feuille ${x.fr} !`),
          wrong: Object.fromEntries(cols.filter((o) => o.c !== x.c).map((o) => [`leaf_${o.c}`, L(`No, that one is ${o.en}!`, `Non, celle-là est ${o.fr} !`)])),
        }),
      );
    }
    steps.push(
      ask('actor', 'How many leaves?', 'Combien de feuilles ?', numberOptions(cols.length), ['Count them: one, two…', 'Compte-les : one, two…'], [numberId(cols.length), 'how_many'], { minTier: 'intermediate', onCorrect: L(`Yes! ${NUMBERS[cols.length]!.en} leaves!`, `Oui ! ${NUMBERS[cols.length]!.fr} feuilles !`) }),
      clearProps(),
      jump ? act('actor', 'jump', 'Jump! I can catch a leaf too!', 'Hop ! Moi aussi, j’attrape une feuille !', 'actor') : act('actor', 'run', 'I can run after the leaves!', 'Je cours après les feuilles !', 'actor'),
      end('actor', 'Thank you, wind! Bye, baobab!', 'Merci, le vent ! Au revoir, le baobab !'),
    );
    return steps;
  },
};

export const AFRICA_ACTIVITIES: readonly ActivityDef[] = [windyBaobab, whoInWater, baobabNest, sunAndShade, echoCanyon, climbRock, followTracks, race, simonSays, bedtime, feelings, photo];

/** Phrases de légende (album photo) : groupe nominal du mot photographié. */
export const photoCaption = (word: string): Line | undefined => NOUNS[word];
