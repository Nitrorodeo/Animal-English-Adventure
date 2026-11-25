import type { BiomeDef, Weather } from '../content/types';
import { hashSeed } from './rng';

/**
 * Météo du jour dans un décor (idée validée le 2026-11-25 : « pluie, vent, neige, toujours selon le lieu »).
 *
 * Chaque décor garde sa météo dessinée (`place.weather`) et peut, certains jours, en changer pour une autre météo
 * PLAUSIBLE à cet endroit : de la neige pour le manchot, jamais dans la savane ni dans le désert ; pas de pluie dans
 * le grand froid ; rien ne tombe dans une grotte de glace. Le tirage dépend du jour et du lieu : la même journée
 * donne la même météo (le jeu « What's the weather like? » demande alors la météo qu'on voit à l'écran).
 *
 * Plus jamais de pluie tirée au hasard (2026-11-25, « enlève la pluie automatique du décor, c'est désagréable ») :
 * aucun décor n'est dessiné sous la pluie, donc il ne pleut plus nulle part, et aucune goutte ne tombe à l'écran.
 */

/** décors vus de l'intérieur : la météo du dehors n'y entre pas */
export const INDOOR_PLACES: ReadonlySet<string> = new Set(['an_ice_cave']);

/**
 * Activités dont le texte dépend de la météo du décor : le catalogue des voix les décline pour chaque météo
 * possible du lieu (engine/variants.ts). Un test vérifie qu'aucune autre activité n'en dépend.
 */
export const WEATHER_ACTIVITIES: ReadonlySet<string> = new Set(['weather_check', 'quiz_beginner', 'quiz_intermediate', 'snowflakes']);

/** Météos possibles d'un décor, la météo dessinée d'abord (elle revient deux fois plus souvent quand il fait beau). */
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

/** Les météos différentes possibles d'un décor (sans doublon). */
export const dayWeathers = (place: Pick<BiomeDef, 'id' | 'continentId' | 'weather'>): Weather[] => [...new Set(placeWeathers(place))];

/** Météo d'un décor pour un jour donné (« 2026-11-25 »). */
export function weatherOfDay(place: Pick<BiomeDef, 'id' | 'continentId' | 'weather'>, day: string): Weather {
  const list = placeWeathers(place);
  return list[hashSeed(`${day}:${place.id}`) % list.length]!;
}

/** Le décor avec sa météo du jour (les jeux du décor parlent de la météo qu'on voit). */
export function withDayWeather<T extends BiomeDef>(place: T, day: string): T {
  const w = weatherOfDay(place, day);
  return w === place.weather ? place : { ...place, weather: w };
}

/**
 * Ce qui se voit à l'écran : neige, vent, brume, nuages ; rien quand il fait beau, chaud ou froid sans neige.
 * Pas de pluie qui tombe, même sur une ancienne photo de l'album prise un jour de pluie (demande du 2026-11-25).
 */
export type WeatherFx = 'snow' | 'wind' | 'mist' | 'clouds';
export function weatherFx(w: Weather): WeatherFx | null {
  return ({ snowy: 'snow', windy: 'wind', misty: 'mist', cloudy: 'clouds' } as Partial<Record<Weather, WeatherFx>>)[w] ?? null;
}
