import { COLORS, PROPS, SKY_SPOTS } from '../content/props';
import type { PlaceDef, PropPlacement, PropShape } from '../content/types';

/** Formes simples dessinées en SVG (colorées par la couleur demandée). */
function Shape({ shape, fill }: { shape: PropShape; fill: string }) {
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

/** Petits objets posés sur les emplacements du lieu (nourriture, objets à compter, habits…). */
export function PropLayer({ place, props, tapped, reveal, active, counting, onTap }: Props) {
  return (
    <>
      {props.map((p, i) => {
        const def = PROPS[p.prop];
        const spot = (p.sky ? SKY_SPOTS[p.spot] : place.spots[p.spot]) ?? place.spots[0] ?? { x: 50, y: 70 };
        if (!def) return null;
        const fill = p.color ? COLORS[p.color].hex : '#e0e0e0';
        const size = p.size === 'big' ? 9 : p.size === 'small' ? 4.6 : 6.4;
        const done = tapped.includes(p.id);
        const n = tapped.indexOf(p.id);
        return (
          <button
            key={p.id}
            className={`prop${done ? ' tapped' : ''}${reveal?.includes(p.id) ? ' reveal' : ''}`}
            style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${size}cqw`, height: `${size}cqw`, animationDelay: `${i * 0.08}s`, zIndex: 100 + Math.round(spot.y) }}
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
