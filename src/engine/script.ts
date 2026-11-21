/**
 * Assemblage final d'un script (niveau, famille, ordre des réponses) et validation par parcours
 * pas à pas : on suit le lieu courant (les étapes « travel » en changent) et les objets posés,
 * pour garantir que chaque étape désigne quelque chose qui existe vraiment à l'écran.
 */
import { TREASURES } from '../content/adventures';
import { PROPS, SKY_SPOTS } from '../content/props';
import { PLACES } from '../content/places';
import { ACT_ACTIONS, TIERS, type ActorKind, type PlaceDef, type PlaceId, type QuestScript, type QuestStep, type ResponseOption, type Speaker, type StepGate, type Tier } from '../content/types';
import { createRng } from './rng';

/** Nombre de réponses proposées selon le niveau (la bonne réponse est toujours gardée). */
export const OPTION_COUNT: Readonly<Record<Tier, number>> = { beginner: 2, intermediate: 3, expert: 4 };

const rank = (t: Tier) => TIERS.indexOf(t);

export function gateOk(g: StepGate, tier: Tier, babies: number): boolean {
  if (g.minTier && rank(tier) < rank(g.minTier)) return false;
  if (g.maxTier && rank(tier) > rank(g.maxTier)) return false;
  if (g.needs === 'baby' && babies < 1) return false;
  if (g.needs === 'sibling' && babies < 2) return false;
  return true;
}

function trimOptions(options: ResponseOption[], tier: Tier): ResponseOption[] {
  const max = Math.max(OPTION_COUNT[tier], options.filter((o) => o.correct).length);
  const keep = new Set<ResponseOption>();
  for (const o of options) if (o.correct && keep.size < max) keep.add(o);
  for (const o of options) if (!o.correct && keep.size < max) keep.add(o);
  return options.filter((o) => keep.has(o));
}

export interface FinalizeOpts {
  tier: Tier;
  /** nombre de bébés dans la famille */
  babies: number;
  /** graine de l'ordre des réponses (reproductible) */
  seed: number;
}

/** Filtre les étapes selon le niveau et la famille, réduit et mélange les réponses. */
export function finalizeSteps(steps: readonly QuestStep[], o: FinalizeOpts): QuestStep[] {
  const rng = createRng(o.seed);
  return steps
    .filter((s) => gateOk(s, o.tier, o.babies))
    .map((s): QuestStep => {
      if (s.kind !== 'ask') return s;
      const trimmed = trimOptions(s.options, o.tier);
      return { ...s, options: s.keepOrder ? trimmed : rng.shuffle(trimmed) };
    });
}

/** Lieu où se termine une suite d'étapes. */
export function endPlaceOf(start: PlaceId, steps: readonly QuestStep[]): PlaceId {
  let place = start;
  for (const s of steps) if (s.kind === 'travel') place = s.to;
  return place;
}

/** Lieux traversés (départ compris). */
export function placesOfSteps(start: PlaceId, steps: readonly QuestStep[]): PlaceId[] {
  const out = [start];
  for (const s of steps) if (s.kind === 'travel' && !out.includes(s.to)) out.push(s.to);
  return out;
}

export interface WalkOpts {
  babies: number;
  actorKind: ActorKind;
  /** lieux où l'espèce peut aller (voyage limité à ses habitats) */
  allowedPlaces?: readonly PlaceId[];
}

function speakerOk(sp: Speaker, o: WalkOpts): boolean {
  if (sp === 'baby') return o.actorKind === 'baby' || o.babies >= 1;
  if (sp === 'sibling') return o.babies >= 2;
  return true;
}

/** Vérifie la cohérence des étapes d'un script déjà finalisé. Retourne la liste des erreurs. */
export function walkSteps(script: QuestScript, o: WalkOpts): string[] {
  const errors: string[] = [];
  const err = (i: number, m: string) => errors.push(`${script.id} #${i}: ${m}`);
  const start = PLACES[script.biomeId];
  if (!start) return [`${script.id}: lieu inconnu (${script.biomeId})`];
  let place: PlaceDef = start;
  const continent = place.continentId;
  let shown = new Map<string, { prop: string; spot: number }>();
  const hasAnchor = (id: string) => place.anchors.some((a) => a.id === id);

  script.steps.forEach((s, i) => {
    if ('speaker' in s && s.speaker && !speakerOk(s.speaker, o)) err(i, `personnage absent (${s.speaker})`);
    switch (s.kind) {
      case 'ask':
        if (!s.options.some((x) => x.correct)) err(i, 'question sans bonne réponse');
        if (s.options.length < 2) err(i, 'question avec moins de 2 réponses');
        if (s.pointAt && !hasAnchor(s.pointAt)) err(i, `point montré absent (${s.pointAt})`);
        for (const x of s.options) if (x.anchorCrop && !hasAnchor(x.anchorCrop)) err(i, `carte absente (${x.anchorCrop})`);
        if (new Set(s.options.map((x) => x.line.en)).size !== s.options.length) err(i, 'deux réponses identiques');
        break;
      case 'tapAnchor':
        if (!hasAnchor(s.anchor)) err(i, `point du décor absent (${s.anchor})`);
        break;
      case 'command': {
        const doable = s.options.filter((x) => x.action);
        if (s.need < 1 || doable.length < s.need) err(i, `pas assez d'ordres possibles (${doable.length} < ${s.need})`);
        for (const x of s.options) {
          if (x.action && !ACT_ACTIONS.includes(x.action)) err(i, `action inconnue (${x.action})`);
          if (x.who && !speakerOk(x.who, o)) err(i, `personnage absent (${x.who})`);
        }
        if (new Set(s.options.map((x) => x.line.en)).size !== s.options.length) err(i, 'deux ordres identiques');
        break;
      }
      case 'tapActor':
        if (!['father', 'mother', 'baby', 'sibling'].includes(s.target) || !speakerOk(s.target, o)) err(i, `personnage à toucher absent (${s.target})`);
        if (!ACT_ACTIONS.includes(s.action)) err(i, `action inconnue (${s.action})`);
        break;
      case 'moveTo':
        if (!hasAnchor(s.anchor)) err(i, `point du décor absent (${s.anchor})`);
        if (s.who && !speakerOk(s.who, o)) err(i, `personnage absent (${s.who})`);
        break;
      case 'moveBack':
        if (s.who && !speakerOk(s.who, o)) err(i, `personnage absent (${s.who})`);
        break;
      case 'props': {
        const next = new Map<string, { prop: string; spot: number }>();
        const spots = new Set<string>();
        for (const p of s.show) {
          if (!PROPS[p.prop]) err(i, `objet inconnu (${p.prop})`);
          const max = p.sky ? SKY_SPOTS.length : place.spots.length;
          if (p.spot < 0 || p.spot >= max) err(i, `emplacement absent (${p.spot})`);
          const k = `${p.sky ? 'sky' : 'ground'}:${p.spot}`;
          if (spots.has(k)) err(i, `deux objets au même emplacement (${k})`);
          if (next.has(p.id)) err(i, `identifiant d'objet en double (${p.id})`);
          spots.add(k);
          next.set(p.id, p);
        }
        shown = next;
        break;
      }
      case 'tapProps':
        if (!s.targets.length) err(i, 'aucun objet à toucher');
        for (const t of s.targets) if (!shown.has(t)) err(i, `objet à toucher absent (${t})`);
        for (const w of Object.keys(s.wrong ?? {})) {
          if (!shown.has(w)) err(i, `mauvais objet absent (${w})`);
          if (s.targets.includes(w)) err(i, `objet à la fois bon et mauvais (${w})`);
        }
        if (shown.size <= s.targets.length && !s.count && !s.ordered) err(i, 'aucun choix : tous les objets sont bons');
        if (s.wear) {
          if (!speakerOk(s.wear, o) || s.wear === 'narrator') err(i, `personnage absent (${s.wear})`);
          for (const t of s.targets) if (PROPS[shown.get(t)?.prop ?? '']?.kind !== 'clothes') err(i, `objet à porter qui n'est pas un habit (${t})`);
        }
        break;
      case 'seek': {
        const a = place.anchors.find((x) => x.id === s.hideAt);
        if (!a) err(i, `cachette absente (${s.hideAt})`);
        else if (!a.stand || !a.tags?.includes('hide')) err(i, `cachette impossible (${s.hideAt})`);
        if (s.hider === 'narrator') err(i, 'le narrateur ne peut pas se cacher');
        if (!speakerOk(s.hider, o)) err(i, `personnage absent (${s.hider})`);
        break;
      }
      case 'travel': {
        const to = PLACES[s.to];
        if (!to) err(i, `lieu inconnu (${s.to})`);
        else {
          if (to.continentId !== continent) err(i, `voyage hors du continent (${s.to})`);
          if (to.id === place.id) err(i, `voyage vers le même lieu (${s.to})`);
          if (o.allowedPlaces && !o.allowedPlaces.includes(to.id)) err(i, `lieu interdit à cette espèce (${s.to})`);
          place = to;
        }
        shown = new Map();
        break;
      }
      case 'act':
        if (!ACT_ACTIONS.includes(s.action)) err(i, `action inconnue (${s.action})`);
        if (!speakerOk(s.who, o)) err(i, `personnage absent (${s.who})`);
        break;
      case 'reward':
        if (!TREASURES[s.treasure]) err(i, `trésor inconnu (${s.treasure})`);
        break;
      default:
        break;
    }
  });
  if (script.steps.length === 0) errors.push(`${script.id}: aucune étape`);
  const last = script.steps[script.steps.length - 1];
  if (last && last.kind !== 'celebrate') errors.push(`${script.id}: doit se terminer par une célébration`);
  if (shown.size && last?.kind === 'celebrate') {
    // les objets restent visibles jusqu'à la fin : toléré (l'interface les retire à la sortie)
  }
  return errors;
}
