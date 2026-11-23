/**
 * Une aventure à soi pour chaque personnage (demande du parent, 2026-11-23 : « tous les personnages ont
 * exactement les mêmes questions »). Papa, Maman et les deux bébés reçoivent chacun une part différente des
 * questions du même parcours ; aucune question ne disparaît du jeu, et le niveau n'est jamais durci.
 */
import { describe, expect, it } from 'vitest';
import { ADVENTURES } from '../content/adventures';
import { getSpecies, SPECIES } from '../content/species';
import { TIERS, type QuestStep, type Tier } from '../content/types';
import { getBiome } from '../content/world';
import { createBaby } from './family';
import { buildAdventure, characterNumber, type QuestContext } from './quests';
import { createRng } from './rng';
import { finalizeSteps, shareSteps } from './script';
import { getFamily, newGameState, withFamily, type ActorRef, type GameState } from './state';

function twoBabies(speciesId: string, tier: Tier): GameState {
  let fam = getFamily(newGameState(), speciesId);
  const r1 = createBaby(fam, 'girl', 'Mia', 'b1');
  if (!r1.ok) throw new Error(r1.error);
  const r2 = createBaby(r1.family, 'boy', 'Leo', 'b2');
  if (!r2.ok) throw new Error(r2.error);
  fam = r2.family;
  const s = withFamily(newGameState(), { ...fam, babies: fam.babies.map((b) => ({ ...b, stage: 'companion' as const })) });
  return { ...s, settings: { ...s.settings, levelOverride: tier } };
}

const WHO = (sp: string): ActorRef[] => [
  { speciesId: sp, kind: 'adult', role: 'father' },
  { speciesId: sp, kind: 'adult', role: 'mother' },
  { speciesId: sp, kind: 'baby', babyId: 'b1' },
  { speciesId: sp, kind: 'baby', babyId: 'b2' },
];
const ctx = (state: GameState, sp: string, place: string, actor: ActorRef): QuestContext => ({ state, species: getSpecies(sp), biome: getBiome(place), actor, rng: createRng(3) });

const PROMPT = (s: QuestStep): string => ('line' in s && s.kind !== 'say' && s.kind !== 'celebrate' ? (s.line as { en: string }).en : s.kind);
const questions = (steps: readonly QuestStep[]) => steps.filter((s) => ['ask', 'tapAnchor', 'tapProps', 'command', 'tapActor', 'seek'].includes(s.kind)).map(PROMPT);

describe('chaque personnage a ses propres questions', () => {
  it('numérote papa, maman et les bébés', () => {
    const st = twoBabies('hedgehog', 'beginner');
    expect(WHO('hedgehog').map((a) => characterNumber(st, a))).toEqual([0, 1, 2, 3]);
  });

  it('les hérissons : les quatre personnages ne se posent pas les mêmes questions, à chaque niveau', () => {
    for (const tier of TIERS) {
      const st = twoBabies('hedgehog', tier);
      for (const adv of ADVENTURES.filter((a) => a.species.includes('hedgehog'))) {
        const per = WHO('hedgehog').map((who) => buildAdventure(adv, ctx(st, 'hedgehog', adv.start, who)));
        per.forEach((o, i) => expect(o, `${adv.id} ${tier} personnage ${i}`).toBeDefined());
        const qs = per.map((o) => questions(o!.script.steps).join('|'));
        expect(new Set(qs).size, `${adv.id} ${tier}`).toBe(4);
      }
    }
  });

  it('aucune question ne disparaît : la réunion des quatre parts redonne tout le parcours', () => {
    for (const sp of SPECIES) {
      for (const adv of ADVENTURES.filter((a) => a.species.includes(sp.id) && sp.allowedBiomes.includes(a.start))) {
        for (const tier of TIERS) {
          const full = finalizeSteps(adv.steps(sp), { tier, babies: 2, seed: 1 });
          const parts = [0, 1, 2, 3].map((k) => shareSteps(full, k, tier));
          const union = new Set(parts.flat());
          expect(full.every((s) => union.has(s)), `${adv.id} ${sp.id} ${tier}`).toBe(true);
        }
      }
    }
  });

  it('le débutant garde la moitié des questions, jamais plus durci ; tout le reste (récit, récompense) est intact', () => {
    const sp = getSpecies('hedgehog');
    const adv = ADVENTURES.find((a) => a.id === 'europe_hog_stream')!;
    const full = finalizeSteps(adv.steps(sp), { tier: 'beginner', babies: 2, seed: 1 });
    const fullQ = questions(full).length;
    for (let k = 0; k < 4; k++) {
      const mine = shareSteps(full, k, 'beginner');
      expect(questions(mine).length).toBeLessThan(fullQ);
      expect(questions(mine).length).toBeGreaterThanOrEqual(Math.floor(fullQ / 2) - 2);
      // les étapes de récit restent toutes, dans le même ordre
      const story = (a: readonly QuestStep[]) => a.filter((s) => ['say', 'celebrate', 'reward', 'moveTo', 'moveBack', 'travel', 'act', 'scene'].includes(s.kind));
      expect(story(mine)).toEqual(story(full));
      // une scène d'objets n'est jamais coupée en deux : autant de poses que de retraits
      const shown = mine.filter((s) => s.kind === 'props' && s.show.length > 0).length;
      const cleared = mine.filter((s) => s.kind === 'props' && s.show.length === 0).length;
      expect(shown).toBeLessThanOrEqual(cleared);
    }
  });

  it('un parcours court n’est pas partagé', () => {
    const few: QuestStep[] = [{ kind: 'say', speaker: 'narrator', line: { en: 'Hi', fr: 'Salut' } }];
    expect(shareSteps(few, 2, 'beginner')).toEqual(few);
  });
});
