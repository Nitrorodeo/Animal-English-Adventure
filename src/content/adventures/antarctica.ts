/**
 * Aventures d'Antarctique (décors illustrés du 2026-11-20) : banquise, grotte de glace, mer froide. Manchot et phoque vivent sur la glace
 * et dans la mer ; l'ours polaire aussi (décision du parent, 2026-11-20). L'orque a été retirée du jeu le 2026-11-20.
 */
import type { Ability, AdventureDef, QuestStep, SpeciesDef } from '../types';
import {
  ABILITY_WORDS,
  act,
  ask,
  back,
  canDo,
  clearProps,
  colorHunt,
  countScene,
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
  skyProp,
  tap,
  tapProps,
  treasure,
  yesNo,
  type AdventurePack,
} from './kit';

/** Le personnage montre une capacité réelle de son espèce, puis on lui demande ce qu'il sait faire. */
function showOff(sp: SpeciesDef, prefs: readonly Ability[], from: 'father' | 'mother'): QuestStep[] {
  const ab = prefs.find((a) => canDo(sp, a));
  if (!ab) return [];
  const w = ABILITY_WORDS[ab];
  const lineEn = ab === 'jump' ? 'Splash! I jump over the waves!' : `Look! I can ${w.en}!`;
  const lineFr = ab === 'jump' ? 'Splash ! Je saute par-dessus les vagues !' : `Regarde ! Je sais ${w.fr} !`;
  return [
    act('actor', w.act, lineEn, lineFr, 'actor'),
    ask(from, 'What can I do?', 'Qu’est-ce que je sais faire ?', [ok(`I can ${w.en}!`, `Je sais ${w.fr} !`, w.icon), no('I can fly!', 'Je sais voler !', '🪽'), no('I can drive a car!', 'Je sais conduire une voiture !', '🚗')], [`Look! I can ${w.en}!`, `Regarde ! Je sais ${w.fr} !`], ['can', w.en], { minTier: 'intermediate' }),
  ];
}

// ---------------------------------------------------------------------------
// 1. Le jour des flocons — froid, neige, glaçons, puis un plongeon dans la mer (manchot, phoque)
// ---------------------------------------------------------------------------

const snowDay = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'Brrr! It is cold on the ice. There is snow everywhere!', 'Brrr ! Il fait froid sur la glace. Il y a de la neige partout !', {}, 'calm'),
  tap('father', 'Look at the snow! Where is the snow?', 'Regarde la neige ! Où est la neige ?', 'snow', ['It is white, on the ground!', "C'est blanc, par terre !"], ['snow', 'where']),
  ask('mother', 'How is the weather today?', 'Quel temps fait-il aujourd’hui ?', [ok("It's cold!", 'Il fait froid !', '🥶'), no("It's hot!", 'Il fait chaud !', '🥵'), no("It's rainy!", 'Il pleut !', '🌧️')], ['Brrr! Look at the snow!', 'Brrr ! Regarde la neige !'], ['weather', 'cold'], { onCorrect: L("Yes! It's very cold!", 'Oui ! Il fait très froid !') }),
  say('narrator', 'Snowflakes fall from the sky!', 'Des flocons tombent du ciel !', {}, 'happy'),
  ...countScene('mother', 'snowflake', [0, 1, 2, 3, 4, 5, 6], { beginner: 3, intermediate: 5, expert: 6 }, 'flake'),
  ask('father', 'Is the snow cold?', 'Est-ce que la neige est froide ?', yesNo(true), ['Brrr! Touch the snow!', 'Brrr ! Touche la neige !'], ['snow', 'cold'], { minTier: 'intermediate', pointAt: 'snow', keepOrder: true }),
  props([prop('cube', 'ice', 3), prop('peb', 'pebble', 5)]),
  tapProps('mother', 'Look! Something is very cold. Find the ice cube!', 'Regarde ! Quelque chose est très froid. Trouve le glaçon !', ['cube'], ['It is shiny and cold!', "C'est brillant et froid !"], ['ice', 'cold'], {
    wrong: { peb: L('A pebble? No, it is not ice!', "Un caillou ? Non, ce n'est pas de la glace !") },
    onCorrect: L('Yes! Ice! Brrr!', 'Oui ! De la glace ! Brrr !'),
  }),
  clearProps(),
  say('baby', 'Brrr! I am cold!', "Brrr ! J'ai froid !", { needs: 'baby' }, 'calm'),
  say('mother', 'Come close, little one. Together, we are warm.', 'Viens tout près, mon petit. Ensemble, nous avons chaud.', { needs: 'baby' }, 'love'),
  tap('father', 'Where is the iceberg? Let us rest there!', 'Où est l’iceberg ? Reposons-nous là-bas !', 'iceberg', ['It is big and white!', "Il est grand et blanc !"], ['iceberg', 'where']),
  moveTo('iceberg', 'rest', 'actor'),
  say('actor', 'Ahh! It is cold, but I am happy.', "Ahh ! Il fait froid, mais je suis content.", {}, 'happy'),
  back('actor'),
  ...eatScene(sp, [0, 2, 4, 6], 'father', 'fish'),
  seek('mother', 'sibling', 'rock', {
    line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
    hint: ['Look behind the big rock!', 'Regarde derrière le gros rocher !'],
    notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
    found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
  }, ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
  act('actor', 'dance', "Let's dance on the ice!", 'Dansons sur la glace !', 'actor'),
  say('sibling', 'La la la! Dancing is warm!', 'La la la ! Danser, ça réchauffe !', { needs: 'sibling' }, 'happy'),
  say('narrator', 'Time for a swim in the cold sea!', 'C’est l’heure de nager dans la mer froide !', {}, 'happy'),
  go('open_sea', 'father', "Let's go to the sea!", 'Allons à la mer !'),
  tap('mother', 'Where is the sea? Show me!', 'Où est la mer ? Montre-moi !', 'sea', ['It is big and blue!', "Elle est grande et bleue !"], ['sea', 'where']),
  ...showOff(sp, ['swim'], 'mother'),
  reward('ant_snow_crystal', 'father', 'A shiny snow crystal! It is our treasure!', 'Un cristal de neige tout brillant ! C’est notre trésor !'),
  end('mother', 'What a snowy day!', 'Quelle journée de neige !'),
];

// ---------------------------------------------------------------------------
// 2. Le festin de poissons — en pleine mer (toutes les espèces)
// ---------------------------------------------------------------------------

const fishFeast = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'The sea is big and blue. The water is very cold!', "La mer est grande et bleue. L'eau est très froide !", {}, 'calm'),
  ask('father', 'Are you hungry?', 'Tu as faim ?', [ok("Yes, I'm hungry!", "Oui, j'ai faim !", '😋'), ok('Yes, a little!', 'Oui, un peu !', '🤏')], ["You can say: yes, I'm hungry!", "Tu peux dire : yes, I'm hungry!"], ['hungry'], { keepOrder: true, onCorrect: L("Then let's find some fish!", 'Alors cherchons du poisson !') }),
  tap('mother', 'Look at the ice on the sea! Where is the ice?', 'Regarde la glace sur la mer ! Où est la glace ?', 'ice', ['It is white and flat, on the sea!', 'Elle est blanche et plate, sur la mer !'], ['ice', 'where']),
  say('narrator', 'Look! Fish swim under the ice!', 'Regarde ! Des poissons nagent sous la glace !', {}, 'curious'),
  ...colorHunt('mother', 'koi', 'blue', ['yellow', 'red', 'green'], [0, 2, 4, 6], 'cfish'),
  say('father', 'There are so many fish! Can we count them?', 'Il y a tellement de poissons ! On peut les compter ?', {}, 'happy'),
  ...countScene('father', 'koi', [1, 3, 5, 7, 0, 2], { beginner: 3, intermediate: 4, expert: 5 }, 'kfish'),
  ...eatScene(sp, [1, 3, 5, 7], 'actor', 'feast'),
  say('baby', 'Yum! I love fish!', "Miam ! J'adore le poisson !", { needs: 'baby' }, 'happy'),
  ...showOff(sp, ['jump', 'swim'], 'father'),
  tap('mother', 'Look at the big white thing! Where is the iceberg?', 'Regarde la grande chose blanche ! Où est l’iceberg ?', 'iceberg', ['It is big, white and cold!', "Il est grand, blanc et froid !"], ['iceberg', 'where']),
  ask('father', 'Is the iceberg big?', "Est-ce que l'iceberg est grand ?", yesNo(true), ['Look at the iceberg!', "Regarde l'iceberg !"], ['iceberg', 'big'], { minTier: 'intermediate', pointAt: 'iceberg', keepOrder: true }),
  tap('father', 'Look up! Where is the cliff?', 'Regarde en haut ! Où est la falaise ?', 'cliff', ['It is big and blue, made of ice!', 'Elle est grande et bleue, en glace !'], ['cliff', 'where']),
  ask('mother', 'Is the cliff big or small?', 'La falaise est grande ou petite ?', [ok("It's big!", 'Elle est grande !', '🧊'), no("It's small!", 'Elle est petite !', '🐭')], ['Look! It is very high!', 'Regarde ! Elle est très haute !'], ['big', 'small', 'cliff'], { minTier: 'intermediate', pointAt: 'cliff', keepOrder: true }),
  seek('mother', 'sibling', 'iceberg', {
    line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
    hint: ['Look behind the iceberg!', "Regarde derrière l'iceberg !"],
    notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
    found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
  }, ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
  say('sibling', 'The sea is so big!', 'La mer est si grande !', { needs: 'sibling' }, 'happy'),
  reward('ant_silver_fish', 'father', 'A silver fish! It is our treasure!', 'Un poisson argenté ! C’est notre trésor !'),
  end('mother', 'What a yummy feast!', 'Quel bon festin !'),
];

// ---------------------------------------------------------------------------
// 3. La plume blanche — un oiseau, le vent et les vagues (manchot, phoque : puis la banquise)
// ---------------------------------------------------------------------------

const whiteFeather = (sp: SpeciesDef): QuestStep[] => {
  // Le manchot rentre dans la grotte de glace ; le phoque reste sur la banquise, au bord de l'eau.
  const home: QuestStep[] = sp.id === 'penguin'
    ? [
        go('an_ice_cave', 'mother', "Let's go to the ice cave!", 'Allons à la grotte de glace !'),
        tap('father', 'Where is the ice cave? Show me!', 'Où est la grotte de glace ? Montre-moi !', 'cave', ['It is a big blue cave in the ice!', "C'est une grande grotte bleue dans la glace !"], ['ice cave', 'where']),
        ask('mother', 'Is the ice cave cold?', 'Est-ce que la grotte de glace est froide ?', yesNo(true), ['Brrr! Look at the ice cave!', 'Brrr ! Regarde la grotte de glace !'], ['ice cave', 'cold'], { minTier: 'intermediate', pointAt: 'cave', keepOrder: true }),
      ]
    : [
        go('ice_coast', 'mother', "Let's go to the ice!", 'Allons sur la glace !'),
        tap('father', 'Where is the ice? Show me!', 'Où est la glace ? Montre-moi !', 'ice', ['It is blue and white, far away!', 'Elle est bleue et blanche, au loin !'], ['ice', 'where']),
        ask('mother', 'Is the ice blue?', 'Est-ce que la glace est bleue ?', yesNo(true), ['Look at the ice!', 'Regarde la glace !'], ['ice', 'blue'], { minTier: 'intermediate', pointAt: 'ice', keepOrder: true }),
      ];
  const onIce: QuestStep[] = [
    say('narrator', 'The family goes back to the ice.', 'La famille retourne sur la banquise.', {}, 'calm'),
    ...home,
    canDo(sp, 'hop') ? act('actor', 'hop', 'Hop, hop, hop on the ice!', 'Hop, hop, hop sur la glace !', 'actor') : act('actor', 'dance', 'I dance on the ice!', 'Je danse sur la glace !', 'actor'),
    say('baby', 'I love the ice!', "J'adore la glace !", { needs: 'baby' }, 'happy'),
  ];
  return [
    say('narrator', 'The wind blows on the sea. Look! A bird flies in the sky!', 'Le vent souffle sur la mer. Regarde ! Un oiseau vole dans le ciel !', {}, 'curious'),
    props([skyProp('bird', 'bird', 2), skyProp('flake', 'snowflake', 5)]),
    tapProps('father', 'Where is the bird? Show me!', "Où est l'oiseau ? Montre-moi !", ['bird'], ['It is up high, in the sky!', 'Il est tout en haut, dans le ciel !'], ['bird', 'where'], {
      wrong: { flake: L('A snowflake? No! Find the bird!', "Un flocon ? Non ! Trouve l'oiseau !") },
    }),
    ask('mother', "Let's say hello to the bird! What do we say?", "Disons bonjour à l'oiseau ! Que dit-on ?", [ok('Hello!', 'Bonjour !', '👋'), no('Goodbye!', 'Au revoir !', '🙋'), no('Thank you!', 'Merci !', '🙏'), no("I'm hungry!", "J'ai faim !", '😋')], ['We say: hello!', 'On dit : hello!'], ['hello'], { onCorrect: L('Hello, bird!', 'Bonjour, l’oiseau !') }),
    ask('father', 'Is the bird white?', "Est-ce que l'oiseau est blanc ?", yesNo(true), ['Look at the bird!', "Regarde l'oiseau !"], ['bird', 'white'], { minTier: 'intermediate', keepOrder: true }),
    ask('mother', 'How is the weather today?', 'Quel temps fait-il aujourd’hui ?', [ok("It's windy!", 'Il y a du vent !', '🌬️'), no("It's hot!", 'Il fait chaud !', '🥵'), no("It's rainy!", 'Il pleut !', '🌧️')], ['Look! The sea moves!', 'Regarde ! La mer bouge !'], ['weather', 'windy'], { minTier: 'intermediate' }),
    clearProps(),
    tap('mother', 'The wind blows on the sea! Where is the sea?', 'Le vent souffle sur la mer ! Où est la mer ?', 'sea', ['It is big and blue!', 'Elle est grande et bleue !'], ['sea', 'where']),
    ask('father', 'What colour is the sea?', 'De quelle couleur est la mer ?', [ok('Blue!', 'Bleue !', '🔵'), no('Red!', 'Rouge !', '🔴'), no('Yellow!', 'Jaune !', '🟡'), no('Pink!', 'Rose !', '🩷')], ['Look at the sea!', 'Regarde la mer !'], ['blue', 'sea'], { minTier: 'expert', pointAt: 'sea' }),
    ...showOff(sp, ['jump', 'swim'], 'father'),
    say('narrator', 'The bird drops feathers on the sea! Can you find the white one?', "L'oiseau laisse tomber des plumes sur la mer ! Peux-tu trouver la blanche ?", {}, 'curious'),
    ...colorHunt('mother', 'feather', 'white', ['blue', 'yellow', 'green'], [0, 2, 4, 6], 'bfeather'),
    say('father', 'Look! Little ice cubes float on the water!', "Regarde ! De petits glaçons flottent sur l'eau !", {}, 'curious'),
    ...countScene('father', 'ice', [1, 3, 5, 7, 0, 2], { beginner: 3, intermediate: 4, expert: 5 }, 'icecube'),
    seek('mother', 'sibling', 'iceberg', {
      line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
      hint: ['Look behind the iceberg!', "Regarde derrière l'iceberg !"],
      notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
      found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
    }, ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
    ...onIce,
    ask('father', 'The bird flies away. What do we say?', "L'oiseau s'envole. Que dit-on ?", [ok('Goodbye!', 'Au revoir !', '🙋'), no('Hello!', 'Bonjour !', '👋'), no("I'm cold!", "J'ai froid !", '🥶'), no('Good morning!', 'Bonjour !', '🌅')], ['We say: goodbye!', 'On dit : goodbye!'], ['goodbye'], { onCorrect: L('Goodbye, bird!', 'Au revoir, l’oiseau !') }),
    reward('ant_white_feather', 'mother', 'A white feather from the bird! It is our treasure!', 'Une plume blanche de l’oiseau ! C’est notre trésor !'),
    end('father', 'What a windy day!', 'Quelle journée de vent !'),
  ];
};

// ===========================================================================
// Les neuf parcours (2026-11-23) : chaque famille a ses 3 décors, une histoire par décor.
// Débutant : 2 réponses, mécaniques existantes (toucher, répondre, compter) ; l'intermédiaire ajoute
// les questions de comparaison, de position, de couleur et la cachette.
// ===========================================================================

const SEEK_TEXT = (where: string, whereFr: string) => ({
  line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"] as [string, string],
  hint: [`Look behind the ${where}!`, `Regarde derrière ${whereFr} !`] as [string, string],
  notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'] as [string, string],
  found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'] as [string, string],
});

// --- Ours polaire -----------------------------------------------------------

/** Ours 1 — la côte de glace : l'eau, les plaques de glace, nager. */
const iceLagoon = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'The sun shines on the ice coast. The sea is big and blue.', 'Le soleil brille sur la côte de glace. La mer est grande et bleue.', {}, 'happy'),
  tap('father', 'Where is the sea? Show me!', 'Où est la mer ? Montre-moi !', 'sea', ['It is big and blue!', 'Elle est grande et bleue !'], ['sea', 'where']),
  ask('mother', 'Is the sea hot?', 'Est-ce que la mer est chaude ?', yesNo(false), ['Brrr! Look at the sea!', 'Brrr ! Regarde la mer !'], ['sea', 'hot'], { minTier: 'intermediate', pointAt: 'sea', keepOrder: true }),
  say('baby', 'Can we swim in the sea?', 'On peut nager dans la mer ?', { needs: 'baby' }, 'happy'),
  ...showOff(sp, ['swim'], 'mother'),
  tap('mother', 'Look at the ice! Where is the ice floe?', 'Regarde la glace ! Où est la plaque de glace ?', 'floe', ['It floats on the sea!', 'Elle flotte sur la mer !'], ['ice floe', 'where']),
  ...countScene('mother', 'ice', [0, 1, 2, 3, 4, 5], { beginner: 2, intermediate: 3, expert: 5 }, 'lagice'),
  ask('father', 'Is the sun hot?', 'Est-ce que le soleil est chaud ?', yesNo(false), ['Look! It is cold here!', 'Regarde ! Il fait froid ici !'], ['sun', 'cold'], { minTier: 'intermediate', pointAt: 'sun', keepOrder: true }),
  tap('father', 'Where is the big iceberg?', 'Où est le gros iceberg ?', 'iceberg', ['It is big and white!', 'Il est grand et blanc !'], ['iceberg', 'where']),
  ask('mother', 'Which one is bigger, the iceberg or the rock?', 'Lequel est le plus gros, l’iceberg ou le rocher ?', [ok('The iceberg!', 'L’iceberg !', '🧊'), no('The rock!', 'Le rocher !', '🪨')], ['Look! The iceberg is very big!', 'Regarde ! L’iceberg est très gros !'], ['bigger', 'iceberg', 'rock'], { minTier: 'intermediate', pointAt: 'iceberg', keepOrder: true }),
  seek('mother', 'sibling', 'rock', SEEK_TEXT('rock', 'le rocher'), ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
  act('baby', 'splash', 'Splash! Splash! The water is fun!', "Splash ! Splash ! L'eau, c'est rigolo !", 'baby', { needs: 'baby' }),
  reward('ant_blue_ice', 'father', 'A piece of blue ice! It is our treasure!', 'Un morceau de glace bleue ! C’est notre trésor !'),
  end('mother', 'What a nice day at the ice coast!', 'Quelle belle journée sur la côte de glace !'),
];

/** Ours 2 — la grotte de glace : cristaux, écho, cache-cache. */
const crystalCave = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'The wind is strong. The family goes into the shiny ice cave.', "Le vent est fort. La famille entre dans la grotte de glace qui brille.", {}, 'curious'),
  tap('father', 'Where is the ice cave? Show me!', 'Où est la grotte de glace ? Montre-moi !', 'cave', ['It is a big blue cave in the ice!', "C'est une grande grotte bleue dans la glace !"], ['ice cave', 'where']),
  ask('mother', 'Is the ice cold?', 'Est-ce que la glace est froide ?', yesNo(true), ['Brrr! Touch the ice!', 'Brrr ! Touche la glace !'], ['ice', 'cold'], { pointAt: 'ice', keepOrder: true }),
  tap('mother', 'Look at the shiny crystals! Where is the crystal?', 'Regarde les cristaux qui brillent ! Où est le cristal ?', 'crystal', ['It is shiny and blue!', "C'est brillant et bleu !"], ['crystal', 'where']),
  ask('father', 'What colour is the crystal?', 'De quelle couleur est le cristal ?', [ok('Blue!', 'Bleu !', '🔵'), no('Red!', 'Rouge !', '🔴'), no('Green!', 'Vert !', '🟢')], ['Look at the crystal!', 'Regarde le cristal !'], ['blue', 'crystal'], { minTier: 'intermediate', pointAt: 'crystal', keepOrder: true }),
  tap('father', 'Look up! Where is the icicle?', 'Regarde en haut ! Où est le glaçon pendant ?', 'icicle', ['It is long and cold!', "Il est long et froid !"], ['icicle', 'where']),
  ...countScene('mother', 'ice', [0, 1, 2, 3, 4, 5], { beginner: 2, intermediate: 3, expert: 4 }, 'cavice'),
  say('narrator', 'Hello! … Hello! … The cave says hello too!', 'Bonjour ! … Bonjour ! … La grotte dit bonjour aussi !', {}, 'happy'),
  ask('mother', "Let's say hello to the cave! What do we say?", 'Disons bonjour à la grotte ! Que dit-on ?', [ok('Hello!', 'Bonjour !', '👋'), no('Goodbye!', 'Au revoir !', '🙋'), no('Thank you!', 'Merci !', '🙏')], ['We say: hello!', 'On dit : hello!'], ['hello', 'echo'], { onCorrect: L('Hello, cave! Hello… hello…', 'Bonjour, la grotte ! Bonjour… bonjour…') }),
  say('baby', 'Hello! The cave talks to me!', 'Bonjour ! La grotte me répond !', { needs: 'baby' }, 'happy'),
  ask('father', 'Is it dark in the cave?', 'Est-ce qu’il fait sombre dans la grotte ?', yesNo(true), ['Look into the cave!', 'Regarde dans la grotte !'], ['cave', 'dark'], { minTier: 'intermediate', pointAt: 'cave', keepOrder: true }),
  ...showOff(sp, ['run'], 'father'),
  moveTo('snow', 'rest', 'actor'),
  say('actor', 'Ahh! A soft little rest in the snow.', 'Ahh ! Un petit repos tout doux dans la neige.', {}, 'calm'),
  back('actor'),
  reward('ant_snow_crystal', 'father', 'A shiny crystal! It is our treasure!', 'Un cristal tout brillant ! C’est notre trésor !'),
  end('mother', 'What a shiny day in the cave!', 'Quelle journée qui brille dans la grotte !'),
];

/** Ours 3 — la plaine de neige : empreintes, loin et près, rouler dans la neige. */
const snowyPlain = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'What a white morning! The snowy plain is big and quiet.', 'Quel matin tout blanc ! La plaine de neige est grande et calme.', {}, 'calm'),
  tap('father', 'Where is the snow? Show me!', 'Où est la neige ? Montre-moi !', 'snow', ['It is white, on the ground!', "C'est blanc, par terre !"], ['snow', 'where']),
  ask('mother', 'Is the snow white?', 'Est-ce que la neige est blanche ?', yesNo(true), ['Look at the snow!', 'Regarde la neige !'], ['snow', 'white'], { minTier: 'intermediate', pointAt: 'snow', keepOrder: true }),
  say('narrator', 'Look! Big paw prints in the snow!', 'Regarde ! De grosses traces de pattes dans la neige !', {}, 'curious'),
  ...countScene('father', 'footprint', [0, 1, 2, 3, 4, 5, 6, 7], { beginner: 3, intermediate: 4, expert: 5 }, 'plprint'),
  say('baby', 'My paws are small! Look at my footprints!', 'Mes pattes sont petites ! Regarde mes empreintes !', { needs: 'baby' }, 'happy'),
  tap('mother', 'Where is the big mountain?', 'Où est la grande montagne ?', 'mountain', ['It is big and white, far away!', 'Elle est grande et blanche, très loin !'], ['mountain', 'where']),
  ask('father', 'Is the mountain near or far?', 'La montagne est près ou loin ?', [ok("It's far!", 'Elle est loin !', '🏔️'), no("It's near!", 'Elle est près !', '📍')], ['Look! It is very small!', 'Regarde ! Elle est toute petite !'], ['far', 'near', 'mountain'], { minTier: 'intermediate', pointAt: 'mountain', keepOrder: true }),
  tap('mother', 'Where is the blue ice?', 'Où est la glace bleue ?', 'ice', ['It is big and blue!', 'Elle est grande et bleue !'], ['ice', 'blue']),
  ask('mother', 'Which one is bigger, the hill or the mountain?', 'Lequel est le plus gros, la colline ou la montagne ?', [ok('The mountain!', 'La montagne !', '🏔️'), no('The hill!', 'La colline !', '⛰️')], ['Look! The mountain is very big!', 'Regarde ! La montagne est très grande !'], ['bigger', 'mountain', 'hill'], { minTier: 'intermediate', pointAt: 'mountain', keepOrder: true }),
  seek('mother', 'sibling', 'ice', SEEK_TEXT('blue ice', 'la glace bleue'), ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
  ...showOff(sp, ['run'], 'father'),
  moveTo('snow', 'rest', 'actor'),
  act('actor', 'dance', 'Roll, roll, roll in the snow!', 'Je roule, je roule dans la neige !', 'actor'),
  back('actor'),
  say('sibling', 'La la la! The snow is fun!', 'La la la ! La neige, c’est rigolo !', { needs: 'sibling' }, 'happy'),
  reward('ant_snowball', 'father', 'A big white snowball! It is our treasure!', 'Une grosse boule de neige blanche ! C’est notre trésor !'),
  end('mother', 'What a white and quiet day!', 'Quelle journée blanche et calme !'),
];

// --- Manchot ------------------------------------------------------------------

/** Manchot 1 — le lagon du glacier : la mer, le mur de glace, les poissons. */
const penguinLagoon = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'The penguins stand on the snow. The sea is big and blue!', 'Les manchots sont sur la neige. La mer est grande et bleue !', {}, 'happy'),
  tap('father', 'Where is the sea? Show me!', 'Où est la mer ? Montre-moi !', 'sea', ['It is big and blue!', 'Elle est grande et bleue !'], ['sea', 'where']),
  tap('mother', 'Look up! Where is the cliff?', 'Regarde en haut ! Où est la falaise ?', 'cliff', ['It is big and blue, made of ice!', 'Elle est grande et bleue, en glace !'], ['cliff', 'where']),
  ask('father', 'Is the cliff big or small?', 'La falaise est grande ou petite ?', [ok("It's big!", 'Elle est grande !', '🧊'), no("It's small!", 'Elle est petite !', '🐭')], ['Look! It is very high!', 'Regarde ! Elle est très haute !'], ['big', 'small', 'cliff'], { minTier: 'intermediate', pointAt: 'cliff', keepOrder: true }),
  tap('mother', 'Where is the ice block?', 'Où est le bloc de glace ?', 'block', ['It is a big block of ice!', "C'est un gros bloc de glace !"], ['ice block', 'where']),
  ...showOff(sp, ['hop', 'swim'], 'father'),
  say('narrator', 'Look! Fish! The penguins are hungry.', 'Regarde ! Des poissons ! Les manchots ont faim.', {}, 'curious'),
  ...countScene('father', 'fish', [1, 3, 0, 2, 4], { beginner: 2, intermediate: 3, expert: 5 }, 'lgfish'),
  ...eatScene(sp, [0, 1, 2, 3], 'actor', 'lgfeast'),
  say('baby', 'Yum! I love fish!', "Miam ! J'adore le poisson !", { needs: 'baby' }, 'happy'),
  tap('mother', 'Where is the iceberg?', 'Où est l’iceberg ?', 'iceberg', ['It is big, white and cold!', 'Il est grand, blanc et froid !'], ['iceberg', 'where']),
  ask('father', 'Is the iceberg big?', "Est-ce que l'iceberg est grand ?", yesNo(true), ['Look at the iceberg!', "Regarde l'iceberg !"], ['iceberg', 'big'], { minTier: 'intermediate', pointAt: 'iceberg', keepOrder: true }),
  seek('mother', 'sibling', 'iceberg', SEEK_TEXT('iceberg', "l'iceberg"), ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
  say('sibling', 'The sea is so big!', 'La mer est si grande !', { needs: 'sibling' }, 'happy'),
  reward('ant_silver_fish', 'father', 'A silver fish! It is our treasure!', 'Un poisson argenté ! C’est notre trésor !'),
  end('mother', 'What a yummy day at the sea!', 'Quelle bonne journée à la mer !'),
];

/** Manchot 2 — la glace du soir : l'aurore, l'arche, glisser sur la glace. */
const eveningIce = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'It is evening. The sky is pink and purple. Look at the green lights!', 'Il fait soir. Le ciel est rose et violet. Regarde les lumières vertes !', {}, 'curious'),
  tap('father', 'Where is the aurora? Show me!', 'Où est l’aurore ? Montre-moi !', 'aurora', ['It is green, up in the sky!', "Elle est verte, en haut dans le ciel !"], ['aurora', 'where']),
  ask('mother', 'What colour is the aurora?', "De quelle couleur est l'aurore ?", [ok('Green!', 'Verte !', '🟢'), no('Red!', 'Rouge !', '🔴'), no('Yellow!', 'Jaune !', '🟡')], ['Look at the sky!', 'Regarde le ciel !'], ['green', 'aurora'], { minTier: 'intermediate', pointAt: 'aurora', keepOrder: true }),
  tap('mother', 'Where is the big arch? Waddle there!', "Où est la grande arche ? Dandine-toi jusque là !", 'arch', ['It is blue and shiny!', "Elle est bleue et brillante !"], ['arch', 'where']),
  ask('father', 'It is evening. What do we say?', 'Il fait soir. Que dit-on ?', [ok('Good evening!', 'Bonsoir !', '🌆'), no('Good morning!', 'Bonjour !', '🌅'), no('Goodbye!', 'Au revoir !', '🙋')], ['We say: good evening!', 'On dit : good evening!'], ['good_evening'], { onCorrect: L('Good evening, everybody!', 'Bonsoir, tout le monde !') }),
  say('baby', 'Look! A penguin on the ice!', 'Regarde ! Un manchot sur la glace !', { needs: 'baby' }, 'happy'),
  tap('father', 'Look at the ice! Where is the crack?', 'Regarde la glace ! Où est la fissure ?', 'crack', ['It shines on the ice!', 'Elle brille sur la glace !'], ['ice crack', 'where']),
  say('narrator', 'Look! Little feet on the ice!', 'Regarde ! De petites pattes sur la glace !', {}, 'curious'),
  ...countScene('mother', 'birdprint', [0, 1, 2, 3, 4, 5, 6, 7], { beginner: 3, intermediate: 4, expert: 5 }, 'evprint'),
  ask('mother', 'Is the sun big?', 'Est-ce que le soleil est grand ?', yesNo(false), ['Look! It is very small!', 'Regarde ! Il est tout petit !'], ['sun', 'small'], { minTier: 'intermediate', pointAt: 'sun', keepOrder: true }),
  ...showOff(sp, ['hop', 'swim'], 'father'),
  tap('father', 'Where is the snow? Slide on your belly!', 'Où est la neige ? Glisse sur le ventre !', 'snow', ['It is white, on the ground!', "C'est blanc, par terre !"], ['snow', 'where']),
  moveTo('snow', 'rest', 'actor'),
  say('actor', 'Wheee! I slide on my belly!', 'Youpiii ! Je glisse sur le ventre !', {}, 'happy'),
  back('actor'),
  say('sibling', 'Waddle, waddle! Left, right!', 'Dandine, dandine ! Gauche, droite !', { needs: 'sibling' }, 'happy'),
  reward('ant_aurora_pebble', 'mother', 'A glowing pebble from the aurora! It is our treasure!', 'Un caillou lumineux de l’aurore ! C’est notre trésor !'),
  end('father', 'What a pretty evening!', 'Quelle jolie soirée !'),
];

/** Manchot 3 — la grotte aux rochers : s'abriter du vent, les galets du nid, se serrer. */
const penguinShelter = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'The wind blows! Brrr! The penguins go to the cave.', 'Le vent souffle ! Brrr ! Les manchots vont vers la grotte.', {}, 'calm'),
  tap('father', 'Where is the cave? Show me!', 'Où est la grotte ? Montre-moi !', 'cave', ['It is big and dark, in the rocks!', "Elle est grande et sombre, dans les rochers !"], ['cave', 'where']),
  ask('mother', 'Is it dark in the cave?', 'Est-ce qu’il fait sombre dans la grotte ?', yesNo(true), ['Look at the cave!', 'Regarde la grotte !'], ['cave', 'dark'], { minTier: 'intermediate', pointAt: 'cave', keepOrder: true }),
  tap('mother', 'Look up! Where is the icicle?', 'Regarde en haut ! Où est le glaçon pendant ?', 'icicle', ['It is long and cold!', "Il est long et froid !"], ['icicle', 'where']),
  say('baby', 'Brrr! I am cold!', "Brrr ! J'ai froid !", { needs: 'baby' }, 'calm'),
  say('mother', 'Come close, little one. Together, we are warm.', 'Viens tout près, mon petit. Ensemble, nous avons chaud.', { needs: 'baby' }, 'love'),
  ask('father', 'What do penguins do to stay warm?', 'Que font les manchots pour avoir chaud ?', [ok('They huddle!', 'Ils se serrent !', '🐧'), no('They fly!', 'Ils volent !', '🪽'), no('They climb!', 'Ils grimpent !', '🧗')], ['Huddle, huddle! Close together!', 'Serrés, serrés ! Tous ensemble !'], ['penguin_huddle', 'cold'], { minTier: 'intermediate', onCorrect: L("Yes! Huddle, huddle! Now we're warm!", 'Oui ! Serrés, serrés ! Maintenant on a chaud !') }),
  say('narrator', 'Penguins make a nest with pebbles. Look at the pebbles!', 'Les manchots font leur nid avec des cailloux. Regarde les cailloux !', {}, 'curious'),
  ...countScene('father', 'pebble', [0, 1, 2, 3, 4, 5, 6], { beginner: 2, intermediate: 3, expert: 4 }, 'shpeb'),
  tap('mother', 'Where is the brown rock?', 'Où est le rocher brun ?', 'rock', ['It is big and brown!', 'Il est grand et brun !'], ['rock', 'where']),
  ask('father', 'Is the snowy rock hot?', 'Est-ce que le rocher enneigé est chaud ?', yesNo(false), ['Brrr! Look at the snowy rock!', 'Brrr ! Regarde le rocher enneigé !'], ['snowy rock', 'cold'], { minTier: 'intermediate', pointAt: 'snowy_rock', keepOrder: true }),
  seek('mother', 'sibling', 'rock', SEEK_TEXT('rock', 'le rocher'), ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
  tap('father', 'Where is the ice wall?', 'Où est le mur de glace ?', 'wall', ['It is big and blue!', 'Il est grand et bleu !'], ['ice wall', 'where']),
  ...showOff(sp, ['hop', 'swim'], 'mother'),
  reward('ant_white_feather', 'mother', 'A white feather! It is our treasure!', 'Une plume blanche ! C’est notre trésor !'),
  end('father', 'What a cosy day in the cave!', 'Quelle journée bien au chaud dans la grotte !'),
];

// --- Phoque -------------------------------------------------------------------

/** Phoque 1 — la baie de l'aurore : le soir, les aurores boréales, les plaques de glace. */
const auroraBay = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'Night is falling. Look! The northern lights dance in the sky!', 'La nuit tombe. Regarde ! Les aurores boréales dansent dans le ciel !', {}, 'curious'),
  tap('father', 'Where are the northern lights? Show me!', 'Où sont les aurores boréales ? Montre-moi !', 'lights', ['They are green, up in the sky!', 'Elles sont vertes, en haut dans le ciel !'], ['northern lights', 'where']),
  ask('mother', 'What colour are the northern lights?', 'De quelle couleur sont les aurores boréales ?', [ok('Green!', 'Vertes !', '🟢'), no('Red!', 'Rouges !', '🔴'), no('Yellow!', 'Jaunes !', '🟡')], ['Look at the sky!', 'Regarde le ciel !'], ['green', 'northern lights'], { minTier: 'intermediate', pointAt: 'lights', keepOrder: true }),
  tap('mother', 'Touch the pink cloud!', 'Touche le nuage rose !', 'pinkcloud', ['It is soft and pink!', 'Il est doux et rose !'], ['pink cloud', 'pink']),
  say('baby', 'Look at the pretty lights!', 'Regarde les jolies lumières !', { needs: 'baby' }, 'happy'),
  tap('father', 'Where is the floe? It floats on the sea!', 'Où est la plaque de glace ? Elle flotte sur la mer !', 'floe', ['It is white and flat!', 'Elle est blanche et plate !'], ['floe', 'where']),
  ...countScene('mother', 'ice', [1, 2, 3, 4, 5, 0], { beginner: 2, intermediate: 3, expert: 4 }, 'abice'),
  tap('father', 'Where is the sea? Dive in!', 'Où est la mer ? Plonge !', 'sea', ['It is deep and blue!', 'Elle est profonde et bleue !'], ['sea', 'where']),
  act('actor', 'swim', 'Splash! I dive into the sea!', 'Splash ! Je plonge dans la mer !', 'actor'),
  ask('father', 'Is the sea warm or cold?', 'La mer est chaude ou froide ?', [ok("It's cold!", 'Elle est froide !', '🥶'), no("It's warm!", 'Elle est chaude !', '🥵')], ['Brrr! Look at the sea!', 'Brrr ! Regarde la mer !'], ['cold', 'sea'], { minTier: 'intermediate', pointAt: 'sea', keepOrder: true }),
  ...eatScene(sp, [1, 3, 4, 5], 'father', 'abfish'),
  say('baby', 'Yum! I love fish!', "Miam ! J'adore le poisson !", { needs: 'baby' }, 'happy'),
  seek('mother', 'sibling', 'rock', SEEK_TEXT('rock', 'le rocher'), ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
  moveTo('snow', 'rest', 'actor'),
  say('actor', 'Ahh! I rest on the snow. What a nice rest!', 'Ahh ! Je me repose sur la neige. Quel bon repos !', {}, 'calm'),
  back('actor'),
  ask('mother', 'The lights are going to sleep. What do we say?', 'Les lumières vont dormir. Que dit-on ?', [ok('Good night!', 'Bonne nuit !', '🌙'), no('Good morning!', 'Bonjour !', '🌅'), no('Hello!', 'Salut !', '👋')], ['We say: good night!', 'On dit : good night!'], ['good_night'], { onCorrect: L('Good night, lights!', 'Bonne nuit, les lumières !') }),
  reward('ant_night_pearl', 'father', 'A shiny pearl from the night sea! It is our treasure!', 'Une perle brillante de la mer de nuit ! C’est notre trésor !'),
  end('mother', 'What a magic night!', 'Quelle nuit magique !'),
];

/** Phoque 2 — le rivage de rochers : la mare, l'étoile de mer, les algues, les vagues. */
const rockPool = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'The sea is low. Look at the rocks and the little pool!', 'La mer est basse. Regarde les rochers et la petite mare !', {}, 'curious'),
  tap('father', 'Where is the rock pool? Show me!', 'Où est la mare entre les rochers ? Montre-moi !', 'pool', ['It is full of clear water!', "Elle est pleine d'eau claire !"], ['rock pool', 'where']),
  tap('mother', 'Touch the red starfish!', "Touche l'étoile de mer rouge !", 'starfish', ['It is small and red!', 'Elle est petite et rouge !'], ['starfish', 'red']),
  ask('father', 'Is the starfish red?', "Est-ce que l'étoile de mer est rouge ?", yesNo(true), ['Look at the starfish!', "Regarde l'étoile de mer !"], ['starfish', 'red'], { minTier: 'intermediate', pointAt: 'starfish', keepOrder: true }),
  say('baby', 'I like the starfish!', "J'aime bien l'étoile de mer !", { needs: 'baby' }, 'happy'),
  tap('mother', 'Look! A wave! Where is the wave?', 'Regarde ! Une vague ! Où est la vague ?', 'wave', ['It splashes on the rocks!', 'Elle éclabousse les rochers !'], ['wave', 'where']),
  act('actor', 'swim', 'Splash! I swim in the sea!', 'Splash ! Je nage dans la mer !', 'actor'),
  ...showOff(sp, ['swim'], 'mother'),
  tap('father', 'Where is the seaweed?', 'Où sont les algues ?', 'seaweed', ['It grows on the rocks, in the water!', "Elles poussent sur les rochers, dans l'eau !"], ['seaweed', 'where']),
  ask('mother', 'Is the seaweed blue?', "Est-ce que l'algue est bleue ?", yesNo(false), ['Look at the seaweed!', "Regarde l'algue !"], ['seaweed', 'blue'], { minTier: 'intermediate', pointAt: 'seaweed', keepOrder: true }),
  say('narrator', 'Look! Little pebbles near the water.', "Regarde ! De petits cailloux près de l'eau.", {}, 'curious'),
  ...countScene('mother', 'pebble', [0, 1, 3, 4, 5, 2], { beginner: 2, intermediate: 3, expert: 4 }, 'rkpeb'),
  ask('father', 'Which one is bigger, the rock or the pebble?', 'Lequel est le plus gros, le rocher ou le caillou ?', [ok('The rock!', 'Le rocher !', '🪨'), no('The pebble!', 'Le caillou !', '🫘')], ['Look! The rock is very big!', 'Regarde ! Le rocher est très gros !'], ['bigger', 'rock', 'pebble'], { minTier: 'intermediate', pointAt: 'rock', keepOrder: true }),
  ...eatScene(sp, [0, 1, 3, 4], 'father', 'rkfish'),
  seek('mother', 'sibling', 'rock', SEEK_TEXT('rock', 'le rocher'), ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
  moveTo('rock', 'rest', 'actor'),
  say('actor', 'Ahh! I rest on a rock, with my nose in the sun.', 'Ahh ! Je me repose sur un rocher, le museau au soleil.', {}, 'calm'),
  back('actor'),
  reward('ant_red_starfish', 'father', 'A red starfish! It is our treasure!', 'Une étoile de mer rouge ! C’est notre trésor !'),
  end('mother', 'What a nice day at the rocky shore!', 'Quelle belle journée au rivage de rochers !'),
];

/** Phoque 3 — la plage du coucher de soleil : se reposer sur le sable, les couleurs du ciel, les galets. */
const sunsetBeach = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'The sun goes down. The sky is orange and pink.', 'Le soleil se couche. Le ciel est orange et rose.', {}, 'calm'),
  tap('father', 'Where is the sunset? Show me!', 'Où est le coucher de soleil ? Montre-moi !', 'sunset', ['It is orange, low in the sky!', 'Il est orange, bas dans le ciel !'], ['sunset', 'where']),
  ask('mother', 'What colour is the sun?', 'De quelle couleur est le soleil ?', [ok('Orange!', 'Orange !', '🟠'), no('Blue!', 'Bleu !', '🔵'), no('Green!', 'Vert !', '🟢')], ['Look at the sky!', 'Regarde le ciel !'], ['orange', 'sunset'], { minTier: 'intermediate', pointAt: 'sunset', keepOrder: true }),
  tap('mother', 'Touch the cloud!', 'Touche le nuage !', 'cloud', ['It is up high, in the sky!', 'Il est tout en haut, dans le ciel !'], ['cloud', 'where']),
  say('baby', 'Look at the waves!', 'Regarde les vagues !', { needs: 'baby' }, 'happy'),
  tap('father', 'Where is the wave? Clap, clap!', 'Où est la vague ? Clap, clap !', 'wave', ['It comes to the sand!', 'Elle arrive sur le sable !'], ['wave', 'where']),
  act('actor', 'swim', 'Splash! I dive into the sea!', 'Splash ! Je plonge dans la mer !', 'actor'),
  ...showOff(sp, ['swim'], 'mother'),
  say('narrator', 'Look! Little pebbles on the sand.', 'Regarde ! De petits cailloux sur le sable.', {}, 'curious'),
  ...countScene('father', 'pebble', [0, 1, 2, 3, 4, 5, 6], { beginner: 2, intermediate: 3, expert: 4 }, 'sspeb'),
  say('mother', 'Look! A shell for you…', 'Regarde ! Un coquillage pour toi…', {}, 'love'),
  ...colorHunt('mother', 'shell', 'pink', ['blue', 'yellow', 'orange'], [1, 3, 5, 7], 'ssshell'),
  ask('father', 'Is the island near or far?', "L'île est près ou loin ?", [ok("It's far!", 'Elle est loin !', '🏝️'), no("It's near!", 'Elle est près !', '📍')], ['Look! It is very small!', 'Regarde ! Elle est toute petite !'], ['far', 'near', 'island'], { minTier: 'intermediate', pointAt: 'island', keepOrder: true }),
  tap('father', 'Where is the sand? Let us rest there!', 'Où est le sable ? Reposons-nous là-bas !', 'sand', ['It is soft and yellow!', "C'est doux et jaune !"], ['sand', 'where']),
  moveTo('sand', 'rest', 'actor'),
  say('actor', 'Ahh! I rest on the sand. What a nice rest!', 'Ahh ! Je me repose sur le sable. Quel bon repos !', {}, 'calm'),
  seek('mother', 'sibling', 'rock', SEEK_TEXT('rock', 'le rocher'), ['hide_and_seek', 'behind'], { needs: 'sibling', minTier: 'intermediate' }),
  back('actor'),
  ask('mother', 'The sun is going to sleep. What do we say?', 'Le soleil va dormir. Que dit-on ?', [ok('Good night!', 'Bonne nuit !', '🌙'), no('Good morning!', 'Bonjour !', '🌅'), no('Hello!', 'Salut !', '👋')], ['We say: good night!', 'On dit : good night!'], ['good_night'], { onCorrect: L('Good night, sun!', 'Bonne nuit, soleil !') }),
  reward('ant_pink_shell', 'father', 'A pink shell from the sunset beach! It is our treasure!', 'Un coquillage rose de la plage du coucher de soleil ! C’est notre trésor !'),
  end('mother', 'What a pretty sunset!', 'Quel joli coucher de soleil !'),
];

const BEAR = ['polar_bear'];
const PENGUIN = ['penguin'];
const SEAL = ['seal'];

export const ANTARCTICA: AdventurePack = {
  adventures: [
    { id: 'antarctica_ice_lagoon', continentId: 'antarctica', titleEn: 'The ice lagoon', titleFr: 'Le lagon de glace', icon: '🧊', start: 'ice_coast', species: BEAR, skillIds: ['1.7', '1.3', '2.2'], steps: iceLagoon, treasure: 'ant_blue_ice', order: 1 },
    { id: 'antarctica_crystal_cave', continentId: 'antarctica', titleEn: 'The crystal cave', titleFr: 'La grotte de cristal', icon: '💎', start: 'an_ice_cave', species: BEAR, skillIds: ['1.1', '1.2', '1.3'], steps: crystalCave, treasure: 'ant_snow_crystal', order: 2 },
    { id: 'antarctica_snowy_plain', continentId: 'antarctica', titleEn: 'The snowy plain', titleFr: 'La plaine de neige', icon: '❄️', start: 'an_snowfield', species: BEAR, skillIds: ['1.2', '1.3', '2.3'], steps: snowyPlain, treasure: 'ant_snowball', order: 3 },
    { id: 'antarctica_penguin_lagoon', continentId: 'antarctica', titleEn: 'The penguin lagoon', titleFr: 'Le lagon des manchots', icon: '🐧', start: 'open_sea', species: PENGUIN, skillIds: ['1.6', '1.3', '2.2'], steps: penguinLagoon, treasure: 'ant_silver_fish', order: 4 },
    { id: 'antarctica_evening_ice', continentId: 'antarctica', titleEn: 'The evening on the ice', titleFr: 'Le soir sur la glace', icon: '🌆', start: 'an_aurora', species: PENGUIN, skillIds: ['1.1', '1.2', '3.1'], steps: eveningIce, treasure: 'ant_aurora_pebble', order: 5 },
    { id: 'antarctica_penguin_shelter', continentId: 'antarctica', titleEn: 'Shelter from the wind', titleFr: "À l'abri du vent", icon: '🌬️', start: 'an_penguin_cave', species: PENGUIN, skillIds: ['1.7', '1.3', '2.3'], steps: penguinShelter, treasure: 'ant_white_feather', order: 6 },
    { id: 'antarctica_aurora_bay', continentId: 'antarctica', titleEn: 'The aurora bay', titleFr: "La baie de l'aurore", icon: '🌌', start: 'an_seal_aurora', species: SEAL, skillIds: ['1.1', '1.2', '1.7'], steps: auroraBay, treasure: 'ant_night_pearl', order: 7 },
    { id: 'antarctica_rock_pool', continentId: 'antarctica', titleEn: 'The rock pool', titleFr: 'La mare entre les rochers', icon: '⭐', start: 'an_seal_rocks', species: SEAL, skillIds: ['1.2', '1.3', '2.7'], steps: rockPool, treasure: 'ant_red_starfish', order: 8 },
    { id: 'antarctica_sunset_beach', continentId: 'antarctica', titleEn: 'The sunset beach', titleFr: 'La plage du coucher de soleil', icon: '🌅', start: 'an_seal_sunset', species: SEAL, skillIds: ['1.2', '1.3', '1.7'], steps: sunsetBeach, treasure: 'ant_pink_shell', order: 9 },
  ],
  treasures: [
    treasure('ant_snow_crystal', 'a snow crystal', 'un cristal de neige', '❄️'),
    treasure('ant_silver_fish', 'a silver fish', 'un poisson argenté', '🐟'),
    treasure('ant_white_feather', 'a white feather', 'une plume blanche', '🪶'),
    treasure('ant_blue_ice', 'a piece of blue ice', 'un morceau de glace bleue', '🧊'),
    treasure('ant_snowball', 'a big snowball', 'une grosse boule de neige', '⚪'),
    treasure('ant_aurora_pebble', 'a glowing pebble', 'un caillou lumineux', '✨'),
    treasure('ant_night_pearl', 'a shiny pearl', 'une perle brillante', '🫧'),
    treasure('ant_red_starfish', 'a red starfish', 'une étoile de mer rouge', '⭐'),
    treasure('ant_pink_shell', 'a pink shell', 'un coquillage rose', '🐚'),
  ],
};

/**
 * Aventures sorties des parcours le 2026-11-23 : écrites pour les trois espèces à la fois, avec un départ
 * (`ice_coast`, `open_sea`) et des voyages (`open_sea`, `an_ice_cave`, `ice_coast`) qui ne sont plus des
 * décors de chaque famille. Gardées pour un retour arrière ; leurs trésors (`ant_snow_crystal`,
 * `ant_silver_fish`, `ant_white_feather`) restent connus et sont repris par les nouvelles aventures.
 */
export const RETIRED_ANTARCTICA: AdventureDef[] = [
  { id: 'antarctica_snow_day', continentId: 'antarctica', titleEn: 'The snowflake day', titleFr: 'Le jour des flocons', icon: '❄️', start: 'ice_coast', species: ['penguin', 'seal', 'polar_bear'], skillIds: ['1.7', '1.3', '1.6'], steps: snowDay, treasure: 'ant_snow_crystal', order: 1 },
  { id: 'antarctica_fish_feast', continentId: 'antarctica', titleEn: 'The fish feast', titleFr: 'Le festin de poissons', icon: '🐟', start: 'open_sea', species: ['penguin', 'seal', 'polar_bear'], skillIds: ['1.6', '1.2', '1.3'], steps: fishFeast, treasure: 'ant_silver_fish', order: 2 },
  { id: 'antarctica_white_feather', continentId: 'antarctica', titleEn: 'The white feather', titleFr: 'La plume blanche', icon: '🪶', start: 'open_sea', species: ['penguin', 'seal', 'polar_bear'], skillIds: ['1.1', '1.7', '1.2'], steps: whiteFeather, treasure: 'ant_white_feather', order: 3 },
];
