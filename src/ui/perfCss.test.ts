import { describe, expect, it } from 'vitest';
// @ts-expect-error -- module Node sans types dans ce projet (les tests tournent sous Node) ; `?raw` sur un .css est vidé par Vitest
import { readFileSync } from 'node:fs';

// Fluidité : le canevas d'un personnage est redessiné à chaque image. Un `filter` CSS posé dessus
// (ombre floue, luminosité) serait recalculé à chaque image, pour chaque personnage : saccades sur
// tablette. L'ombre et la nuit sont dessinées par Puppet (WebGL) ; le halo est un calque fixe.
const source: string = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const css = source.replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1]!.trim(), body: m[2]! }));

describe('pas de filtre recalculé à chaque image sur les marionnettes', () => {
  it('la feuille de style est bien lue', () => expect(rules.length).toBeGreaterThan(200));
  it('aucune règle qui vise le canevas ou la marionnette ne porte de filter', () => {
    const bad = rules.filter((r) => /canvas|\.puppet\b/.test(r.sel) && /(^|;)\s*filter\s*:/.test(r.body));
    expect(bad.map((r) => r.sel)).toEqual([]);
  });
  it('le halo des personnages animés est un calque à part', () => {
    expect(rules.some((r) => r.sel.includes('.char.puppeted::after'))).toBe(true);
  });
});

describe('objets à trouver lisibles sur le décor (2026-11-23)', () => {
  it('les objets émoji ont un liseré clair (feuille verte sur fougères vertes)', () => {
    const r = rules.find((x) => x.sel === '.prop-emoji');
    expect(r?.body).toMatch(/filter:\s*drop-shadow\([^)]*#fff8e1\)/);
  });
});
