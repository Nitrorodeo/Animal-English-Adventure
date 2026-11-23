/**
 * Jeux propres aux espèces d'Asie (2026-11-22) — « chaque personnage a son propre jeu avec son
 * propre vocabulaire ». Fiches dans `asia.arch.ts`.
 * - Panda (panda_picnic) : black and white, black ears, bamboo, munch, a round tummy, roll over.
 * - Tigre (tiger_stripes) : stripes, orange fur, « Roar! », hide in the bamboo, love to swim, a tiger cub.
 *   Aucune chasse, aucune proie : le tigre joue, se cache pour rire et se baigne.
 * - Panthère des neiges (leopard_leap) : « Chuff, chuff! » (elle ne sait pas rugir), a fluffy tail
 *   (elle s'en couvre le nez), big furry paws, thick fur, leap. Aucun mot déjà pris par la grotte
 *   enneigée (cave, flag, morning, wake up, footprint).
 * Chaque jeu marche dans tous les décors de l'espèce ; aucun objet n'est posé dans l'eau.
 */
import { NUMBERS } from '../../props';
import type { ActivityCtx, ActivityDef, CommandOption, Line, QuestStep, Speaker, Tier } from '../../types';
import { numberId, numberOptions } from '../games';
import { act, anchor, ask, back, clearProps, command, end, L, landSpots, moveTo, no, ok, prop, props, say, tap, tapActor, tapProps, waterPlaces } from '../kit';

const byTier = <T>(tier: Tier, b: T, i: T, e: T): T => (tier === 'beginner' ? b : tier === 'intermediate' ? i : e);
const num = (n: number) => NUMBERS[n]!;

/** Emplacements au sec : hors de l'eau dessinée ET hors de toute zone d'eau du décor (bassin, cascade). */
function dryLand(place: ActivityCtx['place']): number[] {
  const wet = place.anchors.filter((a) => a.tags?.includes('water') || a.tags?.includes('sea')).map((a) => a.hit);
  const dry = landSpots(place).filter((i) => {
    const s = place.spots[i]!;
    return !wet.some((h) => s.x >= h.x && s.x <= h.x + h.w && s.y >= h.y && s.y <= h.y + h.h);
  });
  // d'abord la gauche et le centre : la famille se tient en bas à droite et cacherait l'objet
  return [...dry.filter((i) => place.spots[i]!.x < 60), ...dry.filter((i) => place.spots[i]!.x >= 60)];
}

/** L'autre parent, à regarder dans les questions « he / she » et à toucher. */
function otherParent(c: ActivityCtx): { role: Speaker; en: string; fr: string; he: string; He: string; il: string; Il: string; item: string } {
  return c.actorKind === 'adult' && c.role === 'mother'
    ? { role: 'father', en: 'Daddy', fr: 'Papa', he: 'he', He: 'He', il: 'il', Il: 'Il', item: 'he_is' }
    : { role: 'mother', en: 'Mummy', fr: 'Maman', he: 'she', He: 'She', il: 'elle', Il: 'Elle', item: 'she_is' };
}

/** Toucher des objets, puis « How many? » dès le niveau intermédiaire. */
function countSteps(ids: string[], w: { plural: string; pluralFr: string; fem?: boolean }, touch: Line, items: string[], wrong?: Record<string, Line>): QuestStep[] {
  const n = ids.length;
  return [
    tapProps('actor', touch.en, touch.fr, ids, [`Touch all the ${w.plural}!`, `Touche ${w.fem ? 'toutes' : 'tous'} les ${w.pluralFr} !`], [...items, 'count'], { count: true, ...(wrong ? { wrong } : {}), onCorrect: L(`${num(n).en} ${w.plural}!`, `${num(n).fr} ${w.pluralFr} !`) }),
    ask('actor', `How many ${w.plural}?`, `Combien de ${w.pluralFr} ?`, numberOptions(n), ['Count again!', 'Recompte !'], [numberId(n), 'how_many'], { minTier: 'intermediate', onCorrect: L(`Yes! ${num(n).en} ${w.plural}!`, `Oui ! ${num(n).fr} ${w.pluralFr} !`) }),
  ];
}

// ---------------------------------------------------------------------------
// Panda — « Bamboo picnic! » : noir et blanc, le bambou, munch, le ventre rond, la roulade
// ---------------------------------------------------------------------------

const ROLL: CommandOption = { line: L('Roll over!', 'Fais une roulade !'), icon: '🔄', reply: L('Roly-poly! I roll over and over!', 'Roule, roule ! Je fais des roulades !'), action: 'dance' };
const P_CLIMB: CommandOption = { line: L('Climb!', 'Grimpe !'), icon: '🧗', reply: L('Up, up, up! Pandas can climb!', 'Hop, hop, hop ! Les pandas savent grimper !'), action: 'climb' };
const MUNCH: CommandOption = { line: L('Munch!', 'Mâchouille !'), icon: '🎋', reply: L('Munch, munch, munch! Yummy bamboo!', 'Miam, miam, miam ! Du bon bambou !'), action: 'eat' };
const NAP: CommandOption = { line: L('Sleep!', 'Dors !'), icon: '😴', reply: L('Yawn… A little panda nap!', 'Bâille… Une petite sieste de panda !'), action: 'sleep' };
const P_FLY: CommandOption = { line: L('Fly!', 'Vole !'), icon: '🪽', reply: L("Fly? Ha, ha! Pandas can't fly!", 'Voler ? Ha, ha ! Les pandas ne savent pas voler !') };

export const pandaPicnic: ActivityDef = {
  id: 'panda_picnic',
  choices: (c) => (c.species.id === 'giant_panda' && dryLand(c.place).length >= 5 ? ['picnic'] : []),
  build(c, tier) {
    const land = dryLand(c.place);
    if (land.length < 5) return undefined;
    const o = otherParent(c);
    const n = byTier(tier, 2, 3, 3);
    const bamboo = land.slice(0, n).map((s, i) => prop(`panda_bamboo${i}`, 'bamboo', s));
    // intrus : du poisson, et de la viande dès l'intermédiaire (species.notFoods)
    const odd = [prop('panda_fish', 'fish', land[n]!), ...(tier === 'beginner' ? [] : [prop('panda_meat', 'meat', land[n + 1]!)])];
    const wrongFood = (what: Line): Line => L(`No, I don't eat ${what.en}! I eat bamboo!`, `Non, je ne mange pas ${what.fr} ! Je mange du bambou !`);
    const wrong: Record<string, Line> = { panda_fish: wrongFood(L('fish', 'de poisson')) };
    if (tier !== 'beginner') wrong.panda_meat = wrongFood(L('meat', 'de viande'));
    const drawn = anchor(c.place, 'bamboo');
    const cards = byTier(tier, [ROLL, P_FLY, MUNCH], [ROLL, P_CLIMB, P_FLY, MUNCH], [ROLL, P_CLIMB, P_FLY, MUNCH, NAP]);
    const need = byTier(tier, 2, 3, 4);
    const steps: QuestStep[] = [
      say('actor', "Hello! I'm a giant panda! Look at me! I'm black and white!", 'Coucou ! Je suis un panda géant ! Regarde-moi ! Je suis noir et blanc !', {}, 'proud'),
      ask('actor', 'What colours am I?', 'De quelles couleurs je suis ?', [ok('Black and white!', 'Noir et blanc !', '🐼'), no('Orange and black!', 'Orange et noir !', '🐯'), no('Pink!', 'Rose !', '🩷')], ['Look at my fur!', 'Regarde ma fourrure !'], ['panda_black_white'], { onCorrect: ['Yes! I am black and white!', 'Oui ! Je suis noir et blanc !'] }),
      ask('actor', 'Look at my ears! What colour are they?', 'Regarde mes oreilles ! De quelle couleur sont-elles ?', [ok('Black!', 'Noires !', '⚫'), no('Pink!', 'Roses !', '🩷'), no('Orange!', 'Orange !', '🟧')], ['Look at the top of my head!', 'Regarde en haut de ma tête !'], ['panda_ears'], { minTier: 'intermediate', onCorrect: ['Yes! I have got black ears!', "Oui ! J'ai des oreilles noires !"] }),
    ];
    if (drawn)
      steps.push(tap('actor', 'Pandas love bamboo! Touch the bamboo!', 'Les pandas adorent le bambou ! Touche le bambou !', drawn.id, ['The tall green sticks!', 'Les grandes tiges vertes !'], ['bamboo'], { onCorrect: ['Yes! Bamboo! My favourite food!', 'Oui ! Du bambou ! Mon plat préféré !'] }));
    steps.push(
      say('actor', "Let's have a bamboo picnic! I'm hungry!", 'Faisons un pique-nique de bambou ! J’ai faim !', {}, 'happy'),
      props([...bamboo, ...odd]),
      ...countSteps(bamboo.map((b) => b.id), { plural: 'bamboo sticks', pluralFr: 'bâtons de bambou' }, L('I eat bamboo! Find the bamboo!', 'Je mange du bambou ! Trouve le bambou !'), ['bamboo', 'hungry'], wrong),
      act('actor', 'eat', 'Munch, munch, munch! I hold my bamboo in my paw!', 'Miam, miam, miam ! Je tiens mon bambou dans ma patte !', 'actor'),
      clearProps(),
      ask('actor', 'Munch, munch! Now my tummy is…?', 'Miam, miam ! Maintenant, mon ventre est… ?', [ok('Round and full!', 'Tout rond et bien rempli !', '🟤'), no('Blue!', 'Bleu !', '🔵'), no('Empty!', 'Vide !', '🫙')], ['I ate lots of bamboo!', "J'ai mangé plein de bambou !"], ['panda_tummy', 'panda_munch'], { onCorrect: ['Yes! A round tummy, full of bamboo!', 'Oui ! Un ventre tout rond, plein de bambou !'] }),
      say('actor', 'Pandas love to play! Now you are the boss!', 'Les pandas adorent jouer ! Maintenant, tu es le chef !', {}, 'happy'),
      command('actor', 'Touch a card! What do I do?', "Touche une carte ! Qu'est-ce que je fais ?", cards, need, ['panda_roll', 'panda_munch'], { onCorrect: ['What a funny panda! Ha, ha!', 'Quel drôle de panda ! Ha, ha !'] }),
      ask('actor', 'What do pandas eat?', 'Que mangent les pandas ?', [ok('Bamboo!', 'Du bambou !', '🎋'), no('Fish!', 'Du poisson !', '🐟'), no('Meat!', 'De la viande !', '🍖')], ['Green and crunchy!', 'Vert et croquant !'], ['bamboo'], { minTier: 'intermediate', onCorrect: ['Yes! Pandas eat bamboo all day long!', 'Oui ! Les pandas mangent du bambou toute la journée !'] }),
      ask('actor', `Look at ${o.en}! Has ${o.he} got black ears?`, `Regarde ${o.fr} ! Est-ce qu'${o.il} a des oreilles noires ?`, [ok(`Yes, ${o.he} has!`, 'Oui !', '👍'), no(`No, ${o.he} hasn't.`, 'Non.', '👎')], [`Look at ${o.en}'s head!`, `Regarde la tête de ${o.fr} !`], ['panda_ears', o.item], { minTier: 'expert', keepOrder: true, onCorrect: [`Yes! ${o.He} has got black ears too!`, `Oui ! ${o.Il} a des oreilles noires, ${o.il === 'elle' ? 'elle' : 'lui'} aussi !`] }),
      ask('actor', 'Can a panda climb?', 'Est-ce que le panda sait grimper ?', [ok('Yes, it can!', 'Oui !', '🧗'), no("No, it can't.", 'Non.', '🙅')], ['Pandas climb trees!', 'Les pandas grimpent aux arbres !'], ['can', 'climb'], { minTier: 'expert', keepOrder: true, onCorrect: ["Yes! I can climb, but I can't fly!", 'Oui ! Je sais grimper, mais je ne sais pas voler !'] }),
      act('actor', 'sleep', 'Yawn… A panda nap after the picnic!', 'Bâille… Une sieste de panda après le pique-nique !', 'actor'),
      end('actor', 'Munch, munch! Thank you for the bamboo picnic!', 'Miam, miam ! Merci pour le pique-nique de bambou !'),
    );
    return steps;
  },
  memoryEvent: () => 'panda_picnic',
};

// ---------------------------------------------------------------------------
// Tigre — « Tiger stripes! » : les rayures, la fourrure orange, Roar!, se cacher, nager
// ---------------------------------------------------------------------------

const ROAR: CommandOption = { line: L('Roar!', 'Rugis !'), icon: '🐯', reply: L('ROAR! I am a big tiger!', 'ROAR ! Je suis un grand tigre !'), action: 'roar' };
const T_JUMP: CommandOption = { line: L('Jump!', 'Saute !'), icon: '🦘', reply: L('Jump! Look how high I can jump!', 'Hop ! Regarde comme je saute haut !'), action: 'jump' };
const T_RUN: CommandOption = { line: L('Run!', 'Cours !'), icon: '🏃', reply: L("Zoom! I'm running fast!", 'Zoum ! Je cours vite !'), action: 'run' };
const T_FLY: CommandOption = { line: L('Fly!', 'Vole !'), icon: '🪽', reply: L("Fly? Ha, ha! Tigers can't fly!", 'Voler ? Ha, ha ! Les tigres ne savent pas voler !') };
const T_DANCE: CommandOption = { line: L('Dance!', 'Danse !'), icon: '💃', reply: L('Look! A tiger dance! Stripes, stripes, stripes!', 'Regarde ! Une danse de tigre ! Rayures, rayures, rayures !'), action: 'dance' };

export const tigerStripes: ActivityDef = {
  id: 'tiger_stripes',
  choices: (c) => (c.species.id === 'tiger' && dryLand(c.place).length >= 5 ? ['stripes'] : []),
  build(c, tier) {
    const land = dryLand(c.place);
    if (land.length < 5) return undefined;
    const o = otherParent(c);
    const parent = c.actorKind === 'adult';
    const n = byTier(tier, 2, 3, 3);
    const orange = land.slice(0, n).map((s, i) => prop(`tiger_orange${i}`, 'leaf', s, 'orange'));
    const green = land.slice(n, n + byTier(tier, 1, 2, 2)).map((s, i) => prop(`tiger_green${i}`, 'leaf', s, 'green'));
    const wrong = Object.fromEntries(green.map((g) => [g.id, L("No, that one is green! Find the orange leaves!", 'Non, celle-là est verte ! Cherche les feuilles orange !')]));
    const hideIn = anchor(c.place, 'bamboo');
    const water = waterPlaces(c.place)[0];
    const cards = byTier(tier, [ROAR, T_FLY, T_JUMP], [ROAR, T_FLY, T_JUMP, T_RUN], [ROAR, T_JUMP, T_FLY, T_RUN, T_DANCE]);
    const need = byTier(tier, 2, 3, 4);
    const steps: QuestStep[] = [
      say('actor', "Roar! I'm a tiger! Look at my orange fur and my black stripes!", 'Roar ! Je suis un tigre ! Regarde ma fourrure orange et mes rayures noires !', {}, 'proud'),
      ask('actor', "What's on my orange fur?", "Qu'est-ce qu'il y a sur ma fourrure orange ?", [ok('Black stripes!', 'Des rayures noires !', '🐯'), no('Spikes!', 'Des piquants !', '🦔'), no('Feathers!', 'Des plumes !', '🪶'), no('A shell!', 'Une coquille !', '🐚')], ['Long black lines!', 'De longues lignes noires !'], ['tiger_stripes'], { onCorrect: ['Yes! Stripes! Every tiger has its own stripes!', 'Oui ! Des rayures ! Chaque tigre a ses propres rayures !'] }),
      ask('actor', 'What colour is my fur?', 'De quelle couleur est ma fourrure ?', [ok('Orange!', 'Orange !', '🟧'), no('Blue!', 'Bleue !', '🔵'), no('Pink!', 'Rose !', '🩷')], ['Like a carrot!', 'Comme une carotte !'], ['tiger_orange_fur', 'orange'], { onCorrect: ['Yes! I have got orange fur!', "Oui ! J'ai une fourrure orange !"] }),
      say('actor', "Let's play! You are the boss! Tell me a tiger trick!", 'On joue ! Tu es le chef ! Dis-moi un tour de tigre !', {}, 'happy'),
      command('actor', 'Touch a card! What do I do?', "Touche une carte ! Qu'est-ce que je fais ?", cards, need, ['tiger_roar'], { onCorrect: ['What a great tiger! Ha, ha!', 'Quel super tigre ! Ha, ha !'] }),
    ];
    if (hideIn)
      steps.push(tap('actor', 'My stripes help me hide in the bamboo! Touch the bamboo!', "Mes rayures m'aident à me cacher dans les bambous ! Touche le bambou !", hideIn.id, ['The tall green sticks!', 'Les grandes tiges vertes !'], ['tiger_hide', 'bamboo'], { onCorrect: ["Can you see me? Hee, hee! I'm hiding!", 'Tu me vois ? Hi, hi ! Je me cache !'] }));
    else
      steps.push(ask('actor', 'Why have I got stripes?', "Pourquoi j'ai des rayures ?", [ok('To hide!', 'Pour me cacher !', '🙈'), no('To fly!', 'Pour voler !', '🪽')], ['Stripes are great for hiding!', 'Les rayures, c’est super pour se cacher !'], ['tiger_hide'], { onCorrect: ["Yes! Can you see me? Hee, hee! I'm hiding!", 'Oui ! Tu me vois ? Hi, hi ! Je me cache !'] }));
    steps.push(
      props([...orange, ...green]),
      ...countSteps(orange.map((x) => x.id), { plural: 'orange leaves', pluralFr: 'feuilles orange', fem: true }, L('Find the orange leaves! Orange like my fur!', 'Trouve les feuilles orange ! Orange comme ma fourrure !'), ['orange', 'leaf'], wrong),
      clearProps(),
      say('actor', 'Phew! It is hot! Tigers love to swim!', 'Ouf ! Il fait chaud ! Les tigres adorent nager !', {}, 'happy'),
    );
    if (water) steps.push(moveTo(water.id, 'walk'), act('actor', 'swim', 'Splash! I love to swim! The water is so cool!', "Splash ! J'adore nager ! L'eau est toute fraîche !", 'actor'), back());
    else steps.push(say('actor', "There's no pond here. Next time, let's find water and swim!", "Il n'y a pas de bassin ici. La prochaine fois, on cherchera de l'eau pour nager !", {}, 'calm'));
    steps.push(
      ask('actor', 'Do tigers like water?', "Est-ce que les tigres aiment l'eau ?", [ok('Yes, they do!', 'Oui !', '💦'), no("No, they don't.", 'Non.', '🙅')], ['Splash! Tigers love to swim!', 'Splash ! Les tigres adorent nager !'], ['tiger_swim', 'swim'], { keepOrder: true, onCorrect: ['Yes! Tigers love to swim!', 'Oui ! Les tigres adorent nager !'] }),
      ask('actor', 'What is a baby tiger called?', 'Comment s’appelle un bébé tigre ?', [ok('A cub!', 'Un petit (cub) !', '🐯'), no('A chick!', 'Un poussin !', '🐥'), no('A puppy!', 'Un chiot !', '🐶')], [parent ? 'My baby is a tiger cub!' : "I'm a tiger cub!", parent ? 'Mon bébé est un « tiger cub » !' : 'Je suis un « tiger cub » !'], ['tiger_cub'], { minTier: 'intermediate', onCorrect: ['Yes! A little tiger cub with little stripes!', 'Oui ! Un petit tigre avec des petites rayures !'] }),
      ask('actor', `Look at ${o.en}! Has ${o.he} got stripes?`, `Regarde ${o.fr} ! Est-ce qu'${o.il} a des rayures ?`, [ok(`Yes, ${o.he} has!`, 'Oui !', '👍'), no(`No, ${o.he} hasn't.`, 'Non.', '👎')], [`Look at ${o.en}'s fur!`, `Regarde la fourrure de ${o.fr} !`], ['tiger_stripes', o.item], { minTier: 'expert', keepOrder: true, onCorrect: [`Yes! ${o.He} has got stripes too!`, `Oui ! ${o.Il} a des rayures, ${o.il === 'elle' ? 'elle' : 'lui'} aussi !`] }),
      ask('actor', 'Can a tiger fly?', 'Est-ce que le tigre sait voler ?', [ok("No, it can't!", 'Non !', '🙅'), no('Yes, it can!', 'Oui !', '🪽')], ['I have got paws, not wings!', "J'ai des pattes, pas des ailes !"], ['cant', 'fly'], { minTier: 'expert', onCorrect: ["That's right! I can't fly, but I can swim!", "C'est ça ! Je ne sais pas voler, mais je sais nager !"] }),
      act('actor', 'roar', 'ROAR! What a great tiger day!', 'ROAR ! Quelle belle journée de tigre !', 'actor'),
      end('actor', 'Thank you! You know all about my stripes!', 'Merci ! Tu sais tout sur mes rayures !'),
    );
    return steps;
  },
  memoryEvent: () => 'tiger_stripes',
};

// ---------------------------------------------------------------------------
// Panthère des neiges — « Snow leopard leaps! » : chuff, la queue touffue, les pattes poilues, les bonds
// ---------------------------------------------------------------------------

const LEAP: CommandOption = { line: L('Leap!', 'Fais un grand bond !'), icon: '🦘', reply: L('Leap! A big, big jump from rock to rock!', 'Hop ! Un très grand bond de rocher en rocher !'), action: 'jump' };
const L_CLIMB: CommandOption = { line: L('Climb!', 'Grimpe !'), icon: '🧗', reply: L('Up, up! I climb the mountain!', 'Hop, hop ! Je grimpe dans la montagne !'), action: 'climb' };
const L_RUN: CommandOption = { line: L('Run!', 'Cours !'), icon: '🏃', reply: L("Zoom! I'm running on my big furry paws!", 'Zoum ! Je cours sur mes grosses pattes poilues !'), action: 'run' };
const L_ROAR: CommandOption = { line: L('Roar!', 'Rugis !'), icon: '🦁', reply: L("Roar? I can't roar! I say chuff, chuff!", 'Rugir ? Je ne sais pas rugir ! Je dis chouf, chouf !') };
const L_FLY: CommandOption = { line: L('Fly!', 'Vole !'), icon: '🪽', reply: L("Fly? Ha, ha! Snow leopards can't fly!", 'Voler ? Ha, ha ! Les panthères des neiges ne savent pas voler !') };
const CURL: CommandOption = { line: L('Curl up!', 'Roule-toi en boule !'), icon: '😴', reply: L('I curl up and cover my nose with my fluffy tail!', 'Je me roule en boule et je couvre mon nez avec ma queue touffue !'), action: 'sleep' };
const LEAP_COUNT: readonly Line[] = [L('One leap!', 'Un bond !'), L('Two leaps!', 'Deux bonds !'), L('Three leaps!', 'Trois bonds !'), L('Four leaps!', 'Quatre bonds !')];

export const leopardLeap: ActivityDef = {
  id: 'leopard_leap',
  choices: (c) => (c.species.id === 'snow_leopard' ? ['leap'] : []),
  build(c, tier) {
    const o = otherParent(c);
    const leaps = byTier(tier, 2, 3, 4);
    const cards = byTier(tier, [LEAP, L_ROAR, L_CLIMB], [LEAP, L_ROAR, L_CLIMB, L_RUN], [LEAP, L_ROAR, L_CLIMB, L_FLY, L_RUN, CURL]);
    const need = byTier(tier, 2, 3, 4);
    return [
      say('actor', "Hello! I'm a snow leopard! I live high in the mountains. Look at my thick fur!", "Coucou ! Je suis une panthère des neiges ! J'habite tout en haut des montagnes. Regarde ma fourrure épaisse !", {}, 'proud'),
      ask('actor', 'What does a snow leopard say?', 'Que dit la panthère des neiges ?', [ok('Chuff, chuff!', 'Chouf, chouf !', '🐆'), no('Moo!', 'Meuh !', '🐄'), no('Quack!', 'Coin-coin !', '🦆'), no('Hoot, hoot!', 'Hou, hou !', '🦉')], ['Listen! Chuff, chuff!', 'Écoute ! Chouf, chouf !'], ['leopard_chuff'], { onCorrect: ["Yes! Chuff, chuff! That's my hello!", "Oui ! Chouf, chouf ! C'est mon bonjour !"] }),
      ask('actor', "What have I got? It's long and fluffy!", "Qu'est-ce que j'ai ? C'est long et tout touffu !", [ok('A fluffy tail!', 'Une queue touffue !', '🐆'), no('A trunk!', 'Une trompe !', '🐘'), no('Spikes!', 'Des piquants !', '🦔'), no('Wings!', 'Des ailes !', '🪽')], ['Look behind me!', 'Regarde derrière moi !'], ['leopard_tail'], { onCorrect: ['Yes! My long, fluffy tail!', 'Oui ! Ma longue queue touffue !'] }),
      say('actor', 'Brrr! When it is cold, I cover my nose with my fluffy tail!', 'Brrr ! Quand il fait froid, je couvre mon nez avec ma queue touffue !', {}, 'calm'),
      tapActor('narrator', L(`${o.en} has got a fluffy tail too! Touch ${o.en}!`, `${o.fr} a une queue touffue, ${o.il === 'elle' ? 'elle' : 'lui'} aussi ! Touche ${o.fr} !`), o.role, 'dance', L('Swish! My fluffy tail keeps my nose warm!', 'Swish ! Ma queue touffue me tient le nez au chaud !'), L(`Not me! Find ${o.en}!`, `Pas moi ! Trouve ${o.fr} !`), L(`Touch ${o.en}!`, `Touche ${o.fr} !`), ['leopard_tail', o.role === 'father' ? 'dad' : 'mum']),
      ask('actor', 'Look at my paws! What are they like?', 'Regarde mes pattes ! Comment sont-elles ?', [ok('Big and furry!', 'Grosses et pleines de poils !', '🐾'), no('Small and pink!', 'Petites et roses !', '🩷'), no('Flippers!', 'Des nageoires !', '🐧')], ['Big paws for the soft snow!', 'De grosses pattes pour la neige toute molle !'], ['leopard_paws'], { onCorrect: ["Yes! Big furry paws! I don't sink in the snow!", "Oui ! De grosses pattes poilues ! Je ne m'enfonce pas dans la neige !"] }),
      say('actor', "Let's play! You are the boss! Tell me a snow leopard trick!", 'On joue ! Tu es le chef ! Dis-moi un tour de panthère des neiges !', {}, 'happy'),
      command('actor', 'Touch a card! What do I do?', "Touche une carte ! Qu'est-ce que je fais ?", cards, need, ['leopard_leap', 'leopard_chuff'], { onCorrect: ['What a clever snow leopard! Chuff, chuff!', 'Quelle panthère maligne ! Chouf, chouf !'] }),
      say('actor', 'Snow leopards leap very far! Count my leaps!', 'Les panthères des neiges font de très grands bonds ! Compte mes bonds !', {}, 'curious'),
      ...LEAP_COUNT.slice(0, leaps).map((x) => act('actor', 'jump', x.en, x.fr, 'actor')),
      ask('actor', 'How many leaps?', 'Combien de bonds ?', numberOptions(leaps), ['Count again!', 'Recompte !'], [numberId(leaps), 'how_many', 'leopard_leap'], { minTier: 'intermediate', onCorrect: L(`Yes! ${num(leaps).en} big leaps!`, `Oui ! ${num(leaps).fr} grands bonds !`) }),
      ask('actor', 'What do I cover my nose with?', 'Avec quoi je couvre mon nez ?', [ok('Your fluffy tail!', 'Ta queue touffue !', '🐆'), no('A leaf!', 'Une feuille !', '🍃'), no('Your ears!', 'Tes oreilles !', '👂')], ['It is long and fluffy!', "C'est long et touffu !"], ['leopard_tail'], { minTier: 'intermediate', onCorrect: ['Yes! My fluffy tail is like a warm scarf!', 'Oui ! Ma queue touffue, c’est comme une écharpe bien chaude !'] }),
      ask('actor', `Look at ${o.en}! Has ${o.he} got thick fur?`, `Regarde ${o.fr} ! Est-ce qu'${o.il} a une fourrure épaisse ?`, [ok(`Yes, ${o.he} has!`, 'Oui !', '👍'), no(`No, ${o.he} hasn't.`, 'Non.', '👎')], [`Look at ${o.en}'s fur!`, `Regarde la fourrure de ${o.fr} !`], ['leopard_fur', o.item], { minTier: 'expert', keepOrder: true, onCorrect: [`Yes! ${o.He} has got thick fur too! Warm and cosy!`, `Oui ! ${o.Il} a une fourrure épaisse, ${o.il === 'elle' ? 'elle' : 'lui'} aussi ! Bien au chaud !`] }),
      ask('actor', 'Can a snow leopard roar?', 'Est-ce que la panthère des neiges sait rugir ?', [ok("No, it can't!", 'Non !', '🙅'), no('Yes, it can!', 'Oui !', '📢')], ['I say chuff, chuff!', 'Je dis chouf, chouf !'], ['cant', 'leopard_chuff'], { minTier: 'expert', onCorrect: ["That's right! I can't roar, but I can leap!", "C'est ça ! Je ne sais pas rugir, mais je sais faire de grands bonds !"] }),
      act('actor', 'sleep', 'Yawn… I curl up and cover my nose with my fluffy tail. So cosy!', 'Bâille… Je me roule en boule et je couvre mon nez avec ma queue touffue. Bien au chaud !', 'actor'),
      end('actor', 'Chuff, chuff! Thank you! You know all my snow leopard secrets!', 'Chouf, chouf ! Merci ! Tu connais tous mes secrets de panthère des neiges !'),
    ];
  },
  memoryEvent: () => 'leopard_leap',
};

/** Déroulé des jeux propres aux espèces de ce continent (voir `asia.arch.ts`). */
export const ASIA_SPECIES_ACTIVITIES: readonly ActivityDef[] = [pandaPicnic, tigerStripes, leopardLeap];
