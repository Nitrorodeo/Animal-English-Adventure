import { describe, expect, it } from 'vitest';
import { clampOffset, isDrag } from './drag';

const stage = { left: 0, top: 0, right: 1000, bottom: 560 };
// bulle à sa place d'origine : en bas à gauche
const base = { left: 15, top: 360, right: 590, bottom: 546 };

describe('bulle de dialogue déplaçable', () => {
  it('suit le doigt', () => {
    expect(clampOffset({ dx: 0, dy: 0 }, { x: 100, y: -200 }, base, stage)).toEqual({ dx: 100, dy: -200 });
  });
  it('part du décalage déjà appliqué', () => {
    expect(clampOffset({ dx: 50, dy: -10 }, { x: 10, y: -10 }, base, stage)).toEqual({ dx: 60, dy: -20 });
  });
  it('ne sort jamais de la scène', () => {
    expect(clampOffset({ dx: 0, dy: 0 }, { x: 5000, y: -5000 }, base, stage)).toEqual({ dx: 410, dy: -360 });
    expect(clampOffset({ dx: 0, dy: 0 }, { x: -5000, y: 5000 }, base, stage)).toEqual({ dx: -15, dy: 14 });
  });
  it('une bulle plus large que la scène reste centrée au lieu de sauter', () => {
    const wide = { left: -10, top: 0, right: 1010, bottom: 100 };
    expect(clampOffset({ dx: 0, dy: 0 }, { x: 300, y: 0 }, wide, stage).dx).toBe(0);
  });
  it('un petit tremblement reste un toucher', () => {
    expect(isDrag({ x: 2, y: 3 })).toBe(false);
    expect(isDrag({ x: 8, y: 0 })).toBe(true);
  });
});
