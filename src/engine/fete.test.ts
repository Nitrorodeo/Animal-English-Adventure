import { describe, expect, it } from 'vitest';
// @ts-expect-error -- module Node disponible dans Vitest, sans les types Node dans le projet
import { readFileSync } from 'node:fs';
import { getArchetype, unlockedAt } from '../content/archetypes';
import { getSpecies } from '../content/species';
import { partyFor, UNLOCKS_SHOWN } from '../ui/Habitat';
import { createBaby } from './family';
import { actorGames } from './quests';
import { getFamily, newGameState, withFamily } from './state';

/** Carte de fête d'un bébé qui grandit (2026-11-25 : « je ne peux pas fermer »). */
describe('la fête du bébé se ferme toujours', () => {
  const lion = getSpecies('lion');
  const s0 = newGameState();
  const made = createBaby(getFamily(s0, 'lion'), 'girl', 'Lea', 'lea1');
  if (!made.ok) throw new Error('bébé');
  const grown = { ...made.baby, stage: 'little' as const };
  const state = withFamily(s0, { ...made.family, babies: [grown] });
  const ids = new Set(actorGames(state, lion, { speciesId: 'lion', kind: 'baby', babyId: 'lea1' }).map((g) => g.id));

  it('seulement les jeux nouveaux qu’on peut jouer avec CE bébé, pas ceux des autres animaux', () => {
    expect(unlockedAt('little').length).toBeGreaterThan(20); // la liste complète, toutes espèces : c'était celle affichée
    const p = partyFor(grown, 'little', 'cub', (id) => ids.has(id));
    expect(p.unlocks.length).toBeGreaterThan(0);
    expect(p.unlocks.length).toBeLessThan(unlockedAt('little').length);
    for (const u of p.unlocks) {
      const arch = unlockedAt('little').find((a) => a.titleEn === u.en)!;
      expect(ids.has(arch.id), u.en).toBe(true);
    }
    // les jeux propres à d'autres espèces ne sont jamais annoncés au lionceau
    expect(p.unlocks.map((u) => u.en)).not.toContain(getArchetype('sunrise_den').titleEn);
  });

  it('une croix toujours visible, et au plus 4 jeux nommés (la carte tient dans l’écran)', () => {
    const src = readFileSync(new URL('../ui/Habitat.tsx', import.meta.url), 'utf8');
    expect(src).toContain('<button className="round grow-close" onClick={closeParty}');
    expect(src).toContain('grow.unlocks.slice(0, UNLOCKS_SHOWN)');
    expect(src).toContain('canPlay(g.babyId)');
    expect(UNLOCKS_SHOWN).toBe(4);
    expect(readFileSync(new URL('../styles.css', import.meta.url), 'utf8')).toMatch(/\.grow-close \{ position: sticky; top: 0;/);
  });
});
