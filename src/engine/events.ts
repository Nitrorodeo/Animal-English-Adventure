import type { ContinentId, GrowthStage, QuestScript } from '../content/types';
import { computeStage } from './family';
import { placesOfSteps } from './script';
import { pushHistory, type TeachChoice } from './quests';
import { recordQuestAnswers, type AnswerRecord } from './skills';
import { actorId, gameKey, getFamily, type ActorRef, type Baby, type GameState } from './state';

export interface QuestOutcome {
  script: QuestScript;
  mechanic: string;
  actor: ActorRef;
  answers: AnswerRecord[];
  teach?: TeachChoice;
  continentId: ContinentId;
  /** variante jouée (objet, couleur…) pour varier la suivante */
  choice?: string;
}

export interface OutcomeEvents {
  /** le bébé a changé de stade */
  grew?: { babyId: string; from: GrowthStage; to: GrowthStage };
  /** mot appris par le bébé grâce à la joueuse */
  taught?: string;
  /** mot retenu par le bébé lors d'une révision espacée */
  retained?: string;
  /** trésor gagné (aventure) */
  treasure?: string;
  /** nouvelles photos de l'album */
  photos?: string[];
  /** autres bébés qui ont grandi en participant */
  grewOthers?: { babyId: string; from: GrowthStage; to: GrowthStage }[];
}

/** Bébés qui ont participé à la scène (le personnage joué, plus ceux qui y parlent). */
export function participatingBabies(script: QuestScript, actor: ActorRef, babies: readonly Baby[]): string[] {
  const speaks = (who: string) =>
    script.steps.some((s) => ('speaker' in s && s.speaker === who) || ('who' in s && s.who === who) || (s.kind === 'seek' && s.hider === who));
  const out: string[] = [];
  if (actor.kind === 'baby') {
    out.push(actor.babyId);
    const other = babies.find((b) => b.id !== actor.babyId);
    if (other && speaks('sibling')) out.push(other.id);
  } else {
    if (babies[0] && speaks('baby')) out.push(babies[0].id);
    if (babies[1] && speaks('sibling')) out.push(babies[1].id);
  }
  return out;
}

const addUnique = (list: string[], ...values: string[]) => {
  const out = [...list];
  for (const v of values) if (!out.includes(v)) out.push(v);
  return out;
};

/** Contexte de réussite : archétype + espèce + rôle (un même mot dans une autre aventure compte comme nouveau contexte). */
export function contextOf(script: QuestScript, actor: ActorRef): string {
  return `${script.archetypeId}:${script.speciesId}:${actor.kind === 'adult' ? actor.role : 'baby'}`;
}

/**
 * Applique la fin d'une activité : progression de la joueuse (une fois par quête),
 * souvenirs, mémoire et croissance du bébé. Fonction pure.
 */
export function applyQuestOutcome(state: GameState, o: QuestOutcome): { state: GameState; events: OutcomeEvents } {
  const events: OutcomeEvents = {};
  let player = recordQuestAnswers(state.player, o.answers, contextOf(o.script, o.actor));
  const counter = player.activityCounter; // valeur de l'horloge pendant cette activité
  player = {
    ...player,
    activityCounter: counter + 1,
    visitedContinents: addUnique(player.visitedContinents, o.continentId) as ContinentId[],
    history: pushHistory(player.history, { archetypeId: o.script.archetypeId, speciesId: o.script.speciesId, actorId: actorId(o.actor), mechanic: o.mechanic, at: counter, choice: o.choice }),
    placesVisited: addUnique(player.placesVisited, ...placesOfSteps(o.script.biomeId, o.script.steps)),
  };
  const learned = o.answers.filter((a) => a.correct).flatMap((a) => a.items);
  if (learned.length) player = { ...player, words: { ...player.words, [o.continentId]: addUnique(player.words[o.continentId] ?? [], ...learned) } };
  if (o.script.adventureId) {
    const id = o.script.adventureId;
    player = { ...player, adventuresDone: { ...player.adventuresDone, [id]: (player.adventuresDone[id] ?? 0) + 1 } };
  } else {
    // jeu terminé (on ne peut finir un jeu qu'en le réussissant) : sa carte passe en vert pour cet animal
    const key = gameKey(o.actor, o.script.archetypeId);
    player = { ...player, gamesDone: { ...player.gamesDone, [key]: (player.gamesDone[key] ?? 0) + 1 } };
  }
  for (const s of o.script.steps) {
    if (s.kind !== 'reward') continue;
    if (!player.treasures.includes(s.treasure)) events.treasure = s.treasure;
    player = { ...player, treasures: addUnique(player.treasures, s.treasure) };
  }

  const shots = o.script.steps.flatMap((s) => (s.kind === 'tapAnchor' && s.photo ? [`${o.script.biomeId}:${s.anchor}`] : []));
  const fresh = shots.filter((x) => !player.photos.includes(x));
  if (fresh.length) events.photos = fresh;
  if (shots.length) player = { ...player, photos: addUnique(player.photos, ...shots) };

  let family = getFamily(state, o.script.speciesId);
  const memory = o.script.memoryEvent;
  if (memory) family = { ...family, memories: addUnique(family.memories, memory) };

  if (o.actor.kind === 'adult' && memory) {
    family = { ...family, parentMemory: { ...family.parentMemory, [o.actor.role]: addUnique(family.parentMemory[o.actor.role], memory) } };
  }
  const actorBaby = o.actor.kind === 'baby' ? o.actor.babyId : undefined;
  const participants = participatingBabies(o.script, o.actor, family.babies);
  const solved = learned.length > 0;
  family = {
    ...family,
    babies: family.babies.map((b): Baby => {
      if (!participants.includes(b.id)) return b;
      let nb: Baby = {
        ...b,
        seenItems: addUnique(b.seenItems, ...learned),
        activities: addUnique(b.activities, o.script.adventureId ? `adventure:${o.script.adventureId}` : o.script.archetypeId),
        questMemory: memory ? addUnique(b.questMemory, memory) : b.questMemory,
        likes: o.script.adventureId ? (b.likes ?? {}) : { ...b.likes, [o.mechanic]: (b.likes?.[o.mechanic] ?? 0) + 1 },
      };
      if (b.id === actorBaby && o.teach && solved) {
        if (o.teach.mode === 'new' && !(o.teach.word in nb.taughtWords)) {
          nb = { ...nb, taughtWords: { ...nb.taughtWords, [o.teach.word]: counter } };
          events.taught = o.teach.word;
        } else if (o.teach.mode === 'retest' && !nb.retainedWords.includes(o.teach.word)) {
          nb = { ...nb, retainedWords: [...nb.retainedWords, o.teach.word] };
          events.retained = o.teach.word;
        }
      }
      const stage = computeStage(nb);
      if (stage !== nb.stage) {
        const g = { babyId: nb.id, from: nb.stage, to: stage };
        if (b.id === actorBaby || !events.grew) events.grew = g;
        else events.grewOthers = [...(events.grewOthers ?? []), g];
        nb = { ...nb, stage, milestones: addUnique(nb.milestones, `stage:${stage}`) };
      }
      return nb;
    }),
  };

  return {
    state: { ...state, player, families: { ...state.families, [family.speciesId]: family } },
    events,
  };
}
