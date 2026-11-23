import { NUMBERS } from '../../props';
import type { ActivityCtx, ActivityDef, CommandOption, Line, QuestStep, Speaker, Tier } from '../../types';
import { numberId, numberOptions } from '../games';
import { act, anchor, ask, back, clearProps, command, end, L, landSpots, moveTo, no, ok, prop, props, say, tap, tapActor, tapProps } from '../kit';

/** Déroulé des jeux propres aux espèces de ce continent (voir `antarctica.arch.ts`). */

const byTier = <T>(tier: Tier, b: T, i: T, e: T): T => (tier === 'beginner' ? b : tier === 'intermediate' ? i : e);
const isBaby = (c: ActivityCtx) => c.actorKind === 'baby';
/** Qui d'autre que le personnage joué parle : le bébé (si un parent joue) ou le frère / la sœur (si un bébé joue). */
const otherBaby = (c: ActivityCtx) => (isBaby(c) ? ({ speaker: 'sibling', needs: 'sibling' } as const) : ({ speaker: 'baby', needs: 'baby' } as const));
const card = (en: string, fr: string, icon: string, reply: Line, action?: CommandOption['action']): CommandOption => ({ line: L(en, fr), icon, reply, ...(action ? { action } : {}) });

/** L'autre parent (Maman si Papa joue, sinon Papa ; un bébé se tourne vers Maman), avec « he/she ». */
function otherParent(c: ActivityCtx): { who: Speaker; name: Line; he: Line; does: Line } {
  return c.actorKind === 'adult' && c.role === 'mother'
    ? { who: 'father', name: L('Daddy', 'Papa'), he: L('he', 'il'), does: L('he does', 'il en a') }
    : { who: 'mother', name: L('Mummy', 'Maman'), he: L('she', 'elle'), does: L('she does', 'elle en a') };
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Le personnage peut aller sur la neige (point « snow » avec un endroit où se placer) : vrai dans tout l'Antarctique. */
const snowOf = (c: ActivityCtx) => {
  const a = anchor(c.place, 'snow');
  return a?.stand ? a : undefined;
};

// ---------------------------------------------------------------------------
// Le manchot — « Waddle and slide! » : se dandiner (waddle), les nageoires (flippers),
// glisser sur le ventre (slide on the belly), le nid de cailloux, se serrer contre le froid (huddle)
// ---------------------------------------------------------------------------

export const penguinWaddle: ActivityDef = {
  id: 'penguin_waddle',
  choices: (c) => (c.species.id === 'penguin' && snowOf(c) ? ['waddle'] : []),
  build(c, tier) {
    const snow = snowOf(c);
    if (!snow) return undefined;
    const sea = anchor(c.place, 'sea');
    const land = landSpots(c.place);
    const nPeb = byTier(tier, 0, 3, 4);
    // le nid de cailloux : seulement s'il y a assez de sol (jamais de caillou dans l'eau)
    const nest = nPeb > 0 && land.length >= nPeb + 1;
    const pebbles = nest ? land.slice(0, nPeb).map((s, i) => prop(`pebble${i}`, 'pebble', s)) : [];
    const egg = nest ? prop('nest_egg', 'egg', land[nPeb]!) : undefined;
    const hug = otherParent(c);
    const other = otherBaby(c);
    const cards: CommandOption[] = [
      card('Waddle!', 'Dandine-toi !', '🐧', L('Waddle, waddle! Left, right, left, right!', 'Dandine, dandine ! Gauche, droite, gauche, droite !'), 'dance'),
      card('Flap your flippers!', 'Agite tes nageoires !', '👋', L('Flap, flap! Look at my flippers!', 'Flap, flap ! Regarde mes nageoires !'), 'wave'),
      card('Fly!', 'Vole !', '🪽', L("Ha ha! Penguins can't fly!", 'Ha ha ! Les manchots ne volent pas !')),
      card('Hop!', 'Sautille !', '🐇', L('Hop, hop! I can hop on the ice!', 'Hop, hop ! Je sautille sur la glace !'), 'hop'),
      sea
        ? card('Swim!', 'Nage !', '🏊', L('Splash! I swim very fast with my flippers!', 'Splash ! Je nage très vite avec mes nageoires !'), 'swim')
        : card('Slide!', 'Glisse !', '🛷', L('Wheee! I slide on my belly!', 'Youpiii ! Je glisse sur le ventre !'), 'swim'),
    ];
    const steps: QuestStep[] = [
      isBaby(c)
        ? say('actor', "I'm a little penguin chick! I can't fly, but I can waddle!", 'Je suis un petit poussin manchot ! Je ne sais pas voler, mais je sais me dandiner !', {}, 'happy')
        : say('actor', "I'm a penguin! I can't fly, but I can waddle!", 'Je suis un manchot ! Je ne sais pas voler, mais je sais me dandiner !', {}, 'proud'),
      act('actor', 'dance', 'Waddle, waddle! Left, right, left, right!', 'Dandine, dandine ! Gauche, droite, gauche, droite !'),
      ask('actor', 'What am I doing?', "Qu'est-ce que je fais ?", [ok("You're waddling!", 'Tu te dandines !', '🐧'), no("You're flying!", 'Tu voles !', '🪽'), no("You're climbing!", 'Tu grimpes !', '🧗'), no("You're sleeping!", 'Tu dors !', '😴')], ['Waddle, waddle!', 'Dandine, dandine !'], ['penguin_waddle'], {
        onCorrect: ['Yes! Penguins waddle! Left, right!', 'Oui ! Les manchots se dandinent ! Gauche, droite !'],
      }),
      ask('actor', 'I swim with my… what?', 'Je nage avec mes… quoi ?', [ok('Your flippers!', 'Tes nageoires !', '🐧'), no('Your paws!', 'Tes pattes !', '🐾'), no('Your leaves!', 'Tes feuilles !', '🍃')], ['Flap, flap! I have two flippers.', "Flap, flap ! J'ai deux nageoires."], ['penguin_flippers', 'swim'], {
        onCorrect: ['Yes! My flippers! Flap, flap!', 'Oui ! Mes nageoires ! Flap, flap !'],
      }),
      command('actor', 'Simon says! Touch a card, and I do it!', 'Jacques a dit ! Touche une carte, et je le fais !', cards, byTier(tier, 2, 3, 4), ['penguin_waddle', 'penguin_flippers', 'hop', 'fly'], { onCorrect: ['What a funny penguin!', 'Quel drôle de manchot !'] }),
      tap('actor', "Let's slide on our belly! Touch the snow!", 'On glisse sur le ventre ! Touche la neige !', snow.id, ['Find the snow!', 'Cherche la neige !'], ['snow', 'penguin_slide', 'penguin_belly']),
      moveTo(snow.id, 'rest'),
      say('actor', 'Wheee! I slide on my belly!', 'Youpiii ! Je glisse sur le ventre !', {}, 'happy'),
      ask('actor', 'How do I slide?', 'Comment je glisse ?', [ok('On your belly!', 'Sur le ventre !', '🛷'), no('On your head!', 'Sur la tête !', '🙃'), no('On a tree!', 'Sur un arbre !', '🌳')], ['Wheee! On my tummy!', 'Youpiii ! Sur mon ventre !'], ['penguin_belly', 'penguin_slide'], {
        minTier: 'intermediate',
        onCorrect: ['Yes! Penguins slide on their belly! So fast!', 'Oui ! Les manchots glissent sur le ventre ! Trop rapide !'],
      }),
      back(),
      ask('actor', 'A baby penguin is a…', 'Un bébé manchot, c’est un…', [ok('A chick!', 'Un poussin !', '🐣'), no('A cub!', 'Un ourson !', '🧸'), no('A pup!', 'Un bébé phoque !', '🦭')], ['A little penguin!', 'Un petit manchot !'], ['penguin_chick', 'baby'], {
        minTier: 'intermediate',
        onCorrect: ['Yes! A baby penguin is a chick!', 'Oui ! Un bébé manchot, c’est un poussin !'],
      }),
      say(other.speaker, "I'm a little chick! I can waddle too! Waddle, waddle!", 'Je suis un petit poussin ! Moi aussi je me dandine ! Dandine, dandine !', { minTier: 'intermediate', needs: other.needs }, 'happy'),
    ];
    if (nest) {
      steps.push(
        say('actor', "Penguins make a nest with pebbles. Let's find pebbles!", 'Les manchots font leur nid avec des cailloux. Cherchons des cailloux !', { minTier: 'intermediate' }, 'curious'),
        props(pebbles, { minTier: 'intermediate' }),
        tapProps('actor', 'Touch the pebbles, one by one!', 'Touche les cailloux, un par un !', pebbles.map((p) => p.id), ['Find every pebble!', 'Trouve chaque caillou !'], ['pebble', 'count'], {
          minTier: 'intermediate',
          count: true,
          onCorrect: L(`${NUMBERS[nPeb]!.en} pebbles! What a nice nest!`, `${NUMBERS[nPeb]!.fr} cailloux ! Quel joli nid !`),
        }),
        props([...pebbles, egg!], { minTier: 'expert' }),
        ask('actor', 'Look! What is in the nest?', "Regarde ! Qu'est-ce qu'il y a dans le nid ?", [ok('An egg!', 'Un œuf !', '🥚'), no('A fish!', 'Un poisson !', '🐟'), no('A ball!', 'Un ballon !', '⚽')], ['It is white and round!', 'Il est blanc et rond !'], ['egg', 'nest'], {
          minTier: 'expert',
          onCorrect: ['Yes! An egg! A little chick is inside!', 'Oui ! Un œuf ! Un petit poussin est dedans !'],
        }),
        clearProps({ minTier: 'intermediate' }),
      );
    }
    steps.push(
      say('actor', 'Brrr! The wind is so cold!', 'Brrr ! Le vent est très froid !', { minTier: 'expert' }, 'calm'),
      tapActor(
        'actor',
        L(`Penguins huddle to stay warm! Huddle with ${hug.name.en}! Touch ${hug.name.en}!`, `Les manchots se serrent pour avoir chaud ! Serre-toi contre ${hug.name.fr} ! Touche ${hug.name.fr} !`),
        hug.who,
        'dance',
        L("Huddle, huddle! Now we're warm!", 'Serrés, serrés ! Maintenant on a chaud !'),
        L(`Not me! Find ${hug.name.en}!`, `Pas moi ! Cherche ${hug.name.fr} !`),
        L(`Touch ${hug.name.en}!`, `Touche ${hug.name.fr} !`),
        ['penguin_huddle', 'cold'],
        { minTier: 'expert' },
      ),
      ask('actor', 'Can penguins fly?', 'Est-ce que les manchots savent voler ?', [ok("No, they can't!", 'Non !', '👎'), no('Yes, they can!', 'Oui !', '👍')], ["Penguins can't fly. But they can swim!", 'Les manchots ne volent pas. Mais ils savent nager !'], ['can', 'cant', 'fly'], {
        minTier: 'expert',
        keepOrder: true,
        onCorrect: ["That's right! Penguins can't fly. But they can swim!", "C'est ça ! Les manchots ne volent pas. Mais ils savent nager !"],
      }),
      end('actor', 'Waddle, waddle! You are a great penguin friend!', 'Dandine, dandine ! Tu es une super amie des manchots !'),
    );
    return steps;
  },
  memoryEvent: () => 'penguin_waddle',
};

// ---------------------------------------------------------------------------
// Le phoque — « The seal's whiskers » : les moustaches (whiskers) qui trouvent les poissons,
// plonger (dive), applaudir avec les nageoires (clap), le bébé phoque (pup), le trou pour respirer
// ---------------------------------------------------------------------------

export const sealWhiskers: ActivityDef = {
  id: 'seal_whiskers',
  choices: (c) => (c.species.id === 'seal' && anchor(c.place, 'sea') && snowOf(c) ? ['whiskers'] : []),
  build(c, tier) {
    const sea = anchor(c.place, 'sea');
    const snow = snowOf(c);
    if (!sea || !snow) return undefined;
    const par = otherParent(c);
    const other = otherBaby(c);
    const cards: CommandOption[] = [
      card('Clap your flippers!', 'Tape des nageoires !', '👏', L('Clap, clap, clap! I can clap!', 'Clap, clap, clap ! Je sais applaudir !'), 'dance'),
      card('Dive!', 'Plonge !', '🤿', L('Splash! I dive into the water!', "Splash ! Je plonge dans l'eau !"), 'swim'),
      card('Climb!', 'Grimpe !', '🧗', L("Ha ha! Seals can't climb!", 'Ha ha ! Les phoques ne grimpent pas !')),
      card('Wiggle your whiskers!', 'Remue tes moustaches !', '〰️', L('Wiggle, wiggle! Look at my whiskers!', 'Je remue mes moustaches ! Regarde !'), 'wave'),
      card('Rest on the ice!', 'Repose-toi sur la glace !', '😴', L('Ahh… I love a rest on the ice!', "Ahh… J'adore me reposer sur la glace !"), 'sleep'),
    ];
    return [
      isBaby(c)
        ? say('actor', "I'm a little seal pup! Look at my whiskers!", 'Je suis un petit bébé phoque ! Regarde mes moustaches !', {}, 'happy')
        : say('actor', "I'm a seal! Look at my long whiskers!", 'Je suis un phoque ! Regarde mes longues moustaches !', {}, 'proud'),
      ask('actor', 'Look at my face! What are these?', "Regarde mon visage ! Qu'est-ce que c'est ?", [ok('Whiskers!', 'Des moustaches !', '〰️'), no('Feathers!', 'Des plumes !', '🪶'), no('Leaves!', 'Des feuilles !', '🍃')], ['Long and thin, on my face!', 'Longues et fines, sur mon visage !'], ['seal_whiskers', 'whats_this'], {
        onCorrect: ['Yes! Whiskers! Wiggle, wiggle!', 'Oui ! Des moustaches ! Je les remue !'],
      }),
      ask('actor', 'My whiskers help me find… what?', "Mes moustaches m'aident à trouver… quoi ?", [ok('Fish!', 'Des poissons !', '🐟'), no('Bananas!', 'Des bananes !', '🍌'), no('Grass!', "De l'herbe !", '🌾')], ['I eat fish!', 'Je mange du poisson !'], ['fish', 'seal_whiskers'], {
        onCorrect: ['Yes! I find fish with my whiskers. Yum!', 'Oui ! Je trouve les poissons avec mes moustaches. Miam !'],
      }),
      tap('actor', "Let's dive! Touch the sea!", 'On plonge ! Touche la mer !', sea.id, ['Find the sea!', 'Cherche la mer !'], ['sea', 'seal_dive']),
      act('actor', 'swim', 'Splash! I dive into the sea!', 'Splash ! Je plonge dans la mer !'),
      ask('actor', 'Where did I dive?', 'Où est-ce que j’ai plongé ?', [ok('Into the sea!', 'Dans la mer !', '🌊'), no('Into the snow!', 'Dans la neige !', '❄️'), no('Into a tree!', 'Dans un arbre !', '🌳')], ['Splash! In the water!', "Splash ! Dans l'eau !"], ['seal_dive', 'sea', 'where'], {
        minTier: 'intermediate',
        onCorrect: ['Yes! Into the sea! Seals are great divers!', 'Oui ! Dans la mer ! Les phoques plongent très bien !'],
      }),
      command('actor', 'Simon says! Touch a card, and I do it!', 'Jacques a dit ! Touche une carte, et je le fais !', cards, byTier(tier, 2, 3, 4), ['seal_clap', 'seal_dive', 'seal_whiskers', 'sleep'], { onCorrect: ['Clap, clap! You are a great boss!', 'Clap, clap ! Tu es une super cheffe !'] }),
      tap('actor', "I'm tired. Let's rest on the snow! Touch the snow!", 'J’ai sommeil. Reposons-nous sur la neige ! Touche la neige !', snow.id, ['Find the snow!', 'Cherche la neige !'], ['snow', 'tired']),
      moveTo(snow.id, 'rest'),
      say('actor', 'Ahh! I rest on the snow. What a nice rest!', 'Ahh ! Je me repose sur la neige. Quel bon repos !', {}, 'calm'),
      back(),
      ask('actor', 'A baby seal is a…', 'Un bébé phoque, c’est un…', [ok('A pup!', 'Un bébé phoque !', '🦭'), no('A chick!', 'Un poussin !', '🐣'), no('A cub!', 'Un ourson !', '🧸')], ['A little seal!', 'Un petit phoque !'], ['seal_pup', 'baby'], {
        minTier: 'intermediate',
        onCorrect: ['Yes! A baby seal is a pup!', 'Oui ! Un bébé phoque, en anglais, c’est un « pup » !'],
      }),
      say(other.speaker, "I'm a little pup! Clap, clap, clap!", 'Je suis un petit bébé phoque ! Clap, clap, clap !', { minTier: 'intermediate', needs: other.needs }, 'happy'),
      ask('actor', 'Under the ice, I need air! Where do I breathe?', "Sous la glace, j'ai besoin d'air ! Où est-ce que je respire ?", [ok('At a breathing hole!', 'À un trou dans la glace !', '🕳️'), no('In a tree!', 'Dans un arbre !', '🌳'), no('In a nest!', 'Dans un nid !', '🪺')], ['A hole in the ice!', 'Un trou dans la glace !'], ['seal_hole'], {
        minTier: 'expert',
        onCorrect: ['Yes! A breathing hole in the ice! I pop up and breathe!', 'Oui ! Un trou dans la glace ! Je sors la tête et je respire !'],
      }),
      ask('actor', `Look at ${par.name.en}! Does ${par.he.en} have whiskers?`, `Regarde ${par.name.fr} ! Est-ce qu'${par.he.fr} a des moustaches ?`, [ok(`Yes, ${par.does.en}!`, `Oui, ${par.does.fr} !`, '👍'), no(`No, ${par.he.en} doesn't!`, `Non !`, '👎')], [`Look at ${par.name.en}'s face!`, `Regarde le visage de ${par.name.fr} !`], ['seal_whiskers', par.who === 'father' ? 'he_is' : 'she_is'], {
        minTier: 'expert',
        keepOrder: true,
        onCorrect: [`Yes! ${cap(par.he.en)} has long whiskers too!`, `Oui ! ${cap(par.he.fr)} a de longues moustaches, ${par.who === 'father' ? 'lui' : 'elle'} aussi !`],
      }),
      end('actor', 'Clap, clap, clap! You are a super seal friend!', 'Clap, clap, clap ! Tu es une super amie des phoques !'),
    ];
  },
  memoryEvent: () => 'seal_whiskers',
};

// ---------------------------------------------------------------------------
// L'ours polaire — « White like the snow » : la fourrure blanche (white fur), le nez noir,
// les empreintes à compter, se rouler dans la neige, nager en pagayant (paddle), l'ourson (cub)
// ---------------------------------------------------------------------------

export const polarBearFur: ActivityDef = {
  id: 'polar_bear_fur',
  choices: (c) => (c.species.id === 'polar_bear' && snowOf(c) ? ['fur'] : []),
  build(c, tier) {
    const snow = snowOf(c);
    if (!snow) return undefined;
    const sea = anchor(c.place, 'sea');
    const land = landSpots(c.place);
    const n = byTier(tier, 3, 4, 5);
    // les empreintes dans la neige : seulement sur le sol (jamais dans l'eau)
    const prints = land.length >= n ? land.slice(0, n).map((s, i) => prop(`print${i}`, 'footprint', s)) : [];
    const par = otherParent(c);
    const other = otherBaby(c);
    const cards: CommandOption[] = [
      card('Roll in the snow!', 'Roule-toi dans la neige !', '❄️', L('Roll, roll, roll! I love the snow!', "Je roule, je roule ! J'adore la neige !"), 'dance'),
      card('Run!', 'Cours !', '🏃', L('Zoom! I run in the snow!', 'Zoum ! Je cours dans la neige !'), 'run'),
      card('Hop!', 'Sautille !', '🐇', L("Ha ha! Polar bears can't hop!", 'Ha ha ! Les ours polaires ne sautillent pas !')),
      sea
        ? card('Paddle!', 'Pagaie !', '🏊', L('Paddle, paddle! I swim with my big paws!', 'Je pagaie avec mes grosses pattes ! Je nage !'), 'swim')
        : card('Wave your paw!', 'Fais coucou avec ta patte !', '👋', L('Hello! Look at my big white paw!', 'Coucou ! Regarde ma grosse patte blanche !'), 'wave'),
      card('Sleep!', 'Dors !', '😴', L('Zzz… I sleep in the snow!', 'Zzz… Je dors dans la neige !'), 'sleep'),
    ];
    const steps: QuestStep[] = [
      isBaby(c)
        ? say('actor', "I'm a polar bear cub! My fur is white, like the snow!", 'Je suis un ourson polaire ! Ma fourrure est blanche, comme la neige !', {}, 'happy')
        : say('actor', "I'm a polar bear! My fur is white, like the snow!", 'Je suis un ours polaire ! Ma fourrure est blanche, comme la neige !', {}, 'proud'),
      ask('actor', 'What colour is my fur?', 'De quelle couleur est ma fourrure ?', [ok('White!', 'Blanche !', '⚪'), no('Pink!', 'Rose !', '🩷'), no('Green!', 'Verte !', '🟢'), no('Blue!', 'Bleue !', '🔵')], ['Like the snow!', 'Comme la neige !'], ['polar_bear_fur', 'white'], {
        onCorrect: ['Yes! White fur! It keeps me warm!', 'Oui ! Une fourrure blanche ! Elle me tient chaud !'],
      }),
      ask('actor', 'And my nose? What colour is it?', 'Et mon nez ? De quelle couleur est-il ?', [ok("It's black!", 'Il est noir !', '⚫'), no("It's white!", 'Il est blanc !', '⚪'), no("It's yellow!", 'Il est jaune !', '🟡')], ['Look at my nose!', 'Regarde mon nez !'], ['polar_bear_nose'], {
        onCorrect: ['Yes! A black nose, and white fur!', 'Oui ! Un nez noir, et une fourrure blanche !'],
      }),
    ];
    if (prints.length) {
      steps.push(
        props(prints),
        tapProps('actor', 'Look! Big paw prints in the snow! Touch the footprints!', 'Regarde ! Des traces de grosses pattes dans la neige ! Touche les empreintes !', prints.map((p) => p.id), ['Touch every footprint!', 'Touche chaque empreinte !'], ['footprint', 'count'], {
          count: true,
          onCorrect: L(`${NUMBERS[n]!.en} footprints! Big paws, big footprints!`, `${NUMBERS[n]!.fr} empreintes ! Grosses pattes, grosses empreintes !`),
        }),
        ask('actor', 'How many footprints?', "Combien d'empreintes ?", numberOptions(n), ['Count again!', 'Recompte !'], [numberId(n), 'how_many'], {
          minTier: 'intermediate',
          onCorrect: L(`Yes! ${NUMBERS[n]!.en} footprints!`, `Oui ! ${NUMBERS[n]!.fr} empreintes !`),
        }),
        clearProps(),
      );
    }
    steps.push(
      tap('actor', "Let's roll in the snow! Touch the snow!", 'Roulons-nous dans la neige ! Touche la neige !', snow.id, ['Find the snow!', 'Cherche la neige !'], ['snow', 'polar_bear_roll']),
      moveTo(snow.id, 'rest'),
      act('actor', 'dance', 'Roll, roll, roll in the snow! Now my fur is clean and white!', 'Je roule, je roule dans la neige ! Maintenant ma fourrure est propre et blanche !'),
      back(),
      say('actor', "I'm a great swimmer! I paddle with my big front paws.", 'Je nage très bien ! Je pagaie avec mes grosses pattes de devant.', {}, 'proud'),
      ask('actor', 'What do polar bears eat?', 'Que mangent les ours polaires ?', [ok('Fish!', 'Du poisson !', '🐟'), no('Bananas!', 'Des bananes !', '🍌'), no('Grass!', "De l'herbe !", '🌾')], ['I find it in the sea!', 'Je le trouve dans la mer !'], ['fish', 'eat'], {
        onCorrect: ['Yes! I love fish! Yum!', "Oui ! J'adore le poisson ! Miam !"],
      }),
      command('actor', 'Simon says! Touch a card, and I do it!', 'Jacques a dit ! Touche une carte, et je le fais !', cards, byTier(tier, 2, 3, 4), ['polar_bear_roll', 'run', 'sleep', sea ? 'polar_bear_paddle' : 'wave'], { onCorrect: ['What a strong polar bear!', 'Quel ours polaire costaud !'] }),
      ask('actor', 'A baby polar bear is a…', 'Un bébé ours polaire, c’est un…', [ok('A cub!', 'Un ourson !', '🧸'), no('A chick!', 'Un poussin !', '🐣'), no('A pup!', 'Un bébé phoque !', '🦭')], ['A little bear!', 'Un petit ours !'], ['polar_bear_cub', 'baby'], {
        minTier: 'intermediate',
        onCorrect: ['Yes! A baby polar bear is a cub!', 'Oui ! Un bébé ours polaire, c’est un ourson !'],
      }),
      say(other.speaker, "I'm a little cub! My fur is white too!", 'Je suis un petit ourson ! Ma fourrure est blanche, à moi aussi !', { minTier: 'intermediate', needs: other.needs }, 'happy'),
      ask('actor', 'Can polar bears swim?', 'Est-ce que les ours polaires savent nager ?', [ok('Yes, they can!', 'Oui !', '👍'), no("No, they can't!", 'Non !', '👎')], ['Paddle, paddle!', 'Ils pagaient avec leurs pattes !'], ['can', 'swim', 'polar_bear_paddle'], {
        minTier: 'expert',
        keepOrder: true,
        onCorrect: ['Yes! Polar bears can swim! They paddle with their big paws!', 'Oui ! Les ours polaires savent nager ! Ils pagaient avec leurs grosses pattes !'],
      }),
      ask('actor', `Look at ${par.name.en}! Is ${par.he.en} big or small?`, `Regarde ${par.name.fr} ! ${cap(par.he.fr)} est grand${par.who === 'mother' ? 'e' : ''} ou petit${par.who === 'mother' ? 'e' : ''} ?`, [ok(`${cap(par.he.en)} is big!`, `${cap(par.he.fr)} est grand${par.who === 'mother' ? 'e' : ''} !`, '🐻‍❄️'), no(`${cap(par.he.en)} is small!`, `${cap(par.he.fr)} est petit${par.who === 'mother' ? 'e' : ''} !`, '🐭')], [`Look at ${par.name.en}!`, `Regarde ${par.name.fr} !`], ['big', 'small', par.who === 'father' ? 'he_is' : 'she_is'], {
        minTier: 'expert',
        keepOrder: true,
        onCorrect: [`Yes! ${cap(par.he.en)} is very big, with big white paws!`, `Oui ! ${cap(par.he.fr)} est très grand${par.who === 'mother' ? 'e' : ''}, avec de grosses pattes blanches !`],
      }),
      end('actor', 'White fur, black nose… you are a great polar bear friend!', 'Fourrure blanche, nez noir… tu es une super amie des ours polaires !'),
    );
    return steps;
  },
  memoryEvent: () => 'polar_bear_fur',
};

export const ANTARCTICA_SPECIES_ACTIVITIES: readonly ActivityDef[] = [penguinWaddle, sealWhiskers, polarBearFur];
