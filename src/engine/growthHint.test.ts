import { describe, expect, it } from 'vitest';
// @ts-expect-error -- module Node disponible dans Vitest, sans les types Node dans le projet
import { readFileSync } from 'node:fs';
import { NOUNS, PLACES } from '../content/places';
import type { BiomeDef } from '../content/types';
import { computeStage, GROWTH_THRESHOLDS } from './family';
import { growthStepText, growthView, type Stone } from './growthHint';
import { createRng } from './rng';
import { pickTeachWord, RETEST_GAP } from './quests';
import type { Baby } from './state';

/** Le chemin pour grandir, sur la carte du bébé (2026-11-25). */
const place = Object.values(PLACES).find((p) => p.anchors.filter((a) => NOUNS[a.word]).length >= 4) as BiomeDef;
const words = place.anchors.filter((a) => NOUNS[a.word]).map((a) => a.word);
const bare = Object.values(PLACES).find((p) => p.anchors.filter((a) => NOUNS[a.word]).length < 3) as BiomeDef | undefined;

const baby = (over: Partial<Baby> = {}): Baby => ({
  id: 'lea',
  familyId: 'hedgehog',
  name: 'Lea',
  sex: 'girl',
  birthOrder: 1,
  stage: 'newborn',
  personality: 'curious',
  taughtWords: {},
  retainedWords: [],
  seenItems: [],
  activities: [],
  questMemory: [],
  milestones: [],
  ...over,
});
const kinds = (p: Stone[]) => p.map((s) => s.kind);

describe('le chemin pour grandir', () => {
  it('bébé tout neuf : apprendre un mot, deux jeux, s’en souvenir, deux fois', () => {
    const v = growthView(baby(), place, 0)!;
    expect(v.next).toBe('little');
    expect(RETEST_GAP).toBe(2);
    expect(kinds(v.path)).toEqual(['teach', 'play', 'remember', 'teach', 'play', 'remember']);
  });

  it('les 7 jeux faits une fois, un mot appris il y a longtemps : le prochain pas est 💡, et c’est ce que fera le jeu', () => {
    const b = baby({ seenItems: ['1', '2', '3', '4', '5', '6', '7', '8'], activities: ['a', 'b', 'c', 'd', 'e', 'f', 'name_object'], taughtWords: { [words[0]!]: 3 } });
    const v = growthView(b, place, 10)!;
    expect(v.words).toEqual({ have: 0, need: GROWTH_THRESHOLDS.little.retained });
    expect(kinds(v.path)).toEqual(['remember', 'teach', 'play', 'remember']);
    expect(pickTeachWord(b, place, 10, createRng(1))).toMatchObject({ mode: 'retest', word: words[0] });
    expect(growthStepText(v.path, 'Lea').en).toBe('Lea remembers a word!');
  });

  it('un mot appris à l’instant : jouer d’abord, puis s’en souvenir', () => {
    const v = growthView(baby({ taughtWords: { [words[0]!]: 9 }, activities: ['name_object', 'x'] }), place, 10)!;
    expect(kinds(v.path).slice(0, 2)).toEqual(['play', 'remember']);
    expect(growthStepText(v.path, 'Lea').en).toBe('Play one game, then Lea remembers a word!');
  });

  it('décor sans objets à nommer : aller ailleurs', () => {
    if (bare) expect(kinds(growthView(baby(), bare, 0)!.path)).toEqual(['otherPlace']);
  });

  it('mots retenus atteints : des jeux nouveaux, puis des bonnes réponses ; dernier stade : rien', () => {
    const ok = { retainedWords: ['x', 'y'], taughtWords: { x: 0, y: 0 } };
    expect(kinds(growthView(baby({ ...ok, activities: ['a'] }), place, 10)!.path)[0]).toBe('play');
    expect(kinds(growthView(baby({ ...ok, activities: ['a', 'b'], seenItems: ['1'] }), place, 10)!.path)[0]).toBe('answers');
    expect(growthView(baby({ stage: 'companion' }), place, 0)).toBeNull();
  });

  it('suivre le chemin fait vraiment grandir le bébé (simulation des jeux)', () => {
    // on joue exactement les pierres du chemin, recalculé après chaque jeu, avec de bonnes réponses
    let b = baby();
    let counter = 0;
    for (let turn = 0; turn < 20 && b.stage === 'newborn'; turn++) {
      const v = growthView(b, place, counter)!;
      const s = v.path[0]!;
      const teach = s.kind === 'teach' || s.kind === 'remember' ? pickTeachWord(b, place, counter, createRng(turn)) : undefined;
      const id = teach ? 'name_object' : `game_${turn}`;
      b = {
        ...b,
        seenItems: [...new Set([...b.seenItems, `${id}:1`, `${id}:2`, `${id}:3`])],
        activities: [...new Set([...b.activities, id])],
        ...(teach?.mode === 'new' ? { taughtWords: { ...b.taughtWords, [teach.word]: counter } } : {}),
        ...(teach?.mode === 'retest' ? { retainedWords: [...b.retainedWords, teach.word] } : {}),
      };
      counter++;
      b = { ...b, stage: computeStage(b) };
    }
    expect(b.stage).toBe('little');
    expect(counter).toBeLessThanOrEqual(6);
  });

  it('chaque pierre a son texte anglais et français', () => {
    for (const p of [[{ kind: 'teach' }], [{ kind: 'remember', word: 'tree' }], [{ kind: 'play' }, { kind: 'play' }, { kind: 'remember', word: 'tree' }], [{ kind: 'play' }], [{ kind: 'answers' }], [{ kind: 'otherPlace' }]] as Stone[][]) {
      const t = growthStepText(p, 'Lea');
      expect(t.en.length).toBeGreaterThan(5);
      expect(t.fr.length).toBeGreaterThan(5);
    }
  });

  it('la carte du bébé montre le chemin, les pierres qui lancent le jeu, et le badge « Remember! »', () => {
    const src = readFileSync(new URL('../ui/Habitat.tsx', import.meta.url), 'utf8');
    expect(src).toContain('<GrowthPath');
    expect(src).toContain('onClick={() => onStone(s)}');
    expect(src).toContain("growth?.view.path[0]?.kind === 'remember'");
    expect(src).toContain('growthView(b, biome, state.player.activityCounter)');
  });
});
