/**
 * Lecteur de scènes : interprète un QuestScript étape par étape, sans interface ni minuterie.
 * Fonction pure (état + action → nouvel état + phrases à dire) : l'interface ne fait qu'afficher
 * l'état et jouer les phrases. Aucune pénalité : une erreur donne un indice, et après deux
 * erreurs la bonne réponse est montrée (la réussite est alors marquée « aidée »).
 */
import type { ActAction, Line, MoveAction, PlaceId, PropPlacement, QuestScript, QuestStep, Speaker } from '../content/types';
import { COUNT_WORDS, WELL_DONE } from './dialogue';
import type { AnswerRecord } from './skills';

export type Feedback = null | 'try' | 'ok';

export interface Utter {
  who: Speaker;
  line: Line;
  /** phrase d'indice : « Try again! » + indice */
  retry?: boolean;
}

export interface RunState {
  index: number;
  /** lieu affiché (change avec les étapes travel) */
  place: PlaceId;
  /** petits objets posés dans le décor */
  props: PropPlacement[];
  /** objets déjà touchés dans l'étape tapProps en cours */
  tapped: string[];
  wrong: number;
  feedback: Feedback;
  /** phrase affichée dans la bulle et qui la dit */
  bubble: Utter | null;
  /** personnages déplacés vers un point du décor */
  moves: Partial<Record<Speaker, { anchor: string; action: MoveAction }>>;
  /** animation en cours */
  acting: { who: Speaker; action: ActAction } | null;
  /** personnage caché (cache-cache) : invisible tant qu'il n'est pas trouvé */
  hiding: { who: Speaker; at: string; found: boolean } | null;
  answers: AnswerRecord[];
  /** trésor montré (étape reward) */
  treasure: string | null;
  /** numéro de voyage (déclenche le fondu) */
  travels: number;
  /** décor de nuit */
  night: boolean;
  /** habits portés : personnage → clés d'objets (PROPS) */
  wearing: Partial<Record<Speaker, string[]>>;
  /** photos prises pendant la scène (points du décor), dans l'ordre */
  photos: string[];
}

export interface RunResult {
  state: RunState;
  say: Utter[];
}

export type RunAction =
  | { type: 'choose'; option: number }
  | { type: 'tapAnchor'; anchor: string }
  | { type: 'tapProp'; prop: string }
  /** personnage touché : les rôles qu'il tient dans la scène (ex. ['actor', 'father']) */
  | { type: 'tapActor'; who: Speaker[] }
  | { type: 'advance' };

/** Durée (ms) des étapes automatiques ; null = la joueuse avance elle-même. */
export function autoDelay(step: QuestStep | undefined): number | null {
  if (!step) return null;
  if (step.kind === 'moveTo') return 2400;
  if (step.kind === 'moveBack') return 1100;
  if (step.kind === 'props') return 350;
  if (step.kind === 'scene') return 1200;
  return null;
}

export function startRun(script: QuestScript): RunResult {
  const base: RunState = { index: -1, place: script.biomeId, props: [], tapped: [], wrong: 0, feedback: null, bubble: null, moves: {}, acting: null, hiding: null, answers: [], treasure: null, travels: 0, night: false, wearing: {}, photos: [] };
  return enter(script, base, 0);
}

/** Entrée dans l'étape i : effets automatiques et première phrase. */
function enter(script: QuestScript, prev: RunState, i: number): RunResult {
  const step = script.steps[i];
  let s: RunState = { ...prev, index: i, tapped: [], wrong: 0, feedback: null, bubble: null, acting: null, treasure: null, hiding: null };
  if (!step) return { state: s, say: [] };
  switch (step.kind) {
    case 'say':
    case 'celebrate':
    case 'ask':
    case 'tapAnchor':
    case 'tapProps':
    case 'command':
    case 'tapActor':
      s.bubble = { who: step.speaker, line: step.line };
      break;
    case 'scene':
      s.night = step.night;
      break;
    case 'seek':
      s.bubble = { who: step.speaker, line: step.line };
      s.hiding = { who: step.hider, at: step.hideAt, found: false };
      break;
    case 'travel':
      s = { ...s, place: step.to, props: [], moves: {}, travels: s.travels + 1, bubble: { who: step.speaker, line: step.line } };
      break;
    case 'act':
      s.acting = { who: step.who, action: step.action };
      s.bubble = { who: step.speaker ?? step.who, line: step.line };
      break;
    case 'reward':
      s.treasure = step.treasure;
      s.bubble = { who: step.speaker, line: step.line };
      break;
    case 'moveTo':
      s.moves = { ...s.moves, [step.who ?? 'actor']: { anchor: step.anchor, action: step.action } };
      break;
    case 'moveBack': {
      const moves = { ...s.moves };
      delete moves[step.who ?? 'actor'];
      s.moves = moves;
      break;
    }
    case 'props':
      s.props = step.show;
      break;
  }
  return { state: s, say: s.bubble ? [s.bubble] : [] };
}

/** La joueuse peut passer à la suite (▶). */
export function canAdvance(script: QuestScript, s: RunState): boolean {
  const step = script.steps[s.index];
  if (!step) return false;
  switch (step.kind) {
    case 'say':
    case 'travel':
    case 'act':
    case 'reward':
      return true;
    case 'ask':
    case 'tapAnchor':
    case 'tapProps':
    case 'seek':
    case 'command':
    case 'tapActor':
      return s.feedback === 'ok';
    default:
      return autoDelay(step) !== null; // étapes automatiques : avance forcée possible
  }
}

export function isFinished(script: QuestScript, s: RunState): boolean {
  return script.steps[s.index]?.kind === 'celebrate' || s.index >= script.steps.length;
}

function success(s: RunState, who: Speaker, items: string[], onCorrect: Line | undefined, extra: Utter[] = []): RunResult {
  const bubble: Utter = { who, line: onCorrect ?? WELL_DONE };
  return { state: { ...s, feedback: 'ok', bubble, answers: [...s.answers, { items, correct: true, aided: s.wrong > 0 }] }, say: [...extra, bubble] };
}

function failure(s: RunState, who: Speaker, hint: Line, own?: Line): RunResult {
  const bubble: Utter = own ? { who, line: own } : { who, line: hint, retry: true };
  return { state: { ...s, feedback: 'try', wrong: s.wrong + 1, bubble }, say: [bubble] };
}

export function runAction(script: QuestScript, s: RunState, a: RunAction): RunResult {
  const step = script.steps[s.index];
  if (a.type === 'advance') {
    if (!canAdvance(script, s) && !isFinished(script, s)) return { state: s, say: [] };
    return enter(script, s, s.index + 1);
  }
  if (!step || s.feedback === 'ok') return { state: s, say: [] };
  switch (step.kind) {
    case 'ask': {
      if (a.type !== 'choose') break;
      const o = step.options[a.option];
      if (!o) break;
      return o.correct ? success(s, step.speaker, step.items, step.onCorrect) : failure(s, step.speaker, step.hint);
    }
    case 'tapAnchor': {
      if (a.type !== 'tapAnchor') break;
      if (a.anchor !== step.anchor) return failure(s, step.speaker, step.hint);
      return success(step.photo ? { ...s, photos: [...s.photos, a.anchor] } : s, step.speaker, step.items, step.onCorrect);
    }
    case 'command': {
      if (a.type !== 'choose') break;
      const o = step.options[a.option];
      if (!o) break;
      const who = o.who ?? 'actor';
      const order: Utter = { who: 'narrator', line: o.line };
      const reply: Utter = { who, line: o.reply };
      // ordre impossible (« Fly! » pour un lion) : réponse drôle, ni erreur ni progrès
      if (!o.action) return { state: { ...s, bubble: reply, acting: null }, say: [order, reply] };
      const key = String(a.option);
      const tapped = s.tapped.includes(key) ? s.tapped : [...s.tapped, key];
      const next: RunState = { ...s, tapped, acting: { who, action: o.action }, bubble: reply };
      if (tapped.length < step.need) return { state: next, say: [order, reply] };
      return success(next, step.speaker, step.items, step.onCorrect, [order, reply]);
    }
    case 'tapProps': {
      if (a.type !== 'tapProp' || s.tapped.includes(a.prop)) break;
      if (step.targets.includes(a.prop)) {
        // dans l'ordre : un objet touché trop tôt donne l'indice (sans pénalité)
        if (step.ordered && step.targets[s.tapped.length] !== a.prop) return failure(s, step.speaker, step.hint);
        const tapped = [...s.tapped, a.prop];
        const counted: Utter[] = step.count ? [{ who: step.speaker, line: COUNT_WORDS[tapped.length - 1]! }] : [];
        let next: RunState = { ...s, tapped };
        if (step.wear) {
          const key = s.props.find((p) => p.id === a.prop)?.prop;
          if (key) next = { ...next, wearing: { ...s.wearing, [step.wear]: [...(s.wearing[step.wear] ?? []), key] } };
        }
        if (tapped.length < step.targets.length) {
          const bubble = counted[0] ?? s.bubble;
          return { state: { ...next, bubble }, say: counted };
        }
        return success(next, step.speaker, step.items, step.onCorrect, counted);
      }
      return failure(s, step.speaker, step.hint, step.wrong?.[a.prop]);
    }
    case 'tapActor': {
      if (a.type !== 'tapActor' || !a.who.length) break;
      if (a.who.includes(step.target)) return success({ ...s, acting: { who: step.target, action: step.action } }, step.target, step.items, step.reply);
      // un autre personnage : « Not me! » dit par lui, puis l'indice
      const tapped = a.who.find((w) => w !== 'actor') ?? a.who[0]!;
      return s.wrong >= 1 ? failure(s, step.speaker, step.hint) : failure(s, tapped, step.hint, step.notMe);
    }
    case 'seek': {
      if (a.type !== 'tapAnchor') break;
      if (a.anchor === step.hideAt) {
        const r = success({ ...s, hiding: { who: step.hider, at: step.hideAt, found: true } }, step.hider, step.items, step.found);
        return r;
      }
      // pas ici : la phrase propre d'abord, puis l'indice
      return s.wrong >= 1 ? failure(s, step.speaker, step.hint) : failure(s, step.speaker, step.hint, step.notHere);
    }
    default:
      break;
  }
  return { state: s, say: [] };
}

/** Bonne réponse à mettre en évidence (aide après deux erreurs). */
export function revealTarget(script: QuestScript, s: RunState): { anchor?: string; props?: string[]; option?: number; actor?: Speaker } | null {
  const step = script.steps[s.index];
  if (!step || s.wrong < 2 || s.feedback === 'ok') return null;
  if (step.kind === 'ask') return { option: step.options.findIndex((o) => o.correct) };
  if (step.kind === 'tapAnchor') return { anchor: step.anchor };
  if (step.kind === 'seek') return { anchor: step.hideAt };
  if (step.kind === 'tapActor') return { actor: step.target };
  if (step.kind === 'tapProps') {
    const left = step.targets.filter((t) => !s.tapped.includes(t));
    return { props: step.ordered ? left.slice(0, 1) : left };
  }
  return null;
}
