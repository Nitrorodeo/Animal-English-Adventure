import { describe, expect, it } from 'vitest';
import { PLACES } from '../content/places';
import type { ActorRef, FamilyState } from '../engine/state';
import { dragSpot } from '../ui/drag';
import { homePlacement } from '../ui/scene';
import { farAt, nearSeat, placeScale, SEAT_REACH, seatAt, snapToSeats } from './staging';

// demande du parent (2026-11-23, nid des hiboux) : « je veux pouvoir déplacer les oiseaux sur les endroits
// stratégiques, c'est-à-dire la pierre où est Olive, toute la branche où est Oscar avec un effet de profondeur
// logique, pouvoir le mettre dans le nid au-dessus d'Oscar ou dans le nid au-dessus d'Olive »

const nest = PLACES.europe_owl_nest!;
const seats = nest.seats!;
const family = { babies: [{ id: 'b1', birthOrder: 1, stage: 'little' }, { id: 'b2', birthOrder: 2, stage: 'newborn' }] } as unknown as FamilyState;
const father = { kind: 'adult', speciesId: 'owl', role: 'father' } as ActorRef;
const mother = { kind: 'adult', speciesId: 'owl', role: 'mother' } as ActorRef;
const baby2 = { kind: 'baby', speciesId: 'owl', babyId: 'b2' } as ActorRef;
const natural = homePlacement(father, family, nest.groundY).h;
const drop = (x: number, y: number) => snapToSeats(seats, natural, x, y);

describe('nid des hiboux : on se pose sur le rocher, la branche ou un nid', () => {
  it('le décor a ses quatre endroits', () => {
    expect(seats.map((s) => s.id).sort()).toEqual(['branch', 'hole_nest', 'rock', 'tree_nest']);
    for (const s of seats)
      for (const [x, back, front, scale] of s.band) {
        expect(x, s.id).toBeGreaterThanOrEqual(0);
        expect(x, s.id).toBeLessThanOrEqual(100);
        expect(back, s.id).toBeLessThanOrEqual(front);
        expect(scale, s.id).toBeGreaterThan(0.3);
        expect(scale, s.id).toBeLessThanOrEqual(1);
      }
  });

  it('lâché près de chaque endroit, il s’y pose', () => {
    expect(drop(88, 84).seat).toBe('rock');
    expect(drop(30, 61).seat).toBe('branch');
    expect(drop(48, 58).seat).toBe('branch');
    expect(drop(14, 40).seat).toBe('hole_nest'); // le nid au-dessus d'Oscar, dans le creux de l'arbre
    expect(drop(88, 27).seat).toBe('tree_nest'); // le nid au-dessus d'Olive
  });

  it('jamais dans le vide : lâché dans le ciel ou au-dessus de la forêt, il va sur l’endroit le plus proche', () => {
    for (const [x, y] of [[50, 20], [60, 75], [70, 50], [5, 95], [99, 5]] as const) {
      const s = drop(x, y);
      const S = seatAt(seats.find((t) => t.id === s.seat)!, s.x);
      expect(s.y, `${x},${y}`).toBeGreaterThanOrEqual(S.back);
      expect(s.y, `${x},${y}`).toBeLessThanOrEqual(S.front);
    }
  });

  it('profondeur logique : plus petit au bout de la branche qu’au pied du tronc, et plus petit dans les nids que sur le rocher', () => {
    expect(drop(48, 58).h).toBeLessThan(drop(22, 64).h);
    expect(drop(14, 43).h).toBeLessThan(drop(88, 84).h);
    expect(drop(88, 30).h).toBeLessThan(drop(88, 84).h);
    // sur le rocher du premier plan : sa taille normale (à quelques % près selon le bord avant ou arrière)
    expect(drop(88, 84).h / natural).toBeGreaterThan(0.9);
  });

  it('il tient dans le creux de l’arbre : la tête ne dépasse pas le haut du trou', () => {
    const s = drop(14, 43);
    expect(s.y - s.h).toBeGreaterThan(22); // haut du creux vers y 23 %
  });

  it('au départ : papa sur la branche, maman sur le rocher, le second bébé dans le nid de droite', () => {
    expect(drop(...xy(homePlacement(father, family, nest.groundY, nest.lane, nest))).seat).toBe('branch');
    expect(drop(...xy(homePlacement(mother, family, nest.groundY, nest.lane, nest))).seat).toBe('rock');
    expect(drop(...xy(homePlacement(baby2, family, nest.groundY, nest.lane, nest))).seat).toBe('tree_nest');
  });

  it('glissé au doigt : dragSpot suit les mêmes endroits', () => {
    const home = homePlacement(father, family, nest.groundY, nest.lane, nest);
    const s = dragSpot(home, { x: 15, y: 41 }, 0, () => 1, 0, undefined, undefined, undefined, { list: seats, naturalH: natural });
    expect(s).toMatchObject({ x: 15 });
    expect(s.y).toBeGreaterThanOrEqual(42);
    expect(s.y).toBeLessThanOrEqual(44);
  });

  it('les autres décors ne sont pas touchés', () => {
    const withSeats = Object.values(PLACES).filter((p) => p.seats?.length).map((p) => p.id).sort();
    expect(withSeats).toEqual(['asia_mountain', 'europe_fox_glade', 'europe_hog_log', 'europe_owl_moon', 'europe_owl_nest', 'europe_owl_oak', 'na_beaver_falls', 'na_beaver_pond', 'na_bison_canyon', 'sa_canopy_treehouse', 'sa_river', 'sa_sloth_canopy', 'sa_sloth_refuge']);
    const groundToo = Object.values(PLACES).filter((p) => p.groundToo).map((p) => p.id).sort();
    expect(groundToo).toEqual(['asia_mountain', 'europe_fox_glade', 'europe_hog_log', 'europe_owl_oak', 'na_beaver_falls', 'na_beaver_pond', 'na_bison_canyon', 'sa_canopy_treehouse', 'sa_river', 'sa_sloth_canopy', 'sa_sloth_refuge']);
  });
});

// demande du parent (2026-11-23, la branche au clair de lune) : « ils peuvent aller que sur la grosse pierre sous la
// branche ou alors toute la longueur de la branche. Enlève aussi le mode nuit qui ne sert à rien vu que c'est déjà
// une image de nuit »
describe('branche au clair de lune : la grosse pierre ou toute la branche, et pas de bouton nuit', () => {
  const moon = PLACES.europe_owl_moon!;
  const dropMoon = (x: number, y: number) => snapToSeats(moon.seats!, natural, x, y);

  it('deux endroits seulement : la branche et la pierre', () => {
    expect(moon.seats!.map((s) => s.id).sort()).toEqual(['branch', 'rock']);
    expect(dropMoon(24, 84).seat).toBe('rock');
    expect(dropMoon(15, 50).seat).toBe('branch'); // près du tronc
    expect(dropMoon(40, 60).seat).toBe('branch');
    expect(dropMoon(62, 70).seat).toBe('branch'); // le bout de la branche
  });

  it('jamais dans le vide : lâché dans le ciel, sur la lune ou dans l’herbe, il va sur la branche ou la pierre', () => {
    for (const [x, y] of [[80, 20], [90, 90], [50, 85], [5, 10], [70, 40]] as const) {
      const s = dropMoon(x, y);
      const S = seatAt(moon.seats!.find((t) => t.id === s.seat)!, s.x);
      expect(s.y, `${x},${y}`).toBeGreaterThanOrEqual(S.back);
      expect(s.y, `${x},${y}`).toBeLessThanOrEqual(S.front);
    }
  });

  it('profondeur : plus petit au bout de la branche qu’au pied du tronc, plus grand sur la pierre du premier plan', () => {
    expect(dropMoon(62, 70).h).toBeLessThan(dropMoon(15, 50).h);
    expect(dropMoon(15, 50).h).toBeLessThan(dropMoon(24, 84).h);
  });

  it('au départ, chacun est sur la branche ou la pierre', () => {
    for (const a of [father, mother, baby2]) {
      const h = homePlacement(a, family, moon.groundY, moon.lane, moon);
      expect(['branch', 'rock']).toContain(dropMoon(h.x, h.y).seat);
    }
  });

  it('pas de bouton « Bonne nuit » sur cette image de nuit, et seulement sur elle', () => {
    expect(moon.nightImage).toBe(true);
    expect(Object.values(PLACES).filter((p) => p.nightImage).map((p) => p.id)).toEqual(['europe_owl_moon']);
  });
});

// demande du parent (2026-11-23, le chêne) : « on les laisse évoluer par terre, c'est parfait et il faut juste une
// taille adaptée au nid dans l'arbre »
describe('chêne : le sol reste libre, le nid du creux à une taille adaptée', () => {
  const oak = PLACES.europe_owl_oak!;

  it('la place de départ au sol ne change pas', () => {
    for (const a of [father, mother, baby2])
      expect(homePlacement(a, family, oak.groundY, oak.lane, oak)).toEqual(homePlacement(a, family, oak.groundY, oak.lane));
  });

  it('glissé au sol, il reste au sol comme avant', () => {
    const home = homePlacement(father, family, oak.groundY, oak.lane, oak);
    const withNest = dragSpot(home, { x: 40, y: 85 }, 0, () => 1, 0, undefined, undefined, undefined, { list: oak.seats!, naturalH: natural, groundToo: true });
    const without = dragSpot(home, { x: 40, y: 85 }, 0, () => 1, 0);
    expect(withNest).toEqual(without);
  });

  it('lâché tout près du nid, il s’y pose, bien plus petit qu’au sol', () => {
    const home = homePlacement(father, family, oak.groundY, oak.lane, oak);
    const s = dragSpot(home, { x: 79, y: 31 }, 0, () => 1, 0, undefined, undefined, undefined, { list: oak.seats!, naturalH: natural, groundToo: true });
    expect(s.y).toBeGreaterThanOrEqual(31);
    expect(s.y).toBeLessThanOrEqual(33);
    expect(s.h).toBeLessThan(home.h * 0.6);
    expect(nearSeat(oak.seats!, natural, 50, 80, SEAT_REACH)).toBeUndefined();
  });

  it('le bouton nuit reste sur ce décor de jour', () => {
    expect(oak.nightImage).toBeFalsy();
  });
});

// demande du parent (2026-11-23, la cabane des toucans) : « je veux qu'il puisse accéder à ces 2 plateformes »
describe('cabane des toucans : la branche, et les deux plateformes de mousse', () => {
  const house = PLACES.sa_canopy_treehouse!;
  const tico = { kind: 'adult', speciesId: 'toucan', role: 'father' } as ActorRef;
  const tNatural = homePlacement(tico, family, house.groundY).h;
  const home = homePlacement(tico, family, house.groundY, house.lane, house);
  const move = (x: number, y: number) => dragSpot(home, { x, y }, 0, () => 1, 0, undefined, house.lane, undefined, { list: house.seats!, naturalH: tNatural, groundToo: true });

  it('au départ, la famille est sur la branche, comme avant', () => {
    expect(home).toEqual(homePlacement(tico, family, house.groundY, house.lane));
    expect(home.y).toBeGreaterThan(60);
  });

  it('lâché sur la plateforme du bas, il s’y pose, plus petit', () => {
    const s = move(76, 36);
    expect(s.y).toBeGreaterThanOrEqual(35.2);
    expect(s.y).toBeLessThanOrEqual(38);
    expect(s.h).toBeLessThan(home.h * 0.6);
    expect(s.h).toBeGreaterThan(home.h * 0.4);
  });

  it('lâché sur la plateforme du haut, il s’y pose, encore un peu plus petit', () => {
    const s = move(88, 26);
    expect(s.y).toBeGreaterThanOrEqual(24.9);
    expect(s.y).toBeLessThanOrEqual(26.5);
    expect(s.h).toBeLessThan(move(76, 36).h);
  });

  it('ailleurs, il reste sur la branche comme avant (jamais dans le vide)', () => {
    for (const [x, y] of [[40, 72], [30, 20], [55, 45], [10, 90]] as const) {
      const s = move(x, y);
      expect(s, `${x},${y}`).toEqual(dragSpot(home, { x, y }, 0, () => 1, 0, undefined, house.lane));
      expect(s.y, `${x},${y}`).toBeGreaterThan(60);
    }
  });
});

// demande du parent (2026-11-23, le refuge des paresseux) : « proportion avec le nid des paresseux n'est pas juste »
describe('refuge des paresseux : dans le creux de l’arbre, à la taille du nid', () => {
  const refuge = PLACES.sa_sloth_refuge!;
  const nina = { kind: 'adult', speciesId: 'sloth', role: 'mother' } as ActorRef;
  const sNatural = homePlacement(nina, family, refuge.groundY).h;
  const home = homePlacement(nina, family, refuge.groundY, refuge.lane, refuge);
  const move = (x: number, y: number) => dragSpot(home, { x, y }, 0, () => 1, 0, undefined, undefined, undefined, { list: refuge.seats!, naturalH: sNatural, groundToo: true });

  it('au départ, la famille est au sol, comme avant', () => {
    expect(home).toEqual(homePlacement(nina, family, refuge.groundY));
  });

  it('lâché dans le creux, il s’assoit sur le lit de feuilles, bien plus petit que le creux', () => {
    const s = move(84, 55);
    expect(s.y).toBeGreaterThanOrEqual(58);
    expect(s.y).toBeLessThanOrEqual(60.5);
    // l'ouverture du creux va de y 41,6 à 60 % : le paresseux en prend environ les deux tiers, la tête reste dedans
    expect(s.h).toBeLessThan((60 - 41.6) * 0.75);
    expect(s.h).toBeGreaterThan((60 - 41.6) * 0.45);
    expect(s.y - s.h).toBeGreaterThan(43);
  });

  it('au sol, devant l’arbre, il reste au sol comme avant', () => {
    expect(move(60, 85)).toEqual(dragSpot(home, { x: 60, y: 85 }, 0, () => 1, 0));
  });
});

function xy(p: { x: number; y: number }): [number, number] {
  return [p.x, p.y];
}

// demande du parent (2026-11-24) : castors « jusqu'au toit de leur nid, rentrer le castor dans le petit trou » ; bison
// « au fond, au bord de la falaise, proportionnellement adapté » ; jaguar « il doit pouvoir aller jusque là » (les ruines)
describe('perchoirs de décors au sol : le sol reste libre, la hutte, la falaise et les ruines s’y ajoutent', () => {
  const cases = [
    { place: 'na_beaver_pond', species: 'beaver', ground: [50, 88], drops: [{ at: [74, 36], seat: 'roof', y: [37, 40], big: 0.4 }, { at: [69, 50], seat: 'entrance', y: [50, 51.5], big: 0.3 }] },
    { place: 'na_beaver_falls', species: 'beaver', ground: [50, 86], drops: [{ at: [19, 35], seat: 'big_rock', y: [34, 37.5], big: 0.4 }, { at: [43, 48], seat: 'mid_rock_left', y: [47, 49], big: 0.4 }, { at: [66, 51], seat: 'mid_rock_right', y: [50, 52], big: 0.4 }, { at: [58, 43], seat: 'falls_rock', y: [42, 44], big: 0.4 }] },
    { place: 'asia_mountain', species: 'tiger', ground: [40, 88], drops: [{ at: [80, 54], seat: 'stairs_low', y: [51, 57], big: 0.6 }, { at: [78, 29.5], seat: 'stairs_high', y: [27, 32], big: 0.4 }] },
    { place: 'europe_fox_glade', species: 'fox', ground: [60, 86], drops: [{ at: [28, 51], seat: 'big_rock', y: [49, 54], big: 0.7 }] },
    { place: 'europe_hog_log', species: 'hedgehog', ground: [50, 88], drops: [{ at: [22, 36], seat: 'stone', y: [34, 38], big: 0.5 }, { at: [90, 49], seat: 'hollow', y: [47.5, 51], big: 0.5 }] },
    { place: 'na_bison_canyon', species: 'bison', ground: [60, 88], drops: [{ at: [20, 41], seat: 'cliff', y: [41, 47], big: 0.4 }] },
    { place: 'sa_river', species: 'jaguar', ground: [30, 92], drops: [{ at: [47, 36], seat: 'ruin', y: [38, 41], big: 0.4 }] },
  ];
  for (const c of cases) {
    const place = PLACES[c.place]!;
    const actor = { kind: 'adult', speciesId: c.species, role: 'father' } as ActorRef;
    const nat = homePlacement(actor, family, place.groundY).h;
    const home = homePlacement(actor, family, place.groundY, place.lane, place);
    const move = (x: number, y: number) => dragSpot(home, { x, y }, 0, placeScale(place, home.y), 0, undefined, undefined, undefined, { list: place.seats!, naturalH: nat, groundToo: true });

    it(`${c.place} : la place de départ au sol ne change pas`, () => {
      expect(place.groundToo).toBe(true);
      expect(home).toEqual(homePlacement(actor, family, place.groundY));
    });

    it(`${c.place} : glissé au sol, il reste au sol comme avant`, () => {
      const [x, y] = c.ground as [number, number];
      expect(nearSeat(place.seats!, nat, x, y, SEAT_REACH)).toBeUndefined();
      expect(move(x, y)).toEqual(dragSpot(home, { x, y }, 0, placeScale(place, home.y), 0));
    });

    for (const d of c.drops)
      it(`${c.place} : lâché près de « ${d.seat} », il s’y pose, à la taille de cet endroit`, () => {
        const [x, y] = d.at as [number, number];
        const s = move(x, y);
        expect(s.y).toBeGreaterThanOrEqual(d.y[0]!);
        expect(s.y).toBeLessThanOrEqual(d.y[1]!);
        expect(s.h).toBeLessThan(home.h * d.big);
        // jamais plus grand qu'au fond du sol : l'endroit est derrière
        const far = placeScale(place, home.y)(home.y, farAt(place.farY!, s.x)) * home.h;
        expect(s.h).toBeLessThanOrEqual(far * 1.05);
      });
  }

  it('hutte des castors : le toit est plus haut que le fond du sol, l’entrée est au ras de l’eau', () => {
    const lodge = PLACES.na_beaver_pond!;
    const roof = seatAt(lodge.seats!.find((x) => x.id === 'roof')!, 75);
    const door = seatAt(lodge.seats!.find((x) => x.id === 'entrance')!, 69);
    expect(roof.front).toBeLessThan(42);
    expect(door.back).toBeGreaterThan(roof.front);
    expect(door.front).toBeLessThanOrEqual(52);
    expect(door.scale).toBeLessThan(roof.scale);
  });
});

// demande du parent (2026-11-24, capture des ours) : « les proportions et l'emplacement ne sont pas du tout logiques »
describe('forêt de séquoias : les ours restent sur le chemin, pas dans les buissons au pied des troncs', () => {
  const wood = PLACES.na_redwoods!;
  it('le fond du sol est le bout du chemin (y 66), plus bas que le pied des troncs', () => {
    expect(farAt(wood.farY!, 55)).toBe(66);
    expect(farAt(wood.farY!, 70)).toBe(66);
    expect(wood.horizonY).toBeLessThan(66);
  });
  it('au bout du chemin, l’ours est nettement plus petit qu’au premier plan, sans être minuscule', () => {
    const scale = placeScale(wood, 78)(78, 66);
    expect(scale).toBeGreaterThan(0.3);
    expect(scale).toBeLessThan(0.45);
  });
  it('sur la gauche, le sol remonte moins loin : les grosses racines ne sont pas un sol', () => {
    expect(farAt(wood.farY!, 20)).toBeGreaterThan(farAt(wood.farY!, 50));
  });
});
