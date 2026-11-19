/**
 * Aventures d'Océanie : forêt tropicale, cascade, clairière et lagune aux nénuphars.
 * Kangourou, koala et ornithorynque n'ont pas les mêmes habitats : chaque aventure ne liste que les
 * espèces qui peuvent aller dans tous ses lieux, et certaines scènes dépendent de l'espèce.
 */
import type { Ability, QuestStep, SpeciesDef } from '../types';
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

/** Le personnage montre ce qu'il sait faire (une vraie capacité de son espèce), puis on le lui demande. */
function showOff(sp: SpeciesDef, prefs: readonly Ability[], askFrom: 'father' | 'mother'): QuestStep[] {
  const ab = prefs.find((a) => canDo(sp, a));
  if (!ab) return [];
  const w = ABILITY_WORDS[ab];
  return [
    act('actor', w.act, `Look! I can ${w.en}!`, `Regarde ! Je sais ${w.fr} !`, 'actor'),
    ask(askFrom, 'What can I do?', 'Qu’est-ce que je sais faire ?', [ok(`I can ${w.en}!`, `Je sais ${w.fr} !`, w.icon), no('I can fly!', 'Je sais voler !', '🪽'), no('I can drive a car!', 'Je sais conduire une voiture !', '🚗')], [`Look! I can ${w.en}!`, `Regarde ! Je sais ${w.fr} !`], ['can', w.en], { minTier: 'intermediate', keepOrder: false }),
  ];
}

// ---------------------------------------------------------------------------
// 1. Les étoiles de la forêt — le soir tombe, on compte les étoiles (toutes les espèces)
// ---------------------------------------------------------------------------

const forestStars = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'The sun goes down in the green forest. The sky is pink and orange.', 'Le soleil se couche dans la forêt verte. Le ciel est rose et orange.', {}, 'calm'),
  ask('father', 'The sun goes to bed. What do we say?', 'Le soleil va se coucher. Que dit-on ?', [ok('Good night!', 'Bonne nuit !', '🌙'), no('Good morning!', 'Bonjour !', '🌅'), no('Happy birthday!', 'Joyeux anniversaire !', '🎂'), no('Thank you!', 'Merci !', '🙏')], ['We say it before bed!', 'On le dit avant de dormir !'], ['good_night'], { onCorrect: L('Good night, sun!', 'Bonne nuit, soleil !') }),
  tap('mother', 'Look at the sky! Where is the cloud?', 'Regarde le ciel ! Où est le nuage ?', 'cloud', ['It is white, up high!', "Il est blanc, tout en haut !"], ['cloud', 'where']),
  ask('father', 'Is the mountain big?', 'Est-ce que la montagne est grande ?', yesNo(true), ['Look at the mountain!', 'Regarde la montagne !'], ['mountain', 'big'], { minTier: 'intermediate', pointAt: 'mountain', keepOrder: true }),
  say('narrator', 'The flowers close for the night. Can you find the red one?', 'Les fleurs se ferment pour la nuit. Peux-tu trouver la rouge ?', {}, 'curious'),
  ...colorHunt('mother', 'flower', 'red', ['yellow', 'pink', 'blue'], [0, 2, 4, 6], 'fflower'),
  say('baby', "I'm sleepy…", "J'ai sommeil…", { needs: 'baby' }, 'calm'),
  tap('father', "Let's rest! Where is the tree?", 'Reposons-nous ! Où est l’arbre ?', 'tree', ['The big tree is on the left!', "Le grand arbre est sur la gauche !"], ['tree', 'where']),
  moveTo('tree', 'rest', 'actor'),
  act('actor', 'sleep', 'Zzz… Zzz… Zzz…', 'Zzz… Zzz… Zzz…', 'actor'),
  back('actor'),
  say('narrator', 'Now it is night. Look at the stars!', "Maintenant, c'est la nuit. Regarde les étoiles !", {}, 'calm'),
  ...countScene('mother', 'star', [0, 1, 2, 3, 4, 5, 6], { beginner: 3, intermediate: 5, expert: 6 }, 'fstar'),
  ask('father', 'What do we see in the night sky?', 'Que voit-on dans le ciel la nuit ?', [ok('Stars!', 'Des étoiles !', '⭐'), no('Fish!', 'Des poissons !', '🐟'), no('Snow!', 'De la neige !', '❄️'), no('Cars!', 'Des voitures !', '🚗')], ['Count them: one, two, three…', 'Compte-les : one, two, three…'], ['star'], { minTier: 'intermediate' }),
  ask('mother', 'Are the stars big or small?', 'Les étoiles sont grandes ou petites ?', [ok('They are small!', 'Elles sont petites !', '✨'), no('They are big!', 'Elles sont grandes !', '🐘')], ['They are far away!', 'Elles sont très loin !'], ['small', 'big', 'star'], { minTier: 'expert', keepOrder: true }),
  seek('mother', 'sibling', 'rock', {
    line: ['Shh! Somebody is hiding behind the rock. Can you find them?', "Chut ! Quelqu'un se cache derrière le rocher. Tu peux le trouver ?"],
    hint: ['Look near the big rock!', 'Regarde près du gros rocher !'],
    notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
    found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
  }, ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
  say('baby', 'The stars are so pretty!', 'Les étoiles sont trop jolies !', { needs: 'baby' }, 'love'),
  say('sibling', 'Good night, little star!', 'Bonne nuit, petite étoile !', { needs: 'sibling' }, 'love'),
  ...(canDo(sp, 'climb') ? [say('narrator', 'Up in the tree, it is the best place to sleep.', "Là-haut dans l'arbre, c'est le meilleur endroit pour dormir.", {}, 'calm')] : []),
  reward('oc_forest_star', 'father', 'Look! A little star falls in the forest! It is our star!', 'Regarde ! Une petite étoile tombe dans la forêt ! C’est notre étoile !'),
  end('mother', 'Good night, forest!', 'Bonne nuit, la forêt !'),
];

// ---------------------------------------------------------------------------
// 2. La noix de coco dorée — « Boum ! » dans la forêt (toutes les espèces)
// ---------------------------------------------------------------------------

const coconutThump = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'Thump! Something falls from the tree!', 'Boum ! Quelque chose tombe de l’arbre !', {}, 'curious'),
  tap('father', 'Where is the tree? Show me!', 'Où est l’arbre ? Montre-moi !', 'tree', ['It is the big tree on the left!', 'C’est le grand arbre à gauche !'], ['tree', 'where']),
  say('baby', 'What is it?', "C'est quoi ?", { needs: 'baby' }, 'curious'),
  props([prop('coconut', 'coconut', 2), prop('leafd', 'leaf', 5)]),
  tapProps('mother', 'Look on the ground! Find the thing that fell!', 'Regarde par terre ! Trouve ce qui est tombé !', ['coconut'], ['It is big and brown!', "C'est gros et marron !"], ['coconut', 'where'], {
    wrong: { leafd: L('A leaf? No, it is too light!', 'Une feuille ? Non, elle est trop légère !') },
    onCorrect: L('Yes! That is it!', "Oui ! C'est ça !"),
  }),
  ask('father', 'What is it?', "Qu'est-ce que c'est ?", [ok('A coconut!', 'Une noix de coco !', '🥥'), no('An apple!', 'Une pomme !', '🍎'), no('A star!', 'Une étoile !', '⭐'), no('A fish!', 'Un poisson !', '🐟')], ['It has water inside!', "Il y a de l'eau dedans !"], ['coconut'], { onCorrect: L('Yes! A coconut!', 'Oui ! Une noix de coco !') }),
  clearProps(),
  say('narrator', 'Thump, thump, thump! More coconuts fall!', 'Boum, boum, boum ! D’autres noix de coco tombent !', {}, 'happy'),
  ...countScene('father', 'coconut', [1, 3, 4, 5, 6, 7], { beginner: 3, intermediate: 4, expert: 5 }, 'coco'),
  tap('mother', 'Coconuts have water inside. Where is the water?', "Les noix de coco ont de l'eau dedans. Où est l'eau ?", 'water', ['Look at the blue water!', "Regarde l'eau bleue !"], ['water', 'where'], { minTier: 'intermediate' }),
  ...showOff(sp, ['hop', 'climb', 'dig'], 'mother'),
  say('baby', 'I can do it too! Look!', 'Moi aussi, je sais faire ! Regarde !', { needs: 'baby' }, 'proud'),
  ...eatScene(sp, [0, 2, 4, 6], 'actor', 'snack'),
  say('narrator', 'Look! Yellow, blue and green butterflies come to say hello!', 'Regarde ! Des papillons jaunes, bleus et verts viennent dire bonjour !', {}, 'happy'),
  ...colorHunt('mother', 'butterfly', 'yellow', ['blue', 'green', 'red'], [1, 3, 5, 7], 'obf'),
  seek('father', 'sibling', 'tree', {
    line: ['Oh! Somebody is hiding! Maybe behind the big tree?', "Oh ! Quelqu'un se cache ! Peut-être derrière le grand arbre ?"],
    hint: ['Look behind the tree!', "Regarde derrière l'arbre !"],
    notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
    found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
  }, ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
  say('mother', 'Wow! One coconut is golden!', 'Waouh ! Une noix de coco est dorée !', {}, 'curious'),
  reward('oc_golden_coconut', 'father', 'A golden coconut! It is our treasure!', 'Une noix de coco dorée ! C’est notre trésor !'),
  end('mother', 'What a surprise in the forest!', 'Quelle surprise dans la forêt !'),
];

// ---------------------------------------------------------------------------
// 3. Le cristal de la cascade — cascade, puis lagune (ornithorynque) ou forêt (kangourou)
// ---------------------------------------------------------------------------

const waterfallCrystal = (sp: SpeciesDef): QuestStep[] => {
  const lagoon: QuestStep[] = [
    say('narrator', 'The platypus family likes to swim. To the lily lagoon!', "La famille ornithorynque aime nager. Vers la lagune aux nénuphars !", {}, 'happy'),
    go('oc_lagoon', 'mother', "Let's swim to the lagoon!", 'Nageons jusqu’à la lagune !'),
    tap('father', 'Look! A pretty flower on the water! Where is the water lily?', "Regarde ! Une jolie fleur sur l'eau ! Où est le nénuphar ?", 'water_lily', ['It is a flower on the water!', "C'est une fleur sur l'eau !"], ['water lily', 'where']),
    ask('mother', 'Is the water lily pink?', 'Est-ce que le nénuphar est rose ?', yesNo(true), ['Look at the water lily!', 'Regarde le nénuphar !'], ['water lily', 'pink'], { minTier: 'intermediate', pointAt: 'water_lily', keepOrder: true }),
    act('actor', 'swim', 'I swim between the lilies!', 'Je nage entre les nénuphars !', 'actor'),
    say('narrator', 'Look! Shells shine under the water!', "Regarde ! Des coquillages brillent sous l'eau !", {}, 'curious'),
    ...countScene('mother', 'shell', [0, 1, 2, 3, 5, 6, 7], { beginner: 3, intermediate: 4, expert: 6 }, 'shell'),
    ...eatScene(sp, [1, 2, 4, 6], 'actor', 'lagoon_meal'),
  ];
  const forest: QuestStep[] = [
    say('narrator', 'The kangaroo family likes to hop. To the green forest!', 'La famille kangourou aime sautiller. Vers la forêt verte !', {}, 'happy'),
    go('oc_forest', 'mother', "Let's hop to the forest!", 'Sautons jusqu’à la forêt !'),
    tap('father', 'Look at the tall tree! Where is the tree?', "Regarde le grand arbre ! Où est l'arbre ?", 'tree', ['It is the big tree on the left!', "C'est le grand arbre à gauche !"], ['tree', 'where']),
    act('actor', 'hop', 'Hop, hop, hop! I hop in the forest!', 'Hop, hop, hop ! Je sautille dans la forêt !', 'actor'),
    say('baby', 'Hop, hop! I can hop too!', 'Hop, hop ! Moi aussi, je sais sautiller !', { needs: 'baby' }, 'proud'),
    ...eatScene(sp, [0, 2, 4, 6], 'actor', 'forest_meal'),
    ...colorHunt('mother', 'flower', 'pink', ['red', 'yellow', 'blue'], [1, 3, 5, 7], 'kflower'),
  ];
  return [
    say('narrator', "It's sunny! We are at the big waterfall in the rainforest.", 'Il fait beau ! Nous sommes à la grande cascade de la forêt tropicale.', {}, 'happy'),
    tap('father', 'Listen! Splash, splash! Where is the waterfall?', 'Écoute ! Splash, splash ! Où est la cascade ?', 'waterfall', ['It is big and white!', "Elle est grande et blanche !"], ['waterfall', 'where']),
    ask('mother', 'Is the waterfall big or small?', 'La cascade est grande ou petite ?', [ok("It's big!", 'Elle est grande !', '💦'), no("It's small!", 'Elle est petite !', '🐭')], ['It is very high!', 'Elle est très haute !'], ['big', 'small', 'waterfall'], { keepOrder: true, pointAt: 'waterfall' }),
    tap('father', 'Follow the path to the water! Where is the path?', "Suivons le chemin jusqu'à l'eau ! Où est le chemin ?", 'path', ['Find the path on the ground!', 'Trouve le chemin par terre !'], ['path', 'follow_the_path']),
    moveTo('path', 'walk', 'father'),
    ...drinkScene(sp, 'water', 'actor'),
    act('baby', 'splash', 'Splash! Splash! The water is cool!', "Splash ! Splash ! L'eau est fraîche !", 'baby', { needs: 'baby' }),
    ask('mother', 'How is the weather today?', 'Quel temps fait-il aujourd’hui ?', [ok("It's sunny!", 'Il fait beau !', '☀️'), no("It's snowy!", 'Il neige !', '🌨️'), no("It's cold!", 'Il fait froid !', '🥶'), no("It's rainy!", 'Il pleut !', '🌧️')], ['Look at the sun!', 'Regarde le soleil !'], ['weather', 'sunny'], { minTier: 'intermediate' }),
    say('narrator', 'Look! The waterfall makes a rainbow!', 'Regarde ! La cascade fait un arc-en-ciel !', {}, 'happy'),
    ...colorHunt('mother', 'pebble', 'red', ['blue', 'yellow', 'green'], [3, 4, 7, 0], 'wpebble'),
    ...countScene('father', 'butterfly', [0, 1, 2, 5, 6, 7], { beginner: 3, intermediate: 4, expert: 5 }, 'wbf'),
    seek('mother', 'sibling', 'rock', {
      line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
      hint: ['Look behind the big rock!', 'Regarde derrière le gros rocher !'],
      notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
      found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
    }, ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
    ...(sp.id === 'platypus' ? lagoon : forest),
    reward('oc_rainbow_crystal', 'father', 'A rainbow crystal! It is our treasure!', 'Un cristal arc-en-ciel ! C’est notre trésor !'),
    end('mother', 'What a beautiful day by the water!', "Quelle belle journée au bord de l'eau !"),
  ];
};

// ---------------------------------------------------------------------------
// 4. La clairière ensoleillée — soleil, chapeaux, danse, puis la forêt (kangourou, koala)
// ---------------------------------------------------------------------------

const sunnyClearing = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'A new day in the sunny clearing! The sun is warm.', 'Un nouveau jour dans la clairière ensoleillée ! Le soleil est chaud.', {}, 'happy'),
  props([prop('sg', 'sunglasses', 1), prop('um', 'umbrella', 3)], { maxTier: 'beginner' }),
  props([prop('hat', 'hat', 0), prop('sg', 'sunglasses', 1), prop('um', 'umbrella', 3), prop('bt', 'boots', 5)], { minTier: 'intermediate' }),
  tapProps('mother', "It's sunny! Find the sunglasses!", 'Il fait beau ! Trouve les lunettes de soleil !', ['sg'], ['Sunglasses for the sun!', 'Des lunettes pour le soleil !'], ['sunglasses', 'sunny'], {
    maxTier: 'beginner',
    onCorrect: L('Yes! Sunglasses for the sun!', 'Oui ! Des lunettes pour le soleil !'),
    wrong: { um: L("An umbrella? No! It's sunny!", "Un parapluie ? Non ! Il fait beau !") },
  }),
  tapProps('mother', "It's sunny! Find the hat and the sunglasses!", 'Il fait beau ! Trouve le chapeau et les lunettes de soleil !', ['hat', 'sg'], ['Things for the sun!', 'Des choses pour le soleil !'], ['hat', 'sunglasses', 'sunny'], {
    minTier: 'intermediate',
    onCorrect: L('Great! We are ready for the sun!', 'Super ! Nous sommes prêts pour le soleil !'),
    wrong: { um: L("An umbrella? No! It's sunny!", "Un parapluie ? Non ! Il fait beau !"), bt: L("Boots? No! It's dry!", "Des bottes ? Non ! Il fait sec !") },
  }),
  clearProps(),
  tap('father', 'Look up! Where is the vine?', 'Regarde en haut ! Où est la liane ?', 'vine', ['It is long and green!', 'Elle est longue et verte !'], ['vine', 'where']),
  ask('mother', 'Is the vine long?', 'Est-ce que la liane est longue ?', yesNo(true), ['Look at the vine!', 'Regarde la liane !'], ['vine', 'long'], { minTier: 'expert', pointAt: 'vine', keepOrder: true }),
  ...showOff(sp, ['hop', 'climb'], 'father'),
  say('baby', 'Look at me! I can do it too!', 'Regarde-moi ! Moi aussi, je sais faire !', { needs: 'baby' }, 'proud'),
  ...drinkScene(sp, 'water', 'mother'),
  ...eatScene(sp, [0, 1, 2, 3], 'actor', 'snack'),
  say('narrator', 'Pretty flowers grow in the clearing. Let us count them!', 'De jolies fleurs poussent dans la clairière. Comptons-les !', {}, 'happy'),
  ...countScene('mother', 'flower', [0, 2, 4, 6, 1, 3], { beginner: 3, intermediate: 4, expert: 5 }, 'cflower'),
  seek('father', 'sibling', 'rock', {
    line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
    hint: ['Look near the big rock!', 'Regarde près du gros rocher !'],
    notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
    found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
  }, ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
  tap('mother', 'Now follow the path to the forest! Where is the path?', 'Maintenant, suivons le chemin jusqu’à la forêt ! Où est le chemin ?', 'path', ['Find the path on the grass!', "Trouve le chemin dans l'herbe !"], ['path', 'follow_the_path']),
  moveTo('path', 'walk', 'mother'),
  go('oc_forest', 'mother', "Let's go to the green forest!", 'Allons à la forêt verte !'),
  ask('father', 'The forest is so pretty! How are you?', 'La forêt est trop jolie ! Comment vas-tu ?', [ok("I'm happy!", 'Je suis content !', '😄'), no("I'm sad!", 'Je suis triste !', '😢'), no("I'm angry!", 'Je suis en colère !', '😠'), no("I'm cold!", "J'ai froid !", '🥶')], ['Look! It is a lovely day!', "Regarde ! C'est une belle journée !"], ['happy'], { onCorrect: L("Yes! We're happy!", 'Oui ! Nous sommes contents !') }),
  say('narrator', 'Look! Orange butterflies dance around the trees!', 'Regarde ! Des papillons orange dansent autour des arbres !', {}, 'curious'),
  ...colorHunt('father', 'butterfly', 'orange', ['purple', 'blue', 'green'], [1, 3, 5, 7], 'obt'),
  act('actor', 'dance', "Let's dance, family!", 'Dansons, la famille !', 'actor'),
  say('sibling', 'La la la! I love to dance!', "La la la ! J'adore danser !", { needs: 'sibling' }, 'happy'),
  reward('oc_gum_blossom', 'mother', 'A pink gum blossom! It is our treasure!', 'Une fleur rose d’eucalyptus ! C’est notre trésor !'),
  end('father', 'What a lovely day in the sun!', 'Quelle belle journée au soleil !'),
];

export const OCEANIA: AdventurePack = {
  adventures: [
    { id: 'oceania_forest_stars', continentId: 'oceania', titleEn: 'Stars over the forest', titleFr: 'Les étoiles de la forêt', icon: '🌟', start: 'oc_forest', species: ['kangaroo', 'koala', 'platypus'], skillIds: ['1.3', '1.2', '1.7'], steps: forestStars, treasure: 'oc_forest_star', order: 1 },
    { id: 'oceania_coconut_thump', continentId: 'oceania', titleEn: 'The golden coconut', titleFr: 'La noix de coco dorée', icon: '🥥', start: 'oc_forest', species: ['kangaroo', 'koala', 'platypus'], skillIds: ['1.3', '1.6', '2.2'], steps: coconutThump, treasure: 'oc_golden_coconut', order: 2 },
    { id: 'oceania_waterfall_crystal', continentId: 'oceania', titleEn: 'The rainbow waterfall', titleFr: 'La cascade arc-en-ciel', icon: '💦', start: 'oc_waterfall', species: ['kangaroo', 'platypus'], skillIds: ['1.7', '1.2', '3.2'], steps: waterfallCrystal, treasure: 'oc_rainbow_crystal', order: 3 },
    { id: 'oceania_sunny_clearing', continentId: 'oceania', titleEn: 'The sunny clearing', titleFr: 'La clairière ensoleillée', icon: '☀️', start: 'oc_clearing', species: ['kangaroo', 'koala'], skillIds: ['2.7', '1.3', '2.2'], steps: sunnyClearing, treasure: 'oc_gum_blossom', order: 4 },
  ],
  treasures: [
    treasure('oc_forest_star', 'a little star', 'une petite étoile', '⭐'),
    treasure('oc_golden_coconut', 'a golden coconut', 'une noix de coco dorée', '🥥'),
    treasure('oc_rainbow_crystal', 'a rainbow crystal', 'un cristal arc-en-ciel', '💎'),
    treasure('oc_gum_blossom', 'a gum blossom', 'une fleur d’eucalyptus', '🌸'),
  ],
};
