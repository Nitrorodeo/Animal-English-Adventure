import { describe, expect, it } from 'vitest';
import { PLACES } from '../content/places';
import { SPECIES } from '../content/species';
import type { ActorRef, FamilyState } from '../engine/state';
import { dragSpot } from '../ui/drag';
import { homePlacement } from '../ui/scene';
import { farthestY, groundScale, horizonOf, laneAt, snapToLane } from './staging';

// demande du parent (2026-11-21) : « une règle spéciale seulement pour les toucans : qu'ils ne puissent être
// déplacés que sur la branche, pas dans le vide… et une taille logique, sur la branche ils deviennent trop petits »

const toucanPlaces = SPECIES.find((s) => s.id === 'toucan')!.allowedBiomes.map((id) => PLACES[id]!);
const family = { babies: [] } as unknown as FamilyState;
const father: ActorRef = { kind: 'adult', speciesId: 'toucan', role: 'father' } as ActorRef;
const mother: ActorRef = { kind: 'adult', speciesId: 'toucan', role: 'mother' } as ActorRef;

function drop(place: (typeof toucanPlaces)[number], actor: ActorRef, pointer: { x: number; y: number }) {
  const home = homePlacement(actor, family, place.groundY, place.lane);
  const hz = horizonOf(place.groundY, place.horizonY);
  const spot = dragSpot(home, pointer, 0, (f, t) => groundScale(f, t, hz), (x) => farthestY(home.y, hz, place.farY, x), undefined, place.lane);
  return { home, spot };
}

describe('toucans : seulement sur la branche', () => {
  it('chacun de leurs décors a une branche tracée', () => {
    expect(toucanPlaces.length).toBeGreaterThanOrEqual(3);
    for (const p of toucanPlaces) {
      expect(p.lane, p.id).toBeDefined();
      for (const [x, back, front] of p.lane!) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(back, p.id).toBeGreaterThan(p.horizonY!);
        expect(front, p.id).toBeGreaterThan(back);
        expect(front - back, p.id).toBeLessThan(14); // une branche, pas un champ
      }
    }
  });

  it('lâché dans le vide (ciel, forêt en dessous, hors de la branche), il revient sur la branche', () => {
    for (const p of toucanPlaces) {
      for (const pointer of [{ x: 50, y: 5 }, { x: 50, y: 99 }, { x: 0, y: 50 }, { x: 100, y: 80 }, { x: 60, y: 30 }]) {
        const { spot } = drop(p, father, pointer);
        const L = laneAt(p.lane!, spot.x);
        expect(spot.y, `${p.id} ${JSON.stringify(pointer)}`).toBeGreaterThanOrEqual(L.back - 1e-9);
        expect(spot.y, `${p.id} ${JSON.stringify(pointer)}`).toBeLessThanOrEqual(L.front + 1e-9);
      }
    }
  });

  it('il garde sa taille sur la branche (plus de rapetissement par perspective)', () => {
    for (const p of toucanPlaces) {
      for (let x = 25; x <= 90; x += 5) {
        const L = laneAt(p.lane!, x);
        for (const y of [L.back, (L.back + L.front) / 2, L.front]) {
          const { home, spot } = drop(p, father, { x, y });
          expect(spot.h / home.h, `${p.id} x${x}`).toBeGreaterThan(0.9);
          expect(spot.h / home.h, `${p.id} x${x}`).toBeLessThan(1.1);
        }
      }
    }
  });

  it('toute la famille démarre sur la branche, à sa taille normale', () => {
    for (const p of toucanPlaces) {
      for (const a of [father, mother]) {
        const home = homePlacement(a, family, p.groundY, p.lane);
        const L = laneAt(p.lane!, home.x);
        expect(home.x, p.id).toBeCloseTo(L.x, 5);
        expect(home.y, p.id).toBeGreaterThanOrEqual(L.back);
        expect(home.y, p.id).toBeLessThanOrEqual(L.front);
        expect(home.h, p.id).toBeGreaterThan(20);
      }
    }
  });

  it('une place gardée d\'avant (dans le vide) est ramenée sur la branche', () => {
    const p = toucanPlaces[0]!;
    const home = homePlacement(father, family, p.groundY, p.lane);
    const s = snapToLane(p.lane!, home, 50, 95);
    expect(s.y).toBeLessThanOrEqual(laneAt(p.lane!, 50).front);
  });

  it('les autres animaux ne sont pas concernés : aucun autre décor n\'a de branche', () => {
    for (const p of Object.values(PLACES)) {
      if (!toucanPlaces.includes(p) && p.id !== 'sa_sloth_canopy') expect(p.lane, p.id).toBeUndefined();
    }
  });
});
