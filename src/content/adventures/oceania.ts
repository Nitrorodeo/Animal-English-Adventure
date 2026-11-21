/**
 * Aventures d'Océanie (Australie, décors du 2026-11-20) : outback rouge, forêt d'eucalyptus, gorges,
 * plage et forêt de fougères de Tasmanie.
 * Kangourou, koala et lézard à collerette n'ont pas les mêmes habitats : chaque aventure ne liste que les
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
  say('narrator', 'The sun goes down in the gum tree forest. The sky is pink and orange.', "Le soleil se couche dans la forêt d'eucalyptus. Le ciel est rose et orange.", {}, 'calm'),
  ask('father', 'The sun goes to bed. What do we say?', 'Le soleil va se coucher. Que dit-on ?', [ok('Good night!', 'Bonne nuit !', '🌙'), no('Good morning!', 'Bonjour !', '🌅'), no('Happy birthday!', 'Joyeux anniversaire !', '🎂'), no('Thank you!', 'Merci !', '🙏')], ['We say it before bed!', 'On le dit avant de dormir !'], ['good_night'], { onCorrect: L('Good night, sun!', 'Bonne nuit, soleil !') }),
  tap('mother', 'Look at the sky! Where is the cloud?', 'Regarde le ciel ! Où est le nuage ?', 'cloud', ['It is white, up high!', "Il est blanc, tout en haut !"], ['cloud', 'where']),
  ask('father', 'Is the tree big?', "Est-ce que l'arbre est grand ?", yesNo(true), ['Look at the tall tree!', 'Regarde le grand arbre !'], ['tree', 'big'], { minTier: 'intermediate', pointAt: 'tree', keepOrder: true }),
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
// 2. Le coquillage doré — une vague apporte un trésor sur la plage (toutes les espèces)
// ---------------------------------------------------------------------------

const goldenShell = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'Splash! A big wave comes to the sunny beach!', 'Splash ! Une grosse vague arrive sur la plage ensoleillée !', {}, 'curious'),
  tap('father', 'Where is the sea? Show me!', 'Où est la mer ? Montre-moi !', 'sea', ['It is big and blue!', 'Elle est grande et bleue !'], ['sea', 'where']),
  tap('mother', 'Look! Where is the wave?', 'Regarde ! Où est la vague ?', 'wave', ['It is white, on the sea!', 'Elle est blanche, sur la mer !'], ['wave', 'where']),
  say('baby', 'What is on the sand?', "Qu'est-ce qu'il y a sur le sable ?", { needs: 'baby' }, 'curious'),
  props([prop('shell', 'shell', 2), prop('leafd', 'leaf', 5)]),
  tapProps('mother', 'The wave brings something! Find it on the sand!', 'La vague apporte quelque chose ! Trouve-le sur le sable !', ['shell'], ['It is pretty and it comes from the sea!', 'Il est joli et il vient de la mer !'], ['shell', 'where'], {
    wrong: { leafd: L('A leaf? No, it comes from the tree!', "Une feuille ? Non, elle vient de l'arbre !") },
    onCorrect: L('Yes! That is it!', "Oui ! C'est ça !"),
  }),
  ask('father', 'What is it?', "Qu'est-ce que c'est ?", [ok('A shell!', 'Un coquillage !', '🐚'), no('An apple!', 'Une pomme !', '🍎'), no('A star!', 'Une étoile !', '⭐'), no('A car!', 'Une voiture !', '🚗')], ['It comes from the sea!', 'Il vient de la mer !'], ['shell'], { onCorrect: L('Yes! A shell!', 'Oui ! Un coquillage !') }),
  clearProps(),
  say('narrator', 'Splash, splash, splash! The waves bring more shells!', "Splash, splash, splash ! Les vagues apportent d'autres coquillages !", {}, 'happy'),
  ...countScene('father', 'shell', [1, 3, 4, 5, 6, 7], { beginner: 3, intermediate: 4, expert: 5 }, 'bshell'),
  tap('mother', 'Where is the sand? Show me!', 'Où est le sable ? Montre-moi !', 'sand', ['It is yellow, on the beach!', 'Il est jaune, sur la plage !'], ['sand', 'where']),
  ask('father', 'Is the sun hot?', 'Est-ce que le soleil est chaud ?', yesNo(true), ['Look at the sun!', 'Regarde le soleil !'], ['sun', 'hot'], { minTier: 'intermediate', pointAt: 'sun', keepOrder: true }),
  ...showOff(sp, ['hop', 'climb', 'run'], 'mother'),
  say('baby', 'I can do it too! Look!', 'Moi aussi, je sais faire ! Regarde !', { needs: 'baby' }, 'proud'),
  ...eatScene(sp, [0, 2, 4, 6], 'actor', 'snack'),
  say('narrator', 'Look! Yellow, blue and green butterflies come to say hello!', 'Regarde ! Des papillons jaunes, bleus et verts viennent dire bonjour !', {}, 'happy'),
  ...colorHunt('mother', 'butterfly', 'yellow', ['blue', 'green', 'red'], [1, 3, 5, 7], 'obf'),
  seek('father', 'sibling', 'rock', {
    line: ['Oh! Somebody is hiding! Maybe behind the big rock?', "Oh ! Quelqu'un se cache ! Peut-être derrière le gros rocher ?"],
    hint: ['Look behind the rock!', 'Regarde derrière le rocher !'],
    notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
    found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
  }, ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
  say('mother', 'Wow! One shell is golden!', 'Waouh ! Un coquillage est doré !', {}, 'curious'),
  reward('oc_golden_shell', 'father', 'A golden shell! It is our treasure!', 'Un coquillage doré ! C’est notre trésor !'),
  end('mother', 'What a surprise on the beach!', 'Quelle surprise sur la plage !'),
];

// ---------------------------------------------------------------------------
// 3. La cascade arc-en-ciel — petite cascade de la forêt d'eucalyptus ; le kangourou file ensuite
//    jusqu'à la forêt de fougères de Tasmanie (pas de koala ni de lézard à collerette là-bas).
// ---------------------------------------------------------------------------

const waterfallCrystal = (sp: SpeciesDef): QuestStep[] => {
  const forest: QuestStep[] = sp.id === 'kangaroo'
    ? [
        say('narrator', 'The kangaroo family likes to hop. To the fern forest!', 'La famille kangourou aime sautiller. Vers la forêt de fougères !', {}, 'happy'),
        go('oc_fern_forest', 'mother', "Let's hop to the forest!", 'Sautons jusqu’à la forêt !'),
        tap('father', 'Look at the big green leaves! Where is the fern?', 'Regarde les grandes feuilles vertes ! Où est la fougère ?', 'fern', ['It is a big green plant!', "C'est une grande plante verte !"], ['fern', 'where']),
        tap('mother', 'Listen! Splash! Where is the waterfall?', 'Écoute ! Splash ! Où est la cascade ?', 'waterfall', ['It is white, far away!', 'Elle est blanche, au loin !'], ['waterfall', 'where'], { minTier: 'intermediate' }),
        act('actor', 'hop', 'Hop, hop, hop! I hop in the forest!', 'Hop, hop, hop ! Je sautille dans la forêt !', 'actor'),
        say('baby', 'Hop, hop! I can hop too!', 'Hop, hop ! Moi aussi, je sais sautiller !', { needs: 'baby' }, 'proud'),
        ...eatScene(sp, [0, 2, 4, 6], 'actor', 'forest_meal'),
        ...colorHunt('mother', 'flower', 'pink', ['red', 'yellow', 'blue'], [1, 3, 5, 7], 'kflower'),
      ]
    : [
        tap('father', 'Look at the tall tree! Where is the tree?', "Regarde le grand arbre ! Où est l'arbre ?", 'tree', ['It is the big tree on the left!', "C'est le grand arbre à gauche !"], ['tree', 'where']),
        ...showOff(sp, ['climb'], 'mother'),
        say('baby', 'I can climb too! Look!', 'Moi aussi, je sais grimper ! Regarde !', { needs: 'baby' }, 'proud'),
        ...eatScene(sp, [0, 2, 4, 6], 'actor', 'forest_meal'),
        ...colorHunt('mother', 'flower', 'pink', ['red', 'yellow', 'blue'], [1, 3, 5, 7], 'kflower'),
      ];
  return [
    say('narrator', "It's sunny! We are at the little waterfall in the gum tree forest.", "Il fait beau ! Nous sommes à la petite cascade de la forêt d'eucalyptus.", {}, 'happy'),
    tap('father', 'Listen! Splash, splash! Where is the waterfall?', 'Écoute ! Splash, splash ! Où est la cascade ?', 'waterfall', ['It is little and white, by the water!', "Elle est petite et blanche, au bord de l'eau !"], ['waterfall', 'where']),
    ask('mother', 'Is the waterfall big or small?', 'La cascade est grande ou petite ?', [ok("It's small!", 'Elle est petite !', '💦'), no("It's big!", 'Elle est grande !', '🏔️')], ['Look! It is a little waterfall!', 'Regarde ! C’est une petite cascade !'], ['big', 'small', 'waterfall'], { keepOrder: true, pointAt: 'waterfall' }),
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
    ...forest,
    reward('oc_rainbow_crystal', 'father', 'A rainbow crystal! It is our treasure!', 'Un cristal arc-en-ciel ! C’est notre trésor !'),
    end('mother', 'What a beautiful day by the water!', "Quelle belle journée au bord de l'eau !"),
  ];
};

// ---------------------------------------------------------------------------
// 4. L'outback rouge — soleil, chapeaux, la grande colline rouge, puis l'eau des gorges (kangourou, lézard)
// ---------------------------------------------------------------------------

const redOutback = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'A new day in the red outback! The sun is very hot.', "Un nouveau jour dans l'outback rouge ! Le soleil est très chaud.", {}, 'happy'),
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
  tap('father', 'Look far away! Where is the big red hill?', 'Regarde au loin ! Où est la grande colline rouge ?', 'hill', ['It is big and red, far away!', 'Elle est grande et rouge, au loin !'], ['hill', 'where']),
  ask('mother', 'Is the hill red?', 'Est-ce que la colline est rouge ?', yesNo(true), ['Look at the hill!', 'Regarde la colline !'], ['hill', 'red'], { minTier: 'intermediate', pointAt: 'hill', keepOrder: true }),
  ...showOff(sp, ['hop', 'climb', 'run'], 'father'),
  say('baby', 'Look at me! I can do it too!', 'Regarde-moi ! Moi aussi, je sais faire !', { needs: 'baby' }, 'proud'),
  ...eatScene(sp, [0, 1, 2, 3], 'actor', 'snack'),
  say('narrator', 'Little flowers grow in the red sand. Let us count them!', 'De petites fleurs poussent dans le sable rouge. Comptons-les !', {}, 'happy'),
  ...countScene('mother', 'flower', [0, 2, 4, 6, 1, 3], { beginner: 3, intermediate: 4, expert: 5 }, 'cflower'),
  seek('father', 'sibling', 'rock', {
    line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
    hint: ['Look near the big rock!', 'Regarde près du gros rocher !'],
    notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
    found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
  }, ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
  say('mother', 'It is so hot! We are thirsty.', 'Il fait si chaud ! Nous avons soif.', {}, 'calm'),
  tap('mother', 'Follow the path to the water! Where is the path?', "Suivons le chemin jusqu'à l'eau ! Où est le chemin ?", 'path', ['Find the path on the red ground!', 'Trouve le chemin sur la terre rouge !'], ['path', 'follow_the_path']),
  moveTo('path', 'walk', 'mother'),
  go('oc_gorge', 'mother', "Let's go to the red gorge!", 'Allons aux gorges rouges !'),
  tap('father', 'Look! Where is the water?', "Regarde ! Où est l'eau ?", 'water', ['It is blue, between the red rocks!', 'Elle est bleue, entre les rochers rouges !'], ['water', 'where']),
  ...drinkScene(sp, 'water', 'actor'),
  ask('father', 'The water is so cool! How are you?', "L'eau est si fraîche ! Comment vas-tu ?", [ok("I'm happy!", 'Je suis content !', '😄'), no("I'm sad!", 'Je suis triste !', '😢'), no("I'm angry!", 'Je suis en colère !', '😠'), no("I'm cold!", "J'ai froid !", '🥶')], ['Look! It is a lovely day!', "Regarde ! C'est une belle journée !"], ['happy'], { onCorrect: L("Yes! We're happy!", 'Oui ! Nous sommes contents !') }),
  say('narrator', 'Look! Orange butterflies dance by the water!', "Regarde ! Des papillons orange dansent au bord de l'eau !", {}, 'curious'),
  ...colorHunt('father', 'butterfly', 'orange', ['purple', 'blue', 'green'], [1, 3, 5, 7], 'obt'),
  act('actor', 'dance', "Let's dance, family!", 'Dansons, la famille !', 'actor'),
  say('sibling', 'La la la! I love to dance!', "La la la ! J'adore danser !", { needs: 'sibling' }, 'happy'),
  reward('oc_gum_blossom', 'mother', 'A pink gum blossom! It is our treasure!', 'Une fleur rose d’eucalyptus ! C’est notre trésor !'),
  end('father', 'What a lovely day in the sun!', 'Quelle belle journée au soleil !'),
];

export const OCEANIA: AdventurePack = {
  adventures: [
    { id: 'oceania_forest_stars', continentId: 'oceania', titleEn: 'Stars over the forest', titleFr: 'Les étoiles de la forêt', icon: '🌟', start: 'oc_eucalyptus', species: ['kangaroo', 'koala', 'frilled_lizard'], skillIds: ['1.3', '1.2', '1.7'], steps: forestStars, treasure: 'oc_forest_star', order: 1 },
    { id: 'oceania_coconut_thump', continentId: 'oceania', titleEn: 'The golden shell', titleFr: 'Le coquillage doré', icon: '🐚', start: 'oc_beach', species: ['kangaroo', 'koala', 'frilled_lizard'], skillIds: ['1.3', '1.6', '2.2'], steps: goldenShell, treasure: 'oc_golden_shell', order: 2 },
    { id: 'oceania_waterfall_crystal', continentId: 'oceania', titleEn: 'The rainbow waterfall', titleFr: 'La cascade arc-en-ciel', icon: '💦', start: 'oc_eucalyptus', species: ['kangaroo', 'koala', 'frilled_lizard'], skillIds: ['1.7', '1.2', '3.2'], steps: waterfallCrystal, treasure: 'oc_rainbow_crystal', order: 3 },
    { id: 'oceania_sunny_clearing', continentId: 'oceania', titleEn: 'The red outback', titleFr: "L'outback rouge", icon: '☀️', start: 'oc_outback', species: ['kangaroo', 'frilled_lizard'], skillIds: ['2.7', '1.3', '2.2'], steps: redOutback, treasure: 'oc_gum_blossom', order: 4 },
  ],
  treasures: [
    treasure('oc_forest_star', 'a little star', 'une petite étoile', '⭐'),
    treasure('oc_golden_shell', 'a golden shell', 'un coquillage doré', '🐚'),
    // ancien trésor (avant les décors australiens) : gardé pour les coffres déjà remplis
    treasure('oc_golden_coconut', 'a golden coconut', 'une noix de coco dorée', '🥥'),
    treasure('oc_rainbow_crystal', 'a rainbow crystal', 'un cristal arc-en-ciel', '💎'),
    treasure('oc_gum_blossom', 'a gum blossom', 'une fleur d’eucalyptus', '🌸'),
  ],
};
