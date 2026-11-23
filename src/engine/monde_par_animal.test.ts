/**
 * « Chaque personnage a son propre jeu avec son propre vocabulaire, chaque décor a son propre vocabulaire »
 * (demande du parent, 2026-11-21) : garde globale, tous continents.
 */
import { describe, expect, it } from 'vitest';
import { ARCHETYPES } from '../content/archetypes';
import { PLACES } from '../content/places';
import { SPECIES } from '../content/species';

describe('un monde à soi pour chaque animal', () => {
  it('chaque espèce a au moins un jeu qui n’est qu’à elle', () => {
    for (const sp of SPECIES) {
      const own = ARCHETYPES.filter((a) => a.implemented && a.speciesIds?.length === 1 && a.speciesIds[0] === sp.id);
      expect(own.length, sp.id).toBeGreaterThanOrEqual(1);
    }
  });

  it('chaque décor a au moins 2 mots qu’aucun autre décor n’a', () => {
    const placesOf = new Map<string, Set<string>>();
    for (const p of Object.values(PLACES)) for (const a of p.anchors) {
      const w = a.word.toLowerCase();
      placesOf.set(w, (placesOf.get(w) ?? new Set()).add(p.id));
    }
    // 2026-11-23 : seuls les décors joués par une famille comptent (la savane d'origine reste dans le code, hors parcours)
    const played = new Set(SPECIES.flatMap((s) => s.allowedBiomes));
    for (const p of Object.values(PLACES).filter((x) => played.has(x.id))) {
      const own = new Set(p.anchors.map((a) => a.word.toLowerCase()).filter((w) => placesOf.get(w)!.size === 1));
      expect([...own].length, `${p.id} : ${[...own].join(', ')}`).toBeGreaterThanOrEqual(2);
    }
  });
});
