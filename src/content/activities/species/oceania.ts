/**
 * Jeux propres aux espèces d'Océanie (demande du parent du 2026-11-21 : « chaque personnage a son
 * propre jeu avec son propre vocabulaire »). Fiches dans `oceania.arch.ts`.
 *
 * - Kangourou, « Hop like a kangaroo! » : la poche (pouch) de Maman, le joey qui y dort, les
 *   grands pieds (big feet), la queue solide (strong tail) ; on saute d'empreinte en empreinte.
 * - Koala, « The sleepy koala » : toucher son arbre (eucalyptus, sinon gum tree, sinon tree), le
 *   câlin (hug), les feuilles d'eucalyptus (rien d'autre !), les oreilles toutes douces (fluffy
 *   ears), le nez, les griffes (claws), la sieste (sleepy).
 * - Lézard à collerette, « Open your frill! » : la collerette orange (frill), « Hsss! » (hiss),
 *   se chauffer sur le rocher (warm), les insectes, courir sur deux pattes (two legs), la longue queue.
 *
 * Chaque jeu marche dans tous les décors de son espèce ; aucun objet n'est posé dans l'eau
 * (emplacements de `landSpots`). Pas de prédation montrée, nourriture réelle de l'espèce.
 */
import type { ActivityCtx, ActivityDef, CommandOption, Line, QuestStep, Tier } from '../../types';
import { ORDERS } from '../africa';
import { numberId, numberOptions } from '../games';
import { NUMBERS } from '../../props';
import { act, anchor, ask, back, clearProps, command, end, hash, L, landSpots, moveTo, no, ok, prop, props, say, tap, tapActor, tapProps } from '../kit';

const byTier = <T>(tier: Tier, b: T, i: T, e: T): T => (tier === 'beginner' ? b : tier === 'intermediate' ? i : e);
const num = (n: number) => NUMBERS[n]!;

/** n emplacements hors de l'eau, dans un ordre stable propre à la graine. */
function dry(c: ActivityCtx, n: number, seed: string): number[] {
  const all = landSpots(c.place);
  if (all.length < n) return [];
  const start = hash(`${seed}:${c.place.id}`) % all.length;
  return [...all.slice(start), ...all.slice(0, start)].slice(0, n);
}

/** Ordre drôle : l'animal ne sait pas le faire (pas d'animation, pas d'erreur). */
const funny = (en: string, fr: string, icon: string, reply: Line): CommandOption => ({ line: L(en, fr), icon, reply });

// ---------------------------------------------------------------------------
// Kangourou — « Hop like a kangaroo! »
// ---------------------------------------------------------------------------

export const kangarooHop: ActivityDef = {
  id: 'kangaroo_hop',
  choices: (c) => (c.species.id === 'kangaroo' && landSpots(c.place).length >= 5 ? ['hop'] : []),
  build(c, tier) {
    const n = byTier(tier, 3, 4, 5);
    // les empreintes de gauche à droite : on « saute » de l'une à l'autre
    const spots = dry(c, n, 'kangaroo_hop').sort((a, b) => c.place.spots[a]!.x - c.place.spots[b]!.x);
    if (spots.length < n) return undefined;
    const prints = spots.map((s, i) => prop(`hop${i}`, 'footprint', s));
    const steps: QuestStep[] = [
      say('actor', "We are kangaroos! We don't walk, we hop! Hop, hop, hop!", 'Nous sommes des kangourous ! On ne marche pas, on saute ! Hop, hop, hop !', {}, 'happy'),
      act('actor', 'hop', 'Hop! Hop! Look at my big feet!', 'Hop ! Hop ! Regarde mes grands pieds !'),
      ask('actor', 'Look at my feet! Are they big or small?', 'Regarde mes pieds ! Ils sont grands ou petits ?', [ok("They're big feet!", 'Ce sont de grands pieds !', '🦶'), no("They're small feet!", 'Ce sont de petits pieds !', '🐾')], ['Big feet for big hops!', 'De grands pieds pour de grands sauts !'], ['kangaroo_feet', 'big'], { keepOrder: true, onCorrect: ['Yes! Big feet! Boing, boing!', 'Oui ! De grands pieds ! Boing, boing !'] }),
      // la poche : seule Maman en a une (les mâles n'ont pas de poche)
      tapActor('narrator', L('Mummy has a pouch! Touch Mummy!', 'Maman a une poche ! Touche Maman !'), 'mother', 'wave', L('Yes! Look! This is my pouch!', 'Oui ! Regarde ! Voici ma poche !'), L("Not me! I haven't got a pouch!", "Pas moi ! Je n'ai pas de poche !"), L('Mummy has a pouch on her tummy!', 'Maman a une poche sur son ventre !'), ['kangaroo_pouch', 'mum']),
      ask('mother', 'My baby is a joey. Where does my joey sleep?', 'Mon bébé est un joey. Où dort mon joey ?', [ok('In your pouch!', 'Dans ta poche !', '👝'), no('In the water!', "Dans l'eau !", '💧'), no('In the sky!', 'Dans le ciel !', '☁️'), no('In a nest!', 'Dans un nid !', '🪺')], ['It is warm and soft…', "C'est chaud et tout doux…"], ['kangaroo_joey', 'kangaroo_pouch'], { onCorrect: ['Yes! My joey sleeps in my pouch! Warm and cosy!', 'Oui ! Mon joey dort dans ma poche ! Au chaud, bien au calme !'] }),
      tapActor('narrator', L('Where is the joey? Touch the joey!', 'Où est le joey ? Touche le joey !'), 'baby', 'hop', L("That's me! I'm a joey! Hop!", "C'est moi ! Je suis un joey ! Hop !"), L("I'm not a joey! I'm a big kangaroo!", 'Je ne suis pas un joey ! Je suis un grand kangourou !'), L('The joey is the baby!', 'Le joey, c’est le bébé !'), ['kangaroo_joey', 'baby'], { needs: 'baby' }),
      say('actor', "Look! Kangaroo footprints! Let's hop on them!", 'Regarde ! Des empreintes de kangourou ! Sautons dessus !', {}, 'curious'),
      props(prints),
      tapProps('actor', 'Hop, hop! Touch the footprints, one by one!', 'Hop, hop ! Touche les empreintes, une par une !', prints.map((p) => p.id), ['Start with the first footprint!', 'Commence par la première empreinte !'], ['footprints', 'hop', 'count'], { ordered: true, onCorrect: L(`${num(n).en} hops! Well done!`, `${num(n).fr} sauts ! Bravo !`) }),
      ask('actor', 'How many hops?', 'Combien de sauts ?', numberOptions(n), ['Count the footprints!', 'Compte les empreintes !'], [numberId(n), 'how_many'], { minTier: 'intermediate', onCorrect: L(`Yes! ${num(n).en} hops!`, `Oui ! ${num(n).fr} sauts !`) }),
      clearProps(),
      // la queue : intermédiaire et plus
      ask('actor', 'I sit on my tail! Is my tail strong?', 'Je m’assois sur ma queue ! Est-ce que ma queue est solide ?', [ok('Yes! A strong tail!', 'Oui ! Une queue solide !', '💪'), no('No! A small tail!', 'Non ! Une petite queue !', '🤏')], ['It is long and strong!', 'Elle est longue et solide !'], ['kangaroo_tail', 'long'], { minTier: 'intermediate', keepOrder: true, onCorrect: ['Yes! My tail is long and strong!', 'Oui ! Ma queue est longue et solide !'] }),
      // expert : he / she, has got / hasn't got
      ask('mother', 'Has Daddy got a pouch?', 'Est-ce que Papa a une poche ?', [ok("No, he hasn't!", "Non, il n'en a pas !", '👎'), no('Yes, he has!', 'Oui, il en a une !', '👍')], ['Only Mummy has a pouch!', 'Seule Maman a une poche !'], ['kangaroo_pouch', 'dad'], { minTier: 'expert', keepOrder: true, onCorrect: ["That's right! Daddy hasn't got a pouch. I've got a pouch!", "C'est ça ! Papa n'a pas de poche. Moi, j'ai une poche !"] }),
      command('actor', 'Now you are the boss! What can I do?', 'Maintenant, c’est toi le chef ! Qu’est-ce que je sais faire ?', [
        { line: L('Hop!', 'Sautille !'), icon: '🦘', reply: L("Hop, hop! I'm hopping!", 'Hop, hop ! Je sautille !'), action: 'hop' },
        ORDERS.jump,
        ORDERS.run,
        funny('Climb!', 'Grimpe !', '🧗', L("Climb? Oh no! Kangaroos can't climb trees!", 'Grimper ? Oh non ! Les kangourous ne savent pas grimper aux arbres !')),
        funny('Fly!', 'Vole !', '🪽', L("Fly? Ha, ha! I can't fly! I hop!", 'Voler ? Ha, ha ! Je ne sais pas voler ! Je saute !')),
      ], byTier(tier, 1, 2, 3), ['hop', 'jump', 'run', 'can', 'cant'], { onCorrect: ['You are a great boss!', 'Tu es un super chef !'] }),
      end('actor', 'Hop, hop, hooray! You hop like a kangaroo!', 'Hop, hop, hourra ! Tu sautes comme un kangourou !'),
    ];
    return steps;
  },
  memoryEvent: () => 'kangaroo_hops',
};

// ---------------------------------------------------------------------------
// Koala — « The sleepy koala »
// ---------------------------------------------------------------------------

/** L'arbre du koala dans ce décor : l'eucalyptus s'il est dessiné, sinon le gum tree, sinon l'arbre. */
function koalaTree(c: ActivityCtx) {
  return anchor(c.place, 'eucalyptus') ?? anchor(c.place, 'gum_tree') ?? anchor(c.place, 'tree');
}

export const koalaSleepy: ActivityDef = {
  id: 'koala_sleepy',
  choices: (c) => (c.species.id === 'koala' && koalaTree(c) && landSpots(c.place).length >= 5 ? ['tree'] : []),
  build(c, tier) {
    const tree = koalaTree(c);
    if (!tree) return undefined;
    const nLeaves = byTier(tier, 2, 3, 3);
    const spots = dry(c, nLeaves + byTier(tier, 1, 2, 2), 'koala_sleepy');
    if (!spots.length) return undefined;
    const leaves = spots.slice(0, nLeaves).map((s, i) => prop(`leaf${i}`, 'eucalyptus', s));
    const odd = [prop('bamboo', 'bamboo', spots[nLeaves]!), ...(tier === 'beginner' ? [] : [prop('banana', 'banana', spots[nLeaves + 1]!)])];
    const w = tree.word;
    const steps: QuestStep[] = [
      say('actor', "Yawn! I'm a koala. I'm so sleepy! I sleep in my tree all day!", 'Je bâille ! Je suis un koala. J’ai tellement sommeil ! Je dors dans mon arbre toute la journée !', {}, 'calm'),
      tap('actor', `Where is my tree? Touch the ${w}!`, `Où est mon arbre ? Touche ${tree.wordFr} !`, tree.id, [`Find the ${w}!`, `Cherche ${tree.wordFr} !`], [w, 'where'], { onCorrect: ['Yes! My tree! I give it a big hug!', 'Oui ! Mon arbre ! Je lui fais un gros câlin !'] }),
      act('actor', 'climb', 'Up I go! Hug, hug! I hug my tree!', 'Je monte ! Câlin, câlin ! Je fais un câlin à mon arbre !'),
      ask('actor', 'How do I hold my tree? With my claws or with my nose?', 'Comment je tiens mon arbre ? Avec mes griffes ou avec mon nez ?', [ok('With your claws!', 'Avec tes griffes !', '🐾'), no('With your nose!', 'Avec ton nez !', '👃')], ['Sharp claws for climbing!', 'Des griffes pointues pour grimper !'], ['koala_claws', 'koala_hug'], { minTier: 'intermediate', keepOrder: true, onCorrect: ['Yes! My claws hold the tree. Hug!', 'Oui ! Mes griffes tiennent l’arbre. Câlin !'] }),
      say('actor', 'I eat eucalyptus leaves. Only eucalyptus leaves!', "Je mange des feuilles d'eucalyptus. Seulement des feuilles d'eucalyptus !", {}, 'happy'),
      props([...leaves, ...odd]),
      tapProps('actor', "I'm hungry! Find the eucalyptus leaves!", "J'ai faim ! Trouve les feuilles d'eucalyptus !", leaves.map((l) => l.id), ['The green leaves!', 'Les feuilles vertes !'], ['eucalyptus leaf', 'hungry', 'count'], {
        count: true,
        wrong: {
          bamboo: L('No, thank you! Pandas eat bamboo. I eat eucalyptus leaves!', "Non merci ! Les pandas mangent du bambou. Moi, je mange des feuilles d'eucalyptus !"),
          ...(tier === 'beginner' ? {} : { banana: L("No, thank you! I don't eat bananas!", 'Non merci ! Je ne mange pas de bananes !') }),
        },
        onCorrect: L(`${num(nLeaves).en} eucalyptus leaves! Yum!`, `${num(nLeaves).fr} feuilles d'eucalyptus ! Miam !`),
      }),
      ask('actor', 'How many eucalyptus leaves?', "Combien de feuilles d'eucalyptus ?", numberOptions(nLeaves), ['Count the green leaves!', 'Compte les feuilles vertes !'], [numberId(nLeaves), 'how_many'], { minTier: 'intermediate', onCorrect: L(`Yes! ${num(nLeaves).en} leaves!`, `Oui ! ${num(nLeaves).fr} feuilles !`) }),
      act('actor', 'eat', 'Munch, munch! I love eucalyptus leaves!', "Miam, miam ! J'adore les feuilles d'eucalyptus !"),
      clearProps(),
      ask('actor', 'Look at me! What is fluffy?', "Regarde-moi ! Qu'est-ce qui est tout doux ?", [ok('Your ears!', 'Tes oreilles !', '👂'), no('Your nose!', 'Ton nez !', '👃'), no('Your claws!', 'Tes griffes !', '🐾')], ['Big, round, fluffy ears!', 'De grandes oreilles rondes et toutes douces !'], ['koala_ears', 'koala_nose'], { onCorrect: ['Yes! I have fluffy ears! Soft, soft!', 'Oui ! J’ai des oreilles toutes douces ! Doux, doux !'] }),
      ask('actor', 'And my nose? Is it big or small?', 'Et mon nez ? Il est gros ou petit ?', [ok("It's big!", 'Il est gros !', '👃'), no("It's small!", 'Il est petit !', '🤏')], ['A big black nose!', 'Un gros nez noir !'], ['koala_nose', 'big'], { minTier: 'intermediate', keepOrder: true, onCorrect: ['Yes! A big black nose! Sniff, sniff!', 'Oui ! Un gros nez noir ! Snif, snif !'] }),
      // expert : he / she + verbe en -ing
      act('father', 'sleep', 'Zzz… Zzz…', 'Zzz… Zzz…', 'father', { minTier: 'expert' }),
      ask('actor', 'Shh! Look at Daddy! What is he doing?', 'Chut ! Regarde Papa ! Qu’est-ce qu’il fait ?', [ok("He's sleeping!", 'Il dort !', '😴'), no("He's swimming!", 'Il nage !', '🏊'), no("He's flying!", 'Il vole !', '🪽')], ['Zzz… He is sleepy!', 'Zzz… Il a sommeil !'], ['sleep', 'dad', 'doing'], { minTier: 'expert', onCorrect: ["Yes! He's sleeping! Koalas sleep a lot!", 'Oui ! Il dort ! Les koalas dorment beaucoup !'] }),
      say('actor', "Yawn… I'm sleepy again. Good night!", 'Je bâille… J’ai encore sommeil. Bonne nuit !', {}, 'calm'),
      act('actor', 'sleep', 'Zzz… A sleepy koala in a eucalyptus tree…', "Zzz… Un koala endormi dans un eucalyptus…"),
      end('actor', 'Thank you for the hug and the leaves! I love you!', "Merci pour le câlin et les feuilles ! Je t'aime !"),
    ];
    return steps;
  },
  memoryEvent: () => 'koala_hug',
};

// ---------------------------------------------------------------------------
// Lézard à collerette — « Open your frill! »
// ---------------------------------------------------------------------------

export const lizardFrill: ActivityDef = {
  id: 'lizard_frill',
  choices: (c) => (c.species.id === 'frilled_lizard' && anchor(c.place, 'rock')?.stand && landSpots(c.place).length >= 5 ? ['frill'] : []),
  build(c, tier) {
    const nBugs = byTier(tier, 2, 3, 4);
    const spots = dry(c, nBugs + byTier(tier, 1, 2, 2), 'lizard_frill');
    if (!spots.length) return undefined;
    const bugs = spots.slice(0, nBugs).map((s, i) => prop(`bug${i}`, 'bug', s));
    const odd = [prop('banana', 'banana', spots[nBugs]!), ...(tier === 'beginner' ? [] : [prop('leaf', 'leaves', spots[nBugs + 1]!)])];
    const steps: QuestStep[] = [
      say('actor', "Hello! I'm a frilled lizard! Look at my frill!", 'Bonjour ! Je suis un lézard à collerette ! Regarde ma collerette !', {}, 'proud'),
      ask('actor', 'What colour is my frill?', 'De quelle couleur est ma collerette ?', [ok("It's orange!", 'Elle est orange !', '🟠'), no("It's blue!", 'Elle est bleue !', '🔵'), no("It's purple!", 'Elle est violette !', '🟣'), no("It's white!", 'Elle est blanche !', '⚪')], ['Look at my big frill!', 'Regarde ma grande collerette !'], ['lizard_frill', 'orange'], { onCorrect: ['Yes! An orange frill! So beautiful!', 'Oui ! Une collerette orange ! Trop belle !'] }),
      tapActor('narrator', L('Mummy, open your frill! Touch Mummy!', 'Maman, ouvre ta collerette ! Touche Maman !'), 'mother', 'dance', L('Whoosh! I open my big frill! Hsss!', 'Whoush ! J’ouvre ma grande collerette ! Hsss !'), L("I'm not Mummy! Find Mummy!", 'Je ne suis pas Maman ! Trouve Maman !'), L('Touch Mummy!', 'Touche Maman !'), ['lizard_frill', 'mum']),
      ask('actor', 'I open my frill and I say…?', 'J’ouvre ma collerette et je dis… ?', [ok('Hsss!', 'Hsss !', '🦎'), no('Woof!', 'Ouaf !', '🐶'), no('Moo!', 'Meuh !', '🐮'), no('Tweet!', 'Cui-cui !', '🐦')], ['Lizards hiss!', 'Les lézards sifflent !'], ['lizard_hiss'], { onCorrect: ['Yes! Hsss! I hiss! Hsss!', 'Oui ! Hsss ! Je siffle ! Hsss !'] }),
      tap('actor', "Brr! I'm a little cold. I need the sun! Touch the rock!", "Brr ! J'ai un peu froid. J'ai besoin du soleil ! Touche le rocher !", 'rock', ['The rock is in the sun!', 'Le rocher est au soleil !'], ['rock', 'lizard_warm'], { onCorrect: ['Yes! The rock is warm!', 'Oui ! Le rocher est chaud !'] }),
      moveTo('rock', 'rest'),
      say('actor', 'Ahh! I lie on the warm rock. Warm in the sun!', 'Ahh ! Je me couche sur le rocher chaud. Au chaud, au soleil !', {}, 'calm'),
      ask('actor', 'Where am I? On the rock or under the rock?', 'Où suis-je ? Sur le rocher ou sous le rocher ?', [ok("You're on the rock!", 'Tu es sur le rocher !', '⬆️'), no("You're under the rock!", 'Tu es sous le rocher !', '⬇️')], ['I lie in the sun!', 'Je suis couché au soleil !'], ['rock', 'where'], { minTier: 'intermediate', keepOrder: true, onCorrect: ["Yes! I'm on the rock, warm in the sun!", 'Oui ! Je suis sur le rocher, au chaud au soleil !'] }),
      back(),
      props([...bugs, ...odd]),
      tapProps('actor', "Now I'm warm and hungry! I eat bugs! Find the bugs!", "Maintenant j'ai chaud et j'ai faim ! Je mange des insectes ! Trouve les insectes !", bugs.map((b) => b.id), ['Little bugs!', 'Les petits insectes !'], ['bug', 'hungry', 'count'], {
        count: true,
        wrong: {
          banana: L("No, thank you! I don't eat bananas! I eat bugs!", 'Non merci ! Je ne mange pas de bananes ! Je mange des insectes !'),
          ...(tier === 'beginner' ? {} : { leaf: L("No, thank you! I don't eat leaves! I eat bugs!", 'Non merci ! Je ne mange pas de feuilles ! Je mange des insectes !') }),
        },
        onCorrect: L(`${num(nBugs).en} bugs! Crunch, crunch!`, `${num(nBugs).fr} insectes ! Crunch, crunch !`),
      }),
      ask('actor', 'How many bugs?', "Combien d'insectes ?", numberOptions(nBugs), ['Count the bugs!', 'Compte les insectes !'], [numberId(nBugs), 'how_many'], { minTier: 'intermediate', onCorrect: L(`Yes! ${num(nBugs).en} bugs!`, `Oui ! ${num(nBugs).fr} insectes !`) }),
      act('actor', 'eat', 'Crunch, crunch! Yummy bugs!', 'Crunch, crunch ! Des insectes, miam !'),
      clearProps(),
      act('actor', 'run', 'Look! I can run on two legs! Zoom!', 'Regarde ! Je sais courir sur deux pattes ! Zoum !'),
      ask('actor', 'Is my tail long or short?', 'Ma queue est longue ou courte ?', [ok("It's long!", 'Elle est longue !', '〰️'), no("It's short!", 'Elle est courte !', '🤏')], ['Look at my long tail!', 'Regarde ma longue queue !'], ['lizard_tail', 'long'], { minTier: 'intermediate', keepOrder: true, onCorrect: ['Yes! A long, long tail!', 'Oui ! Une longue, longue queue !'] }),
      // expert : he / she + can / can't
      ask('actor', 'Can Daddy open his frill?', 'Est-ce que Papa sait ouvrir sa collerette ?', [ok('Yes, he can!', 'Oui, il sait !', '👍'), no("No, he can't!", 'Non, il ne sait pas !', '👎')], ['All frilled lizards have a frill!', 'Tous les lézards à collerette ont une collerette !'], ['lizard_frill', 'can', 'dad'], { minTier: 'expert', keepOrder: true, onCorrect: ['Yes, he can! Daddy opens his frill too! Hsss!', 'Oui, il sait ! Papa ouvre aussi sa collerette ! Hsss !'] }),
      command('actor', 'Now you are the boss! What can I do?', 'Maintenant, c’est toi le chef ! Qu’est-ce que je sais faire ?', [
        { line: L('Run on two legs!', 'Cours sur deux pattes !'), icon: '🦵', reply: L("Zoom! I'm running on two legs!", 'Zoum ! Je cours sur deux pattes !'), action: 'run' },
        { line: L('Climb!', 'Grimpe !'), icon: '🧗', reply: L("Up, up! I'm climbing!", 'Hop, hop ! Je grimpe !'), action: 'climb' },
        ORDERS.sleep,
        funny('Fly!', 'Vole !', '🪽', L("Fly? Ha, ha! I can't fly! I'm a lizard, not a bird!", 'Voler ? Ha, ha ! Je ne sais pas voler ! Je suis un lézard, pas un oiseau !')),
      ], byTier(tier, 1, 2, 3), ['lizard_legs', 'run', 'climb', 'can', 'cant'], { onCorrect: ['You are a great boss!', 'Tu es un super chef !'] }),
      end('actor', 'Hsss! Thank you, friend! You are a super lizard friend!', 'Hsss ! Merci, mon amie ! Tu es une super amie des lézards !'),
    ];
    return steps;
  },
  memoryEvent: () => 'lizard_frill',
};

export const OCEANIA_SPECIES_ACTIVITIES: readonly ActivityDef[] = [kangarooHop, koalaSleepy, lizardFrill];
