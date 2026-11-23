/**
 * Objets du ciel (2026-11-21) : les lanternes, étoiles, lune et flocons étaient accrochés par le bas
 * à un point situé tout en haut du décor, et dépassaient donc à moitié du cadre.
 */
import { describe, expect, it } from 'vitest';
import { SKY_SPOTS } from '../content/props';
import { PLACES } from '../content/places';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HALO, Shape, propPos, propSize } from './PropLayer';

/** hauteur d'un objet en % de la hauteur du décor (décor 16:9, taille en % de la largeur) */
const heightPct = (size: Parameters<typeof propSize>[0]) => (propSize(size) * 16) / 9;
const place = Object.values(PLACES)[0]!;

describe('objets du ciel', () => {
  it('restent entiers dans le décor, sous le titre du jeu, et dans le ciel', () => {
    for (const size of [undefined, 'small', 'big'] as const) {
      SKY_SPOTS.forEach((_, i) => {
        const pos = propPos({ id: 'x', prop: 'star', spot: i, sky: true, size }, place);
        expect(pos.anchor).toBe('top');
        expect(pos.top, `ciel ${i}`).toBeGreaterThanOrEqual(9);
        expect(pos.top + heightPct(size), `ciel ${i}`).toBeLessThanOrEqual(40);
      });
    }
  });

  it('un objet posé au sol reste accroché par le bas à son emplacement', () => {
    const pos = propPos({ id: 'x', prop: 'apple', spot: 0 }, place);
    expect(pos).toEqual({ left: place.spots[0]!.x, top: place.spots[0]!.y, anchor: 'bottom' });
  });

  it('aucun emplacement au sol ne fait dépasser un objet du haut du décor', () => {
    for (const p of Object.values(PLACES)) p.spots.forEach((s, i) => expect(s.y - heightPct('big'), `${p.id} #${i}`).toBeGreaterThanOrEqual(0));
  });
});

describe('formes à repérer sur un décor chargé', () => {
  it('traces et feuille d’érable ont un liseré clair (visibles sur un pelage, un sol sombre ou un feuillage rouge)', () => {
    for (const shape of ['hoof', 'birdfoot', 'maple'] as const) {
      const svg = renderToStaticMarkup(createElement(Shape, { shape, fill: '#d84315' }));
      expect(svg, shape).toContain(`stroke="${HALO}"`);
    }
  });
});
