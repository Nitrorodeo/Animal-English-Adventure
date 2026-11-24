import { describe, expect, it } from 'vitest';
import { ambientAt, averageRect, giftLook, giftStart, groundAt, luminance, skyOf, type ScenePixels } from './giftLook';

/** décor de 10 × 10 : ciel bleu en haut, sol ocre en bas */
function scene(): ScenePixels {
  const w = 10, h = 10, data: number[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data.push(...(y < 5 ? [120, 170, 230, 255] : [200, 150, 80, 255]));
  return { w, h, data };
}

describe('accord des cadeaux avec le décor', () => {
  it('moyenne de couleur, ciel, lumière autour de l’objet', () => {
    const px = scene();
    expect(averageRect(px, 0, 0, 100, 40)).toEqual([120, 170, 230]);
    expect(averageRect(px, -50, 60, 300, 200)).toEqual([200, 150, 80]); // borné au dessin
    expect(skyOf(px)).toEqual([120, 170, 230]);
    expect(ambientAt(px, 50, 95, 8)).toEqual([200, 150, 80]);
    expect(groundAt(px, 50, 80, 10)).toEqual([200, 150, 80]);
    expect(giftLook([1, 1, 1], [1, 1, 1], 1, [200, 150, 80]).shadow).toBe('rgba(60, 45, 24, 0.6)');
  });

  it('teinte plus forte dans un décor sombre, voile seulement au fond', () => {
    const bright = giftLook([250, 245, 230], [150, 190, 240], 1);
    const dark = giftLook([30, 30, 60], [20, 20, 50], 1);
    expect(dark.tintK).toBeGreaterThan(bright.tintK);
    expect(bright.tintK).toBeGreaterThanOrEqual(0.22);
    expect(dark.tintK).toBeLessThanOrEqual(0.4);
    expect(bright.hazeK).toBe(0);
    expect(giftLook([200, 200, 200], [150, 190, 240], 0.5).hazeK).toBe(0.15);
    expect(giftLook([200, 200, 200], [150, 190, 240], 1.4).hazeK).toBe(0); // devant : pas de voile
    expect(luminance([255, 255, 255])).toBeCloseTo(1);
  });

  it('places de départ à gauche de la famille, différentes pour les premiers cadeaux', () => {
    const starts = Array.from({ length: 8 }, (_, i) => giftStart(i, 80));
    expect(new Set(starts.map((s) => s.x)).size).toBe(8);
    for (const s of starts) expect(s.x).toBeLessThan(50);
  });
});
