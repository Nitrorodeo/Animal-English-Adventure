import { COLORS } from '../content/props';
import type { TreasureDef } from '../content/types';
import { Shape } from './PropLayer';

/** Icône d'un trésor : dessinée dans sa couleur quand le trésor en a une, sinon l'émoji. */
export function TreasureIcon({ t }: { t: TreasureDef }) {
  if (!t.art) return <>{t.icon}</>;
  return (
    <span className="treasure-art" aria-hidden="true">
      <Shape shape={t.art.shape} fill={COLORS[t.art.color].hex} />
    </span>
  );
}
