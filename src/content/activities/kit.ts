/**
 * Boîte à outils des scripts : petites fonctions qui fabriquent des étapes validées.
 * Partagée par les activités génériques et par les aventures de chaque continent.
 * Toute phrase reste écrite à la main (anglais + français) ; seuls des mots du décor,
 * des objets, des couleurs ou des nombres validés sont insérés dans des modèles fixes.
 */
import { NOUNS } from '../places';
import { inWater } from '../places/depth';
import { PROPS } from '../props';
import type {
  ActAction,
  Ability,
  Anchor,
  AnchorTag,
  ColorId,
  CommandOption,
  Emotion,
  Line,
  MoveAction,
  PlaceDef,
  PlaceId,
  PropPlacement,
  QuestStep,
  ResponseOption,
  Sex,
  Speaker,
  SpeciesDef,
  StepGate,
  StepOf,
} from '../types';

export const L = (en: string, fr: string): Line => ({ en, fr });
export const ok = (en: string, fr: string, icon?: string): ResponseOption => ({ line: L(en, fr), icon, correct: true });
export const no = (en: string, fr: string, icon?: string): ResponseOption => ({ line: L(en, fr), icon, correct: false });

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const low = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

type Pair = readonly [string, string];
const line = (p: Pair | Line): Line => ('en' in p ? p : L(p[0], p[1]));

// ---------------------------------------------------------------------------
// Étapes
// ---------------------------------------------------------------------------

export function say(speaker: Speaker, en: string, fr: string, gate: StepGate = {}, emotion?: Emotion): QuestStep {
  return { kind: 'say', speaker, line: L(en, fr), ...(emotion ? { emotion } : {}), ...gate };
}

export interface AskExtra extends StepGate {
  onCorrect?: Pair | Line;
  pointAt?: string;
  keepOrder?: boolean;
  emotion?: Emotion;
  listen?: boolean;
}

export function ask(speaker: Speaker, en: string, fr: string, options: ResponseOption[], hint: Pair | Line, items: string[], x: AskExtra = {}): QuestStep {
  const { onCorrect, pointAt, keepOrder, emotion, listen, ...gate } = x;
  return {
    kind: 'ask',
    speaker,
    line: L(en, fr),
    options,
    hint: line(hint),
    items,
    ...(onCorrect ? { onCorrect: line(onCorrect) } : {}),
    ...(pointAt ? { pointAt } : {}),
    ...(keepOrder ? { keepOrder } : {}),
    ...(emotion ? { emotion } : {}),
    ...(listen ? { listen } : {}),
    ...gate,
  };
}

export function tap(speaker: Speaker, en: string, fr: string, anchor: string, hint: Pair | Line, items: string[], x: StepGate & { onCorrect?: Pair | Line; photo?: boolean } = {}): QuestStep {
  const { onCorrect, photo, ...gate } = x;
  return { kind: 'tapAnchor', speaker, line: L(en, fr), anchor, hint: line(hint), items, ...(onCorrect ? { onCorrect: line(onCorrect) } : {}), ...(photo ? { photo } : {}), ...gate };
}

/** Jeu d'ordres : la joueuse touche des cartes (« Jump! ») et le personnage obéit. */
export function command(speaker: Speaker, en: string, fr: string, options: CommandOption[], need: number, items: string[], x: StepGate & { onCorrect?: Pair | Line } = {}): QuestStep {
  const { onCorrect, ...gate } = x;
  return { kind: 'command', speaker, line: L(en, fr), options, need, items, ...(onCorrect ? { onCorrect: line(onCorrect) } : {}), ...gate };
}

/** Jeu d'écoute : on entend « Mummy, dance! » et la joueuse touche le bon membre de la famille. */
export function tapActor(speaker: Speaker, order: Line, target: Speaker, action: ActAction, reply: Line, notMe: Line, hint: Line, items: string[], gate: StepGate = {}): QuestStep {
  return { kind: 'tapActor', speaker, line: order, target, action, reply, notMe, hint, items, ...gate };
}

/** Passage à la nuit (true) ou au jour (false). */
export const scene = (night: boolean, gate: StepGate = {}): QuestStep => ({ kind: 'scene', night, ...gate });

export const moveTo = (anchor: string, action: MoveAction, who?: Speaker, gate: StepGate = {}): QuestStep => ({ kind: 'moveTo', anchor, action, ...(who ? { who } : {}), ...gate });
export const back = (who?: Speaker, gate: StepGate = {}): QuestStep => ({ kind: 'moveBack', ...(who ? { who } : {}), ...gate });

export const prop = (id: string, propId: string, spot: number, color?: ColorId, size?: 'big' | 'small'): PropPlacement => ({ id, prop: propId, spot, ...(color ? { color } : {}), ...(size ? { size } : {}) });
/** Objet posé dans le ciel (indice de SKY_SPOTS). */
export const skyProp = (id: string, propId: string, spot: number): PropPlacement => ({ id, prop: propId, spot, sky: true });
export const props = (show: PropPlacement[], gate: StepGate = {}): QuestStep => ({ kind: 'props', show, ...gate });
export const clearProps = (gate: StepGate = {}): QuestStep => ({ kind: 'props', show: [], ...gate });

export interface TapPropsExtra extends StepGate {
  count?: boolean;
  ordered?: boolean;
  wear?: Speaker;
  onCorrect?: Pair | Line;
  wrong?: Record<string, Line>;
}

export function tapProps(speaker: Speaker, en: string, fr: string, targets: string[], hint: Pair | Line, items: string[], x: TapPropsExtra = {}): QuestStep {
  const { count, onCorrect, wrong, ordered, wear, ...gate } = x;
  return {
    kind: 'tapProps',
    speaker,
    line: L(en, fr),
    targets,
    hint: line(hint),
    items,
    ...(count ? { count } : {}),
    ...(onCorrect ? { onCorrect: line(onCorrect) } : {}),
    ...(wrong ? { wrong } : {}),
    ...(ordered ? { ordered } : {}),
    ...(wear ? { wear } : {}),
    ...gate,
  };
}

export function seek(speaker: Speaker, hider: Speaker, hideAt: string, t: { line: Pair; hint: Pair; notHere: Pair; found: Pair }, items: string[], gate: StepGate = {}): QuestStep {
  return { kind: 'seek', speaker, hider, hideAt, line: line(t.line), hint: line(t.hint), notHere: line(t.notHere), found: line(t.found), items, ...gate };
}

export const go = (to: PlaceId, speaker: Speaker, en: string, fr: string, gate: StepGate = {}): QuestStep => ({ kind: 'travel', to, speaker, line: L(en, fr), ...gate });
export const act = (who: Speaker, action: ActAction, en: string, fr: string, speaker?: Speaker, gate: StepGate = {}): QuestStep => ({ kind: 'act', who, action, line: L(en, fr), ...(speaker ? { speaker } : {}), ...gate });
export const reward = (treasure: string, speaker: Speaker, en: string, fr: string): QuestStep => ({ kind: 'reward', treasure, speaker, line: L(en, fr) });
export const end = (speaker: Speaker, en: string, fr: string): StepOf<'celebrate'> => ({ kind: 'celebrate', speaker, line: L(en, fr) });

/** Ajoute une condition à une suite d'étapes. */
export const only = (gate: StepGate, steps: QuestStep[]): QuestStep[] => steps.map((s) => ({ ...s, ...gate }));

// ---------------------------------------------------------------------------
// Mots, décors, espèces
// ---------------------------------------------------------------------------

/** Groupe nominal de réponse (« A baobab », « Water »). */
export function nounOf(word: string): Line | undefined {
  return NOUNS[word];
}

export const anchorsWith = (place: PlaceDef, tag: AnchorTag) => place.anchors.filter((a) => a.tags?.includes(tag));
export const anchor = (place: PlaceDef, id: string): Anchor | undefined => place.anchors.find((a) => a.id === id);

/** Objets du décor qu'on peut nommer (mot validé). */
export const nameable = (place: PlaceDef) => place.anchors.filter((a) => NOUNS[a.word]);

/** Emplacements d'objets hors de l'eau dessinée du décor (on ne pose pas une pomme au milieu du lac). */
export const landSpots = (place: PlaceDef): number[] => place.spots.flatMap((s, i) => (inWater(place.water, s.x, s.y) ? [] : [i]));

/** Cachettes possibles : objet marqué « hide » avec un endroit où se placer. */
export const hidingPlaces = (place: PlaceDef) => place.anchors.filter((a) => a.tags?.includes('hide') && a.stand);

/** Eau douce où boire. */
const DRINKABLE = new Set(['waterhole', 'water', 'lake', 'river', 'pond', 'stream', 'waterfall']);
export const waterPlaces = (place: PlaceDef) => place.anchors.filter((a) => a.tags?.includes('water') && a.stand && DRINKABLE.has(a.word));

/** Réponses oui / non à la question de contrôle d'un objet du décor. */
export function yesNo(yes: boolean): ResponseOption[] {
  return [
    { line: L('Yes, it is!', 'Oui !'), icon: '👍', correct: yes },
    { line: L("No, it isn't.", 'Non.'), icon: '👎', correct: !yes },
  ];
}

export const sibWord = (sex: Sex): Line => (sex === 'girl' ? L('sister', 'sœur') : L('brother', 'frère'));
export const heShe = (sex: Sex): Line => (sex === 'girl' ? L('She', 'Elle') : L('He', 'Il'));

/** Mots des capacités et des actions (« I can swim! », « He's swimming! »). */
export const ABILITY_WORDS: Readonly<Record<Ability, { en: string; fr: string; ing: string; ingFr: string; act: ActAction; icon: string }>> = {
  run: { en: 'run', fr: 'courir', ing: 'running', ingFr: 'court', act: 'run', icon: '🏃' },
  jump: { en: 'jump', fr: 'sauter', ing: 'jumping', ingFr: 'saute', act: 'jump', icon: '🦘' },
  climb: { en: 'climb', fr: 'grimper', ing: 'climbing', ingFr: 'grimpe', act: 'climb', icon: '🧗' },
  swim: { en: 'swim', fr: 'nager', ing: 'swimming', ingFr: 'nage', act: 'swim', icon: '🏊' },
  fly: { en: 'fly', fr: 'voler', ing: 'flying', ingFr: 'vole', act: 'fly', icon: '🪽' },
  dig: { en: 'dig', fr: 'creuser', ing: 'digging', ingFr: 'creuse', act: 'dig', icon: '🕳️' },
  roar: { en: 'roar', fr: 'rugir', ing: 'roaring', ingFr: 'rugit', act: 'roar', icon: '📢' },
  hop: { en: 'hop', fr: 'sautiller', ing: 'hopping', ingFr: 'sautille', act: 'hop', icon: '🐇' },
};

/** Actions de tous les jours, possibles pour toutes les espèces. */
export const DAILY_ACTIONS = {
  sleep: { en: 'sleep', fr: 'dormir', ing: 'sleeping', ingFr: 'dort', act: 'sleep', icon: '😴' },
  eat: { en: 'eat', fr: 'manger', ing: 'eating', ingFr: 'mange', act: 'eat', icon: '😋' },
  dance: { en: 'dance', fr: 'danser', ing: 'dancing', ingFr: 'danse', act: 'dance', icon: '💃' },
  wave: { en: 'wave', fr: 'faire coucou', ing: 'waving', ingFr: 'fait coucou', act: 'wave', icon: '👋' },
} as const;

export type ActionWord = (typeof ABILITY_WORDS)[Ability];
export const ACTION_WORDS: Readonly<Record<string, ActionWord | (typeof DAILY_ACTIONS)[keyof typeof DAILY_ACTIONS]>> = { ...ABILITY_WORDS, ...DAILY_ACTIONS };

/** Façon de boire de l'espèce, ou null si elle ne boit pas à un point d'eau. */
export function drinkMove(sp: SpeciesDef): MoveAction | null {
  switch (sp.drinkStyle) {
    case 'lap':
      return 'drink_lap';
    case 'trunk':
      return 'drink_trunk';
    case 'splay':
      return 'drink_splay';
    case 'sip':
      return 'drink_sip';
    default:
      return null;
  }
}

export const DRINK_LINES: Readonly<Record<string, Line>> = {
  drink_lap: L('Lap, lap, lap! Mmm, the water is good!', "Lape, lape, lape ! Mmm, l'eau est bonne !"),
  drink_trunk: L('Slurp! I drink with my trunk!', 'Slurp ! Je bois avec ma trompe !'),
  drink_splay: L('I spread my long legs… and I drink! Mmm!', "J'écarte mes longues pattes… et je bois ! Mmm !"),
  drink_sip: L('Sip, sip, sip! I drink with my beak!', 'Sip, sip, sip ! Je bois avec mon bec !'),
};

/**
 * Scène « boire » d'une aventure : le personnage va à l'eau et boit à sa façon ;
 * une espèce qui ne boit pas ainsi (koala, animaux marins) s'amuse dans l'eau à la place.
 */
export function drinkScene(sp: SpeciesDef, water: string, who: Speaker = 'father'): QuestStep[] {
  const move = drinkMove(sp);
  if (!move) return [act(who, 'splash', 'Splash! The water is so nice!', "Splash ! L'eau est trop bonne !", who)];
  return [moveTo(water, move, who), say(who, DRINK_LINES[move]!.en, DRINK_LINES[move]!.fr, {}, 'happy'), back(who)];
}

/** Aliment principal de l'espèce et deux aliments qu'elle ne mange pas. */
export function foodsOf(sp: SpeciesDef) {
  const good = PROPS[sp.foods[0] ?? ''];
  const bad = sp.notFoods.map((id) => PROPS[id]).filter((p) => !!p);
  if (!good?.eat || bad.length < 1) throw new Error(`Nourriture incomplète pour ${sp.id}`);
  return { good, bad };
}

/**
 * Scène « repas » d'une aventure : deux bons aliments et deux intrus sur les emplacements
 * donnés ; on touche les bons, un intrus fait dire « I don't eat … ! ».
 * Au niveau débutant : un seul bon aliment et un seul intrus.
 */
export function eatScene(sp: SpeciesDef, spots: readonly [number, number, number, number], who: Speaker = 'father', idPrefix = 'meal'): QuestStep[] {
  const { good, bad } = foodsOf(sp);
  const b2 = bad[1] ?? bad[0]!;
  const g = good.eat!;
  const id = (n: string) => `${idPrefix}_${n}`;
  const wrong = (p: typeof good): Line => L(`I don't eat ${p.eat!.en}! I eat ${g.en}!`, `Je ne mange pas ${p.eat!.frNo} ! Je mange ${g.fr} !`);
  return [
    props([prop(id('g1'), good.id, spots[0]), prop(id('b1'), bad[0]!.id, spots[1])], { maxTier: 'beginner' }),
    props([prop(id('g1'), good.id, spots[0]), prop(id('b1'), bad[0]!.id, spots[1]), prop(id('g2'), good.id, spots[2]), prop(id('b2'), b2.id, spots[3])], { minTier: 'intermediate' }),
    tapProps(who, `I'm hungry! I eat ${g.en}. Can you find it?`, `J'ai faim ! Je mange ${g.fr}. Tu peux en trouver ?`, [id('g1')], L(`Look! I eat ${g.en}.`, `Regarde ! Je mange ${g.fr}.`), [good.word, 'hungry'], {
      maxTier: 'beginner',
      wrong: { [id('b1')]: wrong(bad[0]!) },
      onCorrect: L(`Yes! ${good.noun.en}! Yum!`, `Oui ! ${good.noun.fr} ! Miam !`),
    }),
    tapProps(who, `I'm hungry! I eat ${g.en}. Find all the ${g.en}!`, `J'ai faim ! Je mange ${g.fr}. Trouve tout !`, [id('g1'), id('g2')], L(`Look! I eat ${g.en}.`, `Regarde ! Je mange ${g.fr}.`), [good.word, 'hungry'], {
      minTier: 'intermediate',
      count: true,
      wrong: { [id('b1')]: wrong(bad[0]!), [id('b2')]: wrong(b2) },
      onCorrect: L('Yum! Thank you!', 'Miam ! Merci !'),
    }),
    act(who, 'eat', `Yum, yum! I love ${g.en}!`, `Miam, miam ! J'adore ${g.fr.replace(/^(du|de la|de l'|des) /, (m) => ({ 'du ': 'le ', 'de la ': 'la ', "de l'": "l'", 'des ': 'les ' })[m] ?? m)} !`, who),
    clearProps(),
  ];
}

export const canDo = (sp: SpeciesDef, a: Ability) => sp.can.includes(a);

/** Petit hachage stable (choix reproductibles dans les modèles). */
export function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

/** n emplacements distincts du lieu, dans un ordre stable propre à la graine. */
export function spotsFor(place: PlaceDef, n: number, seed: string): number[] {
  const all = place.spots.map((_, i) => i);
  const start = hash(seed) % all.length;
  const step = [1, 3, 5, 7].find((k) => all.length % k !== 0 || k === 1) ?? 1;
  const out: number[] = [];
  for (let i = 0; out.length < Math.min(n, all.length); i++) {
    const s = (start + i * step) % all.length;
    if (!out.includes(s)) out.push(s);
    if (i > all.length * 2) break;
  }
  return out;
}

/** Élément d'une liste choisi de façon stable. */
export const pickStable = <T>(items: readonly T[], seed: string, offset = 0): T => items[(hash(seed) + offset) % items.length]!;
