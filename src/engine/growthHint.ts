import { NOUNS } from '../content/places';
import type { BiomeDef, GrowthStage } from '../content/types';
import { growthPercent, growthProgress, nextStageGoal } from './family';
import { RETEST_GAP } from './quests';
import type { Baby } from './state';

/**
 * Le chemin pour grandir, montré sur la carte du bébé (demande du parent, 2026-11-25 : « Je ne comprends pas à quel
 * moment le bébé grandit. J'ai fait tous les jeux » puis « il faut vraiment le parcours pour faire grandir et évoluer…
 * Ça doit être simple et amusant »).
 *
 * Une rangée de pierres, une par jeu à faire, jusqu'au gâteau. La croissance demande des MOTS RETENUS : un mot appris
 * dans « Teach me a word » (🔎) que le bébé ressort au moins RETEST_GAP jeux plus tard (💡), dans un décor où l'objet
 * est dessiné (pickTeachWord). Entre les deux, on joue à n'importe quel jeu (🎲, de préférence un jeu jamais fait
 * avec lui, ce qui compte aussi pour les « jeux différents »). Le chemin est recalculé après chaque jeu.
 */
export type Stone =
  /** « Teach me a word » : apprendre un nouveau mot au bébé */
  | { kind: 'teach' }
  /** « Teach me a word » : le bébé ressort un mot appris avant (il le retient) */
  | { kind: 'remember'; word: string }
  /** un jeu, n'importe lequel (un jeu nouveau de préférence) */
  | { kind: 'play' }
  /** encore des bonnes réponses */
  | { kind: 'answers' }
  /** « Teach me a word » ne se joue pas dans ce décor (moins de 3 objets à nommer) */
  | { kind: 'otherPlace' };

export interface Need {
  have: number;
  need: number;
}

export interface GrowthView {
  next: GrowthStage;
  /** 0 à 1 */
  percent: number;
  words: Need;
  seen: Need;
  games: Need;
  /** les pierres à suivre, la première est la prochaine chose à faire ; jamais vide */
  path: Stone[];
}

/** au-delà, la rangée serait trop longue pour l'écran : on montre les premières, puis « … » */
export const PATH_MAX = 8;

/** `null` au dernier stade. */
export function growthView(baby: Baby, biome: Pick<BiomeDef, 'anchors'>, counter: number): GrowthView | null {
  const goal = nextStageGoal(baby);
  if (!goal) return null;
  const p = growthProgress(baby);
  const t = goal.threshold;
  const words = { have: Math.min(p.retained, t.retained), need: t.retained };
  const seen = { have: Math.min(p.seen, t.seen), need: t.seen };
  const games = { have: Math.min(p.activities, t.activities), need: t.activities };
  return { next: goal.stage, percent: growthPercent(baby), words, seen, games, path: buildPath(baby, biome, counter, words, seen, games) };
}

function buildPath(baby: Baby, biome: Pick<BiomeDef, 'anchors'>, counter: number, words: Need, seen: Need, games: Need): Stone[] {
  const path: Stone[] = [];
  const missingWords = words.need - words.have;
  if (missingWords > 0) {
    const teachable = biome.anchors.filter((a) => NOUNS[a.word]);
    if (teachable.length < 3) return [{ kind: 'otherPlace' }];
    // mots appris ici et pas encore retenus, le plus ancien d'abord (même ordre que pickTeachWord)
    const pending = teachable
      .filter((a) => a.word in baby.taughtWords && !baby.retainedWords.includes(a.word))
      .map((a) => ({ word: a.word, at: baby.taughtWords[a.word]! }))
      .sort((a, b) => a.at - b.at);
    const freshWords = teachable.filter((a) => !(a.word in baby.taughtWords)).map((a) => a.word);
    let clock = counter;
    for (let i = 0; i < missingWords; i++) {
      const old = pending[i];
      let word: string;
      let at: number;
      if (old) {
        word = old.word;
        at = old.at;
      } else {
        word = freshWords[i - pending.length] ?? '';
        path.push({ kind: 'teach' });
        at = clock++;
      }
      // les jeux qui manquent avant que le bébé puisse ressortir ce mot
      while (clock - at < RETEST_GAP) {
        path.push({ kind: 'play' });
        clock++;
      }
      path.push({ kind: 'remember', word });
      clock++;
    }
  }
  // jeux différents encore à faire : chaque 🎲 en est un (on lance un jeu nouveau), « Teach me a word » en est un aussi
  const planned = path.filter((s) => s.kind === 'play').length + (path.some((s) => s.kind !== 'play') && !baby.activities.includes('name_object') ? 1 : 0);
  for (let i = planned; i < games.need - games.have; i++) path.push({ kind: 'play' });
  // bonnes réponses : chaque jeu en donne quelques-unes ; ce qui manque encore, environ 3 par ⭐
  const missingSeen = seen.need - seen.have - path.length;
  for (let i = 0; i < Math.min(3, Math.ceil(missingSeen / 3)); i++) path.push({ kind: 'answers' });
  return path.length ? path : [{ kind: 'answers' }];
}

/** Ce que montre et dit chaque pierre. */
export const STONE_ICON: Record<Stone['kind'], string> = { teach: '🔎', remember: '💡', play: '🎲', answers: '⭐', otherPlace: '🗺️' };

/** Phrase courte de la prochaine pierre, en anglais (montrée) et en français (aide du parent). */
export function growthStepText(path: readonly Stone[], name: string): { en: string; fr: string } {
  const first = path[0] ?? { kind: 'answers' };
  switch (first.kind) {
    case 'teach':
      return { en: `Teach ${name} a new word!`, fr: `Apprends un nouveau mot à ${name} (🔎 « Apprends-moi un mot »).` };
    case 'remember':
      return { en: `${name} remembers a word!`, fr: `${name} va se souvenir d'un mot appris avant : touche 💡 (« Apprends-moi un mot »).` };
    case 'play': {
      const n = path.findIndex((s) => s.kind !== 'play');
      const games = n < 0 ? path.length : n;
      if (path[games]?.kind === 'remember')
        return games > 1
          ? { en: `Play ${games} games, then ${name} remembers a word!`, fr: `Joue ${games} jeux (🎲 n'importe lesquels), ensuite ${name} se souviendra d'un mot.` }
          : { en: `Play one game, then ${name} remembers a word!`, fr: `Joue un jeu (🎲 n'importe lequel), ensuite ${name} se souviendra d'un mot.` };
      return { en: `Play a new game with ${name}!`, fr: `Joue un jeu jamais fait avec ${name}.` };
    }
    case 'answers':
      return { en: `Play more games with ${name}!`, fr: `Encore quelques jeux avec ${name}.` };
    case 'otherPlace':
      return { en: `Go to another place to teach ${name} a word!`, fr: `Va dans un autre décor pour jouer à « Apprends-moi un mot ».` };
  }
}
