/** Vu à l'écran (2026-11-23) : le trésor « an orange flower » s'affichait en fleur mauve. Un trésor dont le nom
 *  annonce une couleur est dessiné dans cette couleur, sur tous les continents. */
import { describe, expect, it } from 'vitest';
import { TREASURES } from '../content/adventures';
import { treasureArt } from '../content/adventures/kit';
import { COLORS } from '../content/props';

describe('trésors : la couleur dite est la couleur montrée', () => {
  it('repère la couleur et la forme dans le nom', () => {
    expect(treasureArt('an orange flower')).toEqual({ shape: 'flower', color: 'orange' });
    expect(treasureArt('a yellow feather')).toEqual({ shape: 'feather', color: 'yellow' });
    expect(treasureArt("a red maple leaf")).toEqual({ shape: 'maple', color: 'red' });
    expect(treasureArt('a baobab flower')).toBeUndefined();
    expect(treasureArt('a shiny red stone')).toBeUndefined();
  });
  it('chaque trésor au nom coloré et à forme connue est dessiné dans sa couleur', () => {
    const shapes = ['flower', 'feather', 'pebble', 'leaf', 'shell'];
    for (const t of Object.values(TREASURES)) {
      const words = t.nameEn.toLowerCase().split(/[^a-z]+/);
      const color = Object.keys(COLORS).find((c) => words.includes(c));
      if (color && shapes.some((s) => words.includes(s))) expect(t.art?.color, t.id).toBe(color);
    }
    expect(TREASURES.orange_flower?.art).toEqual({ shape: 'flower', color: 'orange' });
  });
});
