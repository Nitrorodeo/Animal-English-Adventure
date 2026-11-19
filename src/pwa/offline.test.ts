import { describe, expect, it } from 'vitest';
import { offlineLabel, statusFromProgress } from './offline';

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
