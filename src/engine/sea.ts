/**
 * Moteur des jeux bonus de la mer : manches déterministes (graine) et lecteur pur.
 * Même règle que les scènes : une erreur → indice ; deux erreurs → la bonne réponse brille.
 * L'interface (src/ui/SeaBonus.tsx) ne fait qu'afficher l'état et dire les répliques.
 */
import type { VoiceRole } from '../audio/voiceKey';
import { DOLPHINS, dolphinOrder, numberWord, SEA_THINGS, seaFriend, TURTLE, WHALE, whaleCount, whaleYes, type DolphinId, type DolphinMove, type SeaGameId, type SeaThing } from '../content/sea';
import type { Line } from '../content/types';
import { createRng } from './rng';
import { recordQuestAnswers, type AnswerRecord } from './skills';
import type { PlayerState } from './state';

export interface SeaChoice {
  /** identifiant de ce qu'on touche : '3', 'crab', 'big'… */
  id: string;
  icon?: string;
  label?: Line;
}

export interface SeaRound {
  /** ce que dit l'animal (ou la voix) pour lancer la manche */
  prompt: Line;
  promptVoice: VoiceRole;
  choices: SeaChoice[];
  answer: string;
  items: string[];
  /** réplique quand c'est trouvé, et qui la dit */
  yes: Line;
  yesVoice: VoiceRole;
  /** baleine : nombre de jets d'eau à montrer */
  splashes?: number;
  /** dauphins : geste du bon dauphin */
  move?: DolphinMove;
}

export interface Utter {
  voice: VoiceRole;
  line: Line;
}

export interface SeaState {
  game: SeaGameId;
  rounds: SeaRound[];
  /** -1 : introduction ; rounds.length : fin */
  index: number;
  wrong: number;
  feedback: 'try' | 'ok' | null;
  /** la bonne réponse brille (après deux erreurs) */
  reveal: boolean;
  answers: AnswerRecord[];
}

const shuffle = <T>(xs: readonly T[], next: () => number): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};

/** Trois nombres consécutifs entre 1 et 5 qui contiennent n (la bonne carte n'est pas toujours au milieu). */
export function numberChoices(n: number, pick: number): number[] {
  const lo = Math.max(1, n - 2);
  const hi = Math.min(n, 3);
  const start = lo + (pick % (hi - lo + 1));
  return [start, start + 1, start + 2];
}

export function seaRounds(game: SeaGameId, seed: number): SeaRound[] {
  const rng = createRng(seed);
  const next = () => rng.next();
  const voice = seaFriend(game).voice;
  if (game === 'whale') {
    return shuffle([1, 2, 3, 4, 5], next)
      .slice(0, 3)
      .map((n) => ({
        prompt: WHALE.ask,
        promptVoice: voice,
        choices: numberChoices(n, Math.floor(next() * 3)).map((k) => ({ id: String(k), label: numberWord(k) })),
        answer: String(n),
        items: [numberWord(n).en.toLowerCase()],
        yes: whaleYes(n),
        yesVoice: voice,
        splashes: n,
      }));
  }
  if (game === 'turtle') {
    return shuffle(SEA_THINGS, next)
      .slice(0, 3)
      .map((t) => {
        const others = shuffle(SEA_THINGS.filter((x) => x.id !== t.id), next).slice(0, 2);
        return {
          prompt: t.find,
          promptVoice: voice,
          choices: shuffle([t, ...others], next).map((x: SeaThing) => ({ id: x.id, icon: x.icon })),
          answer: t.id,
          items: [t.id],
          yes: t.yes,
          yesVoice: voice,
        };
      });
  }
  // dauphins : 4 ordres, deux pour chacun, chaque geste au moins une fois
  const who: DolphinId[] = shuffle(['big', 'big', 'little', 'little'] as DolphinId[], next);
  const moves: DolphinMove[] = shuffle(['jump', 'swim', 'splash', (['jump', 'swim', 'splash'] as const)[Math.floor(next() * 3)]!], next);
  return who.map((d, i) => ({
    prompt: dolphinOrder(d, moves[i]!),
    promptVoice: 'narrator',
    choices: [{ id: 'big' }, { id: 'little' }],
    answer: d,
    items: [d, moves[i]!],
    yes: DOLPHINS.reply[moves[i]!],
    yesVoice: DOLPHINS.voice[d],
    move: moves[i]!,
  }));
}

export const INTRO: Record<SeaGameId, Line> = { whale: WHALE.intro, turtle: TURTLE.intro, dolphins: DOLPHINS.intro };
export const OUTRO: Record<SeaGameId, Line> = { whale: WHALE.end, turtle: TURTLE.end, dolphins: DOLPHINS.end };
const VOICE_INTRO: Record<SeaGameId, VoiceRole> = { whale: 'father', turtle: 'mother', dolphins: 'girl' };

export function startSea(game: SeaGameId, seed: number): { state: SeaState; say: Utter[] } {
  return { state: { game, rounds: seaRounds(game, seed), index: -1, wrong: 0, feedback: null, reveal: false, answers: [] }, say: [{ voice: VOICE_INTRO[game], line: INTRO[game] }] };
}

export const currentRound = (s: SeaState): SeaRound | undefined => s.rounds[s.index];
export const seaDone = (s: SeaState) => s.index >= s.rounds.length;

/** Passer à la manche suivante (après l'intro ou une bonne réponse). */
export function seaNext(s: SeaState): { state: SeaState; say: Utter[] } {
  if (seaDone(s) || (s.index >= 0 && s.feedback !== 'ok')) return { state: s, say: [] };
  const state: SeaState = { ...s, index: s.index + 1, wrong: 0, feedback: null, reveal: false };
  const r = currentRound(state);
  if (!r) return { state, say: [{ voice: VOICE_INTRO[s.game], line: OUTRO[s.game] }] };
  return { state, say: [{ voice: r.promptVoice, line: r.prompt }] };
}

/** Indice après une erreur, et qui le dit. `tapped` : ce qui a été touché (le mauvais dauphin répond). */
function hint(s: SeaState, r: SeaRound, tapped: string, second: boolean): Utter[] {
  if (s.game === 'whale') return [{ voice: r.promptVoice, line: second ? whaleCount(r.splashes!) : WHALE.again }];
  if (s.game === 'turtle') return [{ voice: r.promptVoice, line: SEA_THINGS.find((t) => t.id === r.answer)!.oops }];
  const target = r.answer as DolphinId;
  if (second) return [{ voice: 'narrator', line: DOLPHINS.hint[target] }];
  return [{ voice: DOLPHINS.voice[tapped as DolphinId], line: DOLPHINS.notMe[tapped as DolphinId] }];
}

export function seaChoose(s: SeaState, id: string): { state: SeaState; say: Utter[] } {
  const r = currentRound(s);
  if (!r || s.feedback === 'ok') return { state: s, say: [] };
  if (id === r.answer) {
    const answers = [...s.answers, { items: r.items, correct: true, aided: s.wrong > 0 }];
    return { state: { ...s, feedback: 'ok', answers }, say: [{ voice: r.yesVoice, line: r.yes }] };
  }
  const wrong = s.wrong + 1;
  const answers = s.wrong === 0 ? [...s.answers, { items: r.items, correct: false, aided: false }] : s.answers;
  return { state: { ...s, wrong, feedback: 'try', reveal: wrong >= 2, answers }, say: hint(s, r, id, wrong >= 2) };
}

/** Progrès d'anglais gagnés pendant le jeu (passeport, espace parents). */
export function seaReward(player: PlayerState, s: SeaState): PlayerState {
  return recordQuestAnswers(player, s.answers, `sea:${s.game}`);
}
