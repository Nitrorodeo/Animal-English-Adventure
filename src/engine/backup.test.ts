import { describe, expect, it } from 'vitest';
import { acceptableBackup, BACKUP_MAX_BYTES, hasProgress, historyFileName, parseBackup, shouldRestore } from './backup';
import { newGameState, SAVE_VERSION, type GameState } from './state';

function played(): GameState {
  const s = newGameState();
  return { ...s, onboarded: true, player: { ...s.player, activityCounter: 4, visitedContinents: ['africa'] } };
}

describe('copie de la partie sur le PC', () => {
  it('ne copie pas une partie jamais commencée', () => {
    expect(hasProgress(newGameState())).toBe(false);
    expect(hasProgress(played())).toBe(true);
    const named = newGameState();
    expect(hasProgress({ ...named, player: { ...named.player, name: 'Ava' } })).toBe(true);
  });

  it('relit une copie valide et refuse le reste', () => {
    const s = played();
    expect(parseBackup(JSON.stringify(s))?.player.activityCounter).toBe(4);
    expect(parseBackup(null)).toBeNull();
    expect(parseBackup('')).toBeNull();
    expect(parseBackup('{pas du json')).toBeNull();
    expect(parseBackup(JSON.stringify(newGameState()))).toBeNull();
    expect(parseBackup(JSON.stringify({ ...s, version: SAVE_VERSION + 1 }))).toBeNull();
  });

  it('ne reprend la copie que sur un appareil sans partie, avant que l’enfant joue', () => {
    const b = played();
    expect(shouldRestore('new', false, b)).toBe(true);
    expect(shouldRestore('corrupt', false, b)).toBe(true);
    expect(shouldRestore('loaded', false, b)).toBe(false);
    expect(shouldRestore('migrated', false, b)).toBe(false);
    expect(shouldRestore('new', true, b)).toBe(false);
    expect(shouldRestore('new', false, null)).toBe(false);
  });

  it('le PC refuse les envois vides, énormes ou illisibles', () => {
    expect(acceptableBackup(JSON.stringify(played()))).toBe(true);
    expect(acceptableBackup('')).toBe(false);
    expect(acceptableBackup('null')).toBe(false);
    expect(acceptableBackup('x'.repeat(BACKUP_MAX_BYTES + 1))).toBe(false);
  });

  it('nomme les copies d’historique', () => {
    const d = new Date(2026, 10, 19, 8, 5, 3);
    expect(historyFileName(d, 'day')).toBe('save-2026-11-19.json');
    expect(historyFileName(d, 'erased')).toBe('save-effacee-2026-11-19_08h05m03s.json');
  });
});
