/**
 * Mot de la semaine (idée validée le 2026-11-25) : le parent choisit un mot dans l'espace parents ; dans chaque
 * décor qui le montre, il est annoncé à l'arrivée (« Word of the week! A rainbow! Can you find it? ») et l'objet
 * brille jusqu'à ce qu'elle le touche. Seuls les mots des décors sont proposés : ils sont déjà enregistrés, et on
 * peut les trouver dans le jeu. Rien n'oblige à jouer : le mot reste jusqu'à ce que le parent en change.
 */
import { NOUNS, PLACES } from './places';
import type { BiomeDef, Line } from './types';

export interface WeekWordChoice {
  word: string;
  /** groupe nominal dit à voix haute (« A rainbow »), comme quand on touche l'objet */
  noun: Line;
  /** décors où on peut le trouver */
  places: string[];
}

/** Les mots qu'on peut choisir, dans l'ordre alphabétique français (ce que lit le parent). */
export const WEEK_WORD_CHOICES: readonly WeekWordChoice[] = (() => {
  const by = new Map<string, WeekWordChoice>();
  for (const p of Object.values(PLACES)) {
    for (const a of p.anchors) {
      const noun = NOUNS[a.word];
      if (!noun) continue;
      const c = by.get(a.word) ?? { word: a.word, noun, places: [] };
      if (!c.places.includes(p.id)) c.places.push(p.id);
      by.set(a.word, c);
    }
  }
  return [...by.values()].sort((x, y) => x.noun.fr.localeCompare(y.noun.fr, 'fr'));
})();

export const weekWordChoice = (word: string | undefined): WeekWordChoice | undefined => (word ? WEEK_WORD_CHOICES.find((c) => c.word === word) : undefined);

/** Objet du décor qui montre le mot de la semaine (le premier), ou rien. */
export function weekWordAnchor(place: Pick<BiomeDef, 'anchors'>, word: string | undefined): string | undefined {
  return word ? place.anchors.find((a) => a.word === word)?.id : undefined;
}
