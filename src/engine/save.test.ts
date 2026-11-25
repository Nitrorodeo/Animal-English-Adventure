import { describe, expect, it } from 'vitest';
import { CORRUPT_KEY, loadGame, memoryStorage, migrate, SAVE_KEY, saveGame, setAsideSave } from './save';
import { newGameState, variableNames } from './state';

/** audit du 2026-11-25 : une famille abîmée laissait l'écran vide à chaque rechargement */
describe('sauvegarde abîmée', () => {
  const withFamilies = (families: unknown) => ({ ...newGameState(), families });

  it('une famille sans bébés ni souvenirs est réparée, le jeu peut s’afficher', () => {
    const s = migrate(withFamilies({ lion: {} }))!;
    expect(s.families.lion).toEqual({ speciesId: 'lion', babies: [], memories: [], parentMemory: { father: [], mother: [] } });
    expect(() => variableNames(s)).not.toThrow();
  });

  it('les champs d’un mauvais type sont remis à vide, les bons sont gardés', () => {
    const baby = { id: 'b1', name: 'Kiara', sex: 'girl', birthOrder: 1, stage: 'young', personality: 'gentle', taughtWords: { tree: 3, bad: 'x' }, retainedWords: ['tree', 7], seenItems: null, activities: [], questMemory: [], milestones: [] };
    const s = migrate(withFamilies({ lion: { speciesId: 'lion', babies: [baby, 'n’importe quoi', { id: 'b2' }], memories: 'oops', parentMemory: { father: ['x'], mother: 5 } }, panda: 'cassé' }))!;
    const f = s.families.lion!;
    expect(f.babies).toHaveLength(1);
    expect(f.babies[0]).toMatchObject({ id: 'b1', name: 'Kiara', stage: 'young', personality: 'gentle', familyId: 'lion', taughtWords: { tree: 3 }, retainedWords: ['tree'], seenItems: [] });
    expect(f.memories).toEqual([]);
    expect(f.parentMemory).toEqual({ father: ['x'], mother: [] });
    expect(s.families.panda).toBeUndefined();
  });

  it('une partie normale traverse la relecture sans rien perdre', () => {
    const baby = { id: 'b1', familyId: 'lion', name: 'Kiara', sex: 'girl' as const, birthOrder: 1 as const, stage: 'little' as const, personality: 'curious' as const, taughtWords: { tree: 2 }, retainedWords: ['tree'], seenItems: ['hello'], activities: ['a'], questMemory: ['q'], milestones: ['m'], likes: { tap: 3 } };
    const fam = { speciesId: 'lion', babies: [baby], memories: ['m1'], parentMemory: { father: ['f'], mother: ['g'] } };
    expect(migrate(withFamilies({ lion: fam }))!.families.lion).toEqual(fam);
  });

  it('chargement d’une sauvegarde abîmée : partie gardée, pas de plantage', () => {
    const st = memoryStorage({ [SAVE_KEY]: JSON.stringify(withFamilies({ lion: { babies: [{ id: 'b', name: 'Leo' }] } })) });
    const { state } = loadGame(st);
    expect(state.families.lion!.babies[0]!.name).toBe('Leo');
    expect(() => variableNames(state)).not.toThrow();
  });

  it('écran de secours « nouvelle partie » : l’ancienne est mise de côté, jamais effacée', () => {
    const st = memoryStorage({ [SAVE_KEY]: '{"abîmée":true}' });
    expect(setAsideSave(st)).toBe(true);
    expect(st.data[SAVE_KEY]).toBeUndefined();
    expect(st.data[CORRUPT_KEY]).toBe('{"abîmée":true}');
  });
});

describe('mémoire du navigateur pleine', () => {
  it('saveGame le dit (false) au lieu de planter : le bandeau peut prévenir', () => {
    const full = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); }, removeItem: () => undefined };
    expect(saveGame(full, newGameState())).toBe(false);
    expect(saveGame(memoryStorage(), newGameState())).toBe(true);
  });
});

describe('sauvegarde abîmée côté joueuse', () => {
  it('historique, mots, objets et lieux d’un mauvais type sont nettoyés (essai à l’écran du 2026-11-25 : « Oops! »)', () => {
    const base = newGameState();
    const raw = {
      ...base,
      player: {
        ...base.player,
        name: 'Test',
        history: [null, 5, 'x', { archetypeId: 'greetings', speciesId: 'lion', actorId: 'lion:father', mechanic: 'quiz', at: 3 }],
        items: { hello: null, cat: 'abc', dog: { seen: 2, correctUnaided: 'x', contexts: [1, 'a'] } },
        words: { africa: null, asia: ['cat', 3] },
        placesVisited: [null, 'savanna'],
        visitedContinents: [42, 'africa'],
        adventuresDone: { a: 'b', c: 2 },
        activityCounter: 'beaucoup',
      },
    };
    const s = migrate(raw)!;
    expect(s.player.name).toBe('Test');
    expect(s.player.history).toEqual([{ archetypeId: 'greetings', speciesId: 'lion', actorId: 'lion:father', mechanic: 'quiz', at: 3 }]);
    expect(s.player.items).toEqual({ dog: { seen: 2, correctUnaided: 0, correctAided: 0, contexts: ['a'] } });
    expect(s.player.words).toEqual({ asia: ['cat'] });
    expect(s.player.placesVisited).toEqual(['savanna']);
    expect(s.player.visitedContinents).toEqual(['africa']);
    expect(s.player.adventuresDone).toEqual({ c: 2 });
    expect(s.player.activityCounter).toBe(0);
  });
});
