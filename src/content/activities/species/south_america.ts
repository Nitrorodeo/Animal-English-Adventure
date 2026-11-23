/**
 * Jeux propres aux espèces d'Amérique du Sud (2026-11-22) — « chaque personnage a son propre jeu avec
 * son propre vocabulaire ». Fiches dans `south_america.arch.ts`.
 * - Jaguar (jaguar_quiet_paws) : spots, paw prints, quiet paws, sharp eyes, in the dark, swim.
 *   Jamais de chasse ni de proie : on joue à marcher sans bruit et à suivre ses propres empreintes.
 * - Toucan (toucan_big_beak) : a big beak, colourful, toss and catch, a hole in a tree, wings.
 * - Paresseux (sloth_slow_slow) : very slow, long claws, hang upside down, leaves, sleep a lot.
 * Chaque jeu marche dans tous les décors de l'espèce ; aucun objet n'est posé dans l'eau (dryLand).
 * Nourriture et capacités réelles (species.ts : foods / can / cannot).
 */
import { NUMBERS } from '../../props';
import { PLACE_DEPTH } from '../../places/depth';
import type { ActivityCtx, ActivityDef, CommandOption, Line, QuestStep, Tier } from '../../types';
import { numberId, numberOptions } from '../games';
import { act, ask, clearProps, command, end, L, landSpots, no, ok, prop, props, say, scene, skyProp, tapProps } from '../kit';

const byTier = <T>(tier: Tier, b: T, i: T, e: T): T => (tier === 'beginner' ? b : tier === 'intermediate' ? i : e);
const num = (n: number) => NUMBERS[n]!;

/** Emplacements au sec : hors de l'eau dessinée ET hors de toute zone d'eau du décor (rivière, bassin). */
function dryLand(place: ActivityCtx['place']): number[] {
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
    ? { en: 'Daddy', fr: 'Papa', he: 'he', He: 'He', il: 'il', Il: 'Il', item: 'he_is' }
    : { en: 'Mummy', fr: 'Maman', he: 'she', He: 'She', il: 'elle', Il: 'Elle', item: 'she_is' };
}

/** Compter des objets touchés, puis « How many? » dès le niveau intermédiaire. */
function countSteps(ids: string[], w: { plural: string; pluralFr: string }, touch: Line, hint: Line, items: string[], wrong?: Record<string, Line>): QuestStep[] {
  const n = ids.length;
  return [
    tapProps('actor', touch.en, touch.fr, ids, hint, [...items, 'count'], { count: true, ...(wrong ? { wrong } : {}), onCorrect: L(`${num(n).en} ${w.plural}!`, `${num(n).fr} ${w.pluralFr} !`) }),
    ask('actor', `How many ${w.plural}?`, `Combien de ${w.pluralFr} ?`, numberOptions(n), ['Count again!', 'Recompte !'], [numberId(n), 'how_many'], { minTier: 'intermediate', onCorrect: L(`Yes! ${num(n).en} ${w.plural}!`, `Oui ! ${num(n).fr} ${w.pluralFr} !`) }),
  ];
}

// ---------------------------------------------------------------------------
// Jaguar — « Quiet paws » : les taches, les empreintes, marcher sans bruit, les yeux dans le noir
// ---------------------------------------------------------------------------

const J_CLIMB: CommandOption = { line: L('Climb!', 'Grimpe !'), icon: '🌳', reply: L('Up, up! Jaguars can climb trees!', 'Hop, hop ! Les jaguars savent grimper aux arbres !'), action: 'climb' };
const J_SWIM: CommandOption = { line: L('Swim!', 'Nage !'), icon: '🏊', reply: L('Splash! Jaguars love the water! I can swim!', "Plouf ! Les jaguars adorent l'eau ! Je sais nager !"), action: 'swim' };
const J_RUN: CommandOption = { line: L('Run!', 'Cours !'), icon: '🏃', reply: L("Zoom! I'm running fast!", 'Zoum ! Je cours vite !'), action: 'run' };
const J_ROAR: CommandOption = { line: L('Roar!', 'Rugis !'), icon: '🐆', reply: L('Roar! A big jaguar roar! Ha, ha!', 'Grrr ! Un gros rugissement de jaguar ! Ha, ha !'), action: 'roar' };
const J_FLY: CommandOption = { line: L('Fly!', 'Vole !'), icon: '🪽', reply: L("Fly? Ha, ha! Jaguars can't fly!", 'Voler ? Ha, ha ! Les jaguars ne savent pas voler !') };

export const jaguarQuietPaws: ActivityDef = {
  id: 'jaguar_quiet_paws',
  choices: (c) => (c.species.id === 'jaguar' && dryLand(c.place).filter((s) => c.place.spots[s]!.y >= (PLACE_DEPTH[c.place.id]?.horizonY ?? 0)).length >= 3 ? ['quiet'] : []),
  build(c, tier) {
    // des empreintes sur le sol seulement : jamais au-dessus de l'horizon (fond de forêt)
    const horizon = PLACE_DEPTH[c.place.id]?.horizonY ?? 0;
    const land = dryLand(c.place).filter((s) => c.place.spots[s]!.y >= horizon);
    if (land.length < 3) return undefined;
    const o = otherParent(c);
    const parent = c.actorKind === 'adult';
    // le marais n'a que 4 places au sec : on pose au plus une empreinte par place
    const n = Math.min(byTier(tier, 3, 4, 5), land.length);
    const prints = land.slice(0, n).map((s, i) => prop(`jag_print${i}`, 'footprint', s));
    // l'eau dessinée (rivière, marais) permet la carte « Swim! » ; sinon on court
    const wet = c.place.anchors.some((a) => a.tags?.includes('water'));
    const fourth = wet ? J_SWIM : J_RUN;
    const cards = byTier(tier, [J_CLIMB, J_FLY, fourth], [J_CLIMB, J_FLY, fourth, J_ROAR], wet ? [J_CLIMB, J_FLY, J_SWIM, J_RUN, J_ROAR] : [J_CLIMB, J_FLY, J_RUN, J_ROAR]);
    const need = byTier(tier, 2, 3, wet ? 4 : 3);
    return [
      say('actor', "I'm a jaguar! Look at my coat! I've got lots of spots!", "Je suis un jaguar ! Regarde mon pelage ! J'ai plein de taches !", {}, 'proud'),
      ask('actor', "What's on my coat?", "Qu'est-ce qu'il y a sur mon pelage ?", [ok('Spots!', 'Des taches !', '🐆'), no('Stripes!', 'Des rayures !', '🦓'), no('Feathers!', 'Des plumes !', '🪶'), no('Spikes!', 'Des piquants !', '🦔')], ['Little black circles!', 'Des petits ronds noirs !'], ['jaguar_spots'], { onCorrect: ['Yes! Spots! Black spots on my yellow coat!', 'Oui ! Des taches ! Des taches noires sur mon pelage jaune !'] }),
      say('actor', "Shh! Jaguars walk with quiet paws. Let's play quiet paws!", 'Chut ! Les jaguars marchent sans bruit. On joue aux pattes silencieuses !', {}, 'curious'),
      ask('actor', 'How do jaguars walk?', 'Comment marchent les jaguars ?', [ok('With quiet paws!', 'Sans bruit, à pas de velours !', '🤫'), no('With big, loud boots!', 'Avec des grosses bottes bruyantes !', '🥾')], ['Shh! Tiptoe, tiptoe!', 'Chut ! Sur la pointe des pattes !'], ['jaguar_quiet'], { minTier: 'intermediate', onCorrect: ['Yes! Quiet paws! Tiptoe, tiptoe…', 'Oui ! Sans bruit ! Sur la pointe des pattes…'] }),
      props(prints),
      ...countSteps(prints.map((p) => p.id), { plural: 'paw prints', pluralFr: 'empreintes' }, L('Look! My paw prints on the ground! Touch the paw prints!', 'Regarde ! Les empreintes de mes pattes par terre ! Touche les empreintes !'), L('Little paw shapes on the ground!', 'Des petites formes de pattes par terre !'), ['jaguar_paw_prints']),
      clearProps(),
      say('actor', 'Now you are the boss! Tell me what to do!', "Maintenant, c'est toi le chef ! Dis-moi quoi faire !", {}, 'happy'),
      command('actor', 'Touch a card! What do I do?', "Touche une carte ! Qu'est-ce que je fais ?", cards, need, ['climb', 'run'], { onCorrect: ['What a clever jaguar! Ha, ha!', 'Quel jaguar malin ! Ha, ha !'] }),
      say('actor', "Jaguars can see in the dark. Let's make it night!", 'Les jaguars voient dans le noir. Faisons venir la nuit !', {}, 'curious'),
      scene(true),
      props([skyProp('jag_moon', 'moon', 5), skyProp('jag_star0', 'star', 1), skyProp('jag_star1', 'star', 3)]),
      ask('actor', 'What do I see with in the dark?', "Avec quoi est-ce que je vois dans le noir ?", [ok('Your sharp eyes!', 'Tes yeux perçants !', '👀'), no('Your tail!', 'Ta queue !', '〰️'), no('Your spots!', 'Tes taches !', '🐆')], ['Look at my eyes! They shine!', 'Regarde mes yeux ! Ils brillent !'], ['jaguar_sharp_eyes', 'jaguar_in_the_dark', 'night'], { onCorrect: ['Yes! My sharp eyes see in the dark!', 'Oui ! Mes yeux perçants voient dans le noir !'] }),
      tapProps('actor', 'My sharp eyes see the moon! Touch the moon!', 'Mes yeux perçants voient la lune ! Touche la lune !', ['jag_moon'], ['The moon is big and round!', 'La lune est grande et ronde !'], ['moon', 'night'], {
        minTier: 'intermediate',
        wrong: { jag_star0: L("That's a star! Find the moon!", "Ça, c'est une étoile ! Cherche la lune !"), jag_star1: L("That's a star! Find the moon!", "Ça, c'est une étoile ! Cherche la lune !") },
        onCorrect: L('Yes! The moon! I can see it in the dark!', 'Oui ! La lune ! Je la vois dans le noir !'),
      }),
      clearProps(),
      scene(false),
      ask('actor', `Look at ${o.en}! Has ${o.he} got spots?`, `Regarde ${o.fr} ! Est-ce qu'${o.il} a des taches ?`, [ok(`Yes, ${o.he} has!`, 'Oui !', '👍'), no(`No, ${o.he} hasn't.`, 'Non.', '👎')], [`Look at ${o.en}'s coat!`, `Regarde le pelage de ${o.fr} !`], ['jaguar_spots', o.item], { minTier: 'expert', keepOrder: true, onCorrect: [`Yes! ${o.He} has got spots too!`, `Oui ! ${o.Il} a des taches, ${o.il === 'elle' ? 'elle' : 'lui'} aussi !`] }),
      ask('actor', 'Can a jaguar swim?', 'Est-ce que le jaguar sait nager ?', [ok('Yes, it can!', 'Oui !', '🏊'), no("No, it can't.", 'Non.', '🙅')], ['Jaguars love the water!', "Les jaguars adorent l'eau !"], ['can', 'swim'], { minTier: 'expert', keepOrder: true, onCorrect: ['Yes! A jaguar can swim! Splash!', 'Oui ! Le jaguar sait nager ! Plouf !'] }),
      ask('actor', 'Can a jaguar fly?', 'Est-ce que le jaguar sait voler ?', [ok("No, it can't!", 'Non !', '🙅'), no('Yes, it can!', 'Oui !', '🪽')], ['I have got paws, not wings!', "J'ai des pattes, pas des ailes !"], ['cant', 'fly'], { minTier: 'expert', onCorrect: ["That's right! I can't fly, but I can climb!", "C'est ça ! Je ne sais pas voler, mais je sais grimper !"] }),
      act('actor', 'climb', parent ? 'Shh… quiet paws. Now I rest on a branch!' : 'Shh… quiet paws. Now I nap on a branch!', parent ? 'Chut… sans bruit. Maintenant je me repose sur une branche !' : 'Chut… sans bruit. Maintenant je fais la sieste sur une branche !', 'actor'),
      end('actor', 'Thank you! You walk with quiet paws, like a jaguar!', 'Merci ! Tu marches sans bruit, comme un jaguar !'),
    ];
  },
  memoryEvent: () => 'jaguar_quiet_paws',
};

// ---------------------------------------------------------------------------
// Toucan — « My big beak » : le grand bec coloré, lancer et rattraper les fruits, le trou dans l'arbre
// ---------------------------------------------------------------------------

const T_FLY: CommandOption = { line: L('Fly!', 'Vole !'), icon: '🪽', reply: L('Flap, flap! I fly with my wings!', 'Flap, flap ! Je vole avec mes ailes !'), action: 'fly' };
const T_HOP: CommandOption = { line: L('Hop!', 'Sautille !'), icon: '🐦', reply: L('Hop, hop, hop on the branch!', 'Hop, hop, hop sur la branche !'), action: 'hop' };
const T_TOSS: CommandOption = { line: L('Toss and catch!', 'Lance et rattrape !'), icon: '🤹', reply: L('Toss… and catch! I catch the berry in my beak!', 'Je lance… et je rattrape ! J’attrape la baie avec mon bec !'), action: 'eat' };
const T_SWIM: CommandOption = { line: L('Swim!', 'Nage !'), icon: '🏊', reply: L("Swim? Oh no! Toucans can't swim!", 'Nager ? Oh non ! Les toucans ne savent pas nager !') };
const T_RUN: CommandOption = { line: L('Run!', 'Cours !'), icon: '🏃', reply: L("Run? No, I can't run! I hop!", 'Courir ? Non, je ne sais pas courir ! Je sautille !') };

export const toucanBigBeak: ActivityDef = {
  id: 'toucan_big_beak',
  choices: (c) => (c.species.id === 'toucan' && dryLand(c.place).length >= 5 ? ['beak'] : []),
  build(c, tier) {
    const land = dryLand(c.place);
    if (land.length < 5) return undefined;
    const o = otherParent(c);
    const parent = c.actorKind === 'adult';
    // des fruits (baies, bananes) et des intrus que le toucan ne mange pas (poisson, viande)
    const meal = byTier(
      tier,
      [prop('tou_berries0', 'berries', land[0]!), prop('tou_banana0', 'banana', land[2]!), prop('tou_fish', 'fish', land[1]!)],
      [prop('tou_berries0', 'berries', land[0]!), prop('tou_banana0', 'banana', land[2]!), prop('tou_fish', 'fish', land[1]!), prop('tou_berries1', 'berries', land[4]!)],
      [prop('tou_berries0', 'berries', land[0]!), prop('tou_banana0', 'banana', land[2]!), prop('tou_fish', 'fish', land[1]!), prop('tou_berries1', 'berries', land[4]!), prop('tou_meat', 'meat', land[3]!)],
    );
    const good = meal.filter((p) => p.prop === 'berries' || p.prop === 'banana').map((p) => p.id);
    const wrongFood = (what: Line): Line => L(`No, I don't eat ${what.en}! I eat fruit!`, `Non, je ne mange pas ${what.fr} ! Je mange des fruits !`);
    const wrong: Record<string, Line> = { tou_fish: wrongFood(L('fish', 'de poisson')) };
    if (meal.some((p) => p.id === 'tou_meat')) wrong.tou_meat = wrongFood(L('meat', 'de viande'));
    const cards = byTier(tier, [T_FLY, T_SWIM, T_HOP], [T_FLY, T_SWIM, T_HOP, T_TOSS], [T_FLY, T_SWIM, T_HOP, T_RUN, T_TOSS]);
    const need = byTier(tier, 2, 3, 3);
    return [
      say('actor', "Hello! I'm a toucan! Look at my big, colourful beak!", "Coucou ! Je suis un toucan ! Regarde mon grand bec plein de couleurs !", {}, 'proud'),
      ask('actor', "What have I got? It's big and colourful!", "Qu'est-ce que j'ai ? C'est grand et plein de couleurs !", [ok('A big beak!', 'Un grand bec !', '🦜'), no('A long trunk!', 'Une longue trompe !', '🐘'), no('Spikes!', 'Des piquants !', '🦔'), no('A pouch!', 'Une poche !', '👝')], ['Look at my face!', 'Regarde ma tête !'], ['toucan_beak'], { onCorrect: ['Yes! A big beak! It is very light!', 'Oui ! Un grand bec ! Il est très léger !'] }),
      ask('actor', 'Is my beak colourful?', 'Est-ce que mon bec est plein de couleurs ?', [ok('Yes, it is!', 'Oui !', '🌈'), no("No, it isn't.", 'Non.', '⚫')], ['Look at all the colours!', 'Regarde toutes les couleurs !'], ['toucan_colourful'], { minTier: 'intermediate', keepOrder: true, onCorrect: ['Yes! My beak is colourful, like a rainbow!', 'Oui ! Mon bec est plein de couleurs, comme un arc-en-ciel !'] }),
      props(meal),
      tapProps('actor', "I'm hungry! I eat fruit. Find the berries and the bananas!", "J'ai faim ! Je mange des fruits. Trouve les baies et les bananes !", good, ['Berries are little and blue. Bananas are yellow!', 'Les baies sont petites et bleues. Les bananes sont jaunes !'], ['berries', 'banana', 'hungry'], { count: true, wrong, onCorrect: L('Yes! Yummy fruit!', 'Oui ! Des bons fruits !') }),
      act('actor', 'eat', 'Watch! I toss the berry up… and catch it in my beak! Yum!', 'Regarde ! Je lance la baie en l’air… et je l’attrape avec mon bec ! Miam !', 'actor'),
      clearProps(),
      ask('actor', 'What do I do with my fruit?', "Qu'est-ce que je fais avec mon fruit ?", [ok('You toss and catch it!', 'Tu le lances et tu le rattrapes !', '🤹'), no('You dig a hole!', 'Tu creuses un trou !', '🕳️'), no('You swim with it!', 'Tu nages avec !', '🏊')], ['Up… and in my beak!', 'En l’air… et dans mon bec !'], ['toucan_toss'], { minTier: 'intermediate', onCorrect: ['Yes! Toss and catch! What a game!', 'Oui ! Je lance et je rattrape ! Quel jeu !'] }),
      say('actor', "Let's play! You are the boss! Tell me what to do!", 'On joue ! Tu es le chef ! Dis-moi quoi faire !', {}, 'happy'),
      command('actor', 'Touch a card! What do I do?', "Touche une carte ! Qu'est-ce que je fais ?", cards, need, ['fly', 'hop'], { onCorrect: ['What a happy toucan! Ha, ha!', 'Quel toucan joyeux ! Ha, ha !'] }),
      ask('actor', 'What do I fly with?', 'Avec quoi est-ce que je vole ?', [ok('Your wings!', 'Tes ailes !', '🪽'), no('Your beak!', 'Ton bec !', '🦜'), no('Your feet!', 'Tes pattes !', '🐾')], ['Flap, flap!', 'Flap, flap !'], ['toucan_wings', 'fly'], { onCorrect: ['Yes! My wings! Flap, flap!', 'Oui ! Mes ailes ! Flap, flap !'] }),
      ask('actor', 'Where do toucans sleep?', 'Où dorment les toucans ?', [ok('In a hole in a tree!', 'Dans un trou dans un arbre !', '🕳️'), no('In the water!', "Dans l'eau !", '💧'), no('In the snow!', 'Dans la neige !', '❄️')], ['Up in the tree!', "En haut dans l'arbre !"], ['toucan_tree_hole', 'where'], { onCorrect: [parent ? 'Yes! Our nest is in a hole in a tree!' : 'Yes! I sleep in a hole in a tree!', parent ? 'Oui ! Notre nid est dans un trou dans un arbre !' : 'Oui ! Je dors dans un trou dans un arbre !'] }),
      ask('actor', `Look at ${o.en}! Has ${o.he} got a big beak?`, `Regarde ${o.fr} ! Est-ce qu'${o.il} a un grand bec ?`, [ok(`Yes, ${o.he} has!`, 'Oui !', '👍'), no(`No, ${o.he} hasn't.`, 'Non.', '👎')], [`Look at ${o.en}'s face!`, `Regarde la tête de ${o.fr} !`], ['toucan_beak', o.item], { minTier: 'expert', keepOrder: true, onCorrect: [`Yes! ${o.He} has got a big beak too!`, `Oui ! ${o.Il} a un grand bec, ${o.il === 'elle' ? 'elle' : 'lui'} aussi !`] }),
      ask('actor', 'Can a toucan swim?', 'Est-ce que le toucan sait nager ?', [ok("No, it can't!", 'Non !', '🙅'), no('Yes, it can!', 'Oui !', '🏊')], ['Toucans fly, they don’t swim!', 'Les toucans volent, ils ne nagent pas !'], ['cant', 'swim'], { minTier: 'expert', onCorrect: ["That's right! I can't swim, but I can fly!", "C'est ça ! Je ne sais pas nager, mais je sais voler !"] }),
      act('actor', 'fly', 'Whoosh! I fly over the rainforest!', 'Whoosh ! Je vole au-dessus de la forêt !', 'actor'),
      end('actor', 'Thank you! I love my big, colourful beak!', "Merci ! J'adore mon grand bec plein de couleurs !"),
    ];
  },
  memoryEvent: () => 'toucan_big_beak',
};

// ---------------------------------------------------------------------------
// Paresseux — « Slow, slow sloth » : très lent, les longues griffes, la tête en bas, les feuilles, dormir
// ---------------------------------------------------------------------------

const S_CLIMB: CommandOption = { line: L('Climb!', 'Grimpe !'), icon: '🌳', reply: L('Slowly… slowly… I climb up the tree!', 'Doucement… doucement… je grimpe dans l’arbre !'), action: 'climb' };
const S_SLEEP: CommandOption = { line: L('Sleep!', 'Dors !'), icon: '😴', reply: L('Yawn… Sloths sleep a lot!', 'Bâille… Les paresseux dorment beaucoup !'), action: 'sleep' };
const S_EAT: CommandOption = { line: L('Eat!', 'Mange !'), icon: '🍃', reply: L('Munch… munch… a leaf… slowly!', 'Miam… miam… une feuille… doucement !'), action: 'eat' };
const S_RUN: CommandOption = { line: L('Run!', 'Cours !'), icon: '🏃', reply: L("Run? Oh no… I can't run! I'm very slow!", 'Courir ? Oh non… je ne sais pas courir ! Je suis très lent !') };
const S_JUMP: CommandOption = { line: L('Jump!', 'Saute !'), icon: '🦘', reply: L("Jump? Ha, ha… sloths can't jump!", 'Sauter ? Ha, ha… les paresseux ne savent pas sauter !') };

export const slothSlowSlow: ActivityDef = {
  id: 'sloth_slow_slow',
  choices: (c) => (c.species.id === 'sloth' && dryLand(c.place).length >= 3 ? ['slow'] : []),
  build(c, tier) {
    const land = dryLand(c.place);
    if (land.length < 3) return undefined;
    const o = otherParent(c);
    // la cascade et le marais n'ont que 4 places au sec : il en reste toujours une pour le poisson
    const n = Math.min(byTier(tier, 2, 3, 4), land.length - 1);
    // des feuilles à manger, et un intrus (poisson) que le paresseux ne mange pas
    const leaves = land.slice(0, n).map((s, i) => prop(`slo_leaf${i}`, 'leaves', s));
    const fish = prop('slo_fish', 'fish', land[n]!);
    const cards = byTier(tier, [S_CLIMB, S_RUN, S_SLEEP], [S_CLIMB, S_RUN, S_SLEEP, S_JUMP], [S_CLIMB, S_RUN, S_SLEEP, S_JUMP, S_EAT]);
    const need = byTier(tier, 2, 2, 3);
    return [
      say('actor', "Hello… I'm a sloth… I'm very… very… slow!", 'Coucou… je suis un paresseux… je suis très… très… lent !', {}, 'calm'),
      ask('actor', 'Am I fast or slow?', 'Je suis rapide ou lent ?', [ok('Very slow!', 'Très lent !', '🦥'), no('Very fast!', 'Très rapide !', '⚡')], ['Look… how… slow… I am!', 'Regarde… comme… je suis… lent !'], ['sloth_very_slow'], { onCorrect: ['Yes… very… slow! Ha, ha!', 'Oui… très… lent ! Ha, ha !'] }),
      ask('actor', "What have I got? They are long and they curve!", "Qu'est-ce que j'ai ? Elles sont longues et courbes !", [ok('Long claws!', 'De longues griffes !', '🦥'), no('A big beak!', 'Un grand bec !', '🦜'), no('Spikes!', 'Des piquants !', '🦔'), no('Wings!', 'Des ailes !', '🪽')], ['Look at my hands!', 'Regarde mes mains !'], ['sloth_claws'], { onCorrect: ['Yes! Long claws! I hold on to the branch!', 'Oui ! De longues griffes ! Je m’accroche à la branche !'] }),
      act('actor', 'climb', 'Look! I hang upside down from a branch!', 'Regarde ! Je me suspends la tête en bas à une branche !', 'actor'),
      ask('actor', 'How do I hang in the tree?', "Comment est-ce que je me suspends dans l'arbre ?", [ok('Upside down!', 'La tête en bas !', '🙃'), no('On my nose!', 'Sur mon nez !', '👃'), no('On my tail!', 'Sur ma queue !', '〰️')], ['My head is down… my feet are up!', 'Ma tête est en bas… mes pattes en haut !'], ['sloth_hang', 'sloth_upside_down'], { minTier: 'intermediate', onCorrect: ['Yes! I hang upside down! Hello, world!', 'Oui ! Je me suspends la tête en bas ! Coucou le monde !'] }),
      say('actor', "I'm hungry… I eat leaves… Let's find them… slowly!", "J'ai faim… je mange des feuilles… cherchons-les… doucement !", {}, 'curious'),
      props([...leaves, fish]),
      ...countSteps(leaves.map((l) => l.id), { plural: 'leaves', pluralFr: 'feuilles' }, L('Touch the leaves… slowly!', 'Touche les feuilles… doucement !'), L('Green leaves! Yum!', 'Des feuilles vertes ! Miam !'), ['leaves', 'hungry'], {
        slo_fish: L("No, that's a fish! I don't eat fish! I eat leaves!", "Non, ça c'est un poisson ! Je ne mange pas de poisson ! Je mange des feuilles !"),
      }),
      act('actor', 'eat', 'Munch… munch… I eat leaves… very slowly!', 'Miam… miam… je mange des feuilles… très doucement !', 'actor'),
      clearProps(),
      say('actor', "Let's play! You are the boss! Tell me what to do!", 'On joue ! Tu es le chef ! Dis-moi quoi faire !', {}, 'happy'),
      command('actor', 'Touch a card! What do I do?', "Touche une carte ! Qu'est-ce que je fais ?", cards, need, ['climb', 'sleep'], { onCorrect: ['What a slow, slow sloth! Ha, ha!', 'Quel paresseux tout lent ! Ha, ha !'] }),
      ask('actor', 'Sloths sleep a lot! What do sloths do a lot?', 'Les paresseux dorment beaucoup ! Que font beaucoup les paresseux ?', [ok('They sleep!', 'Ils dorment !', '😴'), no('They run!', 'Ils courent !', '🏃'), no('They fly!', 'Ils volent !', '🪽')], ['Yawn… zzz…', 'Bâille… zzz…'], ['sloth_sleep_a_lot', 'sleep'], { minTier: 'intermediate', onCorrect: ['Yes! We sleep a lot! Zzz…', 'Oui ! On dort beaucoup ! Zzz…'] }),
      ask('actor', `Look at ${o.en}! Is ${o.he} slow?`, `Regarde ${o.fr} ! Est-ce qu'${o.il} est lent${o.il === 'elle' ? 'e' : ''} ?`, [ok(`Yes, ${o.he} is!`, 'Oui !', '👍'), no(`No, ${o.he} isn't.`, 'Non.', '👎')], [`Look at ${o.en}! Very… slow!`, `Regarde ${o.fr} ! Très… lent${o.il === 'elle' ? 'e' : ''} !`], ['sloth_very_slow', o.item], { minTier: 'expert', keepOrder: true, onCorrect: [`Yes! ${o.He} is very slow too!`, `Oui ! ${o.Il} est très lent${o.il === 'elle' ? 'e' : ''}, ${o.il === 'elle' ? 'elle' : 'lui'} aussi !`] }),
      ask('actor', 'Can a sloth swim?', 'Est-ce que le paresseux sait nager ?', [ok('Yes, it can!', 'Oui !', '🏊'), no("No, it can't.", 'Non.', '🙅')], ['Sloths are good swimmers!', 'Les paresseux nagent bien !'], ['can', 'swim'], { minTier: 'expert', keepOrder: true, onCorrect: ['Yes! A sloth can swim! Slowly, slowly!', 'Oui ! Le paresseux sait nager ! Doucement, doucement !'] }),
      ask('actor', 'Can a sloth run?', 'Est-ce que le paresseux sait courir ?', [ok("No, it can't!", 'Non !', '🙅'), no('Yes, it can!', 'Oui !', '🏃')], ['I am very slow!', 'Je suis très lent !'], ['cant', 'run'], { minTier: 'expert', onCorrect: ["That's right! I can't run, but I can hang upside down!", "C'est ça ! Je ne sais pas courir, mais je sais me suspendre la tête en bas !"] }),
      act('actor', 'sleep', 'Yawn… Time for a long, long nap…', 'Bâille… C’est l’heure d’une longue, longue sieste…', 'actor'),
      end('actor', 'Thank you… for being slow… with me!', 'Merci… de prendre ton temps… avec moi !'),
    ];
  },
  memoryEvent: () => 'sloth_slow_slow',
};

/** Déroulé des jeux propres aux espèces de ce continent (voir `south_america.arch.ts`). */
export const SOUTH_AMERICA_SPECIES_ACTIVITIES: readonly ActivityDef[] = [jaguarQuietPaws, toucanBigBeak, slothSlowSlow];
