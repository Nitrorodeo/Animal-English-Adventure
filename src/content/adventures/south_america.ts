/**
 * Aventures d'Amérique du Sud : jungle, cascade, rivière et vieilles pierres, étang de la jungle.
 * Jaguar (jungle, rivière, étang), toucan (les trois branches de la canopée, depuis le 2026-11-21 : il vit en haut des arbres, pas au sol) et
 * paresseux (jungle, rivière, étang, cascade ; remplace le capybara depuis le 2026-11-19) : chaque aventure ne traverse que des lieux permis à toutes
 * ses espèces.
 */
import type { QuestStep, SpeciesDef } from '../types';
import {
  act,
  ask,
  back,
  canDo,
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
  reward,
  say,
  seek,
  tap,
  treasure,
  yesNo,
  type AdventurePack,
} from './kit';

// ---------------------------------------------------------------------------
// 1. La grande cascade — de la rivière à la cascade (paresseux)
// ---------------------------------------------------------------------------

const bigWaterfall = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'Good morning! We are at the river. Today we visit the big waterfall!', 'Bonjour ! Nous sommes à la rivière. Aujourd’hui, nous allons voir la grande cascade !', {}, 'happy'),
  tap('father', 'Where is the river? Show me!', 'Où est la rivière ? Montre-moi !', 'river', ['The river is the water, here!', "La rivière, c'est l'eau, ici !"], ['river', 'water', 'where']),
  ask('mother', 'Is the river blue?', 'Est-ce que la rivière est bleue ?', yesNo(true), ['Look at the water!', "Regarde l'eau !"], ['river', 'blue'], { minTier: 'intermediate', pointAt: 'river', keepOrder: true }),
  tap('mother', 'The waterfall is far away. Follow the path! Where is the path?', 'La cascade est loin. Suivons le chemin ! Où est le chemin ?', 'path', ['Look down! Find the path!', 'Regarde en bas ! Trouve le chemin !'], ['path', 'follow_the_path']),
  moveTo('path', 'walk', 'mother'),
  say('baby', 'I can hear the water! Whoosh!', "J'entends l'eau ! Whoosh !", { needs: 'baby' }, 'curious'),
  go('sa_waterfall', 'mother', "Let's go to the waterfall!", 'Allons à la cascade !'),
  say('narrator', 'Wow! The waterfall is so big! Whoosh!', 'Waouh ! La cascade est si grande ! Whoosh !', {}, 'happy'),
  tap('father', 'Where is the waterfall? Show me!', 'Où est la cascade ? Montre-moi !', 'waterfall', ['It is the big falling water!', "C'est la grande eau qui tombe !"], ['waterfall', 'big', 'where']),
  ask('mother', 'Is the waterfall big or small?', 'La cascade est grande ou petite ?', [ok("It's big!", 'Elle est grande !', '🏞️'), no("It's small!", 'Elle est petite !', '🐭')], ['Look! It is very, very big!', 'Regarde ! Elle est très, très grande !'], ['big', 'small'], { keepOrder: true, minTier: 'intermediate', pointAt: 'waterfall' }),
  tap('father', 'Look up! Where is the cloud?', 'Regarde en haut ! Où est le nuage ?', 'cloud', ['The cloud is in the sky!', 'Le nuage est dans le ciel !'], ['cloud', 'where'], { minTier: 'intermediate' }),
  ...drinkScene(sp, 'water', 'actor'),
  act('baby', 'splash', 'Splash! Splash! I love the waterfall!', "Splash ! Splash ! J'adore la cascade !", 'baby', { needs: 'baby' }),
  say('narrator', 'Look! Little butterflies dance in the mist!', 'Regarde ! De petits papillons dansent dans la brume !', {}, 'happy'),
  ...countScene('mother', 'butterfly', [0, 1, 3, 5, 6], { beginner: 3, intermediate: 4, expert: 5 }, 'wfbutterfly'),
  say('narrator', 'Oh! There are feathers by the water!', "Oh ! Il y a des plumes au bord de l'eau !", {}, 'curious'),
  ...colorHunt('father', 'feather', 'blue', ['red', 'yellow', 'green'], [0, 1, 5, 6], 'wffeather'),
  seek('mother', 'sibling', 'rock', {
    line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
    hint: ['Look behind the big rock!', 'Regarde derrière le gros rocher !'],
    notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
    found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
  }, ['hide_and_seek', 'behind', 'rock'], { needs: 'sibling', minTier: 'intermediate' }),
  ask('father', 'Is the waterfall small?', 'Est-ce que la cascade est petite ?', yesNo(false), ['Look! It is very big!', 'Regarde ! Elle est très grande !'], ['waterfall', 'small'], { minTier: 'expert', pointAt: 'waterfall', keepOrder: true }),
  reward('sa_blue_feather', 'mother', 'A blue feather! It is our treasure!', 'Une plume bleue ! C’est notre trésor !'),
  end('father', 'What a big, big waterfall!', 'Quelle grande, grande cascade !'),
];

// ---------------------------------------------------------------------------
// 2. Les vieilles pierres — au bord de la rivière (jaguar, paresseux)
// ---------------------------------------------------------------------------

const oldStones = (sp: SpeciesDef): QuestStep[] => {
  const ab = canDo(sp, 'swim') ? 'swim' : 'fly';
  const abLine = ab === 'swim' ? L('I swim in the river! Splash!', 'Je nage dans la rivière ! Splash !') : L('I fly over the river! Whee!', 'Je vole au-dessus de la rivière ! Youpi !');
  return [
    say('narrator', 'We walk by the river. Look! There are very old stones!', 'Nous marchons au bord de la rivière. Regarde ! Il y a de très vieilles pierres !', {}, 'curious'),
    tap('father', 'These are ruins. Where are the ruins?', 'Ce sont des ruines. Où sont les ruines ?', 'ruins', ['Old, old stones!', 'De très, très vieilles pierres !'], ['ruins', 'where']),
    moveTo('ruins', 'sniff', 'father'),
    say('father', 'Wow! The stones are so old!', 'Waouh ! Les pierres sont si vieilles !', {}, 'curious'),
    back('father'),
    ask('mother', 'Are the ruins old or new?', 'Les ruines sont vieilles ou neuves ?', [ok('They are old!', 'Elles sont vieilles !', '🏛️'), no('They are new!', 'Elles sont neuves !', '✨')], ['Look! They are very old!', 'Regarde ! Elles sont très vieilles !'], ['ruins', 'old'], { keepOrder: true, minTier: 'intermediate', pointAt: 'ruins' }),
    say('baby', 'Is there a secret inside?', 'Il y a un secret à l’intérieur ?', { needs: 'baby' }, 'curious'),
    seek('mother', 'sibling', 'ruins', {
      line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
      hint: ['Look at the old stones!', 'Regarde les vieilles pierres !'],
      notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
      found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
    }, ['hide_and_seek', 'ruins'], { needs: 'sibling', minTier: 'intermediate' }),
    tap('father', 'Where is the river? Show me!', 'Où est la rivière ? Montre-moi !', 'river', ['It is blue, with water!', "Elle est bleue, avec de l'eau !"], ['river', 'water', 'where']),
    ...drinkScene(sp, 'river', 'actor'),
    act('actor', ab, abLine.en, abLine.fr, 'actor'),
    ask('actor', 'What can I do?', 'Qu’est-ce que je sais faire ?', [ok(`I can ${ab}!`, ab === 'swim' ? 'Je sais nager !' : 'Je sais voler !', ab === 'swim' ? '🏊' : '🪽'), no('I can drive a car!', 'Je sais conduire une voiture !', '🚗'), no('I can read a book!', 'Je sais lire un livre !', '📖')], [`Look! I can ${ab}!`, ab === 'swim' ? 'Regarde ! Je sais nager !' : 'Regarde ! Je sais voler !'], ['can', ab], { minTier: 'intermediate' }),
    say('baby', 'I can do it too! Look!', 'Moi aussi, je sais faire ! Regarde !', { needs: 'baby' }, 'proud'),
    say('narrator', 'There are little pebbles on the ground.', 'Il y a des petits cailloux par terre.'),
    ...countScene('mother', 'pebble', [3, 4, 5, 6, 7], { beginner: 3, intermediate: 4, expert: 5 }, 'stpebble'),
    ...colorHunt('father', 'pebble', 'red', ['blue', 'yellow', 'green'], [3, 5, 6, 7], 'stcolor'),
    tap('mother', 'Look! Something shines behind the rock! Where is the rock?', 'Regarde ! Quelque chose brille derrière le rocher ! Où est le rocher ?', 'rock', ['A big rock by the river!', 'Un gros rocher au bord de la rivière !'], ['rock', 'behind']),
    moveTo('rock', 'sniff', 'father'),
    say('father', 'A stone with a pretty picture!', 'Une pierre avec un joli dessin !', {}, 'happy'),
    back('father'),
    reward('sa_carved_stone', 'mother', 'A carved stone! What a treasure!', 'Une pierre gravée ! Quel trésor !'),
    end('father', 'We are brave explorers!', 'Nous sommes de courageux explorateurs !'),
  ];
};

// ---------------------------------------------------------------------------
// 3. L'étang de la jungle — de la rivière à l'étang (jaguar, paresseux)
// ---------------------------------------------------------------------------

const lilyPond = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'Plip, plop! There is a little pond in the jungle.', 'Plip, plop ! Il y a un petit étang dans la jungle.', {}, 'curious'),
  tap('mother', 'Follow the path to the pond! Where is the path?', "Suivons le chemin jusqu'à l'étang ! Où est le chemin ?", 'path', ['Look down! Find the path!', 'Regarde en bas ! Trouve le chemin !'], ['path', 'follow_the_path']),
  moveTo('path', 'walk', 'mother'),
  go('sa_wetland', 'mother', "Let's go to the pond!", "Allons à l'étang !"),
  say('narrator', 'Welcome to the jungle pond! The water is blue.', "Bienvenue à l'étang de la jungle ! L'eau est bleue.", {}, 'happy'),
  tap('father', 'Where is the little waterfall? Show me!', 'Où est la petite cascade ? Montre-moi !', 'waterfall', ['The water falls from the rocks!', "L'eau tombe des rochers !"], ['waterfall', 'where']),
  tap('mother', 'And where is the water of the pond?', "Et où est l'eau de l'étang ?", 'water', ['It is blue and calm!', 'Elle est bleue et calme !'], ['water', 'where']),
  ask('father', 'What colour is the flower?', 'De quelle couleur est la fleur ?', [ok('Pink!', 'Rose !', '🩷'), no('Black!', 'Noir !', '⚫'), no('Orange!', 'Orange !', '🟠'), no('Blue!', 'Bleu !', '🔵')], ['Look at the flower!', 'Regarde la fleur !'], ['pink', 'flower'], { pointAt: 'flower' }),
  say('narrator', 'Ribbit, ribbit! Frogs jump on the rocks!', 'Coa, coa ! Des grenouilles sautent sur les rochers !', {}, 'happy'),
  ...countScene('mother', 'frog', [0, 1, 2, 4, 5], { beginner: 3, intermediate: 4, expert: 5 }, 'frog'),
  say('baby', 'Hello, little frogs!', 'Bonjour, petites grenouilles !', { needs: 'baby' }, 'happy'),
  act('actor', 'swim', 'I swim in the pond! Splash, splash!', "Je nage dans l'étang ! Splash, splash !", 'actor'),
  act('baby', 'splash', 'Splash! The pond is so nice!', "Splash ! L'étang est trop bien !", 'baby', { needs: 'baby' }),
  tap('father', 'Where is the big tree? Look up high!', 'Où est le grand arbre ? Regarde en haut !', 'tree', ['It is very tall!', 'Il est très grand !'], ['tree', 'tall', 'where'], { minTier: 'intermediate' }),
  ask('mother', 'Is the leaf green?', 'Est-ce que la feuille est verte ?', yesNo(true), ['Look at the leaf!', 'Regarde la feuille !'], ['leaf', 'green'], { minTier: 'intermediate', pointAt: 'leaf', keepOrder: true }),
  ask('father', 'Is the flower pink?', 'Est-ce que la fleur est rose ?', yesNo(true), ['Look at the flower!', 'Regarde la fleur !'], ['flower', 'pink'], { minTier: 'expert', pointAt: 'flower', keepOrder: true }),
  say('actor', "I'm hungry! Time for a snack!", "J'ai faim ! C'est l'heure du goûter !", {}, 'thirsty'),
  ...eatScene(sp, [7, 2, 1, 0], 'actor', 'pond'),
  say('narrator', 'Look! Pretty flowers around the pond!', "Regarde ! De jolies fleurs autour de l'étang !", {}, 'happy'),
  ...colorHunt('mother', 'flower', 'pink', ['yellow', 'red', 'white'], [4, 5, 6, 7], 'lilyflower'),
  reward('sa_golden_frog', 'father', 'A little golden frog! It is our treasure!', 'Une petite grenouille dorée ! C’est notre trésor !'),
  end('mother', 'What a happy day at the jungle pond!', "Quelle journée joyeuse à l'étang de la jungle !"),
];

// ---------------------------------------------------------------------------
// 4. La fête de la jungle — de la clairière à la rivière (jaguar)
// ---------------------------------------------------------------------------

const jungleParty = (sp: SpeciesDef): QuestStep[] => {
  const ab = canDo(sp, 'climb') ? 'climb' : 'fly';
  const abLine = ab === 'climb' ? L('I climb the big tree! Up, up, up!', 'Je grimpe au grand arbre ! Hop, hop, hop !') : L('I fly up to the tree! Whee!', "Je vole jusqu'à l'arbre ! Youpi !");
  return [
    say('father', 'Good morning, family! Today is party day in the jungle!', "Bonjour, la famille ! Aujourd'hui, c'est la fête dans la jungle !", {}, 'happy'),
    ask('mother', 'Where are we? In the jungle or in the desert?', 'Où sommes-nous ? Dans la jungle ou dans le désert ?', [ok('In the jungle!', 'Dans la jungle !', '🌴'), no('In the desert!', 'Dans le désert !', '🏜️'), no('In the sea!', 'Dans la mer !', '🌊')], ['Look! Trees, leaves and flowers!', 'Regarde ! Des arbres, des feuilles et des fleurs !'], ['jungle', 'where'], { keepOrder: true }),
    tap('father', 'Look at the long vine! Where is the vine?', 'Regarde la longue liane ! Où est la liane ?', 'vine', ['It hangs from the tree!', "Elle pend de l'arbre !"], ['vine', 'where']),
    tap('mother', 'And where is the big tree?', "Et où est le grand arbre ?", 'tree', ['It is the biggest one!', "C'est le plus grand !"], ['tree', 'big', 'where']),
    act('actor', ab, abLine.en, abLine.fr, 'actor'),
    ask('actor', 'What can I do?', 'Qu’est-ce que je sais faire ?', [ok(`I can ${ab}!`, ab === 'climb' ? 'Je sais grimper !' : 'Je sais voler !', ab === 'climb' ? '🧗' : '🪽'), no('I can drive a car!', 'Je sais conduire une voiture !', '🚗'), no('I can read a book!', 'Je sais lire un livre !', '📖')], [`Look! I can ${ab}!`, ab === 'climb' ? 'Regarde ! Je sais grimper !' : 'Regarde ! Je sais voler !'], ['can', ab], { minTier: 'intermediate' }),
    say('baby', "I want to do it too!", 'Je veux le faire aussi !', { needs: 'baby' }, 'proud'),
    say('narrator', 'It is time for the party food!', 'C’est l’heure du repas de fête !', {}, 'happy'),
    ...eatScene(sp, [1, 3, 4, 7], 'actor', 'party'),
    say('narrator', 'Look! Butterflies come to the party!', 'Regarde ! Des papillons viennent à la fête !', {}, 'happy'),
    ...countScene('mother', 'butterfly', [0, 2, 5, 6, 7], { beginner: 3, intermediate: 4, expert: 5 }, 'jbutterfly'),
    say('narrator', 'Oh! Colourful feathers fall from the trees!', 'Oh ! Des plumes colorées tombent des arbres !', {}, 'curious'),
    ...colorHunt('father', 'feather', 'red', ['blue', 'yellow', 'green'], [0, 2, 5, 6], 'jfeather'),
    seek('mother', 'sibling', 'tree', {
      line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
      hint: ['Look behind the big tree!', 'Regarde derrière le grand arbre !'],
      notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
      found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
    }, ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
    ask('father', 'Is the tree big or small?', "L'arbre est grand ou petit ?", [ok("It's big!", 'Il est grand !', '🌳'), no("It's small!", 'Il est petit !', '🌱')], ['Look! It is a giant tree!', "Regarde ! C'est un arbre géant !"], ['big', 'small'], { keepOrder: true, minTier: 'expert', pointAt: 'tree' }),
    say('mother', 'The party goes on at the river! Follow the path!', 'La fête continue à la rivière ! Suivons le chemin !'),
    tap('father', 'Where is the path?', 'Où est le chemin ?', 'path', ['Find the path on the ground!', 'Trouve le chemin par terre !'], ['path', 'follow_the_path']),
    moveTo('path', 'walk', 'father'),
    go('sa_river', 'father', "Let's go to the river!", 'Allons à la rivière !'),
    say('narrator', 'Here is the river! Lily flowers float on the water.', "Voici la rivière ! Des fleurs de nénuphar flottent sur l'eau.", {}, 'happy'),
    ...drinkScene(sp, 'river', 'actor'),
    tap('mother', 'Look! A pretty flower on the water! Where is the water lily?', "Regarde ! Une jolie fleur sur l'eau ! Où est le nénuphar ?", 'water_lily', ['It is a flower on the water!', "C'est une fleur sur l'eau !"], ['water lily', 'where'], { minTier: 'intermediate' }),
    reward('sa_party_flower', 'father', 'A big jungle flower! It is our treasure!', 'Une grande fleur de la jungle ! C’est notre trésor !'),
    end('mother', 'What a great jungle party!', 'Quelle belle fête dans la jungle !'),
  ];
};

// ---------------------------------------------------------------------------
// 5. Le matin dans la canopée — d'une grosse branche à la cabane, puis au lever du soleil (toucan)
// ---------------------------------------------------------------------------

const canopyMorning = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'Good morning! We live high up, in the big tree!', 'Bonjour ! Nous habitons tout en haut, dans le grand arbre !', {}, 'happy'),
  tap('father', 'Where is the tree? Show me!', "Où est l'arbre ? Montre-moi !", 'tree', ['It is the big tree with the big trunk!', "C'est le grand arbre avec le gros tronc !"], ['tree', 'big', 'where']),
  tap('mother', 'We stand on a big branch. Where is the branch?', 'Nous sommes sur une grosse branche. Où est la branche ?', 'branch', ['Look down! We are standing on it!', 'Regarde en bas ! Nous sommes dessus !'], ['branch', 'where']),
  ask('mother', 'Is the sun hot or cold?', 'Le soleil est chaud ou froid ?', [ok("It's hot!", 'Il est chaud !', '☀️'), no("It's cold!", 'Il est froid !', '🥶')], ['Look! The sun is shining!', 'Regarde ! Le soleil brille !'], ['sun', 'hot', 'cold'], { minTier: 'intermediate', pointAt: 'sun', keepOrder: true }),
  act('actor', 'fly', 'I fly from branch to branch! Whee!', "Je vole de branche en branche ! Youpi !", 'actor'),
  say('baby', 'I want to fly too!', 'Je veux voler aussi !', { needs: 'baby' }, 'proud'),
  say('mother', "Let's visit the tree house!", 'Allons voir la cabane dans l’arbre !'),
  go('sa_canopy_treehouse', 'mother', "Let's fly to the tree house!", 'Envolons-nous vers la cabane !'),
  say('narrator', 'Look! A tree house, and a rope bridge!', 'Regarde ! Une cabane dans l’arbre et un pont de corde !', {}, 'happy'),
  tap('father', 'Where is the bridge?', 'Où est le pont ?', 'bridge', ['It is up there, between the trees!', 'Il est là-haut, entre les arbres !'], ['bridge', 'where']),
  tap('mother', 'And where is the orchid?', "Et où est l'orchidée ?", 'orchid', ['It is a pretty pink flower!', "C'est une jolie fleur rose !"], ['orchid', 'where'], { minTier: 'intermediate' }),
  ask('father', 'Is the orchid pink?', "L'orchidée est rose ?", yesNo(true), ['Look at the flower!', 'Regarde la fleur !'], ['orchid', 'pink'], { minTier: 'expert', pointAt: 'orchid', keepOrder: true }),
  say('mother', 'The sun is coming up! Time for breakfast!', 'Le soleil se lève ! C’est l’heure du petit-déjeuner !'),
  go('sa_canopy_sunrise', 'mother', "Let's fly to the sunrise branch!", 'Envolons-nous vers la branche du lever de soleil !'),
  tap('father', 'Look at the fruit! Where is the fruit?', 'Regarde le fruit ! Où est le fruit ?', 'fruit', ['It hangs in the tree!', "Il pend dans l'arbre !"], ['fruit', 'where']),
  ...eatScene(sp, [1, 3, 4, 7], 'actor', 'canopy'),
  reward('sa_sun_mango', 'mother', 'A golden mango! It is our treasure!', 'Une mangue dorée ! C’est notre trésor !'),
  end('father', 'What a beautiful morning in the canopy!', 'Quel beau matin dans la canopée !'),
];

// ---------------------------------------------------------------------------
// 6. La cabane dans l'arbre — la cabane, le pont de corde, puis la grosse branche (toucan)
// ---------------------------------------------------------------------------

const canopyTreeHouse = (_sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'Look! A tree house high up in the tree!', 'Regarde ! Une cabane tout en haut de l’arbre !', {}, 'happy'),
  tap('father', 'Where is the tree house? Show me!', 'Où est la cabane ? Montre-moi !', 'treehouse', ['It is made of wood, on the left!', 'Elle est en bois, à gauche !'], ['tree house', 'where']),
  ask('mother', 'Is the tree house made of wood?', 'La cabane est en bois ?', yesNo(true), ['Look at the tree house!', 'Regarde la cabane !'], ['tree house', 'big'], { minTier: 'intermediate', pointAt: 'treehouse', keepOrder: true }),
  tap('mother', 'And where is the bridge?', 'Et où est le pont ?', 'bridge', ['It is a rope bridge, up there!', "C'est un pont de corde, là-haut !"], ['bridge', 'where']),
  act('actor', 'fly', 'I fly over the bridge! Whee!', 'Je vole au-dessus du pont ! Youpi !', 'actor'),
  say('baby', 'It is so high! I like it!', "C'est si haut ! J'aime ça !", { needs: 'baby' }, 'proud'),
  say('narrator', 'Look! Little butterflies dance around the orchids!', 'Regarde ! De petits papillons dansent autour des orchidées !', {}, 'happy'),
  ...countScene('mother', 'butterfly', [0, 2, 3, 5, 6], { beginner: 3, intermediate: 4, expert: 5 }, 'thbutterfly'),
  tap('father', 'Where is the orchid?', "Où est l'orchidée ?", 'orchid', ['It is a pretty pink flower!', "C'est une jolie fleur rose !"], ['orchid', 'where'], { minTier: 'intermediate' }),
  say('mother', 'Now, let us rest on the big branch.', 'Maintenant, reposons-nous sur la grosse branche.'),
  go('sa_canopy_branch', 'mother', "Let's fly to the big branch!", 'Envolons-nous vers la grosse branche !'),
  tap('father', 'Where is the branch?', 'Où est la branche ?', 'branch', ['We stand on it!', 'Nous sommes dessus !'], ['branch', 'where']),
  say('narrator', 'Oh! Colourful feathers fall from the tree!', 'Oh ! Des plumes colorées tombent de l’arbre !', {}, 'curious'),
  ...colorHunt('father', 'feather', 'red', ['blue', 'yellow', 'green'], [0, 2, 5, 6], 'thfeather'),
  reward('sa_rope_feather', 'mother', 'A red feather! It is our treasure!', 'Une plume rouge ! C’est notre trésor !'),
  end('father', 'What a great tree house!', 'Quelle belle cabane !'),
];

// ---------------------------------------------------------------------------
// 7. Le fruit doré — le matin, sur la branche du lever de soleil (toucan)
// ---------------------------------------------------------------------------

const canopyGoldenFruit = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'The sun is rising! Everything is golden!', 'Le soleil se lève ! Tout est doré !', {}, 'happy'),
  tap('father', 'Where is the sun? Show me!', 'Où est le soleil ? Montre-moi !', 'sun', ['It is in the sky, on the left!', 'Il est dans le ciel, à gauche !'], ['sun', 'where']),
  ask('mother', 'Is the sun cold?', 'Le soleil est froid ?', yesNo(false), ['Look! The sun is hot!', 'Regarde ! Le soleil est chaud !'], ['sun', 'hot', 'cold'], { minTier: 'intermediate', pointAt: 'sun', keepOrder: true }),
  tap('mother', 'Look at the big fruit! Where is the fruit?', 'Regarde le gros fruit ! Où est le fruit ?', 'fruit', ['It hangs in the tree!', "Il pend dans l'arbre !"], ['fruit', 'where']),
  say('father', 'I am hungry! Breakfast time!', "J'ai faim ! C'est l'heure du petit-déjeuner !", {}, 'happy'),
  ...eatScene(sp, [0, 2, 5, 7], 'actor', 'goldfruit'),
  say('baby', 'Yum! I like fruit!', "Miam ! J'aime les fruits !", { needs: 'baby' }, 'happy'),
  tap('father', 'Where is the river?', 'Où est la rivière ?', 'river', ['It is the blue water, far away!', "C'est l'eau bleue, tout au fond !"], ['river', 'where'], { minTier: 'intermediate' }),
  ask('mother', 'Is the river blue?', 'La rivière est bleue ?', yesNo(true), ['Look at the water!', "Regarde l'eau !"], ['river', 'blue'], { minTier: 'expert', pointAt: 'river', keepOrder: true }),
  reward('sa_gold_fruit', 'mother', 'A golden fruit! It is our treasure!', 'Un fruit doré ! C’est notre trésor !'),
  end('father', 'What a golden morning!', 'Quel matin doré !'),
];

export const SOUTH_AMERICA: AdventurePack = {
  adventures: [
    { id: 'south_america_big_waterfall', continentId: 'south_america', titleEn: 'The big waterfall', titleFr: 'La grande cascade', icon: '🏞️', start: 'sa_river', species: ['sloth'], skillIds: ['3.2', '1.2', '1.4'], steps: bigWaterfall, treasure: 'sa_blue_feather', order: 1 },
    { id: 'south_america_old_stones', continentId: 'south_america', titleEn: 'The old stones', titleFr: 'Les vieilles pierres', icon: '🏛️', start: 'sa_river', species: ['jaguar', 'sloth'], skillIds: ['2.2', '1.3', '1.2'], steps: oldStones, treasure: 'sa_carved_stone', order: 2 },
    { id: 'south_america_lily_pond', continentId: 'south_america', titleEn: 'The jungle pond', titleFr: "L'étang de la jungle", icon: '🐸', start: 'sa_river', species: ['jaguar', 'sloth'], skillIds: ['1.3', '1.6', '1.2'], steps: lilyPond, treasure: 'sa_golden_frog', order: 3 },
    { id: 'south_america_jungle_party', continentId: 'south_america', titleEn: 'The jungle party', titleFr: 'La fête de la jungle', icon: '🦜', start: 'sa_jungle', species: ['jaguar'], skillIds: ['1.6', '2.2', '1.2'], steps: jungleParty, treasure: 'sa_party_flower', order: 4 },
    { id: 'south_america_canopy_morning', continentId: 'south_america', titleEn: 'The morning in the canopy', titleFr: 'Le matin dans la canopée', icon: '🌅', start: 'sa_canopy_branch', species: ['toucan'], skillIds: ['1.6', '2.2', '1.2'], steps: canopyMorning, treasure: 'sa_sun_mango', order: 5 },
    { id: 'south_america_canopy_treehouse', continentId: 'south_america', titleEn: 'The tree house', titleFr: 'La cabane dans l’arbre', icon: '🏡', start: 'sa_canopy_treehouse', species: ['toucan'], skillIds: ['1.3', '1.2', '2.2'], steps: canopyTreeHouse, treasure: 'sa_rope_feather', order: 6 },
    { id: 'south_america_canopy_fruit', continentId: 'south_america', titleEn: 'The golden fruit', titleFr: 'Le fruit doré', icon: '🥭', start: 'sa_canopy_sunrise', species: ['toucan'], skillIds: ['1.6', '2.2', '1.2'], steps: canopyGoldenFruit, treasure: 'sa_gold_fruit', order: 7 },
  ],
  treasures: [
    treasure('sa_blue_feather', 'a blue feather', 'une plume bleue', '🪶'),
    treasure('sa_carved_stone', 'a carved stone', 'une pierre gravée', '🗿'),
    treasure('sa_golden_frog', 'a golden frog', 'une grenouille dorée', '🐸'),
    treasure('sa_party_flower', 'a jungle flower', 'une fleur de la jungle', '🌺'),
    treasure('sa_sun_mango', 'a golden mango', 'une mangue dorée', '🥭'),
    treasure('sa_rope_feather', 'a red feather', 'une plume rouge', '🪶'),
    treasure('sa_gold_fruit', 'a golden fruit', 'un fruit doré', '🍊'),
  ],
};
