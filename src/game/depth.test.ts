import { describe, expect, it } from 'vitest';
import { PLACES } from '../content/places';
import { PLACE_DEPTH } from '../content/places/depth';
import { SPECIES } from '../content/species';
import type { BiomeDef } from '../content/types';
import type { ActorRef, FamilyState } from '../engine/state';
import { dragSpot } from '../ui/drag';
import { homePlacement } from '../ui/scene';
import { farAt, FAR_SIZE, FARTHEST, farthestY, horizonOf, inWater, perchAt, placeScale } from './staging';

// demande du parent (2026-11-20) : « il doit pouvoir aller quand même assez loin… je dois pouvoir le poser
// sur la Pierre et les Lions… il faut qu'ils soient complètement au fond du chemin »

const family = { babies: [] } as unknown as FamilyState;
const adult = (speciesId: string, role: 'father' | 'mother'): ActorRef => ({ kind: 'adult', speciesId, role }) as ActorRef;

/** glisser un animal comme dans Habitat.tsx */
function drop(place: BiomeDef, actor: ActorRef, pointer: { x: number; y: number }) {
  const home = homePlacement(actor, family, place.groundY);
  const hz = horizonOf(place.groundY, place.horizonY);
  return { home, spot: dragSpot(home, pointer, 0, placeScale(place, home.y), (x) => farthestY(home.y, hz, place.farY, x), (x, y) => perchAt(place, x, y)) };
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

  // 2026-11-24 (demande du parent) : « le pingouin devenait tout petit quand il était sous l'arche, là il est beaucoup
  // trop grand… revois la perspective de tous les personnages » : tout au fond du sol, un animal a la taille choisie
  // sur le dessin de son décor (farSize), ni minuscule ni aussi grand qu'au premier plan
  it('tout au fond, un animal a la taille choisie pour son décor', () => {
    for (const p of Object.values(PLACES)) {
      // là où le sol va le plus loin (sur une plage : le sable du fond, pas devant la mer)
      const x = [...Array(19).keys()].map((i) => 5 + i * 5).reduce((m, v) => (farAt(p.farY!, v) < farAt(p.farY!, m) ? v : m));
      const { home, spot } = drop(p, adult('lion', 'father'), { x, y: 0 });
      expect(spot.y, p.id).toBeCloseTo(Math.max(farAt(p.farY!, x), spot.h + 1), 5);
      expect(spot.h / home.h, p.id).toBeLessThan(0.8);
      expect(spot.h / home.h, p.id).toBeGreaterThanOrEqual(FARTHEST - 1e-9);
      // au point le plus au fond du décor, exactement sa taille choisie ; ailleurs au fond, à peine plus grand
      if (p.farSize !== undefined) {
        expect(spot.h / home.h, p.id).toBeGreaterThanOrEqual(p.farSize - 1e-9);
        expect(spot.h / home.h, p.id).toBeLessThan(p.farSize + 0.1);
      }
    }
  });

  it('chaque décor où la famille marche au sol a sa taille au fond, choisie sur le dessin', () => {
    for (const s of SPECIES) {
      for (const id of s.allowedBiomes) {
        const p = PLACES[id as keyof typeof PLACES]!;
        if (p.lane || (p.seats?.length && !p.groundToo)) continue;
        expect(p.farSize, id).toBeDefined();
        expect(p.farSize!, id).toBeGreaterThanOrEqual(0.18);
        expect(p.farSize!, id).toBeLessThanOrEqual(0.6);
      }
    }
  });
});

describe('les lions tout au fond du chemin de la savane', () => {
  const savanna = PLACES.savanna!;
  it('on peut les poser là où le chemin se perd (x 72, y 42), plus petits, mais pas minuscules', () => {
    for (const role of ['father', 'mother'] as const) {
      const { home, spot } = drop(savanna, adult('lion', role), { x: 72, y: 42 });
      expect(spot.y).toBe(42);
      expect(spot.h / home.h).toBeLessThan(0.7);
      expect(spot.h / home.h).toBeGreaterThanOrEqual(FAR_SIZE - 1e-9); // 2026-11-23 : avant, moins de 0,3 : trop petit
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
  it('la lionne, posée à sa place devant le rocher, garde sa taille', () => {
    const mother = homePlacement(adult('lion', 'mother'), family, savanna.groundY);
    const { home, spot } = drop(savanna, adult('lion', 'mother'), { x: mother.x, y: mother.y });
    expect(Math.abs(spot.h / home.h - 1)).toBeLessThan(0.05);
  });
});

describe('le lézard sur la grosse pierre de la plage', () => {
  const beach = PLACES.oc_beach!;
  const lizard = adult('frilled_lizard', 'father');
  it('posé sur le dessus de la pierre, il y reste, à la taille qu\'il aurait au pied de la pierre', () => {
    const { home, spot } = drop(beach, lizard, { x: 21, y: 36 });
    expect(spot.y).toBe(36); // plus haut que le sable du fond (y 51) : il est sur la pierre
    // au pied de la pierre, ou au bord du sable s'il est un peu devant (le sable du fond va jusqu'à y 51-52 ici)
    expect(spot.h).toBeCloseTo(home.h * placeScale(beach, home.y)(home.y, Math.max(50, farAt(beach.farY!, 21))), 5);
    // la pierre est tout au fond : à peu près la taille du fond du sable (un tiers de sa taille)
    expect(spot.h).toBeLessThan(home.h * 0.45);
    expect(spot.h).toBeGreaterThan(home.h * 0.25);
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
    // dessus du rocher (y 50 à 61) : du sol juste derrière (50) au pied (70), régulièrement
    expect(perchAt(p, 20, 50)).toBeCloseTo(50, 5);
    expect(perchAt(p, 20, 52)).toBeCloseTo(50 + (20 * 2) / 11, 5);
    expect(perchAt(p, 20, 60.9)).toBeGreaterThan(69);
    expect(perchAt(p, 20, 68)).toBe(70); // sur la face : la taille du pied
    expect(perchAt(p, 20, 71)).toBeUndefined(); // devant le pied : le sol
    expect(perchAt(p, 60, 20)).toBeUndefined();
    expect(perchAt(p, 85, 12)).toBeUndefined();
    // un rocher du fond qui dépasse du sol : son dessus va du fond du sol (55) à son pied (58), jamais plus loin
    const far = { ...p, farY: 55, perches: [{ x: 0, y: 30, w: 40, h: 10, base: 58 }], anchors: [] };
    expect(perchAt(far, 20, 30)).toBeCloseTo(55, 5);
    expect(perchAt(far, 20, 39.9)).toBeGreaterThan(57.9);
  });
  it('sous une arche, c’est le sol', () => {
    const p = { groundY: 80, horizonY: 30, anchors: [{ id: 'arch', hit: { x: 10, y: 40, w: 20, h: 30 }, tags: ['climb'] }] };
    expect(perchAt(p, 20, 65)).toBeUndefined();
    expect(perchAt(p, 20, 45)).toBeDefined();
  });
  // capture de l'ours polaire sur les blocs de glace (2026-11-24) : « il y a un problème de changement de taille, ça
  // saute à ce niveau ». Dans tous les décors, en glissant un animal de bas en haut, sa taille diminue sans à-coup.
  it('aucun saut de taille en montant sur un rocher ou un bloc, dans aucun décor', () => {
    for (const p of Object.values(PLACES)) {
      if (p.lane || p.seats?.length) continue;
      const hz = horizonOf(p.groundY, p.horizonY);
      const sc = placeScale(p, p.groundY);
      const arches = (p.anchors ?? []).filter((a) => a.id === 'arch');
      for (let x = 1; x <= 99; x += 2) {
        if (arches.some((a) => x >= a.hit.x - 1 && x <= a.hit.x + a.hit.w + 1)) continue;
        const floor = farthestY(p.groundY, hz, p.farY, x);
        const size = (y: number) => sc(p.groundY, perchAt(p, x, y) ?? Math.max(y, Math.min(floor, 99.5)));
        for (let y = 99; y > 0; y -= 0.5) {
          const a = size(y);
          const b = size(y - 0.5);
          expect(b, `${p.id} x ${x} y ${y}`).toBeLessThanOrEqual(a + 1e-9);
          expect(a - b, `${p.id} x ${x} y ${y}`).toBeLessThan(0.1); // une pente, pas une marche (les anciens sauts : 0,14 à 0,4)
        }
      }
    }
  });
});

describe("pas d'animal dans l'eau des lacs et des rivières", () => {
  // demande du parent : « il faut bien que les animaux soient posés sur la terre et pas au milieu de l'eau »
  const withBabies = { babies: [{ id: 'b1', birthOrder: 1, stage: 'newborn' }, { id: 'b2', birthOrder: 2, stage: 'companion' }] } as unknown as FamilyState;
  const dropIn = (place: BiomeDef, pointer: { x: number; y: number }) => {
    const home = homePlacement(adult('lion', 'father'), family, place.groundY);
    const hz = horizonOf(place.groundY, place.horizonY);
    return dragSpot(home, pointer, 0, placeScale(place, home.y), (x) => farthestY(home.y, hz, place.farY, x), (x, y) => perchAt(place, x, y), undefined, place.water);
  };

  it("l'eau est mesurée sur les décors qui ont un lac, une rivière ou la mer devant", () => {
    for (const id of ['africa_waterhole', 'europe_lake', 'na_lake', 'sa_river', 'sa_waterfall', 'oc_fern_forest', 'ice_coast'])
      expect(PLACES[id as keyof typeof PLACES]!.water?.length, id).toBeGreaterThan(0);
    expect(inWater(PLACES.africa_waterhole!.water, 50, 50)).toBe(true);
    expect(inWater(PLACES.africa_waterhole!.water, 85, 80)).toBe(false);
  });

  it('la famille, à sa place, se tient toujours sur la terre', () => {
    for (const p of Object.values(PLACES)) {
      const actors: ActorRef[] = [adult('lion', 'father'), adult('lion', 'mother'), { kind: 'baby', speciesId: 'lion', babyId: 'b1' } as ActorRef, { kind: 'baby', speciesId: 'lion', babyId: 'b2' } as ActorRef];
      for (const a of actors) {
        const h = homePlacement(a, withBabies, p.groundY, p.lane);
        expect(inWater(p.water, h.x, h.y), `${p.id} ${a.kind}`).toBe(false);
      }
    }
  });

  it("lâché au milieu de l'étang du point d'eau, il revient sur la berge la plus proche", () => {
    const wh = PLACES.africa_waterhole!;
    const spot = dropIn(wh, { x: 50, y: 50 });
    expect(inWater(wh.water, spot.x, spot.y)).toBe(false);
    expect(Math.hypot(spot.x - 50, spot.y - 50)).toBeLessThan(16);
    // à côté de l'étang : là où on le pose
    expect(dropIn(wh, { x: 85, y: 80 })).toMatchObject({ x: 85, y: 80 });
  });

  it("nulle part, dans aucun décor, un animal posé au doigt ne reste dans l'eau", () => {
    for (const p of Object.values(PLACES)) {
      if (!p.water) continue;
      for (let x = 5; x <= 95; x += 10)
        for (let y = 30; y <= 98; y += 8) {
          const s = dropIn(p, { x, y });
          if (perchAt(p, s.x, s.y) === undefined) expect(inWater(p.water, s.x, s.y), `${p.id} (${x}, ${y})`).toBe(false);
        }
    }
  });
});

// 2026-11-23 (capture du tigre à la cascade de la jungle) : « Les perspectives ne sont vraiment pas bonnes… ils sont
// trop petits quand ils sont au fond, c'est pas logique »
describe('la perspective revue : chaque décor a sa propre profondeur', () => {
  it('la cascade de la jungle : le tigre au fond du chemin garde plus de la moitié de sa taille', () => {
    const falls = PLACES.asia_jungle_falls!;
    for (const role of ['father', 'mother'] as const) {
      const { home, spot } = drop(falls, adult('tiger', role), { x: 50, y: 0 });
      expect(spot.y).toBeLessThan(home.y - 5);
      expect(spot.h / home.h).toBeGreaterThanOrEqual(FAR_SIZE - 1e-9);
      expect(spot.h / home.h).toBeLessThan(0.8);
    }
  });

  it('dans chaque décor, la taille diminue régulièrement du devant vers le fond, sans saut', () => {
    for (const p of Object.values(PLACES)) {
      if (p.lane || p.seats?.length) continue;
      const home = homePlacement(adult('lion', 'father'), family, p.groundY);
      const scale = placeScale(p, home.y);
      const far = farAt(p.farY!, home.x);
      let prev = Infinity;
      for (let y = home.y; y >= far; y -= 1) {
        const k = scale(home.y, y);
        expect(k, `${p.id} y ${y}`).toBeLessThanOrEqual(prev + 1e-9);
        if (prev !== Infinity) expect(prev - k, `${p.id} y ${y}`).toBeLessThan(0.12);
        prev = k;
      }
      expect(scale(home.y, home.y), p.id).toBeCloseTo(1, 9);
      expect(scale(home.y, far), p.id).toBeGreaterThanOrEqual((p.farSize ?? FAR_SIZE) - 0.02);
    }
  });

  it('le soir sur la glace : sous l’arche, le pingouin est tout petit (pas plus d’un quart de sa taille)', () => {
    const aurora = PLACES.an_aurora!;
    for (const role of ['father', 'mother'] as const) {
      const { home, spot } = drop(aurora, adult('penguin', role), { x: 10, y: 0 });
      expect(spot.h / home.h).toBeLessThanOrEqual(0.25);
      expect(spot.h / home.h).toBeGreaterThanOrEqual(0.15);
    }
  });
});

describe('la mer froide : le pingouin va sur les blocs de banquise', () => {
  const sea = PLACES.open_sea!;
  const pip = adult('penguin', 'father');
  const dropSea = (pointer: { x: number; y: number }) => {
    const home = homePlacement(pip, family, sea.groundY);
    const hz = horizonOf(sea.groundY, sea.horizonY);
    return { home, spot: dragSpot(home, pointer, 0, placeScale(sea, home.y), (x) => farthestY(home.y, hz, sea.farY, x), (x, y) => perchAt(sea, x, y), sea.lane, sea.water, undefined, sea.floes) };
  };
  it('posé sur un bloc, il y reste ; posé dans l’eau entre deux blocs, il n’y reste pas', () => {
    expect(dropSea({ x: 28, y: 63 }).spot).toMatchObject({ x: 28, y: 63 }); // le grand bloc de gauche
    expect(dropSea({ x: 75, y: 66 }).spot).toMatchObject({ x: 75, y: 66 }); // le grand bloc de droite
    expect(inWater(sea.water, 50, 60, sea.floes)).toBe(true);
    const wet = dropSea({ x: 50, y: 60 }).spot;
    expect(inWater(sea.water, wet.x, wet.y, sea.floes)).toBe(false);
  });
  it('il peut aller jusqu’à la grande plaque tout au fond à gauche, où il est tout petit', () => {
    const { home, spot } = dropSea({ x: 15, y: 46 });
    expect(spot.y).toBeCloseTo(46, 5);
    expect(spot.h / home.h).toBeLessThan(0.3);
    // plus près, sur le grand bloc de gauche, il est plus grand qu'au fond
    expect(dropSea({ x: 28, y: 63 }).spot.h).toBeGreaterThan(spot.h);
  });
});
