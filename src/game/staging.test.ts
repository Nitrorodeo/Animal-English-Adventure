import { describe, expect, it } from 'vitest';
import { depthScale, farAt, FARTHEST, farthestY, groundScale, horizonOf, NEAREST, puppetClip, walkMs } from './staging';

describe('mise en scène des marionnettes', () => {
  it('choisit la bonne animation', () => {
    expect(puppetClip({ walking: true, action: 'drink_lap' })).toBe('walk'); // il marche d'abord jusqu'à l'eau
    expect(puppetClip({ walking: false, action: 'drink_lap' })).toBe('drink');
    expect(puppetClip({ walking: false, action: 'walk' })).toBe('walk');
    expect(puppetClip({ walking: false, speaking: true })).toBe('talk');
    expect(puppetClip({ walking: false })).toBe('idle');
    expect(puppetClip({ walking: false, action: 'roar' })).toBe('idle'); // les autres gestes restent en CSS
  });

  it('un personnage qui va vers le fond rapetisse, sans excès', () => {
    expect(depthScale(80, 80)).toBe(1);
    expect(depthScale(80, 62)).toBeLessThan(0.85);
    expect(depthScale(80, 62)).toBeGreaterThan(0.7);
    expect(depthScale(80, 0)).toBe(0.7);
    expect(depthScale(80, 95)).toBeGreaterThan(1);
    expect(depthScale(60, 200)).toBe(1.15);
  });
});

describe('perspective des animaux posés au doigt', () => {
  const hz = horizonOf(82); // 52
  it('vraie perspective : à mi-chemin de l\'horizon, moitié de taille', () => {
    expect(groundScale(80, 80, hz)).toBe(1);
    expect(groundScale(80, 66, hz)).toBeCloseTo(0.5, 2);
    expect(groundScale(80, 94, hz)).toBeGreaterThan(1.4 - 0.1);
  });
  it('bornée : jamais minuscule, jamais géant', () => {
    expect(groundScale(80, 10, hz)).toBe(FARTHEST);
    expect(groundScale(80, 200, hz)).toBe(NEAREST);
  });
  it('on ne pose pas un animal dans le ciel', () => {
    const y = farthestY(80, hz); // décor sans mesure : prudent
    expect(y).toBeGreaterThan(hz);
    expect(groundScale(80, y, hz)).toBeCloseTo(0.42, 5);
    expect(farthestY(80, 31, 35)).toBe(35); // décor mesuré : jusqu'au fond du sol dessiné
    expect(groundScale(80, 35, 31)).toBe(FARTHEST); // tout petit, mais jamais moins
    expect(horizonOf(80, 31)).toBe(31);
  });
  it('marche à vitesse constante : un petit pas est court, une traversée plus longue', () => {
    expect(walkMs(2, 0)).toBeLessThan(walkMs(40, 0));
    expect(walkMs(0.1, 0)).toBe(450);
    expect(walkMs(300, 300)).toBe(2600);
  });
});

describe('bord de la mer tracé point par point', () => {
  it('suit le tracé entre deux points, et reste plat au-delà des extrémités', () => {
    const shore: [number, number][] = [[20, 50], [40, 70], [0, 50]];
    expect(farAt(shore, 30)).toBe(60);
    expect(farAt(shore, 10)).toBe(50);
    expect(farAt(shore, 90)).toBe(70);
    expect(farAt(55, 12)).toBe(55);
    expect(farthestY(80, 40, shore, 30)).toBe(60);
  });
});
