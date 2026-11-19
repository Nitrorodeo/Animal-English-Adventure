/** Les aventures utilisent la même boîte à outils que les activités, plus quelques scènes types. */
export * from '../activities/kit';
export { numberId, numberOptions } from '../activities/games';
import { numberId, numberOptions } from '../activities/games';
import { cap, clearProps, L, prop, props, tapProps, ask } from '../activities/kit';
import { COLORS, colorFr, NUMBERS, PROPS } from '../props';
import type { AdventureDef, ColorId, QuestStep, Speaker, Tier, TreasureDef } from '../types';

export const treasure = (id: string, nameEn: string, nameFr: string, icon: string): TreasureDef => ({ id, nameEn, nameFr, icon });

/** Aventures d'un continent et leurs trésors, déclarés ensemble. */
export interface AdventurePack {
  adventures: AdventureDef[];
  treasures: TreasureDef[];
}

const ONE_TIER = (t: Tier) => ({ minTier: t, maxTier: t });
const TIER_LIST: readonly Tier[] = ['beginner', 'intermediate', 'expert'];

/**
 * Scène « compter » : n objets (selon le niveau) posés sur les emplacements donnés, on les
 * touche en comptant à voix haute, puis « How many …? ».
 */
export function countScene(speaker: Speaker, propId: string, spots: readonly number[], n: Readonly<Record<Tier, number>>, idPrefix: string): QuestStep[] {
  const p = PROPS[propId];
  if (!p) throw new Error(`Objet inconnu : ${propId}`);
  const out: QuestStep[] = [];
  for (const t of TIER_LIST) {
    const k = n[t];
    if (k > spots.length) throw new Error(`Pas assez d'emplacements pour ${k} ${propId}`);
    const ids = Array.from({ length: k }, (_, i) => `${idPrefix}_${i}`);
    out.push(
      props(ids.map((id, i) => prop(id, p.id, spots[i]!)), ONE_TIER(t)),
      tapProps(speaker, `Let's count the ${p.plural}! Touch them all!`, `Comptons les ${p.pluralFr} ! Touche-les tous !`, ids, L('Touch each one and count!', 'Touche chacun et compte !'), [p.word, 'count'], {
        ...ONE_TIER(t),
        count: true,
        onCorrect: L(`${NUMBERS[k]!.en} ${p.plural}!`, `${NUMBERS[k]!.fr} ${p.pluralFr} !`),
      }),
      ask(speaker, `How many ${p.plural}?`, `Combien de ${p.pluralFr} ?`, numberOptions(k), ['Count again: one, two, three…', 'Recompte : one, two, three…'], [numberId(k), 'how_many'], {
        ...ONE_TIER(t),
        onCorrect: L(`Yes! ${NUMBERS[k]!.en}!`, `Oui ! ${NUMBERS[k]!.fr} !`),
      }),
    );
  }
  out.push(clearProps());
  return out;
}

/**
 * Scène « trouve l'objet de telle couleur » : la bonne couleur et 1, 2 ou 3 autres selon le
 * niveau. `spots` doit contenir au moins 4 emplacements.
 */
export function colorHunt(speaker: Speaker, propId: string, target: ColorId, others: readonly [ColorId, ColorId, ColorId], spots: readonly [number, number, number, number], idPrefix: string): QuestStep[] {
  const p = PROPS[propId];
  if (!p) throw new Error(`Objet inconnu : ${propId}`);
  const col = COLORS[target];
  const out: QuestStep[] = [];
  TIER_LIST.forEach((t, ti) => {
    const placed = [target, ...others.slice(0, ti + 1)].map((c, i) => ({ id: `${idPrefix}_${c}`, color: c, spot: spots[i]! }));
    out.push(
      props(placed.map((x) => prop(x.id, p.id, x.spot, x.color)), ONE_TIER(t)),
      tapProps(speaker, `Find the ${col.en} ${p.word}!`, `Trouve ${p.wordFr} ${colorFr(target, p.fem)} !`, [placed[0]!.id], L(`Look for the ${col.en} one!`, `Cherche ${p.fem ? 'la' : 'le'} ${colorFr(target, p.fem)} !`), [target, p.word], {
        ...ONE_TIER(t),
        onCorrect: L(`Yes! The ${col.en} ${p.word}!`, `Oui ! ${cap(p.wordFr)} ${colorFr(target, p.fem)} !`),
        wrong: Object.fromEntries(placed.slice(1).map((o) => [o.id, L(`No, that one is ${COLORS[o.color].en}!`, `Non, celui-là est ${colorFr(o.color, p.fem)} !`)])),
      }),
    );
  });
  out.push(clearProps());
  return out;
}
