import type { Weather } from '../content/types';
import { weatherFx } from '../engine/weather';

/** position pseudo-aléatoire mais fixe de la particule n° i (0 à 1) */
const spread = (i: number, k: number) => ((i * 0.6180339887 + k * 0.137) % 1);

/**
 * Météo du jour dessinée par-dessus le décor (engine/weather.ts) : neige, rafales de vent, brume, nuages.
 * Rien quand il fait beau, chaud, ou froid sans neige (le dessin le montre déjà). `still` : photo de l'album, figée.
 */
export function WeatherLayer({ weather, still = false }: { weather: Weather | null | undefined; still?: boolean }) {
  const fx = weather ? weatherFx(weather) : null;
  if (!fx) return null;
  const n = { snow: still ? 22 : 34, wind: 7, mist: 3, clouds: 3 }[fx];
  const cls = { snow: 'wx-flake', wind: 'wx-gust', mist: 'wx-fog', clouds: 'wx-cloud' }[fx];
  return (
    <div className={`weather-fx fx-${fx}${still ? ' still' : ''}`} aria-hidden>
      {Array.from({ length: n }, (_, i) => {
        const x = spread(i, 1) * 100;
        const y = spread(i, 2);
        const style: Record<string, string> = {
          left: `${fx === 'clouds' ? -8 + spread(i, 3) * 90 : fx === 'wind' || fx === 'mist' ? -10 + spread(i, 3) * 60 : x}%`,
          top: fx === 'wind' ? `${10 + y * 70}%` : fx === 'mist' ? `${35 + i * 18}%` : fx === 'clouds' ? `${-3 + y * 7}%` : '-6%',
          animationDelay: `${-spread(i, 4) * (fx === 'snow' ? 7 : 9)}s`,
          '--y': `${(y * 52).toFixed(1)}cqw`,
        };
        return <span key={i} className={cls} style={style} />;
      })}
    </div>
  );
}
