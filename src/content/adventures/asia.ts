/**
 * Aventures d'Asie, une famille = ses 3 décors (2026-11-23) :
 *   panda : forêt de bambous, jardin aux poissons koï, pavillon rouge ;
 *   tigre : pagode, montagne dans la brume, cascade de la jungle ;
 *   panthère des neiges : tanière enneigée, grotte enneigée, arche de pierre.
 * Les aventures dont le départ n'est plus un décor de leur famille sont dans RETIRED_ASIA (jamais supprimées).
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

// ---------------------------------------------------------------------------
// 1. Le matin dans les bambous — goûter, cascade, cache-cache et papillons
// ---------------------------------------------------------------------------

const bambooMorning = (sp: SpeciesDef): QuestStep[] => {
  const climbs = canDo(sp, 'climb');
  const ab = climbs ? 'climb' : 'jump';
  return [
    say('narrator', 'Good morning, bamboo forest! The green bamboo is tall.', 'Bonjour, forêt de bambous ! Le bambou vert est très haut.'),
    tap('father', 'Look at the bamboo! Where is the bamboo?', 'Regarde le bambou ! Où est le bambou ?', 'bamboo', ['It is tall and green!', "C'est grand et vert !"], ['bamboo', 'where']),
    ask('mother', 'What colour is the bamboo?', 'De quelle couleur est le bambou ?', [ok('Green!', 'Vert !', '🟢'), no('Red!', 'Rouge !', '🔴'), no('Pink!', 'Rose !', '🩷'), no('Blue!', 'Bleu !', '🔵')], ['Look at the grass too!', "Regarde aussi l'herbe !"], ['green', 'bamboo'], { onCorrect: L('Yes! The bamboo is green!', 'Oui ! Le bambou est vert !'), pointAt: 'bamboo' }),
    ...eatScene(sp, [0, 2, 4, 6], 'actor', 'snack'),
    say('baby', 'Yum! I like the snack!', "Miam ! J'aime le goûter !", { needs: 'baby' }, 'happy'),
    tap('mother', 'Shh! Listen! Where is the waterfall?', 'Chut ! Écoute ! Où est la cascade ?', 'waterfall', ['Water is falling down!', "L'eau tombe d'en haut !"], ['waterfall', 'where']),
    ask('father', 'Is the waterfall small?', 'Est-ce que la cascade est petite ?', yesNo(true), ['Look at the waterfall!', 'Regarde la cascade !'], ['waterfall', 'small'], { minTier: 'expert', pointAt: 'waterfall', keepOrder: true }),
    ...drinkScene(sp, 'pond', 'actor'),
    act('baby', 'splash', 'Splash! Splash! I love the pond!', "Splash ! Splash ! J'adore le bassin !", 'baby', { needs: 'baby' }),
    say('narrator', 'Look! Pretty butterflies are dancing in the forest!', 'Regarde ! De jolis papillons dansent dans la forêt !', {}, 'happy'),
    ...countScene('mother', 'butterfly', [1, 3, 5, 7, 0], { beginner: 3, intermediate: 4, expert: 5 }, 'bfly'),
    seek('father', 'sibling', 'rock', {
      line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
      hint: ['Look at the big rock!', 'Regarde le gros rocher !'],
      notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
      found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
    }, ['hide_and_seek', 'rock'], { needs: 'sibling', minTier: 'intermediate' }),
    act('actor', ab, climbs ? 'I can climb! Look at me!' : 'I can jump! Look at me!', climbs ? 'Je sais grimper ! Regarde-moi !' : 'Je sais sauter ! Regarde-moi !', 'actor'),
    ask('actor', 'What can I do?', 'Qu’est-ce que je sais faire ?', [ok(climbs ? 'I can climb!' : 'I can jump!', climbs ? 'Je sais grimper !' : 'Je sais sauter !', climbs ? '🧗' : '🦘'), no('I can fly!', 'Je sais voler !', '🪽'), no('I can drive a car!', 'Je sais conduire une voiture !', '🚗')], [climbs ? 'Look! I can climb!' : 'Look! I can jump!', climbs ? 'Regarde ! Je sais grimper !' : 'Regarde ! Je sais sauter !'], ['can', ab], { minTier: 'intermediate' }),
    say('narrator', 'Look at the flowers under the cherry blossom!', 'Regarde les fleurs sous le cerisier !', {}, 'curious'),
    ...colorHunt('mother', 'flower', 'pink', ['yellow', 'red', 'purple'], [3, 4, 5, 6], 'bamflower'),
    reward('jade_leaf', 'father', 'A jade leaf! It is our treasure!', 'Une feuille de jade ! C’est notre trésor !'),
    end('mother', 'What a nice morning in the bamboo forest!', 'Quel beau matin dans la forêt de bambous !'),
  ];
};

// ---------------------------------------------------------------------------
// 2. La nuit des lanternes — pagode, pont, puis jardin et poissons koï (pas pour le tigre)
// ---------------------------------------------------------------------------

const lanternNight = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'It is evening at the pagoda. Tonight is lantern night!', 'C’est le soir à la pagode. Ce soir, c’est la nuit des lanternes !', {}, 'happy'),
  tap('father', 'The sun is going down. Where is the sun?', 'Le soleil se couche. Où est le soleil ?', 'sun', ['Look up in the sky!', 'Regarde en haut, dans le ciel !'], ['sun', 'where']),
  tap('mother', 'Look! The lantern! Where is the lantern?', 'Regarde ! La lanterne ! Où est la lanterne ?', 'lantern', ['It is a little light!', "C'est une petite lumière !"], ['lantern', 'where']),
  say('baby', 'Oooh! So pretty!', 'Oooh ! Trop joli !', { needs: 'baby' }, 'love'),
  ...countScene('father', 'lantern', [0, 2, 3, 4, 5], { beginner: 3, intermediate: 4, expert: 5 }, 'lant'),
  seek('mother', 'sibling', 'pagoda', {
    line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
    hint: ['Look at the red pagoda!', 'Regarde la pagode rouge !'],
    notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
    found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
  }, ['hide_and_seek', 'pagoda'], { needs: 'sibling', minTier: 'intermediate' }),
  ask('father', 'Is the pagoda red?', 'Est-ce que la pagode est rouge ?', yesNo(true), ['Look at the pagoda!', 'Regarde la pagode !'], ['pagoda', 'red'], { minTier: 'expert', pointAt: 'pagoda', keepOrder: true }),
  tap('mother', "Let's go to the garden! Cross the bridge! Where is the bridge?", 'Allons au jardin ! Traversons le pont ! Où est le pont ?', 'bridge', ['It is over the water!', "C'est au-dessus de l'eau !"], ['bridge', 'follow_the_path']),
  moveTo('bridge', 'walk', 'mother'),
  go('asia_garden', 'father', "Let's go to the garden!", 'Allons au jardin !'),
  say('narrator', 'The garden is full of lanterns and flowers!', 'Le jardin est plein de lanternes et de fleurs !'),
  tap('mother', 'Look! The pond! Where is the pond?', 'Regarde ! Le bassin ! Où est le bassin ?', 'pond', ['The water is below!', "L'eau est en bas !"], ['pond', 'where']),
  ...drinkScene(sp, 'pond', 'actor'),
  say('narrator', 'Look! Fish are swimming in the pond! Beautiful fish!', 'Regarde ! Des poissons nagent dans le bassin ! De beaux poissons !', {}, 'curious'),
  ...colorHunt('father', 'koi', 'orange', ['white', 'yellow', 'red'], [3, 4, 5, 6], 'koi'),
  ...countScene('mother', 'koi', [3, 4, 5, 6, 7], { beginner: 3, intermediate: 4, expert: 5 }, 'fish'),
  ask('father', 'Is the lantern red?', 'Est-ce que la lanterne est rouge ?', yesNo(false), ['Look at the lantern!', 'Regarde la lanterne !'], ['lantern', 'red'], { minTier: 'intermediate', pointAt: 'lantern', keepOrder: true }),
  ask('mother', 'Is the cherry blossom pink?', 'Est-ce que le cerisier en fleurs est rose ?', yesNo(true), ['Look up at the tree!', "Regarde l'arbre en haut !"], ['cherry blossom', 'pink'], { minTier: 'expert', pointAt: 'cherry_blossom', keepOrder: true }),
  say('baby', 'I love the lantern night!', "J'adore la nuit des lanternes !", { needs: 'baby' }, 'happy'),
  reward('golden_lantern', 'mother', 'A golden lantern! It is our treasure!', 'Une lanterne dorée ! C’est notre trésor !'),
  end('father', 'Good night, little lanterns!', 'Bonne nuit, petites lanternes !'),
];

// ---------------------------------------------------------------------------
// 3. La montagne dans la brume — habits, chemin, marches, puis l'arche de pierre
// ---------------------------------------------------------------------------

const mistyMountain = (sp: SpeciesDef): QuestStep[] => {
  const ab = canDo(sp, 'climb') ? 'climb' : 'run';
  const abEn = ab === 'climb' ? 'climb' : 'run';
  const abFr = ab === 'climb' ? 'grimper' : 'courir';
  return [
    say('narrator', 'We are on the mountain path. Today there is mist.', 'Nous sommes sur le chemin de montagne. Aujourd’hui, il y a de la brume.'),
    ask('mother', 'How is the weather today?', 'Quel temps fait-il aujourd’hui ?', [ok("It's misty!", 'Il y a de la brume !', '🌫️'), no("It's hot!", 'Il fait chaud !', '🥵'), no("It's snowy!", 'Il neige !', '🌨️'), no("It's rainy!", 'Il pleut !', '🌧️')], ['Look! The cloud is on the mountain!', 'Regarde ! Le nuage est sur la montagne !'], ['weather', 'misty'], { onCorrect: L("Yes! It's misty and cool!", 'Oui ! Il y a de la brume et il fait frais !') }),
    tap('father', 'Look! A cloud! Where is the cloud?', 'Regarde ! Un nuage ! Où est le nuage ?', 'cloud', ['It is white and soft!', "C'est blanc et doux !"], ['cloud', 'where']),
    props([prop('coat', 'coat', 0), prop('sunglasses', 'sunglasses', 1)], { maxTier: 'beginner' }),
    props([prop('coat', 'coat', 0), prop('sunglasses', 'sunglasses', 1), prop('scarf', 'scarf', 2), prop('hat', 'hat', 3)], { minTier: 'intermediate' }),
    tapProps('mother', "It's cool! Find the coat!", 'Il fait frais ! Trouve le manteau !', ['coat'], ['Something warm!', 'Quelque chose de chaud !'], ['coat', 'need'], {
      maxTier: 'beginner',
      onCorrect: L('Yes! A coat for the mist!', 'Oui ! Un manteau pour la brume !'),
      wrong: { sunglasses: L('Sunglasses? No! There is no sun!', 'Des lunettes de soleil ? Non ! Il n’y a pas de soleil !') },
    }),
    tapProps('mother', "It's cool! Find the coat and the scarf!", 'Il fait frais ! Trouve le manteau et l’écharpe !', ['coat', 'scarf'], ['Two warm things!', 'Deux choses chaudes !'], ['coat', 'scarf', 'need'], {
      minTier: 'intermediate',
      onCorrect: L('Great! Now we are warm!', 'Super ! Maintenant, nous avons chaud !'),
      wrong: { sunglasses: L('Sunglasses? No! There is no sun!', 'Des lunettes de soleil ? Non ! Il n’y a pas de soleil !'), hat: L('A hat? We need something warmer!', 'Un chapeau ? Il nous faut plus chaud !') },
    }),
    clearProps(),
    tap('father', 'Follow me up the mountain! Where is the path?', 'Suis-moi en haut de la montagne ! Où est le chemin ?', 'path', ['Look down! Find the path!', 'Regarde en bas ! Trouve le chemin !'], ['path', 'follow_the_path']),
    moveTo('path', 'walk', 'father'),
    say('father', 'Up, up, up! Step by step!', 'Plus haut, plus haut ! Pas à pas !', {}, 'proud'),
    back('father'),
    tap('mother', 'Look! A big step! Where is the step?', 'Regarde ! Une grande marche ! Où est la marche ?', 'step', ['It is a stone step!', "C'est une marche en pierre !"], ['step', 'where'], { minTier: 'intermediate' }),
    ask('father', 'Is the mountain high?', 'Est-ce que la montagne est haute ?', yesNo(true), ['Look up! It is very high!', 'Regarde en haut ! Elle est très haute !'], ['mountain', 'big'], { minTier: 'intermediate', pointAt: 'mountain', keepOrder: true }),
    act('actor', ab, `I can ${abEn}! Look at me!`, `Je sais ${abFr} ! Regarde-moi !`, 'actor'),
    say('baby', 'I am a little tired!', 'Je suis un peu fatigué !', { needs: 'baby' }, 'calm'),
    ask('mother', 'Is the path long?', 'Est-ce que le chemin est long ?', yesNo(true), ['Look at the path!', 'Regarde le chemin !'], ['path', 'long'], { minTier: 'expert', pointAt: 'path', keepOrder: true }),
    go('asia_arch', 'father', "Let's go to the stone arch!", 'Allons à l’arche de pierre !'),
    say('narrator', 'Wow! The mist is gone. Here is the big stone arch!', 'Waouh ! La brume est partie. Voici la grande arche de pierre !', {}, 'happy'),
    tap('mother', 'Where is the arch? Show me!', 'Où est l’arche ? Montre-moi !', 'arch', ['It is big and made of stone!', "Elle est grande et en pierre !"], ['arch', 'big']),
    seek('father', 'sibling', 'tree', {
      line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
      hint: ['Look at the big tree!', 'Regarde le grand arbre !'],
      notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
      found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
    }, ['hide_and_seek', 'tree'], { needs: 'sibling', minTier: 'intermediate' }),
    say('narrator', 'Pretty butterflies fly around the arch!', 'De jolis papillons volent autour de l’arche !', {}, 'happy'),
    ...colorHunt('mother', 'butterfly', 'yellow', ['pink', 'blue', 'white'], [4, 5, 6, 7], 'archbfly'),
    reward('rainbow_stone', 'father', 'A rainbow stone! It is our treasure!', 'Une pierre arc-en-ciel ! C’est notre trésor !'),
    end('mother', 'What a great day on the mountain!', 'Quelle belle journée à la montagne !'),
  ];
};

// ---------------------------------------------------------------------------
// 4. L'arc-en-ciel après la pluie — sous l'arche, puis le bassin de la forêt de bambous
// ---------------------------------------------------------------------------

const rainbowAfterRain = (sp: SpeciesDef): QuestStep[] => {
  const swims = canDo(sp, 'swim');
  return [
    say('narrator', 'Drip, drip, drip! It is a rainy day at the stone arch.', 'Plic, plic, plic ! C’est un jour de pluie à l’arche de pierre.'),
    ask('mother', 'How is the weather today?', 'Quel temps fait-il aujourd’hui ?', [ok("It's rainy!", 'Il pleut !', '🌧️'), no("It's hot!", 'Il fait chaud !', '🥵'), no("It's snowy!", 'Il neige !', '🌨️'), no("It's sunny!", 'Il y a du soleil !', '☀️')], ['Listen! Drip, drip!', 'Écoute ! Plic, plic !'], ['weather', 'rainy'], { onCorrect: L("Yes! It's rainy!", 'Oui ! Il pleut !') }),
    props([prop('umbrella', 'umbrella', 0), prop('sunglasses', 'sunglasses', 1)], { maxTier: 'beginner' }),
    props([prop('umbrella', 'umbrella', 0), prop('sunglasses', 'sunglasses', 1), prop('boots', 'boots', 2), prop('gloves', 'gloves', 3)], { minTier: 'intermediate' }),
    tapProps('father', 'It is raining! Find the umbrella!', 'Il pleut ! Trouve le parapluie !', ['umbrella'], ['For the rain!', 'Pour la pluie !'], ['umbrella', 'need'], {
      maxTier: 'beginner',
      onCorrect: L('Yes! An umbrella for the rain!', 'Oui ! Un parapluie pour la pluie !'),
      wrong: { sunglasses: L('Sunglasses? No! There is no sun!', 'Des lunettes de soleil ? Non ! Il n’y a pas de soleil !') },
    }),
    tapProps('father', 'It is raining! Find the umbrella and the boots!', 'Il pleut ! Trouve le parapluie et les bottes !', ['umbrella', 'boots'], ['Things for the rain!', 'Des choses pour la pluie !'], ['umbrella', 'boots', 'need'], {
      minTier: 'intermediate',
      onCorrect: L('Great! We are ready for the rain!', 'Super ! Nous sommes prêts pour la pluie !'),
      wrong: { sunglasses: L('Sunglasses? No! There is no sun!', 'Des lunettes de soleil ? Non ! Il n’y a pas de soleil !'), gloves: L('Gloves? Not for the rain!', 'Des gants ? Pas pour la pluie !') },
    }),
    clearProps(),
    tap('mother', "Let's stay dry under the tree! Where is the tree?", 'Restons au sec sous l’arbre ! Où est l’arbre ?', 'tree', ['It is a big tree!', "C'est un grand arbre !"], ['tree', 'where']),
    moveTo('tree', 'rest', 'actor'),
    say('actor', 'Ahh! I am dry under the tree.', 'Ahh ! Je suis au sec sous l’arbre.', {}, 'calm'),
    back('actor'),
    seek('father', 'sibling', 'tree', {
      line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
      hint: ['Look at the big tree!', 'Regarde le grand arbre !'],
      notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
      found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
    }, ['hide_and_seek', 'tree'], { needs: 'sibling', minTier: 'intermediate' }),
    say('narrator', 'The rain stops. The sun comes out!', 'La pluie s’arrête. Le soleil sort !', {}, 'happy'),
    tap('mother', 'Look up! Where is the sun?', 'Regarde en haut ! Où est le soleil ?', 'sun', ['It is in the sky!', "Il est dans le ciel !"], ['sun', 'where']),
    ask('father', 'Look at the arch! What is in the sky?', 'Regarde l’arche ! Qu’y a-t-il dans le ciel ?', [ok('A rainbow!', 'Un arc-en-ciel !', '🌈'), no('A star!', 'Une étoile !', '⭐'), no('A snowman!', 'Un bonhomme de neige !', '⛄'), no('A car!', 'Une voiture !', '🚗')], ['Many colours in the sky!', 'Plein de couleurs dans le ciel !'], ['rainbow', 'sky'], { onCorrect: L('Yes! A big rainbow!', 'Oui ! Un grand arc-en-ciel !'), pointAt: 'arch' }),
    say('baby', 'Wow! A rainbow!', 'Waouh ! Un arc-en-ciel !', { needs: 'baby' }, 'love'),
    ...colorHunt('mother', 'flower', 'purple', ['yellow', 'white', 'orange'], [2, 5, 6, 7], 'rflower'),
    go('asia_bamboo', 'father', "Let's go to the pond!", 'Allons au bassin !'),
    tap('mother', 'Where is the pond? Show me!', 'Où est le bassin ? Montre-moi !', 'pond', ['It is a little pond!', "C'est un petit bassin !"], ['pond', 'where']),
    swims
      ? act('actor', 'swim', 'I can swim! Look at me!', 'Je sais nager ! Regarde-moi !', 'actor')
      : act('actor', 'splash', 'Splash! The pond is so nice!', 'Splash ! Le bassin est trop bien !', 'actor'),
    ...drinkScene(sp, 'pond', 'father'),
    act('baby', 'splash', 'Splash! Splash! I love the pond!', "Splash ! Splash ! J'adore le bassin !", 'baby', { needs: 'baby' }),
    say('narrator', 'Look! Little fish in the pond!', 'Regarde ! De petits poissons dans le bassin !', {}, 'curious'),
    ...countScene('mother', 'koi', [3, 4, 2, 5, 6], { beginner: 3, intermediate: 4, expert: 5 }, 'pondfish'),
    reward('rain_pearl', 'father', 'A rain pearl! It is our treasure!', 'Une perle de pluie ! C’est notre trésor !'),
    end('mother', 'What a lovely day after the rain!', 'Quelle belle journée après la pluie !'),
  ];
};

// ---------------------------------------------------------------------------
// 5. Les rochers de la panthère — rochers, cascade, flocons, fleurs (montagne ; tigre et panthère des neiges)
// ---------------------------------------------------------------------------

const leopardRocks = (sp: SpeciesDef): QuestStep[] => {
  const climbs = canDo(sp, 'climb');
  const ab = climbs ? 'climb' : 'run';
  return [
    say('narrator', 'High on the mountain, the big grey rocks shine in the mist.', 'Tout en haut de la montagne, les gros rochers gris brillent dans la brume.'),
    tap('father', 'Look at the rock! Where is the rock?', 'Regarde le rocher ! Où est le rocher ?', 'rock', ['It is big and hard!', "C'est grand et dur !"], ['rock', 'where']),
    ask('mother', 'Is the rock green?', 'Est-ce que le rocher est vert ?', yesNo(false), ['Look at the rock!', 'Regarde le rocher !'], ['rock', 'green'], { minTier: 'intermediate', pointAt: 'rock', keepOrder: true }),
    act('actor', ab, climbs ? 'I can climb! Look at me!' : 'I can run! Look at me!', climbs ? 'Je sais grimper ! Regarde-moi !' : 'Je sais courir ! Regarde-moi !', 'actor'),
    ask('actor', 'What can I do?', 'Qu’est-ce que je sais faire ?', [ok(climbs ? 'I can climb!' : 'I can run!', climbs ? 'Je sais grimper !' : 'Je sais courir !', climbs ? '🧗' : '🏃'), no('I can fly!', 'Je sais voler !', '🪽'), no('I can drive a car!', 'Je sais conduire une voiture !', '🚗')], [climbs ? 'Look! I can climb!' : 'Look! I can run!', climbs ? 'Regarde ! Je sais grimper !' : 'Regarde ! Je sais courir !'], ['can', ab], { minTier: 'intermediate' }),
    say('baby', 'I like the big rocks!', "J'aime les gros rochers !", { needs: 'baby' }, 'happy'),
    ...eatScene(sp, [0, 2, 4, 6], 'actor', 'lunch'),
    say('baby', 'Yum! I like my lunch!', "Miam ! J'aime mon repas !", { needs: 'baby' }, 'happy'),
    tap('mother', 'Shh! Listen! Where is the waterfall?', 'Chut ! Écoute ! Où est la cascade ?', 'waterfall', ['Water is falling down!', "L'eau tombe d'en haut !"], ['waterfall', 'where']),
    ask('father', 'Is the waterfall white?', 'Est-ce que la cascade est blanche ?', yesNo(true), ['Look at the waterfall!', 'Regarde la cascade !'], ['waterfall', 'white'], { minTier: 'expert', pointAt: 'waterfall', keepOrder: true }),
    say('narrator', 'Look! Soft snowflakes are falling on the mountain!', 'Regarde ! De doux flocons tombent sur la montagne !', {}, 'happy'),
    ...countScene('mother', 'snowflake', [1, 3, 4, 5, 7], { beginner: 3, intermediate: 4, expert: 5 }, 'rocksnow'),
    say('narrator', 'Look at the flowers between the rocks!', 'Regarde les fleurs entre les rochers !', {}, 'curious'),
    ...colorHunt('father', 'flower', 'pink', ['yellow', 'white', 'blue'], [0, 2, 5, 6], 'rockflower'),
    reward('snow_crystal', 'mother', 'A snow crystal! It is our treasure!', 'Un cristal de neige ! C’est notre trésor !'),
    end('father', 'What a great day on the rocks!', 'Quelle belle journée sur les rochers !'),
  ];
};

// ---------------------------------------------------------------------------
// 6. Le matin à l'arche — soleil, cache-cache, papillons, puis le chemin de montagne
// ---------------------------------------------------------------------------

const archMorning = (sp: SpeciesDef): QuestStep[] => {
  const climbs = canDo(sp, 'climb');
  return [
    say('narrator', 'Good morning at the stone arch! The sun is up.', 'Bonjour à l’arche de pierre ! Le soleil est levé.'),
    tap('father', 'Where is the sun? Show me!', 'Où est le soleil ? Montre-moi !', 'sun', ['It is in the sky!', "Il est dans le ciel !"], ['sun', 'where']),
    ask('mother', 'Is the sun hot?', 'Est-ce que le soleil est chaud ?', yesNo(true), ['Look at the sun!', 'Regarde le soleil !'], ['sun', 'hot'], { minTier: 'intermediate', pointAt: 'sun', keepOrder: true }),
    tap('mother', 'Where is the arch? Show me!', 'Où est l’arche ? Montre-moi !', 'arch', ['It is big and made of stone!', "Elle est grande et en pierre !"], ['arch', 'big']),
    ask('father', 'Is the arch big?', 'Est-ce que l’arche est grande ?', yesNo(true), ['Look at the arch!', 'Regarde l’arche !'], ['arch', 'big'], { minTier: 'expert', pointAt: 'arch', keepOrder: true }),
    ...eatScene(sp, [1, 3, 5, 7], 'actor', 'brunch'),
    say('baby', 'Yum! I like my brunch!', "Miam ! J'aime mon repas !", { needs: 'baby' }, 'happy'),
    seek('father', 'sibling', 'tree', {
      line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
      hint: ['Look at the big tree!', 'Regarde le grand arbre !'],
      notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
      found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
    }, ['hide_and_seek', 'tree'], { needs: 'sibling', minTier: 'intermediate' }),
    act('actor', climbs ? 'climb' : 'jump', climbs ? 'I can climb the rock! Look at me!' : 'I can jump! Look at me!', climbs ? 'Je sais grimper sur le rocher ! Regarde-moi !' : 'Je sais sauter ! Regarde-moi !', 'actor'),
    say('narrator', 'Pretty butterflies fly around the arch!', 'De jolis papillons volent autour de l’arche !', {}, 'happy'),
    ...countScene('mother', 'butterfly', [0, 2, 4, 6, 7], { beginner: 3, intermediate: 4, expert: 5 }, 'morbfly'),
    go('asia_mountain', 'father', "Let's go up the mountain!", 'Montons à la montagne !'),
    tap('mother', 'Where is the path? Show me!', 'Où est le chemin ? Montre-moi !', 'path', ['Look down! Find the path!', 'Regarde en bas ! Trouve le chemin !'], ['path', 'follow_the_path']),
    moveTo('path', 'walk', 'father'),
    say('father', 'Up, up, up! Step by step!', 'Plus haut, plus haut ! Pas à pas !', {}, 'proud'),
    back('father'),
    say('narrator', 'Look at the little flowers on the mountain!', 'Regarde les petites fleurs de la montagne !', {}, 'curious'),
    ...colorHunt('mother', 'flower', 'yellow', ['pink', 'white', 'blue'], [0, 3, 5, 6], 'mtflower'),
    reward('golden_pebble', 'father', 'A golden pebble! It is our treasure!', 'Un galet doré ! C’est notre trésor !'),
    end('mother', 'What a bright morning on the mountain!', 'Quel matin lumineux à la montagne !'),
  ];
};

// ---------------------------------------------------------------------------
// 2026-11-23 — une histoire par décor de famille
// Débutant : 2 réponses, consignes courtes (garde-fou debutant.test.ts) ; intermédiaire : actions,
// prépositions, comparaisons ; expert : une question de plus, jamais bloquée.
// ---------------------------------------------------------------------------

const seekLines = (hint: [string, string]) => ({
  line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"] as [string, string],
  hint,
  notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'] as [string, string],
  found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'] as [string, string],
});

// 7. La nuit des lanternes au jardin — panda
const gardenLanterns = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'It is evening in the garden. Tonight is lantern night!', 'C’est le soir au jardin. Ce soir, c’est la nuit des lanternes !', {}, 'happy'),
  tap('mother', 'Look! The lantern! Where is the lantern?', 'Regarde ! La lanterne ! Où est la lanterne ?', 'lantern', ['It is a little light!', "C'est une petite lumière !"], ['lantern', 'where']),
  say('baby', 'Oooh! So pretty!', 'Oooh ! Trop joli !', { needs: 'baby' }, 'love'),
  ...countScene('father', 'lantern', [0, 1, 2, 4, 5], { beginner: 2, intermediate: 3, expert: 5 }, 'glant'),
  tap('father', 'Where is the lotus? Show me!', 'Où est le lotus ? Montre-moi !', 'lotus', ['It is a flower on the water!', "C'est une fleur sur l'eau !"], ['lotus', 'where']),
  ask('mother', 'Where are the fish?', 'Où sont les poissons ?', [ok('In the pond!', 'Dans le bassin !', '💧'), no('In the tree!', 'Dans l’arbre !', '🌳'), no('On the roof!', 'Sur le toit !', '🏠')], ['Look at the water!', "Regarde l'eau !"], ['pond', 'where'], { minTier: 'intermediate', onCorrect: L('Yes! The fish are in the pond!', 'Oui ! Les poissons sont dans le bassin !') }),
  tap('mother', 'Look! The pond! Where is the pond?', 'Regarde ! Le bassin ! Où est le bassin ?', 'pond', ['The water is below!', "L'eau est en bas !"], ['pond', 'where']),
  ...drinkScene(sp, 'pond', 'actor'),
  say('narrator', 'Look! Fish are swimming in the pond! Beautiful fish!', 'Regarde ! Des poissons nagent dans le bassin ! De beaux poissons !', {}, 'curious'),
  ...colorHunt('father', 'koi', 'orange', ['white', 'yellow', 'red'], [3, 4, 5, 6], 'gkoi'),
  ...countScene('mother', 'koi', [3, 4, 5, 6, 7], { beginner: 3, intermediate: 4, expert: 5 }, 'gfish'),
  seek('father', 'sibling', 'house', seekLines(['Look at the little house!', 'Regarde la petite maison !']), ['hide_and_seek', 'house'], { needs: 'sibling', minTier: 'intermediate' }),
  act('actor', 'climb', 'I can climb the rock! Look at me!', 'Je sais grimper sur le rocher ! Regarde-moi !', 'actor', { minTier: 'intermediate' }),
  ask('father', 'Is the lantern red?', 'Est-ce que la lanterne est rouge ?', yesNo(false), ['Look at the lantern!', 'Regarde la lanterne !'], ['lantern', 'red'], { minTier: 'intermediate', pointAt: 'lantern', keepOrder: true }),
  ask('mother', 'Is the cherry blossom pink?', 'Est-ce que le cerisier en fleurs est rose ?', yesNo(true), ['Look up at the tree!', "Regarde l'arbre en haut !"], ['cherry blossom', 'pink'], { minTier: 'expert', pointAt: 'cherry_blossom', keepOrder: true }),
  say('baby', 'I love the lantern night!', "J'adore la nuit des lanternes !", { needs: 'baby' }, 'happy'),
  reward('golden_lantern', 'mother', 'A golden lantern! It is our treasure!', 'Une lanterne dorée ! C’est notre trésor !'),
  end('father', 'Good night, little lanterns!', 'Bonne nuit, petites lanternes !'),
];

// 8. Le pavillon rouge — panda
const pavilionBridge = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'Good morning! Here is the red pavilion, near the stream.', 'Bonjour ! Voici le pavillon rouge, près de la rivière.'),
  tap('father', 'Look! The pavilion! Where is the pavilion?', 'Regarde ! Le pavillon ! Où est le pavillon ?', 'pavilion', ['It is big and red!', "C'est grand et rouge !"], ['pavilion', 'where']),
  ask('mother', 'Is the pavilion red?', 'Est-ce que le pavillon est rouge ?', yesNo(true), ['Look at the pavilion!', 'Regarde le pavillon !'], ['pavilion', 'red'], { minTier: 'intermediate', pointAt: 'pavilion', keepOrder: true }),
  ...countScene('mother', 'lantern', [0, 1, 2, 7], { beginner: 2, intermediate: 3, expert: 4 }, 'pvlant'),
  tap('father', 'Let’s cross the bridge! Where is the bridge?', 'Traversons le pont ! Où est le pont ?', 'bridge', ['It is over the water!', "C'est au-dessus de l'eau !"], ['bridge', 'follow_the_path']),
  moveTo('bridge', 'walk', 'father'),
  say('father', 'Step, step, step! Over the bridge!', 'Pas à pas ! Sur le pont !', {}, 'proud'),
  back('father'),
  tap('mother', 'Where is the stream? Show me!', 'Où est la rivière ? Montre-moi !', 'stream', ['The water is below the bridge!', "L'eau est sous le pont !"], ['stream', 'where']),
  ...drinkScene(sp, 'stream', 'actor'),
  ask('father', 'Which is higher, the mountain or the bridge?', 'Lequel est le plus haut, la montagne ou le pont ?', [ok('The mountain!', 'La montagne !', '⛰️'), no('The bridge!', 'Le pont !', '🌉')], ['Look up! The mountain is very high!', 'Regarde en haut ! La montagne est très haute !'], ['tall', 'mountain', 'bridge'], { minTier: 'intermediate', pointAt: 'mountain', keepOrder: true }),
  tap('mother', 'Look! The mist! Where is the mist?', 'Regarde ! La brume ! Où est la brume ?', 'mist', ['It is white and soft!', "C'est blanc et doux !"], ['mist', 'where'], { minTier: 'intermediate' }),
  ...eatScene(sp, [0, 1, 2, 7], 'actor', 'pvmeal'),
  say('baby', 'Yum! I like my bamboo!', "Miam ! J'aime mon bambou !", { needs: 'baby' }, 'happy'),
  act('actor', 'climb', 'I can climb the rock! Look at me!', 'Je sais grimper sur le rocher ! Regarde-moi !', 'actor'),
  ask('actor', 'What can I do?', 'Qu’est-ce que je sais faire ?', [ok('I can climb!', 'Je sais grimper !', '🧗'), no('I can fly!', 'Je sais voler !', '🪽'), no('I can drive a car!', 'Je sais conduire une voiture !', '🚗')], ['Look! I can climb!', 'Regarde ! Je sais grimper !'], ['can', 'climb'], { minTier: 'intermediate' }),
  say('narrator', 'Look at the flowers near the stone!', 'Regarde les fleurs près de la pierre !', {}, 'curious'),
  ...colorHunt('mother', 'flower', 'pink', ['yellow', 'red', 'purple'], [0, 1, 2, 7], 'pvflower'),
  reward('pavilion_bell', 'father', 'A little bell! It is our treasure!', 'Une petite cloche ! C’est notre trésor !'),
  end('mother', 'What a nice day at the pavilion!', 'Quelle belle journée au pavillon !'),
];

// 9. Le soir à la pagode — tigre
const pagodaEvening = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'It is evening at the pagoda. The lanterns are lit!', 'C’est le soir à la pagode. Les lanternes sont allumées !', {}, 'happy'),
  tap('father', 'The sun is going down. Where is the sun?', 'Le soleil se couche. Où est le soleil ?', 'sun', ['Look up in the sky!', 'Regarde en haut, dans le ciel !'], ['sun', 'where']),
  tap('mother', 'Look! The lantern! Where is the lantern?', 'Regarde ! La lanterne ! Où est la lanterne ?', 'lantern', ['It is a little light!', "C'est une petite lumière !"], ['lantern', 'where']),
  say('baby', 'Oooh! So pretty!', 'Oooh ! Trop joli !', { needs: 'baby' }, 'love'),
  ...countScene('father', 'lantern', [0, 2, 3, 4, 5], { beginner: 3, intermediate: 4, expert: 5 }, 'pglant'),
  tap('mother', 'Look! The stairs! Where are the stairs?', 'Regarde ! L’escalier ! Où est l’escalier ?', 'stairs', ['Up, up, up to the pagoda!', "Tout en haut, jusqu'à la pagode !"], ['stairs', 'where']),
  ask('father', 'Is the pagoda red?', 'Est-ce que la pagode est rouge ?', yesNo(true), ['Look at the pagoda!', 'Regarde la pagode !'], ['pagoda', 'red'], { minTier: 'intermediate', pointAt: 'pagoda', keepOrder: true }),
  seek('mother', 'sibling', 'pagoda', seekLines(['Look at the red pagoda!', 'Regarde la pagode rouge !']), ['hide_and_seek', 'pagoda'], { needs: 'sibling', minTier: 'intermediate' }),
  tap('mother', "Let's cross the bridge! Where is the bridge?", 'Traversons le pont ! Où est le pont ?', 'bridge', ['It is over the water!', "C'est au-dessus de l'eau !"], ['bridge', 'follow_the_path']),
  moveTo('bridge', 'walk', 'mother'),
  say('mother', 'Slowly, slowly! Over the bridge!', 'Doucement, doucement ! Sur le pont !', {}, 'calm'),
  back('mother'),
  tap('father', 'Where is the pond? Show me!', 'Où est le bassin ? Montre-moi !', 'pond', ['The water is below!', "L'eau est en bas !"], ['pond', 'where']),
  ...drinkScene(sp, 'pond', 'actor'),
  act('actor', 'run', 'I can run! Look at me!', 'Je sais courir ! Regarde-moi !', 'actor', { minTier: 'intermediate' }),
  ask('mother', 'Where is the pagoda?', 'Où est la pagode ?', [ok('Behind the bridge!', 'Derrière le pont !', '🏯'), no('In the pond!', 'Dans le bassin !', '💧'), no('On the cloud!', 'Sur le nuage !', '☁️')], ['Look behind the bridge!', 'Regarde derrière le pont !'], ['pagoda', 'behind'], { minTier: 'intermediate', pointAt: 'pagoda', onCorrect: L('Yes! The pagoda is behind the bridge!', 'Oui ! La pagode est derrière le pont !') }),
  ask('father', 'Is the mountain high?', 'Est-ce que la montagne est haute ?', yesNo(true), ['Look up! It is very high!', 'Regarde en haut ! Elle est très haute !'], ['mountain', 'big'], { minTier: 'expert', pointAt: 'mountain', keepOrder: true }),
  say('baby', 'I love the lantern night!', "J'adore la nuit des lanternes !", { needs: 'baby' }, 'happy'),
  reward('gold_coin', 'mother', 'A gold coin! It is our treasure!', 'Une pièce d’or ! C’est notre trésor !'),
  end('father', 'Good night, pagoda!', 'Bonne nuit, la pagode !'),
];

// 10. La montagne dans la brume — tigre (la montagne seule : le tigre n'a plus l'arche)
const mountainMist = (sp: SpeciesDef): QuestStep[] => {
  const ab = canDo(sp, 'climb') ? 'climb' : 'run';
  const abEn = ab === 'climb' ? 'climb' : 'run';
  const abFr = ab === 'climb' ? 'grimper' : 'courir';
  return [
    say('narrator', 'We are on the mountain path. Today there is mist.', 'Nous sommes sur le chemin de montagne. Aujourd’hui, il y a de la brume.'),
    ask('mother', 'How is the weather today?', 'Quel temps fait-il aujourd’hui ?', [ok("It's misty!", 'Il y a de la brume !', '🌫️'), no("It's hot!", 'Il fait chaud !', '🥵'), no("It's snowy!", 'Il neige !', '🌨️'), no("It's rainy!", 'Il pleut !', '🌧️')], ['Look! The cloud is on the mountain!', 'Regarde ! Le nuage est sur la montagne !'], ['weather', 'misty'], { onCorrect: L("Yes! It's misty and cool!", 'Oui ! Il y a de la brume et il fait frais !') }),
    tap('father', 'Look! A cloud! Where is the cloud?', 'Regarde ! Un nuage ! Où est le nuage ?', 'cloud', ['It is white and soft!', "C'est blanc et doux !"], ['cloud', 'where']),
    ask('father', 'Where is the cloud?', 'Où est le nuage ?', [ok('On the mountain!', 'Sur la montagne !', '⛰️'), no('In the pond!', 'Dans le bassin !', '💧'), no('Under the path!', 'Sous le chemin !', '🛤️')], ['Look up at the mountain!', 'Regarde la montagne en haut !'], ['cloud', 'where'], { minTier: 'intermediate', pointAt: 'cloud', onCorrect: L('Yes! The cloud is on the mountain!', 'Oui ! Le nuage est sur la montagne !') }),
    tap('father', 'Follow me up the mountain! Where is the path?', 'Suis-moi en haut de la montagne ! Où est le chemin ?', 'path', ['Look down! Find the path!', 'Regarde en bas ! Trouve le chemin !'], ['path', 'follow_the_path']),
    moveTo('path', 'walk', 'father'),
    say('father', 'Up, up, up! Step by step!', 'Plus haut, plus haut ! Pas à pas !', {}, 'proud'),
    back('father'),
    tap('mother', 'Look! A big step! Where is the step?', 'Regarde ! Une grande marche ! Où est la marche ?', 'step', ['It is a stone step!', "C'est une marche en pierre !"], ['step', 'where'], { minTier: 'intermediate' }),
    ask('father', 'Is the mountain high?', 'Est-ce que la montagne est haute ?', yesNo(true), ['Look up! It is very high!', 'Regarde en haut ! Elle est très haute !'], ['mountain', 'big'], { minTier: 'intermediate', pointAt: 'mountain', keepOrder: true }),
    act('actor', ab, `I can ${abEn}! Look at me!`, `Je sais ${abFr} ! Regarde-moi !`, 'actor'),
    say('baby', 'I am a little tired!', 'Je suis un peu fatigué !', { needs: 'baby' }, 'calm'),
    tap('mother', 'Shh! Listen! Where is the waterfall?', 'Chut ! Écoute ! Où est la cascade ?', 'waterfall', ['Water is falling down!', "L'eau tombe d'en haut !"], ['waterfall', 'where']),
    ask('mother', 'Is the path long?', 'Est-ce que le chemin est long ?', yesNo(true), ['Look at the path!', 'Regarde le chemin !'], ['path', 'long'], { minTier: 'expert', pointAt: 'path', keepOrder: true }),
    say('narrator', 'Look at the little flowers on the mountain!', 'Regarde les petites fleurs de la montagne !', {}, 'curious'),
    ...colorHunt('mother', 'flower', 'yellow', ['pink', 'white', 'blue'], [0, 3, 5, 6], 'mmflower'),
    reward('rainbow_stone', 'father', 'A rainbow stone! It is our treasure!', 'Une pierre arc-en-ciel ! C’est notre trésor !'),
    end('mother', 'What a great day on the mountain!', 'Quelle belle journée à la montagne !'),
  ];
};

// 11. La cascade de la jungle — tigre (racines, fleurs rouges, grande feuille, bassin ; aucun bambou)
const jungleFalls = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'Here is the jungle. Listen to the waterfall!', 'Voici la jungle. Écoute la cascade !'),
  tap('father', 'Shh! Listen! Where is the waterfall?', 'Chut ! Écoute ! Où est la cascade ?', 'waterfall', ['Water is falling down!', "L'eau tombe d'en haut !"], ['waterfall', 'where']),
  ask('mother', 'Is the waterfall big?', 'Est-ce que la cascade est grande ?', yesNo(true), ['Look at the waterfall!', 'Regarde la cascade !'], ['waterfall', 'big'], { minTier: 'intermediate', pointAt: 'waterfall', keepOrder: true }),
  tap('mother', 'Look! A big leaf! Where is the big leaf?', 'Regarde ! Une grande feuille ! Où est la grande feuille ?', 'big_leaf', ['It is very big and green!', 'Elle est très grande et verte !'], ['big leaf', 'where']),
  say('narrator', 'Look at the red flowers!', 'Regarde les fleurs rouges !', {}, 'curious'),
  ...colorHunt('mother', 'flower', 'red', ['yellow', 'white', 'blue'], [0, 1, 2, 3], 'jflower'),
  tap('father', 'Where are the roots? Show me!', 'Où sont les racines ? Montre-moi !', 'roots', ['They are big, under the tree!', "Elles sont grosses, sous l'arbre !"], ['roots', 'where']),
  seek('father', 'sibling', 'roots', seekLines(['Look in the big roots!', 'Regarde dans les grosses racines !']), ['hide_and_seek', 'roots'], { needs: 'sibling', minTier: 'intermediate' }),
  tap('mother', 'Where is the pool? Show me!', 'Où est le bassin ? Montre-moi !', 'pool', ['The water is blue!', "L'eau est bleue !"], ['pool', 'where']),
  canDo(sp, 'swim')
    ? act('actor', 'swim', 'I can swim! Look at me!', 'Je sais nager ! Regarde-moi !', 'actor')
    : act('actor', 'splash', 'Splash! The pool is so nice!', 'Splash ! Le bassin est trop bien !', 'actor'),
  ...drinkScene(sp, 'pool', 'father'),
  act('baby', 'splash', 'Splash! Splash! I love the pool!', "Splash ! Splash ! J'adore le bassin !", 'baby', { needs: 'baby' }),
  ask('father', 'Where is the tiger?', 'Où est le tigre ?', [ok('Next to the pool!', 'À côté du bassin !', '🏊'), no('On the cloud!', 'Sur le nuage !', '☁️'), no('In the car!', 'Dans la voiture !', '🚗')], ['Look at the water!', "Regarde l'eau !"], ['next to', 'pool'], { minTier: 'intermediate', onCorrect: L('Yes! Next to the pool!', 'Oui ! À côté du bassin !') }),
  ask('mother', 'Is the path long?', 'Est-ce que le chemin est long ?', yesNo(true), ['Look at the path!', 'Regarde le chemin !'], ['path', 'long'], { minTier: 'expert', pointAt: 'path', keepOrder: true }),
  act('actor', 'run', 'I can run on the path! Look at me!', 'Je sais courir sur le chemin ! Regarde-moi !', 'actor', { minTier: 'intermediate' }),
  say('narrator', 'Oh! A bird lost a feather…', 'Oh ! Un oiseau a perdu une plume…', {}, 'curious'),
  ...colorHunt('father', 'feather', 'blue', ['red', 'yellow', 'green'], [0, 1, 2, 7], 'jfeather'),
  reward('red_blossom', 'mother', 'A red blossom! It is our treasure!', 'Une fleur rouge ! C’est notre trésor !'),
  end('father', 'What a wild day in the jungle!', 'Quelle journée sauvage dans la jungle !'),
];

// 12. Le matin dans la tanière enneigée — panthère des neiges
const snowMorning = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'Good morning! It is cold in the snow den.', 'Bonjour ! Il fait froid dans la tanière enneigée.'),
  ask('mother', 'How is the weather today?', 'Quel temps fait-il aujourd’hui ?', [ok("It's cold!", 'Il fait froid !', '🥶'), no("It's hot!", 'Il fait chaud !', '🥵'), no("It's rainy!", 'Il pleut !', '🌧️'), no("It's sunny!", 'Il y a du soleil !', '☀️')], ['Brr! Look at the snow!', 'Brr ! Regarde la neige !'], ['weather', 'cold'], { onCorrect: L("Yes! It's very cold!", 'Oui ! Il fait très froid !') }),
  props([prop('coat', 'coat', 0), prop('sunglasses', 'sunglasses', 1)], { maxTier: 'beginner' }),
  props([prop('coat', 'coat', 0), prop('sunglasses', 'sunglasses', 1), prop('scarf', 'scarf', 2), prop('hat', 'hat', 3)], { minTier: 'intermediate' }),
  tapProps('mother', "It's cold! Find the coat!", 'Il fait froid ! Trouve le manteau !', ['coat'], ['Something warm!', 'Quelque chose de chaud !'], ['coat', 'need'], {
    maxTier: 'beginner',
    onCorrect: L('Yes! A coat for the cold!', 'Oui ! Un manteau pour le froid !'),
    wrong: { sunglasses: L('Sunglasses? No! There is no sun!', 'Des lunettes de soleil ? Non ! Il n’y a pas de soleil !') },
  }),
  tapProps('mother', "It's cold! Find the coat and the scarf!", 'Il fait froid ! Trouve le manteau et l’écharpe !', ['coat', 'scarf'], ['Two warm things!', 'Deux choses chaudes !'], ['coat', 'scarf', 'need'], {
    minTier: 'intermediate',
    onCorrect: L('Great! Now we are warm!', 'Super ! Maintenant, nous avons chaud !'),
    wrong: { sunglasses: L('Sunglasses? No! There is no sun!', 'Des lunettes de soleil ? Non ! Il n’y a pas de soleil !'), hat: L('A hat? We need something warmer!', 'Un chapeau ? Il nous faut plus chaud !') },
  }),
  clearProps(),
  tap('father', 'Look! The cave! Where is the cave?', 'Regarde ! La grotte ! Où est la grotte ?', 'cave', ['It is dark inside!', "C'est sombre à l'intérieur !"], ['cave', 'where']),
  seek('father', 'sibling', 'cave', seekLines(['Look in the dark cave!', 'Regarde dans la grotte sombre !']), ['hide_and_seek', 'cave'], { needs: 'sibling', minTier: 'intermediate' }),
  tap('mother', 'Look! A flag! Where is the flag?', 'Regarde ! Un drapeau ! Où est le drapeau ?', 'flag', ['It is a little flag!', "C'est un petit drapeau !"], ['flag', 'where']),
  say('narrator', 'Look! Soft snowflakes are falling!', 'Regarde ! De doux flocons tombent !', {}, 'happy'),
  ...countScene('mother', 'snowflake', [0, 1, 2, 3, 4], { beginner: 3, intermediate: 4, expert: 5 }, 'dsnow'),
  tap('father', 'Where is the icicle? Show me!', 'Où est le glaçon ? Montre-moi !', 'icicle', ['It is long and cold!', "C'est long et froid !"], ['icicle', 'where'], { minTier: 'intermediate' }),
  ...eatScene(sp, [0, 1, 2, 3], 'actor', 'dmeal'),
  say('baby', 'Yum! I like my lunch!', "Miam ! J'aime mon repas !", { needs: 'baby' }, 'happy'),
  act('actor', 'climb', 'I can climb the rock! Look at me!', 'Je sais grimper sur le rocher ! Regarde-moi !', 'actor'),
  ask('father', 'Which is colder, the snow or the sun?', 'Lequel est le plus froid, la neige ou le soleil ?', [ok('The snow!', 'La neige !', '❄️'), no('The sun!', 'Le soleil !', '☀️')], ['Brr! The snow is cold!', 'Brr ! La neige est froide !'], ['cold', 'snow'], { minTier: 'intermediate', pointAt: 'snow', keepOrder: true }),
  ask('mother', 'Is the snow white?', 'Est-ce que la neige est blanche ?', yesNo(true), ['Look at the snow!', 'Regarde la neige !'], ['snow', 'white'], { minTier: 'expert', pointAt: 'snow', keepOrder: true }),
  reward('frost_flower', 'father', 'A frost flower! It is our treasure!', 'Une fleur de givre ! C’est notre trésor !'),
  end('mother', 'What a cold, bright morning!', 'Quel matin froid et lumineux !'),
];

// 13. La grotte enneigée — panthère des neiges (baies : on les compte, on ne les mange jamais)
const caveLeap = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'Here is the snowy cave. Look at the mountains!', 'Voici la grotte enneigée. Regarde les montagnes !'),
  tap('father', 'Look! The icicle! Where is the icicle?', 'Regarde ! Le glaçon ! Où est le glaçon ?', 'icicle', ['It is long and cold!', "C'est long et froid !"], ['icicle', 'where']),
  ask('mother', 'Is the icicle long?', 'Est-ce que le glaçon est long ?', yesNo(true), ['Look at the icicle!', 'Regarde le glaçon !'], ['icicle', 'long'], { minTier: 'intermediate', pointAt: 'icicle', keepOrder: true }),
  tap('mother', 'Where is the cave? Show me!', 'Où est la grotte ? Montre-moi !', 'cave', ['It is dark inside!', "C'est sombre à l'intérieur !"], ['cave', 'where']),
  seek('father', 'sibling', 'cave', seekLines(['Look in the dark cave!', 'Regarde dans la grotte sombre !']), ['hide_and_seek', 'cave'], { needs: 'sibling', minTier: 'intermediate' }),
  say('mother', 'Look at the red berries! We do not eat them. Let’s count!', 'Regarde les baies rouges ! On ne les mange pas. Comptons !', {}, 'curious'),
  ...countScene('mother', 'berries', [0, 1, 2, 3, 4], { beginner: 3, intermediate: 4, expert: 5 }, 'cberry'),
  tap('father', 'Where is the hay? Show me!', 'Où est la paille ? Montre-moi !', 'hay', ['It is soft and dry!', "C'est doux et sec !"], ['hay', 'where']),
  ask('father', 'Where is the hay?', 'Où est la paille ?', [ok('Next to the cave!', 'À côté de la grotte !', '🕳️'), no('In the sky!', 'Dans le ciel !', '☁️'), no('On the peak!', 'Sur le sommet !', '🏔️')], ['Look next to the cave!', 'Regarde à côté de la grotte !'], ['hay', 'next to'], { minTier: 'intermediate', pointAt: 'hay', onCorrect: L('Yes! Next to the cave!', 'Oui ! À côté de la grotte !') }),
  tap('mother', 'Look! The big rock! Where is the rock?', 'Regarde ! Le gros rocher ! Où est le rocher ?', 'rock', ['Jump, jump, jump!', 'Saute, saute, saute !'], ['rock', 'where']),
  act('actor', 'jump', 'I can jump! Look at me!', 'Je sais sauter ! Regarde-moi !', 'actor'),
  ask('actor', 'What can I do?', 'Qu’est-ce que je sais faire ?', [ok('I can jump!', 'Je sais sauter !', '🦘'), no('I can fly!', 'Je sais voler !', '🪽'), no('I can drive a car!', 'Je sais conduire une voiture !', '🚗')], ['Look! I can jump!', 'Regarde ! Je sais sauter !'], ['can', 'jump'], { minTier: 'intermediate' }),
  say('baby', 'I like to jump on the rocks!', "J'aime sauter sur les rochers !", { needs: 'baby' }, 'happy'),
  ...eatScene(sp, [0, 1, 2, 3], 'actor', 'cmeal'),
  tap('father', 'Where is the summit? Show me!', 'Où est la cime ? Montre-moi !', 'summit', ['Look up! It is high!', 'Regarde en haut ! Il est haut !'], ['summit', 'where'], { minTier: 'intermediate' }),
  ask('father', 'Is the summit white?', 'Est-ce que la cime est blanche ?', yesNo(true), ['Look at the summit!', 'Regarde la cime !'], ['summit', 'white'], { minTier: 'expert', pointAt: 'summit', keepOrder: true }),
  say('narrator', 'Look! Little stones in the snow!', 'Regarde ! De petits cailloux dans la neige !', {}, 'curious'),
  ...colorHunt('mother', 'pebble', 'blue', ['red', 'yellow', 'green'], [0, 1, 2, 3], 'cpebble'),
  reward('ice_drop', 'father', 'An ice drop! It is our treasure!', 'Une goutte de glace ! C’est notre trésor !'),
  end('mother', 'What a great day at the cave!', 'Quelle belle journée à la grotte !'),
];

// 14. Un jour d'été à l'arche — panthère des neiges (soleil, ombre ; ni neige ni froid ni eau)
const archSummer = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'It is a summer day at the stone arch. The sun is up.', 'C’est un jour d’été à l’arche de pierre. Le soleil est levé.'),
  tap('father', 'Where is the sun? Show me!', 'Où est le soleil ? Montre-moi !', 'sun', ['It is in the sky!', "Il est dans le ciel !"], ['sun', 'where']),
  ask('mother', 'Is the sun hot?', 'Est-ce que le soleil est chaud ?', yesNo(true), ['Look at the sun!', 'Regarde le soleil !'], ['sun', 'hot'], { minTier: 'intermediate', pointAt: 'sun', keepOrder: true }),
  tap('mother', 'Where is the arch? Show me!', 'Où est l’arche ? Montre-moi !', 'arch', ['It is big and made of stone!', "Elle est grande et en pierre !"], ['arch', 'big']),
  tap('father', "It is so hot! Let's rest in the shade! Where is the tree?", "Il fait si chaud ! Reposons-nous à l'ombre ! Où est l'arbre ?", 'tree', ['The tree makes shade!', "L'arbre fait de l'ombre !"], ['tree', 'shade']),
  moveTo('tree', 'rest', 'actor'),
  say('actor', 'Ahh! The shade is nice and cool.', "Ahh ! L'ombre est bien fraîche.", {}, 'calm'),
  back('actor'),
  ask('father', 'Where is the shade?', "Où est l'ombre ?", [ok('Under the tree!', 'Sous l’arbre !', '🌳'), no('In the sky!', 'Dans le ciel !', '☁️'), no('On the car!', 'Sur la voiture !', '🚗')], ['Look at the tree!', "Regarde l'arbre !"], ['shade', 'tree'], { minTier: 'intermediate', onCorrect: L('Yes! Under the tree!', 'Oui ! Sous l’arbre !') }),
  seek('father', 'sibling', 'tree', seekLines(['Look at the big tree!', 'Regarde le grand arbre !']), ['hide_and_seek', 'tree'], { needs: 'sibling', minTier: 'intermediate' }),
  ...eatScene(sp, [4, 5, 6, 7], 'actor', 'abrunch'),
  say('baby', 'Yum! I like my brunch!', "Miam ! J'aime mon repas !", { needs: 'baby' }, 'happy'),
  act('actor', 'climb', 'I can climb the rock! Look at me!', 'Je sais grimper sur le rocher ! Regarde-moi !', 'actor'),
  say('narrator', 'Pretty butterflies fly around the arch!', 'De jolis papillons volent autour de l’arche !', {}, 'happy'),
  ...countScene('mother', 'butterfly', [0, 1, 2, 3, 5], { beginner: 3, intermediate: 4, expert: 5 }, 'abfly'),
  tap('father', 'Look! A daisy! Where is the daisy?', 'Regarde ! Une pâquerette ! Où est la pâquerette ?', 'daisy', ['It is small and white!', "C'est petit et blanc !"], ['daisy', 'where'], { minTier: 'intermediate' }),
  say('narrator', 'Look at the flowers near the arch!', 'Regarde les fleurs près de l’arche !', {}, 'curious'),
  ...colorHunt('mother', 'flower', 'yellow', ['pink', 'white', 'blue'], [4, 5, 6, 7], 'aflower'),
  ask('father', 'Is the arch big?', 'Est-ce que l’arche est grande ?', yesNo(true), ['Look at the arch!', 'Regarde l’arche !'], ['arch', 'big'], { minTier: 'expert', pointAt: 'arch', keepOrder: true }),
  reward('golden_pebble', 'father', 'A golden pebble! It is our treasure!', 'Un galet doré ! C’est notre trésor !'),
  end('mother', 'What a bright summer day!', 'Quelle belle journée d’été !'),
];

export const ASIA: AdventurePack = {
  adventures: [
    { id: 'asia_bamboo_morning', continentId: 'asia', titleEn: 'The bamboo morning', titleFr: 'Le matin dans les bambous', icon: '🎋', start: 'asia_bamboo', species: ['giant_panda'], skillIds: ['1.6', '1.3', '2.2'], steps: bambooMorning, treasure: 'jade_leaf', order: 1 },
    // « La nuit des lanternes » partait de la pagode, qui n'est plus un décor du panda : voir RETIRED_ASIA.
    { id: 'asia_garden_lanterns', continentId: 'asia', titleEn: 'Lantern night in the garden', titleFr: 'La nuit des lanternes au jardin', icon: '🏮', start: 'asia_garden', species: ['giant_panda'], skillIds: ['1.2', '1.3', '2.3'], steps: gardenLanterns, treasure: 'golden_lantern', order: 2 },
    { id: 'asia_pavilion_bridge', continentId: 'asia', titleEn: 'The red pavilion', titleFr: 'Le pavillon rouge', icon: '🏯', start: 'asia_pavilion', species: ['giant_panda'], skillIds: ['1.7', '1.2', '2.7'], steps: pavilionBridge, treasure: 'pavilion_bell', order: 3 },
    // « La montagne dans la brume », « L'arc-en-ciel après la pluie » et « Le matin à l'arche » voyageaient vers un
    // décor que la famille n'a plus : voir RETIRED_ASIA.
    { id: 'asia_leopard_rocks', continentId: 'asia', titleEn: 'The big rocks', titleFr: 'Les gros rochers', icon: '🪨', start: 'asia_mountain', species: ['tiger'], skillIds: ['1.7', '2.2', '1.3'], steps: leopardRocks, treasure: 'snow_crystal', order: 5 },
    { id: 'asia_pagoda_evening', continentId: 'asia', titleEn: 'Evening at the pagoda', titleFr: 'Le soir à la pagode', icon: '🏯', start: 'asia_pagoda', species: ['tiger'], skillIds: ['1.2', '1.3', '2.3'], steps: pagodaEvening, treasure: 'gold_coin', order: 7 },
    { id: 'asia_mountain_mist', continentId: 'asia', titleEn: 'The misty mountain', titleFr: 'La montagne dans la brume', icon: '⛰️', start: 'asia_mountain', species: ['tiger'], skillIds: ['1.7', '2.7', '3.2'], steps: mountainMist, treasure: 'rainbow_stone', order: 8 },
    { id: 'asia_jungle_falls', continentId: 'asia', titleEn: 'The jungle waterfall', titleFr: 'La cascade de la jungle', icon: '🌴', start: 'asia_jungle_falls', species: ['tiger'], skillIds: ['2.3', '1.3', '2.2'], steps: jungleFalls, treasure: 'red_blossom', order: 9 },
    { id: 'asia_snow_morning', continentId: 'asia', titleEn: 'Morning in the snow den', titleFr: 'Le matin dans la tanière enneigée', icon: '❄️', start: 'asia_snow_den', species: ['snow_leopard'], skillIds: ['1.7', '2.2', '1.3'], steps: snowMorning, treasure: 'frost_flower', order: 10 },
    { id: 'asia_cave_leap', continentId: 'asia', titleEn: 'The snowy cave', titleFr: 'La grotte enneigée', icon: '🕳️', start: 'asia_snow_cave', species: ['snow_leopard'], skillIds: ['1.3', '2.3', '2.2'], steps: caveLeap, treasure: 'ice_drop', order: 11 },
    { id: 'asia_arch_summer', continentId: 'asia', titleEn: 'A summer day at the arch', titleFr: 'Un jour d’été à l’arche', icon: '🌄', start: 'asia_arch', species: ['snow_leopard'], skillIds: ['1.6', '1.2', '2.7'], steps: archSummer, treasure: 'golden_pebble', order: 12 },
  ],
  treasures: [
    treasure('jade_leaf', 'a jade leaf', 'une feuille de jade', '🍃'),
    treasure('golden_lantern', 'a golden lantern', 'une lanterne dorée', '🏮'),
    treasure('rainbow_stone', 'a rainbow stone', 'une pierre arc-en-ciel', '🌈'),
    treasure('rain_pearl', 'a rain pearl', 'une perle de pluie', '💧'),
    treasure('snow_crystal', 'a snow crystal', 'un cristal de neige', '❄️'),
    treasure('golden_pebble', 'a golden pebble', 'un galet doré', '🟡'),
    treasure('pavilion_bell', 'a little bell', 'une petite cloche', '🔔'),
    treasure('gold_coin', 'a gold coin', 'une pièce d’or', '🪙'),
    treasure('red_blossom', 'a red blossom', 'une fleur rouge', '🌺'),
    treasure('frost_flower', 'a frost flower', 'une fleur de givre', '❄️'),
    treasure('ice_drop', 'an ice drop', 'une goutte de glace', '🧊'),
  ],
};

/** Aventures sorties des parcours (leur départ n'est plus un décor de leur famille, ou elles voyageaient vers un
 *  décor qu'elle n'a plus). Gardées pour un retour arrière ; leurs trésors restent connus des passeports. */
export const RETIRED_ASIA: AdventureDef[] = [
  { id: 'asia_lantern_night', continentId: 'asia', titleEn: 'The lantern night', titleFr: 'La nuit des lanternes', icon: '🏮', start: 'asia_pagoda', species: ['giant_panda'], skillIds: ['1.2', '1.3', '2.3'], steps: lanternNight, treasure: 'golden_lantern', order: 2 },
  { id: 'asia_misty_mountain', continentId: 'asia', titleEn: 'The misty mountain', titleFr: 'La montagne dans la brume', icon: '⛰️', start: 'asia_mountain', species: ['giant_panda', 'tiger', 'snow_leopard'], skillIds: ['1.7', '2.7', '3.2'], steps: mistyMountain, treasure: 'rainbow_stone', order: 3 },
  { id: 'asia_rainbow_rain', continentId: 'asia', titleEn: 'The rainbow after the rain', titleFr: 'L’arc-en-ciel après la pluie', icon: '🌈', start: 'asia_arch', species: ['giant_panda', 'tiger'], skillIds: ['1.7', '1.2', '2.7'], steps: rainbowAfterRain, treasure: 'rain_pearl', order: 4 },
  { id: 'asia_arch_morning', continentId: 'asia', titleEn: 'The morning at the arch', titleFr: 'Le matin à l’arche', icon: '🌄', start: 'asia_arch', species: ['snow_leopard', 'tiger'], skillIds: ['1.6', '1.2', '2.7'], steps: archMorning, treasure: 'golden_pebble', order: 6 },
];
