import { describe, expect, it } from 'vitest';
import { acceptableBackup, parseBackup } from './backup';
import { parseRemote } from './cloud';
import { fromOldEra, loadGame, memoryStorage, OLD_ERA_KEY, SAVE_KEY, saveGame } from './save';
import { newGameState, SAVE_ERA, type GameState } from './state';

/** « reinitialise toute les parties , on recommnece a zero avec ma fille » (2026-11-25) : sur tous les appareils. */

function oldGame(): Record<string, unknown> {
  const s: GameState = {
    ...newGameState(),
    onboarded: true,
    player: { ...newGameState().player, name: 'Mia', gamesDone: { hello: 2 }, placesVisited: ['savanna_waterhole'] as never },
    families: { lion: { speciesId: 'lion', babies: [], memories: ['greeted_player'], parentMemory: { father: [], mother: [] } } },
    settings: { ...newGameState().settings, speechSpeed: 0.9 },
    circle: { code: 'les-copains-42', id: 'mia0000001' },
  };
  const { era: _era, ...raw } = s; // une partie d'avant n'a pas de génération
  return raw;
}

describe('remise à zéro générale des parties', () => {
  it('une partie neuve porte la génération en cours ; une partie d’avant est reconnue', () => {
    expect(newGameState().era).toBe(SAVE_ERA);
    expect(fromOldEra(newGameState())).toBe(false);
    expect(fromOldEra({ ...newGameState(), era: 0 })).toBe(true);
  });

  it('à l’ouverture, une partie d’avant repart de l’accueil (prénom redemandé) ; la copie est gardée sur l’appareil', () => {
    const text = JSON.stringify(oldGame());
    const storage = memoryStorage({ [SAVE_KEY]: text });
    const r = loadGame(storage);
    expect(r.status).toBe('new');
    expect(r.state.player.name).toBe('Explorer');
    expect(r.state.onboarded).toBe(false);
    expect(r.state.families).toEqual({});
    expect(r.state.era).toBe(SAVE_ERA);
    // ce qui n'est pas de la progression reste : cercle d'amis et réglages du parent
    expect(r.state.circle).toEqual({ code: 'les-copains-42', id: 'mia0000001' });
    expect(r.state.settings.speechSpeed).toBe(0.9);
    expect(storage.data[OLD_ERA_KEY]).toBe(text);
    expect(storage.data[SAVE_KEY]).toBeUndefined();
  });

  it('une partie commencée après la remise à zéro est gardée telle quelle', () => {
    const storage = memoryStorage();
    const s = { ...newGameState(), player: { ...newGameState().player, name: 'Mia' } };
    saveGame(storage, s);
    const r = loadGame(storage);
    expect(r.status).toBe('loaded');
    expect(r.state.player.name).toBe('Mia');
  });

  it('ni la copie du PC ni le partage en ligne ne ramènent une partie d’avant', () => {
    const text = JSON.stringify(oldGame());
    expect(parseBackup(text)).toBeNull();
    expect(acceptableBackup(text)).toBe(false);
    const remote = parseRemote(JSON.stringify({ savedAt: 5, state: oldGame() }));
    expect(remote?.state.player.name).toBe('Explorer');
    expect(remote?.state.families).toEqual({});
    expect(remote?.state.circle?.id).toBe('mia0000001');
  });
});
