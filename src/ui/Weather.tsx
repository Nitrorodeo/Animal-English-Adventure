import { useEffect, useRef } from 'react';
import type { Weather } from '../content/types';
import { weatherFx } from '../engine/weather';

/**
 * Flocons de neige (2026-11-26, Westimmo : « qu'ils tombent des petits flocons… le rendu doit être réellement
 * naturel »). Dessinés sur un canvas, sans images :
 * - trois plans de profondeur : au loin, petits, pâles et lents ; devant, plus gros, plus flous et plus rapides ;
 * - chaque flocon se balance doucement et tourne sur lui-même à son rythme, un vent léger les pousse en même temps ;
 * - un flocon arrivé en bas repart d'en haut : la neige ne s'arrête pas et ne s'accumule pas sur l'image ;
 * - elle apparaît en fondu ; « still » (photo de l'album) et le réglage « animations réduites » : une image figée.
 */

/** Un flocon : position en pixels CSS, profondeur 0 (loin) à 1 (devant), et son balancement propre. */
export interface Flake {
  x: number;
  y: number;
  /** rayon en pixels CSS */
  r: number;
  /** 0 = au loin, 1 = tout près */
  depth: number;
  /** vitesse de chute, en pixels par seconde */
  vy: number;
  /** balancement : amplitude (px), pulsation (rad/s), phase */
  amp: number;
  omega: number;
  phase: number;
  alpha: number;
}

/** générateur pseudo-aléatoire déterministe (mulberry32) : la photo de l'album montre toujours les mêmes flocons */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** nombre de flocons pour un décor de w × h pixels : assez pour qu'il neige vraiment, sans charger une tablette */
export const flakeCount = (w: number, h: number): number => Math.max(24, Math.min(240, Math.round((w * h) / 3800)));

/** Un flocon tiré au hasard dans un décor de w × h ; `anywhere` : n'importe où (départ), sinon juste au-dessus du haut. */
export function makeFlake(w: number, h: number, rnd: () => number, anywhere: boolean): Flake {
  // 65 % au loin, 27 % au milieu, 8 % tout près : c'est ce qui donne la profondeur
  const u = rnd();
  const depth = u < 0.65 ? rnd() * 0.35 : u < 0.92 ? 0.35 + rnd() * 0.35 : 0.7 + rnd() * 0.3;
  const k = w / 1000; // tailles et vitesses à l'échelle du décor
  const r = (1.5 + depth * depth * 4.3 + rnd() * 0.8) * k;
  return {
    x: rnd() * w,
    y: anywhere ? rnd() * h : -r * 3 - rnd() * h * 0.1,
    r,
    depth,
    // un flocon au loin traverse l'écran en ~14 s, un flocon tout près en ~6 s
    vy: (h / (14 - depth * 8)) * (0.85 + rnd() * 0.3),
    amp: (4 + depth * 14 + rnd() * 6) * k,
    omega: 0.5 + rnd() * 0.9,
    phase: rnd() * Math.PI * 2,
    alpha: 0.7 + depth * 0.25 + rnd() * 0.05,
  };
}

/** vent léger qui change lentement (px/s, à l'échelle du décor) */
export const windAt = (t: number, w: number): number => ((Math.sin(t * 0.07) * 9 + Math.sin(t * 0.023 + 1.3) * 5 + 4) * w) / 1000;

/** Fait avancer un flocon de dt secondes au temps t ; le remet en haut quand il sort par le bas. */
export function stepFlake(f: Flake, t: number, dt: number, w: number, h: number, rnd: () => number): Flake {
  const sway = Math.cos(t * f.omega + f.phase) * f.amp * f.omega;
  let x = f.x + (sway + windAt(t, w) * (0.4 + f.depth * 0.8)) * dt;
  const y = f.y + f.vy * dt;
  if (y - f.r * 3 > h) return makeFlake(w, h, rnd, false);
  if (x < -f.r * 4) x += w + f.r * 8;
  else if (x > w + f.r * 4) x -= w + f.r * 8;
  return { ...f, x, y };
}

/** Le dessin d'un flocon : un cœur blanc, un halo doux (plus flou pour les flocons tout près). */
function flakeSprite(soft: boolean): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  if (soft) {
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.7)');
    grad.addColorStop(0.6, 'rgba(200,215,235,0.2)');
    grad.addColorStop(1, 'rgba(200,215,235,0)');
  } else {
    // cœur blanc, puis un bord gris-bleu très léger : le flocon se voit aussi devant la glace ou la neige blanche
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.32, 'rgba(255,255,255,0.97)');
    grad.addColorStop(0.45, 'rgba(236,243,252,0.7)');
    grad.addColorStop(0.62, 'rgba(120,145,180,0.22)');
    grad.addColorStop(1, 'rgba(120,145,180,0)');
  }
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

function Snowfall({ still }: { still: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const host = box.current;
    const cv = canvas.current;
    const ctx = cv?.getContext('2d');
    if (!host || !cv || !ctx) return;
    const frozen = still || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const rnd = seeded(frozen ? 20261126 : (Math.random() * 2 ** 32) >>> 0);
    const sharp = flakeSprite(false);
    const soft = flakeSprite(true);
    let w = 0;
    let h = 0;
    let flakes: Flake[] = [];
    const resize = () => {
      const nw = host.clientWidth;
      const nh = host.clientHeight;
      if (!nw || !nh) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(nw * dpr);
      cv.height = Math.round(nh * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!flakes.length || !w) flakes = Array.from({ length: flakeCount(nw, nh) }, () => makeFlake(nw, nh, rnd, true));
      else {
        // l'écran change de taille : les flocons gardent leur place relative
        const sx = nw / w;
        const sy = nh / h;
        flakes = flakes.map((f) => ({ ...f, x: f.x * sx, y: f.y * sy, r: f.r * sx, vy: f.vy * sy, amp: f.amp * sx }));
        const n = flakeCount(nw, nh);
        while (flakes.length < n) flakes.push(makeFlake(nw, nh, rnd, true));
        flakes.length = n;
      }
      w = nw;
      h = nh;
    };
    const draw = (fade: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        ctx.globalAlpha = f.alpha * fade;
        // le halo fait 3 fois le rayon du cœur ; tout près, le flocon est flou (hors de la mise au point)
        const s = f.r * (f.depth > 0.7 ? 4 : 3);
        // un flocon proche, qui tombe plus vite, s'étire un peu dans le sens de la chute
        const sy = s * (1 + f.depth * 0.18);
        ctx.drawImage(f.depth > 0.7 ? soft : sharp, f.x - s, f.y - sy, s * 2, sy * 2);
      }
      ctx.globalAlpha = 1;
    };
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => (resize(), frozen && draw(1))) : null;
    ro?.observe(host);
    if (frozen) {
      draw(1);
      return () => ro?.disconnect();
    }
    let raf = 0;
    let last = performance.now();
    const start = last;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - start) / 1000;
      flakes = flakes.map((f) => stepFlake(f, t, dt, w, h, rnd));
      draw(Math.min(1, t / 1.5));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, [still]);
  return (
    <div ref={box} className={`weather-fx fx-snow${still ? ' still' : ''}`} aria-hidden>
      <canvas ref={canvas} />
    </div>
  );
}

/**
 * Le temps dessiné par-dessus le décor : seulement la neige qui tombe (engine/weather.ts). Rien pour les autres
 * temps : le dessin les montre déjà. `still` : photo de l'album, figée.
 */
export function WeatherLayer({ weather, still = false }: { weather: Weather | null | undefined; still?: boolean }) {
  return weather && weatherFx(weather) === 'snow' ? <Snowfall still={still} /> : null;
}
