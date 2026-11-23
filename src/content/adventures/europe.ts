/**
 * Aventures d'Europe : forêt d'automne, ferme, lac de la forêt, montagne et côte.
 * Renard, hibou et hérisson vivent chacun au moins trois aventures ; le hibou vole et aime la nuit,
 * le hérisson ne saute pas, le renard saute et court. Les lieux visités respectent les habitats
 * de chaque espèce (le renard va aux Alpes, le hérisson à la côte, le hibou au lac).
 */
import type { AdventureDef, QuestStep, SpeciesDef } from '../types';
import {
  ABILITY_WORDS,
  act,
  ask,
  back,
  canDo,
  clearProps,
  colorHunt,
  countScene,
  drinkScene,
  eatScene,
  end,
  go,
  L,
  moveTo,
  no,
  ok,
  prop,
  props,
  reward,
  say,
  seek,
  tap,
  tapProps,
  treasure,
  yesNo,
  type AdventurePack,
} from './kit';

/** Capacité de l'espèce montrée dans les aventures : sauter, voler ou courir (jamais une capacité fausse). */
const showOff = (sp: SpeciesDef) => (canDo(sp, 'jump') ? 'jump' : canDo(sp, 'fly') ? 'fly' : 'run') as 'jump' | 'fly' | 'run';
const SHOW_LINES = {
  jump: L('I can jump! Boing, boing!', 'Je sais sauter ! Boing, boing !'),
  fly: L('I can fly! Whoosh!', 'Je sais voler ! Vouiii !'),
  run: L('I can run! Look at me!', 'Je sais courir ! Regarde-moi !'),
} as const;

/** « What can I do? » avec la vraie capacité de l'espèce et deux fausses. */
const whatCanIDo = (sp: SpeciesDef, extra: { minTier?: 'intermediate' | 'expert' } = {}): QuestStep => {
  const ab = showOff(sp);
  const w = ABILITY_WORDS[ab];
  return ask(
    'actor',
    'What can I do?',
    "Qu'est-ce que je sais faire ?",
    [ok(`I can ${w.en}!`, `Je sais ${w.fr} !`, w.icon), no('I can drive a car!', 'Je sais conduire une voiture !', '🚗'), no(canDo(sp, 'fly') ? 'I can swim!' : 'I can fly!', canDo(sp, 'fly') ? 'Je sais nager !' : 'Je sais voler !', canDo(sp, 'fly') ? '🏊' : '🪽')],
    [`Look! I can ${w.en}!`, `Regarde ! Je sais ${w.fr} !`],
    ['can', ab],
    extra,
  );
};

// ---------------------------------------------------------------------------
// 1. La balade d'automne — feuilles, champignons, glands
// ---------------------------------------------------------------------------

const autumnWalk = (sp: SpeciesDef): QuestStep[] => {
  const ab = showOff(sp);
  return [
    say('father', 'Good morning, family! What a beautiful autumn day!', "Bonjour, la famille ! Quelle belle journée d'automne !", {}, 'happy'),
    ask('mother', 'Are you ready for a walk in the forest?', 'Êtes-vous prêts pour une balade dans la forêt ?', [ok("Yes, let's go!", 'Oui, allons-y !', '🚶'), ok("Yes, I'm ready!", 'Oui, je suis prêt !', '👍')], ["You can say: yes, let's go!", 'Tu peux dire : yes, let’s go!'], ['lets_go', 'happy'], { keepOrder: true, onCorrect: L("Great! Let's look around!", 'Super ! Regardons autour de nous !') }),
    tap('father', 'Look! The leaves are falling. Where is the leaf?', 'Regarde ! Les feuilles tombent. Où est la feuille ?', 'leaf', ['Look down, on the ground!', 'Regarde en bas, par terre !'], ['leaf', 'where', 'autumn']),
    say('baby', 'Crunch, crunch! I love the leaves!', "Crouitch, crouitch ! J'adore les feuilles !", { needs: 'baby' }, 'happy'),
    tap('mother', 'And look at that mushroom! Where is the mushroom?', 'Et regarde ce champignon ! Où est le champignon ?', 'mushroom', ['It is small and red!', "Il est petit et rouge !"], ['mushroom', 'where']),
    ask('father', 'Is the mushroom red?', 'Est-ce que le champignon est rouge ?', yesNo(true), ['Look at the mushroom!', 'Regarde le champignon !'], ['mushroom', 'red'], { minTier: 'intermediate', pointAt: 'mushroom', keepOrder: true }),
    say('narrator', 'We only look at the mushroom. We do not eat it!', 'On regarde seulement le champignon. On ne le mange pas !', {}, 'calm'),
    say('actor', "I'm hungry! Let's find some food.", "J'ai faim ! Trouvons à manger.", {}, 'thirsty'),
    ...eatScene(sp, [2, 3, 4, 5], 'actor', 'meal'),
    say('narrator', 'Plop! Plop! Acorns fall from the big tree!', 'Plop ! Plop ! Des glands tombent du grand arbre !', {}, 'curious'),
    ...countScene('father', 'acorn', [0, 1, 2, 3, 4, 5, 6], { beginner: 3, intermediate: 5, expert: 7 }, 'acorn'),
    say('actor', "Phew! I'm tired. Let's rest under the tree!", 'Ouf ! Je suis fatigué. Reposons-nous sous l’arbre !', {}, 'calm'),
    moveTo('oak', 'rest', 'actor'),
    say('actor', 'Ahh! It is nice and cool here.', "Ahh ! On est bien au frais ici.", {}, 'calm'),
    back('actor'),
    act('actor', ab, SHOW_LINES[ab].en, SHOW_LINES[ab].fr, 'actor'),
    whatCanIDo(sp, { minTier: 'intermediate' }),
    say('baby', 'I can do it too! Look!', 'Moi aussi, je sais faire ! Regarde !', { needs: 'baby' }, 'proud'),
    tap('mother', 'Look at the big mountain! Where is the mountain?', 'Regarde la grande montagne ! Où est la montagne ?', 'mountain', ['It is far away!', 'Elle est loin !'], ['mountain', 'where', 'big']),
    ask('father', 'Is the mountain white?', 'Est-ce que la montagne est blanche ?', yesNo(true), ['Look at the top!', 'Regarde en haut !'], ['mountain', 'white'], { minTier: 'expert', pointAt: 'mountain', keepOrder: true }),
    seek('mother', 'sibling', 'oak', {
      line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
      hint: ['Look behind the big tree!', 'Regarde derrière le grand arbre !'],
      notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
      found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
    }, ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
    say('narrator', 'The leaves have so many colours!', 'Les feuilles ont tellement de couleurs !', {}, 'curious'),
    ...colorHunt('mother', 'leaf', 'orange', ['green', 'red', 'yellow'], [2, 4, 5, 6], 'lf'),
    say('father', 'Look! Under the leaf… something is shiny!', 'Regarde ! Sous la feuille… quelque chose brille !', {}, 'curious'),
    reward('eu_golden_acorn', 'father', 'A golden acorn! It is our treasure!', 'Un gland doré ! C’est notre trésor !'),
    end('mother', 'What a lovely autumn walk!', "Quelle belle balade d'automne !"),
  ];
};

// ---------------------------------------------------------------------------
// 2. Le jour des pommes — de la ferme à la forêt
// ---------------------------------------------------------------------------

const appleDay = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'Welcome to the farm! The apples are red today.', "Bienvenue à la ferme ! Les pommes sont rouges aujourd'hui."),
  tap('father', 'Look at the big tree! Where is the apple tree?', 'Regarde le grand arbre ! Où est le pommier ?', 'appletree', ['It has red apples on it!', 'Il a des pommes rouges !'], ['apple tree', 'tree', 'where']),
  tap('mother', 'Where is the apple? Show me!', 'Où est la pomme ? Montre-moi !', 'apple', ['It is high up in the tree!', "Elle est tout en haut de l'arbre !"], ['apple', 'where']),
  ask('father', 'What colour is the apple?', 'De quelle couleur est la pomme ?', [ok('Red!', 'Rouge !', '🔴'), no('Blue!', 'Bleue !', '🔵'), no('Purple!', 'Violette !', '🟣'), no('Pink!', 'Rose !', '🩷')], ['Look at the apple!', 'Regarde la pomme !'], ['red', 'apple'], { pointAt: 'apple', onCorrect: L('Yes! A red apple!', 'Oui ! Une pomme rouge !') }),
  say('narrator', 'Plop! Some apples fall on the grass!', "Plop ! Des pommes tombent dans l'herbe !", {}, 'curious'),
  ...countScene('mother', 'apple', [1, 2, 3, 4, 5, 7, 0], { beginner: 3, intermediate: 5, expert: 7 }, 'apple'),
  say('baby', 'The apples are so round!', 'Les pommes sont toutes rondes !', { needs: 'baby' }, 'happy'),
  ask('father', 'Is the apple tree big?', 'Est-ce que le pommier est grand ?', yesNo(true), ['Look at the tree!', "Regarde l'arbre !"], ['apple tree', 'big'], { minTier: 'intermediate', pointAt: 'appletree', keepOrder: true }),
  say('actor', "Phew! It's a warm day. I'm thirsty!", "Ouf ! Il fait chaud. J'ai soif !", {}, 'thirsty'),
  tap('father', 'Where is the stream? Show me!', 'Où est le ruisseau ? Montre-moi !', 'stream', ['Look! The water is cool!', "Regarde ! L'eau est fraîche !"], ['stream', 'water', 'where']),
  ...drinkScene(sp, 'stream', 'actor'),
  ask('mother', 'Is the stream hot?', 'Est-ce que le ruisseau est chaud ?', yesNo(false), ['Is it hot or cool?', 'Il est chaud ou frais ?'], ['stream', 'hot', 'cold'], { minTier: 'expert', pointAt: 'stream', keepOrder: true }),
  tap('father', 'Look! A little bridge! Where is the bridge?', 'Regarde ! Un petit pont ! Où est le pont ?', 'bridge', ['It goes over the stream!', 'Il passe au-dessus du ruisseau !'], ['bridge', 'where']),
  moveTo('bridge', 'walk', 'father'),
  say('father', 'Trip, trap, trip, trap! I walk on the bridge!', 'Tip, tap, tip, tap ! Je marche sur le pont !', {}, 'happy'),
  back('father'),
  seek('mother', 'sibling', 'appletree', {
    line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
    hint: ['Look behind the apple tree!', 'Regarde derrière le pommier !'],
    notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
    found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
  }, ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
  go('europe_forest', 'mother', "Now let's walk to the forest!", 'Maintenant, allons à la forêt !'),
  say('narrator', 'The forest is full of food too!', 'La forêt est pleine de nourriture aussi !', {}, 'curious'),
  ...eatScene(sp, [2, 3, 4, 5], 'actor', 'snack'),
  tap('father', 'Look at the pretty flowers! Where is the flower?', 'Regarde les jolies fleurs ! Où est la fleur ?', 'flower', ['Look up, on the right!', 'Regarde en haut, à droite !'], ['flower', 'where']),
  ...colorHunt('father', 'flower', 'purple', ['yellow', 'red', 'white'], [2, 4, 5, 6], 'fl'),
  reward('eu_red_apple', 'mother', 'A shiny red apple! It is our treasure!', 'Une pomme rouge toute brillante ! C’est notre trésor !'),
  end('father', 'What a happy day at the farm!', 'Quelle joyeuse journée à la ferme !'),
];

// ---------------------------------------------------------------------------
// 3. Une nuit au lac — le soir, la lune, les grenouilles (renard et hibou)
// ---------------------------------------------------------------------------

const lakeNight = (sp: SpeciesDef): QuestStep[] => {
  const flies = canDo(sp, 'fly');
  return [
    say('narrator', 'The sun goes down at the forest lake. It is almost night.', 'Le soleil se couche au lac de la forêt. Bientôt, ce sera la nuit.', {}, 'calm'),
    ask('mother', 'What do we say in the evening?', 'Que dit-on le soir ?', [ok('Good evening!', 'Bonsoir !', '🌆'), no('Good morning!', 'Bonjour !', '🌅'), no('Goodbye!', 'Au revoir !', '🙋'), no('Happy birthday!', 'Joyeux anniversaire !', '🎂')], ['We say: good evening!', 'On dit : good evening!'], ['good_evening', 'hello'], { onCorrect: L('Good evening, everybody!', 'Bonsoir, tout le monde !') }),
    tap('father', 'Where is the lake? Show me!', 'Où est le lac ? Montre-moi !', 'lake', ['It is big and blue!', 'Il est grand et bleu !'], ['lake', 'where']),
    ask('mother', 'Is the lake blue?', 'Est-ce que le lac est bleu ?', yesNo(true), ['Look at the water!', "Regarde l'eau !"], ['lake', 'blue'], { minTier: 'intermediate', pointAt: 'lake', keepOrder: true }),
    ...drinkScene(sp, 'lake', 'actor'),
    tap('mother', 'Look! A little island! Where is the island?', "Regarde ! Une petite île ! Où est l'île ?", 'island', ['It is in the middle of the lake!', 'Elle est au milieu du lac !'], ['island', 'where'], { minTier: 'intermediate' }),
    say('narrator', 'The moon comes out. Look at the shiny pebbles!', 'La lune se lève. Regarde les cailloux brillants !', {}, 'curious'),
    ...colorHunt('father', 'pebble', 'white', ['blue', 'red', 'green'], [1, 3, 4, 5], 'pb'),
    say('narrator', 'Splash! Frogs are by the lake. Croak, croak!', "Plouf ! Des grenouilles sont près du lac. Coa, coa !", {}, 'curious'),
    ...countScene('mother', 'frog', [1, 2, 3, 4, 5], { beginner: 3, intermediate: 4, expert: 5 }, 'frog'),
    ask('father', 'What do we see in the night sky?', 'Que voit-on dans le ciel la nuit ?', [ok('The moon and the stars!', 'La lune et les étoiles !', '🌙'), no('The sun!', 'Le soleil !', '☀️'), no('A rainbow!', 'Un arc-en-ciel !', '🌈'), no('A kite!', 'Un cerf-volant !', '🪁')], ['It is dark. Look up!', "Il fait noir. Regarde en haut !"], ['moon', 'star', 'night'], { onCorrect: L('Yes! The moon and the stars!', 'Oui ! La lune et les étoiles !') }),
    ...(flies
      ? [
          act('actor', 'fly', 'Whoo, whoo! I fly over the lake!', 'Hou, hou ! Je vole au-dessus du lac !', 'actor'),
          say('mother', 'Owls love the night. They see well in the dark!', 'Les hiboux aiment la nuit. Ils voient bien dans le noir !', {}, 'proud'),
        ]
      : [
          act('actor', 'run', 'I run along the lake! Look at me!', 'Je cours le long du lac ! Regarde-moi !', 'actor'),
          say('mother', 'Foxes like the night too. We see well in the dark!', 'Les renards aiment aussi la nuit. On voit bien dans le noir !', {}, 'proud'),
        ]),
    say('baby', "I'm not afraid. I'm with you!", "Je n'ai pas peur. Je suis avec vous !", { needs: 'baby' }, 'love'),
    seek('father', 'sibling', 'rock', {
      line: ['Shh! Somebody is hiding. Can you find them?', "Chut ! Quelqu'un se cache. Tu peux le trouver ?"],
      hint: ['Look behind the rock!', 'Regarde derrière le rocher !'],
      notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
      found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
    }, ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
    go('europe_forest', 'mother', "It's late. Let's go home through the forest!", 'Il est tard. Rentrons par la forêt !'),
    tap('father', 'Our home is under the big tree. Where is the tree?', "Notre maison est sous le grand arbre. Où est l'arbre ?", 'oak', ['It is the biggest tree!', "C'est le plus grand arbre !"], ['tree', 'where', 'big']),
    moveTo('oak', 'rest', 'actor'),
    act('actor', 'sleep', 'Zzz… I am sleepy.', 'Zzz… J’ai sommeil.', 'actor'),
    back('actor'),
    say('baby', 'Good night!', 'Bonne nuit !', { needs: 'baby' }, 'love'),
    reward('eu_moon_stone', 'mother', 'Look! A moon stone! It is our treasure!', 'Regarde ! Une pierre de lune ! C’est notre trésor !'),
    end('father', 'Good night, everybody!', 'Bonne nuit, tout le monde !'),
  ];
};

// ---------------------------------------------------------------------------
// 4. La grande excursion — le renard aux Alpes, le hérisson à la côte
// ---------------------------------------------------------------------------

const alpsPart = (sp: SpeciesDef): QuestStep[] => [
  go('europe_alps', 'father', "Let's go to the mountains!", 'Allons à la montagne !'),
  say('narrator', 'Wow! The mountains are so high!', 'Waouh ! Les montagnes sont si hautes !', {}, 'curious'),
  tap('mother', 'Where is the mountain? Show me!', 'Où est la montagne ? Montre-moi !', 'mountain', ['It is very high!', 'Elle est très haute !'], ['mountain', 'where']),
  ask('father', 'Is the mountain high?', 'Est-ce que la montagne est haute ?', yesNo(true), ['Look up!', 'Regarde en haut !'], ['mountain', 'big'], { minTier: 'intermediate', pointAt: 'mountain', keepOrder: true }),
  say('actor', "Phew! I'm thirsty!", "Ouf ! J'ai soif !", {}, 'thirsty'),
  tap('father', 'Where is the lake? Show me!', 'Où est le lac ? Montre-moi !', 'lake', ['The water is cool and blue!', "L'eau est fraîche et bleue !"], ['lake', 'water', 'where']),
  ...drinkScene(sp, 'lake', 'actor'),
  tap('mother', 'Look at the cloud! Where is the cloud?', 'Regarde le nuage ! Où est le nuage ?', 'cloud', ['It is up in the sky!', 'Il est dans le ciel !'], ['cloud', 'where']),
  ask('father', 'Is the cloud white?', 'Est-ce que le nuage est blanc ?', yesNo(true), ['Look at the cloud!', 'Regarde le nuage !'], ['cloud', 'white'], { minTier: 'expert', pointAt: 'cloud', keepOrder: true }),
  tap('mother', 'Look at the small house! Where is the house?', 'Regarde la petite maison ! Où est la maison ?', 'house', ['It is near the church!', "Elle est près de l'église !"], ['house', 'where'], { minTier: 'intermediate' }),
  act('actor', 'jump', 'I can jump! Boing, boing!', 'Je sais sauter ! Boing, boing !', 'actor'),
  say('baby', 'Look at me! I can jump too!', 'Regarde-moi ! Je sais sauter aussi !', { needs: 'baby' }, 'proud'),
  say('narrator', 'Pretty flowers grow on the mountain!', 'De jolies fleurs poussent à la montagne !', {}, 'happy'),
  ...colorHunt('mother', 'flower', 'pink', ['yellow', 'blue', 'white'], [1, 2, 3, 6], 'alp'),
];

const coastPart = (sp: SpeciesDef): QuestStep[] => [
  go('europe_coast', 'father', "Let's go to the sea!", 'Allons à la mer !'),
  say('narrator', 'Wow! The sea is so big and blue!', 'Waouh ! La mer est si grande et bleue !', {}, 'curious'),
  tap('mother', 'Where is the sea? Show me!', 'Où est la mer ? Montre-moi !', 'sea', ['It is big and blue!', 'Elle est grande et bleue !'], ['sea', 'where']),
  ask('father', 'Is the sea blue?', 'Est-ce que la mer est bleue ?', yesNo(true), ['Look at the water!', "Regarde l'eau !"], ['sea', 'blue'], { minTier: 'intermediate', pointAt: 'sea', keepOrder: true }),
  tap('mother', 'Where is the sand? Show me!', 'Où est le sable ? Montre-moi !', 'sand', ['It is soft and yellow!', "C'est doux et jaune !"], ['sand', 'where']),
  tap('father', 'Look! Some steps! Where are the steps?', 'Regarde ! Des marches ! Où sont les marches ?', 'stairs', ['Look at the stairs, on the left!', 'Regarde les marches, à gauche !'], ['step', 'where']),
  moveTo('stairs', 'walk', 'actor'),
  act('actor', 'run', 'I can run on the sand! Look at me!', 'Je sais courir sur le sable ! Regarde-moi !', 'actor'),
  back('actor'),
  say('baby', 'The sand is so soft!', 'Le sable est tout doux !', { needs: 'baby' }, 'happy'),
  say('actor', "I'm hungry! Let's look for food.", "J'ai faim ! Cherchons à manger.", {}, 'thirsty'),
  ...eatScene(sp, [0, 1, 2, 3], 'actor', 'coast'),
  say('narrator', 'Look! Shells on the sand!', 'Regarde ! Des coquillages sur le sable !', {}, 'curious'),
  ...countScene('mother', 'shell', [1, 2, 3, 4, 0], { beginner: 3, intermediate: 4, expert: 5 }, 'shell'),
  tap('father', 'Look at the sun! Where is the sun?', 'Regarde le soleil ! Où est le soleil ?', 'sun', ['It is high in the sky!', 'Il est haut dans le ciel !'], ['sun', 'where']),
  ask('mother', 'Is the sun hot?', 'Est-ce que le soleil est chaud ?', yesNo(true), ['Look at the sun!', 'Regarde le soleil !'], ['sun', 'hot'], { minTier: 'expert', pointAt: 'sun', keepOrder: true }),
];

const bigTrip = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', "Today is a trip day! It's a sunny morning in the forest.", "Aujourd'hui, c'est le jour de l'excursion ! C'est un matin ensoleillé dans la forêt.", {}, 'happy'),
  ask('mother', 'How is the weather today?', 'Quel temps fait-il aujourd’hui ?', [ok("It's sunny!", 'Il fait beau !', '☀️'), no("It's snowy!", 'Il neige !', '🌨️'), no("It's rainy!", 'Il pleut !', '🌧️'), no("It's windy!", 'Il y a du vent !', '🌬️')], ['Look at the big sun!', 'Regarde le grand soleil !'], ['weather', 'sunny'], { onCorrect: L("Yes! It's sunny!", 'Oui ! Il fait beau !') }),
  props([prop('hat', 'hat', 2), prop('coat', 'coat', 3)], { maxTier: 'beginner' }),
  props([prop('hat', 'hat', 2), prop('coat', 'coat', 3), prop('sunglasses', 'sunglasses', 4), prop('gloves', 'gloves', 5)], { minTier: 'intermediate' }),
  tapProps('mother', "It's sunny! We need a hat. Find the hat!", 'Il fait beau ! Il nous faut un chapeau. Trouve le chapeau !', ['hat'], ['A hat for the sun!', 'Un chapeau pour le soleil !'], ['hat', 'need'], {
    maxTier: 'beginner',
    onCorrect: L('Yes! A hat for the sun!', 'Oui ! Un chapeau pour le soleil !'),
    wrong: { coat: L("A coat? No! It's sunny!", 'Un manteau ? Non ! Il fait beau !') },
  }),
  tapProps('mother', "It's sunny! Find the hat and the sunglasses!", 'Il fait beau ! Trouve le chapeau et les lunettes de soleil !', ['hat', 'sunglasses'], ['Things for the sun!', 'Des choses pour le soleil !'], ['hat', 'sunglasses', 'need'], {
    minTier: 'intermediate',
    onCorrect: L('Great! We are ready for the trip!', 'Super ! Nous sommes prêts pour l’excursion !'),
    wrong: { coat: L("A coat? No! It's sunny!", 'Un manteau ? Non ! Il fait beau !'), gloves: L("Gloves? No! It's not cold!", "Des gants ? Non ! Il ne fait pas froid !") },
  }),
  clearProps(),
  tap('father', 'We cross the bridge first. Where is the bridge?', "On traverse d'abord le pont. Où est le pont ?", 'bridge', ['It is near the water!', "Il est près de l'eau !"], ['bridge', 'follow_the_path', 'where']),
  moveTo('bridge', 'walk', 'father'),
  ...(sp.id === 'hedgehog' ? coastPart(sp) : alpsPart(sp)),
  say('actor', 'What a long trip! I am tired.', 'Quelle longue excursion ! Je suis fatigué.', {}, 'calm'),
  reward('eu_postcard', 'father', 'Look! A pretty postcard! It is our treasure!', 'Regarde ! Une jolie carte postale ! C’est notre trésor !'),
  end('mother', 'We are brave explorers!', 'Nous sommes de courageux explorateurs !'),
];

// ---------------------------------------------------------------------------
// Les décors du renard (2026-11-23) : la clairière au soleil couchant, le terrier d'automne (paille et
// pommes de pin), la tanière sous la neige. Le renard court, saute et creuse ; il mange des baies et des vers.
// ---------------------------------------------------------------------------

const hideSeek = (who: 'father' | 'mother', at: string, hint: [string, string]): QuestStep =>
  seek(who, 'sibling', at, {
    line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
    hint,
    notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
    found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
  }, ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' });

const foxGlade = (sp: SpeciesDef): QuestStep[] => {
  const ab = showOff(sp);
  return [
    say('narrator', 'Welcome to the glade! The sun is going down.', 'Bienvenue dans la clairière ! Le soleil se couche.', {}, 'calm'),
    tap('father', 'Look at the sun! Where is the sun?', 'Regarde le soleil ! Où est le soleil ?', 'sun', ['It is low in the sky!', 'Il est bas dans le ciel !'], ['sun', 'where']),
    ask('mother', 'Is the sun yellow?', 'Est-ce que le soleil est jaune ?', yesNo(true), ['Look at the sun!', 'Regarde le soleil !'], ['sun', 'yellow'], { minTier: 'intermediate', pointAt: 'sun', keepOrder: true }),
    tap('mother', 'Where is the birch tree? Show me!', 'Où est le bouleau ? Montre-moi !', 'birch', ['It is tall and white!', 'Il est grand et blanc !'], ['birch tree', 'tree', 'where']),
    ask('father', 'Is the birch tree white?', 'Est-ce que le bouleau est blanc ?', yesNo(true), ['Look at the tree!', "Regarde l'arbre !"], ['birch tree', 'white'], { minTier: 'intermediate', pointAt: 'birch', keepOrder: true }),
    say('actor', "I'm hungry! Let's find some food.", "J'ai faim ! Trouvons à manger.", {}, 'thirsty'),
    tap('father', 'Where is the berry bush? Show me!', 'Où est le buisson de baies ? Montre-moi !', 'bush', ['It has red berries!', 'Il a des baies rouges !'], ['berry bush', 'berry', 'where']),
    ...eatScene(sp, [0, 2, 4, 6], 'actor', 'meal'),
    say('narrator', 'Look! Berries on the ground!', 'Regarde ! Des baies par terre !', {}, 'curious'),
    ...countScene('mother', 'berries', [1, 3, 5, 7, 0, 2, 4], { beginner: 3, intermediate: 5, expert: 7 }, 'berry'),
    tap('father', 'Where is our den? Show me!', 'Où est notre tanière ? Montre-moi !', 'den', ['It is on the right, in the hill!', 'Elle est à droite, dans la colline !'], ['den', 'where']),
    say('actor', 'Home sweet home! I love our den.', "Bien chez soi ! J'adore notre tanière.", {}, 'happy'),
    act('actor', ab, SHOW_LINES[ab].en, SHOW_LINES[ab].fr, 'actor'),
    whatCanIDo(sp, { minTier: 'intermediate' }),
    say('baby', 'I can jump too! Look at me!', 'Moi aussi, je sais sauter ! Regarde-moi !', { needs: 'baby' }, 'proud'),
    tap('mother', 'Look at the mossy rock! Where is it?', 'Regarde le rocher moussu ! Où est-il ?', 'boulder', ['It is big and green with moss!', 'Il est gros et vert de mousse !'], ['mossy rock', 'rock', 'where'], { minTier: 'intermediate' }),
    hideSeek('father', 'boulder', ['Look behind the mossy rock!', 'Regarde derrière le rocher moussu !']),
    tap('father', 'Look at the mountain! Where is the mountain?', 'Regarde la montagne ! Où est la montagne ?', 'mountain', ['It is far away!', 'Elle est loin !'], ['mountain', 'where']),
    ask('mother', 'Is the mountain far away?', 'Est-ce que la montagne est loin ?', yesNo(true), ['Look at the mountain!', 'Regarde la montagne !'], ['mountain', 'big'], { minTier: 'expert', pointAt: 'mountain', keepOrder: true }),
    say('narrator', 'Pretty lupines grow in the grass!', "De jolis lupins poussent dans l'herbe !", {}, 'happy'),
    ...colorHunt('mother', 'flower', 'purple', ['yellow', 'red', 'white'], [0, 2, 4, 6], 'fl'),
    reward('eu_purple_flower', 'father', 'A purple flower! It is our treasure!', 'Une fleur violette ! C’est notre trésor !'),
    end('mother', 'What a lovely evening in the glade!', 'Quelle belle soirée dans la clairière !'),
  ];
};

const foxAutumn = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'Welcome to our burrow! It is warm and cosy.', 'Bienvenue dans notre terrier ! On est bien au chaud.', {}, 'calm'),
  tap('father', 'Look! Our den! Where is the den?', 'Regarde ! Notre tanière ! Où est la tanière ?', 'den', ['It is dark inside!', "Il fait sombre à l'intérieur !"], ['den', 'where']),
  ask('mother', 'Is the den dark?', 'Est-ce que la tanière est sombre ?', yesNo(true), ['Look inside the den!', 'Regarde dans la tanière !'], ['den', 'dark'], { minTier: 'intermediate', pointAt: 'den', keepOrder: true }),
  tap('mother', 'Where is the straw? Show me!', 'Où est la paille ? Montre-moi !', 'straw', ['It is soft and yellow!', 'Elle est douce et jaune !'], ['straw', 'where']),
  ask('father', 'Is the straw yellow?', 'Est-ce que la paille est jaune ?', yesNo(true), ['Look at the straw!', 'Regarde la paille !'], ['straw', 'yellow'], { minTier: 'intermediate', pointAt: 'straw', keepOrder: true }),
  say('actor', 'We sleep on the straw. It is so soft!', 'On dort sur la paille. Elle est si douce !', {}, 'calm'),
  act('actor', 'sleep', 'Zzz… Soft and warm.', 'Zzz… Douce et chaude.', 'actor'),
  say('baby', 'I like the straw! It tickles!', "J'aime la paille ! Elle chatouille !", { needs: 'baby' }, 'happy'),
  say('narrator', 'Plop! Plop! Pine cones fall from the trees!', 'Plop ! Plop ! Des pommes de pin tombent des arbres !', {}, 'curious'),
  ...countScene('father', 'pinecone', [1, 3, 5, 7, 0, 2, 4], { beginner: 3, intermediate: 5, expert: 7 }, 'cone'),
  say('actor', "I'm thirsty! Let's go to the stream.", "J'ai soif ! Allons au ruisseau.", {}, 'thirsty'),
  tap('mother', 'Where is the stream? Show me!', 'Où est le ruisseau ? Montre-moi !', 'stream', ['The water is cold!', "L'eau est froide !"], ['stream', 'water', 'where']),
  ...drinkScene(sp, 'stream', 'actor'),
  ask('father', 'Is the stream cold?', 'Est-ce que le ruisseau est froid ?', yesNo(true), ['Is it hot or cold?', 'Il est chaud ou froid ?'], ['stream', 'hot', 'cold'], { minTier: 'expert', pointAt: 'stream', keepOrder: true }),
  tap('father', 'Look at the mushroom! Where is the mushroom?', 'Regarde le champignon ! Où est le champignon ?', 'mushroom', ['It is small and red!', 'Il est petit et rouge !'], ['mushroom', 'where']),
  say('narrator', 'We only look at the mushroom. We do not eat it!', 'On regarde seulement le champignon. On ne le mange pas !', {}, 'calm'),
  say('actor', "I'm hungry! Let's find some food.", "J'ai faim ! Trouvons à manger.", {}, 'thirsty'),
  ...eatScene(sp, [0, 2, 4, 6], 'actor', 'meal'),
  hideSeek('mother', 'tree', ['Look behind the big tree!', 'Regarde derrière le grand arbre !']),
  tap('mother', 'The leaves are falling! Where is the maple leaf?', 'Les feuilles tombent ! Où est la feuille d’érable ?', 'mapleleaf', ['Look down, on the ground!', 'Regarde en bas, par terre !'], ['maple leaf', 'leaf', 'where']),
  ...colorHunt('mother', 'maple_leaf', 'orange', ['green', 'blue', 'purple'], [1, 3, 5, 7], 'ml'),
  tap('father', 'Look! A sunbeam! Where is the sunbeam?', 'Regarde ! Un rayon de soleil ! Où est le rayon de soleil ?', 'sunbeam', ['It comes from the sky!', 'Il vient du ciel !'], ['sunbeam', 'where'], { minTier: 'intermediate' }),
  reward('eu_orange_maple_leaf', 'father', 'An orange maple leaf! It is our treasure!', 'Une feuille d’érable orange ! C’est notre trésor !'),
  end('mother', 'What a cosy autumn day!', "Quelle douce journée d'automne !"),
];

const foxSnow = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'Snow, snow, snow! It is cold today.', 'De la neige, de la neige ! Il fait froid aujourd’hui.', {}, 'calm'),
  ask('mother', 'How is the weather today?', 'Quel temps fait-il aujourd’hui ?', [ok("It's snowy!", 'Il neige !', '🌨️'), no("It's sunny!", 'Il fait beau !', '☀️'), no("It's rainy!", 'Il pleut !', '🌧️'), no("It's windy!", 'Il y a du vent !', '🌬️')], ['Look at the white snow!', 'Regarde la neige blanche !'], ['weather', 'cold'], { onCorrect: L("Yes! It's snowy!", 'Oui ! Il neige !') }),
  props([prop('coat', 'coat', 6), prop('glasses', 'sunglasses', 7)], { maxTier: 'beginner' }),
  props([prop('coat', 'coat', 6), prop('gloves', 'gloves', 7), prop('glasses', 'sunglasses', 1)], { minTier: 'intermediate' }),
  tapProps('mother', "It's cold! We need a coat. Find the coat!", 'Il fait froid ! Il nous faut un manteau. Trouve le manteau !', ['coat'], ['A coat for the cold!', 'Un manteau pour le froid !'], ['coat', 'need'], {
    maxTier: 'beginner',
    onCorrect: L('Yes! A coat for the cold!', 'Oui ! Un manteau pour le froid !'),
    wrong: { glasses: L("Sunglasses? No! It's not sunny!", 'Des lunettes de soleil ? Non ! Il ne fait pas beau !') },
  }),
  tapProps('mother', "It's cold! Find the coat and the gloves!", 'Il fait froid ! Trouve le manteau et les gants !', ['coat', 'gloves'], ['Things for the cold!', 'Des choses pour le froid !'], ['coat', 'gloves', 'need'], {
    minTier: 'intermediate',
    onCorrect: L('Great! We are warm now!', 'Super ! On a chaud maintenant !'),
    wrong: { glasses: L("Sunglasses? No! It's not sunny!", 'Des lunettes de soleil ? Non ! Il ne fait pas beau !') },
  }),
  clearProps(),
  tap('father', 'Look! Fox tracks! Where are the tracks?', 'Regarde ! Des traces de renard ! Où sont les traces ?', 'prints', ['Look in the snow!', 'Regarde dans la neige !'], ['footprints', 'where']),
  say('actor', 'Those are my tracks! I ran here this morning.', "Ce sont mes traces ! J'ai couru ici ce matin.", {}, 'proud'),
  act('actor', 'run', 'I can run in the snow! Look at me!', 'Je sais courir dans la neige ! Regarde-moi !', 'actor'),
  tap('mother', 'Where is the oak? Show me!', 'Où est le chêne ? Montre-moi !', 'oak', ['It is big and old!', 'Il est grand et vieux !'], ['oak', 'tree', 'where']),
  hideSeek('father', 'oak', ['Look behind the big oak!', 'Regarde derrière le grand chêne !']),
  say('actor', "I'm thirsty! Let's go to the stream.", "J'ai soif ! Allons au ruisseau.", {}, 'thirsty'),
  tap('father', 'Where is the stream? Show me!', 'Où est le ruisseau ? Montre-moi !', 'brook', ['The water is cold!', "L'eau est froide !"], ['stream', 'water', 'where']),
  ...drinkScene(sp, 'brook', 'actor'),
  ask('mother', 'Is the stream cold?', 'Est-ce que le ruisseau est froid ?', yesNo(true), ['Is it hot or cold?', 'Il est chaud ou froid ?'], ['stream', 'hot', 'cold'], { minTier: 'intermediate', pointAt: 'brook', keepOrder: true }),
  say('actor', "I'm hungry! Let's find some food.", "J'ai faim ! Trouvons à manger.", {}, 'thirsty'),
  ...eatScene(sp, [6, 3, 1, 5], 'actor', 'meal'),
  say('narrator', 'Red berries in the snow!', 'Des baies rouges dans la neige !', {}, 'curious'),
  ...countScene('mother', 'berries', [6, 7, 1, 3, 5, 0, 2], { beginner: 3, intermediate: 5, expert: 7 }, 'berry'),
  tap('father', 'Look at the orange bush! Where is the bush?', 'Regarde le buisson orange ! Où est le buisson ?', 'bush', ['It is orange!', 'Il est orange !'], ['orange', 'bush', 'where'], { minTier: 'intermediate' }),
  tap('mother', 'Look at the mountain! Where is the mountain?', 'Regarde la montagne ! Où est la montagne ?', 'mountain', ['It is far away!', 'Elle est loin !'], ['mountain', 'where']),
  ask('father', 'Is the mountain white?', 'Est-ce que la montagne est blanche ?', yesNo(true), ['Look at the top!', 'Regarde en haut !'], ['mountain', 'white'], { minTier: 'expert', pointAt: 'mountain', keepOrder: true }),
  say('baby', 'I like the snow! It is so cold!', "J'aime la neige ! Elle est si froide !", { needs: 'baby' }, 'happy'),
  reward('eu_white_feather', 'father', 'A white feather! It is our treasure!', 'Une plume blanche ! C’est notre trésor !'),
  end('mother', 'What a beautiful snowy day!', 'Quelle belle journée de neige !'),
];

// ---------------------------------------------------------------------------
// Les décors du hibou (2026-11-23) : le creux de l'arbre au soleil, la branche au clair de lune (décor
// déjà nocturne : aucune lune ajoutée), le grand chêne aux glands. Le hibou vole et mange des insectes ;
// les glands, les plumes et les pierres servent à compter et à trier les couleurs, jamais de repas.
// ---------------------------------------------------------------------------

const owlNest = (sp: SpeciesDef): QuestStep[] => {
  const ab = showOff(sp);
  return [
    say('narrator', 'Welcome to the owl tree! Our home is high up.', 'Bienvenue dans l’arbre du hibou ! Notre maison est tout en haut.', {}, 'calm'),
    tap('father', 'Look! Our tree hole! Where is the tree hole?', 'Regarde ! Notre creux d’arbre ! Où est le creux ?', 'hole', ['It is dark inside!', "Il fait sombre à l'intérieur !"], ['tree hole', 'where']),
    ask('mother', 'Is the tree hole dark?', 'Est-ce que le creux est sombre ?', yesNo(true), ['Look inside the hole!', 'Regarde dans le creux !'], ['tree hole', 'dark'], { minTier: 'intermediate', pointAt: 'hole', keepOrder: true }),
    tap('mother', 'Look at the twig nest! Where is the nest?', 'Regarde le nid de brindilles ! Où est le nid ?', 'twignest', ['It is on the right, in the big tree!', 'Il est à droite, dans le grand arbre !'], ['twig nest', 'nest', 'where']),
    ask('father', 'Is the twig nest on the right?', 'Est-ce que le nid de brindilles est à droite ?', yesNo(true), ['Look at the big tree on the right!', 'Regarde le grand arbre à droite !'], ['twig nest', 'where'], { minTier: 'intermediate', pointAt: 'twignest', keepOrder: true }),
    say('actor', "I'm hungry! Let's find some food.", "J'ai faim ! Trouvons à manger.", {}, 'thirsty'),
    ...eatScene(sp, [5, 6, 7, 1], 'actor', 'meal'),
    say('narrator', 'Flutter, flutter! Feathers fall from the tree hole!', 'Flap, flap ! Des plumes tombent du creux !', {}, 'curious'),
    ...countScene('father', 'feather', [1, 2, 3, 5, 6, 7, 0], { beginner: 3, intermediate: 5, expert: 7 }, 'feather'),
    tap('mother', 'Where is the branch? Show me!', 'Où est la branche ? Montre-moi !', 'branch', ['It is long and green with moss!', 'Elle est longue et verte de mousse !'], ['branch', 'where']),
    moveTo('branch', 'rest', 'actor'),
    say('actor', 'Ahh! I sit on the branch and look at the forest.', 'Ahh ! Je me pose sur la branche et je regarde la forêt.', {}, 'calm'),
    back('actor'),
    act('actor', ab, SHOW_LINES[ab].en, SHOW_LINES[ab].fr, 'actor'),
    whatCanIDo(sp, { minTier: 'intermediate' }),
    say('baby', 'I can fly too! Flap, flap!', 'Moi aussi, je sais voler ! Flap, flap !', { needs: 'baby' }, 'proud'),
    tap('father', 'Look at the toadstool! Where is the toadstool?', 'Regarde le champignon rouge ! Où est-il ?', 'toadstool', ['It is small and red!', 'Il est petit et rouge !'], ['toadstool', 'where']),
    say('narrator', 'We only look at the toadstool. We do not eat it!', 'On regarde seulement le champignon. On ne le mange pas !', {}, 'calm'),
    tap('mother', 'Look at the fern! Where is the fern?', 'Regarde la fougère ! Où est la fougère ?', 'fern', ['It is green and soft!', 'Elle est verte et douce !'], ['fern', 'where'], { minTier: 'intermediate' }),
    say('narrator', 'Green leaves are everywhere!', 'Il y a des feuilles vertes partout !', {}, 'happy'),
    ...colorHunt('mother', 'leaf', 'green', ['orange', 'red', 'yellow'], [2, 4, 5, 6], 'lf'),
    tap('father', 'Look! The sunlight! Where is the sunlight?', 'Regarde ! La lumière du soleil ! Où est-elle ?', 'sunlight', ['It shines through the trees!', 'Elle brille à travers les arbres !'], ['sunlight', 'where'], { minTier: 'intermediate' }),
    say('baby', 'I love our tree hole!', "J'adore notre creux d'arbre !", { needs: 'baby' }, 'love'),
    reward('eu_brown_feather', 'father', 'A brown feather! It is our treasure!', 'Une plume marron ! C’est notre trésor !'),
    end('mother', 'What a cosy day in the owl tree!', "Quelle douce journée dans l'arbre du hibou !"),
  ];
};

const owlMoon = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'It is a quiet night in the forest. Hoo, hoo!', 'C’est une nuit tranquille dans la forêt. Hou, hou !', {}, 'calm'),
  ask('mother', 'What do we say at night?', 'Que dit-on la nuit ?', [ok('Good night!', 'Bonne nuit !', '😴'), no('Good morning!', 'Bonjour !', '🌅'), no('Happy birthday!', 'Joyeux anniversaire !', '🎂'), no('Goodbye!', 'Au revoir !', '🙋')], ['We say: good night!', 'On dit : good night !'], ['good_night', 'hello'], { onCorrect: L('Good night, everybody!', 'Bonne nuit, tout le monde !') }),
  tap('father', 'Look at the sky! Where is the moon?', 'Regarde le ciel ! Où est la lune ?', 'moon', ['It is big and round!', 'Elle est grande et ronde !'], ['moon', 'where']),
  ask('mother', 'Is the moon round?', 'Est-ce que la lune est ronde ?', yesNo(true), ['Look at the moon!', 'Regarde la lune !'], ['moon', 'night'], { minTier: 'intermediate', pointAt: 'moon', keepOrder: true }),
  ask('father', 'What do we see in the night sky?', 'Que voit-on dans le ciel la nuit ?', [ok('The moon!', 'La lune !', '🌙'), no('The sun!', 'Le soleil !', '☀️'), no('A rainbow!', 'Un arc-en-ciel !', '🌈'), no('A kite!', 'Un cerf-volant !', '🪁')], ['It is dark. Look up!', 'Il fait noir. Regarde en haut !'], ['moon', 'night'], { onCorrect: L('Yes! The moon!', 'Oui ! La lune !') }),
  say('actor', "I'm hungry! Let's find some food.", "J'ai faim ! Trouvons à manger.", {}, 'thirsty'),
  ...eatScene(sp, [4, 5, 6, 7], 'actor', 'meal'),
  tap('mother', 'Where is the branch? Show me!', 'Où est la branche ? Montre-moi !', 'branch', ['It is thick and long!', 'Elle est épaisse et longue !'], ['branch', 'where']),
  moveTo('branch', 'rest', 'actor'),
  say('actor', 'I sit on the branch. The forest is dark and quiet.', 'Je me pose sur la branche. La forêt est sombre et calme.', {}, 'calm'),
  back('actor'),
  act('actor', 'fly', 'Whoo, whoo! I fly in the night!', 'Hou, hou ! Je vole dans la nuit !', 'actor'),
  say('mother', 'Owls love the night. They see well in the dark!', 'Les hiboux aiment la nuit. Ils voient bien dans le noir !', {}, 'proud'),
  whatCanIDo(sp, { minTier: 'intermediate' }),
  say('baby', 'I can fly too! Whoosh!', 'Moi aussi, je sais voler ! Vouiii !', { needs: 'baby' }, 'proud'),
  tap('father', 'Look at the stones! Where are the stones?', 'Regarde les pierres ! Où sont les pierres ?', 'stones', ['They are big and grey!', 'Elles sont grosses et grises !'], ['stones', 'where']),
  hideSeek('mother', 'stones', ['Look behind the stones!', 'Regarde derrière les pierres !']),
  say('narrator', 'The moon shines on the pebbles!', 'La lune brille sur les cailloux !', {}, 'curious'),
  ...colorHunt('father', 'pebble', 'white', ['blue', 'red', 'green'], [4, 5, 6, 7], 'pb'),
  tap('mother', 'Look at the fir trees! Where are they?', 'Regarde les sapins ! Où sont-ils ?', 'firs', ['They are tall and dark!', 'Ils sont grands et sombres !'], ['fir trees', 'where'], { minTier: 'intermediate' }),
  tap('father', 'Look at the hills! Where are the hills?', 'Regarde les collines ! Où sont les collines ?', 'hills', ['They are far away!', 'Elles sont loin !'], ['dark hills', 'where']),
  ask('mother', 'Are the hills far away?', 'Est-ce que les collines sont loin ?', yesNo(true), ['Look far away!', 'Regarde au loin !'], ['dark hills', 'big'], { minTier: 'expert', pointAt: 'hills', keepOrder: true }),
  say('baby', "I'm not afraid. I'm with you!", "Je n'ai pas peur. Je suis avec vous !", { needs: 'baby' }, 'love'),
  act('actor', 'sleep', 'Zzz… Owls sleep in the day.', 'Zzz… Les hiboux dorment le jour.', 'actor'),
  reward('eu_moon_stone', 'mother', 'Look! A moon stone! It is our treasure!', 'Regarde ! Une pierre de lune ! C’est notre trésor !'),
  end('father', 'Good night, everybody!', 'Bonne nuit, tout le monde !'),
];

const owlOak = (sp: SpeciesDef): QuestStep[] => {
  const ab = showOff(sp);
  return [
    say('narrator', 'Welcome to the big oak! It is the biggest tree in the forest.', 'Bienvenue au grand chêne ! C’est le plus grand arbre de la forêt.', {}, 'calm'),
    tap('father', 'Look! The hollow! Where is the hollow?', 'Regarde ! Le creux ! Où est le creux ?', 'hollow', ['It is high in the tree!', "Il est tout en haut de l'arbre !"], ['hollow', 'where']),
    ask('mother', 'Is the hollow high up?', 'Est-ce que le creux est tout en haut ?', yesNo(true), ['Look up in the tree!', "Regarde en haut de l'arbre !"], ['hollow', 'big'], { minTier: 'intermediate', pointAt: 'hollow', keepOrder: true }),
    tap('mother', 'Where are the acorns? Show me!', 'Où sont les glands ? Montre-moi !', 'acorns', ['They hang on the branches!', 'Ils pendent aux branches !'], ['acorns', 'where']),
    ask('father', 'Are the acorns brown?', 'Est-ce que les glands sont marron ?', yesNo(true), ['Look at the acorns!', 'Regarde les glands !'], ['acorns', 'where'], { minTier: 'intermediate', pointAt: 'acorns', keepOrder: true }),
    say('narrator', 'Owls do not eat acorns. We count them!', 'Les hiboux ne mangent pas les glands. On les compte !', {}, 'curious'),
    ...countScene('mother', 'acorn', [0, 1, 2, 3, 4, 5, 6], { beginner: 3, intermediate: 5, expert: 7 }, 'acorn'),
    say('actor', "I'm hungry! Let's find some food.", "J'ai faim ! Trouvons à manger.", {}, 'thirsty'),
    ...eatScene(sp, [3, 4, 5, 6], 'actor', 'meal'),
    tap('father', 'Where is the big branch? Show me!', 'Où est la grosse branche ? Montre-moi !', 'bigbranch', ['It is very high!', 'Elle est très haute !'], ['big branch', 'branch', 'where']),
    act('actor', ab, SHOW_LINES[ab].en, SHOW_LINES[ab].fr, 'actor'),
    whatCanIDo(sp, { minTier: 'intermediate' }),
    say('baby', 'I can fly too! Look at me!', 'Moi aussi, je sais voler ! Regarde-moi !', { needs: 'baby' }, 'proud'),
    tap('mother', 'Look at the red mushrooms! Where are they?', 'Regarde les champignons rouges ! Où sont-ils ?', 'redcaps', ['They are red with white spots!', 'Ils sont rouges avec des points blancs !'], ['red mushrooms', 'where']),
    say('narrator', 'We only look at the mushrooms. We do not eat them!', 'On regarde seulement les champignons. On ne les mange pas !', {}, 'calm'),
    tap('father', 'Look at the clearing! Where is the clearing?', 'Regarde la clairière ! Où est la clairière ?', 'clearing', ['It is in the sun!', 'Elle est au soleil !'], ['clearing', 'where'], { minTier: 'intermediate' }),
    hideSeek('mother', 'rock', ['Look behind the rock!', 'Regarde derrière le rocher !']),
    tap('father', 'Look at the spruce! Where is the spruce?', "Regarde l'épicéa ! Où est l'épicéa ?", 'spruce', ['It is a tall green tree!', "C'est un grand arbre vert !"], ['spruce', 'where'], { minTier: 'intermediate' }),
    say('narrator', 'Bluebells grow under the oak!', 'Des clochettes poussent sous le chêne !', {}, 'happy'),
    ...colorHunt('mother', 'flower', 'purple', ['yellow', 'red', 'white'], [0, 1, 2, 4], 'fl'),
    say('baby', 'I love the big oak!', "J'adore le grand chêne !", { needs: 'baby' }, 'love'),
    reward('eu_golden_acorn', 'father', 'A golden acorn! It is our treasure!', 'Un gland doré ! C’est notre trésor !'),
    end('mother', 'What a lovely day at the big oak!', 'Quelle belle journée au grand chêne !'),
  ];
};

// ---------------------------------------------------------------------------
// Les décors du hérisson (2026-11-23) : le ruisseau et son tunnel de racines (lit de feuilles mortes,
// fraises), le lac de montagne, le tronc creux aux myrtilles. Le hérisson court mais ne saute pas, il mange
// des insectes et des vers ; fraises, myrtilles et cailloux servent seulement à compter et à trier.
// Le ruisseau se distingue du terrier du renard (paille, pommes de pin) par ses feuilles mortes et ses fraises.
// ---------------------------------------------------------------------------

const hogStream = (sp: SpeciesDef): QuestStep[] => {
  const ab = showOff(sp);
  return [
    say('narrator', 'Welcome to the stream! The water goes splash, splash.', 'Bienvenue au ruisseau ! L’eau fait plouf, plouf.', {}, 'calm'),
    tap('father', 'Look! Our root tunnel! Where is the root tunnel?', 'Regarde ! Notre tunnel de racines ! Où est le tunnel ?', 'tunnel', ['It is under the big tree!', 'Il est sous le grand arbre !'], ['root tunnel', 'where']),
    ask('mother', 'Is the root tunnel dark?', 'Est-ce que le tunnel de racines est sombre ?', yesNo(true), ['Look inside the tunnel!', 'Regarde dans le tunnel !'], ['root tunnel', 'dark'], { minTier: 'intermediate', pointAt: 'tunnel', keepOrder: true }),
    tap('mother', 'Where is our leaf bed? Show me!', 'Où est notre lit de feuilles ? Montre-moi !', 'leafbed', ['It is inside the tunnel!', 'Il est dans le tunnel !'], ['leaf bed', 'where']),
    say('actor', 'I sleep in my leaf bed. It is dry and warm!', 'Je dors dans mon lit de feuilles. Il est sec et chaud !', {}, 'calm'),
    act('actor', 'sleep', 'Zzz… Crunch, crunch. What a cosy bed.', 'Zzz… Crouitch, crouitch. Quel lit douillet.', 'actor'),
    say('baby', 'I like the leaf bed! It crunches!', "J'aime le lit de feuilles ! Il craque !", { needs: 'baby' }, 'happy'),
    say('narrator', 'Crunch! Dead leaves are everywhere!', 'Crouitch ! Il y a des feuilles mortes partout !', {}, 'curious'),
    ...countScene('father', 'leaf', [1, 3, 5, 7, 0, 2, 4], { beginner: 3, intermediate: 5, expert: 7 }, 'lf'),
    ...colorHunt('father', 'leaf', 'orange', ['green', 'red', 'yellow'], [1, 3, 5, 7], 'lc'),
    say('actor', "I'm thirsty! Let's go to the stream.", "J'ai soif ! Allons au ruisseau.", {}, 'thirsty'),
    tap('mother', 'Where is the stream? Show me!', 'Où est le ruisseau ? Montre-moi !', 'stream', ['The water is cool!', "L'eau est fraîche !"], ['stream', 'water', 'where']),
    ...drinkScene(sp, 'stream', 'actor'),
    ask('father', 'Is the stream cold?', 'Est-ce que le ruisseau est froid ?', yesNo(true), ['Is it hot or cold?', 'Il est chaud ou froid ?'], ['stream', 'hot', 'cold'], { minTier: 'expert', pointAt: 'stream', keepOrder: true }),
    tap('father', 'Look! A little waterfall! Where is it?', 'Regarde ! Une petite cascade ! Où est-elle ?', 'fall', ['The water falls down!', "L'eau tombe !"], ['little waterfall', 'where'], { minTier: 'intermediate' }),
    say('actor', "I'm hungry! Let's find some food.", "J'ai faim ! Trouvons à manger.", {}, 'thirsty'),
    ...eatScene(sp, [0, 2, 4, 6], 'actor', 'meal'),
    tap('mother', 'Look at the spotted mushroom! Where is it?', 'Regarde le champignon à pois ! Où est-il ?', 'redcap', ['It is red with white spots!', 'Il est rouge avec des points blancs !'], ['spotted mushroom', 'where']),
    say('narrator', 'We only look at the mushroom. We do not eat it!', 'On regarde seulement le champignon. On ne le mange pas !', {}, 'calm'),
    tap('father', 'Where are the strawberries? Show me!', 'Où sont les fraises ? Montre-moi !', 'strawberries', ['They are small and red!', 'Elles sont petites et rouges !'], ['strawberries', 'where']),
    say('narrator', 'Hedgehogs do not eat strawberries. We count them!', 'Les hérissons ne mangent pas les fraises. On les compte !', {}, 'curious'),
    ...countScene('mother', 'strawberry', [1, 3, 5, 7, 0, 2, 4], { beginner: 3, intermediate: 5, expert: 7 }, 'sb'),
    act('actor', ab, SHOW_LINES[ab].en, SHOW_LINES[ab].fr, 'actor'),
    whatCanIDo(sp, { minTier: 'intermediate' }),
    say('baby', 'I can run too! Look at me!', 'Moi aussi, je sais courir ! Regarde-moi !', { needs: 'baby' }, 'proud'),
    hideSeek('mother', 'tunnel', ['Look in the root tunnel!', 'Regarde dans le tunnel de racines !']),
    tap('father', 'Look at the daisies! Where are the daisies?', 'Regarde les marguerites ! Où sont les marguerites ?', 'daisies', ['They are white and yellow!', 'Elles sont blanches et jaunes !'], ['daisies', 'where'], { minTier: 'intermediate' }),
    reward('eu_red_strawberry', 'father', 'A red strawberry! It is our treasure!', 'Une fraise rouge ! C’est notre trésor !'),
    end('mother', 'What a lovely day at the stream!', 'Quelle belle journée au ruisseau !'),
  ];
};

const hogLake = (sp: SpeciesDef): QuestStep[] => {
  const ab = showOff(sp);
  return [
    say('narrator', 'Welcome to the mountain lake! The water is clear and blue.', 'Bienvenue au lac de montagne ! L’eau est claire et bleue.', {}, 'calm'),
    tap('father', 'Look at the big pine! Where is the big pine?', 'Regarde le grand pin ! Où est le grand pin ?', 'pine', ['It is very tall!', 'Il est très grand !'], ['big pine', 'where']),
    ask('mother', 'Is the pine tall?', 'Est-ce que le pin est grand ?', yesNo(true), ['Look up!', 'Regarde en haut !'], ['big pine', 'big'], { minTier: 'intermediate', pointAt: 'pine', keepOrder: true }),
    tap('mother', 'Where is the lake? Show me!', 'Où est le lac ? Montre-moi !', 'lake', ['It is big and blue!', 'Il est grand et bleu !'], ['lake', 'where']),
    ask('father', 'Is the lake blue?', 'Est-ce que le lac est bleu ?', yesNo(true), ['Look at the water!', "Regarde l'eau !"], ['lake', 'blue'], { minTier: 'intermediate', pointAt: 'lake', keepOrder: true }),
    say('actor', "I'm thirsty! Let's go to the lake.", "J'ai soif ! Allons au lac.", {}, 'thirsty'),
    ...drinkScene(sp, 'lake', 'actor'),
    tap('father', 'Look! A waterfall! Where is the waterfall?', 'Regarde ! Une cascade ! Où est la cascade ?', 'fall', ['The water falls into the lake!', "L'eau tombe dans le lac !"], ['waterfall', 'where'], { minTier: 'intermediate' }),
    tap('mother', 'Look at the mountain! Where is the snowy mountain?', 'Regarde la montagne ! Où est la montagne enneigée ?', 'mountain', ['It is far away, with snow on top!', 'Elle est loin, avec de la neige en haut !'], ['snowy mountain', 'where']),
    ask('father', 'Is the mountain white on top?', 'Est-ce que le sommet de la montagne est blanc ?', yesNo(true), ['Look at the top!', 'Regarde en haut !'], ['snowy mountain', 'white'], { minTier: 'expert', pointAt: 'mountain', keepOrder: true }),
    say('actor', "I'm hungry! Let's find some food.", "J'ai faim ! Trouvons à manger.", {}, 'thirsty'),
    ...eatScene(sp, [0, 2, 4, 6], 'actor', 'meal'),
    say('narrator', 'Look! Little pebbles on the shore!', 'Regarde ! De petits cailloux sur la rive !', {}, 'curious'),
    ...countScene('father', 'pebble', [1, 3, 5, 7, 0, 2, 4], { beginner: 3, intermediate: 5, expert: 7 }, 'pb'),
    act('actor', ab, SHOW_LINES[ab].en, SHOW_LINES[ab].fr, 'actor'),
    whatCanIDo(sp, { minTier: 'intermediate' }),
    say('baby', 'I can run too! Look at me!', 'Moi aussi, je sais courir ! Regarde-moi !', { needs: 'baby' }, 'proud'),
    tap('mother', 'Where are the lupins? Show me!', 'Où sont les lupins ? Montre-moi !', 'lupins', ['They are tall and purple!', 'Ils sont grands et violets !'], ['lupins', 'where']),
    ...colorHunt('mother', 'flower', 'purple', ['yellow', 'red', 'white'], [0, 2, 4, 6], 'fl'),
    hideSeek('father', 'rock', ['Look behind the grey rock!', 'Regarde derrière le rocher gris !']),
    tap('father', 'Look at the marigolds! Where are they?', 'Regarde les soucis ! Où sont-ils ?', 'marigolds', ['They are orange!', 'Ils sont orange !'], ['marigolds', 'where'], { minTier: 'intermediate' }),
    reward('eu_blue_pebble', 'mother', 'A blue pebble! It is our treasure!', 'Un caillou bleu ! C’est notre trésor !'),
    end('father', 'What a lovely day at the lake!', 'Quelle belle journée au lac !'),
  ];
};

const hogLog = (sp: SpeciesDef): QuestStep[] => {
  const ab = showOff(sp);
  return [
    say('narrator', 'Welcome to the hollow log! It is our cosy home.', 'Bienvenue au tronc creux ! C’est notre maison douillette.', {}, 'calm'),
    tap('father', 'Look! The hollow log! Where is the hollow log?', 'Regarde ! Le tronc creux ! Où est le tronc creux ?', 'hollowlog', ['It is big and brown!', 'Il est gros et marron !'], ['hollow log', 'where']),
    ask('mother', 'Is the log hollow?', 'Est-ce que le tronc est creux ?', yesNo(true), ['Look inside the log!', 'Regarde dans le tronc !'], ['hollow log', 'dark'], { minTier: 'intermediate', pointAt: 'hollowlog', keepOrder: true }),
    say('actor', 'Our bed is inside the log. It is warm and dry!', 'Notre lit est dans le tronc. Il est chaud et sec !', {}, 'calm'),
    act('actor', 'sleep', 'Zzz… Warm and dry.', 'Zzz… Au chaud et au sec.', 'actor'),
    say('baby', 'I love our hollow log!', "J'adore notre tronc creux !", { needs: 'baby' }, 'love'),
    tap('mother', 'Look at the wood mushrooms! Where are they?', 'Regarde les champignons du bois ! Où sont-ils ?', 'woodcaps', ['They grow on the log!', 'Ils poussent sur le tronc !'], ['wood mushrooms', 'where']),
    say('narrator', 'We only look at the mushrooms. We do not eat them!', 'On regarde seulement les champignons. On ne les mange pas !', {}, 'calm'),
    tap('father', 'Where are the blueberries? Show me!', 'Où sont les myrtilles ? Montre-moi !', 'blueberries', ['They are small and blue!', 'Elles sont petites et bleues !'], ['blueberries', 'where']),
    ask('mother', 'Are the blueberries blue?', 'Est-ce que les myrtilles sont bleues ?', yesNo(true), ['Look at the blueberries!', 'Regarde les myrtilles !'], ['blueberries', 'blue'], { minTier: 'intermediate', pointAt: 'blueberries', keepOrder: true }),
    say('narrator', 'Hedgehogs do not eat blueberries. We count them!', 'Les hérissons ne mangent pas les myrtilles. On les compte !', {}, 'curious'),
    ...countScene('mother', 'blueberry', [1, 3, 5, 7, 0, 2, 4], { beginner: 3, intermediate: 5, expert: 7 }, 'bl'),
    tap('father', 'Look at the red berries! Where are they?', 'Regarde les baies rouges ! Où sont-elles ?', 'redberries', ['They are on the left!', 'Elles sont à gauche !'], ['red berries', 'where'], { minTier: 'intermediate' }),
    say('actor', "I'm hungry! Let's find some food.", "J'ai faim ! Trouvons à manger.", {}, 'thirsty'),
    ...eatScene(sp, [0, 2, 4, 6], 'actor', 'meal'),
    act('actor', ab, SHOW_LINES[ab].en, SHOW_LINES[ab].fr, 'actor'),
    whatCanIDo(sp, { minTier: 'intermediate' }),
    say('baby', 'I can run too! Look at me!', 'Moi aussi, je sais courir ! Regarde-moi !', { needs: 'baby' }, 'proud'),
    tap('mother', 'Where is the big trunk? Show me!', 'Où est le gros tronc ? Montre-moi !', 'trunk', ['It is the biggest tree!', "C'est le plus grand arbre !"], ['big trunk', 'where']),
    hideSeek('father', 'trunk', ['Look behind the big trunk!', 'Regarde derrière le gros tronc !']),
    say('narrator', 'Yellow flowers grow in the sun!', 'Des fleurs jaunes poussent au soleil !', {}, 'happy'),
    ...colorHunt('mother', 'flower', 'yellow', ['purple', 'red', 'white'], [0, 2, 4, 6], 'fl'),
    tap('father', 'Look at the green hill! Where is the hill?', 'Regarde la colline verte ! Où est la colline ?', 'hill', ['It is far away!', 'Elle est loin !'], ['green hill', 'where'], { minTier: 'intermediate' }),
    reward('eu_blueberry', 'father', 'A blueberry! It is our treasure!', 'Une myrtille ! C’est notre trésor !'),
    end('mother', 'What a cosy day at the hollow log!', 'Quelle douce journée au tronc creux !'),
  ];
};

export const EUROPE: AdventurePack = {
  adventures: [
    // 2026-11-23 : les décors du renard
    { id: 'europe_fox_glade', continentId: 'europe', titleEn: 'The glade at sunset', titleFr: 'La clairière au soleil couchant', icon: '🌅', start: 'europe_fox_glade', species: ['fox'], skillIds: ['1.2', '1.3', '1.6'], steps: foxGlade, treasure: 'eu_purple_flower', order: 5 },
    { id: 'europe_fox_autumn', continentId: 'europe', titleEn: 'The cosy burrow', titleFr: 'Le terrier douillet', icon: '🍁', start: 'europe_fox_autumn', species: ['fox'], skillIds: ['1.6', '1.3', '3.3'], steps: foxAutumn, treasure: 'eu_orange_maple_leaf', order: 6 },
    { id: 'europe_fox_snow', continentId: 'europe', titleEn: 'Tracks in the snow', titleFr: 'Des traces dans la neige', icon: '❄️', start: 'europe_fox_snow', species: ['fox'], skillIds: ['1.7', '2.7', '1.2'], steps: foxSnow, treasure: 'eu_white_feather', order: 7 },
    // 2026-11-23 : les décors du hibou
    { id: 'europe_owl_nest', continentId: 'europe', titleEn: 'The owl tree', titleFr: "L'arbre du hibou", icon: '🦉', start: 'europe_owl_nest', species: ['owl'], skillIds: ['1.2', '1.3', '1.6'], steps: owlNest, treasure: 'eu_brown_feather', order: 8 },
    { id: 'europe_owl_moon', continentId: 'europe', titleEn: 'A night on the branch', titleFr: 'Une nuit sur la branche', icon: '🌙', start: 'europe_owl_moon', species: ['owl'], skillIds: ['1.1', '1.3', '3.3'], steps: owlMoon, treasure: 'eu_moon_stone', order: 9 },
    { id: 'europe_owl_oak', continentId: 'europe', titleEn: 'The big oak', titleFr: 'Le grand chêne', icon: '🌰', start: 'europe_owl_oak', species: ['owl'], skillIds: ['1.6', '1.3', '2.3'], steps: owlOak, treasure: 'eu_golden_acorn', order: 10 },
    // 2026-11-23 : les décors du hérisson
    { id: 'europe_hog_stream', continentId: 'europe', titleEn: 'The stream and the leaf bed', titleFr: 'Le ruisseau et le lit de feuilles', icon: '🍓', start: 'europe_hog_stream', species: ['hedgehog'], skillIds: ['1.2', '2.3', '1.6'], steps: hogStream, treasure: 'eu_red_strawberry', order: 11 },
    { id: 'europe_hog_lake', continentId: 'europe', titleEn: 'The mountain lake', titleFr: 'Le lac de montagne', icon: '🏔️', start: 'europe_hog_lake', species: ['hedgehog'], skillIds: ['1.7', '1.3', '2.3'], steps: hogLake, treasure: 'eu_blue_pebble', order: 12 },
    { id: 'europe_hog_log', continentId: 'europe', titleEn: 'The hollow log', titleFr: 'Le tronc creux', icon: '🫐', start: 'europe_hog_log', species: ['hedgehog'], skillIds: ['1.2', '1.3', '2.3'], steps: hogLog, treasure: 'eu_blueberry', order: 13 },
  ],
  treasures: [
    treasure('eu_golden_acorn', 'a golden acorn', 'un gland doré', '🌰'),
    treasure('eu_red_apple', 'a red apple', 'une pomme rouge', '🍎'),
    treasure('eu_moon_stone', 'a moon stone', 'une pierre de lune', '🌙'),
    treasure('eu_postcard', 'a postcard', 'une carte postale', '💌'),
    treasure('eu_purple_flower', 'a purple flower', 'une fleur violette', '🪻'),
    treasure('eu_orange_maple_leaf', 'an orange maple leaf', 'une feuille d’érable orange', '🍁'),
    treasure('eu_white_feather', 'a white feather', 'une plume blanche', '🪶'),
    treasure('eu_brown_feather', 'a brown feather', 'une plume marron', '🪶'),
    treasure('eu_red_strawberry', 'a red strawberry', 'une fraise rouge', '🍓'),
    treasure('eu_blue_pebble', 'a blue pebble', 'un caillou bleu', '🪨'),
    treasure('eu_blueberry', 'a blueberry', 'une myrtille', '🫐'),
  ],
};

/** Aventures sorties des parcours (leur départ n'est plus un décor de la famille). Gardées pour un retour
 *  arrière ; leur trésor reste connu pour les passeports qui l'ont déjà. */
export const RETIRED_EUROPE: AdventureDef[] = [
  { id: 'europe_autumn_walk', continentId: 'europe', titleEn: 'The autumn walk', titleFr: "La balade d'automne", icon: '🍂', start: 'europe_forest', species: ['fox', 'owl', 'hedgehog'], skillIds: ['1.6', '1.3', '1.2'], steps: autumnWalk, treasure: 'eu_golden_acorn', order: 1 },
  { id: 'europe_apple_day', continentId: 'europe', titleEn: 'Apple day', titleFr: 'Le jour des pommes', icon: '🍎', start: 'europe_farm', species: ['fox', 'owl', 'hedgehog'], skillIds: ['1.2', '1.3', '2.3'], steps: appleDay, treasure: 'eu_red_apple', order: 2 },
  { id: 'europe_lake_night', continentId: 'europe', titleEn: 'Night at the lake', titleFr: 'Une nuit au lac', icon: '🌙', start: 'europe_lake', species: ['fox', 'owl'], skillIds: ['1.1', '1.3', '3.3'], steps: lakeNight, treasure: 'eu_moon_stone', order: 3 },
  { id: 'europe_big_trip', continentId: 'europe', titleEn: 'The big trip', titleFr: "La grande excursion", icon: '🧭', start: 'europe_forest', species: ['fox', 'hedgehog'], skillIds: ['1.7', '2.7', '3.2'], steps: bigTrip, treasure: 'eu_postcard', order: 4 },
];
