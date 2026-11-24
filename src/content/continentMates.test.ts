import { describe, expect, it } from 'vitest';
import { continentMates, SPECIES } from './species';

// demande du parent (2026-11-24) : « quand nous sommes dans un continent, il y ait le logo des autres animaux pour
// pouvoir passer de l'un à l'autre facilement, sans avoir à ressortir jusqu'à la MAP principale »
describe('les animaux du continent dans la barre du haut', () => {
  it('en Antarctique : manchot, phoque et ours polaire, dans l’ordre de la carte', () => {
    expect(continentMates('polar_bear').map((s) => s.id)).toEqual(['penguin', 'seal', 'polar_bear']);
  });
  it('pour chaque animal jouable : lui-même et seulement des animaux jouables de son continent', () => {
    for (const sp of SPECIES.filter((s) => s.playable)) {
      const mates = continentMates(sp.id);
      expect(mates.map((s) => s.id), sp.id).toContain(sp.id);
      for (const m of mates) {
        expect(m.continentId, sp.id).toBe(sp.continentId);
        expect(m.playable, m.id).toBe(true);
        expect(m.allowedBiomes.length, m.id).toBeGreaterThan(0);
      }
    }
  });
});
