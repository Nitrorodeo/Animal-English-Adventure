import { COLORS, PROPS, SKY_SPOTS } from '../content/props';
import type { PlaceDef, PropPlacement, PropShape } from '../content/types';

/** Formes simples dessinées en SVG (colorées par la couleur demandée). */
export function Shape({ shape, fill }: { shape: PropShape; fill: string }) {
  const stroke = '#3b2a1a';
  switch (shape) {
    case 'flower':
      return (
        <svg viewBox="0 0 40 40">
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse key={r} cx="20" cy="10" rx="7" ry="9" fill={fill} stroke={stroke} strokeWidth="1.2" transform={`rotate(${r} 20 20)`} />
          ))}
          <circle cx="20" cy="20" r="5.5" fill="#ffd54f" stroke={stroke} strokeWidth="1.2" />
        </svg>
      );
    case 'pebble':
      return (
        <svg viewBox="0 0 40 40">
          <ellipse cx="20" cy="24" rx="16" ry="11" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <ellipse cx="14" cy="20" rx="5" ry="2.5" fill="#fff6" />
        </svg>
      );
    case 'feather':
      return (
        <svg viewBox="0 0 40 40">
          <path d="M8 34 C 10 18, 22 6, 34 5 C 32 18, 22 30, 8 34 Z" fill={fill} stroke={stroke} strokeWidth="1.3" />
          <path d="M8 34 L 30 9" stroke={stroke} strokeWidth="1.3" fill="none" />
        </svg>
      );
    case 'leaf':
      return (
        <svg viewBox="0 0 40 40">
          <path d="M6 32 C 6 14, 20 6, 35 6 C 35 22, 24 34, 6 32 Z" fill={fill} stroke={stroke} strokeWidth="1.3" />
          <path d="M6 32 C 16 24, 24 16, 33 8" stroke={stroke} strokeWidth="1.2" fill="none" />
        </svg>
      );
    case 'butterfly':
      return (
        <svg viewBox="0 0 40 40">
          <ellipse cx="12" cy="14" rx="9" ry="8" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <ellipse cx="28" cy="14" rx="9" ry="8" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <ellipse cx="13" cy="27" rx="7" ry="6" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <ellipse cx="27" cy="27" rx="7" ry="6" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <rect x="18.5" y="9" width="3" height="24" rx="1.5" fill={stroke} />
        </svg>
      );
    case 'fish':
      return (
        <svg viewBox="0 0 40 40">
          <ellipse cx="18" cy="20" rx="13" ry="9" fill={fill} stroke={stroke} strokeWidth="1.3" />
          <path d="M30 20 L 38 12 L 38 28 Z" fill={fill} stroke={stroke} strokeWidth="1.3" />
          <circle cx="11" cy="18" r="1.8" fill={stroke} />
        </svg>
      );
    case 'maple':
      return (
        <svg viewBox="0 0 40 40">
          {/* liseré clair dessous : la feuille rouge reste visible sur un feuillage d'automne rouge ou orange */}
          <path d="M20 3 L23 10 L27 8 L26 15 L33 12 L31 18 L37 20 L30 24 L32 28 L24 27 L22 33 L18 33 L16 27 L8 28 L10 24 L3 20 L9 18 L7 12 L14 15 L13 8 L17 10 Z M20 38 L20 14" fill="none" stroke={HALO} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M20 3 L23 10 L27 8 L26 15 L33 12 L31 18 L37 20 L30 24 L32 28 L24 27 L22 33 L18 33 L16 27 L8 28 L10 24 L3 20 L9 18 L7 12 L14 15 L13 8 L17 10 Z" fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M20 38 L20 14" stroke={stroke} strokeWidth="1.4" />
        </svg>
      );
    case 'hoof':
      return (
        <svg viewBox="0 0 40 40">
          {/* liseré clair dessous : la trace reste visible sur un pelage ou un sol sombre */}
          <path d="M18 7 C 10 12, 10 28, 17 33 C 19 26, 20 14, 18 7 Z" fill={fill} stroke={HALO} strokeWidth="2.6" paintOrder="stroke" />
          <path d="M22 7 C 30 12, 30 28, 23 33 C 21 26, 20 14, 22 7 Z" fill={fill} stroke={HALO} strokeWidth="2.6" paintOrder="stroke" />
        </svg>
      );
    case 'birdfoot':
      return (
        <svg viewBox="0 0 40 40" fill="none" strokeLinecap="round">
          <path d="M20 35 L20 22 M20 22 L8 9 M20 22 L20 5 M20 22 L32 9" stroke={HALO} strokeWidth="6.2" />
          <path d="M20 35 L20 22 M20 22 L8 9 M20 22 L20 5 M20 22 L32 9" stroke={fill} strokeWidth="3.6" />
        </svg>
      );
    case 'shell':
      return (
        <svg viewBox="0 0 40 40">
          <path d="M5 30 C 5 14, 35 14, 35 30 Z" fill={fill} stroke={stroke} strokeWidth="1.3" />
          {[10, 15, 20, 25, 30].map((x) => (
            <path key={x} d={`M20 30 L ${x} 18`} stroke={stroke} strokeWidth="1" />
          ))}
        </svg>
      );
  }
}

/** Couleur d'une forme quand le jeu n'en demande pas (feuille d'érable rouge, traces brunes). */
const SHAPE_TINT: Partial<Record<PropShape, string>> = { maple: '#d84315', hoof: '#4e342e', birdfoot: '#4e342e' };
/** Liseré des traces (sabots, pattes d'oiseau) et de la feuille d'érable. */
export const HALO = '#fff8e1';

interface Props {
  place: PlaceDef;
  props: PropPlacement[];
  tapped: string[];
  reveal?: string[];
  /** les objets sont à toucher */
  active: boolean;
  /** numéroter les objets touchés (jeu de comptage) */
  counting?: boolean;
  onTap: (id: string) => void;
}

/** Largeur d'un objet, en % de la largeur du décor (cqw). */
export const propSize = (size: PropPlacement['size']) => (size === 'big' ? 9 : size === 'small' ? 4.6 : 6.4);

/**
 * Position d'un objet, en % du décor. Un objet posé au sol est accroché par le bas (il se tient sur
 * son emplacement) ; un objet du ciel (lanterne, étoile, lune, flocon) est accroché par le HAUT,
 * un peu sous le bord, pour ne jamais dépasser du décor ni passer sous le titre du jeu.
 */
export function propPos(p: PropPlacement, place: PlaceDef): { left: number; top: number; anchor: 'bottom' | 'top' } {
  const spot = (p.sky ? SKY_SPOTS[p.spot] : place.spots[p.spot]) ?? place.spots[0] ?? { x: 50, y: 70 };
  return p.sky ? { left: spot.x, top: spot.y + SKY_DROP, anchor: 'top' } : { left: spot.x, top: spot.y, anchor: 'bottom' };
}
/**
 * Perspective des objets posés au sol : plus petits au loin, un peu plus grands tout devant
 * (référence : un objet à 75 % de la hauteur garde sa taille). Jamais moins de 75 % : il reste facile
 * à toucher du doigt.
 */
export const propDepth = (y: number) => Math.max(0.75, Math.min(1.1, 1 - (75 - y) * 0.012));
/** décalage vers le bas des objets du ciel (le titre du jeu occupe le haut du décor jusqu'à ~9 %) */
export const SKY_DROP = 5;

/** Petits objets posés sur les emplacements du lieu (nourriture, objets à compter, habits…). */
export function PropLayer({ place, props, tapped, reveal, active, counting, onTap }: Props) {
  return (
    <>
      {props.map((p, i) => {
        const def = PROPS[p.prop];
        const pos = propPos(p, place);
        if (!def) return null;
        const fill = p.color ? COLORS[p.color].hex : (def.shape && SHAPE_TINT[def.shape]) || '#e0e0e0';
        const size = propSize(p.size) * (pos.anchor === 'top' ? 1 : propDepth(pos.top));
        const done = tapped.includes(p.id);
        const n = tapped.indexOf(p.id);
        return (
          <button
            key={p.id}
            className={`prop${pos.anchor === 'top' ? ' sky' : ''}${done ? ' tapped' : ''}${reveal?.includes(p.id) ? ' reveal' : ''}`}
            style={{ left: `${pos.left}%`, top: `${pos.top}%`, width: `${size}cqw`, height: `${size}cqw`, animationDelay: `${i * 0.08}s`, zIndex: 100 + Math.round(pos.top) }}
            disabled={!active}
            onClick={() => onTap(p.id)}
            aria-label={p.color ? `${COLORS[p.color].en} ${def.word}` : def.word}
          >
            {def.shape && (p.color || !def.emoji) ? <Shape shape={def.shape} fill={fill} /> : <span className="prop-emoji" style={{ fontSize: `${size * 0.85}cqw` }}>{def.emoji ?? '❓'}</span>}
            {done && <span className="prop-count">{counting ? n + 1 : '✓'}</span>}
          </button>
        );
      })}
    </>
  );
}
