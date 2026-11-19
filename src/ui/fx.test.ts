import { describe, expect, it } from 'vitest';
import { CONFETTI_COLORS, confettiPieces, familyMood, familyTalker, floatingHearts, type FamilyPhase } from './fx';

describe('confettis', () => {
  it('donne le nombre demandé, dans la largeur, avec toutes les couleurs', () => {
    const p = confettiPieces(24);
    expect(p).toHaveLength(24);
    for (const c of p) {
      expect(c.left).toBeGreaterThanOrEqual(0);
      expect(c.left).toBeLessThan(100);
      expect(c.delay).toBeGreaterThanOrEqual(0);
      expect(c.delay).toBeLessThan(1.5);
      expect(Math.abs(c.drift)).toBeLessThanOrEqual(4);
    }
    expect(new Set(p.map((c) => c.color))).toEqual(new Set(CONFETTI_COLORS));
  });
  it('est stable d’un rendu à l’autre et refuse les nombres absurdes', () => {
    expect(confettiPieces(10)).toEqual(confettiPieces(10));
    expect(confettiPieces(-3)).toEqual([]);
    expect(confettiPieces(2.7)).toHaveLength(2);
  });
  it('étale les départs sur toute la largeur', () => {
    const lefts = confettiPieces(18).map((c) => c.left);
    expect(Math.min(...lefts)).toBeLessThan(20);
    expect(Math.max(...lefts)).toBeGreaterThan(80);
  });
});

describe('cœurs qui montent', () => {
  it('restent dans l’écran et ne partent pas tous en même temps', () => {
    const h = floatingHearts(8);
    expect(h).toHaveLength(8);
    for (const x of h) {
      expect(x.left).toBeGreaterThanOrEqual(8);
      expect(x.left).toBeLessThanOrEqual(92);
      expect(x.size).toBeGreaterThan(0.5);
    }
    expect(new Set(h.map((x) => x.delay)).size).toBeGreaterThan(4);
  });
});

describe('mise en scène de la naissance', () => {
  const phases: FamilyPhase[] = ['intro', 'surprise', 'choose', 'reveal', 'name', 'hello', 'sibling', 'complete', 'full'];
  it('fait parler la maman à l’intro et le bébé quand il dit bonjour', () => {
    expect(familyTalker('intro')).toBe('mother');
    expect(familyTalker('hello')).toBe('newBaby');
    expect(familyTalker('sibling')).toBe('newBaby');
    expect(phases.filter((p) => familyTalker(p) === null)).toEqual(['surprise', 'choose', 'reveal', 'name', 'complete', 'full']);
  });
  it('fête la révélation et la fin, garde le mystère avant le choix', () => {
    expect(familyMood('intro')).toBe('love');
    expect(familyMood('surprise')).toBe('mystery');
    expect(familyMood('choose')).toBe('mystery');
    expect(familyMood('reveal')).toBe('reveal');
    expect(familyMood('complete')).toBe('party');
    expect(familyMood('name')).toBe('calm');
  });
});
