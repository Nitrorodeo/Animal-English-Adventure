import { useState } from 'react';
import { speech } from '../audio/speech';
import { getSpecies } from '../content/species';
import { say } from '../content/utterances';
import type { BiomeId, PlaceId } from '../content/types';
import { getBiome, getContinent } from '../content/world';
import { Habitat } from './Habitat';
import { ParentArea } from './ParentArea';
import { Passport } from './Passport';
import { assetUrl, background } from './scene';
import { useGame } from './useGame';
import { WorldMap } from './WorldMap';

type Screen = { kind: 'title' } | { kind: 'map' } | { kind: 'habitat'; speciesId: string; biomeId: BiomeId } | { kind: 'passport' } | { kind: 'parents' };

export function App() {
  const { state, setState, loadStatus, reset } = useGame();
  const [screen, setScreen] = useState<Screen>({ kind: 'title' });
  const [back, setBack] = useState<Screen>({ kind: 'map' });
  /** lieu à l'écran (peut différer du lieu de la famille pendant une aventure) */
  const [here, setHere] = useState<PlaceId | null>(null);

  const open = (s: Screen) => {
    if (screen.kind === 'map' || screen.kind === 'habitat') setBack(screen);
    setScreen(s);
  };

  if (screen.kind === 'title') {
    const portrait = background('lion_family_portrait');
    return (
      <div className="screen title-screen" style={portrait ? { backgroundImage: `url("${assetUrl(portrait)}")` } : undefined}>
        <div className="title-card">
          <h1>Animal English Adventure</h1>
          <button
            className="big play"
            onClick={() => {
              void speech.speak(say.title(state.player.name));
              setScreen({ kind: 'map' });
            }}
          >
            ▶ Play
          </button>
          {loadStatus === 'corrupt' && <p className="note">La sauvegarde précédente était illisible : une copie a été gardée, nouvelle partie.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="topbar">
        <button className="round" onClick={() => setScreen({ kind: 'map' })} aria-label="Carte du monde">🗺️</button>
        {screen.kind === 'habitat' && <WherePill speciesId={screen.speciesId} placeId={here ?? screen.biomeId} frenchHelp={state.settings.frenchHelp} />}
        <span className="spacer" />
        <button className="round" onClick={() => open({ kind: 'passport' })} aria-label="Passeport">🎒</button>
        <button className="round small" onClick={() => open({ kind: 'parents' })} aria-label="Espace parents">⚙️</button>
      </nav>
      {screen.kind === 'map' && <WorldMap state={state} onPick={(s, b) => setScreen({ kind: 'habitat', speciesId: s.id, biomeId: b })} />}
      {screen.kind === 'habitat' && <Habitat key={screen.speciesId} state={state} setState={setState} species={getSpecies(screen.speciesId)} biome={getBiome(screen.biomeId)} onPlace={(b) => setScreen({ kind: 'habitat', speciesId: screen.speciesId, biomeId: b })} onWhere={setHere} />}
      {screen.kind === 'passport' && <Passport state={state} onClose={() => setScreen(back)} />}
      {screen.kind === 'parents' && (
        <ParentArea
          state={state}
          setState={setState}
          onReset={() => {
            reset();
            setScreen({ kind: 'title' });
          }}
          onClose={() => setScreen(back)}
        />
      )}
    </div>
  );
}

/** Bandeau : vignette du décor, nom du lieu (touché = lu à voix haute), continent et espèce. */
function WherePill({ speciesId, placeId, frenchHelp }: { speciesId: string; placeId: PlaceId; frenchHelp: boolean }) {
  const place = getBiome(placeId);
  const species = getSpecies(speciesId);
  const bg = background(place.background);
  return (
    <button className="where" onClick={() => void speech.speak(say.placeName(place))} aria-label={place.nameEn}>
      <span className="where-thumb" style={bg ? { backgroundImage: `url("${assetUrl(bg)}")` } : { background: place.placeholderGradient }}>
        <span className="where-species">{species.icon}</span>
      </span>
      <span className="where-text">
        <b>{place.nameEn}</b>
        <small>
          {getContinent(place.continentId).nameEn}
          {frenchHelp && <> · {place.nameFr}</>}
        </small>
      </span>
    </button>
  );
}
