/**
 * Changer le nom des animaux (demande du parent, 2026-11-25 : « il faut aussi qu'on puisse changer le nom des
 * animaux si besoin, facilement »). Papa, Maman et chaque bébé se renomment depuis leur menu.
 *
 * - Les mêmes garde-fous que pour nommer un bébé (sanitizeName : lettres, chiffres, espaces, tirets, 18 au plus).
 * - Un parent qui reprend le nom d'origine du jeu redevient « sans changement » (rien n'est gardé).
 * - Les voix : un nom choisi n'est pas enregistré à l'avance ; les phrases qui le contiennent sont dites dans leur
 *   variante sans prénom, comme pour les bébés (voir audio/voiceKey.ts).
 */
import type { ParentRole, SpeciesDef } from '../content/types';
import { getSpecies } from '../content/species';
import { sanitizeName, type NameResult } from './family';
import { findBaby } from './quests';
import { getFamily, withFamily, type ActorRef, type GameState } from './state';

/** Nom d'un parent : celui choisi par la famille, sinon celui du jeu. */
export function parentName(state: GameState, species: SpeciesDef, role: ParentRole): string {
  return getFamily(state, species.id).parentNames?.[role] ?? species[role].name;
}

/** L'espèce avec les noms des parents choisis par la famille (les scènes du jeu les reprennent partout). */
export function withParentNames(species: SpeciesDef, names: Partial<Record<ParentRole, string>> | undefined): SpeciesDef {
  if (!names?.father && !names?.mother) return species;
  return {
    ...species,
    father: { ...species.father, name: names.father ?? species.father.name },
    mother: { ...species.mother, name: names.mother ?? species.mother.name },
  };
}

/** Nom affiché d'un personnage. */
export function nameOf(state: GameState, species: SpeciesDef, a: ActorRef): string {
  if (a.kind === 'adult') return parentName(state, species, a.role);
  return findBaby(state, a)?.name ?? species.babyWord.en;
}

export type RenameResult = { ok: true; state: GameState } | { ok: false; error: Extract<NameResult, { ok: false }>['error'] | 'same_name' | 'unknown' };

/** Renomme Papa, Maman ou un bébé. */
export function renameActor(state: GameState, a: ActorRef, raw: string): RenameResult {
  const r = sanitizeName(raw);
  if (!r.ok) return r;
  const fam = getFamily(state, a.speciesId);
  if (a.kind === 'baby') {
    if (!fam.babies.some((b) => b.id === a.babyId)) return { ok: false, error: 'unknown' };
    // comme à la naissance : frère et sœur ne portent pas le même prénom
    const same = (b: { name: string }) => b.name.toLocaleLowerCase('fr') === r.name.toLocaleLowerCase('fr');
    if (fam.babies.some((b) => b.id !== a.babyId && same(b))) return { ok: false, error: 'same_name' };
    return { ok: true, state: withFamily(state, { ...fam, babies: fam.babies.map((b) => (b.id === a.babyId ? { ...b, name: r.name } : b)) }) };
  }
  const original = getSpecies(a.speciesId)[a.role].name;
  const { [a.role]: _old, ...others } = fam.parentNames ?? {};
  const parentNames = r.name === original ? others : { ...others, [a.role]: r.name };
  const { parentNames: _prev, ...rest } = fam;
  return { ok: true, state: withFamily(state, Object.keys(parentNames).length ? { ...rest, parentNames } : rest) };
}

/** Nom d'origine d'un parent (bouton « remettre le nom du jeu ») ; undefined pour un bébé. */
export function originalName(a: ActorRef): string | undefined {
  return a.kind === 'adult' ? getSpecies(a.speciesId)[a.role].name : undefined;
}
