import { describe, expect, it } from 'vitest';
import { depthScale, puppetClip } from './staging';

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
