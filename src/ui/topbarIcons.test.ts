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
