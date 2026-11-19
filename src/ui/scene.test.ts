import { describe, expect, it } from 'vitest';
import { getFamily, newGameState } from '../engine/state';
import { createBaby } from '../engine/family';
import { cropStyle, hasStageSprite, homePlacement, spriteFor } from './scene';

describe('scene — sprites', () => {
  it('donne les parents lion et éléphant', () => {
    expect(spriteFor('lion', { role: 'father' })?.path).toMatch(/lion_father/);
    expect(spriteFor('elephant', { role: 'mother' })?.path).toMatch(/elephant_mother/);
  });

  it('retombe sur le sprite unique du sexe quand le stade manque (lionceaux)', () => {
    expect(hasStageSprite('lion', 'girl', 'young')).toBe(false);
    expect(spriteFor('lion', { sex: 'girl', stage: 'young' })?.path).toMatch(/lion_girl/);
  });

  it('utilise le sprite dédié du stade quand il existe (éléphanteaux)', () => {
    expect(hasStageSprite('elephant', 'boy', 'companion')).toBe(true);
    expect(spriteFor('elephant', { sex: 'boy', stage: 'companion' })?.path).toMatch(/elephant_boy_companion/);
  });

  it('la girafe a ses parents et ses 4 stades dessinés', () => {
    expect(spriteFor('giraffe', { role: 'father' })).toBeDefined();
    for (const st of ['newborn', 'little', 'young', 'companion'] as const) {
      expect(hasStageSprite('giraffe', 'girl', st), st).toBe(true);
      expect(hasStageSprite('giraffe', 'boy', st), st).toBe(true);
    }
  });

  it("renvoie undefined pour une espèce sans dessin (pictogramme de repli)", () => {
    expect(spriteFor('penguin', { role: 'father' })).toBeUndefined();
    expect(spriteFor('penguin', { sex: 'boy', stage: 'newborn' })).toBeUndefined();
  });
});

describe('scene — recadrage', () => {
  const bg = { path: 'x.webp', width: 1600, height: 900 };
  it('cadre plein écran : position 0, taille 100 %', () => {
    const s = cropStyle(bg, { x: 0, y: 0, w: 100, h: 100 });
    expect(s.backgroundSize).toBe('100% 100%');
    expect(s.backgroundPosition).toBe('0% 0%');
  });
  it('cadre en bas à droite : position 100 %', () => {
    const s = cropStyle(bg, { x: 75, y: 50, w: 25, h: 50 });
    expect(s.backgroundSize).toBe('400% 200%');
    expect(s.backgroundPosition).toBe('100% 100%');
    expect(Number(s.aspectRatio)).toBeCloseTo((25 * 1600) / (50 * 900));
  });
});

describe('scene — placement', () => {
  it('les adultes restent à droite, hors de la bulle de dialogue (gauche < 59 %)', () => {
    const fam = getFamily(newGameState(), 'lion');
    for (const role of ['father', 'mother'] as const) {
      const p = homePlacement({ kind: 'adult', speciesId: 'lion', role }, fam);
      expect(p.x).toBeGreaterThan(59);
    }
  });
  it('deux bébés ne se superposent pas et grandissent avec le stade', () => {
    const a = createBaby(getFamily(newGameState(), 'lion'), 'girl', 'Mia', 'lion-b1');
    if (!a.ok) throw new Error(a.error);
    const b = createBaby(a.family, 'boy', 'Tom', 'lion-b2');
    if (!b.ok) throw new Error(b.error);
    const p1 = homePlacement({ kind: 'baby', speciesId: 'lion', babyId: 'lion-b1' }, b.family);
    const p2 = homePlacement({ kind: 'baby', speciesId: 'lion', babyId: 'lion-b2' }, b.family);
    expect(p1.x).not.toBe(p2.x);
    const grown = { ...b.family, babies: b.family.babies.map((x) => (x.id === 'lion-b1' ? { ...x, stage: 'companion' as const } : x)) };
    expect(homePlacement({ kind: 'baby', speciesId: 'lion', babyId: 'lion-b1' }, grown).h).toBeGreaterThan(p1.h);
  });
  it('la taille suit l’espèce : hérisson < hibou < lion < éléphant, bébé hérisson plus petit que ses parents', () => {
    const st = newGameState();
    const h = (sp: string) => homePlacement({ kind: 'adult', speciesId: sp, role: 'father' }, getFamily(st, sp)).h;
    expect(h('hedgehog')).toBeLessThan(h('owl'));
    expect(h('owl')).toBeLessThan(h('lion'));
    expect(h('lion')).toBeLessThan(h('elephant'));
    expect(h('hedgehog')).toBeGreaterThanOrEqual(22); // reste facile à toucher
    const a = createBaby(getFamily(st, 'hedgehog'), 'girl', 'Mia', 'hh-b1');
    if (!a.ok) throw new Error(a.error);
    const grown = { ...a.family, babies: a.family.babies.map((x) => ({ ...x, stage: 'companion' as const })) };
    const baby = homePlacement({ kind: 'baby', speciesId: 'hedgehog', babyId: 'hh-b1' }, grown);
    expect(baby.h).toBeLessThan(h('hedgehog'));
  });
});
