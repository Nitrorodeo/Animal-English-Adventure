/**
 * Aventures d'Amérique du Nord : érables rouges du lac des Rocheuses, séquoias géants, grande
 * prairie et désert des roches rouges, pluie et arc-en-ciel (avec un détour par la côte pour
 * l'ours). Ours, bison et castor n'ont pas les mêmes habitats : chaque histoire reste dans les
 * lieux de ses espèces.
 */
import type { QuestStep, SpeciesDef } from '../types';
import {
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

/** Capacité mise en scène selon l'espèce (nager si elle sait, sinon courir). */
const waterAbility = (sp: SpeciesDef) => (canDo(sp, 'swim') ? 'swim' : 'run');

// ---------------------------------------------------------------------------
// 1. Le défilé des feuilles d'érable — au lac des Rocheuses (ours, bison, castor)
// ---------------------------------------------------------------------------

const mapleParade = (sp: SpeciesDef): QuestStep[] => {
  const ab = waterAbility(sp);
  const swims = ab === 'swim';
  return [
    say('narrator', "It's autumn at the mountain lake. The leaves are falling!", "C'est l'automne au lac de montagne. Les feuilles tombent !"),
    tap('father', 'Look at the big maple tree! Where is it?', "Regarde le grand érable ! Où est-il ?", 'maple', ['It is the tree with red leaves!', "C'est l'arbre aux feuilles rouges !"], ['maple tree', 'where']),
    ask('mother', 'What colour are the maple leaves?', "De quelle couleur sont les feuilles d'érable ?", [ok('Red!', 'Rouges !', '🔴'), no('Blue!', 'Bleues !', '🔵'), no('Purple!', 'Violettes !', '🟣'), no('Pink!', 'Roses !', '🩷')], ['Look at the tree! Red, red, red!', "Regarde l'arbre ! Rouge, rouge, rouge !"], ['red', 'leaf'], { pointAt: 'maple', onCorrect: L('Yes! Red maple leaves!', "Oui ! Des feuilles d'érable rouges !") }),
    say('baby', 'Look! The leaves are dancing!', 'Regarde ! Les feuilles dansent !', { needs: 'baby' }, 'happy'),
    say('narrator', 'Leaves of many colours are on the ground.', 'Il y a des feuilles de plusieurs couleurs par terre.', {}, 'curious'),
    ...colorHunt('mother', 'leaf', 'orange', ['red', 'yellow', 'green'], [0, 1, 6, 7], 'oleaf'),
    say('father', "Let's count the maple leaves!", "Comptons les feuilles d'érable !", {}, 'happy'),
    ...countScene('father', 'maple_leaf', [0, 1, 2, 3, 4, 5], { beginner: 3, intermediate: 4, expert: 5 }, 'mleaf'),
    ask('father', 'Is the maple tree red?', "Est-ce que l'érable est rouge ?", yesNo(true), ['Look at the leaves!', 'Regarde les feuilles !'], ['maple tree', 'red'], { minTier: 'intermediate', pointAt: 'maple', keepOrder: true }),
    say('mother', "The lake is so big and blue. Let's have a drink!", "Le lac est si grand et si bleu. Allons boire !", {}, 'calm'),
    ...drinkScene(sp, 'lake', 'actor'),
    act('baby', 'splash', 'Splash! The lake is cold!', "Splash ! Le lac est froid !", 'baby', { needs: 'baby' }),
    tap('father', 'Look! A canoe on the lake! Where is the canoe?', 'Regarde ! Un canoë sur le lac ! Où est le canoë ?', 'canoe', ['It is a little boat!', "C'est un petit bateau !"], ['canoe', 'where']),
    ask('mother', 'Is the canoe red or blue?', 'Le canoë est rouge ou bleu ?', [ok("It's red!", 'Il est rouge !', '🔴'), no("It's blue!", 'Il est bleu !', '🔵')], ['Look at the boat!', 'Regarde le bateau !'], ['canoe', 'red'], { minTier: 'intermediate', pointAt: 'canoe', keepOrder: true }),
    seek('mother', 'sibling', 'maple', {
      line: ['Oh! Somebody is hiding in the leaves! Can you find them?', "Oh ! Quelqu'un se cache dans les feuilles ! Tu peux le trouver ?"],
      hint: ['Look at the big maple tree!', "Regarde le grand érable !"],
      notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
      found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
    }, ['hide_and_seek', 'maple tree'], { needs: 'sibling', minTier: 'intermediate' }),
    act('actor', ab, swims ? 'Look at me! I swim in the lake!' : 'Look at me! I run by the lake!', swims ? 'Regarde-moi ! Je nage dans le lac !' : 'Regarde-moi ! Je cours au bord du lac !', 'actor'),
    ask('actor', 'What can I do?', "Qu'est-ce que je sais faire ?", [ok(swims ? 'I can swim!' : 'I can run!', swims ? 'Je sais nager !' : 'Je sais courir !', swims ? '🏊' : '🏃'), no('I can fly!', 'Je sais voler !', '🪽'), no('I can drive a car!', 'Je sais conduire une voiture !', '🚗')], [swims ? 'Look! I swim!' : 'Look! I run!', swims ? 'Regarde ! Je nage !' : 'Regarde ! Je cours !'], ['can', ab], { minTier: 'expert' }),
    say('narrator', 'A big red leaf falls slowly… right to you!', 'Une grande feuille rouge tombe doucement… juste devant vous !', {}, 'curious'),
    reward('na_red_maple_leaf', 'mother', 'A red maple leaf! It is our treasure!', "Une feuille d'érable rouge ! C'est notre trésor !"),
    end('father', 'What a pretty autumn day!', 'Quelle jolie journée d’automne !'),
  ];
};

// ---------------------------------------------------------------------------
// 2. Les arbres géants — séquoias, puis le lac (ours, castor)
// ---------------------------------------------------------------------------

const giantTrees = (sp: SpeciesDef): QuestStep[] => {
  const climbs = canDo(sp, 'climb');
  const ab = climbs ? 'climb' : 'dig';
  return [
    say('narrator', 'We are in the redwood forest. The trees are very, very tall!', 'Nous sommes dans la forêt de séquoias. Les arbres sont très, très hauts !'),
    tap('father', 'Find the biggest tree! Where is the redwood?', "Trouve le plus gros arbre ! Où est le séquoia ?", 'redwood', ['It is the giant tree!', "C'est l'arbre géant !"], ['redwood', 'big', 'where']),
    ask('mother', 'Is the redwood big or small?', 'Le séquoia est grand ou petit ?', [ok("It's big!", 'Il est grand !', '🌲'), no("It's small!", 'Il est petit !', '🌱')], ['Look up! It touches the sky!', 'Regarde en haut ! Il touche le ciel !'], ['redwood', 'big', 'small'], { keepOrder: true, pointAt: 'redwood', onCorrect: L('Yes! It is a giant tree!', "Oui ! C'est un arbre géant !") }),
    say('baby', 'Wow! I look up, up, up!', 'Waouh ! Je regarde en haut, en haut, en haut !', { needs: 'baby' }, 'curious'),
    tap('mother', 'Follow the path under the trees! Where is the path?', 'Suivons le chemin sous les arbres ! Où est le chemin ?', 'path', ['Look down! Find the path!', 'Regarde en bas ! Trouve le chemin !'], ['path', 'follow_the_path']),
    moveTo('path', 'walk', 'father'),
    say('father', 'Shh! Walk, walk, walk. The forest is quiet.', 'Chut ! Marche, marche, marche. La forêt est calme.', {}, 'calm'),
    back('father'),
    say('narrator', 'Look! There are pine cones on the ground!', 'Regarde ! Il y a des pommes de pin par terre !', {}, 'curious'),
    ...countScene('mother', 'pinecone', [0, 1, 3, 4, 5, 6], { beginner: 3, intermediate: 4, expert: 6 }, 'cone'),
    tap('father', 'Look at the fern! Where is the fern?', 'Regarde la fougère ! Où est la fougère ?', 'fern', ['It is a green plant!', "C'est une plante verte !"], ['fern', 'green', 'where']),
    ask('mother', 'Is the fern green?', 'Est-ce que la fougère est verte ?', yesNo(true), ['Look at the fern!', 'Regarde la fougère !'], ['fern', 'green'], { minTier: 'intermediate', pointAt: 'fern', keepOrder: true }),
    ...colorHunt('father', 'flower', 'pink', ['yellow', 'red', 'purple'], [1, 2, 3, 4], 'rflower'),
    ...(climbs
      ? [
          say('actor', 'The redwood is so big! I can climb it!', "Le séquoia est si grand ! Je sais le grimper !", {}, 'proud'),
          act('actor', 'climb', 'Up, up, up! I climb the tree!', "En haut, en haut, en haut ! Je grimpe à l'arbre !", 'actor'),
        ]
      : [
          tap('father', 'Look at the roots! Where is the root?', 'Regarde les racines ! Où est la racine ?', 'root', ['It is under the tree!', "C'est sous l'arbre !"], ['root', 'where']),
          act('actor', 'dig', 'Dig, dig, dig! I dig near the roots!', 'Creuse, creuse, creuse ! Je creuse près des racines !', 'actor'),
        ]),
    ask('actor', 'What can I do?', "Qu'est-ce que je sais faire ?", [ok(climbs ? 'I can climb!' : 'I can dig!', climbs ? 'Je sais grimper !' : 'Je sais creuser !', climbs ? '🧗' : '🕳️'), no('I can fly!', 'Je sais voler !', '🪽'), no('I can drive a car!', 'Je sais conduire une voiture !', '🚗')], [climbs ? 'Look! I climb!' : 'Look! I dig!', climbs ? 'Regarde ! Je grimpe !' : 'Regarde ! Je creuse !'], ['can', ab], { minTier: 'intermediate' }),
    seek('mother', 'sibling', 'trunk', {
      line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
      hint: ['Look behind the big trunk!', 'Regarde derrière le gros tronc !'],
      notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
      found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
    }, ['hide_and_seek', 'behind', 'trunk'], { needs: 'sibling', minTier: 'intermediate' }),
    say('father', "I'm hungry! Let's go to the mountain lake!", "J'ai faim ! Allons au lac de montagne !", {}, 'happy'),
    go('na_lake', 'father', "Let's go to the lake!", 'Allons au lac !'),
    say('narrator', 'Here is the lake. The maple leaves are red and orange!', "Voici le lac. Les feuilles d'érable sont rouges et orange !"),
    ...eatScene(sp, [0, 1, 6, 7], 'actor', 'meal'),
    ...drinkScene(sp, 'lake', 'actor'),
    act('baby', 'splash', 'Splash! I love the lake!', "Splash ! J'adore le lac !", 'baby', { needs: 'baby' }),
    ask('father', 'Is the lake blue?', 'Est-ce que le lac est bleu ?', yesNo(true), ['Look at the water!', "Regarde l'eau !"], ['lake', 'blue'], { minTier: 'expert', pointAt: 'lake', keepOrder: true }),
    reward('na_giant_cone', 'mother', 'A giant pine cone from the redwood! It is our treasure!', 'Une pomme de pin géante du séquoia ! C’est notre trésor !'),
    end('father', 'What a great day with the giant trees!', 'Quelle belle journée avec les arbres géants !'),
  ];
};

// ---------------------------------------------------------------------------
// 3. La course dans la prairie — prairie, désert des roches rouges, puis le lac (bison)
// ---------------------------------------------------------------------------

const prairieRun = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'Welcome to the big prairie! The grass is tall and yellow.', 'Bienvenue dans la grande prairie ! L’herbe est haute et jaune.'),
  tap('father', 'Where is the grass? Show me!', "Où est l'herbe ? Montre-moi !", 'grass', ['It is yellow, all around us!', "C'est jaune, tout autour de nous !"], ['grass', 'where']),
  ...eatScene(sp, [0, 2, 4, 6], 'actor', 'meal'),
  tap('mother', 'Look far away! Where is the mountain?', 'Regarde au loin ! Où est la montagne ?', 'mountain', ['It is big and far away!', "Elle est grande et loin d'ici !"], ['mountain', 'big', 'where']),
  ask('mother', 'What colour is the mountain?', 'De quelle couleur est la montagne ?', [ok('White!', 'Blanche !', '⚪'), no('Pink!', 'Rose !', '🩷'), no('Green!', 'Verte !', '🟢'), no('Orange!', 'Orange !', '🟠')], ['There is snow on top!', 'Il y a de la neige en haut !'], ['mountain', 'white'], { minTier: 'intermediate', pointAt: 'mountain', onCorrect: L('Yes! A white mountain!', 'Oui ! Une montagne blanche !') }),
  tap('father', 'Look up! Where is the cloud?', 'Regarde en haut ! Où est le nuage ?', 'cloud', ['It is white, in the sky!', 'Il est blanc, dans le ciel !'], ['cloud', 'where'], { minTier: 'intermediate' }),
  say('father', 'The prairie is so big! Who wants to run?', 'La prairie est si grande ! Qui veut courir ?', {}, 'happy'),
  act('actor', 'run', 'Zoom! I run on the prairie!', 'Zoum ! Je cours dans la prairie !', 'actor'),
  say('baby', 'Wait for me! I run too!', 'Attends-moi ! Je cours aussi !', { needs: 'baby' }, 'happy'),
  ask('actor', 'What can I do?', "Qu'est-ce que je sais faire ?", [ok('I can run!', 'Je sais courir !', '🏃'), no('I can fly!', 'Je sais voler !', '🪽'), no('I can drive a car!', 'Je sais conduire une voiture !', '🚗')], ['Look! I run!', 'Regarde ! Je cours !'], ['can', 'run'], { minTier: 'expert' }),
  tap('mother', 'The red rock desert is far away. Follow the path! Where is the path?', 'Le désert des roches rouges est loin. Suivons le chemin ! Où est le chemin ?', 'path', ['Find the path on the grass!', "Trouve le chemin dans l'herbe !"], ['path', 'follow_the_path']),
  moveTo('path', 'walk', 'mother'),
  go('na_desert', 'mother', "Let's go to the red rock desert!", 'Allons au désert des roches rouges !'),
  say('narrator', 'Wow! The rocks are red and the sun is very hot!', 'Waouh ! Les rochers sont rouges et le soleil est très chaud !'),
  ask('father', 'How is the weather today?', 'Quel temps fait-il aujourd’hui ?', [ok("It's hot!", 'Il fait chaud !', '🥵'), no("It's snowy!", 'Il neige !', '🌨️'), no("It's rainy!", 'Il pleut !', '🌧️'), no("It's cold!", 'Il fait froid !', '🥶')], ['Look at the big sun!', 'Regarde le grand soleil !'], ['weather', 'hot'], { pointAt: 'sun', onCorrect: L("Yes! It's very hot!", 'Oui ! Il fait très chaud !') }),
  props([prop('hat', 'hat', 0), prop('coat', 'coat', 1)], { maxTier: 'beginner' }),
  props([prop('hat', 'hat', 0), prop('coat', 'coat', 1), prop('sunglasses', 'sunglasses', 2), prop('gloves', 'gloves', 3)], { minTier: 'intermediate' }),
  tapProps('mother', "It's hot! We need a hat. Find the hat!", 'Il fait chaud ! Il nous faut un chapeau. Trouve le chapeau !', ['hat'], ['A hat for the sun!', 'Un chapeau pour le soleil !'], ['hat', 'need'], {
    maxTier: 'beginner',
    onCorrect: L('Yes! A hat for the sun!', 'Oui ! Un chapeau pour le soleil !'),
    wrong: { coat: L("A coat? No! It's too hot!", 'Un manteau ? Non ! Il fait trop chaud !') },
  }),
  tapProps('mother', "It's hot! Find the hat and the sunglasses!", 'Il fait chaud ! Trouve le chapeau et les lunettes de soleil !', ['hat', 'sunglasses'], ['Things for the sun!', 'Des choses pour le soleil !'], ['hat', 'sunglasses', 'need'], {
    minTier: 'intermediate',
    onCorrect: L('Great! We are ready for the sun!', 'Super ! Nous sommes prêts pour le soleil !'),
    wrong: { coat: L("A coat? No! It's too hot!", 'Un manteau ? Non ! Il fait trop chaud !'), gloves: L("Gloves? No! It's too hot!", 'Des gants ? Non ! Il fait trop chaud !') },
  }),
  clearProps(),
  tap('father', 'Look! A big red arch! Where is the arch?', "Regarde ! Une grande arche rouge ! Où est l'arche ?", 'arch', ['It is a big red stone door!', "C'est une grande porte de pierre rouge !"], ['arch', 'red', 'where']),
  ask('mother', 'Is the arch red?', "Est-ce que l'arche est rouge ?", yesNo(true), ['Look at the stone!', 'Regarde la pierre !'], ['arch', 'red'], { minTier: 'intermediate', pointAt: 'arch', keepOrder: true }),
  tap('mother', 'Careful! A cactus is very prickly. Where is the cactus?', 'Attention ! Un cactus pique beaucoup. Où est le cactus ?', 'cactus', ['It is a green plant with spikes!', "C'est une plante verte avec des piquants !"], ['cactus', 'where']),
  tap('father', 'Now find the tall cactus!', 'Maintenant, trouve le grand cactus !', 'tallcactus', ['It is the biggest one!', "C'est le plus grand !"], ['tall cactus', 'big'], { minTier: 'expert' }),
  seek('mother', 'sibling', 'rock', {
    line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
    hint: ['Look behind the big rock!', 'Regarde derrière le gros rocher !'],
    notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
    found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
  }, ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
  say('narrator', 'Look! Red pebbles are on the sand!', 'Regarde ! Il y a des cailloux rouges sur le sable !', {}, 'curious'),
  ...colorHunt('mother', 'pebble', 'red', ['yellow', 'white', 'blue'], [1, 2, 6, 7], 'dpebble'),
  say('father', "Phew! I'm thirsty! Let's go to the lake!", "Ouf ! J'ai soif ! Allons au lac !", {}, 'thirsty'),
  go('na_lake', 'father', "Let's go to the mountain lake!", 'Allons au lac de montagne !'),
  say('narrator', 'Here is the lake. The water is cool and blue!', "Voici le lac. L'eau est fraîche et bleue !"),
  ...drinkScene(sp, 'lake', 'actor'),
  act('baby', 'splash', 'Splash! The water is cool!', "Splash ! L'eau est fraîche !", 'baby', { needs: 'baby' }),
  reward('na_red_pebble', 'father', 'A red pebble from the desert! It is our treasure!', 'Un caillou rouge du désert ! C’est notre trésor !'),
  end('mother', 'What a great trip across the prairie!', 'Quel beau voyage à travers la prairie !'),
];

// ---------------------------------------------------------------------------
// 4. Après la pluie — averse au lac, arc-en-ciel ; l'ours prolonge jusqu'à la côte
// ---------------------------------------------------------------------------

const rainbowAfterRain = (sp: SpeciesDef): QuestStep[] => {
  const ab = waterAbility(sp);
  const swims = ab === 'swim';
  const coast: QuestStep[] =
    sp.id === 'bear'
      ? [
          say('father', 'Now we go to the sea! The bears love the coast.', "Maintenant, allons à la mer ! Les ours aiment la côte."),
          go('na_coast', 'father', "Let's go to the rocky coast!", 'Allons à la côte rocheuse !'),
          tap('mother', 'Look! A tall lighthouse! Where is the lighthouse?', 'Regarde ! Un grand phare ! Où est le phare ?', 'lighthouse', ['It has a big light!', 'Il a une grande lumière !'], ['lighthouse', 'where']),
          ask('father', 'Is the lighthouse tall?', 'Est-ce que le phare est grand ?', yesNo(true), ['Look up high!', 'Regarde tout en haut !'], ['lighthouse', 'big'], { minTier: 'intermediate', pointAt: 'lighthouse', keepOrder: true }),
          tap('mother', 'Where is the sea? Show me!', 'Où est la mer ? Montre-moi !', 'sea', ['It is blue, with waves!', "C'est bleu, avec des vagues !"], ['sea', 'where']),
          moveTo('sand', 'walk', 'actor'),
          act('actor', 'swim', 'Splash! I swim in the sea!', 'Splash ! Je nage dans la mer !', 'actor'),
          back('actor'),
          say('narrator', 'The waves bring shells to the sand!', 'Les vagues apportent des coquillages sur le sable !', {}, 'curious'),
          ...countScene('mother', 'shell', [2, 3, 4, 7, 5, 6], { beginner: 3, intermediate: 4, expert: 5 }, 'shell'),
        ]
      : [];
  return [
    say('narrator', 'Grey clouds come to the lake. Oh! Rain, rain, rain!', 'Des nuages gris arrivent au lac. Oh ! De la pluie, de la pluie, de la pluie !', {}, 'curious'),
    tap('father', 'Look up! Where is the big cloud?', 'Regarde en haut ! Où est le gros nuage ?', 'cloud', ['It is in the sky!', 'Il est dans le ciel !'], ['cloud', 'where']),
    ask('mother', 'How is the weather now?', 'Quel temps fait-il maintenant ?', [ok("It's rainy!", 'Il pleut !', '🌧️'), no("It's sunny!", 'Il fait beau !', '☀️'), no("It's snowy!", 'Il neige !', '🌨️'), no("It's hot!", 'Il fait chaud !', '🥵')], ['Look! Drip, drip, drip!', 'Regarde ! Plic, plic, plic !'], ['weather', 'cold'], { onCorrect: L("Yes! It's rainy!", 'Oui ! Il pleut !') }),
    props([prop('umbrella', 'umbrella', 0), prop('sunglasses', 'sunglasses', 1)], { maxTier: 'beginner' }),
    props([prop('umbrella', 'umbrella', 0), prop('boots', 'boots', 1), prop('sunglasses', 'sunglasses', 2), prop('hat', 'hat', 3)], { minTier: 'intermediate' }),
    tapProps('father', "It's rainy! We need an umbrella. Find the umbrella!", "Il pleut ! Il nous faut un parapluie. Trouve le parapluie !", ['umbrella'], ['An umbrella for the rain!', 'Un parapluie pour la pluie !'], ['umbrella', 'need'], {
      maxTier: 'beginner',
      onCorrect: L('Yes! An umbrella for the rain!', 'Oui ! Un parapluie pour la pluie !'),
      wrong: { sunglasses: L("Sunglasses? No! There is no sun!", "Des lunettes de soleil ? Non ! Il n'y a pas de soleil !") },
    }),
    tapProps('father', "It's rainy! Find the umbrella and the boots!", 'Il pleut ! Trouve le parapluie et les bottes !', ['umbrella', 'boots'], ['Things for the rain!', 'Des choses pour la pluie !'], ['umbrella', 'boots', 'need'], {
      minTier: 'intermediate',
      onCorrect: L('Great! We are ready for the rain!', 'Super ! Nous sommes prêts pour la pluie !'),
      wrong: { sunglasses: L("Sunglasses? No! There is no sun!", "Des lunettes de soleil ? Non ! Il n'y a pas de soleil !"), hat: L('A hat? We need boots and an umbrella!', 'Un chapeau ? Il nous faut des bottes et un parapluie !') },
    }),
    clearProps(),
    say('baby', 'Splash! I like the rain!', "Splash ! J'aime la pluie !", { needs: 'baby' }, 'happy'),
    tap('mother', 'Listen! The waterfall is loud! Where is the waterfall?', 'Écoute ! La cascade fait du bruit ! Où est la cascade ?', 'waterfall', ['It is water falling down!', "C'est de l'eau qui tombe !"], ['waterfall', 'water', 'where']),
    ask('father', 'Is the waterfall wet?', 'Est-ce que la cascade est mouillée ?', yesNo(true), ['Look at the water!', "Regarde l'eau !"], ['waterfall', 'water'], { minTier: 'intermediate', pointAt: 'waterfall', keepOrder: true }),
    say('narrator', 'The rain stops. The sun comes out. Look! A rainbow!', "La pluie s'arrête. Le soleil sort. Regarde ! Un arc-en-ciel !", {}, 'happy'),
    say('mother', 'The rainbow has so many colours!', "L'arc-en-ciel a tant de couleurs !", {}, 'happy'),
    ...colorHunt('father', 'feather', 'blue', ['red', 'yellow', 'green'], [0, 1, 6, 7], 'rfeather'),
    say('narrator', 'Pebbles shine on the shore after the rain.', 'Des cailloux brillent au bord du lac après la pluie.', {}, 'curious'),
    ...countScene('mother', 'pebble', [0, 1, 2, 3, 4, 5], { beginner: 3, intermediate: 4, expert: 5 }, 'wpebble'),
    tap('father', 'Where is the canoe? It is wet too!', 'Où est le canoë ? Il est mouillé aussi !', 'canoe', ['It is a little boat!', "C'est un petit bateau !"], ['canoe', 'where'], { minTier: 'intermediate' }),
    ...drinkScene(sp, 'lake', 'actor'),
    act('actor', ab, swims ? 'Look at me! I swim in the lake!' : 'Look at me! I run by the lake!', swims ? 'Regarde-moi ! Je nage dans le lac !' : 'Regarde-moi ! Je cours au bord du lac !', 'actor'),
    seek('mother', 'sibling', 'rock', {
      line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
      hint: ['Look behind the big rock!', 'Regarde derrière le gros rocher !'],
      notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
      found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
    }, ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
    ...coast,
    reward('na_rainbow_stone', 'mother', 'A rainbow stone! It is our treasure!', 'Une pierre arc-en-ciel ! C’est notre trésor !'),
    end('father', 'What a beautiful rainbow!', 'Quel bel arc-en-ciel !'),
  ];
};

export const NORTH_AMERICA: AdventurePack = {
  adventures: [
    { id: 'north_america_maple_parade', continentId: 'north_america', titleEn: 'The maple leaf parade', titleFr: "Le défilé des feuilles d'érable", icon: '🍁', start: 'na_lake', species: ['bear', 'bison', 'beaver'], skillIds: ['1.2', '1.3', '2.3'], steps: mapleParade, treasure: 'na_red_maple_leaf', order: 1 },
    { id: 'north_america_giant_trees', continentId: 'north_america', titleEn: 'The giant trees', titleFr: 'Les arbres géants', icon: '🌲', start: 'na_redwoods', species: ['bear', 'beaver'], skillIds: ['1.4', '2.2', '1.6'], steps: giantTrees, treasure: 'na_giant_cone', order: 2 },
    { id: 'north_america_prairie_run', continentId: 'north_america', titleEn: 'The big prairie run', titleFr: 'La course dans la grande prairie', icon: '🦬', start: 'na_prairie', species: ['bison'], skillIds: ['1.7', '2.7', '3.2'], steps: prairieRun, treasure: 'na_red_pebble', order: 3 },
    { id: 'north_america_rainbow', continentId: 'north_america', titleEn: 'The rainbow after the rain', titleFr: "L'arc-en-ciel après la pluie", icon: '🌈', start: 'na_lake', species: ['bear', 'bison', 'beaver'], skillIds: ['1.7', '2.7', '1.2'], steps: rainbowAfterRain, treasure: 'na_rainbow_stone', order: 4 },
  ],
  treasures: [
    treasure('na_red_maple_leaf', 'a red maple leaf', "une feuille d'érable rouge", '🍁'),
    treasure('na_giant_cone', 'a giant pine cone', 'une pomme de pin géante', '🌲'),
    treasure('na_red_pebble', 'a red pebble', 'un caillou rouge', '🔴'),
    treasure('na_rainbow_stone', 'a rainbow stone', 'une pierre arc-en-ciel', '🌈'),
  ],
};
