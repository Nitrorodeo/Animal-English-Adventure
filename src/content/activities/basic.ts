/**
 * Activités de base : salutations, montrer / nommer un objet du décor, trouver de l'eau,
 * trouver à manger. Elles s'adaptent au lieu (objets réellement visibles) et à l'espèce
 * (nourriture, façon de boire) ; le niveau ajoute des étapes, jamais d'incohérence.
 */
import type { ActivityCtx, ActivityDef, Line, QuestStep, StepGate, Tier } from '../types';
import { PROPS } from '../props';
import {
  act,
  anchor,
  ask,
  back,
  cap,
  DRINK_LINES,
  drinkMove,
  eatScene,
  end,
  foodsOf,
  L,
  low,
  moveTo,
  nameable,
  no,
  nounOf,
  ok,
  pickStable,
  say,
  spotsFor,
  tap,
  waterPlaces,
  yesNo,
} from './kit';

// ---------------------------------------------------------------------------
// 1.1 — Salutations : un accueil propre à chaque espèce
// ---------------------------------------------------------------------------

interface Welcome {
  adult: Line;
  baby: Line;
  goodbye: Line;
}

const W = (adult: [string, string], baby: [string, string], goodbye: [string, string]): Welcome => ({ adult: L(...adult), baby: L(...baby), goodbye: L(...goodbye) });

export const GREETING_WELCOMES: Readonly<Record<string, Welcome>> = {
  lion: W(["Hello! I'm {actorName}. Welcome to Africa! Roar!", 'Bonjour ! Je suis {actorName}. Bienvenue en Afrique ! Roar !'], ["Hi! I'm {actorName}! I'm a little lion cub!", 'Salut ! Je suis {actorName} ! Je suis un petit lionceau !'], ['Roar! That means: see you soon!', 'Roar ! Ça veut dire : à bientôt !']),
  elephant: W(["Hello there! I'm {actorName}. Look at my big ears!", 'Bonjour ! Je suis {actorName}. Regarde mes grandes oreilles !'], ["Hi! I'm {actorName}! Toot toot! I'm a baby elephant!", 'Salut ! Je suis {actorName} ! Pouet pouet ! Je suis un bébé éléphant !'], ['Toot toot! Goodbye, my friend!', 'Pouet pouet ! Au revoir, mon amie !']),
  giraffe: W(["Hello down there! I'm {actorName}. I am very tall!", 'Bonjour, là en bas ! Je suis {actorName}. Je suis immense !'], ["Hi! I'm {actorName}! I'm a baby giraffe. Look at my long neck!", 'Salut ! Je suis {actorName} ! Je suis un bébé girafe. Regarde mon long cou !'], ['Goodbye! I can see you from up here!', 'Au revoir ! Je te vois de là-haut !']),
  giant_panda: W(["Hello! I'm {actorName}. I'm eating bamboo. Yum!", 'Bonjour ! Je suis {actorName}. Je mange du bambou. Miam !'], ["Hi! I'm {actorName}! I'm a baby panda. I love bamboo!", "Salut ! Je suis {actorName} ! Je suis un bébé panda. J'adore le bambou !"], ['Goodbye! More bamboo for me!', 'Au revoir ! Encore du bambou pour moi !']),
  tiger: W(["Hello! I'm {actorName}. Look at my orange stripes!", 'Bonjour ! Je suis {actorName}. Regarde mes rayures orange !'], ["Hi! I'm {actorName}! I'm a little tiger cub!", 'Salut ! Je suis {actorName} ! Je suis un petit tigre !'], ["Goodbye! I'm going to swim in the river!", 'Au revoir ! Je vais nager dans la rivière !']),
  red_panda: W(["Hello! I'm {actorName}. I live up in the trees!", "Bonjour ! Je suis {actorName}. J'habite en haut des arbres !"], ["Hi! I'm {actorName}! Look at my fluffy tail!", 'Salut ! Je suis {actorName} ! Regarde ma queue toute douce !'], ["Goodbye! I'm going up my tree!", 'Au revoir ! Je remonte dans mon arbre !']),
  fox: W(["Hello! I'm {actorName}. Welcome to Europe!", 'Bonjour ! Je suis {actorName}. Bienvenue en Europe !'], ["Hi! I'm {actorName}! I'm a little fox cub!", 'Salut ! Je suis {actorName} ! Je suis un petit renardeau !'], ['Goodbye! Look at my orange tail!', 'Au revoir ! Regarde ma queue orange !']),
  owl: W(["Hoo hoo! Hello! I'm {actorName}. I have big eyes!", "Hou hou ! Bonjour ! Je suis {actorName}. J'ai de grands yeux !"], ["Hoo! Hi! I'm {actorName}! I'm a little owlet!", 'Hou ! Salut ! Je suis {actorName} ! Je suis un petit hibou !'], ["Hoo hoo! Goodbye! I'm going to fly!", "Hou hou ! Au revoir ! Je m'envole !"]),
  hedgehog: W(["Hello! I'm {actorName}. Careful, I'm prickly!", 'Bonjour ! Je suis {actorName}. Attention, je pique !'], ["Hi! I'm {actorName}! I'm a little hoglet!", 'Salut ! Je suis {actorName} ! Je suis un bébé hérisson !'], ["Goodbye! I'm rolling into a ball!", 'Au revoir ! Je me roule en boule !']),
  bear: W(["Hello! I'm {actorName}. Welcome to North America!", 'Bonjour ! Je suis {actorName}. Bienvenue en Amérique du Nord !'], ["Hi! I'm {actorName}! I'm a little bear cub!", 'Salut ! Je suis {actorName} ! Je suis un petit ourson !'], ["Goodbye! I'm going to find some honey!", 'Au revoir ! Je vais chercher du miel !']),
  bison: W(["Hello! I'm {actorName}. I'm big and strong!", 'Bonjour ! Je suis {actorName}. Je suis grand et fort !'], ["Hi! I'm {actorName}! I'm a baby bison!", 'Salut ! Je suis {actorName} ! Je suis un bébé bison !'], ['Goodbye! Stomp, stomp!', 'Au revoir ! Boum, boum !']),
  beaver: W(["Hello! I'm {actorName}. Look at my big teeth!", 'Bonjour ! Je suis {actorName}. Regarde mes grandes dents !'], ["Hi! I'm {actorName}! I'm a baby beaver!", 'Salut ! Je suis {actorName} ! Je suis un bébé castor !'], ["Goodbye! Slap! That's my tail!", "Au revoir ! Clac ! C'est ma queue !"]),
  jaguar: W(["Hello! I'm {actorName}. Welcome to South America!", 'Bonjour ! Je suis {actorName}. Bienvenue en Amérique du Sud !'], ["Hi! I'm {actorName}! Look at my spots!", 'Salut ! Je suis {actorName} ! Regarde mes taches !'], ['Goodbye! See you soon, my friend!', 'Au revoir ! À bientôt, mon amie !']),
  toucan: W(["Hello, hello! I'm {actorName}. Look at my big beak!", 'Bonjour, bonjour ! Je suis {actorName}. Regarde mon grand bec !'], ["Hi! I'm {actorName}! I'm a baby toucan! Tweet!", 'Salut ! Je suis {actorName} ! Je suis un bébé toucan ! Cui !'], ['Goodbye! I can fly! Whoosh!', 'Au revoir ! Je sais voler ! Whoosh !']),
  sloth: W(["Hello! I'm {actorName}. I love the trees!", "Bonjour ! Je suis {actorName}. J'adore les arbres !"], ["Hi! I'm {actorName}! I'm a baby sloth!", 'Salut ! Je suis {actorName} ! Je suis un bébé paresseux !'], ['Goodbye! Time for a slow nap!', "Au revoir ! C'est l'heure d'une petite sieste tout doucement !"]),
  kangaroo: W(["Hello! I'm {actorName}. Look, I can jump!", 'Bonjour ! Je suis {actorName}. Regarde, je sais sauter !'], ["Hi! I'm {actorName}! I'm a little joey!", 'Salut ! Je suis {actorName} ! Je suis un bébé kangourou !'], ['Goodbye! Jump, jump, jump!', 'Au revoir ! Saute, saute, saute !']),
  koala: W(["Hello… I'm {actorName}. I'm a little sleepy.", 'Bonjour… Je suis {actorName}. Je suis un peu endormi.'], ["Hi! I'm {actorName}! I'm a baby koala!", 'Salut ! Je suis {actorName} ! Je suis un bébé koala !'], ['Goodbye! Time for a nap. Zzz…', "Au revoir ! C'est l'heure de la sieste. Zzz…"]),
  platypus: W(["Hello! I'm {actorName}. Look at my funny beak!", 'Bonjour ! Je suis {actorName}. Regarde mon drôle de bec !'], ["Hi! I'm {actorName}! I'm a little puggle!", 'Salut ! Je suis {actorName} ! Je suis un bébé ornithorynque !'], ['Goodbye! Splash!', 'Au revoir ! Plouf !']),
  penguin: W(["Hello! I'm {actorName}. Welcome to the ice! Brr, it's cold!", 'Bonjour ! Je suis {actorName}. Bienvenue sur la glace ! Brr, il fait froid !'], ["Hi! I'm {actorName}! I'm a little penguin chick!", 'Salut ! Je suis {actorName} ! Je suis un petit poussin manchot !'], ['Goodbye! I am going to swim now!', 'Au revoir ! Je vais nager maintenant !']),
  seal: W(["Hello! I'm {actorName}. Welcome to Antarctica!", "Bonjour ! Je suis {actorName}. Bienvenue en Antarctique !"], ["Hi! I'm {actorName}! I'm a baby seal!", 'Salut ! Je suis {actorName} ! Je suis un bébé phoque !'], ['Goodbye! Clap, clap!', 'Au revoir ! Clap, clap !']),
  orca: W(["Hello! I'm {actorName}. I'm black and white!", 'Bonjour ! Je suis {actorName}. Je suis noir et blanc !'], ["Hi! I'm {actorName}! I'm a baby orca!", 'Salut ! Je suis {actorName} ! Je suis un bébé orque !'], ['Goodbye! Splash!', 'Au revoir ! Plouf !']),
};

export const greeting: ActivityDef = {
  id: 'greeting',
  choices: (c) => (GREETING_WELCOMES[c.species.id] ? ['hello'] : []),
  build(c) {
    const w = GREETING_WELCOMES[c.species.id]!;
    return [
      ask('actor', (c.actorKind === 'baby' ? w.baby : w.adult).en, (c.actorKind === 'baby' ? w.baby : w.adult).fr, [ok('Hello!', 'Bonjour !', '👋'), no('Goodbye!', 'Au revoir !', '🙋'), no('Thank you!', 'Merci !', '🙏'), no("I'm a tree.", 'Je suis un arbre.', '🌳')], ['Listen: Hello! You can say hello too!', 'Écoute : Hello ! Tu peux dire bonjour toi aussi !'], ['hello'], { onCorrect: L('Hello, {playerName}!', 'Bonjour, {playerName} !'), emotion: 'happy' }),
      act('actor', 'wave', 'Look! I wave my paw. Hello, hello!', 'Regarde ! Je fais coucou. Hello, hello !', 'actor', { maxTier: 'beginner' }),
      ask('actor', 'How are you?', 'Comment vas-tu ?', [ok("I'm fine, thank you!", 'Je vais bien, merci !', '😊'), no("I'm a tree.", 'Je suis un arbre.', '🌳'), no('Goodbye!', 'Au revoir !', '🙋'), no("It's a cloud.", "C'est un nuage.", '☁️')], ["I asked: how are you? You can say: I'm fine!", "J'ai demandé : comment vas-tu ? Tu peux dire : je vais bien !"], ['how_are_you', 'im_fine', 'thank_you'], { onCorrect: L("Great! I'm fine too!", 'Super ! Moi aussi je vais bien !'), minTier: 'intermediate' }),
      ask('actor', "What's your name?", "Comment t'appelles-tu ?", [ok('My name is {playerName}.', "Je m'appelle {playerName}.", '🏷️'), no("It's hot.", 'Il fait chaud.', '☀️'), no("I'm thirsty.", "J'ai soif.", '💧'), no('Goodbye!', 'Au revoir !', '🙋')], ['Tell me your name! My name is…', 'Dis-moi ton prénom ! My name is…'], ['my_name_is', 'nice_to_meet_you'], { onCorrect: L('Nice to meet you, {playerName}!', 'Enchanté, {playerName} !'), emotion: 'curious', minTier: 'expert' }),
      ask('actor', 'I have to go now. What do we say?', 'Je dois partir. Que dit-on ?', [ok('Goodbye! See you soon!', 'Au revoir ! À bientôt !', '🙋'), no('Hello!', 'Bonjour !', '👋'), no('Yum, yum!', 'Miam, miam !', '😋'), no('Please!', "S'il te plaît !", '🥺')], ['When we go, we say: goodbye!', 'Quand on part, on dit : goodbye !'], ['goodbye'], { minTier: 'intermediate' }),
      end('actor', w.goodbye.en, w.goodbye.fr),
    ];
  },
  memoryEvent: () => 'greeted_player',
};

// ---------------------------------------------------------------------------
// Montrer un objet du décor (« Where is the tree? »)
// ---------------------------------------------------------------------------

const the = (word: string) => `the ${word}`;

export const findObject: ActivityDef = {
  id: 'find_object',
  choices: (c) => (nameable(c.place).length >= 3 ? nameable(c.place).map((a) => a.id) : []),
  build(c, _tier, choice) {
    const a = anchor(c.place, choice);
    const n = a && nounOf(a.word);
    if (!a || !n) return undefined;
    const others = nameable(c.place).filter((x) => x.word !== a.word);
    const second = pickStable(others, choice + c.place.id);
    const n2 = nounOf(second.word)!;
    const steps: QuestStep[] = [
      tap('actor', `Where is ${the(a.word)}? Show me!`, `Où est ${a.wordFr} ? Montre-moi !`, a.id, [`Look carefully! Find ${the(a.word)}.`, `Regarde bien ! Trouve ${a.wordFr}.`], [a.word, 'where'], { onCorrect: L(`${n.en}! Well done!`, `${n.fr} ! Bravo !`) }),
    ];
    if (a.stand) steps.push(moveTo(a.id, 'sniff'), say('actor', `Sniff, sniff! I'm next to ${the(a.word)}!`, `Snif, snif ! Je suis à côté de ${a.wordFr} !`, {}, 'happy'), back());
    steps.push(tap('actor', `And now, where is ${the(second.word)}?`, `Et maintenant, où est ${second.wordFr} ?`, second.id, [`Look carefully! Find ${the(second.word)}.`, `Regarde bien ! Trouve ${second.wordFr}.`], [second.word, 'where'], { onCorrect: L(`${n2.en}! Yes!`, `${n2.fr} ! Oui !`), minTier: 'intermediate' }));
    if (a.check) steps.push(ask('actor', a.check.q.en, a.check.q.fr, yesNo(a.check.yes), ['Look again!', 'Regarde encore !'], [a.word], { pointAt: a.id, keepOrder: true, minTier: 'expert', onCorrect: L('Yes! You see everything!', 'Oui ! Tu vois tout !') }));
    steps.push(end('actor', 'You are a great explorer!', 'Tu es une super exploratrice !'));
    return steps;
  },
};

// ---------------------------------------------------------------------------
// name_object — le bébé demande « What's this? »
// ---------------------------------------------------------------------------

export type TeachMode = 'new' | 'retest' | 'known';
export const TEACH_MODES: readonly TeachMode[] = ['new', 'retest', 'known'];

/** Variante = `mode|anchorId`. Le mode est choisi par le moteur (mémoire du bébé). */
export function teachSteps(c: ActivityCtx, tier: Tier, mode: TeachMode, anchorId: string): QuestStep[] | undefined {
  const a = anchor(c.place, anchorId);
  const n = a && nounOf(a.word);
  if (!a || !n) return undefined;
  const others = nameable(c.place).filter((x) => x.word !== a.word);
  if (others.length < 2) return undefined;
  const d1 = pickStable(others, a.word);
  const d2 = pickStable(others.filter((x) => x.word !== d1.word), a.word, 1);
  const d3 = pickStable(others.filter((x) => x.word !== d1.word && x.word !== d2.word), a.word, 2);
  const card = (x: typeof a, correct: boolean) => ({ line: L(`${nounOf(x.word)!.en}!`, `${nounOf(x.word)!.fr} !`), anchorCrop: x.id, correct });
  const cards = [card(a, true), card(d1, false), ...(d2 ? [card(d2, false)] : []), ...(d3 && d3 !== d2 ? [card(d3, false)] : [])];
  if (mode === 'known') {
    return [
      say('actor', `I remember! It's ${low(n.en)}!`, `Je me souviens ! C'est ${low(n.fr)} !`, {}, 'proud'),
      ...(a.check
        ? [ask('actor', a.check.q.en, a.check.q.fr, yesNo(a.check.yes), ['Look again!', 'Regarde encore !'], [a.word], { pointAt: a.id, keepOrder: true, onCorrect: L('Yes! You know everything!', 'Oui ! Tu sais tout !'), emotion: 'curious' })]
        : [tap('actor', `Can you show me ${the(a.word)} again?`, `Tu peux me remontrer ${a.wordFr} ?`, a.id, ['Look where I was pointing!', 'Regarde là où je montrais !'], [a.word])]),
      end('actor', 'I love learning with you!', "J'adore apprendre avec toi !"),
    ];
  }
  const question = mode === 'retest' ? L("Hmm… what's this again?", "Hmm… c'est quoi déjà ?") : L("Ooh! What's this?", "Oh ! Qu'est-ce que c'est ?");
  const steps: QuestStep[] = [
    ask('actor', question.en, question.fr, cards, ['Look where I am pointing!', 'Regarde là où je montre !'], [a.word, 'whats_this'], { pointAt: a.id, emotion: 'curious', onCorrect: L(`${n.en}! ${n.en}! Thank you!`, `${n.fr} ! ${n.fr} ! Merci !`) }),
  ];
  if (a.check && mode === 'new') steps.push(ask('actor', a.check.q.en, a.check.q.fr, yesNo(a.check.yes), ['Look again!', 'Regarde encore !'], [a.word], { pointAt: a.id, keepOrder: true, minTier: 'expert', onCorrect: L('Yes! Now I know!', 'Oui ! Maintenant je sais !') }));
  void tier;
  steps.push(end('actor', mode === 'retest' ? 'Now I remember!' : 'A new word! Yay!', mode === 'retest' ? 'Maintenant je me souviens !' : 'Un nouveau mot ! Youpi !'));
  return steps;
}

export const nameObject: ActivityDef = {
  id: 'name_object',
  choices: (c) => (c.actorKind === 'baby' && nameable(c.place).length >= 3 ? TEACH_MODES.flatMap((m) => nameable(c.place).map((a) => `${m}|${a.id}`)) : []),
  build(c, tier, choice) {
    const [mode, anchorId] = choice.split('|') as [TeachMode, string];
    return teachSteps(c, tier, mode, anchorId);
  },
  memoryEvent: (c, choice) => `taught:${anchor(c.place, choice.split('|')[1] ?? '')?.word ?? ''}`,
};

// ---------------------------------------------------------------------------
// find_water — l'eau réellement visible dans le décor, bue à la façon de l'espèce
// ---------------------------------------------------------------------------

/** Scènes historiques de la savane (lion, éléphant, girafe), réécrites avec la boîte à outils. */
function savannaClassic(c: ActivityCtx): QuestStep[] | undefined {
  const baby = c.actorKind === 'baby';
  const nextToTree = (en: string, fr: string, gate: StepGate = {}) =>
    ask('actor', en, fr, [ok('Next to the big tree.', 'À côté du grand arbre.', '🌳'), no('In the sky.', 'Dans le ciel.', '☁️'), no('Under the sun.', 'Sous le soleil.', '☀️'), no('On the cloud.', 'Sur le nuage.', '☁️')], ['Look! The water is next to the big tree.', "Regarde ! L'eau est à côté du grand arbre."], ['where', 'next_to', 'water'], { onCorrect: L("Yes! Let's go!", 'Oui ! Allons-y !'), emotion: 'thirsty', ...gate });
  const lets = (en: string, fr: string, items: string[]) =>
    ask('actor', en, fr, [ok("Let's find water!", "Cherchons de l'eau !", '💧'), no('Goodbye!', 'Au revoir !', '🙋')], ["I'm thirsty… I need water!", "J'ai soif… J'ai besoin d'eau !"], items, { onCorrect: L("Yes! Let's go!", 'Oui ! Allons-y !'), emotion: 'thirsty', maxTier: 'beginner' });
  const waterTap = tap('actor', 'Where is the water? Show me!', "Où est l'eau ? Montre-moi !", 'waterhole', ['The water is blue. Look next to the big tree!', "L'eau est bleue. Regarde à côté du grand arbre !"], ['water', 'where']);
  const move = drinkMove(c.species)!;
  const drink = [moveTo('waterhole', move), say('actor', DRINK_LINES[move]!.en, DRINK_LINES[move]!.fr, {}, 'happy'), back()];
  switch (c.species.id) {
    case 'lion':
      return [
        lets(baby ? "Phew! It's hot! I'm thirsty!" : "What a hot day! I'm thirsty.", baby ? "Pfiou ! Il fait chaud ! J'ai soif !" : "Quelle chaude journée ! J'ai soif.", ['hot', 'thirsty', 'water', 'lets_go']),
        ask('actor', "It's very hot today. My paws are hot! What can we do?", "Il fait très chaud aujourd'hui. Mes pattes sont chaudes ! Que faire ?", [ok("Let's rest in the shade.", "Reposons-nous à l'ombre.", '⛱️'), no("Let's run in the sun.", 'Courons au soleil.', '☀️'), no("Let's sleep on the sand.", 'Dormons sur le sable.', '😴')], ['The sun is hot. The shade is cool!', "Le soleil est chaud. L'ombre est fraîche !"], ['hot', 'shade', 'sun'], { onCorrect: L('Good idea! Where is the shade?', "Bonne idée ! Où est l'ombre ?"), emotion: 'thirsty', minTier: 'expert' }),
        tap('actor', 'Show me the shade, under the big tree.', "Montre-moi l'ombre, sous le grand arbre.", 'shade', ['The shade is under the big tree.', "L'ombre est sous le grand arbre."], ['shade', 'tree'], { minTier: 'expert' }),
        moveTo('shade', 'rest', undefined, { minTier: 'expert' }),
        nextToTree("I'm thirsty. Where is the water?", "J'ai soif. Où est l'eau ?", { minTier: 'intermediate' }),
        waterTap,
        ...drink,
        end('actor', "Thank you! I'm happy now!", 'Merci ! Je suis content maintenant !'),
      ];
    case 'elephant':
      return [
        lets(baby ? "Toot toot! I'm thirsty! Water, please!" : 'My trunk is so dry! I am thirsty.', baby ? "Pouet pouet ! J'ai soif ! De l'eau, s'il te plaît !" : "Ma trompe est toute sèche ! J'ai soif.", ['thirsty', 'water', 'please', 'lets_go']),
        ask('actor', 'It is very hot today. Which way should we go to find water?', "Il fait très chaud aujourd'hui. Par où aller pour trouver de l'eau ?", [ok('Follow the path to the big tree.', "Suis le chemin jusqu'au grand arbre.", '🛤️'), no('Climb the iceberg.', "Escalade l'iceberg.", '🧊'), no('Fly to the cloud.', "Vole jusqu'au nuage.", '☁️')], ['There is no ice here! Follow the path.', "Il n'y a pas de glace ici ! Suis le chemin."], ['follow_the_path', 'hot'], { onCorrect: L('Good idea! Where is the path?', 'Bonne idée ! Où est le chemin ?'), minTier: 'expert' }),
        tap('actor', 'Show me the path!', 'Montre-moi le chemin !', 'path', ['The path is brown. It goes far away.', 'Le chemin est marron. Il va très loin.'], ['path'], { minTier: 'expert' }),
        moveTo('path', 'walk', undefined, { minTier: 'expert' }),
        nextToTree('Where is the water? Can you help me?', "Où est l'eau ? Peux-tu m'aider ?", { minTier: 'intermediate' }),
        waterTap,
        ...drink,
        ask('actor', 'Splash! I am happy! Are you happy?', 'Splash ! Je suis content ! Es-tu contente ?', [ok("Yes, I'm happy!", 'Oui, je suis contente !', '😄'), no("I'm a rock.", 'Je suis un rocher.', '🪨'), no("It's a cloud.", "C'est un nuage.", '☁️')], ["Are you happy? You can say: yes, I'm happy!", 'Es-tu contente ? Tu peux dire : yes, I’m happy !'], ['happy'], { onCorrect: L('Hooray!', 'Hourra !'), emotion: 'happy' }),
        end('actor', 'Thank you, {playerName}! You are my friend!', 'Merci, {playerName} ! Tu es mon amie !'),
      ];
    case 'giraffe':
      return [
        lets(baby ? "I'm thirsty! My neck is so long… where is the water?" : "I'm tall, but I'm thirsty! I need water.", baby ? "J'ai soif ! Mon cou est si long… où est l'eau ?" : "Je suis grande, mais j'ai soif ! J'ai besoin d'eau.", ['thirsty', 'water', 'lets_go']),
        ask('actor', 'Look at me! Am I big or small?', 'Regarde-moi ! Suis-je grande ou petite ?', [ok('You are big!', 'Tu es grande !', '⬆️'), no('You are small!', 'Tu es petite !', '⬇️')], ['My neck is very long. I am big!', 'Mon cou est très long. Je suis grande !'], ['big', 'small'], { onCorrect: L("Yes! I'm big. I can see the big tree!", 'Oui ! Je suis grande. Je vois le grand arbre !'), emotion: 'curious', keepOrder: true, minTier: 'expert' }),
        nextToTree("I'm thirsty. Where is the water?", "J'ai soif. Où est l'eau ?", { minTier: 'intermediate' }),
        waterTap,
        ...drink,
        end('actor', "Thank you, {playerName}! I'm happy!", 'Merci, {playerName} ! Je suis contente !'),
      ];
    default:
      return undefined;
  }
}

const CLASSIC = new Set(['lion', 'elephant', 'giraffe']);

export const findWater: ActivityDef = {
  id: 'find_water',
  choices(c) {
    if (!drinkMove(c.species)) return [];
    if (c.place.id === 'savanna' && CLASSIC.has(c.species.id)) return ['classic', 'classic+memory'];
    return waterPlaces(c.place).flatMap((a) => [a.id, `${a.id}+memory`]);
  },
  build(c, _tier, choice) {
    const remembers = choice.endsWith('+memory');
    const id = choice.replace('+memory', '');
    const memory = remembers ? [say('actor', 'Remember? We found water here!', "Tu te souviens ? On a trouvé de l'eau ici !", {}, 'happy')] : [];
    if (id === 'classic') {
      const s = savannaClassic(c);
      return s && [...memory, ...s];
    }
    const a = anchor(c.place, id);
    const move = drinkMove(c.species);
    if (!a || !move) return undefined;
    return [
      ...memory,
      ask('actor', "Phew! I'm thirsty! I need water.", "Pfiou ! J'ai soif ! J'ai besoin d'eau.", [ok("Let's find water!", "Cherchons de l'eau !", '💧'), no('Goodbye!', 'Au revoir !', '🙋'), no("Let's sleep!", 'Dormons !', '😴'), no("I'm a rock.", 'Je suis un rocher.', '🪨')], ["I'm thirsty… I need water!", "J'ai soif… J'ai besoin d'eau !"], ['thirsty', 'water', 'lets_go'], { onCorrect: L("Yes! Let's go!", 'Oui ! Allons-y !'), emotion: 'thirsty', maxTier: 'intermediate' }),
      ask('actor', 'I want water. How do I feel?', "Je veux de l'eau. Comment je me sens ?", [ok("You're thirsty!", 'Tu as soif !', '💧'), no("You're sleepy!", 'Tu as sommeil !', '😴'), no("You're cold!", 'Tu as froid !', '🥶'), no("You're hungry!", 'Tu as faim !', '😋')], ['I want water… I am thirsty!', "Je veux de l'eau… J'ai soif !"], ['thirsty'], { onCorrect: L("Yes, I'm thirsty! Let's go!", "Oui, j'ai soif ! Allons-y !"), emotion: 'thirsty', minTier: 'expert' }),
      tap('actor', `Where is ${the(a.word)}? Show me!`, `Où est ${a.wordFr} ? Montre-moi !`, a.id, ['Look for the water!', "Cherche l'eau !"], [a.word, 'water', 'where'], { onCorrect: L(`${nounOf(a.word)?.en ?? 'Water'}! Yes!`, `${nounOf(a.word)?.fr ?? "De l'eau"} ! Oui !`) }),
      moveTo(a.id, move),
      say('actor', DRINK_LINES[move]!.en, DRINK_LINES[move]!.fr, {}, 'happy'),
      back(),
      ask('actor', 'Do you drink water too?', "Toi aussi, tu bois de l'eau ?", [ok('Yes, I drink water!', "Oui, je bois de l'eau !", '🥛'), no('No, I drink rocks!', 'Non, je bois des cailloux !', '🪨')], ['Everybody drinks water!', "Tout le monde boit de l'eau !"], ['drink', 'water'], { keepOrder: true, minTier: 'intermediate', onCorrect: L('Water is good for everybody!', "L'eau, c'est bon pour tout le monde !") }),
      end('actor', "Thank you! I'm happy now!", 'Merci ! Je suis content maintenant !'),
    ];
  },
  memoryEvent: (c) => `found_water:${c.place.id}`,
};

// ---------------------------------------------------------------------------
// find_food — uniquement la vraie nourriture de l'espèce ; les intrus font rire
// ---------------------------------------------------------------------------

export const findFood: ActivityDef = {
  id: 'find_food',
  choices: (c) => (c.species.foods.length && c.species.notFoods.length && c.place.spots.length >= 4 ? ['meal'] : []),
  build(c) {
    const { good, bad } = foodsOf(c.species);
    const g = good.eat!;
    const spots = spotsFor(c.place, 4, c.species.id + c.place.id) as [number, number, number, number];
    const b = bad[0]!;
    const like = PROPS[pickStable(['banana', 'mango', 'honey', 'berries', 'fish'], c.species.id + c.place.id)]!;
    return [
      say('actor', "My tummy says: grrr! I'm hungry!", "Mon ventre fait : grrr ! J'ai faim !", {}, 'curious'),
      ...eatScene(c.species, spots, 'actor', 'food'),
      ask('actor', `Do I eat ${b.eat!.en}?`, `Est-ce que je mange ${b.eat!.fr} ?`, [ok("No, you don't!", 'Non !', '👎'), no('Yes, you do!', 'Oui !', '👍')], [`I eat ${g.en}, not ${b.eat!.en}!`, `Je mange ${g.fr}, pas ${b.eat!.frNo} !`], [b.word, 'do_you'], { keepOrder: true, minTier: 'expert', onCorrect: L(`That's right! I eat ${g.en}!`, `C'est ça ! Je mange ${g.fr} !`) }),
      ask('actor', `And you? Do you like ${like.eat?.en ?? like.plural}?`, `Et toi ? Tu aimes ${like.eat?.fr ?? like.pluralFr} ?`, [ok('Yes, I do!', 'Oui !', '😋'), ok("No, I don't.", 'Non.', '🙅')], ['You can say: yes, I do! Or: no, I don\'t.', 'Tu peux dire : yes, I do! ou : no, I don\'t.'], ['do_you_like'], { keepOrder: true, minTier: 'intermediate', onCorrect: L('Thank you for telling me!', 'Merci de me le dire !') }),
      end('actor', `${cap(g.en)}! My favourite! Thank you!`, `${cap(g.fr)} ! Mon plat préféré ! Merci !`),
    ];
  },
  memoryEvent: (c) => `ate:${c.species.foods[0]}`,
};
