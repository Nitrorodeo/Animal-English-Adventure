import { useState } from 'react';
import { speech } from '../audio/speech';
import { getSpecies, SPECIES } from '../content/species';
import { say } from '../content/utterances';
import type { SeaGameId } from '../content/sea';
import type { BiomeId, PlaceId } from '../content/types';
import { getBiome, getContinent } from '../content/world';
import { DEFAULT_PLAYER_NAME } from '../audio/voiceKey';
import { Habitat } from './Habitat';
import { NameSetup } from './NameSetup';
import { ParentArea } from './ParentArea';
import { Passport } from './Passport';
import { SeaBonus } from './SeaBonus';
import { assetUrl, background, spriteFor } from './scene';
import { useGame } from './useGame';
import { WorldMap } from './WorldMap';

/** un animal par continent, pour l'écran titre */
const TITLE_ANIMALS = SPECIES.filter((sp, i, all) => all.findIndex((x) => x.continentId === sp.continentId) === i).slice(0, 7);

type Screen = { kind: 'title' } | { kind: 'name' } | { kind: 'map' } | { kind: 'habitat'; speciesId: string; biomeId: BiomeId } | { kind: 'passport' } | { kind: 'parents' } | { kind: 'sea'; game: SeaGameId };

export function App() {
  const { state, setState, loadStatus, restored, reset, nameVoice, cloud } = useGame();
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
          <div className="title-row">
            <div className="title-animals" aria-hidden>
              {TITLE_ANIMALS.map((sp, i) => {
                // le vrai personnage (le père de la famille) en miniature ; pictogramme seulement s'il manque
                const art = spriteFor(sp.id, { role: 'father' });
                return (<span key={sp.id} style={{ animationDelay: `${i * 0.25}s` }}>{art ? <img src={assetUrl(art)} alt="" draggable={false} /> : sp.icon}</span>);
              })}
            </div>
            <button
              className="big play"
              onClick={() => {
                // premier lancement : l'enfant donne d'abord son prénom
                if (state.player.name === DEFAULT_PLAYER_NAME) return setScreen({ kind: 'name' });
                void speech.speak(say.title(state.player.name));
                setScreen({ kind: 'map' });
              }}
            >
              ▶ Play
            </button>
          </div>
          {restored && <p className="title-note">✓ Partie retrouvée sur l'ordinateur.</p>}
          {loadStatus === 'corrupt' && !restored && <p className="note">La sauvegarde précédente était illisible : une copie a été gardée, nouvelle partie.</p>}
        </div>
      </div>
    );
  }

  if (screen.kind === 'name') {
    const portrait = background('lion_family_portrait');
    return (
      <div className="screen title-screen name-screen" style={portrait ? { backgroundImage: `url("${assetUrl(portrait)}")` } : undefined}>
        <div className="title-card">
          <NameSetup
            initialName={state.player.name}
            initialPron={state.player.namePron}
            speechSpeed={state.settings.speechSpeed}
            onDone={(name, pron) => {
              setState((s) => ({ ...s, player: { ...s.player, name, namePron: pron } }));
              void speech.speak(say.title(name));
              setScreen({ kind: 'map' });
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="topbar">
        <button className="round" onClick={() => setScreen({ kind: 'map' })} aria-label="Carte du monde">
          <Icon name="map" />
        </button>
        {screen.kind === 'habitat' && <WherePill speciesId={screen.speciesId} placeId={here ?? screen.biomeId} frenchHelp={state.settings.frenchHelp} />}
        <span className="spacer" />
        {screen.kind === 'map' && (
          <button className="topbar-title" onClick={() => void speech.speak('World map!')} aria-label="World map">
            <span className="topbar-orn">✦</span>
            World Map
            <span className="topbar-orn">✦</span>
          </button>
        )}
        <span className="spacer" />
        <button className="round" onClick={() => open({ kind: 'passport' })} aria-label="Passeport">
          <Icon name="bag" />
        </button>
        <button className="round small" onClick={() => open({ kind: 'parents' })} aria-label="Espace parents">
          <Icon name="gear" />
        </button>
      </nav>
      {screen.kind === 'map' && <WorldMap state={state} onPick={(s, b) => setScreen({ kind: 'habitat', speciesId: s.id, biomeId: b })} onSea={(game) => setScreen({ kind: 'sea', game })} />}
      {screen.kind === 'sea' && <SeaBonus key={screen.game} state={state} setState={setState} game={screen.game} onClose={() => setScreen({ kind: 'map' })} />}
      {screen.kind === 'habitat' && <Habitat key={screen.speciesId} state={state} setState={setState} species={getSpecies(screen.speciesId)} biome={getBiome(screen.biomeId)} onPlace={(b) => setScreen({ kind: 'habitat', speciesId: screen.speciesId, biomeId: b })} onWhere={setHere} />}
      {screen.kind === 'passport' && <Passport state={state} onClose={() => setScreen(back)} />}
      {screen.kind === 'parents' && (
        <ParentArea
          state={state}
          setState={setState}
          nameVoice={nameVoice}
          cloud={cloud}
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

/** Icônes du bandeau, dessinées en traits dorés (nettes à toutes les tailles, pas d'émoji). */
function Icon({ name }: { name: 'map' | 'bag' | 'gear' }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  if (name === 'map')
    return (
      <svg {...common}>
        <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z" />
        <path d="M9 4v13.5M15 6.5V20" />
      </svg>
    );
  if (name === 'bag')
    return (
      <svg {...common}>
        <path d="M6 9a6 6 0 0 1 12 0v9.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 18.5z" />
        <path d="M9 9V6.5a3 3 0 0 1 6 0V9M8.5 14h7v4h-7z" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
      <circle cx="12" cy="12" r="6.6" />
    </svg>
  );
}
