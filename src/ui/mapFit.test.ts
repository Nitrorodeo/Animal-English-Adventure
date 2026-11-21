import { describe, expect, it } from 'vitest';
import { labelY, MAP_MAX_STRETCH, MAP_RATIO, mapFit } from './mapFit';

describe('carte du monde en plein écran', () => {
  it('écran très large (ordinateur) : toute la largeur, sans bande, la carte défile en hauteur', () => {
    const f = mapFit(1879, 766);
    expect(f.w).toBe(1879);
    expect(f.h).toBeGreaterThan(766);
    expect(f.w / f.h).toBeCloseTo(MAP_RATIO * MAP_MAX_STRETCH, 2); // étirement plafonné
  });

  it("carte élargie : sur l'écran du PC (1879 × 829 sous le bandeau), toute la carte se voit, rien de zoomé", () => {
    const f = mapFit(1879, 829);
    expect(f.w).toBe(1879);
    expect(f.h).toBeLessThanOrEqual(Math.ceil(829 * 1.02)); // au plus 1 % coupé en haut et en bas
  });

  it('tablette en largeur : remplit tout, presque rien à faire défiler', () => {
    const f = mapFit(1280, 736);
    expect(f.h).toBe(736);
    expect(f.w).toBeGreaterThanOrEqual(1280);
    expect(f.w).toBeLessThan(1280 * 1.04);
  });

  it('écran à la forme de la carte, ou un peu différente : remplit exactement, sans défilement', () => {
    expect(mapFit(2172, 1086)).toEqual({ w: 2172, h: 1086 });
    expect(mapFit(1900, 1000)).toEqual({ w: 1900, h: 1000 });
    expect(mapFit(2200, 1000)).toEqual({ w: 2200, h: 1000 });
  });

  it('tablette en hauteur : toute la hauteur, la carte défile en largeur', () => {
    const f = mapFit(810, 1016);
    expect(f.h).toBe(1016);
    expect(f.w).toBeGreaterThan(810);
    expect(f.w / f.h).toBeCloseTo(MAP_RATIO / MAP_MAX_STRETCH, 2);
  });

  it('la carte couvre toujours tout l\'écran', () => {
    for (const [w, h] of [[375, 812], [800, 600], [1024, 700], [2560, 900], [1000, 1000]] as const) {
      const f = mapFit(w, h);
      expect(f.w).toBeGreaterThanOrEqual(w);
      expect(f.h).toBeGreaterThanOrEqual(h);
    }
  });

  it("les noms des continents restent à l'écran quand la carte dépasse", () => {
    const seen = { top: 17, bottom: 83 };
    expect(labelY(50, seen)).toBe(50); // au milieu : à sa place
    expect(labelY(5, seen)).toBeGreaterThan(17); // Europe, en haut : ramenée dans l'écran
    expect(labelY(96, seen)).toBeLessThan(83); // Antarctique, en bas
    expect(labelY(5, { top: 0, bottom: 100 })).toBe(6);
  });
});
