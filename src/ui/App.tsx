import { useState } from 'react';
import { speech } from '../audio/speech';
import { continentMates, getSpecies, SPECIES } from '../content/species';
import { say } from '../content/utterances';
import type { SeaGameId } from '../content/sea';
import type { BiomeId, PlaceId, SpeciesDef } from '../content/types';
import { getBiome } from '../content/world';
import { DEFAULT_PLAYER_NAME } from '../audio/voiceKey';
import { Friends } from './Friends';
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

type Screen = { kind: 'title' } | { kind: 'name' } | { kind: 'map' } | { kind: 'habitat'; speciesId: string; biomeId: BiomeId } | { kind: 'passport' } | { kind: 'friends' } | { kind: 'parents' } | { kind: 'sea'; game: SeaGameId };

export function App() {
  const { state, setState, loadStatus, restored, reset, nameVoice, cloud, circle } = useGame();
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
        <div className="tb-side">
          <button className="round tb-map" onClick={() => setScreen({ kind: 'map' })} aria-label="Carte du monde">
            <Icon name="map" />
          </button>
          {screen.kind === 'habitat' && (
            <SpeciesHop
              current={screen.speciesId}
              onPick={(s) => {
                if (s.id === screen.speciesId) return;
                void speech.speak(say.speciesPick(s));
                setHere(null);
                setScreen({ kind: 'habitat', speciesId: s.id, biomeId: s.allowedBiomes[0]! });
              }}
            />
          )}
        </div>
        {screen.kind === 'map' && <BarTitle text="World Map" onTap={() => void speech.speak('World map!')} />}
        {screen.kind === 'habitat' && <PlaceTitle placeId={here ?? screen.biomeId} />}
        {screen.kind !== 'map' && screen.kind !== 'habitat' && <span />}
        <div className="tb-side tb-end">
        <button className="round tb-bag" onClick={() => open({ kind: 'passport' })} aria-label="Passeport">
          <Icon name="bag" />
        </button>
        {circle.code && (
          <button className="round tb-friends friends-btn" onClick={() => open({ kind: 'friends' })} aria-label="Mes amis">
            <Icon name="friends" />
            {circle.fresh.length > 0 && <span className="friends-dot" aria-hidden />}
          </button>
        )}
        <button className="round small tb-gear" onClick={() => open({ kind: 'parents' })} aria-label="Espace parents">
          <Icon name="gear" />
        </button>
        </div>
      </nav>
      {screen.kind === 'map' && <WorldMap state={state} onPick={(s, b) => setScreen({ kind: 'habitat', speciesId: s.id, biomeId: b })} onSea={(game) => setScreen({ kind: 'sea', game })} />}
      {screen.kind === 'sea' && <SeaBonus key={screen.game} state={state} setState={setState} game={screen.game} onClose={() => setScreen({ kind: 'map' })} />}
      {screen.kind === 'habitat' && <Habitat key={screen.speciesId} state={state} setState={setState} species={getSpecies(screen.speciesId)} biome={getBiome(screen.biomeId)} onPlace={(b) => setScreen({ kind: 'habitat', speciesId: screen.speciesId, biomeId: b })} onWhere={setHere} />}
      {screen.kind === 'passport' && <Passport state={state} onClose={() => setScreen(back)} />}
      {screen.kind === 'friends' && <Friends circle={circle} fr={state.settings.frenchHelp} onClose={() => setScreen(back)} />}
      {screen.kind === 'parents' && (
        <ParentArea
          state={state}
          setState={setState}
          nameVoice={nameVoice}
          cloud={cloud}
          circle={circle}
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

/** Titre au milieu du bandeau ; touché, il est lu à voix haute. */
function BarTitle({ text, onTap }: { text: string; onTap: () => void }) {
  return (
    <button className="topbar-title" onClick={onTap} aria-label={text}>
      <span className="topbar-orn">✦</span>
      <span className="topbar-text">{text}</span>
      <span className="topbar-orn">✦</span>
    </button>
  );
}

/** Dans un décor, son nom seul, au milieu du bandeau (demande du parent, 2026-11-24 : « mettre proprement le nom du tableau au milieu du bandeau »). */
function PlaceTitle({ placeId }: { placeId: PlaceId }) {
  const place = getBiome(placeId);
  return <BarTitle text={place.nameEn.charAt(0).toUpperCase() + place.nameEn.slice(1)} onTap={() => void speech.speak(say.placeName(place))} />;
}

/**
 * Les autres animaux du continent, en portraits ronds (demande du parent, 2026-11-24 : « quand nous sommes dans un
 * continent, il y ait le logo des autres animaux pour pouvoir passer de l'un à l'autre facilement, sans avoir à
 * ressortir jusqu'à la MAP principale »). L'animal joué est entouré de jaune ; un toucher ouvre l'autre, comme la carte.
 */
export function SpeciesHop({ current, onPick }: { current: string; onPick: (s: SpeciesDef) => void }) {
  const list = continentMates(current);
  if (list.length < 2) return null;
  return (
    <div className="hop" role="group" aria-label="Animals">
      {list.map((s) => {
        const art = spriteFor(s.id, { role: 'father' });
        const here = s.id === current;
        return (
          <button key={s.id} className={`hop-btn${here ? ' here' : ''}`} onClick={() => onPick(s)} aria-label={s.nameEn} aria-current={here ? 'true' : undefined} title={s.nameEn}>
            {art ? <img src={assetUrl(art)} alt="" draggable={false} /> : <span>{s.icon}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Icônes du bandeau, dessinées en traits dorés (nettes à toutes les tailles, pas d'émoji). */
function Icon({ name }: { name: 'map' | 'bag' | 'gear' | 'friends' }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  if (name === 'map')
    return (
      <svg {...common}>
        <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z" />
        <path d="M9 4v13.5M15 6.5V20" />
      </svg>
    );
  if (name === 'friends')
    return (
      <svg {...common}>
        <circle cx="8.5" cy="8" r="3" />
        <circle cx="16.5" cy="9" r="2.5" />
        <path d="M3 19.5a5.5 5.5 0 0 1 11 0M14.5 14.2a4.6 4.6 0 0 1 6.5 4.3" />
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
