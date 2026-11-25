import { describe, expect, it } from 'vitest';
import { SPECIES } from './species';
import { activityVariants, STRUCTURAL_CONFIGS } from '../engine/variants';
import { linesOf } from '../engine/dialogue';
import { COLD_NATIVE } from './activities/world';

/**
 * « a » devant un son voyelle : l'enfant entendait « That's not a egg! », « a apple »… (audit du 2026-11-25).
 * Exceptions qui se prononcent avec un son « you » ou « wo » : a eucalyptus, a unicorn, a one…
 */
const A_BEFORE_VOWEL = /\b[Aa] (?!eu|uni|use|one|once)[aeiouAEIOU]\w*/;

describe('anglais correct', () => {
  it('jamais « a » devant un son voyelle, dans toutes les scènes de toutes les espèces', () => {
    const bad = new Set<string>();
    for (const v of activityVariants(STRUCTURAL_CONFIGS, SPECIES)) {
      for (const l of linesOf(v.script)) if (A_BEFORE_VOWEL.test(l.en)) bad.add(l.en);
      for (const st of v.script.steps) {
        const wrong = (st as { wrong?: Record<string, { en?: string } | undefined> }).wrong;
        for (const l of Object.values(wrong ?? {})) if (l?.en && A_BEFORE_VOWEL.test(l.en)) bad.add(l.en);
      }
    }
    expect([...bad]).toEqual([]);
  });
});

/** faits justes et situations cohérentes (audit du 2026-11-25) */
describe('faits et situations', () => {
  const all = () => [...activityVariants(STRUCTURAL_CONFIGS, SPECIES)].map((v) => v.script);

  it('jeu de la météo : les habits sont pour l’enfant, pas pour l’animal', () => {
    const bad = new Set<string>();
    for (const s of all().filter((x) => x.archetypeId === 'weather_check')) for (const l of linesOf(s)) if (/I need|Do I need|I don't need/.test(l.en)) bad.add(`${s.speciesId}: ${l.en}`);
    expect([...bad]).toEqual([]);
  });

  it('un animal du grand froid n’a jamais froid et ne réclame pas de manteau', () => {
    const bad = new Set<string>();
    for (const s of all().filter((x) => COLD_NATIVE.has(x.speciesId))) for (const l of linesOf(s)) if (/I'm cold|I need (a coat|a scarf|gloves)|What do I wear/.test(l.en)) bad.add(`${s.speciesId}: ${l.en}`);
    expect([...bad]).toEqual([]);
  });

  it('le koala n’est pas présenté comme incapable de nager (il sait, il n’aime pas l’eau)', () => {
    expect(SPECIES.find((s) => s.id === 'koala')!.cannot).not.toContain('swim');
    for (const s of all().filter((x) => x.speciesId === 'koala')) for (const l of linesOf(s)) expect(l.en).not.toMatch(/koalas? (do not|don't|can't|cannot) swim/i);
  });
});
