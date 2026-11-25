import { describe, expect, it } from 'vitest';
import { clipPlaybackRate } from './speech';
import { paceOf, VOICE_OF_ROLE, VOICE_PACE, type VoiceRole } from './voiceKey';

/**
 * Toutes les voix au même débit pour un même réglage (2026-11-25 : « certaines voix sont trop accélérées »).
 * Débits médians mesurés sur les enregistrements (tools/tts/mesurer_debit.py), en syllabes par seconde.
 */
const MEASURED: Record<string, number> = { bf_isabella: 2.83, af_bella: 3.41, 'af_kore+5': 3.41, 'bf_emma+5': 2.59, bm_daniel: 2.4 };
const ROLES: VoiceRole[] = ['narrator', 'father', 'mother', 'girl', 'boy'];

describe('même débit pour toutes les voix', () => {
  it('chaque voix du jeu a sa correction', () => {
    for (const r of ROLES) expect(VOICE_PACE[VOICE_OF_ROLE[r]], r).toBeDefined();
  });

  it('après correction, chaque voix parle au débit du narrateur (à 5 % près), à tous les réglages', () => {
    for (const speed of [0.5, 0.8, 1, 1.4]) {
      const ref = MEASURED[VOICE_OF_ROLE.narrator]! * clipPlaybackRate(speed, false, paceOf('narrator'));
      for (const r of ROLES) {
        const heard = MEASURED[VOICE_OF_ROLE[r]]! * clipPlaybackRate(speed, false, paceOf(r));
        expect(Math.abs(heard / ref - 1), `${r} à ${speed}`).toBeLessThan(0.05);
      }
    }
  });

  it('la maman et le bébé garçon ne sont plus accélérés ; le narrateur ne bouge pas', () => {
    expect(paceOf('mother')).toBeLessThan(0.9);
    expect(paceOf('boy')).toBeLessThan(0.9);
    expect(paceOf(undefined)).toBe(1);
    expect(clipPlaybackRate(0.8, false, paceOf('narrator'))).toBeCloseTo(1);
  });
});
