/**
 * Aventures d'Afrique : de vraies petites histoires à plusieurs scènes, avec voyage entre les
 * décors du continent, la famille entière (papa, maman, bébés) et un trésor pour le passeport.
 * Les étapes marquées minTier / needs ne sont jouées qu'au bon niveau ou avec des bébés.
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
  scene,
  seek,
  skyProp,
  tap,
  tapProps,
  treasure,
  yesNo,
  type AdventurePack,
} from './kit';

// ---------------------------------------------------------------------------
// 1. La grande soif — de la savane au point d'eau
// ---------------------------------------------------------------------------

const waterholeTrek = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', "It's a sunny day in the savanna. The sun is very hot!", "C'est une journée de soleil dans la savane. Le soleil chauffe très fort !"),
  ask('father', "Phew! It's so hot! What do we need?", 'Ouf ! Il fait si chaud ! De quoi avons-nous besoin ?', [ok('We need water!', "Il nous faut de l'eau !", '💧'), no('We need a coat!', 'Il nous faut un manteau !', '🧥'), no('We need snow!', 'Il nous faut de la neige !', '❄️'), no('We need a car!', 'Il nous faut une voiture !', '🚗')], ["When it's hot, we drink water!", "Quand il fait chaud, on boit de l'eau !"], ['hot', 'need', 'water'], { onCorrect: L('Yes! We need water!', "Oui ! Il nous faut de l'eau !"), emotion: 'thirsty' }),
  say('baby', "I'm thirsty too!", "Moi aussi, j'ai soif !", { needs: 'baby' }, 'thirsty'),
  tap('mother', 'The big waterhole is far away. Follow the path! Where is the path?', 'Le grand point d’eau est loin. Suivons le chemin ! Où est le chemin ?', 'path', ['Look down! Find the path!', 'Regarde en bas ! Trouve le chemin !'], ['path', 'follow_the_path']),
  moveTo('path', 'walk', 'mother'),
  go('africa_waterhole', 'mother', "Let's go to the waterhole!", 'Allons au point d’eau !'),
  say('narrator', 'Here is the big waterhole!', 'Voici le grand point d’eau !'),
  tap('father', 'Where is the water? Show me!', "Où est l'eau ? Montre-moi !", 'waterhole', ['Look! The water is blue!', "Regarde ! L'eau est bleue !"], ['waterhole', 'water', 'where']),
  ...drinkScene(sp, 'waterhole', 'actor'),
  act('baby', 'splash', 'Splash! Splash! I love the water!', "Splash ! Splash ! J'adore l'eau !", 'baby', { needs: 'baby' }),
  tap('mother', 'Look! A pretty flower on the water! Where is the water lily?', "Regarde ! Une jolie fleur sur l'eau ! Où est le nénuphar ?", 'water_lily', ['It is a flower on the water!', "C'est une fleur sur l'eau !"], ['water lily'], { minTier: 'intermediate' }),
  ask('father', 'Is the waterhole blue?', "Est-ce que le point d'eau est bleu ?", yesNo(true), ['Look at the water!', "Regarde l'eau !"], ['waterhole', 'blue'], { minTier: 'expert', pointAt: 'waterhole', keepOrder: true }),
  say('narrator', 'Oh! Something is shiny in the water…', "Oh ! Quelque chose brille dans l'eau…", {}, 'curious'),
  ...colorHunt('mother', 'pebble', 'blue', ['red', 'yellow', 'green'], [4, 5, 6, 2], 'pebble'),
  reward('blue_pebble', 'father', 'A shiny blue pebble! It is our treasure!', 'Un caillou bleu tout brillant ! C’est notre trésor !'),
  end('mother', 'What a great day at the waterhole!', "Quelle belle journée au point d'eau !"),
];

// ---------------------------------------------------------------------------
// 2. Le pique-nique du baobab — des plaines au grand baobab
// ---------------------------------------------------------------------------

const baobabPicnic = (sp: SpeciesDef): QuestStep[] => [
  say('father', 'Good morning, family! Today is picnic day!', "Bonjour, la famille ! Aujourd'hui, c'est pique-nique !", {}, 'happy'),
  ask('mother', 'Are you hungry?', 'Tu as faim ?', [ok("Yes, I'm hungry!", "Oui, j'ai faim !", '😋'), ok('Yes, a little!', 'Oui, un peu !', '🤏')], ['You can say: yes, I’m hungry!', "Tu peux dire : yes, I'm hungry!"], ['hungry'], { keepOrder: true, onCorrect: L("Then let's go to the big baobab tree!", 'Alors allons au grand baobab !') }),
  tap('father', 'Follow me on the path! Where is the path?', 'Suis-moi sur le chemin ! Où est le chemin ?', 'path', ['Find the path on the grass!', "Trouve le chemin dans l'herbe !"], ['path', 'follow_the_path']),
  moveTo('path', 'walk', 'father'),
  go('africa_baobab', 'father', 'To the baobab tree!', 'Au baobab !'),
  tap('mother', "Wow! The baobab is very big! Where is it?", 'Waouh ! Le baobab est très grand ! Où est-il ?', 'baobab', ['It is the biggest tree!', "C'est le plus gros arbre !"], ['baobab', 'big']),
  ask('father', 'Is the baobab big or small?', 'Le baobab est grand ou petit ?', [ok("It's big!", 'Il est grand !', '🐘'), no("It's small!", 'Il est petit !', '🐭')], ['Look! It is a giant tree!', "Regarde ! C'est un arbre géant !"], ['big', 'small'], { keepOrder: true, minTier: 'intermediate', pointAt: 'baobab' }),
  ...eatScene(sp, [0, 2, 4, 6], 'actor', 'picnic'),
  say('narrator', 'Look! Butterflies come to the picnic!', 'Regarde ! Des papillons viennent au pique-nique !', {}, 'happy'),
  ...countScene('mother', 'butterfly', [1, 3, 5, 7, 0], { beginner: 3, intermediate: 4, expert: 5 }, 'butterfly'),
  seek('mother', 'sibling', 'baobab', {
    line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
    hint: ['Look behind the big tree!', 'Regarde derrière le grand arbre !'],
    notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
    found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
  }, ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
  say('mother', 'Look! Flowers fall from the baobab!', 'Regarde ! Des fleurs tombent du baobab !', {}, 'curious'),
  ...colorHunt('mother', 'flower', 'white', ['pink', 'yellow', 'red'], [2, 4, 6, 1], 'bflower'),
  reward('baobab_flower', 'father', 'A white baobab flower! It is our treasure!', 'Une fleur blanche de baobab ! C’est notre trésor !'),
  end('mother', 'What a yummy picnic!', 'Quel bon pique-nique !'),
];

// ---------------------------------------------------------------------------
// 3. L'étoile du désert — chaleur, ombre, puis la nuit et les étoiles
// ---------------------------------------------------------------------------

const desertStar = (_sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'Welcome to the desert! There is a lot of sand.', 'Bienvenue dans le désert ! Il y a beaucoup de sable.'),
  tap('father', 'Look at the sand! Where is the sand?', 'Regarde le sable ! Où est le sable ?', 'sand', ['It is yellow, on the ground!', "C'est jaune, par terre !"], ['sand', 'where']),
  ask('mother', 'How is the weather today?', 'Quel temps fait-il aujourd’hui ?', [ok("It's hot!", 'Il fait chaud !', '🥵'), no("It's snowy!", 'Il neige !', '🌨️'), no("It's rainy!", 'Il pleut !', '🌧️'), no("It's cold!", 'Il fait froid !', '🥶')], ['Look at the big sun!', 'Regarde le grand soleil !'], ['weather', 'hot'], { onCorrect: L("Yes! It's very hot!", 'Oui ! Il fait très chaud !') }),
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
  say('actor', "Phew! I'm tired!", 'Ouf ! Je suis fatigué !', {}, 'thirsty'),
  tap('father', "Where is the tree? Let's rest in the shade!", "Où est l'arbre ? Reposons-nous à l'ombre !", 'tree', ['The tree makes shade!', "L'arbre fait de l'ombre !"], ['tree', 'shade']),
  moveTo('tree', 'rest', 'actor'),
  say('actor', 'Ahh! The shade is nice and cool.', "Ahh ! L'ombre est bien fraîche.", {}, 'calm'),
  back('actor'),
  say('narrator', 'The sun goes down… Now it is night! Look at the stars!', "Le soleil se couche… C'est la nuit ! Regarde les étoiles !", {}, 'calm'),
  ...countScene('mother', 'star', [0, 1, 2, 3, 4, 5, 6], { beginner: 3, intermediate: 5, expert: 6 }, 'star'),
  ask('father', 'What colour are the stars?', 'De quelle couleur sont les étoiles ?', [ok('Yellow!', 'Jaunes !', '🟡'), no('Green!', 'Vertes !', '🟢'), no('Blue!', 'Bleues !', '🔵'), no('Pink!', 'Roses !', '🩷')], ['They are like the sun!', 'Elles sont comme le soleil !'], ['yellow', 'star'], { minTier: 'intermediate' }),
  say('baby', 'The stars are so pretty!', 'Les étoiles sont trop jolies !', { needs: 'baby' }, 'love'),
  reward('desert_star', 'mother', 'Look! A little star in the sand! It is our desert star!', "Regarde ! Une petite étoile dans le sable ! C'est notre étoile du désert !"),
  end('father', 'Good night, desert!', 'Bonne nuit, le désert !'),
];

// ---------------------------------------------------------------------------
// 4. Le canyon qui répond — plumes de couleur, écho et trésor caché (pas pour la girafe)
// ---------------------------------------------------------------------------

const echoCanyon = (sp: SpeciesDef): QuestStep[] => {
  const ab = canDo(sp, 'roar') ? 'roar' : 'run';
  const abLine = ab === 'roar' ? L('Roar! Roar… roar… roar…', 'Grrr ! Grrr… grrr… grrr…') : L('I can run! Look at me!', 'Je sais courir ! Regarde-moi !');
  return [
    say('mother', 'Today we go to the red canyon! It is far away.', "Aujourd'hui, nous allons au canyon rouge ! C'est loin."),
    tap('father', 'First, follow the path! Where is the path?', "D'abord, suivons le chemin ! Où est le chemin ?", 'path', ['Find the path on the grass!', "Trouve le chemin dans l'herbe !"], ['path', 'follow_the_path']),
    moveTo('path', 'walk', 'father'),
    say('narrator', 'On the path, there are feathers!', 'Sur le chemin, il y a des plumes !', {}, 'curious'),
    ...colorHunt('mother', 'feather', 'red', ['blue', 'yellow', 'green'], [1, 3, 5, 7], 'feather'),
    go('africa_canyon', 'father', "Let's go to the canyon!", 'Allons au canyon !'),
    say('narrator', 'Wow! The canyon is very big and red!', 'Waouh ! Le canyon est très grand et rouge !'),
    tap('mother', 'Where is the canyon? Show me!', 'Où est le canyon ? Montre-moi !', 'canyon', ['It is big and red!', 'Il est grand et rouge !'], ['canyon', 'where']),
    ask('father', "Let's say hello to the canyon! What do we say?", 'Disons bonjour au canyon ! Que dit-on ?', [ok('Hello!', 'Bonjour !', '👋'), no('Goodbye!', 'Au revoir !', '🙋'), no('Thank you!', 'Merci !', '🙏'), no("I'm fine!", 'Je vais bien !', '🙂')], ['We say: hello!', 'On dit : hello!'], ['hello'], { onCorrect: L('Hello… hello… hello… The canyon answers!', 'Hello… hello… hello… Le canyon répond !') }),
    act('actor', ab, abLine.en, abLine.fr, 'actor'),
    ask('actor', 'What can I do?', 'Qu’est-ce que je sais faire ?', [ok(`I can ${ab}!`, ab === 'roar' ? 'Je sais rugir !' : 'Je sais courir !', ab === 'roar' ? '📢' : '🏃'), no('I can fly!', 'Je sais voler !', '🪽'), no('I can drive a car!', 'Je sais conduire une voiture !', '🚗')], [`Look! I can ${ab}!`, ab === 'roar' ? 'Regarde ! Je sais rugir !' : 'Regarde ! Je sais courir !'], ['can', ab], { minTier: 'intermediate' }),
    say('baby', "I can do it too! Look!", 'Moi aussi, je sais faire ! Regarde !', { needs: 'baby' }, 'proud'),
    tap('father', 'Look! Something is behind the stone! Where is the stone?', 'Regarde ! Il y a quelque chose derrière la pierre ! Où est la pierre ?', 'stone', ['It is a small stone on the ground!', "C'est une petite pierre par terre !"], ['stone', 'behind']),
    moveTo('stone', 'sniff', 'father'),
    say('father', 'A feather! It has all the colours!', 'Une plume ! Elle a toutes les couleurs !', {}, 'happy'),
    back('father'),
    reward('rainbow_feather', 'mother', 'A rainbow feather! What a treasure!', 'Une plume arc-en-ciel ! Quel trésor !'),
    end('father', 'We are brave explorers!', 'Nous sommes de courageux explorateurs !'),
  ];
};

// ---------------------------------------------------------------------------
// 5. Le jour du bain — au point d'eau (une aventure par lieu : demande du parent du 2026-11-19)
// ---------------------------------------------------------------------------

const splashDay = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', "Good morning! It's a sunny day at the waterhole.", "Bonjour ! C'est une journée de soleil au point d'eau."),
  say('baby', 'Can we play in the water?', "On peut jouer dans l'eau ?", { needs: 'baby' }, 'happy'),
  tap('father', 'Where is the water? Show me!', "Où est l'eau ? Montre-moi !", 'waterhole', ['Look! The water is blue!', "Regarde ! L'eau est bleue !"], ['waterhole', 'water', 'where']),
  ...drinkScene(sp, 'waterhole', 'actor'),
  canDo(sp, 'swim')
    ? act('actor', 'swim', 'I can swim! Look at me!', 'Je sais nager ! Regarde-moi !', 'actor')
    : act('actor', 'splash', 'Splash! I love the water!', "Splash ! J'adore l'eau !", 'actor'),
  act('baby', 'splash', 'Splash! Splash! The water is fun!', "Splash ! Splash ! L'eau, c'est rigolo !", 'baby', { needs: 'baby' }),
  say('narrator', 'Ribbit! Ribbit! Who is that?', "Croâ ! Croâ ! Qui est-ce ?", {}, 'curious'),
  ask('mother', 'Who says ribbit?', 'Qui fait croâ ?', [ok('A frog!', 'Une grenouille !', '🐸'), no('A bird!', 'Un oiseau !', '🐦'), no('A zebra!', 'Un zèbre !', '🦓')], ['It is green and it jumps!', 'Elle est verte et elle saute !'], ['frog', 'ribbit'], { onCorrect: L('Yes! A frog! Ribbit!', 'Oui ! Une grenouille ! Croâ !') }),
  ...countScene('mother', 'frog', [2, 4, 5, 6, 1], { beginner: 2, intermediate: 3, expert: 5 }, 'frog'),
  seek('father', 'baby', 'rock', {
    line: ['Oh! Where is the baby? Can you find the baby?', 'Oh ! Où est le bébé ? Tu peux le trouver ?'],
    hint: ['Look behind the big rock!', 'Regarde derrière le gros rocher !'],
    notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
    found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
  }, ['hide_and_seek', 'behind'], { needs: 'baby', minTier: 'intermediate' }),
  say('mother', 'Look! A pretty flower floats on the water!', "Regarde ! Une jolie fleur flotte sur l'eau !", {}, 'love'),
  ...colorHunt('mother', 'flower', 'pink', ['white', 'yellow', 'purple'], [4, 5, 6, 2], 'lily'),
  reward('pink_lily', 'father', 'A pink water flower! It is our treasure!', "Une fleur d'eau rose ! C'est notre trésor !"),
  end('mother', 'What a fun splash day!', 'Quelle belle journée dans l’eau !'),
];

// ---------------------------------------------------------------------------
// 6. Les oiseaux du baobab — au grand baobab
// ---------------------------------------------------------------------------

const baobabBirds = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'Here is the big baobab tree. It is very, very old!', "Voici le grand baobab. Il est très, très vieux !"),
  tap('father', 'Where is the baobab? Touch the baobab!', 'Où est le baobab ? Touche le baobab !', 'baobab', ['The biggest tree!', 'Le plus gros arbre !'], ['baobab', 'old']),
  say('narrator', 'Tweet, tweet! Listen! Who is singing?', 'Cui-cui ! Écoute ! Qui chante ?', {}, 'curious'),
  ask('mother', 'Who says tweet tweet?', 'Qui fait cui-cui ?', [ok('A bird!', 'Un oiseau !', '🐦'), no('A frog!', 'Une grenouille !', '🐸'), no('A zebra!', 'Un zèbre !', '🦓')], ['It can fly!', 'Il sait voler !'], ['bird', 'tweet'], { onCorrect: L('Yes! Birds live in the baobab!', 'Oui ! Des oiseaux vivent dans le baobab !') }),
  ...countScene('mother', 'bird', [7, 5, 3, 1, 6], { beginner: 3, intermediate: 4, expert: 5 }, 'bird'),
  ...(canDo(sp, 'climb')
    ? [act('actor', 'climb', 'I can climb! Up, up, up!', 'Je sais grimper ! Haut, haut, haut !', 'actor'), ask('father', 'Is the baobab tall?', 'Est-ce que le baobab est grand ?', yesNo(true), ['Look up!', 'Regarde en haut !'], ['tall'], { minTier: 'intermediate', pointAt: 'baobab', keepOrder: true })]
    : [say('actor', "I can't climb. But I can look up! The baobab is so tall!", 'Je ne sais pas grimper. Mais je peux regarder en haut ! Le baobab est si grand !', {}, 'curious'), ask('father', 'Is the baobab tall?', 'Est-ce que le baobab est grand ?', yesNo(true), ['Look up!', 'Regarde en haut !'], ['tall'], { minTier: 'intermediate', pointAt: 'baobab', keepOrder: true })]),
  seek('mother', 'sibling', 'rock', {
    line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
    hint: ['Look behind the rock!', 'Regarde derrière le rocher !'],
    notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
    found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
  }, ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
  say('actor', "Phew! I'm tired!", 'Ouf ! Je suis fatigué !', {}, 'calm'),
  moveTo('baobab', 'rest', 'actor'),
  say('actor', 'The baobab makes nice shade.', "Le baobab fait une belle ombre.", {}, 'calm'),
  back('actor'),
  tap('father', 'Look! Something is near the stone! Where is the stone?', 'Regarde ! Il y a quelque chose près de la pierre ! Où est la pierre ?', 'stone', ['A small stone on the ground!', 'Une petite pierre par terre !'], ['stone', 'where']),
  reward('baobab_seed', 'mother', 'A baobab seed! One day, it will be a big tree!', "Une graine de baobab ! Un jour, ce sera un grand arbre !"),
  end('father', 'Bye, birds! Bye, baobab!', 'Au revoir, les oiseaux ! Au revoir, le baobab !'),
];

// ---------------------------------------------------------------------------
// 7. Le soir au canyon — au canyon rouge (pas pour la girafe : elle ne vit pas au canyon)
// ---------------------------------------------------------------------------

const canyonNight = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'Here is the red canyon. It is big and quiet.', 'Voici le canyon rouge. Il est grand et calme.'),
  tap('mother', 'Look! A mountain! Where is the mountain?', 'Regarde ! Une montagne ! Où est la montagne ?', 'mountain', ['It is far away, very big!', "Elle est loin, très grande !"], ['mountain', 'where']),
  ask('father', 'Is the canyon big or small?', 'Le canyon est grand ou petit ?', [ok("It's big!", 'Il est grand !', '🐘'), no("It's small!", 'Il est petit !', '🐭')], ['Look! It is very big!', 'Regarde ! Il est très grand !'], ['big', 'small'], { keepOrder: true, pointAt: 'canyon' }),
  tap('father', "Let's walk! Where is the path?", 'Marchons ! Où est le chemin ?', 'path', ['Find the path on the ground!', 'Trouve le chemin par terre !'], ['path', 'follow_the_path']),
  moveTo('path', 'walk', 'father'),
  back('father'),
  ...(canDo(sp, 'climb') ? [act('actor', 'climb', 'I can climb the rocks! Up, up!', 'Je sais grimper sur les rochers ! Haut, haut !', 'actor')] : [act('actor', 'run', 'I can run! Look at me!', 'Je sais courir ! Regarde-moi !', 'actor')]),
  say('narrator', 'The sun goes down… The canyon is orange and red!', 'Le soleil se couche… Le canyon est orange et rouge !', {}, 'calm'),
  scene(true),
  say('mother', 'Now it is night. Look at the sky!', "C'est la nuit, maintenant. Regarde le ciel !", {}, 'calm'),
  props([skyProp('star1', 'star', 0), skyProp('moon', 'moon', 1), skyProp('star2', 'star', 2)]),
  tapProps('mother', 'Where is the moon? Touch the moon!', 'Où est la lune ? Touche la lune !', ['moon'], ['Look up in the sky!', 'Regarde en haut, dans le ciel !'], ['moon', 'night'], {
    onCorrect: L('Hello, moon!', 'Bonjour, la lune !'),
    wrong: { star1: L("That's a star!", "Ça, c'est une étoile !"), star2: L("That's a star!", "Ça, c'est une étoile !") },
  }),
  clearProps(),
  say('baby', "I'm tired…", 'Je suis fatigué…', { needs: 'baby' }, 'calm'),
  act('baby', 'sleep', 'Good night! Zzz…', 'Bonne nuit ! Zzz…', 'mother', { needs: 'baby' }),
  act('actor', 'sleep', 'Good night, canyon! Zzz…', 'Bonne nuit, le canyon ! Zzz…', 'actor'),
  scene(false),
  say('narrator', 'Good morning! The sun is up! Something shines on the ground…', 'Bonjour ! Le soleil est levé ! Quelque chose brille par terre…', {}, 'curious'),
  ...colorHunt('father', 'pebble', 'red', ['blue', 'green', 'yellow'], [5, 6, 7, 2], 'cpebble'),
  reward('red_stone', 'mother', 'A shiny red stone! It is our canyon treasure!', 'Une pierre rouge qui brille ! C’est notre trésor du canyon !'),
  end('father', 'What a great night in the canyon!', 'Quelle belle nuit au canyon !'),
];

export const AFRICA: AdventurePack = {
  adventures: [
    { id: 'africa_waterhole_trek', continentId: 'africa', titleEn: 'The big thirst', titleFr: 'La grande soif', icon: '💧', start: 'savanna', species: ['lion', 'elephant', 'giraffe'], skillIds: ['1.7', '3.2', '1.2'], steps: waterholeTrek, treasure: 'blue_pebble', order: 1 },
    { id: 'africa_baobab_picnic', continentId: 'africa', titleEn: 'The baobab picnic', titleFr: 'Le pique-nique du baobab', icon: '🧺', start: 'africa_plains', species: ['lion', 'elephant', 'giraffe'], skillIds: ['1.6', '1.3', '2.3'], steps: baobabPicnic, treasure: 'baobab_flower', order: 2 },
    { id: 'africa_desert_star', continentId: 'africa', titleEn: 'The desert star', titleFr: "L'étoile du désert", icon: '🌟', start: 'africa_desert', species: ['lion', 'elephant', 'giraffe'], skillIds: ['1.7', '2.7', '1.3'], steps: desertStar, treasure: 'desert_star', order: 3 },
    { id: 'africa_echo_canyon', continentId: 'africa', titleEn: 'The talking canyon', titleFr: 'Le canyon qui répond', icon: '🏜️', start: 'africa_plains', species: ['lion', 'elephant'], skillIds: ['1.1', '2.2', '1.2'], steps: echoCanyon, treasure: 'rainbow_feather', order: 4 },
    { id: 'africa_splash_day', continentId: 'africa', titleEn: 'Splash day', titleFr: 'Le jour du bain', icon: '💦', start: 'africa_waterhole', species: ['lion', 'elephant', 'giraffe'], skillIds: ['2.3', '1.3', '2.2'], steps: splashDay, treasure: 'pink_lily', order: 5 },
    { id: 'africa_baobab_birds', continentId: 'africa', titleEn: 'The baobab birds', titleFr: 'Les oiseaux du baobab', icon: '🐦', start: 'africa_baobab', species: ['lion', 'elephant', 'giraffe'], skillIds: ['2.3', '1.3', '2.7'], steps: baobabBirds, treasure: 'baobab_seed', order: 6 },
    { id: 'africa_canyon_night', continentId: 'africa', titleEn: 'Night in the canyon', titleFr: 'La nuit au canyon', icon: '🌙', start: 'africa_canyon', species: ['lion', 'elephant'], skillIds: ['1.7', '2.2', '1.4'], steps: canyonNight, treasure: 'red_stone', order: 7 },
  ],
  treasures: [
    treasure('blue_pebble', 'a blue pebble', 'un caillou bleu', '🔵'),
    treasure('baobab_flower', 'a baobab flower', 'une fleur de baobab', '🌼'),
    treasure('desert_star', 'a desert star', 'une étoile du désert', '🌟'),
    treasure('rainbow_feather', 'a rainbow feather', 'une plume arc-en-ciel', '🪶'),
    treasure('pink_lily', 'a pink water flower', "une fleur d'eau rose", '🪷'),
    treasure('baobab_seed', 'a baobab seed', 'une graine de baobab', '🌰'),
    treasure('red_stone', 'a shiny red stone', 'une pierre rouge qui brille', '🔴'),
  ],
};
