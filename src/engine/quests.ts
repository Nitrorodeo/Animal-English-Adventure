/**
 * Moteur de quêtes V2 : pour un lieu, une espèce, un personnage et une famille, on construit
 * les activités possibles (activités génériques compatibles + aventures du continent), on
 * choisit leur variante (objet, couleur, cachette…) pour éviter les répétitions, leur niveau
 * selon les acquis de la joueuse, puis on les valide pas à pas avant de les proposer.
 */
import { ACTIVITY_BY_ID } from '../content/activities';
import { ADVENTURES } from '../content/adventures';
import { archetypeFits, ARCHETYPES } from '../content/archetypes';
import { chatScript } from '../content/dialogues';
import { NOUNS } from '../content/places';
import type { ActivityCtx, ActivityDef, ActorKind, AdventureDef, BiomeDef, QuestArchetype, QuestScript, SpeciesDef, Tier } from '../content/types';
import { nextStageGoal } from './family';
import type { Rng } from './rng';
import { endPlaceOf, finalizeSteps, walkSteps } from './script';
import { chooseTier, itemStatus, scriptItems, statusAtLeast } from './skills';
import { actorId, getFamily, type ActorRef, type Baby, type GameState } from './state';

/** Nombre d'activités entre l'enseignement d'un mot et sa révision (espacement). */
export const RETEST_GAP = 2;
export const HISTORY_SIZE = 10;

export interface QuestContext {
  state: GameState;
  biome: BiomeDef;
  species: SpeciesDef;
  actor: ActorRef;
  rng: Rng;
  /** besoin léger du personnage (jamais punitif) */
  need?: 'thirsty' | null;
}

export function actorKindOf(a: ActorRef): ActorKind {
  return a.kind;
}

export function findBaby(state: GameState, a: ActorRef): Baby | undefined {
  if (a.kind !== 'baby') return undefined;
  return getFamily(state, a.speciesId).babies.find((b) => b.id === a.babyId);
}

function actorMemory(ctx: QuestContext): string[] {
  const fam = getFamily(ctx.state, ctx.species.id);
  if (ctx.actor.kind === 'baby') return findBaby(ctx.state, ctx.actor)?.questMemory ?? [];
  return fam.parentMemory[ctx.actor.role] ?? [];
}

/** Contexte pur passé aux activités. */
export function activityCtx(ctx: QuestContext): ActivityCtx {
  const fam = getFamily(ctx.state, ctx.species.id);
  const memories = [...new Set([...fam.memories, ...actorMemory(ctx)])];
  return {
    species: ctx.species,
    place: ctx.biome,
    actorKind: ctx.actor.kind,
    babies: fam.babies.map((b) => b.sex),
    actorSex: findBaby(ctx.state, ctx.actor)?.sex,
    memories,
    ...(ctx.actor.kind === 'adult' ? { role: ctx.actor.role } : {}),
  };
}

// ---------------------------------------------------------------------------
// Choix du mot enseigné au bébé
// ---------------------------------------------------------------------------

export interface TeachChoice {
  mode: 'new' | 'retest' | 'known';
  anchorId: string;
  word: string;
}

export function pickTeachWord(baby: Baby, biome: BiomeDef, counter: number, rng: Rng): TeachChoice | undefined {
  const teachable = biome.anchors.filter((a) => NOUNS[a.word]);
  if (teachable.length < 3) return undefined;
  // 1. révision espacée d'un mot enseigné mais pas encore retenu
  const due = teachable.filter((a) => a.word in baby.taughtWords && !baby.retainedWords.includes(a.word) && counter - baby.taughtWords[a.word]! >= RETEST_GAP);
  if (due.length) {
    const a = rng.pick(due);
    return { mode: 'retest', anchorId: a.id, word: a.word };
  }
  // 2. un mot nouveau
  const fresh = teachable.filter((a) => !(a.word in baby.taughtWords));
  if (fresh.length) {
    const a = rng.pick(fresh);
    return { mode: 'new', anchorId: a.id, word: a.word };
  }
  // 3. réemploi d'un mot connu (le bébé ne fait pas semblant de l'ignorer)
  const known = teachable.filter((a) => baby.retainedWords.includes(a.word) || a.word in baby.taughtWords);
  const a = rng.pick(known.length ? known : teachable);
  return { mode: 'known', anchorId: a.id, word: a.word };
}

// ---------------------------------------------------------------------------
// Choix de la variante d'une activité
// ---------------------------------------------------------------------------

/** Variante à jouer : une qui n'a pas servi récemment avec cette espèce, si possible. */
export function pickChoice(act: ActivityDef, actx: ActivityCtx, ctx: QuestContext, teach?: TeachChoice): string | undefined {
  let choices = act.choices(actx);
  if (!choices.length) return undefined;
  if (act.id === 'name_object') {
    if (!teach) return undefined;
    const c = `${teach.mode}|${teach.anchorId}`;
    return choices.includes(c) ? c : undefined;
  }
  if (act.id === 'find_water') {
    // « Tu te souviens ? On a trouvé de l'eau ici ! » seulement si c'est vrai
    const remembers = actx.memories.includes(`found_water:${actx.place.id}`);
    choices = choices.filter((c) => c.endsWith('+memory') === remembers);
    if (!choices.length) return undefined;
  }
  const recent = new Set(ctx.state.player.history.filter((h) => h.archetypeId === act.id && h.speciesId === ctx.species.id && h.choice).map((h) => h.choice!));
  const fresh = choices.filter((c) => !recent.has(c));
  return ctx.rng.pick(fresh.length ? fresh : choices);
}

// ---------------------------------------------------------------------------
// Construction d'un script jouable
// ---------------------------------------------------------------------------

/** Filtres de compatibilité (contenu, habitat, personnage, famille). */
export function isCompatible(arch: QuestArchetype, ctx: QuestContext): boolean {
  if (!arch.implemented || !ACTIVITY_BY_ID[arch.id]) return false;
  if (!ctx.species.allowedBiomes.includes(ctx.biome.id)) return false;
  if (arch.allowedBiomes.length && !arch.allowedBiomes.includes(ctx.biome.id)) return false;
  // qui propose ce jeu : papa, maman, ou un bébé assez grand
  const role = ctx.actor.kind === 'adult' ? ctx.actor.role : undefined;
  const stage = findBaby(ctx.state, ctx.actor)?.stage;
  if (!archetypeFits(arch, actorKindOf(ctx.actor), role, stage)) return false;
  if (arch.minBabies && getFamily(ctx.state, ctx.species.id).babies.length < arch.minBabies) return false;
  return true;
}

export interface BuiltQuest {
  archetype: QuestArchetype;
  script: QuestScript;
  teach?: TeachChoice;
  /** variante jouée */
  choice?: string;
}

function validated(script: QuestScript, ctx: QuestContext): QuestScript | undefined {
  const babies = getFamily(ctx.state, ctx.species.id).babies.length;
  const errors = walkSteps(script, { babies, actorKind: ctx.actor.kind, allowedPlaces: ctx.species.allowedBiomes });
  return errors.length ? undefined : script;
}

export function buildQuest(arch: QuestArchetype, ctx: QuestContext): BuiltQuest | undefined {
  if (!isCompatible(arch, ctx)) return undefined;
  const act = ACTIVITY_BY_ID[arch.id]!;
  const actx = activityCtx(ctx);
  let teach: TeachChoice | undefined;
  if (arch.id === 'name_object') {
    const baby = findBaby(ctx.state, ctx.actor);
    if (!baby) return undefined;
    teach = pickTeachWord(baby, ctx.biome, ctx.state.player.activityCounter, ctx.rng);
    if (!teach) return undefined;
  }
  const choice = pickChoice(act, actx, ctx, teach);
  if (choice === undefined) return undefined;
  const babies = actx.babies.length;
  const seed = ctx.state.player.activityCounter * 7919 + choice.length;
  const scriptFor = (tier: Tier): QuestScript | undefined => {
    const raw = act.build(actx, tier, choice);
    if (!raw) return undefined;
    const steps = finalizeSteps(raw, { tier, babies, seed });
    return validated(
      {
        id: `${arch.id}|${choice}|${ctx.species.id}|${ctx.biome.id}|${tier}`,
        archetypeId: arch.id,
        speciesId: ctx.species.id,
        biomeId: ctx.biome.id,
        actorKind: ctx.actor.kind,
        tier,
        steps,
        memoryEvent: act.memoryEvent?.(actx, choice),
        endPlace: endPlaceOf(ctx.biome.id, steps),
      },
      ctx,
    );
  };
  const tier = chooseTier(ctx.state.player, scriptFor, ctx.state.settings.levelOverride);
  const script = scriptFor(tier);
  if (!script) return undefined;
  return { archetype: arch, script, teach, choice };
}

// ---------------------------------------------------------------------------
// Aventures du continent
// ---------------------------------------------------------------------------

export interface AdventureOffer {
  adventure: AdventureDef;
  script: QuestScript;
  /** nombre de fois déjà terminée */
  done: number;
}

export function adventuresFor(species: SpeciesDef): AdventureDef[] {
  return ADVENTURES.filter((a) => a.continentId === species.continentId && a.species.includes(species.id)).sort((a, b) => a.order - b.order);
}

export function buildAdventure(adv: AdventureDef, ctx: QuestContext): AdventureOffer | undefined {
  if (!adv.species.includes(ctx.species.id) || !ctx.species.allowedBiomes.includes(adv.start)) return undefined;
  const raw = adv.steps(ctx.species);
  const babies = getFamily(ctx.state, ctx.species.id).babies.length;
  const seed = ctx.state.player.activityCounter * 104729 + adv.order;
  const scriptFor = (tier: Tier): QuestScript | undefined => {
    const steps = finalizeSteps(raw, { tier, babies, seed });
    return validated(
      {
        id: `${adv.id}|${ctx.species.id}|${tier}`,
        archetypeId: 'adventure',
        speciesId: ctx.species.id,
        biomeId: adv.start,
        actorKind: ctx.actor.kind,
        tier,
        steps,
        memoryEvent: `adventure:${adv.id}`,
        endPlace: endPlaceOf(adv.start, steps),
        adventureId: adv.id,
      },
      ctx,
    );
  };
  const tier = chooseTier(ctx.state.player, scriptFor, ctx.state.settings.levelOverride);
  const script = scriptFor(tier);
  if (!script) return undefined;
  return { adventure: adv, script, done: ctx.state.player.adventuresDone[adv.id] ?? 0 };
}

/**
 * Aventures proposées : celles qui commencent ici d'abord (chaque lieu a la sienne), puis
 * celles pas encore faites, puis dans l'ordre conseillé.
 */
export function selectAdventures(ctx: QuestContext): AdventureOffer[] {
  const here = (o: AdventureOffer) => (o.adventure.start === ctx.biome.id ? 0 : 1);
  return adventuresFor(ctx.species)
    .map((a) => buildAdventure(a, ctx))
    .filter((x): x is AdventureOffer => !!x)
    .sort((a, b) => here(a) - here(b) || Math.min(a.done, 1) - Math.min(b.done, 1) || a.adventure.order - b.adventure.order);
}

// ---------------------------------------------------------------------------
// Sélection : jusqu'à 3 activités distinctes, classées, sans répétition abusive
// ---------------------------------------------------------------------------

export interface RankedActivity extends BuiltQuest {
  score: number;
}

export function rankActivity(q: BuiltQuest, ctx: QuestContext): number {
  const { player } = ctx.state;
  const items = scriptItems(q.script);
  // valeur pédagogique : expressions pas encore autonomes
  const learnable = items.filter((i) => !statusAtLeast(itemStatus(player.items[i]), 'independent')).length;
  let score = 10 + Math.min(learnable, 8) * 2;
  // pertinence du contexte
  if (ctx.need === 'thirsty' && q.archetype.id === 'find_water') score += 15;
  if (q.teach?.mode === 'retest') score += 6;
  // un bébé curieux : tant qu'il lui manque des mots retenus pour grandir, apprendre un mot passe en tête
  if (q.archetype.id === 'name_object' && ctx.actor.kind === 'baby') {
    const baby = findBaby(ctx.state, ctx.actor);
    const goal = baby && nextStageGoal(baby);
    if (baby && goal && baby.retainedWords.length < goal.threshold.retained) score += q.teach?.mode === 'retest' ? 12 : 7;
  }
  if (q.archetype.id === 'greeting' && !player.history.some((h) => h.speciesId === ctx.species.id)) score += 30;
  if (q.archetype.id === 'family_presentation' && !getFamily(ctx.state, ctx.species.id).memories.includes('met_family')) score += 8;
  if (q.archetype.id === 'remember_yesterday') score += 3;
  // jeu propre au décor : il passe devant les jeux qu'on peut faire partout ;
  // un jeu de 1 à 3 lieux (le nid au baobab, l'écho au canyon) passe devant un jeu de tout le continent
  const nPlaces = q.archetype.allowedBiomes.length;
  if (nPlaces) score += nPlaces <= 3 ? 6 : 2;
  // un bébé revient volontiers à ses jeux préférés (sans écraser la variété)
  const likes = findBaby(ctx.state, ctx.actor)?.likes?.[q.archetype.mechanic] ?? 0;
  score += Math.min(likes, 3);
  // anti-répétition (historique des 10 dernières activités)
  const me = actorId(ctx.actor);
  for (const h of player.history) {
    if (h.archetypeId === q.archetype.id) score -= 4;
    if (h.archetypeId === q.archetype.id && h.actorId === me) score -= 4;
  }
  const last2 = player.history.slice(-2);
  if (last2.length === 2 && last2.every((h) => h.mechanic === q.archetype.mechanic)) score -= 20;
  return score + ctx.rng.next() * 3; // un peu de surprise, reproductible
}

const CHAT: QuestArchetype = { id: 'chat', titleEn: 'Chat', titleFr: 'Discuter', icon: '💬', skillIds: ['1.1'], mechanic: 'talk', requiredAnchors: [], allowedBiomes: [], actorKinds: ['adult', 'baby'], implemented: true };

export function selectActivities(ctx: QuestContext, max = 3): RankedActivity[] {
  const built: RankedActivity[] = [];
  for (const arch of ARCHETYPES) {
    const q = buildQuest(arch, ctx);
    if (q) built.push({ ...q, score: rankActivity(q, ctx) });
  }
  built.sort((a, b) => b.score - a.score);
  // une seule activité par mécanique dans la sélection, si possible (variété)
  const out: RankedActivity[] = [];
  for (const q of built) if (out.length < max && !out.some((o) => o.archetype.mechanic === q.archetype.mechanic)) out.push(q);
  for (const q of built) if (out.length < max && !out.includes(q)) out.push(q);
  if (out.length === 0) {
    // QUE-04 : repli conversation toujours disponible
    out.push({ archetype: CHAT, script: chatScript(ctx.species.id, ctx.biome.id, actorKindOf(ctx.actor)), score: 0 });
  }
  return out;
}

export function pushHistory(history: GameState['player']['history'], entry: GameState['player']['history'][number]) {
  return [...history, entry].slice(-HISTORY_SIZE);
}
