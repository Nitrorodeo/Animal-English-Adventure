/**
 * Aventures d'Amérique du Nord : érables rouges du lac des Rocheuses, séquoias géants, grande
 * prairie et désert des roches rouges, pluie et arc-en-ciel (avec un détour par la côte pour
 * l'ours). Ours, bison et castor n'ont pas les mêmes habitats : chaque histoire reste dans les
 * lieux de ses espèces.
 */
import type { AdventureDef, QuestStep, SpeciesDef } from '../types';
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

const rainbowAfterRain = (sp: SpeciesDef, withCoast = true): QuestStep[] => {
  const ab = waterAbility(sp);
  const swims = ab === 'swim';
  const coast: QuestStep[] =
    sp.id === 'bear' && withCoast
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


// ---------------------------------------------------------------------------
// Décors propres à chaque famille (2026-11-23) : tanière de l'ours, trois décors du bison,
// trois décors du castor. Séquences nouvelles : le niveau débutant garde 2 réponses.
// ---------------------------------------------------------------------------

const hideAndSeek = (hideAt: string, hint: [string, string]) =>
  seek('mother', 'sibling', hideAt, {
    line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
    hint,
    notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
    found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
  }, ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' });

// 5. La tanière sous la neige — ours (na_bear_den)
const winterDen = (): QuestStep[] => [
  say('narrator', 'Winter is here. The mountain is white and the snow is deep.', "C'est l'hiver. La montagne est blanche et la neige est épaisse."),
  ask('mother', 'What colour is the snow?', 'De quelle couleur est la neige ?', [ok('White!', 'Blanche !', '⚪'), no('Red!', 'Rouge !', '🔴'), no('Green!', 'Verte !', '🟢'), no('Orange!', 'Orange !', '🟠')], ['Look at the ground!', 'Regarde par terre !'], ['snow', 'white'], { pointAt: 'snow', onCorrect: L('Yes! The snow is white!', 'Oui ! La neige est blanche !') }),
  say('father', 'Brr! I am cold. Where is our den?', "Brr ! J'ai froid. Où est notre tanière ?", {}, 'calm'),
  tap('father', 'Find our warm den! Where is the den?', 'Trouve notre tanière chaude ! Où est la tanière ?', 'den', ['It is a cosy cave!', "C'est une grotte bien chaude !"], ['den', 'cold', 'where']),
  moveTo('den', 'rest', 'father'),
  say('father', 'Ahh! The den is warm. No more cold!', 'Ahh ! La tanière est chaude. Plus de froid !', {}, 'calm'),
  back('father'),
  tap('mother', 'Look at the soft straw! Where is the straw?', 'Regarde la paille douce ! Où est la paille ?', 'straw', ['It is a soft bed!', "C'est un lit tout doux !"], ['straw', 'where']),
  tap('father', 'Look! A long icicle! Where is the icicle?', 'Regarde ! Un long glaçon ! Où est le glaçon ?', 'icicle', ['It is ice, and very cold!', "C'est de la glace, très froide !"], ['icicle', 'cold', 'where'], { minTier: 'intermediate' }),
  ask('mother', 'Is the icicle cold or hot?', 'Le glaçon est froid ou chaud ?', [ok("It's cold!", 'Il est froid !', '🥶'), no("It's hot!", 'Il est chaud !', '🥵')], ['Look! It is ice!', "Regarde ! C'est de la glace !"], ['icicle', 'cold'], { minTier: 'intermediate', pointAt: 'icicle', keepOrder: true }),
  say('baby', 'It is so white! I like the snow!', "C'est si blanc ! J'aime la neige !", { needs: 'baby' }, 'happy'),
  say('narrator', 'Pine cones are hiding in the snow.', 'Des pommes de pin se cachent dans la neige.', {}, 'curious'),
  ...countScene('father', 'pinecone', [0, 1, 2, 3, 4, 5], { beginner: 3, intermediate: 4, expert: 5 }, 'dcone'),
  tap('mother', 'Look at the old bare bush! Where is it?', 'Regarde le vieux buisson sans feuilles ! Où est-il ?', 'bare_bush', ['It has no leaves in winter!', "Il n'a plus de feuilles en hiver !"], ['bare bush', 'where'], { minTier: 'intermediate' }),
  hideAndSeek('boulder', ['Look behind the big rock!', 'Regarde derrière le gros rocher !']),
  ask('father', 'Where do bears sleep in winter?', 'Où dorment les ours en hiver ?', [ok('In a den!', 'Dans une tanière !', '🕳️'), no('In the sea!', 'Dans la mer !', '🌊'), no('In a car!', 'Dans une voiture !', '🚗')], ['Look at our warm home!', 'Regarde notre maison chaude !'], ['den', 'sleep'], { minTier: 'intermediate', pointAt: 'den', keepOrder: true }),
  say('narrator', 'A white pebble shines in the snow.', 'Un caillou blanc brille dans la neige.', {}, 'curious'),
  ...colorHunt('mother', 'pebble', 'white', ['red', 'blue', 'yellow'], [1, 2, 4, 5], 'wpeb'),
  act('actor', 'sleep', 'Zzz… Good night, snowy mountain.', 'Zzz… Bonne nuit, montagne enneigée.', 'actor'),
  reward('na_white_pebble', 'mother', 'A white pebble from the snow! It is our treasure!', 'Un caillou blanc de la neige ! C’est notre trésor !'),
  end('father', 'What a cosy winter day!', 'Quelle douce journée d’hiver !'),
];

// 6. Le ruisseau de la prairie — bison (na_bison_prairie)
const prairieStream = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'The prairie is wide and golden. A stream sings in the grass.', 'La prairie est grande et dorée. Un ruisseau chante dans les herbes.'),
  tap('father', 'Where is the stream? Show me!', 'Où est le ruisseau ? Montre-moi !', 'stream', ['It is water, running!', "C'est de l'eau qui coule !"], ['stream', 'where']),
  ...drinkScene(sp, 'stream', 'actor'),
  tap('mother', 'Look at the golden grass! Where is it?', "Regarde l'herbe dorée ! Où est-elle ?", 'golden_grass', ['It is yellow and tall!', "C'est jaune et haut !"], ['golden grass', 'where']),
  ...eatScene(sp, [0, 2, 4, 6], 'actor', 'meal'),
  tap('mother', 'Look at the big oak tree! Where is it?', 'Regarde le grand chêne ! Où est-il ?', 'oak_tree', ['It is a tall tree!', "C'est un grand arbre !"], ['oak tree', 'where']),
  ask('father', 'What colour are the wildflowers?', 'De quelle couleur sont les fleurs sauvages ?', [ok('Purple!', 'Violettes !', '🟣'), no('Red!', 'Rouges !', '🔴'), no('Orange!', 'Orange !', '🟠'), no('White!', 'Blanches !', '⚪')], ['Look at the little flowers!', 'Regarde les petites fleurs !'], ['wildflower', 'purple'], { minTier: 'intermediate', pointAt: 'lupine', onCorrect: L('Yes! Purple wildflowers!', 'Oui ! Des fleurs sauvages violettes !') }),
  tap('father', 'Look far away! Where is the mountain?', 'Regarde au loin ! Où est la montagne ?', 'mountain', ['It is big and far away!', "Elle est grande et loin d'ici !"], ['mountain', 'big', 'where'], { minTier: 'intermediate' }),
  say('father', 'The prairie is so big! Who wants to run?', 'La prairie est si grande ! Qui veut courir ?', {}, 'happy'),
  act('actor', 'run', 'Zoom! I run on the prairie!', 'Zoum ! Je cours dans la prairie !', 'actor'),
  say('baby', 'Wait for me! I run too!', 'Attends-moi ! Je cours aussi !', { needs: 'baby' }, 'happy'),
  ask('actor', 'What can I do?', "Qu'est-ce que je sais faire ?", [ok('I can run!', 'Je sais courir !', '🏃'), no('I can fly!', 'Je sais voler !', '🪽'), no('I can drive a car!', 'Je sais conduire une voiture !', '🚗')], ['Look! I run!', 'Regarde ! Je cours !'], ['can', 'run'], { minTier: 'expert' }),
  say('narrator', 'Look! Hoofprints in the mud by the stream!', 'Regarde ! Des traces de sabots dans la boue près du ruisseau !', {}, 'curious'),
  ...countScene('mother', 'hoofprint', [1, 2, 3, 4, 5, 6], { beginner: 3, intermediate: 4, expert: 5 }, 'hprint'),
  hideAndSeek('oak_tree', ['Look behind the oak tree!', 'Regarde derrière le chêne !']),
  ...colorHunt('father', 'flower', 'yellow', ['purple', 'red', 'pink'], [0, 1, 3, 5], 'pflower'),
  reward('na_yellow_flower', 'father', 'A yellow flower from the prairie! It is our treasure!', 'Une fleur jaune de la prairie ! C’est notre trésor !'),
  end('mother', 'What a great day on the prairie!', 'Quelle belle journée dans la prairie !'),
];

// 7. La rivière de montagne — bison (na_bison_alpine)
const mountainRiver = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'High in the mountains, a cold river runs through the pines.', 'Haut dans la montagne, une rivière froide coule entre les pins.'),
  tap('father', 'Where is the river? Show me!', 'Où est la rivière ? Montre-moi !', 'river', ['It is cold and fast!', "C'est froid et rapide !"], ['river', 'where']),
  ...drinkScene(sp, 'river', 'actor'),
  act('baby', 'splash', 'Splash! The river is cold!', 'Splash ! La rivière est froide !', 'baby', { needs: 'baby' }),
  tap('mother', 'Look at the fallen log! Where is the log?', 'Regarde le tronc tombé ! Où est le tronc ?', 'fallen_log', ['It is a big tree on the ground!', "C'est un gros arbre par terre !"], ['fallen log', 'where']),
  moveTo('fallen_log', 'rest', 'mother'),
  say('mother', 'Ahh! I rest on the log.', 'Ahh ! Je me repose sur le tronc.', {}, 'calm'),
  back('mother'),
  tap('father', 'Look up! Where is the mountain?', 'Regarde en haut ! Où est la montagne ?', 'mountain', ['It is very big!', 'Elle est très grande !'], ['mountain', 'big', 'where']),
  ask('mother', 'What colour is the mountain?', 'De quelle couleur est la montagne ?', [ok('Grey!', 'Grise !', '🪨'), no('Pink!', 'Rose !', '🩷'), no('Orange!', 'Orange !', '🟠'), no('Purple!', 'Violette !', '🟣')], ['Look at the stone!', 'Regarde la pierre !'], ['mountain'], { minTier: 'intermediate', pointAt: 'mountain' }),
  tap('father', 'Look at the fir forest! Where is it?', 'Regarde la forêt de sapins ! Où est-elle ?', 'fir_forest', ['It is full of green trees!', "Elle est pleine d'arbres verts !"], ['fir forest', 'green', 'where'], { minTier: 'intermediate' }),
  tap('mother', 'Look at the red bush! Where is it?', 'Regarde le buisson rouge ! Où est-il ?', 'red_bush', ['It is a red plant!', "C'est une plante rouge !"], ['bush', 'red', 'where'], { minTier: 'intermediate' }),
  ...eatScene(sp, [0, 1, 2, 4], 'actor', 'meal'),
  ...countScene('father', 'pebble', [0, 1, 2, 3, 4, 5], { beginner: 3, intermediate: 4, expert: 5 }, 'rpebble'),
  hideAndSeek('rock', ['Look behind the rock!', 'Regarde derrière le rocher !']),
  say('narrator', 'Feathers fall from the sky.', 'Des plumes tombent du ciel.', {}, 'curious'),
  ...colorHunt('mother', 'feather', 'blue', ['red', 'yellow', 'green'], [0, 1, 2, 4], 'rfeather'),
  reward('na_blue_feather', 'mother', 'A blue feather from the mountain! It is our treasure!', 'Une plume bleue de la montagne ! C’est notre trésor !'),
  end('father', 'What a wonderful mountain day!', 'Quelle merveilleuse journée en montagne !'),
];

// 8. Le canyon rouge — bison (na_bison_canyon)
const redCanyon = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'Welcome to the red canyon! The cliffs are very high.', 'Bienvenue dans le canyon rouge ! Les falaises sont très hautes.'),
  tap('father', 'Look up! Where is the big cliff?', 'Regarde en haut ! Où est la grande falaise ?', 'cliff', ['It is a wall of stone!', "C'est un mur de pierre !"], ['cliff', 'big', 'where']),
  ask('mother', 'What colour are the rocks?', 'De quelle couleur sont les roches ?', [ok('Red!', 'Rouges !', '🔴'), no('Blue!', 'Bleues !', '🔵'), no('Green!', 'Vertes !', '🟢'), no('Pink!', 'Roses !', '🩷')], ['Look at the stone!', 'Regarde la pierre !'], ['red rock', 'red'], { pointAt: 'red_rock', onCorrect: L('Yes! Red rocks!', 'Oui ! Des roches rouges !') }),
  tap('mother', 'Look at the flat mesa! Where is the mesa?', 'Regarde la mesa plate ! Où est la mesa ?', 'mesa', ['It is flat on top!', 'Elle est plate en haut !'], ['mesa', 'where'], { minTier: 'intermediate' }),
  say('father', 'The sun is hot. We need a hat!', 'Le soleil est chaud. Il nous faut un chapeau !', {}, 'thirsty'),
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
  tap('father', 'Follow the dusty path! Where is the path?', 'Suivons le chemin poussiéreux ! Où est le chemin ?', 'path', ['Look down! Find the path!', 'Regarde en bas ! Trouve le chemin !'], ['path', 'follow_the_path']),
  moveTo('path', 'walk', 'father'),
  say('father', 'Walk, walk, walk. The dust is red!', 'Marche, marche, marche. La poussière est rouge !', {}, 'calm'),
  back('father'),
  tap('mother', 'Look! A red flower! Where is the red flower?', 'Regarde ! Une fleur rouge ! Où est la fleur rouge ?', 'red_flower', ['It is small and red!', 'Elle est petite et rouge !'], ['red flower', 'red', 'where']),
  say('father', "Phew! I'm thirsty! Let's go to the river!", "Ouf ! J'ai soif ! Allons à la rivière !", {}, 'thirsty'),
  ...drinkScene(sp, 'river', 'actor'),
  act('baby', 'splash', 'Splash! The water is cool!', "Splash ! L'eau est fraîche !", 'baby', { needs: 'baby' }),
  ask('father', 'Is the canyon big or small?', 'Le canyon est grand ou petit ?', [ok("It's big!", 'Il est grand !', '🏜️'), no("It's small!", 'Il est petit !', '🌱')], ['Look at the cliffs!', 'Regarde les falaises !'], ['canyon', 'big', 'small'], { minTier: 'intermediate', pointAt: 'cliff', keepOrder: true }),
  hideAndSeek('rock', ['Look behind the big rock!', 'Regarde derrière le gros rocher !']),
  say('narrator', 'Red pebbles are on the ground.', 'Il y a des cailloux rouges par terre.', {}, 'curious'),
  ...colorHunt('mother', 'pebble', 'red', ['yellow', 'white', 'blue'], [1, 2, 4, 6], 'cpebble'),
  act('actor', 'run', 'Zoom! I run in the canyon!', 'Zoum ! Je cours dans le canyon !', 'actor'),
  reward('na_red_pebble', 'father', 'A red pebble from the canyon! It is our treasure!', 'Un caillou rouge du canyon ! C’est notre trésor !'),
  end('mother', 'What a great trip in the canyon!', 'Quel beau voyage dans le canyon !'),
];

// 9. L'étang du castor — castor (na_beaver_pond)
const beaverPond = (sp: SpeciesDef): QuestStep[] => {
  const swims = canDo(sp, 'swim');
  const ab = swims ? 'swim' : 'run';
  return [
    say('narrator', 'Early morning at the pond. The beavers are busy!', "Tôt le matin à l'étang. Les castors sont très occupés !"),
    tap('father', 'Where is our lodge? Show me!', 'Où est notre hutte ? Montre-moi !', 'lodge', ['It is our house of sticks!', "C'est notre maison de bâtons !"], ['lodge', 'where']),
    moveTo('lodge', 'rest', 'father'),
    say('father', 'Home, sweet home!', 'Chez nous, c’est le meilleur !', {}, 'happy'),
    back('father'),
    tap('mother', 'Look at the big log! Where is the log?', 'Regarde le gros tronc ! Où est le tronc ?', 'log', ['It is a piece of tree!', "C'est un morceau d'arbre !"], ['log', 'where']),
    say('baby', 'I help! I carry sticks!', "J'aide ! Je porte des bâtons !", { needs: 'baby' }, 'happy'),
    ...countScene('mother', 'stick', [0, 1, 2, 3, 4, 5], { beginner: 3, intermediate: 4, expert: 5 }, 'stick'),
    tap('father', 'Look at the water lily! Where is it?', 'Regarde le nénuphar ! Où est-il ?', 'water_lily', ['It floats on the pond!', "Il flotte sur l'étang !"], ['water lily', 'where'], { minTier: 'intermediate' }),
    tap('mother', 'Where are the reeds? Show me!', 'Où sont les roseaux ? Montre-moi !', 'reed', ['They are tall and green!', 'Ils sont grands et verts !'], ['reed', 'green', 'where'], { minTier: 'intermediate' }),
    ...drinkScene(sp, 'pond', 'actor'),
    act('actor', ab, swims ? 'Splash! I swim in the pond!' : 'Look at me! I run by the pond!', swims ? "Splash ! Je nage dans l'étang !" : "Regarde-moi ! Je cours au bord de l'étang !", 'actor'),
    ask('mother', 'Is the lodge on the water or in the sky?', "La hutte est sur l'eau ou dans le ciel ?", [ok('On the water!', "Sur l'eau !", '💧'), no('In the sky!', 'Dans le ciel !', '☁️'), no('In a car!', 'Dans une voiture !', '🚗')], ['Look at the pond!', "Regarde l'étang !"], ['lodge', 'water'], { minTier: 'intermediate', pointAt: 'lodge', keepOrder: true }),
    ask('actor', 'What can I do?', "Qu'est-ce que je sais faire ?", [ok(swims ? 'I can swim!' : 'I can run!', swims ? 'Je sais nager !' : 'Je sais courir !', swims ? '🏊' : '🏃'), no('I can fly!', 'Je sais voler !', '🪽'), no('I can drive a car!', 'Je sais conduire une voiture !', '🚗')], [swims ? 'Look! I swim!' : 'Look! I run!', swims ? 'Regarde ! Je nage !' : 'Regarde ! Je cours !'], ['can', ab], { minTier: 'expert' }),
    hideAndSeek('log', ['Look behind the log!', 'Regarde derrière le tronc !']),
    ...eatScene(sp, [0, 1, 6, 7], 'actor', 'meal'),
    say('narrator', 'Leaves of many colours float by the pond.', "Des feuilles de plusieurs couleurs flottent près de l'étang.", {}, 'curious'),
    ...colorHunt('father', 'leaf', 'green', ['red', 'yellow', 'orange'], [0, 1, 6, 7], 'pleaf'),
    reward('na_wood_stick', 'mother', 'A lodge stick! It is our treasure!', 'Un bâton de la hutte ! C’est notre trésor !'),
    end('father', 'What a busy day at the pond!', "Quelle journée bien remplie à l'étang !"),
  ];
};

// 10. Le sentier des séquoias — castor (na_redwood_trail)
const redwoodTrail = (): QuestStep[] => [
  say('narrator', 'We walk on a trail under the giant redwoods.', 'Nous marchons sur un sentier sous les séquoias géants.'),
  tap('father', 'Follow the trail! Where is the path?', 'Suivons le sentier ! Où est le chemin ?', 'path', ['Look down! Find the path!', 'Regarde en bas ! Trouve le chemin !'], ['path', 'follow_the_path']),
  moveTo('path', 'walk', 'father'),
  say('father', 'Walk, walk, walk. The forest is quiet.', 'Marche, marche, marche. La forêt est calme.', {}, 'calm'),
  back('father'),
  tap('mother', 'Find the biggest tree! Where is the redwood?', 'Trouve le plus gros arbre ! Où est le séquoia ?', 'redwood', ['It is the giant tree!', "C'est l'arbre géant !"], ['redwood', 'big', 'where']),
  ask('mother', 'Is the redwood big or small?', 'Le séquoia est grand ou petit ?', [ok("It's big!", 'Il est grand !', '🌲'), no("It's small!", 'Il est petit !', '🌱')], ['Look up! It touches the sky!', 'Regarde en haut ! Il touche le ciel !'], ['redwood', 'big', 'small'], { keepOrder: true, pointAt: 'redwood', onCorrect: L('Yes! It is a giant tree!', "Oui ! C'est un arbre géant !") }),
  say('baby', 'Wow! I look up, up, up!', 'Waouh ! Je regarde en haut, en haut, en haut !', { needs: 'baby' }, 'curious'),
  tap('father', 'Look at the root! Where is the root?', 'Regarde la racine ! Où est la racine ?', 'root', ['It is under the tree!', "C'est sous l'arbre !"], ['root', 'where']),
  tap('mother', 'Touch the soft moss! Where is the moss?', 'Touche la mousse douce ! Où est la mousse ?', 'moss', ['It is green and soft!', "C'est vert et doux !"], ['moss', 'green', 'where'], { minTier: 'intermediate' }),
  tap('father', 'Look at the fern! Where is the fern?', 'Regarde la fougère ! Où est la fougère ?', 'fern', ['It is a green plant!', "C'est une plante verte !"], ['fern', 'green', 'where'], { minTier: 'intermediate' }),
  ask('father', 'Is the moss green?', 'Est-ce que la mousse est verte ?', yesNo(true), ['Look at the moss!', 'Regarde la mousse !'], ['moss', 'green'], { minTier: 'intermediate', pointAt: 'moss', keepOrder: true }),
  say('narrator', 'Look! Pine cones are on the ground!', 'Regarde ! Il y a des pommes de pin par terre !', {}, 'curious'),
  ...countScene('mother', 'pinecone', [0, 1, 3, 4, 5, 6], { beginner: 3, intermediate: 4, expert: 6 }, 'cone'),
  tap('mother', 'Look at the clover! Where is the clover?', 'Regarde le trèfle ! Où est le trèfle ?', 'clover', ['It is a little green plant!', "C'est une petite plante verte !"], ['clover', 'green', 'where'], { minTier: 'expert' }),
  say('father', 'I see a big log. I can gnaw it!', 'Je vois un gros tronc. Je peux le ronger !', {}, 'proud'),
  moveTo('log', 'rest', 'actor'),
  say('actor', 'Gnaw, gnaw, gnaw! The log is hard!', 'Ronge, ronge, ronge ! Le tronc est dur !', {}, 'proud'),
  back('actor'),
  hideAndSeek('redwood', ['Look behind the redwood!', 'Regarde derrière le séquoia !']),
  ...colorHunt('father', 'flower', 'pink', ['yellow', 'red', 'purple'], [1, 2, 3, 4], 'rflower'),
  reward('na_redwood_cone', 'mother', 'A cone from the redwood trail! It is our treasure!', 'Une pomme de pin du sentier des séquoias ! C’est notre trésor !'),
  end('father', 'What a lovely walk with the giant trees!', 'Quelle jolie promenade avec les arbres géants !'),
];

// 11. La cascade — castor (na_beaver_falls)
const beaverFalls = (sp: SpeciesDef): QuestStep[] => {
  const swims = canDo(sp, 'swim');
  const ab = swims ? 'swim' : 'run';
  return [
    say('narrator', 'A big waterfall roars in the forest. Splash, splash!', 'Une grande cascade gronde dans la forêt. Plouf, plouf !'),
    tap('father', 'Listen! Where is the waterfall?', 'Écoute ! Où est la cascade ?', 'waterfall', ['It is water falling down!', "C'est de l'eau qui tombe !"], ['waterfall', 'water', 'where']),
    ask('mother', 'Is the waterfall quiet or loud?', 'La cascade est silencieuse ou bruyante ?', [ok("It's loud!", 'Elle est bruyante !', '🔊'), no("It's quiet!", 'Elle est silencieuse !', '🤫')], ['Listen! Splash, splash!', 'Écoute ! Plouf, plouf !'], ['waterfall'], { keepOrder: true, pointAt: 'waterfall' }),
    tap('mother', 'Look at the fast water! Where is the torrent?', 'Regarde l’eau rapide ! Où est le torrent ?', 'torrent', ['It runs very fast!', 'Il coule très vite !'], ['torrent', 'fast', 'where'], { minTier: 'intermediate' }),
    ...drinkScene(sp, 'waterfall', 'actor'),
    say('baby', 'The water is so fast! Wheee!', "L'eau est si rapide ! Houiii !", { needs: 'baby' }, 'happy'),
    tap('father', 'Look at the mossy rock! Where is it?', 'Regarde le rocher couvert de mousse ! Où est-il ?', 'mossy_rock', ['It is green and wet!', 'Il est vert et mouillé !'], ['mossy rock', 'green', 'where'], { minTier: 'intermediate' }),
    tap('mother', 'Look at the tall fir tree! Where is it?', 'Regarde le grand sapin ! Où est-il ?', 'fir_tree', ['It is a big green tree!', "C'est un grand arbre vert !"], ['fir tree', 'big', 'where']),
    tap('father', 'Look at the aspen! Where is the aspen?', 'Regarde le tremble ! Où est le tremble ?', 'aspen', ['It has yellow leaves!', 'Il a des feuilles jaunes !'], ['aspen', 'yellow', 'where'], { minTier: 'intermediate' }),
    tap('mother', 'Look at the red berries! Where are they?', 'Regarde les baies rouges ! Où sont-elles ?', 'red_berries', ['They are small and red!', 'Elles sont petites et rouges !'], ['red berries', 'red', 'where']),
    ...eatScene(sp, [0, 1, 2, 4], 'actor', 'meal'),
    say('narrator', 'Maple leaves float on the water.', "Des feuilles d'érable flottent sur l'eau.", {}, 'curious'),
    ...countScene('father', 'maple_leaf', [0, 1, 2, 3, 4, 5], { beginner: 3, intermediate: 4, expert: 5 }, 'mleaf'),
    act('actor', ab, swims ? 'Splash! I swim by the waterfall!' : 'Look at me! I run by the waterfall!', swims ? 'Splash ! Je nage près de la cascade !' : 'Regarde-moi ! Je cours près de la cascade !', 'actor'),
    ask('mother', 'Is the waterfall higher than the log?', 'La cascade est plus haute que le tronc ?', yesNo(true), ['Look up high!', 'Regarde tout en haut !'], ['waterfall', 'log'], { minTier: 'expert', pointAt: 'waterfall', keepOrder: true }),
    hideAndSeek('fir_tree', ['Look behind the fir tree!', 'Regarde derrière le sapin !']),
    ...colorHunt('mother', 'leaf', 'orange', ['red', 'yellow', 'green'], [0, 1, 5, 6], 'oleaf'),
    reward('na_orange_leaf', 'father', 'An orange leaf from the falls! It is our treasure!', 'Une feuille orange de la cascade ! C’est notre trésor !'),
    end('mother', 'What a splashy day at the waterfall!', 'Quelle journée éclaboussante à la cascade !'),
  ];
};

export const NORTH_AMERICA: AdventurePack = {
  adventures: [
    // L'ours seul garde le lac et les séquoias ; bison et castor ont désormais leurs propres décors.
    { id: 'north_america_maple_parade', continentId: 'north_america', titleEn: 'The maple leaf parade', titleFr: "Le défilé des feuilles d'érable", icon: '🍁', start: 'na_lake', species: ['bear'], skillIds: ['1.2', '1.3', '2.3'], steps: mapleParade, treasure: 'na_red_maple_leaf', order: 1 },
    { id: 'north_america_giant_trees', continentId: 'north_america', titleEn: 'The giant trees', titleFr: 'Les arbres géants', icon: '🌲', start: 'na_redwoods', species: ['bear'], skillIds: ['1.4', '2.2', '1.6'], steps: giantTrees, treasure: 'na_giant_cone', order: 2 },
    { id: 'north_america_lake_rainbow', continentId: 'north_america', titleEn: 'The rainbow after the rain', titleFr: "L'arc-en-ciel après la pluie", icon: '🌈', start: 'na_lake', species: ['bear'], skillIds: ['1.7', '2.7', '1.2'], steps: (sp) => rainbowAfterRain(sp, false), treasure: 'na_rainbow_stone', order: 3 },
    { id: 'north_america_winter_den', continentId: 'north_america', titleEn: 'The cosy winter den', titleFr: "La tanière d'hiver", icon: '❄️', start: 'na_bear_den', species: ['bear'], skillIds: ['1.7', '2.2', '1.2'], steps: winterDen, treasure: 'na_white_pebble', order: 4 },
    { id: 'north_america_prairie_stream', continentId: 'north_america', titleEn: 'The stream on the prairie', titleFr: 'Le ruisseau de la prairie', icon: '🦬', start: 'na_bison_prairie', species: ['bison'], skillIds: ['1.7', '2.7', '3.2'], steps: prairieStream, treasure: 'na_yellow_flower', order: 5 },
    { id: 'north_america_mountain_river', continentId: 'north_america', titleEn: 'The mountain river', titleFr: 'La rivière de montagne', icon: '🏔️', start: 'na_bison_alpine', species: ['bison'], skillIds: ['1.2', '2.2', '1.7'], steps: mountainRiver, treasure: 'na_blue_feather', order: 6 },
    { id: 'north_america_red_canyon', continentId: 'north_america', titleEn: 'The red canyon', titleFr: 'Le canyon rouge', icon: '🏜️', start: 'na_bison_canyon', species: ['bison'], skillIds: ['1.7', '2.7', '2.3'], steps: redCanyon, treasure: 'na_red_pebble', order: 7 },
    { id: 'north_america_beaver_pond', continentId: 'north_america', titleEn: 'A busy day at the pond', titleFr: "Une journée occupée à l'étang", icon: '🦫', start: 'na_beaver_pond', species: ['beaver'], skillIds: ['1.2', '1.4', '2.2'], steps: beaverPond, treasure: 'na_wood_stick', order: 8 },
    { id: 'north_america_redwood_trail', continentId: 'north_america', titleEn: 'The redwood trail', titleFr: 'Le sentier des séquoias', icon: '🌲', start: 'na_redwood_trail', species: ['beaver'], skillIds: ['1.4', '2.2', '1.6'], steps: redwoodTrail, treasure: 'na_redwood_cone', order: 9 },
    { id: 'north_america_beaver_falls', continentId: 'north_america', titleEn: 'The waterfall in the forest', titleFr: 'La cascade dans la forêt', icon: '💦', start: 'na_beaver_falls', species: ['beaver'], skillIds: ['1.7', '2.2', '1.2'], steps: beaverFalls, treasure: 'na_orange_leaf', order: 10 },
  ],
  treasures: [
    treasure('na_red_maple_leaf', 'a red maple leaf', "une feuille d'érable rouge", '🍁'),
    treasure('na_giant_cone', 'a giant pine cone', 'une pomme de pin géante', '🌲'),
    treasure('na_red_pebble', 'a red pebble', 'un caillou rouge', '🔴'),
    treasure('na_rainbow_stone', 'a rainbow stone', 'une pierre arc-en-ciel', '🌈'),
    treasure('na_white_pebble', 'a white pebble', 'un caillou blanc', '⚪'),
    treasure('na_yellow_flower', 'a yellow flower', 'une fleur jaune', '🌼'),
    treasure('na_blue_feather', 'a blue feather', 'une plume bleue', '🪶'),
    treasure('na_wood_stick', 'a lodge stick', 'un bâton de la hutte', '🪵'),
    treasure('na_redwood_cone', 'a redwood cone', 'une pomme de pin de séquoia', '🌲'),
    treasure('na_orange_leaf', 'an orange leaf', 'une feuille orange', '🍂'),
  ],
};

/** Aventures sorties des parcours (leur départ n'est plus un décor de la famille, ou elles vont à la côte).
 *  Gardées pour un retour arrière ; leur trésor reste connu (`treasures` ci-dessus) pour les passeports. */
export const RETIRED_NORTH_AMERICA: AdventureDef[] = [
  { id: 'north_america_prairie_run', continentId: 'north_america', titleEn: 'The big prairie run', titleFr: 'La course dans la grande prairie', icon: '🦬', start: 'na_prairie', species: ['bison'], skillIds: ['1.7', '2.7', '3.2'], steps: prairieRun, treasure: 'na_red_pebble', order: 3 },
  { id: 'north_america_rainbow', continentId: 'north_america', titleEn: 'The rainbow after the rain', titleFr: "L'arc-en-ciel après la pluie", icon: '🌈', start: 'na_lake', species: ['bear', 'bison', 'beaver'], skillIds: ['1.7', '2.7', '1.2'], steps: (sp) => rainbowAfterRain(sp), treasure: 'na_rainbow_stone', order: 4 },
];
