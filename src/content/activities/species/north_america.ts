import { NUMBERS } from '../../props';
import type { ActivityCtx, ActivityDef, CommandOption, Line, QuestStep, Tier } from '../../types';
import { numberId, numberOptions } from '../games';
import { act, anchor, ask, clearProps, command, end, hash, L, landSpots, no, ok, prop, props, say, tap, tapActor, tapProps } from '../kit';

/**
 * Déroulé des jeux propres aux espèces de ce continent (voir `north_america.arch.ts`), 2026-11-21.
 * - l'ours : paws, claws, fur, sniff, honey, den (et stand up tall, growl) ;
 * - le bison : horns, hump, herd, stomp, dust ;
 * - le castor : teeth, chew, sticks, dam, flat tail, slap, lodge.
 * Chaque jeu marche dans tous les décors de l'espèce ; les objets ne sont posés que sur la terre ferme.
 */

const byTier = <T>(tier: Tier, b: T, i: T, e: T): T => (tier === 'beginner' ? b : tier === 'intermediate' ? i : e);
const num = (n: number) => NUMBERS[n]!;
const card = (en: string, fr: string, icon: string, reply: Line, action?: CommandOption['action']): CommandOption => ({ line: L(en, fr), icon, reply, ...(action ? { action } : {}) });

/**
 * n emplacements au sol, dans un ordre stable propre au jeu et au lieu : jamais dans l'eau dessinée,
 * ni dans une zone d'eau du décor (cascade, lac, reflet, mer).
 */
function ground(c: ActivityCtx, n: number, salt: string, min = n): number[] | undefined {
  const wetHits = c.place.anchors.filter((a) => a.tags?.includes('water') || a.tags?.includes('sea')).map((a) => a.hit);
  const land = landSpots(c.place).filter((i) => {
    const s = c.place.spots[i]!;
    return !wetHits.some((h) => s.x >= h.x && s.x <= h.x + h.w && s.y >= h.y && s.y <= h.y + h.h);
  });
  if (land.length < min) return undefined;
  const start = hash(`${salt}:${c.place.id}`) % land.length;
  return [...land.slice(start), ...land.slice(0, start)].slice(0, n);
}

/** Le décor montre de l'eau (lac, mare, mer) : le castor peut y taper de la queue. */
const wet = (c: ActivityCtx) => c.place.anchors.some((a) => a.tags?.includes('water') || a.tags?.includes('sea'));

/** « Can … fly / climb? » : la réponse est toujours non pour cette espèce. */
function cantAsk(can: Line, question: Line, answer: Line): QuestStep {
  return ask('actor', `${can.en} ${question.en}`, `${can.fr} ${question.fr}`, [ok("No, they can't!", 'Non, ils ne savent pas !', '🚫'), no('Yes, they can!', 'Oui, ils savent !', '✅')], ['Think! Can they?', 'Réfléchis ! Ils savent ?'], ['can', 'cant'], { minTier: 'expert', keepOrder: true, onCorrect: answer });
}

/** Expert : « Daddy, … ! » puis « What is he doing? », et pareil avec Maman. */
function parentsDo(
  dad: { order: Line; action: CommandOption['action'] & string; reply: Line; doing: Line; wrong: [Line, string][]; item: string },
  mum: { order: Line; action: CommandOption['action'] & string; reply: Line; doing: Line; wrong: [Line, string][]; item: string },
  icon: [string, string],
): QuestStep[] {
  const gate = { minTier: 'expert' as const };
  return [
    tapActor('narrator', dad.order, 'father', dad.action, dad.reply, L('Not me! Find Daddy!', 'Pas moi ! Trouve Papa !'), L('Touch Daddy!', 'Touche Papa !'), [dad.item, 'dad'], gate),
    ask('narrator', 'Look at Daddy! What is he doing?', "Regarde Papa ! Qu'est-ce qu'il fait ?", [ok(dad.doing.en, dad.doing.fr, icon[0]), ...dad.wrong.map(([l, i]) => no(l.en, l.fr, i))], ['Look at Daddy!', 'Regarde Papa !'], ['he_is', 'doing'], { ...gate, onCorrect: L(`Yes! ${dad.doing.en}`, `Oui ! ${dad.doing.fr}`) }),
    tapActor('narrator', mum.order, 'mother', mum.action, mum.reply, L('Not me! Find Mummy!', 'Pas moi ! Trouve Maman !'), L('Touch Mummy!', 'Touche Maman !'), [mum.item, 'mum'], gate),
    ask('narrator', 'Look at Mummy! What is she doing?', "Regarde Maman ! Qu'est-ce qu'elle fait ?", [ok(mum.doing.en, mum.doing.fr, icon[1]), ...mum.wrong.map(([l, i]) => no(l.en, l.fr, i))], ['Look at Mummy!', 'Regarde Maman !'], ['she_is', 'doing'], { ...gate, onCorrect: L(`Yes! ${mum.doing.en}`, `Oui ! ${mum.doing.fr}`) }),
  ];
}

// ---------------------------------------------------------------------------
// L'ours — « Sniff, sniff! Honey! » : les grosses pattes, les griffes pour grimper, la fourrure
// douce, le nez qui renifle le miel (et les baies), la tanière pour l'hiver. Rien de cruel :
// pas de pêche, l'ours mange du miel et des baies.
// ---------------------------------------------------------------------------

export const bearHoney: ActivityDef = {
  id: 'bear_honey',
  choices: (c) => (c.species.id === 'bear' ? ['honey'] : []),
  build(c, tier) {
    const s = ground(c, 5, 'bear_honey');
    if (!s) return undefined;
    const notHoney = (en: string, fr: string, berries: boolean): Line =>
      berries ? L(`I don't eat ${en}! I eat honey and berries!`, `Je ne mange pas ${fr} ! Je mange du miel et des baies !`) : L(`I don't eat ${en}! I eat honey!`, `Je ne mange pas ${fr} ! Je mange du miel !`);
    return [
      say('actor', 'Hello! Look at my big paws!', 'Coucou ! Regarde mes grosses pattes !', {}, 'happy'),
      ask('actor', 'What are these?', "Qu'est-ce que c'est ?", [ok('Paws!', 'Des pattes !', '🐾'), no('Wings!', 'Des ailes !', '🐦'), no('Fins!', 'Des nageoires !', '🐟')], ['Look at my feet!', 'Regarde mes pieds !'], ['bear_paws', 'big'], { onCorrect: ['Yes! Big bear paws!', "Oui ! De grosses pattes d'ours !"] }),
      ask('actor', "Look! What's on my paws?", "Regarde ! Qu'est-ce qu'il y a au bout de mes pattes ?", [ok('Long claws!', 'De longues griffes !', '🐻'), no('Feathers!', 'Des plumes !', '🪶'), no('Shells!', 'Des coquillages !', '🐚')], ['Look at the end of my paws!', 'Regarde le bout de mes pattes !'], ['bear_claws', 'long'], { onCorrect: ['Yes! Long claws! They help me climb.', "Oui ! De longues griffes ! Elles m'aident à grimper."] }),
      act('actor', 'climb', 'Up, up, up! I can climb!', 'Hop, hop, hop ! Je sais grimper !', 'actor'),
      ask('actor', 'Touch my fur! Is it soft?', 'Touche ma fourrure ! Elle est douce ?', [ok('Yes! Soft fur!', 'Oui ! Une fourrure douce !', '🧸'), no("No, it's spiky!", 'Non, elle pique !', '🌵')], ['Touch it! So soft!', 'Touche ! Trop douce !'], ['bear_fur'], { onCorrect: ['Soft and warm! I love my fur.', "Douce et chaude ! J'adore ma fourrure."] }),
      say('actor', 'Sniff, sniff! I smell something sweet!', 'Snif, snif ! Ça sent le sucré !', {}, 'curious'),
      // le miel (et les baies dès le niveau intermédiaire) ; de l'herbe et du bambou, que l'ours ne mange pas
      props([prop('h', 'honey', s[0]!), prop('g', 'grass', s[1]!)], { maxTier: 'beginner' }),
      props([prop('h', 'honey', s[0]!), prop('b1', 'berries', s[1]!), prop('g', 'grass', s[2]!), prop('b2', 'berries', s[3]!), prop('bb', 'bamboo', s[4]!)], { minTier: 'intermediate' }),
      tapProps('actor', 'Sniff, sniff! Find the honey!', 'Snif, snif ! Trouve le miel !', ['h'], ['Honey is sweet and yellow!', 'Le miel est doux et jaune !'], ['honey', 'bear_sniff'], {
        maxTier: 'beginner',
        wrong: { g: notHoney('grass', "d'herbe", false) },
        onCorrect: ['Yes! Honey! Yum!', 'Oui ! Du miel ! Miam !'],
      }),
      tapProps('actor', 'I eat honey and berries! Find the honey and the berries!', 'Je mange du miel et des baies ! Trouve le miel et les baies !', ['h', 'b1', 'b2'], ['Sniff, sniff! Honey and berries!', 'Snif, snif ! Du miel et des baies !'], ['honey', 'berries', 'bear_sniff'], {
        minTier: 'intermediate',
        count: true,
        wrong: { g: notHoney('grass', "d'herbe", true), bb: notHoney('bamboo', 'de bambou', true) },
        onCorrect: ['Yum! Honey and berries!', 'Miam ! Du miel et des baies !'],
      }),
      act('actor', 'eat', 'Yum, yum! Sweet honey!', 'Miam, miam ! Le miel, c’est doux !', 'actor'),
      clearProps(),
      ask('actor', 'Where do I find honey?', 'Où est-ce que je trouve du miel ?', [ok('In a tree!', 'Dans un arbre !', '🌳'), no('In the sea!', 'Dans la mer !', '🌊'), no('Under the sand!', 'Sous le sable !', '🏖️')], ['The bees live in a tree!', 'Les abeilles vivent dans un arbre !'], ['tree', 'where'], {
        minTier: 'intermediate',
        onCorrect: ['Yes! The bees make honey in a tree.', 'Oui ! Les abeilles font le miel dans un arbre.'],
      }),
      command('actor', 'Your turn! Touch a card, and I do it!', 'À toi ! Touche une carte, et je le fais !', [
        card('Stand up tall!', 'Dresse-toi !', '🧍', L('Look! I stand up tall!', 'Regarde ! Je me dresse !'), 'climb'),
        card('Growl!', 'Grogne !', '🐻', L('Grrr! Grrr!', 'Grrr ! Grrr !'), 'roar'),
        card('Climb a tree!', 'Grimpe à un arbre !', '🌲', L('Up, up, up!', 'Hop, hop, hop !'), 'climb'),
        card('Go to sleep!', 'Va dormir !', '😴', L('Zzz! Zzz!', 'Zzz ! Zzz !'), 'sleep'),
        card('Fly!', 'Vole !', '🐦', L("Ha, ha! Bears can't fly!", 'Ha, ha ! Les ours ne volent pas !')),
      ], byTier(tier, 1, 2, 3), ['bear_stand', 'bear_growl', 'climb', 'sleep'], { minTier: 'intermediate', onCorrect: ['What a strong bear!', 'Quel ours costaud !'] }),
      cantAsk(L('Bears can climb and swim.', 'Les ours savent grimper et nager.'), L('Can bears fly?', 'Est-ce que les ours savent voler ?'), L("That's right! Bears can't fly!", "C'est ça ! Les ours ne savent pas voler !")),
      ...parentsDo(
        { order: L('Daddy, stand up tall!', 'Papa, dresse-toi !'), action: 'climb', reply: L('Look at me! I stand up tall!', 'Regarde-moi ! Je me dresse !'), doing: L("He's standing up tall!", 'Il se dresse !'), wrong: [[L("He's flying!", 'Il vole !'), '🐦'], [L("He's sleeping!", 'Il dort !'), '😴']], item: 'bear_stand' },
        { order: L('Mummy, growl!', 'Maman, grogne !'), action: 'roar', reply: L('Grrr! Grrr!', 'Grrr ! Grrr !'), doing: L("She's growling!", 'Elle grogne !'), wrong: [[L("She's singing!", 'Elle chante !'), '🎵'], [L("She's swimming!", 'Elle nage !'), '🏊']], item: 'bear_growl' },
        ['🧍', '🐻'],
      ),
      ask('actor', 'Where do bears sleep in winter?', 'Où dorment les ours en hiver ?', [ok('In a den!', 'Dans une tanière !', '🕳️'), no('In a nest!', 'Dans un nid !', '🪺'), no('In the water!', "Dans l'eau !", '💧')], ['A den is a cosy cave.', "Une tanière, c'est une grotte douillette."], ['bear_den', 'sleep', 'where'], {
        onCorrect: ['Yes! In my cosy den. Shh!', 'Oui ! Dans ma tanière douillette. Chut !'],
      }),
      act('actor', 'sleep', 'Yawn! A big winter sleep in my den!', 'Ahhh ! Un grand dodo d’hiver dans ma tanière !', 'actor'),
      end('actor', 'Thank you, friend! A big bear hug!', "Merci ! Un gros câlin d'ours !"),
    ];
  },
  memoryEvent: () => 'bear_found_honey',
};

// ---------------------------------------------------------------------------
// Le bison — « The bison herd » : les cornes, la bosse sur le dos, le troupeau qu'on compte,
// l'herbe qu'il broute, les sabots qui tapent et la roulade dans la poussière.
// ---------------------------------------------------------------------------

export const bisonHerd: ActivityDef = {
  id: 'bison_herd',
  choices: (c) => (c.species.id === 'bison' ? ['herd'] : []),
  build(c, tier) {
    const deer = tier !== 'beginner';
    // 3, 4 ou 5 bisons selon le niveau (moins si le décor a peu de terre ferme, au moins 3)
    const s = ground(c, byTier(tier, 3, 4, 5) + (deer ? 1 : 0), 'bison_herd', 3 + (deer ? 1 : 0));
    if (!s) return undefined;
    const n = s.length - (deer ? 1 : 0);
    const herd = Array.from({ length: n }, (_, i) => prop(`bison${i}`, 'bison', s[i]!));
    const shown = deer ? [...herd, prop('deer', 'deer', s[n]!)] : herd;
    return [
      say('actor', 'Hello! Look at me! Bison are big and strong!', 'Coucou ! Regarde-moi ! Les bisons sont grands et forts !', {}, 'happy'),
      ask('actor', 'Look at my head! What are these?', "Regarde ma tête ! Qu'est-ce que c'est ?", [ok('Horns!', 'Des cornes !', '🐂'), no('Wings!', 'Des ailes !', '🐦'), no('A trunk!', 'Une trompe !', '🐘')], ['Look at my head!', 'Regarde ma tête !'], ['bison_horns'], { onCorrect: ['Yes! Two big horns!', 'Oui ! Deux grandes cornes !'] }),
      ask('actor', 'I have a big hump. Where is my hump?', "J'ai une grosse bosse. Où est ma bosse ?", [ok('On your back!', 'Sur ton dos !', '🦬'), no('On your nose!', 'Sur ton nez !', '👃'), no('On your tail!', 'Sur ta queue !', '〰️')], ['Look at my back!', 'Regarde mon dos !'], ['bison_hump', 'where'], { onCorrect: ['Yes! My hump is on my back!', 'Oui ! Ma bosse est sur mon dos !'] }),
      say('actor', 'Look! Here comes my herd!', 'Regarde ! Voilà mon troupeau !', {}, 'curious'),
      props(shown),
      tapProps('actor', "Let's count my herd! Touch every bison!", 'Comptons mon troupeau ! Touche chaque bison !', herd.map((h) => h.id), ['Touch every bison!', 'Touche chaque bison !'], ['bison_herd', 'bison', 'count'], {
        count: true,
        ...(deer ? { wrong: { deer: L("That's a deer! It's not a bison.", "C'est un cerf ! Ce n'est pas un bison.") } } : {}),
        onCorrect: L(`${num(n).en} bison! What a big herd!`, `${num(n).fr} bisons ! Quel grand troupeau !`),
      }),
      ask('actor', 'How many bison?', 'Combien de bisons ?', numberOptions(n), ['Count again!', 'Recompte !'], [numberId(n), 'how_many'], { minTier: 'intermediate', onCorrect: L(`Yes! ${num(n).en} bison!`, `Oui ! ${num(n).fr} bisons !`) }),
      act('actor', 'run', "Let's run with the herd! Thud, thud, thud!", 'On court avec le troupeau ! Boum, boum, boum !', 'actor'),
      clearProps(),
      ask('actor', "I'm hungry! What do I eat?", "J'ai faim ! Qu'est-ce que je mange ?", [ok('Grass!', "De l'herbe !", '🌾'), no('Fish!', 'Du poisson !', '🐟'), no('Meat!', 'De la viande !', '🍖')], ['I eat green food!', 'Je mange quelque chose de vert !'], ['grass', 'hungry', 'eat'], { onCorrect: ["Yes! I eat grass. Munch, munch!", "Oui ! Je mange de l'herbe. Miam, miam !"] }),
      act('actor', 'eat', 'Munch, munch! Yummy grass!', "Miam, miam ! Elle est bonne, l'herbe !", 'actor'),
      command('actor', 'Your turn! Touch a card, and I do it!', 'À toi ! Touche une carte, et je le fais !', [
        card('Stomp your hooves!', 'Tape des sabots !', '🦶', L('Stomp, stomp, stomp!', 'Boum, boum, boum !'), 'dig'),
        card('Roll in the dust!', 'Roule-toi dans la poussière !', '💨', L('Roll, roll! I love the dust!', "Je roule, je roule ! J'adore la poussière !"), 'dance'),
        card('Run!', 'Cours !', '🏃', L('Thud, thud, thud!', 'Pam, pam, pam !'), 'run'),
        card('Climb a tree!', 'Grimpe à un arbre !', '🌲', L("Ha, ha! Bison can't climb!", 'Ha, ha ! Les bisons ne grimpent pas !')),
      ], byTier(tier, 2, 3, 3), ['bison_stomp', 'bison_dust', 'run'], { onCorrect: ['What a strong bison!', 'Quel bison costaud !'] }),
      cantAsk(L('Bison can run fast.', 'Les bisons savent courir vite.'), L('Can bison climb trees?', 'Est-ce que les bisons savent grimper aux arbres ?'), L("That's right! Bison can't climb!", "C'est ça ! Les bisons ne savent pas grimper !")),
      ...parentsDo(
        { order: L('Daddy, stomp your hooves!', 'Papa, tape des sabots !'), action: 'dig', reply: L('Stomp, stomp!', 'Boum, boum !'), doing: L("He's stomping!", 'Il tape des sabots !'), wrong: [[L("He's swimming!", 'Il nage !'), '🏊'], [L("He's flying!", 'Il vole !'), '🐦']], item: 'bison_stomp' },
        { order: L('Mummy, roll in the dust!', 'Maman, roule-toi dans la poussière !'), action: 'dance', reply: L('Roll, roll! What fun!', 'Je roule, je roule ! Trop drôle !'), doing: L("She's rolling in the dust!", 'Elle se roule dans la poussière !'), wrong: [[L("She's sleeping!", 'Elle dort !'), '😴'], [L("She's eating!", 'Elle mange !'), '🌾']], item: 'bison_dust' },
        ['🦶', '💨'],
      ),
      end('actor', 'Thank you! Now you are in my herd!', 'Merci ! Maintenant, tu fais partie de mon troupeau !'),
    ];
  },
  memoryEvent: () => 'bison_counted_herd',
};

// ---------------------------------------------------------------------------
// Le castor — « The beaver's dam » : les grandes dents qui rongent le bois, les branches à
// ramasser et à compter, le barrage, la queue plate qui tape, la hutte (lodge) à la porte sous l'eau.
// ---------------------------------------------------------------------------

export const beaverDam: ActivityDef = {
  id: 'beaver_dam',
  choices: (c) => (c.species.id === 'beaver' ? ['dam'] : []),
  build(c, tier) {
    const cone = tier !== 'beginner';
    // 3, 4 ou 5 branches selon le niveau (moins si le décor a peu de terre ferme, au moins 3)
    const s = ground(c, byTier(tier, 3, 4, 5) + (cone ? 1 : 0), 'beaver_dam', 3 + (cone ? 1 : 0));
    if (!s) return undefined;
    const n = s.length - (cone ? 1 : 0);
    const sticks = Array.from({ length: n }, (_, i) => prop(`stick${i}`, 'stick', s[i]!));
    const shown = cone ? [...sticks, prop('cone', 'pinecone', s[n]!)] : sticks;
    const water = wet(c);
    const slap = water ? ('splash' as const) : ('dance' as const);
    const lodge = anchor(c.place, 'lodge');
    return [
      say('actor', 'Hello! Beavers are busy! Look at my big teeth!', 'Coucou ! Les castors travaillent beaucoup ! Regarde mes grandes dents !', {}, 'happy'),
      ask('actor', 'Look at my face! What can you see?', "Regarde ma tête ! Qu'est-ce que tu vois ?", [ok('Big teeth!', 'De grandes dents !', '🦷'), no('A beak!', 'Un bec !', '🐦'), no('A trunk!', 'Une trompe !', '🐘')], ['Look at my mouth!', 'Regarde ma bouche !'], ['beaver_teeth', 'big', 'beaver_chew'], { onCorrect: ['Yes! Big teeth to chew wood!', 'Oui ! De grandes dents pour ronger le bois !'] }),
      act('actor', 'eat', 'Chomp, chomp! I chew the wood!', 'Crac, crac ! Je ronge le bois !', 'actor'),
      say('actor', 'I need sticks for my dam!', "J'ai besoin de branches pour mon barrage !", {}, 'curious'),
      props(shown),
      tapProps('actor', 'Find the sticks! Touch every stick!', 'Trouve les branches ! Touche chaque branche !', sticks.map((x) => x.id), ['Touch every stick!', 'Touche chaque branche !'], ['stick', 'count'], {
        count: true,
        ...(cone ? { wrong: { cone: L("That's a pine cone! I need sticks.", "C'est une pomme de pin ! J'ai besoin de branches.") } } : {}),
        onCorrect: L(`${num(n).en} sticks! Thank you!`, `${num(n).fr} branches ! Merci !`),
      }),
      ask('actor', 'How many sticks?', 'Combien de branches ?', numberOptions(n), ['Count again!', 'Recompte !'], [numberId(n), 'how_many'], { minTier: 'intermediate', onCorrect: L(`Yes! ${num(n).en} sticks!`, `Oui ! ${num(n).fr} branches !`) }),
      ask('actor', 'What do beavers build with sticks?', "Qu'est-ce que les castors construisent avec des branches ?", [ok('A dam!', 'Un barrage !', '🪵'), no('A sandcastle!', 'Un château de sable !', '🏰'), no('A nest!', 'Un nid !', '🪺')], ['A dam stops the water!', "Un barrage arrête l'eau !"], ['beaver_dam'], { onCorrect: ['Yes! A dam! It stops the water.', "Oui ! Un barrage ! Il arrête l'eau."] }),
      act('actor', 'dig', 'Push, pull, push! I build my dam!', 'Je pousse, je tire ! Je construis mon barrage !', 'actor'),
      clearProps(),
      ask('actor', 'Look at my tail! Is it flat or round?', 'Regarde ma queue ! Elle est plate ou ronde ?', [ok('Flat!', 'Plate !', '🥞'), no('Round!', 'Ronde !', '⚪')], ['Look at my big tail!', 'Regarde ma grande queue !'], ['beaver_tail'], { keepOrder: true, onCorrect: ['Yes! A big flat tail!', 'Oui ! Une grande queue plate !'] }),
      water
        ? act('actor', 'splash', 'Slap! Splash! I slap my tail on the water!', "Clac ! Plouf ! Je tape l'eau avec ma queue !", 'actor')
        : act('actor', 'dance', 'Slap, slap! I slap my flat tail!', 'Clac, clac ! Je tape avec ma queue plate !', 'actor'),
      lodge
        ? tap('actor', 'And this is my home! Touch my lodge!', 'Et voici ma maison ! Touche ma hutte !', lodge.id, ['My lodge is made of sticks!', 'Ma hutte est faite de branches !'], ['lodge', 'where'], { onCorrect: ['Yes! My lodge! Sticks and mud!', 'Oui ! Ma hutte ! Des branches et de la boue !'] })
        : ask('actor', 'Where do I live?', "Où est-ce que j'habite ?", [ok('In a lodge!', 'Dans une hutte !', '🛖'), no('In a tree!', 'Dans un arbre !', '🌳'), no('In a cave!', 'Dans une grotte !', '🕳️')], ['My home is made of sticks!', 'Ma maison est faite de branches !'], ['lodge', 'where'], { onCorrect: ['Yes! A lodge made of sticks!', 'Oui ! Une hutte faite de branches !'] }),
      ask('actor', 'My lodge has a door. Where is the door?', 'Ma hutte a une porte. Où est la porte ?', [ok('Under the water!', "Sous l'eau !", '💧'), no('On the roof!', 'Sur le toit !', '🏠'), no('In the sky!', 'Dans le ciel !', '☁️')], ['Beavers swim to the door!', "Les castors nagent jusqu'à la porte !"], ['lodge', 'where'], {
        minTier: 'intermediate',
        onCorrect: ['Yes! Under the water! I swim in.', "Oui ! Sous l'eau ! J'entre en nageant."],
      }),
      command('actor', 'Your turn! Touch a card, and I do it!', 'À toi ! Touche une carte, et je le fais !', [
        card('Slap your tail!', 'Tape avec ta queue !', '🦫', L('Slap! Slap!', 'Clac ! Clac !'), slap),
        card('Chew wood!', 'Ronge du bois !', '🪵', L('Chomp, chomp!', 'Crac, crac !'), 'eat'),
        card('Dig!', 'Creuse !', '⛏️', L('Dig, dig, dig!', 'Je creuse, je creuse !'), 'dig'),
        ...(water ? [card('Swim!', 'Nage !', '🏊', L('Splash! I love the water!', "Plouf ! J'adore l'eau !"), 'swim')] : []),
        card('Climb a tree!', 'Grimpe à un arbre !', '🌲', L("Oh no! Beavers can't climb!", 'Oh non ! Les castors ne grimpent pas !')),
      ], byTier(tier, 2, 3, 3), ['beaver_slap', 'beaver_chew', 'dig'], { onCorrect: ['What a busy beaver!', 'Quel castor travailleur !'] }),
      cantAsk(L('Beavers can swim and dig.', 'Les castors savent nager et creuser.'), L('Can beavers climb trees?', 'Est-ce que les castors savent grimper aux arbres ?'), L("That's right! Beavers can't climb!", "C'est ça ! Les castors ne savent pas grimper !")),
      ...parentsDo(
        { order: L('Daddy, slap your tail!', 'Papa, tape avec ta queue !'), action: slap, reply: L('Slap! Slap!', 'Clac ! Clac !'), doing: L("He's slapping his tail!", 'Il tape avec sa queue !'), wrong: [[L("He's flying!", 'Il vole !'), '🐦'], [L("He's sleeping!", 'Il dort !'), '😴']], item: 'beaver_slap' },
        { order: L('Mummy, chew wood!', 'Maman, ronge du bois !'), action: 'eat', reply: L('Chomp, chomp!', 'Crac, crac !'), doing: L("She's chewing wood!", 'Elle ronge du bois !'), wrong: [[L("She's singing!", 'Elle chante !'), '🎵'], [L("She's climbing!", 'Elle grimpe !'), '🌲']], item: 'beaver_chew' },
        ['🦫', '🪵'],
      ),
      end('actor', 'Thank you! What a great dam!', 'Merci ! Quel beau barrage !'),
    ];
  },
  memoryEvent: () => 'beaver_built_dam',
};

export const NORTH_AMERICA_SPECIES_ACTIVITIES: readonly ActivityDef[] = [bearHoney, bisonHerd, beaverDam];
