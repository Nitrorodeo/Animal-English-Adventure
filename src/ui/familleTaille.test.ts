import { describe, expect, it } from 'vitest';
import M from '../content/assetManifest.json';
import { FAMILY_BABY_H, FAMILY_PARENT_H, familyScale } from './fx';

/** Scène de naissance : la famille tient dans l'écran (2026-11-25 : panthères des neiges « beaucoup trop grosses »). */
describe('taille de la famille à la naissance', () => {
  const ch = (M as { characters: Record<string, { width: number; height: number }> }).characters;
  const r = (k: string) => ch[k]!.width / ch[k]!.height;
  const width = (sp: string, babies: string[]) => {
    const k = familyScale([r(`${sp}_father`), r(`${sp}_mother`)], babies.map(r));
    return { k, w: k * (FAMILY_PARENT_H * (r(`${sp}_father`) + r(`${sp}_mother`)) + FAMILY_BABY_H * babies.map(r).reduce((a, b) => a + b, 0)) };
  };

  it('les lions gardent leur taille d’avant', () => {
    expect(width('lion', ['lion_girl_newborn', 'lion_boy_newborn']).k).toBe(1);
  });

  it('les panthères des neiges sont réduites pour tenir dans la largeur, bébés compris', () => {
    const one = width('snow_leopard', ['snow_leopard_girl_newborn']);
    const two = width('snow_leopard', ['snow_leopard_girl_newborn', 'snow_leopard_boy_newborn']);
    expect(one.k).toBeLessThan(1);
    expect(two.k).toBeLessThan(one.k);
    expect(one.w).toBeLessThanOrEqual(90);
    expect(two.w).toBeLessThanOrEqual(90);
  });

  it('aucune espèce ne sort de l’écran à la naissance du second bébé', () => {
    const species = new Set(Object.keys(ch).filter((k) => k.endsWith('_father')).map((k) => k.slice(0, -'_father'.length)));
    for (const sp of species) {
      if (!ch[`${sp}_mother`]) continue;
      const babies = ['girl', 'boy'].map((s) => [`${sp}_${s}_newborn`, `${sp}_${s}`].find((k) => ch[k])).filter((k): k is string => !!k);
      expect(width(sp, babies).w, sp).toBeLessThanOrEqual(90);
    }
  });
});
