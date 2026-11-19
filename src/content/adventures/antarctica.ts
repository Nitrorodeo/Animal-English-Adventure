/**
 * Aventures d'Antarctique : banquise, neige, glace, mer froide. Manchot et phoque vivent sur la glace
 * et dans la mer ; l'orque ne vit qu'en pleine mer (ses scènes restent dans l'eau, jamais sur la glace).
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
  seek('mother', 'sibling', 'igloo', {
    line: ['Oh! Somebody is hiding! Can you find them?', "Oh ! Quelqu'un se cache ! Tu peux le trouver ?"],
    hint: ['Look in the ice cave!', 'Regarde dans la grotte de glace !'],
    notHere: ['Not here! Try again!', 'Pas ici ! Essaie encore !'],
    found: ['Peekaboo! You found me!', 'Coucou ! Tu m’as trouvé !'],
  }, ['hide_and_seek', 'ice cave'], { needs: 'sibling', minTier: 'intermediate' }),
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
// 2. Le festin de poissons — en pleine mer (toutes les espèces, orque comprise)
// ---------------------------------------------------------------------------

const fishFeast = (sp: SpeciesDef): QuestStep[] => [
  say('narrator', 'The sea is big and blue. The water is very cold!', "La mer est grande et bleue. L'eau est très froide !", {}, 'calm'),
  ask('father', 'Are you hungry?', 'Tu as faim ?', [ok("Yes, I'm hungry!", "Oui, j'ai faim !", '😋'), ok('Yes, a little!', 'Oui, un peu !', '🤏')], ["You can say: yes, I'm hungry!", "Tu peux dire : yes, I'm hungry!"], ['hungry'], { keepOrder: true, onCorrect: L("Then let's find some fish!", 'Alors cherchons du poisson !') }),
  tap('mother', 'Splash! Where is the wave?', 'Splash ! Où est la vague ?', 'wave', ['It is white, on the sea!', "Elle est blanche, sur la mer !"], ['wave', 'where']),
  say('narrator', 'Look! Fish swim under the waves!', 'Regarde ! Des poissons nagent sous les vagues !', {}, 'curious'),
  ...colorHunt('mother', 'koi', 'blue', ['yellow', 'red', 'green'], [0, 2, 4, 6], 'cfish'),
  say('father', 'There are so many fish! Can we count them?', 'Il y a tellement de poissons ! On peut les compter ?', {}, 'happy'),
  ...countScene('father', 'koi', [1, 3, 5, 7, 0, 2], { beginner: 3, intermediate: 4, expert: 5 }, 'kfish'),
  ...eatScene(sp, [1, 3, 5, 7], 'actor', 'feast'),
  say('baby', 'Yum! I love fish!', "Miam ! J'adore le poisson !", { needs: 'baby' }, 'happy'),
  ...showOff(sp, ['jump', 'swim'], 'father'),
  tap('mother', 'Look at the big white thing! Where is the iceberg?', 'Regarde la grande chose blanche ! Où est l’iceberg ?', 'iceberg', ['It is big, white and cold!', "Il est grand, blanc et froid !"], ['iceberg', 'where']),
  ask('father', 'Is the iceberg big?', "Est-ce que l'iceberg est grand ?", yesNo(true), ['Look at the iceberg!', "Regarde l'iceberg !"], ['iceberg', 'big'], { minTier: 'intermediate', pointAt: 'iceberg', keepOrder: true }),
  say('narrator', 'Look at the sea! There is a boat!', 'Regarde la mer ! Il y a un bateau !', {}, 'curious'),
  tap('father', 'Where is the boat? Show me!', 'Où est le bateau ? Montre-moi !', 'boat', ['It is on the sea!', 'Il est sur la mer !'], ['boat', 'where']),
  ask('mother', 'Is the boat big or small?', 'Le bateau est grand ou petit ?', [ok("It's small!", 'Il est petit !', '⛵'), no("It's big!", 'Il est grand !', '🚢')], ['It is far away!', "Il est très loin !"], ['big', 'small', 'boat'], { minTier: 'intermediate', pointAt: 'boat', keepOrder: true }),
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
  const onIce: QuestStep[] = [
    say('narrator', 'The family goes back to the ice.', 'La famille retourne sur la banquise.', {}, 'calm'),
    go('ice_coast', 'mother', "Let's go to the ice!", 'Allons sur la glace !'),
    tap('father', 'Where is the ice cave? Show me!', 'Où est la grotte de glace ? Montre-moi !', 'igloo', ['It is a little cave in the ice!', "C'est une petite grotte dans la glace !"], ['ice cave', 'where']),
    ask('mother', 'Is the ice cave cold?', 'Est-ce que la grotte de glace est froide ?', yesNo(true), ['Brrr! Look at the ice cave!', 'Brrr ! Regarde la grotte de glace !'], ['ice cave', 'cold'], { minTier: 'intermediate', pointAt: 'igloo', keepOrder: true }),
    canDo(sp, 'hop') ? act('actor', 'hop', 'Hop, hop, hop on the ice!', 'Hop, hop, hop sur la glace !', 'actor') : act('actor', 'dance', 'I dance on the ice!', 'Je danse sur la glace !', 'actor'),
    say('baby', 'I love the ice!', "J'adore la glace !", { needs: 'baby' }, 'happy'),
  ];
  const inSea: QuestStep[] = [
    say('narrator', 'The orca family stays in the sea. The sun is up!', "La famille orque reste dans la mer. Le soleil est haut dans le ciel !", {}, 'happy'),
    tap('father', 'Where is the sun? Show me!', 'Où est le soleil ? Montre-moi !', 'sun', ['It is high in the sky!', 'Il est haut dans le ciel !'], ['sun', 'where']),
    ask('mother', 'Is the sun yellow?', 'Est-ce que le soleil est jaune ?', yesNo(true), ['Look at the sun!', 'Regarde le soleil !'], ['sun', 'yellow'], { minTier: 'intermediate', pointAt: 'sun', keepOrder: true }),
    say('baby', 'I love the big sea!', "J'adore la grande mer !", { needs: 'baby' }, 'happy'),
  ];
  return [
    say('narrator', 'The wind blows on the sea. Look! A bird flies in the sky!', 'Le vent souffle sur la mer. Regarde ! Un oiseau vole dans le ciel !', {}, 'curious'),
    tap('father', 'Where is the bird? Show me!', "Où est l'oiseau ? Montre-moi !", 'bird', ['It is up high, in the sky!', 'Il est tout en haut, dans le ciel !'], ['bird', 'where']),
    ask('mother', "Let's say hello to the bird! What do we say?", "Disons bonjour à l'oiseau ! Que dit-on ?", [ok('Hello!', 'Bonjour !', '👋'), no('Goodbye!', 'Au revoir !', '🙋'), no('Thank you!', 'Merci !', '🙏'), no("I'm hungry!", "J'ai faim !", '😋')], ['We say: hello!', 'On dit : hello!'], ['hello'], { onCorrect: L('Hello, bird!', 'Bonjour, l’oiseau !') }),
    ask('father', 'Is the bird white?', "Est-ce que l'oiseau est blanc ?", yesNo(true), ['Look at the bird!', "Regarde l'oiseau !"], ['bird', 'white'], { minTier: 'intermediate', pointAt: 'bird', keepOrder: true }),
    ask('mother', 'How is the weather today?', 'Quel temps fait-il aujourd’hui ?', [ok("It's windy!", 'Il y a du vent !', '🌬️'), no("It's hot!", 'Il fait chaud !', '🥵'), no("It's rainy!", 'Il pleut !', '🌧️')], ['Look! The sea moves!', 'Regarde ! La mer bouge !'], ['weather', 'windy'], { minTier: 'intermediate' }),
    tap('mother', 'The waves are big! Where is the wave?', 'Les vagues sont grandes ! Où est la vague ?', 'wave', ['It is white, on the sea!', 'Elle est blanche, sur la mer !'], ['wave', 'where']),
    ask('father', 'What colour is the wave?', 'De quelle couleur est la vague ?', [ok('White!', 'Blanche !', '⚪'), no('Red!', 'Rouge !', '🔴'), no('Green!', 'Verte !', '🟢'), no('Pink!', 'Rose !', '🩷')], ['It is like the snow!', "Elle est comme la neige !"], ['white', 'wave'], { minTier: 'expert', pointAt: 'wave' }),
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
    ...(sp.id === 'orca' ? inSea : onIce),
    ask('father', 'The bird flies away. What do we say?', "L'oiseau s'envole. Que dit-on ?", [ok('Goodbye!', 'Au revoir !', '🙋'), no('Hello!', 'Bonjour !', '👋'), no("I'm cold!", "J'ai froid !", '🥶'), no('Good morning!', 'Bonjour !', '🌅')], ['We say: goodbye!', 'On dit : goodbye!'], ['goodbye'], { onCorrect: L('Goodbye, bird!', 'Au revoir, l’oiseau !') }),
    reward('ant_white_feather', 'mother', 'A white feather from the bird! It is our treasure!', 'Une plume blanche de l’oiseau ! C’est notre trésor !'),
    end('father', 'What a windy day!', 'Quelle journée de vent !'),
  ];
};

export const ANTARCTICA: AdventurePack = {
  adventures: [
    { id: 'antarctica_snow_day', continentId: 'antarctica', titleEn: 'The snowflake day', titleFr: 'Le jour des flocons', icon: '❄️', start: 'ice_coast', species: ['penguin', 'seal'], skillIds: ['1.7', '1.3', '1.6'], steps: snowDay, treasure: 'ant_snow_crystal', order: 1 },
    { id: 'antarctica_fish_feast', continentId: 'antarctica', titleEn: 'The fish feast', titleFr: 'Le festin de poissons', icon: '🐟', start: 'open_sea', species: ['penguin', 'seal', 'orca'], skillIds: ['1.6', '1.2', '1.3'], steps: fishFeast, treasure: 'ant_silver_fish', order: 2 },
    { id: 'antarctica_white_feather', continentId: 'antarctica', titleEn: 'The white feather', titleFr: 'La plume blanche', icon: '🪶', start: 'open_sea', species: ['penguin', 'seal', 'orca'], skillIds: ['1.1', '1.7', '1.2'], steps: whiteFeather, treasure: 'ant_white_feather', order: 3 },
  ],
  treasures: [
    treasure('ant_snow_crystal', 'a snow crystal', 'un cristal de neige', '❄️'),
    treasure('ant_silver_fish', 'a silver fish', 'un poisson argenté', '🐟'),
    treasure('ant_white_feather', 'a white feather', 'une plume blanche', '🪶'),
  ],
};
