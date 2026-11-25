import { describe, expect, it } from 'vitest';
import { acceptsDown, clampOffset, dragSpot, endsTrack, isDrag, seaDragPos, withoutKey } from './drag';
import { depthScale } from '../game/staging';

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

describe('animal déplacé dans le décor', () => {
  const home = { x: 70, y: 80, h: 34 };
  const flat = () => 1;
  it('suit le doigt, pieds sous le doigt décalés de la prise', () => {
    expect(dragSpot(home, { x: 20, y: 60 }, 5, flat)).toEqual({ x: 20, y: 65, h: 34 });
  });
  it('rapetisse en partant au fond, grandit en revenant', () => {
    expect(dragSpot(home, { x: 50, y: 60 }, 0, depthScale).h).toBeLessThan(34);
    expect(dragSpot(home, { x: 50, y: 95 }, 0, depthScale).h).toBeGreaterThan(34);
  });
  it('reste entier dans la scène', () => {
    const top = dragSpot(home, { x: -50, y: -40 }, 0, depthScale);
    expect(top.x).toBe(3);
    expect(top.y - top.h).toBeGreaterThanOrEqual(1);
    const low = dragSpot(home, { x: 500, y: 300 }, 0, depthScale);
    expect(low.x).toBe(97);
    expect(low.y).toBe(99.5);
  });
  it('ne monte pas dans le ciel : pas plus au fond que le sol permis', () => {
    expect(dragSpot(home, { x: 50, y: 20 }, 0, flat, 64).y).toBe(64);
  });
  it('sur un rocher, il peut être plus haut que le sol permis, à la taille du pied du rocher', () => {
    const rock = (x: number, y: number) => (x > 10 && x < 30 && y > 30 && y < 40 ? 70 : undefined);
    const scale = (_from: number, to: number) => to / 100;
    expect(dragSpot(home, { x: 20, y: 35 }, 0, scale, 64, rock)).toEqual({ x: 20, y: 35, h: 34 * 0.7 });
    expect(dragSpot(home, { x: 50, y: 35 }, 0, scale, 64, rock)).toEqual({ x: 50, y: 64, h: 34 * 0.64 }); // pas de rocher : sol
  });
});

describe('animaux de la mer déplacés au doigt', () => {
  it('suivent le doigt et restent dans l’eau', () => {
    expect(seaDragPos({ x: 4, y: 20 }, { x: 24.4, y: 10 }, 40)).toEqual({ x: 28.4, y: 30 });
    expect(seaDragPos({ x: 4, y: 20 }, { x: -90, y: -90 }, 40)).toEqual({ x: -12, y: -15 }); // 70 % encore visible
    expect(seaDragPos({ x: 4, y: 20 }, { x: 200, y: 200 }, 40)).toEqual({ x: 72, y: 75 });
  });
});

/** audit du 2026-11-25 : un 2e doigt « collait » l'animal levé, et deux animaux glissés se mélangeaient */
describe('plusieurs doigts', () => {
  it('un glisser commencé n’est pas remplacé par un autre doigt', () => {
    expect(acceptsDown(null)).toBe(true);
    expect(acceptsDown({ pointerId: 1, on: false })).toBe(true); // simple appui : un nouveau toucher le remplace
    expect(acceptsDown({ pointerId: 1, on: true })).toBe(false);
  });

  it('seul le doigt qui glisse peut poser l’animal', () => {
    const t = { pointerId: 7, on: true };
    expect(endsTrack(t, 7)).toBe(true);
    expect(endsTrack(t, 8)).toBe(false);
    expect(endsTrack(null, 7)).toBe(false); // déjà posé : la 2e fin (perte de capture) ne refait rien
  });

  it('poser un animal laisse l’autre animal sous son doigt', () => {
    const live = { father: { x: 10, y: 60, h: 30 }, mother: { x: 50, y: 70, h: 30 } };
    expect(withoutKey(live, 'father')).toEqual({ mother: { x: 50, y: 70, h: 30 } });
    expect(live.father).toBeDefined(); // la copie, pas l'original
  });
});
