import { describe, expect, it } from 'vitest';
import placesAfrica from '../content/places/africa.json';
import { PEEK_REACH, peekSpot } from './peek';

describe('cache-cache : l’animal dépasse de sa cachette', () => {
  it('au bord le plus proche de là où il réapparaîtra, sans s’en éloigner', () => {
    // le baobab : à gauche du tronc, tout près de sa place (pas au bout du feuillage) ; le rocher : juste à sa droite
    expect(peekSpot({ hit: { x: 38, y: 10, w: 40, h: 46 }, stand: { x: 50, y: 63 } })).toEqual({ x: 50 - PEEK_REACH, y: 63, side: -1 });
    expect(peekSpot({ hit: { x: 10, y: 84, w: 15, h: 12 }, stand: { x: 28, y: 89 } })).toEqual({ x: 25, y: 89, side: 1 });
  });

  it('jamais collé au cadre, et sur le sol même sans place prévue', () => {
    expect(peekSpot({ hit: { x: 0, y: 40, w: 10, h: 30 } })).toEqual({ x: 10, y: 70, side: 1 });
    expect(peekSpot({ hit: { x: 90, y: 40, w: 9, h: 20 } }).side).toBe(-1);
  });

  it('toutes les cachettes d’Afrique donnent une place dans la scène', () => {
    const list = placesAfrica.places as unknown as { anchors?: { hit: { x: number; y: number; w: number; h: number }; stand?: { x: number; y: number }; tags?: string[] }[] }[];
    let n = 0;
    for (const p of list) for (const a of p.anchors ?? []) if (a.tags?.includes('hide') && a.stand) {
      const s = peekSpot(a);
      expect(s.x).toBeGreaterThanOrEqual(6);
      expect(s.x).toBeLessThanOrEqual(94);
      expect(s.y).toBeLessThanOrEqual(100);
      n++;
    }
    expect(n).toBeGreaterThan(5);
  });
});
