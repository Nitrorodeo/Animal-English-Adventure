import { useState } from 'react';
import type { ClipName } from '../game/puppet';
import { RIGS } from '../game/rigs';
import { Puppet } from './Puppet';
import { assetUrl } from './scene';
import manifest from '../content/assetManifest.json';

/**
 * Atelier des marionnettes (développement seulement, http://localhost:5173/?lab) : chaque personnage
 * animé en grand, pour régler son squelette. N'est pas inclus dans le jeu.
 * Une espèce à la fois (`?lab&sp=bear`, lion par défaut) : chaque personnage ouvre un contexte WebGL
 * et le navigateur n'en garde qu'une quinzaine.
 */
const CLIPS: ClipName[] = ['idle', 'walk', 'hop', 'fly', 'drink', 'talk'];

export function PuppetLab() {
  const [facing, setFacing] = useState<1 | -1>(1);
  const q = new URLSearchParams(location.search);
  const [clipQ, tQ] = [q.get('clip') as ClipName | null, q.get('t')];
  const [clip, setClip] = useState<ClipName>(clipQ && CLIPS.includes(clipQ) ? clipQ : 'walk');
  const frozenAt = tQ !== null ? Number(tQ) : undefined;
  const sp = q.get('sp') ?? 'lion';
  const rigs = Object.values(RIGS).filter((r) => r.sprite.startsWith(`${sp}_`)).slice(0, 12);
  const chars = (manifest as { characters: Record<string, { path: string; width: number; height: number }> }).characters;
  return (
    <div className="puppet-lab">
      <div className="lab-bar">
        {CLIPS.map((c) => (
          <button key={c} className={c === clip ? 'on' : ''} onClick={() => setClip(c)}>{c}</button>
        ))}
        <button onClick={() => setFacing((f) => (f === 1 ? -1 : 1))}>{facing === 1 ? '→' : '←'}</button>
      </div>
      <div className={rigs.length > 2 ? 'lab-row many' : 'lab-row'}>
        {rigs.map((rig) => {
          const info = chars[rig.sprite];
          if (!info) return null;
          return (
            <div key={rig.sprite} className="lab-cell" data-sprite={rig.sprite}>
              <div className="lab-char" style={{ aspectRatio: `${rig.width} / ${rig.height}` }}>
                <Puppet rig={rig} src={assetUrl(info)} clip={clip} facing={facing} onReady={() => {}} frozenAt={frozenAt} />
              </div>
              <span>{rig.sprite}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
