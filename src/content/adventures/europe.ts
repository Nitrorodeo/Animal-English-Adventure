/**
 * Aventures d'Europe : forêt d'automne, ferme, lac de la forêt, montagne et côte.
 * Renard, hibou et hérisson vivent chacun au moins trois aventures ; le hibou vole et aime la nuit,
 * le hérisson ne saute pas, le renard saute et court. Les lieux visités respectent les habitats
 * de chaque espèce (le renard va aux Alpes, le hérisson à la côte, le hibou au lac).
 */
import type { QuestStep, SpeciesDef } from '../types';
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

export const EUROPE: AdventurePack = {
  adventures: [
    { id: 'europe_autumn_walk', continentId: 'europe', titleEn: 'The autumn walk', titleFr: "La balade d'automne", icon: '🍂', start: 'europe_forest', species: ['fox', 'owl', 'hedgehog'], skillIds: ['1.6', '1.3', '1.2'], steps: autumnWalk, treasure: 'eu_golden_acorn', order: 1 },
    { id: 'europe_apple_day', continentId: 'europe', titleEn: 'Apple day', titleFr: 'Le jour des pommes', icon: '🍎', start: 'europe_farm', species: ['fox', 'owl', 'hedgehog'], skillIds: ['1.2', '1.3', '2.3'], steps: appleDay, treasure: 'eu_red_apple', order: 2 },
    { id: 'europe_lake_night', continentId: 'europe', titleEn: 'Night at the lake', titleFr: 'Une nuit au lac', icon: '🌙', start: 'europe_lake', species: ['fox', 'owl'], skillIds: ['1.1', '1.3', '3.3'], steps: lakeNight, treasure: 'eu_moon_stone', order: 3 },
    { id: 'europe_big_trip', continentId: 'europe', titleEn: 'The big trip', titleFr: "La grande excursion", icon: '🧭', start: 'europe_forest', species: ['fox', 'hedgehog'], skillIds: ['1.7', '2.7', '3.2'], steps: bigTrip, treasure: 'eu_postcard', order: 4 },
  ],
  treasures: [
    treasure('eu_golden_acorn', 'a golden acorn', 'un gland doré', '🌰'),
    treasure('eu_red_apple', 'a red apple', 'une pomme rouge', '🍎'),
    treasure('eu_moon_stone', 'a moon stone', 'une pierre de lune', '🌙'),
    treasure('eu_postcard', 'a postcard', 'une carte postale', '💌'),
  ],
};
