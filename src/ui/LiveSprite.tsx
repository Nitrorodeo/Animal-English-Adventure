import { useState } from 'react';
import type { ClipName } from '../game/puppet';
import { rigFor } from '../game/rigs';
import { Puppet } from './Puppet';
import { assetUrl, type AssetInfo } from './scene';

/**
 * Un personnage hors de la scène de jeu (naissance, carte « grandit ») : le dessin, animé par sa
 * marionnette quand elle existe et que WebGL marche ; sinon l'image fixe reste affichée.
 * Donner une `key` qui change avec le dessin (ex. `sprite.path`) pour repartir proprement.
 */
export function LiveSprite({ sprite, clip = 'idle', facing = 1, className, label }: { sprite: AssetInfo; clip?: ClipName; facing?: 1 | -1; className?: string; label?: string }) {
  const rig = rigFor(sprite.path.split('/').pop()?.replace(/\.\w+$/, ''));
  const [ok, setOk] = useState<boolean | null>(null);
  const puppet = !!rig && ok !== false;
  const src = assetUrl(sprite);
  return (
    <span
      className={`live-sprite${className ? ` ${className}` : ''}${puppet && ok ? ' puppeted' : ''}`}
      style={{ aspectRatio: `${sprite.width} / ${sprite.height}` }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <img src={src} alt="" draggable={false} />
      {puppet && <Puppet rig={rig!} src={src} clip={clip} facing={facing} onReady={setOk} />}
    </span>
  );
}
