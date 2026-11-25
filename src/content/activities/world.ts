/**
 * Jeux propres aux décors des six autres continents (2026-11-21), sur le modèle du pilote Afrique,
 * et les trois jeux de révision du graphe pédagogique (1.8, 2.8, 3.7 / 3.8).
 *
 * Demande du parent : des jeux « vraiment différents en fonction des décors » partout, pas seulement
 * en Afrique. Chaque continent a son jeu signature, cohérent avec son paysage :
 * - Asie : les lanternes du jardin et de la pagode ;
 * - Europe : les pommes du verger de la ferme ;
 * - Amérique du Nord : les feuilles d'érable de l'automne ;
 * - Amérique du Sud : les papillons de la jungle ;
 * - Océanie (et les plages d'Europe et d'Amérique du Nord) : les coquillages sur le sable ;
 * - Antarctique : les flocons de neige, et le manteau pour avoir chaud (Papa manchot a déjà son écharpe sur son dessin).
 *
 * Les lieux et les personnages qui proposent chaque jeu sont dans content/archetypes.ts.
 * Fonctions pures ; toutes les phrases sont écrites à la main, en anglais et en français.
 */
import { COLORS, NUMBERS, PROPS, WEATHER_WORDS } from '../props';
import { inWater } from '../places/depth';
import { PLACES } from '../places';
import type { Ability, ActivityCtx, ActivityDef, ColorId, Line, QuestStep, ResponseOption, Tier, Weather } from '../types';
import { numberId, numberOptions } from './games';
import { ABILITY_WORDS, act, anchor, ask, back, canDo, cap, clearProps, drinkMove, drinkScene, eatScene, end, foodsOf, L, landSpots, low, moveTo, nameable, no, ok, only, pickStable, prop, props, say, scene, skyProp, tap, tapProps } from './kit';

const byTier = <T>(tier: Tier, b: T, i: T, e: T): T => (tier === 'beginner' ? b : tier === 'intermediate' ? i : e);
const num = (n: number) => NUMBERS[n]!;

/** Emplacements où poser n objets, jamais dans l'eau dessinée du décor. */
function groundSpots(c: ActivityCtx, n: number): number[] {
  return landSpots(c.place).slice(0, n);
}

/** Emplacements posés sur l'eau dessinée (pour un canard ou un poisson). */
function waterSpots(c: ActivityCtx): number[] {
  return c.place.spots.flatMap((s, i) => (inWater(c.place.water, s.x, s.y) ? [i] : []));
}

/**
 * Décor de neige : pas de fleurs ni de papillons. La neige DESSINÉE compte même un jour sans flocons (météo du jour,
 * engine/weather.ts), et un jour de neige compte même dans un décor froid dessiné sans neige.
 */
const snowy = (c: ActivityCtx) => c.place.continentId === 'antarctica' || c.place.weather === 'snowy' || PLACES[c.place.id]?.weather === 'snowy';

/** Étapes « compter » communes : toucher chaque objet, puis « How many? » dès le niveau intermédiaire. */
function countSteps(ids: string[], word: { en: string; fr: string; plural: string; pluralFr: string }, touch: Line, items: string[]): QuestStep[] {
  const n = ids.length;
  return [
    tapProps('actor', touch.en, touch.fr, ids, [`Touch every ${word.en}!`, `Touche chaque ${word.fr} !`], [...items, 'count'], { count: true, onCorrect: L(`${num(n).en} ${word.plural}!`, `${num(n).fr} ${word.pluralFr} !`) }),
    ask('actor', `How many ${word.plural}?`, `Combien de ${word.pluralFr} ?`, numberOptions(n), ['Count again!', 'Recompte !'], [numberId(n), 'how_many'], { minTier: 'intermediate', onCorrect: L(`Yes! ${num(n).en} ${word.plural}!`, `Oui ! ${num(n).fr} ${word.pluralFr} !`) }),
  ];
}

// ---------------------------------------------------------------------------
// Asie — les lanternes (jardin et pagode) : la nuit tombe, les lanternes s'envolent
// ---------------------------------------------------------------------------

export const lanterns: ActivityDef = {
  id: 'lanterns',
  choices: (c) => (anchor(c.place, 'lantern') ? ['lanterns'] : []),
  build(_c, tier) {
    const n = byTier(tier, 3, 4, 5);
    const ids = [0, 2, 4, 6, 7].slice(0, n).map((s, i) => skyProp(`lantern${i}`, 'lantern', s));
    return [
      say('actor', "Look! It's getting dark. Let's light the lanterns!", 'Regarde ! Il commence à faire nuit. Allumons les lanternes !', {}, 'happy'),
      scene(true),
      tap('actor', 'Where is the lantern? Touch the lantern!', 'Où est la lanterne ? Touche la lanterne !', 'lantern', ['Find the lantern!', 'Cherche la lanterne !'], ['lantern', 'where'], { onCorrect: ["Yes! It's a lantern! It's bright!", "Oui ! C'est une lanterne ! Elle brille !"] }),
      props(ids),
      say('actor', 'Whoosh! The lanterns go up to the sky!', 'Whoosh ! Les lanternes montent dans le ciel !', {}, 'curious'),
      ...countSteps(ids.map((x) => x.id), { en: 'lantern', fr: 'lanterne', plural: 'lanterns', pluralFr: 'lanternes' }, L("Let's count the lanterns! Touch the lanterns!", 'Comptons les lanternes ! Touche les lanternes !'), ['lantern']),
      ask('actor', 'What colour are the lanterns?', 'De quelle couleur sont les lanternes ?', [ok("They're red!", 'Elles sont rouges !', '🔴'), no("They're blue!", 'Elles sont bleues !', '🔵'), no("They're green!", 'Elles sont vertes !', '🟢')], ['Look at the lanterns!', 'Regarde les lanternes !'], ['red'], { minTier: 'expert', onCorrect: ['Yes! Red lanterns! So pretty!', 'Oui ! Des lanternes rouges ! Trop jolies !'] }),
      say('actor', 'What a beautiful evening!', 'Quelle belle soirée !', {}, 'happy'),
      clearProps(),
      scene(false),
      end('actor', 'Good morning! Thank you for the lanterns!', 'Bonjour ! Merci pour les lanternes !'),
    ];
  },
  memoryEvent: () => 'lit_lanterns',
};

// ---------------------------------------------------------------------------
// Europe — le verger de la ferme : ramasser les pommes tombées du pommier
// ---------------------------------------------------------------------------

export const pickApples: ActivityDef = {
  id: 'pick_apples',
  choices: (c) => (anchor(c.place, 'appletree') ? ['apples'] : []),
  build(c, tier) {
    const n = byTier(tier, 3, 4, 5);
    const apples = groundSpots(c, n).map((s, i) => prop(`apple${i}`, 'apple', s));
    if (apples.length < n) return undefined;
    return [
      tap('actor', 'Look! An apple tree! Touch the apple tree!', 'Regarde ! Un pommier ! Touche le pommier !', 'appletree', ['The tree with apples!', 'L’arbre avec des pommes !'], ['apple tree'], { onCorrect: ['Shake, shake! The apples fall down!', 'Secoue, secoue ! Les pommes tombent !'] }),
      props(apples),
      ...countSteps(apples.map((a) => a.id), { en: 'apple', fr: 'pomme', plural: 'apples', pluralFr: 'pommes' }, L("Let's pick up the apples! Touch the apples!", 'Ramassons les pommes ! Touche les pommes !'), ['apple']),
      ask('actor', 'Is the apple red or blue?', 'La pomme est rouge ou bleue ?', [ok("It's red!", 'Elle est rouge !', '🔴'), no("It's blue!", 'Elle est bleue !', '🔵')], ['Look at the apples!', 'Regarde les pommes !'], ['red', 'apple'], { minTier: 'expert', keepOrder: true, onCorrect: ['Yes! A red apple!', 'Oui ! Une pomme rouge !'] }),
      clearProps(),
      end('actor', 'A basket full of apples! Thank you!', 'Un panier plein de pommes ! Merci !'),
    ];
  },
  memoryEvent: () => 'picked_apples',
};

// ---------------------------------------------------------------------------
// Amérique du Nord — l'automne au lac et à l'étang des castors : les feuilles d'érable
// ---------------------------------------------------------------------------

export const mapleLeaves: ActivityDef = {
  id: 'maple_leaves',
  choices: (c) => (c.place.anchors.some((a) => a.word === 'tree' || a.word === 'maple tree') ? ['autumn'] : []),
  build(c, tier) {
    const n = byTier(tier, 3, 4, 5);
    const leaves = groundSpots(c, n).map((s, i) => prop(`maple${i}`, 'maple_leaf', s));
    if (leaves.length < n) return undefined;
    const happy = canDo(c.species, 'jump') ? 'jump' : 'dance';
    return [
      say('actor', "Look! It's autumn! The leaves are falling!", "Regarde ! C'est l'automne ! Les feuilles tombent !", {}, 'curious'),
      props(leaves),
      ...countSteps(leaves.map((l) => l.id), { en: 'maple leaf', fr: "feuille d'érable", plural: 'maple leaves', pluralFr: "feuilles d'érable" }, L("Let's catch the maple leaves! Touch the leaves!", "Attrapons les feuilles d'érable ! Touche les feuilles !"), ['maple leaf', 'autumn']),
      ask('actor', 'What colour is the maple leaf?', "De quelle couleur est la feuille d'érable ?", [ok("It's red!", 'Elle est rouge !', '🔴'), no("It's blue!", 'Elle est bleue !', '🔵'), no("It's purple!", 'Elle est violette !', '🟣')], ['Look at the leaves!', 'Regarde les feuilles !'], ['red'], { onCorrect: ['Yes! A red maple leaf!', "Oui ! Une feuille d'érable rouge !"] }),
      ask('actor', 'What season is it?', 'Quelle saison est-ce ?', [ok("It's autumn!", "C'est l'automne !", '🍂'), no("It's summer!", "C'est l'été !", '☀️'), no("It's winter!", "C'est l'hiver !", '❄️')], ['The leaves are falling!', 'Les feuilles tombent !'], ['autumn'], { minTier: 'expert', onCorrect: ["Yes! It's autumn!", "Oui ! C'est l'automne !"] }),
      clearProps(),
      act('actor', happy, 'Wheee! I love autumn leaves!', "Youpi ! J'adore les feuilles d'automne !", 'actor'),
      end('actor', 'Thank you! Autumn is so pretty!', "Merci ! L'automne, c'est trop joli !"),
    ];
  },
  memoryEvent: () => 'autumn_leaves',
};

// ---------------------------------------------------------------------------
// Amérique du Sud — les papillons de la jungle (trouver la couleur demandée)
// ---------------------------------------------------------------------------

const BUTTERFLY_COLORS: readonly ColorId[] = ['blue', 'yellow', 'red'];

export const butterflies: ActivityDef = {
  id: 'butterflies',
  choices: (c) => (landSpots(c.place).length >= 3 ? ['butterflies'] : []),
  build(c, tier) {
    const cols = BUTTERFLY_COLORS.slice(0, byTier(tier, 2, 3, 3));
    const spots = groundSpots(c, cols.length);
    const bfs = cols.map((col, i) => prop(`bf_${col}`, 'butterfly', spots[i]!, col));
    const steps: QuestStep[] = [say('actor', 'Look! Butterflies! So many colours!', 'Regarde ! Des papillons ! Plein de couleurs !', {}, 'happy'), props(bfs)];
    // ordre des demandes différent de l'ordre à l'écran (jaune, puis bleu, puis rouge)
    for (const col of [cols[1]!, cols[0]!, ...cols.slice(2)]) {
      const x = COLORS[col];
      steps.push(
        tapProps('actor', `Touch the ${x.en} butterfly!`, `Touche le papillon ${x.fr} !`, [`bf_${col}`], [`Look for the ${x.en} one!`, `Cherche le ${x.fr} !`], [col, 'butterfly'], {
          onCorrect: L(`Yes! The ${x.en} butterfly!`, `Oui ! Le papillon ${x.fr} !`),
          wrong: Object.fromEntries(cols.filter((o) => o !== col).map((o) => [`bf_${o}`, L(`No, that one is ${COLORS[o].en}!`, `Non, celui-là est ${COLORS[o].fr} !`)])),
        }),
      );
    }
    steps.push(
      ask('actor', 'How many butterflies?', 'Combien de papillons ?', numberOptions(cols.length), ['Count them!', 'Compte-les !'], [numberId(cols.length), 'how_many'], { minTier: 'intermediate', onCorrect: L(`Yes! ${num(cols.length).en} butterflies!`, `Oui ! ${num(cols.length).fr} papillons !`) }),
      ask('actor', 'Can a butterfly fly?', 'Est-ce qu’un papillon sait voler ?', [ok('Yes, it can!', 'Oui !', '🦋'), no("No, it can't!", 'Non !', '🙅')], ['Look! Flutter, flutter!', 'Regarde ! Il bat des ailes !'], ['can', 'butterfly'], { minTier: 'expert', keepOrder: true, onCorrect: ['Yes! Flutter, flutter!', 'Oui ! Il vole, il vole !'] }),
      clearProps(),
      end('actor', 'Bye, butterflies! Fly, fly, fly!', 'Au revoir, les papillons ! Volez, volez !'),
    );
    return steps;
  },
  memoryEvent: () => 'saw_butterflies',
};

// ---------------------------------------------------------------------------
// Plages (Océanie, Europe, Amérique du Nord) — les coquillages sur le sable
// ---------------------------------------------------------------------------

const SHELL_COLORS: readonly ColorId[] = ['white', 'pink', 'yellow', 'white', 'yellow'];

export const beachShells: ActivityDef = {
  id: 'beach_shells',
  choices: (c) => (c.place.anchors.some((a) => a.word === 'sand') ? ['shells'] : []),
  build(c, tier) {
    const n = byTier(tier, 3, 4, 5);
    const spots = groundSpots(c, n);
    const sand = c.place.anchors.find((a) => a.word === 'sand');
    if (spots.length < n || !sand) return undefined;
    const shells = spots.map((s, i) => prop(`shell${i}`, 'shell', s, SHELL_COLORS[i]));
    const pink = shells.find((s) => s.color === 'pink')!;
    return [
      tap('actor', "Look at the sand! Let's look for shells! Touch the sand!", 'Regarde le sable ! Cherchons des coquillages ! Touche le sable !', sand.id, ['Find the sand!', 'Cherche le sable !'], ['sand'], { onCorrect: ['Oh! Shells! Look!', 'Oh ! Des coquillages ! Regarde !'] }),
      props(shells),
      ...countSteps(shells.map((s) => s.id), { en: 'shell', fr: 'coquillage', plural: 'shells', pluralFr: 'coquillages' }, L("Let's count the shells! Touch the shells!", 'Comptons les coquillages ! Touche les coquillages !'), ['shell']),
      tapProps('actor', 'Now touch the pink shell!', 'Maintenant, touche le coquillage rose !', [pink.id], ['Look for the pink one!', 'Cherche le rose !'], ['pink', 'shell'], {
        onCorrect: ['Yes! A pink shell! My favourite!', 'Oui ! Un coquillage rose ! Mon préféré !'],
        wrong: Object.fromEntries(shells.filter((s) => s.id !== pink.id).map((s) => [s.id, L(`No, that one is ${COLORS[s.color!].en}!`, `Non, celui-là est ${COLORS[s.color!].fr} !`)])),
      }),
      clearProps(),
      end('actor', 'Thank you! I love my shells!', "Merci ! J'adore mes coquillages !"),
    ];
  },
  memoryEvent: () => 'found_shells',
};

// ---------------------------------------------------------------------------
// Antarctique — les flocons de neige, puis le manteau et les gants pour avoir chaud
// ---------------------------------------------------------------------------

/** espèces du grand froid : fourrure, plumes ou graisse, jamais de manteau ni « j'ai froid » */
export const COLD_NATIVE: ReadonlySet<string> = new Set(['penguin', 'seal', 'polar_bear', 'snow_leopard']);

export const snowflakes: ActivityDef = {
  id: 'snowflakes',
  choices: (c) => (c.place.weather === 'cold' || c.place.weather === 'windy' ? ['snow'] : []),
  build(c, tier) {
    const n = byTier(tier, 3, 4, 5);
    const flakes = [1, 3, 5, 0, 6].slice(0, n).map((s, i) => skyProp(`flake${i}`, 'snowflake', s));
    const sp = groundSpots(c, 4);
    const cold = (en: string, fr: string) => L(`${en}? No! It's cold!`, `${fr} ? Non ! Il fait froid !`);
    const snow: QuestStep[] = [
      say('actor', "Brrr! It's cold! Look! Snowflakes!", 'Brrr ! Il fait froid ! Regarde ! Des flocons !', {}, 'curious'),
      props(flakes),
      ...countSteps(flakes.map((f) => f.id), { en: 'snowflake', fr: 'flocon', plural: 'snowflakes', pluralFr: 'flocons' }, L('Catch the snowflakes! Touch the snowflakes!', 'Attrape les flocons ! Touche les flocons !'), ['snowflake']),
      ask('actor', 'Is it hot or cold?', 'Il fait chaud ou froid ?', [no("It's hot!", 'Il fait chaud !', '🥵'), ok("It's cold!", 'Il fait froid !', '🥶')], ['Look at the snow!', 'Regarde la neige !'], ['cold', 'hot'], { keepOrder: true, onCorrect: ["Yes! It's cold! Very cold!", 'Oui ! Il fait froid ! Très froid !'] }),
      clearProps(),
    ];
    // en pleine mer, rien de sec pour poser les habits : on attrape seulement les flocons
    // (le lagon des manchots : la glace du bord est trop étroite pour y poser des habits, comme avant)
    if (sp.length < 4 || c.place.id === 'open_sea') return [...snow, end('actor', 'What fun! I love the snow!', "Trop bien ! J'adore la neige !")];
    // un animal du grand froid n'a pas besoin de manteau : « I'm cold! I need a coat! » était absurde (audit du 2026-11-25)
    if (COLD_NATIVE.has(c.species.id)) return [...snow, end('actor', "I'm not cold! I love the snow!", "Je n'ai pas froid ! J'adore la neige !")];
    return [
      ...snow,
      props([prop('coat', 'coat', sp[0]!), prop('glasses', 'sunglasses', sp[1]!)], { maxTier: 'beginner' }),
      props([prop('coat', 'coat', sp[0]!), prop('glasses', 'sunglasses', sp[1]!), prop('hat', 'hat', sp[2]!)], { minTier: 'intermediate' }),
      tapProps('actor', "I'm cold! I need a coat! Touch the coat!", "J'ai froid ! J'ai besoin d'un manteau ! Touche le manteau !", ['coat'], ['A coat for the cold!', 'Un manteau pour le froid !'], ['coat', 'wear'], {
        maxTier: 'beginner',
        wear: 'actor',
        onCorrect: ['Thank you! I like my coat!', "Merci ! J'aime mon manteau !"],
        wrong: { glasses: cold('Sunglasses', 'Des lunettes de soleil') },
      }),
      tapProps('actor', 'Brrr! What do I wear in the snow? Touch it!', "Brrr ! Qu'est-ce que je mets dans la neige ? Touche-le !", ['coat'], ['Think about the cold snow!', 'Pense à la neige toute froide !'], ['coat', 'wear'], {
        minTier: 'intermediate',
        wear: 'actor',
        onCorrect: ['Thank you! A warm coat! Nice and warm!', 'Merci ! Un manteau bien chaud ! Bien au chaud !'],
        wrong: { glasses: cold('Sunglasses', 'Des lunettes de soleil'), hat: cold('A sun hat', 'Un chapeau de soleil') },
      }),
      clearProps(),
      end('actor', "Thank you! Now I'm nice and warm!", "Merci ! Maintenant, j'ai bien chaud !"),
    ];
  },
  memoryEvent: () => 'caught_snowflakes',
};

// ---------------------------------------------------------------------------
// Asie — la tanière enneigée de la panthère des neiges : la nuit dans la grotte, puis le lever du soleil
// (2026-11-21). Routine du matin (3.3 : sleep, wake up, first, then), nombres (1.3), où est… (2.3).
// Cohérence : la panthère dort dans sa grotte, mange de la viande, boit en lapant au bord du bassin
// (elle ne nage pas) ; ses grosses pattes laissent des empreintes.
// ---------------------------------------------------------------------------

export const sunriseDen: ActivityDef = {
  id: 'sunrise_den',
  choices: (c) => (anchor(c.place, 'cave') && anchor(c.place, 'sun') ? ['sunrise'] : []),
  build(c, tier) {
    const n = byTier(tier, 3, 4, 5);
    const spots = groundSpots(c, 5);
    if (spots.length < 5) return undefined;
    const prints = spots.slice(0, n).map((s, i) => prop(`print${i}`, 'footprint', s));
    const meal = [spots[0]!, spots[1]!, spots[2]!, spots[3]!] as const;
    const pond = anchor(c.place, 'pond');
    const flag = anchor(c.place, 'flag');
    const steps: QuestStep[] = [
      // la nuit, dans la grotte
      scene(true),
      say('actor', "Shh… It's night. We sleep in our cave.", "Chut… C'est la nuit. On dort dans notre grotte.", {}, 'calm'),
      tap('actor', 'Where is our cave? Touch the cave!', 'Où est notre grotte ? Touche la grotte !', 'cave', ['Find the cave!', 'Cherche la grotte !'], ['cave', 'where'], { onCorrect: ['Yes! Our cave! Our home!', 'Oui ! Notre grotte ! Notre maison !'] }),
      moveTo('cave', 'rest'),
      act('actor', 'sleep', 'Good night! Zzz…', 'Bonne nuit ! Zzz…', 'actor'),
      // le lever du soleil
      scene(false),
      say('actor', 'Look! The sun is coming up! Good morning!', 'Regarde ! Le soleil se lève ! Bonjour !', {}, 'happy'),
      back(),
      tap('actor', 'Where is the sun? Touch the sun!', 'Où est le soleil ? Touche le soleil !', 'sun', ['Look up at the sky!', 'Regarde en haut, dans le ciel !'], ['sun', 'morning'], { onCorrect: ['Good morning, sun!', 'Bonjour, soleil !'] }),
      ask('actor', 'Is it day or night?', 'Il fait jour ou nuit ?', [ok("It's day!", "C'est le jour !", '☀️'), no("It's night!", "C'est la nuit !", '🌙')], ['Look! The sun is up!', 'Regarde ! Le soleil est levé !'], ['day', 'morning'], { keepOrder: true, onCorrect: ["Yes! It's morning! Wake up!", "Oui ! C'est le matin ! Debout !"] }),
      ask('actor', 'First we sleep. Then…?', "D'abord, on dort. Ensuite… ?", [ok('We wake up!', 'On se réveille !', '🌅'), no('We swim!', 'On nage !', '🏊')], ['The sun is up! We wake up!', 'Le soleil est levé ! On se réveille !'], ['wake_up', 'first', 'then'], { minTier: 'intermediate', keepOrder: true, onCorrect: ['Yes! First we sleep, then we wake up!', "Oui ! D'abord on dort, ensuite on se réveille !"] }),
      // les empreintes de la nuit
      say('actor', 'Look! My footprints! Big paws for the snow!', 'Regarde ! Mes empreintes ! De grosses pattes pour la neige !', {}, 'curious'),
      props(prints),
      ...countSteps(prints.map((p) => p.id), { en: 'footprint', fr: 'empreinte', plural: 'footprints', pluralFr: 'empreintes' }, L("Let's count the footprints! Touch the footprints!", 'Comptons les empreintes ! Touche les empreintes !'), ['footprint']),
      clearProps(),
    ];
    // les drapeaux qui dansent dans le vent du matin
    if (flag)
      steps.push(
        tap('actor', 'Look at the flags! Touch the flags!', 'Regarde les drapeaux ! Touche les drapeaux !', flag.id, ['Find the flags!', 'Cherche les drapeaux !'], ['flag'], { minTier: 'intermediate', onCorrect: ['The flags dance in the wind!', 'Les drapeaux dansent dans le vent !'] }),
      );
    // le petit déjeuner : de la viande, jamais de bambou ni de baies
    if (c.species.foods.length && c.species.notFoods.length)
      steps.push(say('actor', "I'm awake! Breakfast time!", "Je suis debout ! C'est l'heure du petit déjeuner !", { minTier: 'intermediate' }, 'happy'), ...only({ minTier: 'intermediate' }, eatScene(c.species, meal, 'actor', 'breakfast').filter((s) => s.maxTier !== 'beginner')));
    // boire au bord du bassin (en lapant : la panthère ne nage pas)
    if (pond && pond.stand && drinkMove(c.species))
      steps.push(say('actor', "I'm thirsty! Let's drink at the pond!", "J'ai soif ! Allons boire au bassin !", { minTier: 'expert' }, 'thirsty'), ...only({ minTier: 'expert' }, drinkScene(c.species, pond.id, 'actor')));
    steps.push(
      ask('actor', 'Where do we sleep?', 'Où est-ce qu’on dort ?', [ok('In the cave!', 'Dans la grotte !', '🕳️'), no('In the water!', "Dans l'eau !", '💧'), no('In a nest!', 'Dans un nid !', '🪺')], ['We sleep in our cave!', 'On dort dans notre grotte !'], ['cave', 'sleep'], { minTier: 'expert', onCorrect: ['Yes! In our cave, all together!', 'Oui ! Dans notre grotte, tous ensemble !'] }),
      end('actor', 'Good morning, mountain! What a beautiful day!', 'Bonjour, la montagne ! Quelle belle journée !'),
    );
    return steps;
  },
  memoryEvent: () => 'watched_sunrise',
};

// ---------------------------------------------------------------------------
// Révision 1.8 — le grand quiz Beginner : un peu de tout ce qu'on a appris
// ---------------------------------------------------------------------------

/** Couleurs dont le pluriel féminin français est régulier (« rouges », « bleues »). */
const QUIZ_COLORS: readonly ColorId[] = ['red', 'blue', 'yellow', 'pink', 'purple', 'green'];
const frPlural = (c: ColorId) => `${COLORS[c].frFem}s`;

/** Capacité que l'espèce n'a pas (pour « Can I fly? — No, you can't! »). */
function missingAbility(c: ActivityCtx): Ability {
  return (['fly', 'swim', 'climb', 'jump', 'run'] as const).find((a) => !canDo(c.species, a)) ?? 'fly';
}

const OTHER_WEATHER: readonly Weather[] = ['rainy', 'cold', 'sunny', 'windy', 'misty', 'hot'];
/** Deux météos fausses, jamais proches de la bonne (pas « sunny » quand il fait « hot »). */
function wrongWeather(w: Weather): Weather[] {
  // le soleil est dessiné sur beaucoup de décors froids : « sunny » n'est jamais une fausse réponse sûre par temps froid
  const near: Partial<Record<Weather, Weather[]>> = { hot: ['sunny'], sunny: ['hot'], cold: ['windy', 'misty', 'sunny'], windy: ['cold', 'misty', 'sunny'], misty: ['cold', 'windy', 'sunny'], rainy: ['cold', 'misty', 'windy'], snowy: ['cold', 'windy', 'misty', 'sunny'] };
  return OTHER_WEATHER.filter((x) => x !== w && !near[w]?.includes(x)).slice(0, 2);
}

export const quizBeginner: ActivityDef = {
  id: 'quiz_beginner',
  choices: (c) => (landSpots(c.place).length >= 4 && c.species.can.length > 0 ? ['quiz'] : []),
  build(c, tier) {
    const col = QUIZ_COLORS[(c.place.id.length + c.species.id.length) % QUIZ_COLORS.length]!;
    const wrongCols = QUIZ_COLORS.filter((x) => x !== col).slice(0, 2);
    const spots = groundSpots(c, 4);
    const snow = snowy(c);
    const flowers = (k: number) => (snow ? [1, 3, 5, 0, 6].slice(0, k).map((s, i) => skyProp(`qf${i}`, 'snowflake', s)) : spots.slice(0, k).map((s, i) => prop(`qf${i}`, 'flower', s, col)));
    const can = ABILITY_WORDS[c.species.can[0]!];
    const cant = ABILITY_WORDS[missingAbility(c)];
    const { good, bad } = foodsOf(c.species);
    const w = c.place.weather;
    const wOpt = (x: Weather, correct: boolean): ResponseOption => ({ line: L(WEATHER_WORDS[x].en, WEATHER_WORDS[x].fr), icon: WEATHER_WORDS[x].icon, correct });
    const k = byTier(tier, 2, 3, 4);
    return [
      say('actor', "Quiz time! Let's see what you know!", "C'est l'heure du quiz ! Voyons tout ce que tu sais !", {}, 'happy'),
      ask('actor', 'Hello! What do you say?', 'Hello ! Qu’est-ce que tu réponds ?', [ok('Hello!', 'Bonjour !', '👋'), no('Good night!', 'Bonne nuit !', '🌙')], ['We say hello!', 'On dit hello !'], ['hello'], { keepOrder: true, onCorrect: ['Hello! Nice to see you!', 'Bonjour ! Ça me fait plaisir de te voir !'] }),
      props(flowers(k)),
      ...(snow
        ? [
            ask('actor', 'How many snowflakes?', 'Combien de flocons ?', numberOptions(k), ['Count the snowflakes!', 'Compte les flocons !'], [numberId(k), 'how_many'], { onCorrect: L(`Yes! ${num(k).en} snowflakes!`, `Oui ! ${num(k).fr} flocons !`) }),
            ask('actor', 'What colour is the snow?', 'De quelle couleur est la neige ?', [ok("It's white!", 'Elle est blanche !', COLORS.white.icon), ...(['red', 'green'] as const).map((x) => no(`It's ${COLORS[x].en}!`, `Elle est ${COLORS[x].frFem} !`, COLORS[x].icon))], ['Look at the snow!', 'Regarde la neige !'], ['white', 'snowflake'], { onCorrect: L('Yes! The snow is white!', 'Oui ! La neige est blanche !') }),
          ]
        : [
            ask('actor', 'How many flowers?', 'Combien de fleurs ?', numberOptions(k), ['Count the flowers!', 'Compte les fleurs !'], [numberId(k), 'how_many'], { onCorrect: L(`Yes! ${num(k).en} flowers!`, `Oui ! ${num(k).fr} fleurs !`) }),
            ask('actor', 'What colour are the flowers?', 'De quelle couleur sont les fleurs ?', [ok(`They're ${COLORS[col].en}!`, `Elles sont ${frPlural(col)} !`, COLORS[col].icon), ...wrongCols.map((x) => no(`They're ${COLORS[x].en}!`, `Elles sont ${frPlural(x)} !`, COLORS[x].icon))], ['Look at the flowers!', 'Regarde les fleurs !'], [col, 'flower'], { onCorrect: L(`Yes! ${cap(COLORS[col].en)} flowers!`, `Oui ! Des fleurs ${frPlural(col)} !`) }),
          ]),
      clearProps(),
      ask('actor', 'Is a baby big or small?', 'Un bébé, c’est grand ou petit ?', [no("It's big!", "C'est grand !", '⬆️'), ok("It's small!", "C'est petit !", '⬇️')], ['A baby is little!', 'Un bébé est tout petit !'], ['small', 'big', 'baby'], { keepOrder: true, onCorrect: ['Yes! A baby is small!', 'Oui ! Un bébé est petit !'] }),
      ask('actor', `Can I ${can.en}?`, `Est-ce que je sais ${can.fr} ?`, [ok('Yes, you can!', 'Oui, tu sais !', can.icon), no("No, you can't!", 'Non, tu ne sais pas !', '🙅')], [`Look! I can ${can.en}!`, `Regarde ! Je sais ${can.fr} !`], ['can'], { keepOrder: true, onCorrect: L(`Yes! I can ${can.en}!`, `Oui ! Je sais ${can.fr} !`) }),
      ask('actor', `Can I ${cant.en}?`, `Est-ce que je sais ${cant.fr} ?`, [no('Yes, you can!', 'Oui, tu sais !', cant.icon), ok("No, you can't!", 'Non, tu ne sais pas !', '🙅')], [`Hmm… Can I ${cant.en}? No!`, `Hum… Je sais ${cant.fr} ? Non !`], ['cant'], { minTier: 'intermediate', keepOrder: true, onCorrect: L(`That's right! I can't ${cant.en}!`, `C'est ça ! Je ne sais pas ${cant.fr} !`) }),
      ask('actor', 'What do I eat?', 'Qu’est-ce que je mange ?', [ok(`${good.noun.en}!`, `${good.noun.fr} !`, good.emoji), ...bad.slice(0, 2).map((b) => no(`${b.noun.en}!`, `${b.noun.fr} !`, b.emoji))], [`I eat ${good.eat!.en}!`, `Je mange ${good.eat!.fr} !`], [good.word, 'eat'], { onCorrect: L(`Yes! I eat ${good.eat!.en}! Yum!`, `Oui ! Je mange ${good.eat!.fr} ! Miam !`) }),
      ask('actor', "What's the weather like?", 'Quel temps fait-il ?', [wOpt(w, true), ...wrongWeather(w).map((x) => wOpt(x, false))], ['Look at the sky!', 'Regarde le ciel !'], [w, 'weather'], { minTier: 'intermediate', onCorrect: L(`Yes! ${WEATHER_WORDS[w].en}`, `Oui ! ${WEATHER_WORDS[w].fr}`) }),
      end('actor', 'Wow! You know so many words! You are a star!', 'Waouh ! Tu connais plein de mots ! Tu es une championne !'),
    ];
  },
  memoryEvent: () => 'quiz:beginner',
};

// ---------------------------------------------------------------------------
// Révision 2.8 — le super quiz Intermediate
// ---------------------------------------------------------------------------

/** « J'aime le bambou » à partir de « du bambou ». */
export const frDefinite = (fr: string) => fr.replace(/^(du |de la |de l'|de l’|des )/, (m) => ({ 'du ': 'le ', 'de la ': 'la ', "de l'": "l'", 'de l’': 'l’', 'des ': 'les ' })[m] ?? m);

/** Habit utile pour la météo du lieu, et un habit qui ne va pas du tout. */
function clothesFor(w: Weather) {
  // le manteau d'abord quand il convient : Papa manchot porte déjà une écharpe sur son dessin
  const wear = WEATHER_WORDS[w].clothes;
  const good = PROPS[wear.includes('coat') ? 'coat' : (wear[0] ?? 'coat')]!;
  const bad = PROPS[w === 'hot' || w === 'sunny' ? 'scarf' : 'sunglasses']!;
  return { good, bad };
}

/**
 * He / she : Maman puis Papa (Papa seulement en expert). Si c'est Maman ou Papa qui pose la question,
 * il parle de lui à la première personne (« Look at me! I'm Mummy! »).
 */
export function heShe(c: ActivityCtx): QuestStep[] {
  const me = c.actorKind === 'adult' ? c.role : undefined;
  const mum = me === 'mother' ? L("Look at me! I'm Mummy! Do we say he or she?", 'Regarde-moi ! Je suis Maman ! On dit he ou she ?') : L('Look at Mummy! Do we say he or she?', 'Regarde Maman ! On dit he ou she ?');
  const dad = me === 'father' ? L("And me? I'm Daddy! He or she?", 'Et moi ? Je suis Papa ! He ou she ?') : L('And Daddy? He or she?', 'Et Papa ? He ou she ?');
  return [
    ask('actor', mum.en, mum.fr, [no('He! He is Mummy!', 'He ! Maman !', '👨'), ok('She! She is Mummy!', 'She ! Maman !', '👩')], ['Mummy is a girl: she!', 'Maman est une fille : she !'], ['she_is', 'mum'], { keepOrder: true, onCorrect: ['Yes! She is Mummy!', 'Oui ! She is Mummy, c’est Maman !'] }),
    ask('actor', dad.en, dad.fr, [ok('He! He is Daddy!', 'He ! Papa !', '👨'), no('She! She is Daddy!', 'She ! Papa !', '👩')], ['Daddy is a boy: he!', 'Papa est un garçon : he !'], ['he_is', 'dad'], { minTier: 'expert', keepOrder: true, onCorrect: ['Yes! He is Daddy!', 'Oui ! He is Daddy, c’est Papa !'] }),
  ];
}

export const quizIntermediate: ActivityDef = {
  id: 'quiz_intermediate',
  choices: (c) => (nameable(c.place).some((a) => !a.tags?.includes('sky')) && landSpots(c.place).length >= 1 ? ['quiz'] : []),
  build(c) {
    const cant = ABILITY_WORDS[missingAbility(c)];
    const can = ABILITY_WORDS[c.species.can[0] ?? 'run'];
    const spot = pickStable(nameable(c.place).filter((a) => !a.tags?.includes('sky')), c.place.id + c.species.id);
    const { good } = foodsOf(c.species);
    const thing = PROPS[c.place.continentId === 'antarctica' ? 'snowflake' : 'leaf']!;
    const others = ['flower', 'shell', 'feather'].map((id) => PROPS[id]!);
    const w = c.place.weather;
    const clothes = clothesFor(w);
    const shown = landSpots(c.place)[0]!;
    return [
      say('actor', 'Super quiz! Are you ready?', 'Super quiz ! Tu es prête ?', {}, 'happy'),
      ...heShe(c),
      ask('actor', `Can I ${cant.en}?`, `Est-ce que je sais ${cant.fr} ?`, [no('Yes, you can!', 'Oui, tu sais !', cant.icon), ok("No, you can't!", 'Non, tu ne sais pas !', '🙅')], [`Hmm… Can I ${cant.en}? No!`, `Hum… Je sais ${cant.fr} ? Non !`], ['cant'], { keepOrder: true, onCorrect: L(`That's right! I can't ${cant.en}! But I can ${can.en}!`, `C'est ça ! Je ne sais pas ${cant.fr} ! Mais je sais ${can.fr} !`) }),
      tap('actor', `Where is the ${spot.word}? Touch the ${spot.word}!`, `Où est ${spot.wordFr} ? Touche ${spot.wordFr} !`, spot.id, [`Find the ${spot.word}!`, `Cherche ${spot.wordFr} !`], [spot.word, 'where'], { onCorrect: L(`Yes! Here is the ${spot.word}!`, `Oui ! Voilà ${spot.wordFr} !`) }),
      ask('actor', `I like ${good.eat!.en}! Do you like ${good.eat!.en}?`, `J'aime ${frDefinite(good.eat!.fr)} ! Et toi, tu aimes ça ?`, [ok('Yes, I do!', 'Oui !', '😋'), ok("No, I don't!", 'Non !', '🙅')], ['You can say yes or no!', 'Tu peux dire oui ou non !'], ['do_you_like'], { minTier: 'intermediate', keepOrder: true, onCorrect: ['Thank you for telling me!', 'Merci de me le dire !'] }),
      props([prop('what', thing.id, shown, thing.shape ? 'green' : undefined)], { minTier: 'intermediate' }),
      ask('actor', "What's this?", "Qu'est-ce que c'est ?", [ok(`It's ${low(thing.noun.en)}!`, `C'est ${low(thing.noun.fr)} !`, thing.emoji), ...others.filter((o) => o.id !== thing.id).slice(0, 2).map((o) => no(`It's ${low(o.noun.en)}!`, `C'est ${low(o.noun.fr)} !`))], ['Look at it!', 'Regarde bien !'], ['whats_this', thing.word], { minTier: 'intermediate', onCorrect: L(`Yes! It's ${low(thing.noun.en)}!`, `Oui ! C'est ${low(thing.noun.fr)} !`) }),
      clearProps({ minTier: 'intermediate' }),
      // un animal du grand froid n'a pas besoin d'habits : la question porte sur l'enfant (audit du 2026-11-25)
      COLD_NATIVE.has(c.species.id)
        ? ask('actor', `${WEATHER_WORDS[w].en} What do you wear?`, `${WEATHER_WORDS[w].fr} Qu'est-ce que tu mets ?`, [ok(`${cap(clothes.good.need!.en)}!`, `${cap(clothes.good.need!.fr)} !`, clothes.good.emoji), no(`${cap(clothes.bad.need!.en)}!`, `${cap(clothes.bad.need!.fr)} !`, clothes.bad.emoji)], ['Think about the weather!', 'Pense à la météo !'], [clothes.good.word, 'wear', w], { onCorrect: c.species.id === 'penguin' ? L(`Yes! You wear ${clothes.good.need!.en}! I have my feathers!`, `Oui ! Tu mets ${clothes.good.need!.fr} ! Moi, j'ai mes plumes !`) : L(`Yes! You wear ${clothes.good.need!.en}! I have my fur!`, `Oui ! Tu mets ${clothes.good.need!.fr} ! Moi, j'ai ma fourrure !`) })
        : ask('actor', `${WEATHER_WORDS[w].en} What do I wear?`, `${WEATHER_WORDS[w].fr} Qu'est-ce que je mets ?`, [ok(`${cap(clothes.good.need!.en)}!`, `${cap(clothes.good.need!.fr)} !`, clothes.good.emoji), no(`${cap(clothes.bad.need!.en)}!`, `${cap(clothes.bad.need!.fr)} !`, clothes.bad.emoji)], ['Think about the weather!', 'Pense à la météo !'], [clothes.good.word, 'wear', w], { onCorrect: L(`Yes! I wear ${clothes.good.need!.en}!`, `Oui ! Je mets ${clothes.good.need!.fr} !`) }),
      end('actor', 'Super! You know everything! Well done!', 'Super ! Tu sais tout ! Bravo !'),
    ];
  },
  memoryEvent: () => 'quiz:intermediate',
};

// ---------------------------------------------------------------------------
// Révision 3.7 / 3.8 — l'énigme : écouter des indices et trouver l'animal
// ---------------------------------------------------------------------------

type Clue = readonly [string, string];
const RIDDLES: Readonly<Record<string, readonly [Clue, Clue, Clue]>> = {
  duck: [['It lives on the water.', 'Il vit sur l’eau.'], ['It has two legs.', 'Il a deux pattes.'], ['It says quack!', 'Il fait coin-coin !']],
  frog: [['It is green.', 'Elle est verte.'], ['It can jump.', 'Elle sait sauter.'], ['It says ribbit!', 'Elle fait croâ !']],
  bird: [['It can fly.', 'Il sait voler.'], ['It lives in a nest.', 'Il vit dans un nid.'], ['It says tweet!', 'Il fait cui-cui !']],
  butterfly: [['It has colourful wings.', 'Il a des ailes de toutes les couleurs.'], ['It is very small.', 'Il est tout petit.'], ['It loves flowers.', 'Il adore les fleurs.']],
  rabbit: [['It has long ears.', 'Il a de grandes oreilles.'], ['It can jump.', 'Il sait sauter.'], ['It loves carrots.', 'Il adore les carottes.']],
  penguin: [['It is black and white.', 'Il est noir et blanc.'], ['It can swim.', 'Il sait nager.'], ["It can't fly.", 'Il ne sait pas voler.']],
  fish: [['It has no legs.', "Il n'a pas de pattes."], ['It lives in the water.', "Il vit dans l'eau."], ['It says blub, blub!', 'Il fait blub, blub !']],
};

/** Animaux qui se posent sur l'eau dessinée (jamais sur la terre sèche). */
export const ON_WATER = new Set(['duck', 'fish']);

/**
 * Animaux de l'énigme selon le décor : pas de grenouille sur la banquise, pas de canard ni de
 * grenouille dans un désert sans eau (un lapin à la place), le poisson seulement s'il y a de l'eau.
 */
export const riddleAnimals = (c: ActivityCtx): string[] => {
  const wet = waterSpots(c).length > 0;
  if (c.place.continentId === 'antarctica') return wet ? ['penguin', 'fish', 'bird'] : [];
  return wet ? ['duck', 'frog', 'bird', 'butterfly'] : ['rabbit', 'bird', 'butterfly'];
};

/** Image d'une réponse de l'énigme : chaque carte en a une (l'enfant ne lit pas encore). */
export const iconOf = (id: string) => PROPS[id]?.emoji ?? (id === 'butterfly' ? '🦋' : '❓');

/** Indices donnés : au niveau débutant, le premier et le dernier (qui suffit toujours à trouver). */
const cluesFor = (animal: string) => RIDDLES[animal]!;

export const solveMystery: ActivityDef = {
  id: 'solve_mystery',
  choices: (c) => (landSpots(c.place).length >= 4 ? riddleAnimals(c) : []),
  build(c, tier, choice) {
    const set = riddleAnimals(c);
    if (!set.includes(choice)) return undefined;
    const order = [...set.slice(set.indexOf(choice)), ...set.slice(0, set.indexOf(choice))];
    const spots = groundSpots(c, set.length);
    const wet = waterSpots(c);
    let land = 0;
    // le papillon a « des ailes de toutes les couleurs » : jamais dessiné en gris
    const placed = set.map((id) => prop(`m_${id}`, id, ON_WATER.has(id) ? wet[0]! : spots[land++]!, id === 'butterfly' ? 'orange' : undefined));
    const beginnerSet = placed.filter((p) => p.prop === choice || order.slice(1, 3).includes(p.prop));
    const p = (id: string) => PROPS[id]!;
    const wrongFor = (target: string, shown: typeof placed) =>
      Object.fromEntries(shown.filter((x) => x.prop !== target).map((x) => [x.id, L(`Oh! That's ${low(p(x.prop).noun.en)}! Try again!`, `Oh ! Ça, c'est ${low(p(x.prop).noun.fr)} ! Essaie encore !`)]));
    const riddle = (animal: string, gate: { minTier?: Tier }, shown: typeof placed, all: boolean): QuestStep[] => {
      const [c0, c1, c2] = cluesFor(animal);
      const a = p(animal);
      return [
        say('actor', `Listen! ${c0[0]}`, `Écoute ! ${c0[1]}`, gate, 'curious'),
        say('actor', c1[0], c1[1], all ? gate : { ...gate, minTier: 'intermediate' }),
        say('actor', c2[0], c2[1], gate),
        tapProps('actor', 'Who is it? Touch it!', 'Qui est-ce ? Touche-le !', [`m_${animal}`], [`${c2[0]}`, `${c2[1]}`], [a.word], {
          ...gate,
          onCorrect: L(`Yes! It's ${low(a.noun.en)}!`, `Oui ! C'est ${low(a.noun.fr)} !`),
          wrong: wrongFor(animal, shown),
        }),
      ];
    };
    const third = order[2]!;
    const t = p(third);
    const steps: QuestStep[] = [
      say('actor', 'I have a mystery! Listen to the clues. Who is it?', "J'ai une énigme ! Écoute les indices. Qui est-ce ?", {}, 'curious'),
      props(beginnerSet, { maxTier: 'beginner' }),
      props(placed, { minTier: 'intermediate' }),
      ...riddle(choice, {}, tier === 'beginner' ? beginnerSet : placed, false),
      ...riddle(order[1]!, { minTier: 'intermediate' }, placed, true),
      say('actor', `Last one! ${cluesFor(third)[0][0]}`, `Le dernier ! ${cluesFor(third)[0][1]}`, { minTier: 'expert' }),
      say('actor', cluesFor(third)[1][0], cluesFor(third)[1][1], { minTier: 'expert' }),
      say('actor', cluesFor(third)[2][0], cluesFor(third)[2][1], { minTier: 'expert' }),
      ask('actor', 'Who is it?', 'Qui est-ce ?', [ok(`${t.noun.en}!`, `${t.noun.fr} !`, iconOf(third)), ...set.filter((x) => x !== third).slice(0, 2).map((x) => no(`${p(x).noun.en}!`, `${p(x).noun.fr} !`, iconOf(x)))], [cluesFor(third)[2][0], cluesFor(third)[2][1]], [t.word], { minTier: 'expert', onCorrect: L(`Yes! It's ${low(t.noun.en)}! Well done, detective!`, `Oui ! C'est ${low(t.noun.fr)} ! Bravo, détective !`) }),
      clearProps(),
      end('actor', 'You solved the mystery! You are a great detective!', "Tu as résolu l'énigme ! Tu es une super détective !"),
    ];
    return steps;
  },
  memoryEvent: () => 'solved_mystery',
};

export const WORLD_ACTIVITIES: readonly ActivityDef[] = [lanterns, pickApples, mapleLeaves, butterflies, beachShells, snowflakes, sunriseDen, quizBeginner, quizIntermediate, solveMystery];
