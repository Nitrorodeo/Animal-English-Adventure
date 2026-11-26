import type { BiomeDef, Weather } from '../content/types';

/**
 * Temps qu'il fait dans un décor.
 *
 * Historique : le 2026-11-25, une météo du jour tirée au hasard (vent, brume, nuages, neige) ; puis plus de pluie.
 * Le 2026-11-26, Westimmo ne garde que la neige, à allumer ou éteindre quand on veut (voir `weatherOfDay`) :
 * chaque décor garde sa météo dessinée (`place.weather`), et la neige ne tombe que là où elle est PLAUSIBLE
 * (le manchot, la panthère des neiges ; jamais la savane, le désert, ni l'intérieur d'une grotte de glace).
 */

/** décors vus de l'intérieur : la météo du dehors n'y entre pas */
export const INDOOR_PLACES: ReadonlySet<string> = new Set(['an_ice_cave']);

/**
 * Activités dont le texte dépend de la météo du décor : le catalogue des voix les décline pour chaque météo
 * possible du lieu (engine/variants.ts). Un test vérifie qu'aucune autre activité n'en dépend.
 */
export const WEATHER_ACTIVITIES: ReadonlySet<string> = new Set(['weather_check', 'quiz_beginner', 'quiz_intermediate', 'snowflakes']);

/** Météos plausibles d'un décor, la météo dessinée d'abord (sert à savoir où la neige peut tomber). */
export function placeWeathers(place: Pick<BiomeDef, 'id' | 'continentId' | 'weather'>): Weather[] {
  if (INDOOR_PLACES.has(place.id)) return [place.weather];
  switch (place.weather) {
    case 'sunny':
      switch (place.continentId) {
        case 'africa':
          return ['sunny', 'sunny', 'windy', 'cloudy'];
        case 'antarctica':
          return ['sunny', 'windy', 'snowy'];
        case 'south_america':
          return ['sunny', 'sunny', 'misty'];
        case 'oceania':
          return ['sunny', 'sunny', 'windy'];
        default:
          return ['sunny', 'sunny', 'cloudy', 'windy'];
      }
    case 'hot':
      return ['hot', 'hot', 'windy'];
    case 'cold':
      return ['cold', 'snowy', 'windy'];
    case 'windy':
      return ['windy', 'snowy', 'cold'];
    case 'snowy':
      return ['snowy', 'cold'];
    case 'misty':
      return ['misty', 'cloudy'];
    case 'cloudy':
      return ['cloudy', 'sunny'];
    case 'rainy':
      return ['rainy', 'cloudy'];
  }
}

/**
 * Neige à la demande (2026-11-26, Westimmo : « retirer la pluie et le brouillard complètement et qu'on laisse
 * seulement la neige, mais qu'on puisse l'activer ou la désactiver quand on veut ») : plus de météo tirée au jour.
 * Le décor garde son temps dessiné ; quand la neige est allumée (bouton ❄️ du décor, `settings.snow`), il neige
 * là où c'est plausible, et seulement là (jamais dans la savane, le désert ou une grotte).
 */
export const snowPossible = (place: Pick<BiomeDef, 'id' | 'continentId' | 'weather'>): boolean => placeWeathers(place).includes('snowy');

/** Les météos possibles d'un décor : la météo dessinée, et la neige si on peut l'allumer ici (les jeux en parlent). */
export const dayWeathers = (place: Pick<BiomeDef, 'id' | 'continentId' | 'weather'>): Weather[] =>
  [...new Set<Weather>([place.weather, ...(snowPossible(place) ? (['snowy'] as const) : [])])];

/** Le temps qu'il fait dans le décor : la neige si elle est allumée et possible ici, sinon le temps dessiné. */
export function weatherOfDay(place: Pick<BiomeDef, 'id' | 'continentId' | 'weather'>, snow: boolean): Weather {
  return snow && snowPossible(place) ? 'snowy' : place.weather;
}

/** Le décor avec le temps qu'il fait (les jeux du décor parlent du temps qu'on voit). */
export function withDayWeather<T extends BiomeDef>(place: T, snow: boolean): T {
  const w = weatherOfDay(place, snow);
  return w === place.weather ? place : { ...place, weather: w };
}

/**
 * Ce qui se voit à l'écran : seulement des flocons qui tombent (2026-11-26 : plus de brume, de traits de vent ni de
 * voile de nuages, « le brouillard gâche complètement l'image »). Rien pour les autres temps : le dessin les montre.
 */
export type WeatherFx = 'snow';
export function weatherFx(w: Weather): WeatherFx | null {
  return w === 'snowy' ? 'snow' : null;
}
