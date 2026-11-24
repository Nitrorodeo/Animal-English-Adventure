/**
 * Accord d'un cadeau du soir avec son décor (fonctions pures, testées) : teinte de la lumière ambiante prise sur
 * le dessin autour de l'objet, et léger voile atmosphérique vers la couleur du ciel quand il est au fond.
 * L'ombre au sol, elle, est en « multiply » dans la feuille de style : elle prend la couleur du sol.
 */

export type Rgb = [number, number, number];

/** Petite copie du décor en pixels (RGBA), lue une fois par décor. */
export interface ScenePixels {
  w: number;
  h: number;
  data: ArrayLike<number>;
}

/** Couleur moyenne du décor dans un rectangle donné en % de la scène (borné au dessin). */
export function averageRect(px: ScenePixels, x0: number, y0: number, x1: number, y1: number): Rgb {
  const cx = (v: number) => Math.min(px.w - 1, Math.max(0, Math.floor((v / 100) * px.w)));
  const cy = (v: number) => Math.min(px.h - 1, Math.max(0, Math.floor((v / 100) * px.h)));
  const [ax, bx] = [cx(Math.min(x0, x1)), cx(Math.max(x0, x1))];
  const [ay, by] = [cy(Math.min(y0, y1)), cy(Math.max(y0, y1))];
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = ay; y <= by; y++)
    for (let x = ax; x <= bx; x++) {
      const i = (y * px.w + x) * 4;
      r += px.data[i]!;
      g += px.data[i + 1]!;
      b += px.data[i + 2]!;
      n++;
    }
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

/** Lumière autour d'un objet posé en (x, y), de hauteur h (en % de la scène) : la zone qu'il occupe et un peu autour. */
export function ambientAt(px: ScenePixels, x: number, y: number, h: number): Rgb {
  const r = Math.max(4, h);
  return averageRect(px, x - r * 0.6, y - r * 1.2, x + r * 0.6, y);
}

/** Couleur du sol juste sous l'objet (pour son ombre). */
export function groundAt(px: ScenePixels, x: number, y: number, w: number): Rgb {
  return averageRect(px, x - w / 2, y - 0.5, x + w / 2, y + 2.5);
}

/** Couleur du ciel : le haut du dessin. */
export function skyOf(px: ScenePixels): Rgb {
  return averageRect(px, 0, 0, 100, 12);
}

export function luminance([r, g, b]: Rgb): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export const rgb = ([r, g, b]: Rgb) => `rgb(${r}, ${g}, ${b})`;

export interface GiftLook {
  /** couleur de la lumière ambiante, posée en « multiply » sur l'objet */
  tint: string;
  tintK: number;
  /** couleur du ciel, posée par-dessus l'objet au fond */
  haze: string;
  hazeK: number;
  /** ombre au sol : la couleur du sol, assombrie */
  shadow: string;
}

/**
 * `scale` = taille de l'objet là où il est, rapportée à sa taille au premier plan de la famille (1 = devant,
 * plus petit = plus au fond). Plus le décor est sombre, plus la lumière ambiante teinte l'objet.
 */
export function giftLook(ambient: Rgb, sky: Rgb, scale: number, ground: Rgb = ambient): GiftLook {
  const far = Math.min(1, Math.max(0, 1 - scale));
  const [r, g, b] = ground.map((v) => Math.round(v * 0.3));
  return {
    shadow: `rgba(${r}, ${g}, ${b}, 0.6)`,
    tint: rgb(ambient),
    tintK: Math.round((0.22 + 0.18 * (1 - luminance(ambient))) * 1000) / 1000,
    haze: rgb(sky),
    hazeK: Math.round(far * 0.3 * 1000) / 1000,
  };
}

/** Places de départ des cadeaux (à gauche : la famille se tient à droite du décor), avant mise au sol. */
export function giftStart(i: number, homeY: number): { x: number; y: number } {
  const X = [40, 28, 47, 18, 34, 10, 24, 44];
  const DY = [2, 7, -3];
  return { x: X[i % X.length]!, y: homeY + DY[i % DY.length]! };
}
