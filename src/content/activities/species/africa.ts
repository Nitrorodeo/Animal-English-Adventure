import type { ActivityCtx, ActivityDef, Anchor, CommandOption, Line, PlaceDef, QuestStep, Tier } from '../../types';
import { act, ask, back, clearProps, command, drinkMove, end, L, landSpots, moveTo, no, ok, prop, props, say, tap, tapActor, tapProps, waterPlaces } from '../kit';

/** Déroulé des jeux propres aux espèces de ce continent (voir `africa.arch.ts`). */

const byTier = <T>(tier: Tier, b: T, i: T, e: T): T => (tier === 'beginner' ? b : tier === 'intermediate' ? i : e);
const isBaby = (c: ActivityCtx) => c.actorKind === 'baby';
/** Qui d'autre que le personnage joué parle : le bébé (si un parent joue) ou le frère / la sœur (si un bébé joue). */
const otherBaby = (c: ActivityCtx) => (isBaby(c) ? ({ speaker: 'sibling', needs: 'sibling' } as const) : ({ speaker: 'baby', needs: 'baby' } as const));
const card = (en: string, fr: string, icon: string, reply: Line, action?: CommandOption['action']): CommandOption => ({ line: L(en, fr), icon, reply, ...(action ? { action } : {}) });

// ---------------------------------------------------------------------------
// Le lion — « The lion's mane » : la crinière de Papa, la patte, le rugissement,
// la sieste à l'ombre, le lionceau (cub) et la troupe (pride)
// ---------------------------------------------------------------------------

/** Où le lion fait la sieste : l'ombre d'abord, puis un arbre, un buisson, un rocher (avec la bonne préposition). */
const NAP_PLACES: readonly { word: string; en: string; fr: string }[] = [
  { word: 'shade', en: 'in the shade', fr: "à l'ombre" },
  { word: 'tree', en: 'under the tree', fr: "sous l'arbre" },
  { word: 'baobab', en: 'under the baobab', fr: 'sous le baobab' },
  { word: 'bush', en: 'under the bush', fr: 'sous le buisson' },
  { word: 'rock', en: 'next to the rock', fr: 'à côté du rocher' },
  { word: 'stone', en: 'next to the stone', fr: 'à côté de la pierre' },
];

function napPlace(place: PlaceDef): { a: Anchor; en: string; fr: string } | undefined {
  for (const n of NAP_PLACES) {
    const a = place.anchors.find((x) => x.word === n.word && x.stand);
    if (a) return { a, en: n.en, fr: n.fr };
  }
  return undefined;
}

export const lionMane: ActivityDef = {
  id: 'lion_mane',
  choices: (c) => (c.species.id === 'lion' && napPlace(c.place) ? ['mane'] : []),
  build(c, tier) {
    const nap = napPlace(c.place);
    if (!nap) return undefined;
    const dad = c.actorKind === 'adult' && c.role === 'father';
    const other = otherBaby(c);
    const cards: CommandOption[] = [
      card('Roar!', 'Rugis !', '📢', L('ROAR! I can roar!', 'ROAR ! Je sais rugir !'), 'roar'),
      card('Show me your paw!', 'Montre-moi ta patte !', '🐾', isBaby(c) ? L('Here is my little paw!', 'Voici ma petite patte !') : L('Here is my big paw!', 'Voici ma grosse patte !'), 'wave'),
      card('Take a nap!', 'Fais la sieste !', '😴', L('Zzz… Lions love a nap!', 'Zzz… Les lions adorent la sieste !'), 'sleep'),
      card('Run!', 'Cours !', '🏃', L('Look! I can run fast!', 'Regarde ! Je cours vite !'), 'run'),
      card('Fly!', 'Vole !', '🪽', L("Ha ha! Lions can't fly!", 'Ha ha ! Les lions ne volent pas !')),
    ];
    // Papa obéit aussi : c'est lui qui a la crinière
    if (tier !== 'beginner') cards.splice(1, 0, { ...card('Daddy, shake your mane!', 'Papa, secoue ta crinière !', '🦁', L('Shake, shake! Look at my big mane!', 'Secoue, secoue ! Regarde ma grande crinière !'), 'dance'), who: 'father' });
    const steps: QuestStep[] = [
      dad
        ? say('actor', "I'm a lion! Look at my big mane!", 'Je suis un lion ! Regarde ma grande crinière !', {}, 'proud')
        : say('actor', 'Look at Daddy lion! He has a big mane!', 'Regarde Papa lion ! Il a une grande crinière !', {}, 'happy'),
      tapActor(
        'narrator',
        L('Who has a big mane? Touch him!', 'Qui a une grande crinière ? Touche-le !'),
        'father',
        'roar',
        L('Yes! I have a big mane! ROAR!', "Oui ! J'ai une grande crinière ! ROAR !"),
        L('Not me! I have no mane!', "Pas moi ! Je n'ai pas de crinière !"),
        L('Touch Daddy lion!', 'Touche Papa lion !'),
        ['lion_mane', 'lion'],
      ),
      ask('father', 'Does Mummy have a mane?', 'Est-ce que Maman a une crinière ?', [ok("No, she doesn't!", 'Non !', '👎'), no('Yes, she does!', 'Oui !', '👍')], ['Look at Mummy!', 'Regarde Maman !'], ['lion_mane', 'she_is'], {
        minTier: 'expert',
        keepOrder: true,
        onCorrect: ["That's right! Only daddy lions have a mane!", "C'est ça ! Seuls les papas lions ont une crinière !"],
      }),
      command('actor', 'Simon says! Touch a card, and I do it!', 'Jacques a dit ! Touche une carte, et je le fais !', cards, byTier(tier, 2, 3, 4), ['roar', 'lion_paw', 'lion_nap', 'run'], { onCorrect: ['What a strong lion!', 'Quel lion costaud !'] }),
      ask('actor', 'Listen! ROAR! Who says roar?', 'Écoute ! ROAR ! Qui fait roar ?', [ok('A lion!', 'Un lion !', '🦁'), no('A bird!', 'Un oiseau !', '🐦'), no('A duck!', 'Un canard !', '🦆')], ['Roar is a big sound!', 'Roar, c’est un gros bruit !'], ['roar', 'lion', 'bird'], { onCorrect: ['Yes! A lion says ROAR!', 'Oui ! Le lion fait ROAR !'] }),
      tap('actor', `It's hot! Lions love a nap ${nap.en}. Touch the ${nap.a.word}!`, `Il fait chaud ! Les lions adorent la sieste ${nap.fr}. Touche ${nap.a.wordFr} !`, nap.a.id, [`Find the ${nap.a.word}!`, `Cherche ${nap.a.wordFr} !`], [nap.a.word, 'lion_nap', 'hot']),
      moveTo(nap.a.id, 'rest'),
      act('actor', 'sleep', 'Zzz… What a nice nap!', 'Zzz… Quelle bonne sieste !'),
      ask('actor', 'Where did I take a nap?', "Où est-ce que j'ai fait la sieste ?", [ok(`${cap1(nap.en)}!`, `${cap1(nap.fr)} !`), no('In the water!', "Dans l'eau !", '💧'), no('On a cloud!', 'Sur un nuage !', '☁️')], ['Where did I sleep?', 'Où ai-je dormi ?'], [nap.a.word, 'where'], {
        minTier: 'expert',
        onCorrect: [`Yes! ${cap1(nap.en)}! It's cool there.`, `Oui ! ${cap1(nap.fr)} ! Il y fait frais.`],
      }),
      back(),
      ask('actor', 'A baby lion is a…', 'Un bébé lion, c’est un…', [ok('A cub!', 'Un lionceau !', '🦁'), no('A chick!', 'Un poussin !', '🐥'), no('A puppy!', 'Un chiot !', '🐶')], ['A little lion!', 'Un petit lion !'], ['lion_cub', 'baby'], {
        minTier: 'intermediate',
        onCorrect: ['Yes! A baby lion is a cub!', 'Oui ! Un bébé lion, c’est un lionceau !'],
      }),
      say(other.speaker, "I'm a little cub! Listen… roar! My roar is small!", 'Je suis un petit lionceau ! Écoute… roar ! Mon rugissement est petit !', { minTier: 'intermediate', needs: other.needs }, 'happy'),
      ask('actor', 'A lion family is a…', 'Une famille de lions, c’est une…', [ok('A pride!', 'Une troupe !', '🦁'), no('A herd!', 'Un troupeau !', '🐘'), no('A flock!', 'Une volée !', '🐦')], ['Daddy, Mummy and the cubs!', 'Papa, Maman et les lionceaux !'], ['lion_pride'], {
        minTier: 'expert',
        onCorrect: ['Yes! We are a pride! A lion family!', 'Oui ! Nous sommes une troupe ! Une famille de lions !'],
      }),
      end('actor', 'ROAR! Thank you! What a great game!', 'ROAR ! Merci ! Quel super jeu !'),
    ];
    return steps;
  },
  memoryEvent: () => 'lion_mane',
};

function cap1(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// L'éléphant — « The elephant's trunk » : la trompe qui ramasse les feuilles, les grandes
// oreilles, les défenses de Papa, le barrissement (trumpet) et le troupeau (herd)
// ---------------------------------------------------------------------------

export const elephantTrunk: ActivityDef = {
  id: 'elephant_trunk',
  choices: (c) => (c.species.id === 'elephant' && landSpots(c.place).length >= 5 ? ['trunk'] : []),
  build(c, tier) {
    const land = landSpots(c.place);
    const n = byTier(tier, 2, 3, 4);
    if (land.length < n + 1) return undefined;
    const leaves = land.slice(0, n).map((s, i) => prop(`trunk_leaf${i}`, 'leaves', s));
    const pebble = prop('trunk_pebble', 'pebble', land[n]!);
    const water = waterPlaces(c.place)[0];
    const drink = drinkMove(c.species);
    const other = otherBaby(c);
    const spray = water
      ? card('Spray water!', "Arrose avec de l'eau !", '💦', L('Splash! I spray water with my trunk!', "Splash ! J'arrose avec ma trompe !"), 'splash')
      : card('Throw dust!', 'Lance de la poussière !', '💨', L('Puff! A dust bath keeps me cool!', 'Pouf ! Un bain de poussière, ça me rafraîchit !'), 'splash');
    const cards: CommandOption[] = [
      spray,
      card('Flap your ears!', 'Agite tes oreilles !', '👂', L('Flap, flap! My big ears keep me cool!', 'Flap, flap ! Mes grandes oreilles me rafraîchissent !'), 'dance'),
      card('Trumpet!', 'Barris !', '🎺', L('Toot! Toot! I trumpet with my trunk!', 'Tout ! Tout ! Je barris avec ma trompe !'), 'roar'),
      card('Wave your trunk!', 'Fais coucou avec ta trompe !', '👋', L('Hello! I wave my trunk!', 'Coucou ! Je fais coucou avec ma trompe !'), 'wave'),
      card('Jump!', 'Saute !', '🦘', L("Oh no! Elephants can't jump!", 'Oh non ! Les éléphants ne sautent pas !')),
    ];
    const steps: QuestStep[] = [
      isBaby(c)
        ? say('actor', "I'm a baby elephant! Look at my little trunk!", 'Je suis un bébé éléphant ! Regarde ma petite trompe !', {}, 'happy')
        : say('actor', "I'm an elephant! Look at my long trunk!", 'Je suis une éléphante ! Regarde ma longue trompe !', {}, 'proud'),
      ask('actor', 'Is my trunk long or short?', 'Ma trompe est longue ou courte ?', [ok("It's long!", 'Elle est longue !', '📏'), no("It's short!", 'Elle est courte !', '🤏')], ['Look at my trunk!', 'Regarde ma trompe !'], ['elephant_trunk', 'long'], {
        keepOrder: true,
        onCorrect: ['Yes! A long, long trunk!', 'Oui ! Une longue, longue trompe !'],
      }),
      props(leaves, { maxTier: 'beginner' }),
      props([...leaves, pebble], { minTier: 'intermediate' }),
      ...(['beginner', 'intermediate'] as const).map((from) =>
        tapProps('actor', 'My trunk can pick up leaves! Touch the leaves!', 'Ma trompe sait ramasser les feuilles ! Touche les feuilles !', leaves.map((l) => l.id), ['Touch the green leaves!', 'Touche les feuilles vertes !'], ['elephant_trunk', 'leaves', 'count'], {
          ...(from === 'beginner' ? { maxTier: 'beginner' as const } : { minTier: 'intermediate' as const, wrong: { trunk_pebble: L("That's a pebble! I don't eat pebbles!", "C'est un caillou ! Je ne mange pas de cailloux !") } }),
          count: true,
          onCorrect: ['Swish! My trunk picks them up!', 'Hop ! Ma trompe les ramasse !'],
        }),
      ),
      act('actor', 'eat', 'Crunch, crunch! I love leaves!', "Crunch, crunch ! J'adore les feuilles !"),
      clearProps(),
      tapActor(
        'narrator',
        L('Who has two white tusks? Touch him!', 'Qui a deux défenses blanches ? Touche-le !'),
        'father',
        'wave',
        L('Yes! Look at my tusks! They are white!', 'Oui ! Regarde mes défenses ! Elles sont blanches !'),
        L('Not me! Find Daddy!', 'Pas moi ! Cherche Papa !'),
        L('Touch Daddy elephant!', 'Touche Papa éléphant !'),
        ['elephant_tusks', 'white'],
      ),
      command('actor', 'Simon says! Touch a card, and I do it!', 'Jacques a dit ! Touche une carte, et je le fais !', cards, byTier(tier, 2, 3, 4), ['splash', 'elephant_ears', 'elephant_trumpet', 'elephant_trunk'], { onCorrect: ['Toot! Toot! What fun!', 'Tout ! Tout ! Trop drôle !'] }),
      ask('actor', 'Are my ears big or small?', 'Mes oreilles sont grandes ou petites ?', [ok("They're big!", 'Elles sont grandes !', '🐘'), no("They're small!", 'Elles sont petites !', '🤏')], ['Look at my ears!', 'Regarde mes oreilles !'], ['elephant_ears', 'big'], {
        minTier: 'intermediate',
        keepOrder: true,
        onCorrect: ['Yes! Big ears, like big fans!', 'Oui ! De grandes oreilles, comme de grands éventails !'],
      }),
    ];
    if (water && drink) {
      steps.push(
        say('actor', "I'm thirsty! Let's go to the water!", "J'ai soif ! Allons à l'eau !", { minTier: 'intermediate' }, 'thirsty'),
        moveTo(water.id, drink, undefined, { minTier: 'intermediate' }),
        say('actor', 'Slurp! I drink with my trunk!', 'Slurp ! Je bois avec ma trompe !', { minTier: 'intermediate' }, 'happy'),
        back(undefined, { minTier: 'intermediate' }),
      );
    }
    steps.push(
      say(other.speaker, 'Toot! Toot! I can trumpet too!', 'Tout ! Tout ! Moi aussi je sais barrir !', { minTier: 'intermediate', needs: other.needs }, 'happy'),
      ask('actor', 'Can an elephant jump?', 'Est-ce qu’un éléphant sait sauter ?', [ok("No, it can't!", 'Non !', '👎'), no('Yes, it can!', 'Oui !', '👍')], ['Elephants are very heavy!', 'Les éléphants sont très lourds !'], ['cant', 'jump'], {
        minTier: 'expert',
        keepOrder: true,
        onCorrect: ["That's right! Elephants can't jump. But they can swim!", "C'est ça ! Les éléphants ne sautent pas. Mais ils savent nager !"],
      }),
      ask('actor', 'An elephant family is a…', 'Une famille d’éléphants, c’est un…', [ok('A herd!', 'Un troupeau !', '🐘'), no('A pride!', 'Une troupe de lions !', '🦁'), no('A flock!', 'Une volée !', '🐦')], ['Lots of elephants together!', 'Plein d’éléphants ensemble !'], ['elephant_herd'], {
        minTier: 'expert',
        onCorrect: ['Yes! We are a herd! We walk together!', 'Oui ! Nous sommes un troupeau ! Nous marchons ensemble !'],
      }),
      end('actor', 'Toot! Toot! Thank you so much!', 'Tout ! Tout ! Merci beaucoup !'),
    );
    return steps;
  },
  memoryEvent: () => 'elephant_trunk',
};

// ---------------------------------------------------------------------------
// La girafe — « The giraffe's long neck » : le long cou, les feuilles tout en haut de
// l'arbre, la langue violette, les taches, la plus grande de tous
// ---------------------------------------------------------------------------

/** L'arbre où la girafe mange (dans la savane, c'est l'acacia ; au baobab, l'arbre ou le baobab). */
const highTree = (place: PlaceDef) => place.anchors.find((a) => a.word === 'tree' && a.stand) ?? place.anchors.find((a) => a.word === 'baobab' && a.stand);

export const giraffeNeck: ActivityDef = {
  id: 'giraffe_neck',
  choices: (c) => (c.species.id === 'giraffe' && highTree(c.place) ? ['neck'] : []),
  build(c, tier) {
    const tree = highTree(c.place);
    if (!tree) return undefined;
    const mum = c.actorKind === 'adult' && c.role === 'mother';
    const other = otherBaby(c);
    const cards: CommandOption[] = [
      card('Run!', 'Cours !', '🏃', L('Look! My long legs run fast!', 'Regarde ! Mes longues pattes courent vite !'), 'run'),
      card('Eat leaves!', 'Mange des feuilles !', '🍃', L('Munch, munch! Yummy leaves!', 'Miam, miam ! De bonnes feuilles !'), 'eat'),
      card('Swing your neck!', 'Balance ton cou !', '🦒', L('Swing, swing! Look at my long neck!', 'Hop, hop ! Regarde mon long cou !'), 'dance'),
      card('Take a nap!', 'Fais une sieste !', '😴', L('Zzz… Giraffes sleep just a little!', 'Zzz… Les girafes dorment très peu !'), 'sleep'),
      card('Climb!', 'Grimpe !', '🧗', L("Ha ha! Giraffes can't climb!", 'Ha ha ! Les girafes ne grimpent pas !')),
    ];
    const steps: QuestStep[] = [
      isBaby(c)
        ? say('actor', "I'm a baby giraffe! Look at my long neck!", 'Je suis un bébé girafe ! Regarde mon long cou !', {}, 'happy')
        : say('actor', "I'm a giraffe! Look at my long, long neck!", 'Je suis une girafe ! Regarde mon long, long cou !', {}, 'proud'),
      ask('actor', 'Is my neck long or short?', 'Mon cou est long ou court ?', [ok("It's long!", 'Il est long !', '📏'), no("It's short!", 'Il est court !', '🤏')], ['Look at my neck!', 'Regarde mon cou !'], ['giraffe_neck', 'long'], {
        keepOrder: true,
        onCorrect: ['Yes! A long, long neck!', 'Oui ! Un long, long cou !'],
      }),
      tap('actor', `I'm hungry! The best leaves are up high. Touch the ${tree.word}!`, `J'ai faim ! Les meilleures feuilles sont tout en haut. Touche ${tree.wordFr} !`, tree.id, [`Find the ${tree.word}!`, `Cherche ${tree.wordFr} !`], [tree.word, 'up_high', 'leaves'], {
        onCorrect: ['Yes! Leaves up high!', 'Oui ! Des feuilles tout en haut !'],
      }),
      moveTo(tree.id, 'eat'),
      say('actor', 'Munch, munch! My long neck reaches the leaves up high!', 'Miam, miam ! Mon long cou attrape les feuilles tout en haut !', {}, 'happy'),
      ask('actor', 'Can I reach the leaves up high?', 'Est-ce que j’attrape les feuilles tout en haut ?', [ok('Yes, you can!', 'Oui !', '👍'), no("No, you can't!", 'Non !', '👎')], ['Look at my long neck!', 'Regarde mon long cou !'], ['can', 'up_high'], {
        keepOrder: true,
        onCorrect: ['Yes! I can! My neck is so long!', 'Oui ! Mon cou est si long !'],
      }),
      ask('actor', 'Look at my tongue! What colour is it?', 'Regarde ma langue ! De quelle couleur est-elle ?', [ok("It's purple!", 'Elle est violette !', '🟣'), no("It's yellow!", 'Elle est jaune !', '🟡'), no("It's green!", 'Elle est verte !', '🟢')], ['A dark, dark colour!', 'Une couleur très foncée !'], ['giraffe_tongue', 'purple'], {
        minTier: 'intermediate',
        onCorrect: ['Yes! My long tongue is purple!', 'Oui ! Ma longue langue est violette !'],
      }),
      back(),
      ask('actor', 'Do I have spots or stripes?', 'J’ai des taches ou des rayures ?', [ok('Spots!', 'Des taches !', '🟤'), no('Stripes!', 'Des rayures !', '🦓')], ['Look at me!', 'Regarde-moi !'], ['giraffe_spots'], {
        keepOrder: true,
        onCorrect: ['Yes! Brown spots! The zebra has stripes.', 'Oui ! Des taches marron ! Le zèbre, lui, a des rayures.'],
      }),
      command('actor', 'Simon says! Touch a card, and I do it!', 'Jacques a dit ! Touche une carte, et je le fais !', cards, byTier(tier, 2, 3, 4), ['run', 'eat', 'giraffe_neck'], { onCorrect: ['What a happy giraffe!', 'Quelle girafe heureuse !'] }),
      say(other.speaker, 'My neck is little, but it will grow and grow!', 'Mon cou est encore petit, mais il va grandir, grandir !', { minTier: 'intermediate', needs: other.needs }, 'happy'),
      mum
        ? ask('actor', 'Is Daddy tall too?', 'Est-ce que Papa est grand, lui aussi ?', [ok('Yes, he is!', 'Oui !', '👍'), no("No, he isn't!", 'Non !', '👎')], ['Look at Daddy!', 'Regarde Papa !'], ['tall', 'he_is'], { minTier: 'expert', keepOrder: true, onCorrect: ['Yes! Daddy is very tall!', 'Oui ! Papa est très grand !'] })
        : ask('actor', 'Is Mummy tall too?', 'Est-ce que Maman est grande, elle aussi ?', [ok('Yes, she is!', 'Oui !', '👍'), no("No, she isn't!", 'Non !', '👎')], ['Look at Mummy!', 'Regarde Maman !'], ['tall', 'she_is'], { minTier: 'expert', keepOrder: true, onCorrect: ['Yes! Mummy is very tall!', 'Oui ! Maman est très grande !'] }),
      ask('actor', 'Who is the tallest animal?', 'Quel est l’animal le plus grand ?', [ok('The giraffe!', 'La girafe !', '🦒'), no('The zebra!', 'Le zèbre !', '🦓'), no('The lion!', 'Le lion !', '🦁')], ['Long neck, long legs!', 'Long cou, longues pattes !'], ['tallest', 'giraffe'], {
        minTier: 'expert',
        onCorrect: ['Yes! The giraffe is the tallest animal!', "Oui ! La girafe est l'animal le plus grand !"],
      }),
      end('actor', 'Thank you! I love my long neck!', "Merci ! J'adore mon long cou !"),
    ];
    return steps;
  },
  memoryEvent: () => 'giraffe_neck',
};

export const AFRICA_SPECIES_ACTIVITIES: readonly ActivityDef[] = [lionMane, elephantTrunk, giraffeNeck];
