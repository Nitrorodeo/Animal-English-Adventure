import { describe, expect, it } from 'vitest';
// @ts-expect-error -- module Node disponible dans Vitest, sans les types Node dans le projet
import { readFileSync } from 'node:fs';
import { migrate } from '../engine/save';
import { newGameState } from '../engine/state';
import { flakeCount, makeFlake, seeded, stepFlake, windAt, type Flake } from './Weather';

/**
 * Neige à la demande (2026-11-26, Westimmo : « retirer la pluie et le brouillard complètement et qu'on laisse
 * seulement la neige, mais qu'on puisse l'activer ou la désactiver quand on veut… le rendu des flocons doit être
 * réellement naturel »).
 */
describe('des flocons naturels', () => {
  const W = 1180;
  const H = 660;

  it('assez de flocons pour qu’il neige vraiment, sans charger une tablette', () => {
    expect(flakeCount(W, H)).toBeGreaterThanOrEqual(120);
    expect(flakeCount(4000, 3000)).toBe(240);
    expect(flakeCount(200, 120)).toBe(24);
  });

  it('de la profondeur : surtout de petits flocons au loin, quelques gros tout près, plus rapides et plus visibles', () => {
    const rnd = seeded(7);
    const all = Array.from({ length: 2000 }, () => makeFlake(W, H, rnd, true));
    const far = all.filter((f) => f.depth < 0.35);
    const near = all.filter((f) => f.depth >= 0.7);
    expect(far.length / all.length).toBeGreaterThan(0.55);
    expect(near.length / all.length).toBeLessThan(0.15);
    expect(near.length).toBeGreaterThan(0);
    const avg = (xs: Flake[], k: (f: Flake) => number) => xs.reduce((s, f) => s + k(f), 0) / xs.length;
    expect(avg(near, (f) => f.r)).toBeGreaterThan(avg(far, (f) => f.r) * 2);
    expect(avg(near, (f) => f.vy)).toBeGreaterThan(avg(far, (f) => f.vy) * 1.5);
    expect(avg(near, (f) => f.alpha)).toBeGreaterThan(avg(far, (f) => f.alpha));
    // des petits flocons : même tout près, quelques pixels, jamais de grosses boules
    for (const f of all) expect(f.r).toBeLessThan(9);
    // une chute douce : entre 5 et 17 secondes pour traverser l'écran
    for (const f of all) {
      expect(H / f.vy).toBeGreaterThan(5);
      expect(H / f.vy).toBeLessThan(17);
    }
  });

  it('chaque flocon descend en se balançant, poussé par un vent léger, puis repart d’en haut', () => {
    const rnd = seeded(3);
    let f = makeFlake(W, H, rnd, false);
    expect(f.y).toBeLessThan(0);
    const xs: number[] = [];
    let t = 0;
    let prevY = f.y;
    let restarted = false;
    for (let i = 0; i < 60 * 40; i++) {
      t += 1 / 60;
      const next = stepFlake(f, t, 1 / 60, W, H, rnd);
      if (next.y < prevY) restarted = true;
      else {
        expect(next.y - prevY).toBeGreaterThan(0);
        xs.push(next.x - f.x);
      }
      prevY = next.y;
      f = next;
    }
    expect(restarted).toBe(true);
    // il ne tombe pas tout droit : il va à gauche et à droite
    expect(xs.some((d) => d > 0)).toBe(true);
    expect(xs.some((d) => d < 0)).toBe(true);
    // le vent reste une brise : moins de 2 % de la largeur du décor par seconde
    for (let s = 0; s < 600; s += 3) expect(Math.abs(windAt(s, W))).toBeLessThan(W * 0.02);
  });

  it('la photo de l’album montre toujours les mêmes flocons', () => {
    const a = seeded(20261126);
    const b = seeded(20261126);
    expect(makeFlake(W, H, a, true)).toEqual(makeFlake(W, H, b, true));
  });
});

describe('le bouton ❄️ et le réglage', () => {
  it('éteinte par défaut, gardée allumée dans la sauvegarde, et rien d’autre qu’un vrai « oui »', () => {
    const s0 = newGameState();
    expect(s0.settings.snow).toBeUndefined();
    const on = { ...s0, settings: { ...s0.settings, snow: true } };
    expect(migrate(JSON.parse(JSON.stringify(on)))?.settings.snow).toBe(true);
    const bad = JSON.parse(JSON.stringify(on));
    bad.settings.snow = 'yes';
    expect(migrate(bad)?.settings.snow).toBeUndefined();
    expect(migrate(JSON.parse(JSON.stringify(s0)))?.settings.snow).toBeUndefined();
  });

  it('le bouton n’apparaît que là où il peut neiger, et pas la nuit ; la neige tombe aussi pendant les jeux', () => {
    const src: string = readFileSync(new URL('./Habitat.tsx', import.meta.url), 'utf8');
    expect(src).toContain('const canSnow = snowPossible(baseBiome);');
    expect(src).toContain('{canSnow && !night && (');
    expect(src).toContain('onClick={toggleSnow}');
    expect(src).toContain("settings: { ...st.settings, snow: on }");
    expect(src).toContain('{state.settings.snow && <WeatherLayer weather={weatherOfDay(place, true)} />}');
    // allumer la neige ne relance pas l'accueil du décor
    expect(src).toContain('  }, [baseBiome]);');
  });
});
