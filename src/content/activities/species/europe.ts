/**
 * Jeux propres aux espèces d'Europe (2026-11-21) — « chaque personnage a son propre jeu avec son
 * propre vocabulaire ». Fiches dans `europe.arch.ts`.
 * - Renard (fox_tricks) : « Yip, yip! », a bushy tail, big ears, pounce, dig, sniff, a den.
 * - Hibou (owl_night) : la nuit, « Hoot, hoot! », big eyes, turn my head, feathers, wings, an owlet.
 * - Hérisson (hedgehog_ball) : spikes, curl up into a ball, a bed of leaves, beetles, worms, a hoglet.
 * Chaque jeu marche dans tous les décors de l'espèce ; aucun objet n'est posé dans l'eau ni dans la mer (dryLand).
 * Nourriture et capacités réelles (species.ts) ; aucune prédation montrée.
 */
import { NUMBERS } from '../../props';
import type { ActivityCtx, ActivityDef, CommandOption, Line, QuestStep, Tier } from '../../types';
import { numberId, numberOptions } from '../games';
import { act, anchor, ask, back, clearProps, command, end, L, landSpots, moveTo, no, ok, pickStable, prop, props, say, scene, skyProp, tap, tapProps } from '../kit';

const byTier = <T>(tier: Tier, b: T, i: T, e: T): T => (tier === 'beginner' ? b : tier === 'intermediate' ? i : e);
const num = (n: number) => NUMBERS[n]!;

/**
 * Emplacements au sec : hors de l'eau dessinée (landSpots) ET hors de toute zone d'eau ou de mer
 * du décor (la mer de la côte n'a pas de contour d'eau dans depth.ts : on se fie à son point « sea »).
 */
export function dryLand(place: ActivityCtx['place']): number[] {
  const wet = place.anchors.filter((a) => a.tags?.includes('water') || a.tags?.includes('sea')).map((a) => a.hit);
  const dry = landSpots(place).filter((i) => {
    const s = place.spots[i]!;
    return !wet.some((h) => s.x >= h.x && s.x <= h.x + h.w && s.y >= h.y && s.y <= h.y + h.h);
  });
  // d'abord la gauche et le centre : la famille se tient en bas à droite et cacherait l'objet
  return [...dry.filter((i) => place.spots[i]!.x < 60), ...dry.filter((i) => place.spots[i]!.x >= 60)];
}

/** L'autre parent, à regarder dans les questions « he / she » du niveau expert. */
function otherParent(c: ActivityCtx) {
  return c.actorKind === 'adult' && c.role === 'mother'
    ? { en: 'Daddy', fr: 'Papa', he: 'he', il: 'il', item: 'he_is' }
    : { en: 'Mummy', fr: 'Maman', he: 'she', il: 'elle', item: 'she_is' };
}

/** Compter des objets touchés, puis « How many? » dès le niveau intermédiaire. */
function countSteps(ids: string[], w: { plural: string; pluralFr: string }, touch: Line, items: string[]): QuestStep[] {
  const n = ids.length;
  return [
    tapProps('actor', touch.en, touch.fr, ids, [`Touch all the ${w.plural}!`, `Touche toutes les ${w.pluralFr} !`], [...items, 'count'], { count: true, onCorrect: L(`${num(n).en} ${w.plural}!`, `${num(n).fr} ${w.pluralFr} !`) }),
    ask('actor', `How many ${w.plural}?`, `Combien de ${w.pluralFr} ?`, numberOptions(n), ['Count again!', 'Recompte !'], [numberId(n), 'how_many'], { minTier: 'intermediate', onCorrect: L(`Yes! ${num(n).en} ${w.plural}!`, `Oui ! ${num(n).fr} ${w.pluralFr} !`) }),
  ];
}

// ---------------------------------------------------------------------------
// Renard — « Fox tricks! » : le cri, la queue touffue, les oreilles, les tours, le flair, la tanière
// ---------------------------------------------------------------------------

const POUNCE: CommandOption = { line: L('Leap!', 'Bondis !'), icon: '🦊', reply: L('Leap! I jump high and land on my paws!', 'Hop ! Je bondis très haut et je retombe sur mes pattes !'), action: 'jump' };
const DIG: CommandOption = { line: L('Dig!', 'Creuse !'), icon: '🕳️', reply: L("Dig, dig, dig! I'm digging a hole!", 'Creuse, creuse ! Je creuse un trou !'), action: 'dig' };
const RUN: CommandOption = { line: L('Run!', 'Cours !'), icon: '🏃', reply: L("Zoom! I'm running fast!", 'Zoum ! Je cours vite !'), action: 'run' };
const WAG: CommandOption = { line: L('Wag your tail!', 'Remue la queue !'), icon: '〰️', reply: L("Swish, swish! I'm wagging my bushy tail!", 'Swish, swish ! Je remue ma queue touffue !'), action: 'dance' };
const FOX_FLY: CommandOption = { line: L('Fly!', 'Vole !'), icon: '🪽', reply: L("Fly? Ha, ha! Foxes can't fly!", 'Voler ? Ha, ha ! Les renards ne savent pas voler !') };

export const foxTricks: ActivityDef = {
  id: 'fox_tricks',
  choices: (c) => (c.species.id === 'fox' && dryLand(c.place).length >= 3 ? ['tricks'] : []),
  build(c, tier) {
    const land = dryLand(c.place);
    const sniffAt = c.place.anchors.filter((a) => a.stand && !a.tags?.includes('water') && !a.tags?.includes('sea'));
    if (land.length < 3 || !sniffAt.length) return undefined;
    const spot = pickStable(sniffAt, c.place.id);
    const o = otherParent(c);
    const cards = byTier(tier, [POUNCE, DIG, FOX_FLY], [POUNCE, FOX_FLY, DIG, WAG], [POUNCE, DIG, FOX_FLY, RUN, WAG]);
    const need = byTier(tier, 2, 3, 4);
    const berries = byTier(tier, [land[0]!], [land[0]!, land[2]!], [land[0]!, land[2]!]);
    const drawnDen = anchor(c.place, 'den');
    const steps: QuestStep[] = [
      say('actor', "I'm a fox! Look at my big ears and my bushy tail!", 'Je suis un renard ! Regarde mes grandes oreilles et ma queue touffue !', {}, 'proud'),
      ask('actor', 'What does a fox say?', 'Que dit le renard ?', [ok('Yip, yip!', 'Yip, yip !', '🦊'), no('Moo!', 'Meuh !', '🐄'), no('Quack!', 'Coin-coin !', '🦆'), no('Hoot, hoot!', 'Hou, hou !', '🦉')], ['Listen! Yip, yip!', 'Écoute ! Yip, yip !'], ['fox_yip'], { onCorrect: ["Yes! Yip, yip! That's my fox call!", "Oui ! Yip, yip ! C'est mon cri de renard !"] }),
      ask('actor', "What have I got? It's big and fluffy!", "Qu'est-ce que j'ai ? C'est grand et tout doux !", [ok('A bushy tail!', 'Une queue touffue !', '🦊'), no('A long trunk!', 'Une longue trompe !', '🐘'), no('A shell!', 'Une coquille !', '🐚'), no('Wings!', 'Des ailes !', '🪽')], ['Look behind me!', 'Regarde derrière moi !'], ['fox_tail'], { onCorrect: ['Yes! My bushy tail keeps me warm!', 'Oui ! Ma queue touffue me tient chaud !'] }),
      ask('actor', 'What do I hear with?', "Avec quoi est-ce que j'entends ?", [ok('Your big ears!', 'Tes grandes oreilles !', '👂'), no('Your tail!', 'Ta queue !', '🦊'), no('Your paws!', 'Tes pattes !', '🐾')], ['Look at my head!', 'Regarde ma tête !'], ['fox_ears'], { minTier: 'intermediate', onCorrect: ['Yes! My big ears hear everything!', 'Oui ! Mes grandes oreilles entendent tout !'] }),
      say('actor', "Let's play! You are the boss! Tell me a fox trick!", 'On joue ! Tu es le chef ! Dis-moi un tour de renard !', {}, 'happy'),
      command('actor', 'Touch a card! What do I do?', "Touche une carte ! Qu'est-ce que je fais ?", cards, need, ['fox_pounce', 'dig'], { onCorrect: ['What a clever fox! Ha, ha!', 'Quel renard malin ! Ha, ha !'] }),
      moveTo(spot.id, 'sniff'),
      say('actor', 'Sniff, sniff! My nose can smell berries!', 'Snif, snif ! Mon nez sent des baies !', {}, 'curious'),
      back(),
      props([...berries.map((s, i) => prop(`fox_berry${i}`, 'berries', s)), prop('fox_grass', 'grass', land[1]!)]),
      tapProps('actor', 'Sniff, sniff! Find the berries!','Snif, snif ! Trouve les baies !', berries.map((_, i) => `fox_berry${i}`), ['Berries are round and blue!', 'Les baies sont rondes et bleues !'], ['berries', 'fox_sniff', 'hungry'], {
        count: berries.length > 1,
        wrong: { fox_grass: L("No, that's grass! I eat berries!", "Non, ça c'est de l'herbe ! Je mange des baies !") },
        onCorrect: L('Yes! Berries! Yum!', 'Oui ! Des baies ! Miam !'),
      }),
      act('actor', 'eat', 'Yum, yum! I love berries!', "Miam, miam ! J'adore les baies !", 'actor'),
      clearProps(),
    ];
    if (drawnDen) {
      steps.push(tap('actor', 'Where do I sleep? In my den! Touch the den!', 'Où est-ce que je dors ? Dans ma tanière ! Touche la tanière !', drawnDen.id, ['Look for a hole!', 'Cherche un trou !'], ['den', 'where'], { onCorrect: ['Yes! My den is my cosy home!', 'Oui ! Ma tanière, c’est ma maison douillette !'] }));
    } else {
      steps.push(
        props([prop('fox_den', 'den', land[0]!), prop('fox_nest', 'nest', land[1]!)]),
        tapProps('actor', 'Where do I sleep? In my den! Touch the den!', 'Où est-ce que je dors ? Dans ma tanière ! Touche la tanière !', ['fox_den'], ['A den is a hole in the ground!', 'Une tanière, c’est un trou dans la terre !'], ['den', 'where'], {
          wrong: { fox_nest: L("No, that's a nest! Birds sleep in nests!", "Non, ça c'est un nid ! Les oiseaux dorment dans les nids !") },
          onCorrect: L('Yes! My den is my cosy home!', 'Oui ! Ma tanière, c’est ma maison douillette !'),
        }),
        clearProps(),
      );
    }
    steps.push(
      ask('actor', 'Where does a fox live?', 'Où vit le renard ?', [ok('In a den!', 'Dans une tanière !', '🕳️'), no('In a nest!', 'Dans un nid !', '🪺'), no('In the sea!', 'Dans la mer !', '🌊')], ['Under the ground!', 'Sous la terre !'], ['den', 'where'], { minTier: 'intermediate', onCorrect: ['Yes! Foxes live in dens!', 'Oui ! Les renards vivent dans des tanières !'] }),
      ask('actor', `Look at ${o.en}! Has ${o.he} got a bushy tail?`, `Regarde ${o.fr} ! Est-ce qu'${o.il} a une queue touffue ?`, [ok(`Yes, ${o.he} has!`, 'Oui !', '👍'), no(`No, ${o.he} hasn't.`, 'Non.', '👎')], [`Look at ${o.en}'s tail!`, `Regarde la queue de ${o.fr} !`], ['fox_tail', o.item], { minTier: 'expert', keepOrder: true, onCorrect: [`Yes! ${o.he === 'she' ? 'She' : 'He'} has got a bushy tail too!`, `Oui ! ${o.il === 'elle' ? 'Elle' : 'Il'} a une queue touffue, comme moi !`] }),
      ask('actor', 'Can a fox fly?', 'Est-ce que le renard sait voler ?', [ok("No, it can't!", 'Non !', '🙅'), no('Yes, it can!', 'Oui !', '🪽')], ['I have got paws, not wings!', "J'ai des pattes, pas des ailes !"], ['cant', 'fly'], { minTier: 'expert', onCorrect: ["That's right! I can't fly, but I can pounce!", "C'est ça ! Je ne sais pas voler, mais je sais bondir !"] }),
      act('actor', 'jump', 'Pounce! What a great fox day!', 'Hop ! Quelle belle journée de renard !', 'actor'),
      end('actor', 'Yip, yip! Thank you! You know all my fox tricks!', 'Yip, yip ! Merci ! Tu connais tous mes tours de renard !'),
    );
    return steps;
  },
  memoryEvent: () => 'fox_tricks',
};

// ---------------------------------------------------------------------------
// Hibou — « Night owl! » : la nuit, le cri, les grands yeux, la tête qui tourne, les plumes, les ailes
// ---------------------------------------------------------------------------

export const owlNight: ActivityDef = {
  id: 'owl_night',
  choices: (c) => (c.species.id === 'owl' && dryLand(c.place).length >= 4 ? ['night'] : []),
  build(c, tier) {
    const land = dryLand(c.place);
    if (land.length < 4) return undefined;
    const o = otherParent(c);
    const n = byTier(tier, 2, 3, 4);
    const feathers = land.slice(0, n).map((s, i) => prop(`owl_feather${i}`, 'feather', s));
    const parent = c.actorKind === 'adult';
    return [
      say('actor', "Hoo-hoo! Owls wake up at night. Let's make it night!", 'Hou-hou ! Les hiboux se réveillent la nuit. Faisons venir la nuit !', {}, 'happy'),
      scene(true),
      props([skyProp('owl_moon', 'moon', 5), skyProp('owl_star0', 'star', 1), skyProp('owl_star1', 'star', 3)]),
      tapProps('actor', "It's night! Touch the moon!", "C'est la nuit ! Touche la lune !", ['owl_moon'], ['The moon is big and round!', 'La lune est grande et ronde !'], ['moon', 'night'], {
        wrong: { owl_star0: L("That's a star! Find the moon!", "Ça, c'est une étoile ! Cherche la lune !"), owl_star1: L("That's a star! Find the moon!", "Ça, c'est une étoile ! Cherche la lune !") },
        onCorrect: L('Yes! The moon! Good evening, moon!', 'Oui ! La lune ! Bonsoir, la lune !'),
      }),
      ask('actor', 'What does an owl say?', 'Que dit le hibou ?', [ok('Hoot, hoot!', 'Hou, hou !', '🦉'), no('Yip, yip!', 'Yip, yip !', '🦊'), no('Moo!', 'Meuh !', '🐄'), no('Quack!', 'Coin-coin !', '🦆')], ['Listen! Hoot, hoot!', 'Écoute ! Hou, hou !'], ['owl_hoot'], { onCorrect: ['Yes! Hoot, hoot! That is my owl song!', "Oui ! Hou, hou ! C'est ma chanson de hibou !"] }),
      ask('actor', 'Look at my big eyes! Can owls see in the dark?', 'Regarde mes grands yeux ! Est-ce que les hiboux voient dans le noir ?', [ok('Yes, they can!', 'Oui !', '👀'), no("No, they can't.", 'Non.', '🙈')], ['My eyes are very big!', 'Mes yeux sont très grands !'], ['owl_eyes', 'can'], { keepOrder: true, onCorrect: ['Yes! My big eyes see in the dark!', 'Oui ! Mes grands yeux voient dans le noir !'] }),
      ask('actor', 'Owls can turn their heads! What can I turn?', 'Les hiboux peuvent tourner la tête ! Qu’est-ce que je peux tourner ?', [ok('Your head!', 'Ta tête !', '🔄'), no('Your tail!', 'Ta queue !', '〰️'), no('Your feet!', 'Tes pattes !', '🐾')], ['Look! Left… and right!', 'Regarde ! À gauche… et à droite !'], ['owl_head'], { minTier: 'intermediate', onCorrect: ['Yes! I turn my head… left… and right!', 'Oui ! Je tourne la tête… à gauche… et à droite !'] }),
      props(feathers),
      ...countSteps(feathers.map((f) => f.id), { plural: 'feathers', pluralFr: 'plumes' }, L('Oh! My feathers fell down! Touch the feathers!', 'Oh ! Mes plumes sont tombées ! Touche les plumes !'), ['feather']),
      clearProps(),
      ask('actor', 'What do I fly with?', 'Avec quoi est-ce que je vole ?', [ok('Your wings!', 'Tes ailes !', '🪽'), no('Your ears!', 'Tes oreilles !', '👂'), no('Your tail!', 'Ta queue !', '〰️')], ['Flap, flap!', 'Flap, flap !'], ['owl_wings', 'fly'], { onCorrect: ['Yes! My wings! Flap, flap!', 'Oui ! Mes ailes ! Flap, flap !'] }),
      act('actor', 'fly', "Whoosh! I'm flying in the night!", 'Whoosh ! Je vole dans la nuit !', 'actor'),
      ask('actor', 'What is a baby owl called?', 'Comment s’appelle un bébé hibou ?', [ok('An owlet!', 'Un petit hibou (owlet) !', '🦉'), no('A puppy!', 'Un chiot !', '🐶'), no('A kitten!', 'Un chaton !', '🐱')], [parent ? 'My baby is an owlet!' : "I'm an owlet!", parent ? 'Mon bébé est un « owlet » !' : 'Je suis un « owlet » !'], ['owlet'], { minTier: 'intermediate', onCorrect: ['Yes! A little owlet!', 'Oui ! Un petit « owlet » !'] }),
      ask('actor', `Look at ${o.en}! Can ${o.he} fly?`, `Regarde ${o.fr} ! Est-ce qu'${o.il} sait voler ?`, [ok(`Yes, ${o.he} can!`, 'Oui !', '🪽'), no(`No, ${o.he} can't.`, 'Non.', '🙅')], [`${o.en} has got wings!`, `${o.fr} a des ailes !`], ['can', o.item], { minTier: 'expert', keepOrder: true, onCorrect: [`Yes! ${o.he === 'she' ? 'She' : 'He'} can fly!`, `Oui ! ${o.il === 'elle' ? 'Elle' : 'Il'} sait voler !`] }),
      ask('actor', 'Can an owl swim?', 'Est-ce que le hibou sait nager ?', [ok("No, it can't!", 'Non !', '🙅'), no('Yes, it can!', 'Oui !', '🏊')], ['Owls fly, but they don’t swim!', 'Les hiboux volent, mais ils ne nagent pas !'], ['cant', 'swim'], { minTier: 'expert', onCorrect: ["That's right! I fly, I don't swim!", "C'est ça ! Je vole, je ne nage pas !"] }),
      clearProps(),
      scene(false),
      say('actor', 'Look! The sun is up. Owls sleep in the day!', 'Regarde ! Le soleil se lève. Les hiboux dorment le jour !', {}, 'calm'),
      act('actor', 'sleep', 'Yawn… Good night, hoot, hoot!', 'Bâille… Bonne nuit, hou, hou !', 'actor'),
      end('actor', 'Thank you for the night with me! Sweet dreams!', 'Merci pour cette nuit avec moi ! Fais de beaux rêves !'),
    ];
  },
  memoryEvent: () => 'owl_night',
};

// ---------------------------------------------------------------------------
// Hérisson — « Curl up, hedgehog! » : les piquants, la boule, le lit de feuilles, les scarabées
// ---------------------------------------------------------------------------

export const hedgehogBall: ActivityDef = {
  id: 'hedgehog_ball',
  choices: (c) => (c.species.id === 'hedgehog' && dryLand(c.place).length >= 5 ? ['ball'] : []),
  build(c, tier) {
    const land = dryLand(c.place);
    if (land.length < 5) return undefined;
    const o = otherParent(c);
    const parent = c.actorKind === 'adult';
    const n = byTier(tier, 3, 4, 5);
    const leaves = land.slice(0, n).map((s, i) => prop(`hog_leaf${i}`, 'leaf', s, i % 2 ? 'yellow' : 'orange'));
    // repas : beetle + worm (+ un second scarabée) et des intrus (poisson, bambou) — jamais dans l'eau
    const meal = byTier(
      tier,
      [prop('hog_beetle0', 'beetle', land[0]!), prop('hog_worm', 'worm', land[2]!), prop('hog_fish', 'fish', land[1]!)],
      [prop('hog_beetle0', 'beetle', land[0]!), prop('hog_worm', 'worm', land[2]!), prop('hog_fish', 'fish', land[1]!), prop('hog_beetle1', 'beetle', land[4]!), prop('hog_bamboo', 'bamboo', land[3]!)],
      [prop('hog_beetle0', 'beetle', land[0]!), prop('hog_worm', 'worm', land[2]!), prop('hog_fish', 'fish', land[1]!), prop('hog_beetle1', 'beetle', land[4]!), prop('hog_bamboo', 'bamboo', land[3]!)],
    );
    const good = meal.filter((p) => p.prop !== 'fish' && p.prop !== 'bamboo').map((p) => p.id);
    const wrongFood = (what: Line): Line => L(`No, I don't eat ${what.en}! I eat beetles and worms!`, `Non, je ne mange pas ${what.fr} ! Je mange des scarabées et des vers !`);
    const wrong: Record<string, Line> = { hog_fish: wrongFood(L('fish', 'de poisson')) };
    if (meal.some((p) => p.id === 'hog_bamboo')) wrong.hog_bamboo = wrongFood(L('bamboo', 'de bambou'));
    return [
      say('actor', "Hello! I'm a hedgehog. Look at my back! I've got lots of spikes!", "Coucou ! Je suis un hérisson. Regarde mon dos ! J'ai plein de piquants !", {}, 'proud'),
      ask('actor', "What's on my back?", "Qu'est-ce que j'ai sur le dos ?", [ok('Spikes!', 'Des piquants !', '🦔'), no('Feathers!', 'Des plumes !', '🪶'), no('A shell!', 'Une coquille !', '🐚'), no('Wings!', 'Des ailes !', '🪽')], ['They are sharp! Ouch!', 'Ça pique ! Aïe !'], ['hog_spikes'], { onCorrect: ['Yes! Spikes! Be careful, they are sharp!', 'Oui ! Des piquants ! Attention, ça pique !'] }),
      say('actor', "When I'm scared, I curl up into a ball! A spiky ball!", "Quand j'ai peur, je me roule en boule ! Une boule qui pique !", {}, 'curious'),
      ask('actor', "What do I do when I'm scared?", "Qu'est-ce que je fais quand j'ai peur ?", [ok('You curl up into a ball!', 'Tu te roules en boule !', '⚪'), no('You fly away!', "Tu t'envoles !", '🪽'), no('You swim away!', 'Tu pars à la nage !', '🏊')], ['A round, spiky ball!', 'Une boule ronde qui pique !'], ['hog_ball'], { onCorrect: ['Yes! I curl up into a ball. Now I feel safe!', 'Oui ! Je me roule en boule. Je suis à l’abri !'] }),
      say('actor', "Brrr! It's cold. Let's make a bed of leaves!", 'Brrr ! Il fait froid. Faisons un lit de feuilles !', {}, 'calm'),
      props(leaves),
      ...countSteps(leaves.map((l) => l.id), { plural: 'leaves', pluralFr: 'feuilles' }, L('Touch the leaves! Put them in my bed!', 'Touche les feuilles ! Mets-les dans mon lit !'), ['leaf', 'hog_bed']),
      ask('actor', 'Where do I sleep?', 'Où est-ce que je dors ?', [ok('In the leaves!', 'Dans les feuilles !', '🍂'), no('In the water!', "Dans l'eau !", '💧'), no('In the sky!', 'Dans le ciel !', '☁️')], ['In my bed of leaves!', 'Dans mon lit de feuilles !'], ['hog_bed', 'where'], { minTier: 'intermediate', onCorrect: ['Yes! A cosy bed of leaves!', 'Oui ! Un lit de feuilles bien douillet !'] }),
      props(meal),
      tapProps('actor', "I'm hungry! I eat beetles and worms. Find them!", "J'ai faim ! Je mange des scarabées et des vers. Trouve-les !", good, ['Little beetles and long worms!', 'Des petits scarabées et des longs vers !'], ['beetle', 'worm', 'hungry'], { count: true, wrong, onCorrect: L('Yes! Yum, yum!', 'Oui ! Miam, miam !') }),
      act('actor', 'eat', 'Munch, munch! Thank you!', 'Miam, miam ! Merci !', 'actor'),
      clearProps(),
      ask('actor', 'What is a baby hedgehog called?', 'Comment s’appelle un bébé hérisson ?', [ok('A hoglet!', 'Un « hoglet » (bébé hérisson) !', '🦔'), no('A chick!', 'Un poussin !', '🐥'), no('A puppy!', 'Un chiot !', '🐶')], [parent ? 'My baby is a hoglet!' : "I'm a hoglet!", parent ? 'Mon bébé est un « hoglet » !' : 'Je suis un « hoglet » !'], ['hoglet'], { minTier: 'intermediate', onCorrect: ['Yes! A little hoglet with little spikes!', 'Oui ! Un petit « hoglet » avec des petits piquants !'] }),
      ask('actor', `Look at ${o.en}! Has ${o.he} got spikes?`, `Regarde ${o.fr} ! Est-ce qu'${o.il} a des piquants ?`, [ok(`Yes, ${o.he} has!`, 'Oui !', '👍'), no(`No, ${o.he} hasn't.`, 'Non.', '👎')], [`Look at ${o.en}'s back!`, `Regarde le dos de ${o.fr} !`], ['hog_spikes', o.item], { minTier: 'expert', keepOrder: true, onCorrect: [`Yes! ${o.he === 'she' ? 'She' : 'He'} has got spikes too!`, `Oui ! ${o.il === 'elle' ? 'Elle' : 'Il'} a des piquants, ${o.il === 'elle' ? 'elle' : 'lui'} aussi !`] }),
      ask('actor', 'Can a hedgehog jump?', 'Est-ce que le hérisson sait sauter ?', [ok("No, it can't!", 'Non !', '🙅'), no('Yes, it can!', 'Oui !', '🦘')], ['My legs are very short!', 'Mes pattes sont toutes courtes !'], ['cant', 'jump'], { minTier: 'expert', onCorrect: ["That's right! I can't jump, but I can run!", "C'est ça ! Je ne sais pas sauter, mais je sais courir !"] }),
      act('actor', 'sleep', 'Yawn… My bed of leaves is so cosy!', 'Bâille… Mon lit de feuilles est si douillet !', 'actor'),
      end('actor', 'Thank you! I am a happy hedgehog!', 'Merci ! Je suis un hérisson tout content !'),
    ];
  },
  memoryEvent: () => 'hedgehog_ball',
};

/** Déroulé des jeux propres aux espèces de ce continent (voir `europe.arch.ts`). */
export const EUROPE_SPECIES_ACTIVITIES: readonly ActivityDef[] = [foxTricks, owlNight, hedgehogBall];
