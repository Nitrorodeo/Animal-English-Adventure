import { describe, expect, it } from 'vitest';
import { getFamily, newGameState } from '../engine/state';
import { createBaby } from '../engine/family';
import { PLACES } from '../content/places';
import { cropStyle, hasStageSprite, homePlacement, spriteFor, tappedAnchor } from './scene';

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

  it('le lézard à collerette (Océanie, à la place de l’ornithorynque) a sa famille dessinée', () => {
    expect(spriteFor('frilled_lizard', { role: 'father' })?.path).toMatch(/frilled_lizard_father/);
    expect(spriteFor('frilled_lizard', { role: 'mother' })?.path).toMatch(/frilled_lizard_mother/);
    for (const st of ['newborn', 'little', 'young', 'companion'] as const) {
      expect(hasStageSprite('frilled_lizard', 'girl', st), st).toBe(true);
      expect(hasStageSprite('frilled_lizard', 'boy', st), st).toBe(true);
    }
    expect(spriteFor('platypus' as never, { role: 'father' })).toBeUndefined();
  });

  it('les familles découpées le 2026-11-20 sont toutes dessinées (parents + 4 stades × 2)', () => {
    for (const sp of ['elephant', 'fox', 'owl', 'sloth', 'kangaroo', 'penguin', 'seal', 'polar_bear']) {
      expect(spriteFor(sp, { role: 'father' })?.path, sp).toMatch(new RegExp(`${sp}_father`));
      expect(spriteFor(sp, { role: 'mother' })?.path, sp).toMatch(new RegExp(`${sp}_mother`));
      for (const st of ['newborn', 'little', 'young', 'companion'] as const) {
        expect(hasStageSprite(sp, 'girl', st), `${sp} ${st}`).toBe(true);
        expect(hasStageSprite(sp, 'boy', st), `${sp} ${st}`).toBe(true);
      }
    }
  });

  it("renvoie undefined pour une espèce sans dessin (pictogramme de repli)", () => {
    expect(spriteFor('unicorn', { role: 'father' })).toBeUndefined();
    expect(spriteFor('unicorn', { sex: 'boy', stage: 'newborn' })).toBeUndefined();
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

describe('scene — un même arbre sous deux mots (2026-11-23)', () => {
  it('toucher le grand eucalyptus (« tree ») compte quand on demande « eucalyptus », et l’inverse', () => {
    const p = PLACES.oc_eucalyptus!;
    expect(tappedAnchor(p, 'tree', 'eucalyptus')).toBe('eucalyptus');
    expect(tappedAnchor(p, 'eucalyptus', 'tree')).toBe('tree');
    expect(tappedAnchor(p, 'water', 'eucalyptus')).toBe('water');
    expect(tappedAnchor(p, 'tree', undefined)).toBe('tree');
    expect(tappedAnchor(PLACES.na_redwoods!, 'trunk', 'redwood')).toBe('redwood');
  });
  it('chaque « sameAs » vise un point du même décor, sans lui-même, et dans les deux sens', () => {
    let n = 0;
    for (const p of Object.values(PLACES)) {
      const ids = new Set(p.anchors.map((a) => a.id));
      for (const a of p.anchors) {
        for (const o of a.sameAs ?? []) {
          n++;
          expect(ids.has(o), `${p.id}:${a.id} → ${o}`).toBe(true);
          expect(o, `${p.id}:${a.id}`).not.toBe(a.id);
          expect(p.anchors.find((b) => b.id === o)?.sameAs ?? [], `${p.id}:${o} ← ${a.id}`).toContain(a.id);
        }
      }
    }
    expect(n).toBeGreaterThanOrEqual(10);
  });
});
