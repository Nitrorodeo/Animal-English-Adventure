import { describe, expect, it } from 'vitest';
import { loadGame, memoryStorage, migrate, saveGame } from './save';
import { parseSpots, placeActor, spotKey } from './spots';
import { newGameState } from './state';

describe('animaux posés au doigt, gardés le lendemain', () => {
  it('la place posée revient après rechargement de la partie', () => {
    const store = memoryStorage();
    const s = placeActor(newGameState(), 'au_outback', 'frilled_lizard:father', { x: 38.7, y: 75.3, h: 21.5 });
    saveGame(store, s);
    const back = loadGame(store);
    expect(back.status).toBe('loaded');
    expect(back.state.player.spots[spotKey('au_outback', 'frilled_lizard:father')]).toEqual({ x: 38.7, y: 75.3, h: 21.5 });
  });

  it('chaque décor et chaque personnage a sa propre place', () => {
    let s = placeActor(newGameState(), 'au_outback', 'frilled_lizard:father', { x: 20, y: 80, h: 20 });
    s = placeActor(s, 'au_outback', 'frilled_lizard:mother', { x: 70, y: 90, h: 22 });
    s = placeActor(s, 'au_gorge', 'frilled_lizard:father', { x: 50, y: 70, h: 18 });
    s = placeActor(s, 'au_outback', 'frilled_lizard:father', { x: 30, y: 85, h: 21 }); // déplacé à nouveau
    expect(Object.keys(s.player.spots)).toHaveLength(3);
    expect(s.player.spots['au_outback|frilled_lizard:father']).toEqual({ x: 30, y: 85, h: 21 });
  });

  it('une ancienne partie sans places se charge, et les places illisibles sont ignorées', () => {
    const old = JSON.parse(JSON.stringify(newGameState()));
    delete old.player.spots;
    expect(migrate(old)!.player.spots).toEqual({});
    expect(
      parseSpots({ 'a|b': { x: 10, y: 50, h: 20 }, 'c|d': { x: 'x', y: 1, h: 1 }, 'e|f': { x: 500, y: 1, h: 1 }, nokey: { x: 1, y: 1, h: 1 }, 'g|h': null }),
    ).toEqual({ 'a|b': { x: 10, y: 50, h: 20 } });
    expect(parseSpots([1, 2])).toEqual({});
  });

  it('le sens où il regarde est gardé aussi', () => {
    const store = memoryStorage();
    saveGame(store, placeActor(newGameState(), 'oc_outback', 'frilled_lizard:mother', { x: 30, y: 80, h: 20, f: -1 }));
    expect(loadGame(store).state.player.spots['oc_outback|frilled_lizard:mother']!.f).toBe(-1);
    expect(parseSpots({ 'a|b': { x: 1, y: 50, h: 9, f: 3 } })['a|b']!.f).toBeUndefined();
  });
});
