/**
 * Dictionnaire de toutes les expressions suivies (passeport, espace parents, catalogue des voix) :
 * expressions de ITEMS, mots des décors (NOUNS), objets (PROPS), couleurs, nombres et capacités.
 */
import { ABILITY_WORDS } from './activities/kit';
import { NOUNS } from './places';
import { COLORS, NUMBERS, PROPS } from './props';
import { ITEMS } from './skills';
import type { Ability, ColorId } from './types';

export interface ItemInfo {
  en: string;
  fr: string;
  icon: string;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const PROP_BY_WORD = new Map<string, (typeof PROPS)[string]>();
for (const p of Object.values(PROPS)) {
  PROP_BY_WORD.set(p.id, p);
  if (!PROP_BY_WORD.has(p.word)) PROP_BY_WORD.set(p.word, p);
  if (!PROP_BY_WORD.has(p.plural)) PROP_BY_WORD.set(p.plural, p);
}

const NUMBER_BY_WORD = new Map(NUMBERS.map((n) => [n.en.toLowerCase(), n]));

/** Texte et icône d'une expression ; undefined si elle est inconnue. */
export function itemInfo(id: string): ItemInfo | undefined {
  const it = ITEMS[id];
  if (it) return it;
  const prop = PROP_BY_WORD.get(id);
  const noun = NOUNS[id];
  if (noun) return { ...noun, icon: prop?.emoji ?? '📍' };
  if (prop) return { ...prop.noun, icon: prop.emoji ?? '✨' };
  if (id in COLORS) {
    const c = COLORS[id as ColorId];
    return { en: cap(c.en), fr: cap(c.fr), icon: c.icon };
  }
  const n = NUMBER_BY_WORD.get(id);
  if (n) return { ...n, icon: '🔢' };
  if (id in ABILITY_WORDS) {
    const a = ABILITY_WORDS[id as Ability];
    return { en: cap(a.en), fr: cap(a.fr), icon: a.icon };
  }
  return undefined;
}

/** Version d'affichage : jamais vide (repli sur l'identifiant). */
export function itemLabel(id: string): ItemInfo {
  return itemInfo(id) ?? { en: id.replace(/_/g, ' '), fr: id.replace(/_/g, ' '), icon: '🔤' };
}
