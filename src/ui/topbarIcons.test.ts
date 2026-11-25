import { describe, expect, it } from 'vitest';
// @ts-expect-error -- module Node sans types dans ce projet (les tests tournent sous Node)
import { readFileSync } from 'node:fs';
import { isMedia } from '../pwa/precache';
import { TOPBAR_ICONS } from './topbarIcons';

const read = (rel: string): Uint8Array => readFileSync(new URL(rel, import.meta.url));
const ascii = (b: Uint8Array) => String.fromCharCode(...b);

describe('logos de la barre du haut', () => {
  it.each(Object.entries(TOPBAR_ICONS))('%s : vrai fichier WebP léger', (_name, path) => {
    const file = read(`../../public/${path}`);
    expect(ascii(file.subarray(0, 4))).toBe('RIFF');
    expect(ascii(file.subarray(8, 12))).toBe('WEBP');
    expect(file.length).toBeLessThan(25 * 1024); // les dessins d'origine pesaient ~1,3 Mo
    expect(isMedia(path)).toBe(false); // téléchargé dès l'installation : la barre est complète hors ligne
  });

  it('la barre utilise les quatre logos (plus les anciens pictogrammes dessinés au trait)', () => {
    const app: string = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
    for (const name of Object.keys(TOPBAR_ICONS)) expect(app).toContain(`<TopIcon name="${name}" />`);
    expect(app).not.toContain('<Icon name=');
  });
});

/** Taille d'une image WebP (en-têtes VP8X, VP8L ou VP8). */
function webpSize(b: Uint8Array): { w: number; h: number } {
  const kind = ascii(b.subarray(12, 16));
  if (kind === 'VP8X') return { w: 1 + (b[24]! | (b[25]! << 8) | (b[26]! << 16)), h: 1 + (b[27]! | (b[28]! << 8) | (b[29]! << 16)) };
  if (kind === 'VP8L') {
    const n = b[21]! | (b[22]! << 8) | (b[23]! << 16) | (b[24]! << 24);
    return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 };
  }
  return { w: (b[26]! | (b[27]! << 8)) & 0x3fff, h: (b[28]! | (b[29]! << 8)) & 0x3fff };
}

describe('bandeau de la barre du haut', () => {
  const css: string = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  const piece = (name: string) => read(`../../public/assets/ui/${name}.webp`);
  const names = ['topbar-left', 'topbar-right', 'topbar-middle', 'topbar-middle-narrow', 'topbar-end-left', 'topbar-end-right'];

  it.each(names)('%s : WebP léger, utilisé par la feuille de style, présent hors ligne', (name) => {
    const file = piece(name);
    expect(ascii(file.subarray(8, 12))).toBe('WEBP');
    expect(file.length).toBeLessThan(20 * 1024);
    expect(css).toContain(`url('/assets/ui/${name}.webp')`);
    expect(isMedia(`assets/ui/${name}.webp`)).toBe(false);
  });

  it('le milieu commence exactement là où les bouts deviennent transparents (pas de trou ni de bord visible)', () => {
    // fondus en pixels du dessin (tools/icons/build_topbar_banner.py) : bouts à feuilles 40, bouts unis 20
    const FADE = 40;
    const END_FADE = 20;
    const cap = webpSize(piece('topbar-left'));
    const end = webpSize(piece('topbar-end-left'));
    expect(webpSize(piece('topbar-right'))).toEqual(cap);
    expect(webpSize(piece('topbar-end-right'))).toEqual(end);
    const factors = [...css.matchAll(/calc\(100% - var\(--pill-h\) \* ([0-9.]+)\)/g)].map((m) => Number(m[1]));
    expect(factors).toHaveLength(2);
    expect(factors[0]).toBeCloseTo((2 * (cap.w - FADE)) / cap.h, 3);
    expect(factors[1]).toBeCloseTo((2 * (end.w - END_FADE)) / end.h, 3);
  });

  it('les boutons commencent après les feuilles : jamais posés dessus', () => {
    const m = css.match(/padding: 0 calc\(4px \+ var\(--pill-h\) \* ([0-9.]+)\)/);
    expect(m).not.toBeNull();
    // les feuilles occupent 190 px sur les 99 px de haut du dessin
    expect(Number(m![1])).toBeGreaterThanOrEqual(190 / 99 - 0.001);
  });
});
