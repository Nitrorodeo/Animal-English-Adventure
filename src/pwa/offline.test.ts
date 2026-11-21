import { describe, expect, it } from 'vitest';
import { offlineLabel, shouldReloadForUpdate, statusFromProgress, UPDATE_RELOAD_WINDOW_MS } from './offline';

describe('hors-ligne — avancement affiché aux parents', () => {
  it('en cours, terminé, incomplet', () => {
    expect(statusFromProgress({ type: 'offline-progress', done: 10, total: 100, failed: 0 }).state).toBe('downloading');
    expect(statusFromProgress({ type: 'offline-progress', done: 100, total: 100, failed: 0, finished: true }).state).toBe('ready');
    expect(statusFromProgress({ type: 'offline-progress', done: 97, total: 100, failed: 3, finished: true }).state).toBe('partial');
  });
  it('donne un pourcentage lisible', () => {
    expect(offlineLabel({ state: 'downloading', done: 1, total: 3, failed: 0 })).toContain('33 %');
    expect(offlineLabel({ state: 'ready', done: 3, total: 3, failed: 0 })).toContain('sans internet');
    expect(offlineLabel({ state: 'unsupported', done: 0, total: 0, failed: 0 })).toContain('https');
  });
});

describe('hors-ligne — nouvelle version publiée', () => {
  it("recharge une seule fois, juste après l'ouverture, quand une ancienne version était là", () => {
    expect(shouldReloadForUpdate(true, false, 3_000)).toBe(true);
    // première visite : rien d'ancien à remplacer
    expect(shouldReloadForUpdate(false, false, 3_000)).toBe(false);
    // déjà rechargé
    expect(shouldReloadForUpdate(true, true, 3_000)).toBe(false);
    // en pleine partie : on laisse jouer, la version arrivera à la prochaine ouverture
    expect(shouldReloadForUpdate(true, false, UPDATE_RELOAD_WINDOW_MS + 1)).toBe(false);
  });
});
