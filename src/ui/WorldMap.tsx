import { useState } from 'react';
import { speech } from '../audio/speech';
import { adventuresOf } from '../content/adventures';
import { speciesOfContinent } from '../content/species';
import { say } from '../content/utterances';
import type { BiomeId, ContinentId, SpeciesDef } from '../content/types';
import { CONTINENTS } from '../content/world';
import type { GameState } from '../engine/state';
import { assetUrl, background, spriteFor } from './scene';

interface Props {
  state: GameState;
  onPick: (species: SpeciesDef, biome: BiomeId) => void;
}

/** Carte du monde libre : aucun continent verrouillé, aucun ordre imposé. */
export function WorldMap({ state, onPick }: Props) {
  const [open, setOpen] = useState<ContinentId | null>(null);
  const map = background('world_map');
  const continent = CONTINENTS.find((c) => c.id === open);
  const fr = state.settings.frenchHelp;

  return (
    <div className="screen map-screen">
      <div className="map-stage">
        {map ? <img className="map-img" src={assetUrl(map)} alt="" draggable={false} /> : <div className="map-img map-fallback" />}
        {CONTINENTS.map((c) => (
          <button
            key={c.id}
            className={`continent-hit${open === c.id ? ' active' : ''}`}
            style={{ left: `${c.mapHit.x}%`, top: `${c.mapHit.y}%`, width: `${c.mapHit.w}%`, height: `${c.mapHit.h}%` }}
            aria-label={c.nameEn}
            onClick={() => {
              setOpen(c.id);
              void speech.speak(say.continent(c.nameEn));
            }}
          />
        ))}
        {CONTINENTS.map((c) => (
          <span key={`l-${c.id}`} className="continent-label" style={{ left: `${c.label.x}%`, top: `${c.label.y}%` }}>
            {c.nameEn}
            {state.player.visitedContinents.includes(c.id) && <span className="visited"> ✓</span>}
            <TreasureCount state={state} continentId={c.id} />
          </span>
        ))}
      </div>

      {continent && (
        <div className="picker" role="dialog" aria-label={continent.nameEn}>
          <div className="picker-head">
            <button className="round" onClick={() => void speech.speak(say.continentPrompt(continent.nameEn))} aria-label="Écouter">🔊</button>
            <h2>
              {continent.nameEn}
              {fr && <small> · {continent.nameFr}</small>}
            </h2>
            <button className="round" onClick={() => setOpen(null)} aria-label="Fermer">✕</button>
          </div>
          <div className="species-grid">
            {speciesOfContinent(continent.id).map((s) => {
              const sprite = spriteFor(s.id, { role: 'father' });
              return (
                <button
                  key={s.id}
                  className={`species-card${s.playable ? '' : ' soon'}`}
                  disabled={!s.playable}
                  onClick={() => {
                    void speech.speak(say.speciesPick(s));
                    onPick(s, s.allowedBiomes[0]!);
                  }}
                >
                  {sprite ? <img src={assetUrl(sprite)} alt="" /> : <span className="big-icon">{s.icon}</span>}
                  <span className="species-name">{s.nameEn}</span>
                  {fr && <span className="fr">{s.nameFr}</span>}
                  {s.familyReady && <span className="badge">👪</span>}
                  {!s.playable && <span className="soon-tag">Bientôt</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Trésors trouvés sur un continent (rien d'affiché tant qu'aucune aventure n'existe). */
function TreasureCount({ state, continentId }: { state: GameState; continentId: ContinentId }) {
  const ids = new Set(adventuresOf(continentId).map((a) => a.treasure));
  if (!ids.size) return null;
  const got = state.player.treasures.filter((t) => ids.has(t)).length;
  return (
    <span className="treasure-count">
      🎁 {got}/{ids.size}
    </span>
  );
}
