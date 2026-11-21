/**
 * Aventures d'Asie : forêt de bambous, pagode et lanternes, jardin aux poissons koï, montagne dans
 * la brume, arche de pierre. Le tigre ne vit que dans la forêt de bambous, la montagne et l'arche :
 * il n'est donc pas dans la nuit des lanternes (pagode et jardin).
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

export const ASIA: AdventurePack = {
  adventures: [
    { id: 'asia_bamboo_morning', continentId: 'asia', titleEn: 'The bamboo morning', titleFr: 'Le matin dans les bambous', icon: '🎋', start: 'asia_bamboo', species: ['giant_panda', 'tiger'], skillIds: ['1.6', '1.3', '2.2'], steps: bambooMorning, treasure: 'jade_leaf', order: 1 },
    { id: 'asia_lantern_night', continentId: 'asia', titleEn: 'The lantern night', titleFr: 'La nuit des lanternes', icon: '🏮', start: 'asia_pagoda', species: ['giant_panda'], skillIds: ['1.2', '1.3', '2.3'], steps: lanternNight, treasure: 'golden_lantern', order: 2 },
    { id: 'asia_misty_mountain', continentId: 'asia', titleEn: 'The misty mountain', titleFr: 'La montagne dans la brume', icon: '⛰️', start: 'asia_mountain', species: ['giant_panda', 'tiger', 'snow_leopard'], skillIds: ['1.7', '2.7', '3.2'], steps: mistyMountain, treasure: 'rainbow_stone', order: 3 },
    { id: 'asia_rainbow_rain', continentId: 'asia', titleEn: 'The rainbow after the rain', titleFr: 'L’arc-en-ciel après la pluie', icon: '🌈', start: 'asia_arch', species: ['giant_panda', 'tiger'], skillIds: ['1.7', '1.2', '2.7'], steps: rainbowAfterRain, treasure: 'rain_pearl', order: 4 },
    { id: 'asia_leopard_rocks', continentId: 'asia', titleEn: 'The big rocks', titleFr: 'Les gros rochers', icon: '🪨', start: 'asia_mountain', species: ['snow_leopard', 'tiger'], skillIds: ['1.7', '2.2', '1.3'], steps: leopardRocks, treasure: 'snow_crystal', order: 5 },
    { id: 'asia_arch_morning', continentId: 'asia', titleEn: 'The morning at the arch', titleFr: 'Le matin à l’arche', icon: '🌄', start: 'asia_arch', species: ['snow_leopard', 'tiger'], skillIds: ['1.6', '1.2', '2.7'], steps: archMorning, treasure: 'golden_pebble', order: 6 },
  ],
  treasures: [
    treasure('jade_leaf', 'a jade leaf', 'une feuille de jade', '🍃'),
    treasure('golden_lantern', 'a golden lantern', 'une lanterne dorée', '🏮'),
    treasure('rainbow_stone', 'a rainbow stone', 'une pierre arc-en-ciel', '🌈'),
    treasure('rain_pearl', 'a rain pearl', 'une perle de pluie', '💧'),
    treasure('snow_crystal', 'a snow crystal', 'un cristal de neige', '❄️'),
    treasure('golden_pebble', 'a golden pebble', 'un galet doré', '🟡'),
  ],
};
