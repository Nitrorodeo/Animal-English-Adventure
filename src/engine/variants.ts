/**
 * Énumération de TOUTES les variantes jouables (activités × espèces × lieux × familles × niveaux,
 * et aventures × espèces × familles × niveaux). Sert aux tests (chaque variante doit être valide)
 * et au catalogue des voix (chaque phrase possible doit être enregistrée).
 */
import { ACTIVITIES } from '../content/activities';
import { waterPlaces } from '../content/activities/kit';
import { ADVENTURES } from '../content/adventures';
import { archetypeFits, ARCHETYPES } from '../content/archetypes';
import { PLACES } from '../content/places';
import { PROPS } from '../content/props';
import { getSpecies, SPECIES } from '../content/species';
import { TIERS, type ActivityCtx, type ActorKind, type QuestScript, type Sex, type Speaker, type SpeciesDef } from '../content/types';
import { endPlaceOf, finalizeSteps } from './script';
import { dayWeathers, WEATHER_ACTIVITIES } from './weather';

export type VoiceRoleOf = 'father' | 'mother' | 'girl' | 'boy' | 'narrator';

/** Famille dans laquelle on joue : qui est joué, et quels bébés sont nés. */
export interface FamilyConfig {
  actorKind: ActorKind;
  /** voix du personnage joué */
  role: 'father' | 'mother' | 'girl' | 'boy';
  /** sexe des bébés, dans l'ordre de naissance */
  babies: Sex[];
  actorSex?: Sex;
}

const ADULT_BABIES: readonly Sex[][] = [[], ['girl'], ['boy'], ['girl', 'boy'], ['boy', 'girl']];

/** Toutes les familles possibles (au plus deux bébés, un de chaque sexe). */
export const FAMILY_CONFIGS: readonly FamilyConfig[] = [
  ...ADULT_BABIES.map((b): FamilyConfig => ({ actorKind: 'adult', role: 'father', babies: b })),
  ...ADULT_BABIES.map((b): FamilyConfig => ({ actorKind: 'adult', role: 'mother', babies: b })),
  ...(['girl', 'boy'] as const).flatMap((sex): FamilyConfig[] => [
    { actorKind: 'baby', role: sex, babies: [sex], actorSex: sex },
    { actorKind: 'baby', role: sex, babies: ['girl', 'boy'], actorSex: sex },
    { actorKind: 'baby', role: sex, babies: ['boy', 'girl'], actorSex: sex },
  ]),
];

/** Familles qui changent la structure d'un script. Depuis le pilote Afrique (2026-11-19), papa et
 * maman ne proposent plus les mêmes jeux : la mère en fait partie. */
export const STRUCTURAL_CONFIGS: readonly FamilyConfig[] = FAMILY_CONFIGS;

const ARCH_BY_ID = new Map(ARCHETYPES.map((a) => [a.id, a]));

/** Le moteur peut-il proposer cette activité dans ce lieu, à ce personnage, dans cette famille ? (tous stades) */
export function activityOffered(activityId: string, placeId: string, c: FamilyConfig): boolean {
  const arch = ARCH_BY_ID.get(activityId);
  if (!arch) return true;
  if (!arch.implemented) return false;
  if (arch.allowedBiomes.length && !arch.allowedBiomes.includes(placeId)) return false;
  if (arch.minBabies && c.babies.length < arch.minBabies) return false;
  return archetypeFits(arch, c.actorKind, c.actorKind === 'adult' ? (c.role as 'father' | 'mother') : undefined);
}

const otherSex = (s: Sex): Sex => (s === 'girl' ? 'boy' : 'girl');

/** Voix d'un personnage de la scène dans une famille donnée ; null s'il est absent. */
export function voiceOfSpeaker(sp: Speaker, c: FamilyConfig): VoiceRoleOf | null {
  switch (sp) {
    case 'narrator':
    case 'father':
    case 'mother':
      return sp;
    case 'actor':
      return c.role;
    case 'baby':
      return c.actorKind === 'baby' ? (c.actorSex ?? null) : (c.babies[0] ?? null);
    case 'sibling':
      if (c.babies.length < 2) return null;
      return c.actorKind === 'baby' ? (c.actorSex ? otherSex(c.actorSex) : null) : (c.babies[1] ?? null);
    default:
      return null;
  }
}

/** Souvenirs possibles pour une espèce (pour énumérer les « Tu te souviens ? »). */
export function possibleMemories(sp: SpeciesDef): string[] {
  const adv = ADVENTURES.filter((a) => a.continentId === sp.continentId && a.species.includes(sp.id)).map((a) => `adventure:${a.id}`);
  const ate = sp.foods.filter((f) => PROPS[f]?.eat).map((f) => `ate:${f}`);
  const water = sp.allowedBiomes.filter((p) => PLACES[p] && waterPlaces(PLACES[p]!).length).map((p) => `found_water:${p}`);
  return [...adv, ...ate, ...water];
}

export interface Variant {
  script: QuestScript;
  config: FamilyConfig;
  species: SpeciesDef;
}

const cfgId = (c: FamilyConfig) => `${c.role}[${c.babies.join(',')}]`;

/** Toutes les variantes des activités génériques. */
export function* activityVariants(configs: readonly FamilyConfig[] = FAMILY_CONFIGS, species: readonly SpeciesDef[] = SPECIES): Generator<Variant> {
  for (const sp of species) {
    const memories = possibleMemories(sp);
    for (const placeId of sp.allowedBiomes) {
      const place = PLACES[placeId];
      if (!place) continue;
      for (const config of configs) {
        const base: ActivityCtx = { species: sp, place, actorKind: config.actorKind, babies: config.babies, actorSex: config.actorSex, memories, ...(config.actorKind === 'adult' ? { role: config.role as 'father' | 'mother' } : {}) };
        for (const act of ACTIVITIES) {
          if (!activityOffered(act.id, placeId, config)) continue;
          // météo du jour (engine/weather.ts) : les jeux qui en parlent sont déclinés pour chaque météo possible du lieu
          for (const w of WEATHER_ACTIVITIES.has(act.id) ? dayWeathers(place) : [place.weather]) {
            const ctx: ActivityCtx = w === place.weather ? base : { ...base, place: { ...place, weather: w } };
            for (const choice of act.choices(ctx)) {
              for (const tier of TIERS) {
                const raw = act.build(ctx, tier, choice);
                if (!raw) continue;
                const steps = finalizeSteps(raw, { tier, babies: config.babies.length, seed: 1 });
                yield {
                  config,
                  species: sp,
                  script: {
                    id: `${act.id}|${choice}|${sp.id}|${placeId}${w === place.weather ? '' : `~${w}`}|${cfgId(config)}|${tier}`,
                    archetypeId: act.id,
                    speciesId: sp.id,
                    biomeId: placeId,
                    actorKind: config.actorKind,
                    tier,
                    steps,
                    memoryEvent: act.memoryEvent?.(ctx, choice),
                    endPlace: endPlaceOf(placeId, steps),
                  },
                };
              }
            }
          }
        }
      }
    }
  }
}

/** Toutes les variantes des aventures. */
export function* adventureVariants(configs: readonly FamilyConfig[] = FAMILY_CONFIGS): Generator<Variant> {
  for (const adv of ADVENTURES) {
    for (const spId of adv.species) {
      const sp = getSpecies(spId);
      const raw = adv.steps(sp);
      for (const config of configs) {
        for (const tier of TIERS) {
          const steps = finalizeSteps(raw, { tier, babies: config.babies.length, seed: 1 });
          yield {
            config,
            species: sp,
            script: {
              id: `${adv.id}|${sp.id}|${cfgId(config)}|${tier}`,
              archetypeId: 'adventure',
              speciesId: sp.id,
              biomeId: adv.start,
              actorKind: config.actorKind,
              tier,
              steps,
              memoryEvent: `adventure:${adv.id}`,
              endPlace: endPlaceOf(adv.start, steps),
              adventureId: adv.id,
            },
          };
        }
      }
    }
  }
}
