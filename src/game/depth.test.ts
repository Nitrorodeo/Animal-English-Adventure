import { describe, expect, it } from 'vitest';
import { PLACES } from '../content/places';
import { PLACE_DEPTH } from '../content/places/depth';
import type { BiomeDef } from '../content/types';
import type { ActorRef, FamilyState } from '../engine/state';
import { dragSpot } from '../ui/drag';
import { homePlacement } from '../ui/scene';
import { farAt, FARTHEST, farthestY, groundScale, horizonOf, perchAt } from './staging';

// demande du parent (2026-11-20) : « il doit pouvoir aller quand même assez loin… je dois pouvoir le poser
// sur la Pierre et les Lions… il faut qu'ils soient complètement au fond du chemin »

const family = { babies: [] } as unknown as FamilyState;
const adult = (speciesId: string, role: 'father' | 'mother'): ActorRef => ({ kind: 'adult', speciesId, role }) as ActorRef;

/** glisser un animal comme dans Habitat.tsx */
function drop(place: BiomeDef, actor: ActorRef, pointer: { x: number; y: number }) {
  const home = homePlacement(actor, family, place.groundY);
  const hz = horizonOf(place.groundY, place.horizonY);
  return { home, spot: dragSpot(home, pointer, 0, (f, t) => groundScale(f, t, hz), (x) => farthestY(home.y, hz, place.farY, x), (x, y) => perchAt(place, x, y)) };
}

describe('profondeur mesurée de chaque décor', () => {
  it('chaque décor a son horizon et son fond mesurés, cohérents avec la place de la famille', () => {
    for (const p of Object.values(PLACES)) {
      const d = PLACE_DEPTH[p.id];
      expect(d, p.id).toBeDefined();
      expect(p.horizonY, p.id).toBe(d!.horizonY);
      // le fond est bien derrière (plus haut que) les pieds des parents, avec de la place pour marcher
      for (const role of ['father', 'mother'] as const) {
        const home = homePlacement(adult('lion', role), family, p.groundY);
        expect(farAt(d!.farY, home.x), p.id).toBeLessThan(home.y - 3);
      }
      for (let x = 0; x <= 100; x += 5) expect(farAt(d!.farY, x), p.id).toBeGreaterThan(d!.horizonY);
      for (const r of d!.perches ?? []) expect(r.base, p.id).toBeGreaterThan(d!.horizonY);
    }
    // aucune mesure orpheline (faute de frappe dans un identifiant de décor)
    for (const id of Object.keys(PLACE_DEPTH)) expect(PLACES[id as keyof typeof PLACES], id).toBeDefined();
  });

  it('tout au fond, un animal est tout petit mais reste visible', () => {
    for (const p of Object.values(PLACES)) {
      // là où le sol va le plus loin (sur une plage : le sable du fond, pas devant la mer)
      const x = [...Array(19).keys()].map((i) => 5 + i * 5).reduce((m, v) => (farAt(p.farY!, v) < farAt(p.farY!, m) ? v : m));
      const { home, spot } = drop(p, adult('lion', 'father'), { x, y: 0 });
      expect(spot.y, p.id).toBeCloseTo(Math.max(farAt(p.farY!, x), spot.h + 1), 5);
      expect(spot.h / home.h, p.id).toBeLessThan(0.55); // la montagne d'Asie : le sol s'arrête au bord de la falaise
      expect(spot.h / home.h, p.id).toBeGreaterThanOrEqual(FARTHEST - 1e-9);
    }
  });
});

describe('les lions tout au fond du chemin de la savane', () => {
  const savanna = PLACES.savanna!;
  it('on peut les poser là où le chemin se perd (x 72, y 42), tout petits', () => {
    for (const role of ['father', 'mother'] as const) {
      const { home, spot } = drop(savanna, adult('lion', role), { x: 72, y: 42 });
      expect(spot.y).toBe(42);
      expect(spot.h / home.h).toBeLessThan(0.3); // avant : jamais moins de 0,42, et pas plus loin que y 63
    }
  });
  it('encore plus loin, dans la plaine, jusqu\'au pied des collines, mais pas dans le ciel', () => {
    expect(drop(savanna, adult('lion', 'father'), { x: 40, y: 36 }).spot.y).toBe(36);
    expect(drop(savanna, adult('lion', 'father'), { x: 40, y: 10 }).spot.y).toBe(35);
  });
  it('en revenant devant, il retrouve sa taille, et grandit encore tout devant', () => {
    const home = homePlacement(adult('lion', 'father'), family, savanna.groundY);
    const { spot } = drop(savanna, adult('lion', 'father'), { x: home.x, y: home.y });
    expect(spot.h).toBeCloseTo(home.h, 5);
    expect(drop(savanna, adult('lion', 'father'), { x: 50, y: 97 }).spot.h).toBeGreaterThan(home.h);
  });
  it('la lionne, à sa place devant le rocher, n\'est pas « posée sur le rocher »', () => {
    const mother = homePlacement(adult('lion', 'mother'), family, savanna.groundY);
    expect(perchAt(savanna, mother.x, mother.y)).toBeUndefined();
  });
});

describe('le lézard sur la grosse pierre de la plage', () => {
  const beach = PLACES.oc_beach!;
  const lizard = adult('frilled_lizard', 'father');
  it('posé sur le dessus de la pierre, il y reste, à la taille qu\'il aurait au pied de la pierre', () => {
    const { home, spot } = drop(beach, lizard, { x: 21, y: 36 });
    expect(spot.y).toBe(36); // plus haut que le sable du fond (y 51) : il est sur la pierre
    expect(spot.h).toBeCloseTo(home.h * groundScale(home.y, 50, 45), 5);
    expect(spot.h).toBeLessThan(home.h * 0.2);
  });
  it('à côté de la pierre, dans le ciel : il redescend sur le sable du fond', () => {
    expect(drop(beach, lizard, { x: 8, y: 30 }).spot.y).toBeCloseTo(51.4, 1);
  });
  it('lâché au-dessus de la mer : il reste sur le sable, au bord de l\'eau, jamais dans l\'océan', () => {
    expect(drop(beach, lizard, { x: 60, y: 36 }).spot.y).toBe(76);
    expect(drop(beach, lizard, { x: 40, y: 55 }).spot.y).toBe(66);
    expect(drop(beach, lizard, { x: 40, y: 80 }).spot.y).toBe(80); // sur la plage : là où on le pose
  });
  it('sur les rochers de devant (à droite), il garde presque sa taille', () => {
    const { home, spot } = drop(beach, lizard, { x: 86, y: 72 });
    expect(spot.y).toBe(72);
    expect(spot.h).toBeGreaterThan(home.h * 0.9);
  });
});

describe('rochers où l\'on peut se poser', () => {
  it('seulement le dessus des rochers, pas les arbres ni le ciel', () => {
    const p = { groundY: 80, horizonY: 30, anchors: [
      { id: 'rock', hit: { x: 10, y: 50, w: 20, h: 20 }, tags: ['climb'] },
      { id: 'tree', hit: { x: 50, y: 0, w: 20, h: 40 }, tags: ['climb'] },
      { id: 'stone', hit: { x: 80, y: 10, w: 10, h: 10 }, tags: ['climb'] }, // au-delà de l'horizon : décor lointain
    ] };
    expect(perchAt(p, 20, 52)).toBe(70);
    expect(perchAt(p, 20, 68)).toBeUndefined(); // devant le bas du rocher, pas dessus
    expect(perchAt(p, 60, 20)).toBeUndefined();
    expect(perchAt(p, 85, 12)).toBeUndefined();
    expect(perchAt({ ...p, perches: [{ x: 0, y: 0, w: 100, h: 100, base: 90 }] }, 20, 52)).toBe(90); // le plus proche gagne
  });
});
