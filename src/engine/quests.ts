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
import { NOUNS, PLACES } from '../content/places';
import type { ActivityCtx, ActivityDef, ActorKind, AdventureDef, BiomeDef, QuestArchetype, QuestScript, SpeciesDef, Tier } from '../content/types';
import { nextStageGoal } from './family';
import { createRng, type Rng } from './rng';
import { endPlaceOf, finalizeSteps, shareSteps, walkSteps } from './script';
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
  if (arch.speciesIds?.length && !arch.speciesIds.includes(ctx.species.id)) return false;
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

/** Numéro du personnage : 0 papa, 1 maman, 2 et 3 les bébés (par ordre de naissance). */
export function characterNumber(state: GameState, a: ActorRef): number {
  if (a.kind === 'adult') return a.role === 'father' ? 0 : 1;
  const i = getFamily(state, a.speciesId).babies.findIndex((b) => b.id === a.babyId);
  return 2 + (Math.max(i, 0) % 2);
}

export function buildAdventure(adv: AdventureDef, ctx: QuestContext): AdventureOffer | undefined {
  if (!adv.species.includes(ctx.species.id) || !ctx.species.allowedBiomes.includes(adv.start)) return undefined;
  const raw = adv.steps(ctx.species);
  const babies = getFamily(ctx.state, ctx.species.id).babies.length;
  const seed = ctx.state.player.activityCounter * 104729 + adv.order;
  const scriptFor = (tier: Tier): QuestScript | undefined => {
    // chaque personnage a sa part des questions (papa, maman, puis chaque bébé dans l'ordre de naissance)
    const steps = shareSteps(finalizeSteps(raw, { tier, babies, seed }), characterNumber(ctx.state, ctx.actor), tier);
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

/** Petit nombre stable tiré d'un texte : chaque personnage a son propre tirage (deux prénoms de même longueur ne tombent plus pareil). */
export function hashText(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100003;
  return h;
}

/** Familles de jeux (par mécanique) que chaque personnage aime proposer. */
const FATHER_LIKES: readonly string[] = ['guide', 'compare', 'build', 'plan', 'puzzle', 'locate'];
const MOTHER_LIKES: readonly string[] = ['social', 'observe', 'tell', 'talk', 'identify', 'count', 'sort'];
const PERSONALITY_LIKES: Readonly<Record<string, readonly string[]>> = {
  curious: ['teach', 'locate', 'puzzle', 'observe'],
  playful: ['compare', 'build', 'plan', 'locate'],
  gentle: ['social', 'observe', 'tell', 'count'],
  funny: ['talk', 'plan', 'puzzle', 'identify'],
};
const BOY_LIKES: readonly string[] = ['build', 'compare', 'guide'];
const GIRL_LIKES: readonly string[] = ['social', 'tell', 'identify', 'count'];
/** ce que chaque stade de croissance aime (le tout-petit parle et nomme ; le grand raconte et résout) */
const STAGE_LIKES: Readonly<Record<string, readonly string[]>> = {
  newborn: ['teach', 'talk'],
  little: ['talk', 'identify', 'count', 'social'],
  young: ['locate', 'build', 'compare', 'plan'],
  companion: ['puzzle', 'tell', 'guide', 'compare'],
};

/**
 * Affinité d'un personnage avec un jeu : Papa guide et agit, Maman soigne et observe ; un bébé suit sa
 * personnalité, son sexe (petit coup de pouce) et son stade. Un jeu que seul son rôle peut proposer est « à lui ».
 * Ces points servent à départager les jeux : ils ne remplacent ni le jeu de l'espèce ni l'apprentissage des mots
 * (« Teach me a word » garde sa place dans le menu tant que le bébé a besoin de mots pour grandir : voir selectActivities).
 */
/** Le bébé manque-t-il encore de mots retenus pour atteindre son prochain stade ? */
function babyNeedsWords(ctx: QuestContext): boolean {
  if (ctx.actor.kind !== 'baby') return false;
  const baby = findBaby(ctx.state, ctx.actor);
  const goal = baby && nextStageGoal(baby);
  return !!(baby && goal && baby.retainedWords.length < goal.threshold.retained);
}

export function actorAffinity(q: BuiltQuest, ctx: QuestContext): number {
  const m = q.archetype.mechanic;
  let pts = 0;
  const only = q.archetype.roles;
  if (ctx.actor.kind === 'adult') {
    if ((ctx.actor.role === 'father' ? FATHER_LIKES : MOTHER_LIKES).includes(m)) pts += 3;
    if (only && only.length === 1 && only[0] === ctx.actor.role) pts += 3;
  } else {
    const baby = findBaby(ctx.state, ctx.actor);
    if (baby) {
      if (PERSONALITY_LIKES[baby.personality]?.includes(m)) pts += 6;
      if ((baby.sex === 'boy' ? BOY_LIKES : GIRL_LIKES).includes(m)) pts += 3;
      if (STAGE_LIKES[baby.stage]?.includes(m)) pts += 2;
    }
  }
  return pts;
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
  if (q.archetype.id === 'name_object' && babyNeedsWords(ctx)) score += q.teach?.mode === 'retest' ? 16 : 9;
  if (q.archetype.id === 'greeting' && !player.history.some((h) => h.speciesId === ctx.species.id)) score += 30;
  if (q.archetype.id === 'family_presentation' && !getFamily(ctx.state, ctx.species.id).memories.includes('met_family')) score += 8;
  if (q.archetype.id === 'remember_yesterday') score += 3;
  // révisions (1.8, 2.8, 3.8) : seulement après quelques jeux, pas dès l'arrivée
  if (q.archetype.skillIds.some((s) => s.endsWith('.8')) && player.history.length < 5) score -= 12;
  // jeu propre au décor : il passe devant les jeux qu'on peut faire partout ;
  // un jeu de 1 à 3 lieux (le nid au baobab, l'écho au canyon) passe devant un jeu de tout le continent
  // (on compte les lieux du continent où l'on est : l'écho du canyon reste local même s'il y a aussi un écho dans les Alpes)
  const nPlaces = q.archetype.allowedBiomes.filter((b) => PLACES[b]?.continentId === ctx.biome.continentId).length;
  if (nPlaces) score += nPlaces <= 3 ? 8 : 2;
  // le jeu à soi de l'animal (son vocabulaire à lui) passe aussi devant les jeux de partout
  // chacun ses jeux : le parent nommé en premier dans le jeu le mène (bonus entier), l'autre parent et les bébés
  // le proposent moins souvent, pour que les menus de Papa, Maman et des bébés ne commencent pas tous par lui
  if (q.archetype.speciesIds?.includes(ctx.species.id)) {
    const full = q.archetype.speciesIds.length === 1 ? 7 : 4;
    const lead = q.archetype.roles?.find((r) => r !== 'baby');
    const leads = ctx.actor.kind === 'adult' && (!lead || lead === ctx.actor.role);
    // l'autre parent le laisse au premier (−4) ; un bébé le propose comme les autres jeux, selon ses goûts
    score += leads ? full : ctx.actor.kind === 'adult' ? -4 : 1;
  }
  // un bébé revient volontiers à ses jeux préférés (sans écraser la variété)
  const likes = findBaby(ctx.state, ctx.actor)?.likes?.[q.archetype.mechanic] ?? 0;
  score += Math.min(likes, 3);
  // chacun ses jeux : rôle (papa / maman), personnalité, sexe et stade du bébé
  score += actorAffinity(q, ctx);
  // anti-répétition (historique des 10 dernières activités)
  const me = actorId(ctx.actor);
  for (const h of player.history) {
    if (h.archetypeId === q.archetype.id) score -= 4;
    if (h.archetypeId === q.archetype.id && h.actorId === me) score -= 4;
  }
  const last2 = player.history.slice(-2);
  if (last2.length === 2 && last2.every((h) => h.mechanic === q.archetype.mechanic)) score -= 20;
  // jamais deux fois de suite le même jeu (demande du parent, 2026-11-24 : « pas de répétition… pour pas que
  // l'enfant s'ennuie ») : ni juste après l'avoir joué, ni avec ce personnage-là la fois suivante
  if (player.history.at(-1)?.archetypeId === q.archetype.id) score -= 15;
  if ([...player.history].reverse().find((h) => h.actorId === me)?.archetypeId === q.archetype.id) score -= 10;
  return score + ctx.rng.next() * 3; // un peu de surprise, reproductible
}

const CHAT: QuestArchetype = { id: 'chat', titleEn: 'Chat', titleFr: 'Discuter', icon: '💬', skillIds: ['1.1'], mechanic: 'talk', requiredAnchors: [], allowedBiomes: [], actorKinds: ['adult', 'baby'], implemented: true };

/**
 * Jeux que l'aîné(e) propose déjà, ici et maintenant (hors « Teach me a word ») : le second bébé les lui laisse,
 * pour que frère et sœur n'aient pas le même menu. Tirage fixe : le résultat ne dépend que de la partie.
 */
function siblingPicks(ctx: QuestContext): ReadonlySet<string> {
  const baby = findBaby(ctx.state, ctx.actor);
  if (!baby || baby.birthOrder !== 2) return new Set();
  const first = getFamily(ctx.state, ctx.actor.speciesId).babies.find((b) => b.birthOrder === 1);
  if (!first) return new Set();
  const sib: ActorRef = { speciesId: ctx.actor.speciesId, kind: 'baby', babyId: first.id };
  const picks = selectActivities({ ...ctx, actor: sib, rng: createRng(hashText(first.id) + ctx.state.player.activityCounter) });
  return new Set(picks.map((a) => a.archetype.id).filter((id) => id !== 'name_object'));
}

export function selectActivities(ctx: QuestContext, max = 3): RankedActivity[] {
  const built: RankedActivity[] = [];
  const sibling = siblingPicks(ctx);
  for (const arch of ARCHETYPES) {
    const q = buildQuest(arch, ctx);
    if (q) built.push({ ...q, score: rankActivity(q, ctx) - (sibling.has(arch.id) ? 8 : 0) });
  }
  built.sort((a, b) => b.score - a.score);
  // une seule activité par mécanique dans la sélection, si possible (variété)
  const out: RankedActivity[] = [];
  for (const q of built) if (out.length < max && !out.some((o) => o.archetype.mechanic === q.archetype.mechanic)) out.push(q);
  for (const q of built) if (out.length < max && !out.includes(q)) out.push(q);
  // un bébé qui a besoin de mots pour grandir a toujours « Teach me a word » dans son menu, en première carte…
  // sauf pour dire bonjour la première fois, ou si le jeu d'avant était déjà une leçon de mots
  // (jamais deux leçons de suite : l'enfant ne doit pas s'ennuyer)
  const teach = babyNeedsWords(ctx) ? built.find((q) => q.archetype.id === 'name_object') : undefined;
  if (teach) {
    const i = out.indexOf(teach);
    if (i >= 0) out.splice(i, 1);
    else if (out.length >= max) out.pop();
    const tired = ctx.state.player.history.at(-1)?.mechanic === teach.archetype.mechanic;
    const urgent = out[0]?.archetype.id === 'greeting' || (ctx.need === 'thirsty' && out[0]?.archetype.id === 'find_water');
    out.splice(tired || urgent ? Math.min(1, out.length) : 0, 0, teach);
  }
  if (out.length === 0) {
    // QUE-04 : repli conversation toujours disponible
    out.push({ archetype: CHAT, script: chatScript(ctx.species.id, ctx.biome.id, actorKindOf(ctx.actor)), score: 0 });
  }
  return out;
}

export function pushHistory(history: GameState['player']['history'], entry: GameState['player']['history'][number]) {
  return [...history, entry].slice(-HISTORY_SIZE);
}
