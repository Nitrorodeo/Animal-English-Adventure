import { useDeferredValue, useMemo, useState } from 'react';
import { speech } from '../audio/speech';
import { continentMates, getSpecies, SPECIES } from '../content/species';
import { say } from '../content/utterances';
import type { SeaGameId } from '../content/sea';
import type { BiomeId, PlaceId, SpeciesDef } from '../content/types';
import { getBiome } from '../content/world';
import { familyProgress } from '../engine/quests';
import type { GameState } from '../engine/state';
import { DEFAULT_PLAYER_NAME } from '../audio/voiceKey';
import { Friends } from './Friends';
import { Habitat } from './Habitat';
import { NameSetup } from './NameSetup';
import { ParentArea } from './ParentArea';
import { Passport } from './Passport';
import { PhotoAlbum } from './PhotoAlbum';
import { SeaBonus } from './SeaBonus';
import { assetUrl, background, spriteFor } from './scene';
import { topbarIconUrl, type TopbarIcon } from './topbarIcons';
import { useGame } from './useGame';
import { WorldMap } from './WorldMap';

/** un animal par continent, pour l'écran titre */
const TITLE_ANIMALS = SPECIES.filter((sp, i, all) => all.findIndex((x) => x.continentId === sp.continentId) === i).slice(0, 7);

type Screen = { kind: 'title' } | { kind: 'name' } | { kind: 'map' } | { kind: 'habitat'; speciesId: string; biomeId: BiomeId } | { kind: 'passport' } | { kind: 'album'; speciesId?: string } | { kind: 'friends' } | { kind: 'parents' } | { kind: 'sea'; game: SeaGameId };

export function App() {
  const game = useGame();
  return (
    <>
      {game.saveFailed && (
        <p className="save-warning" role="alert">⚠️ Mémoire du navigateur pleine : la partie n'est plus enregistrée sur cet appareil. On peut continuer à jouer, mais les progrès d'aujourd'hui seront perdus en fermant le jeu.</p>
      )}
      <Screens game={game} />
    </>
  );
}

function Screens({ game }: { game: ReturnType<typeof useGame> }) {
  const { state, setState, loadStatus, restored, reset, nameVoice, cloud, circle } = game;
  const [screen, setScreen] = useState<Screen>({ kind: 'title' });
  const [back, setBack] = useState<Screen>({ kind: 'map' });
  /** lieu à l'écran (peut différer du lieu de la famille pendant une aventure) */
  const [here, setHere] = useState<PlaceId | null>(null);
  /** jeu, cadeau ou fête en cours dans le décor : le bandeau est en pause (sinon tout était perdu sans prévenir) */
  const [busy, setBusy] = useState(false);
  const paused = busy && screen.kind === 'habitat';

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
      <nav className={`topbar${paused ? ' paused' : ''}`}>
        <div className="tb-side" inert={paused}>
          <button className="round tb-map" onClick={() => setScreen({ kind: 'map' })} aria-label="Carte du monde">
            <TopIcon name="map" />
          </button>
          {screen.kind === 'habitat' && (
            <SpeciesHop
              current={screen.speciesId}
              state={state}
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
        <div className="tb-side tb-end" inert={paused}>
        {/* espace perso de la joueuse : son album photo (logo dessiné par le parent, 2026-11-25) */}
        <button className="round tb-album" onClick={() => open({ kind: 'album', speciesId: screen.kind === 'habitat' ? screen.speciesId : undefined })} aria-label="My photos">
          <TopIcon name="album" />
        </button>
        <button className="round tb-bag" onClick={() => open({ kind: 'passport' })} aria-label="Passeport">
          <TopIcon name="bag" />
        </button>
        {circle.code && (
          <button className="round tb-friends friends-btn" onClick={() => open({ kind: 'friends' })} aria-label="Mes amis">
            <TopIcon name="friends" />
            {circle.fresh.length > 0 && <span className="friends-dot" aria-hidden />}
          </button>
        )}
        <button className="round tb-gear" onClick={() => open({ kind: 'parents' })} aria-label="Espace parents">
          <TopIcon name="gear" />
        </button>
        </div>
      </nav>
      {screen.kind === 'map' && <WorldMap state={state} onPick={(s, b) => setScreen({ kind: 'habitat', speciesId: s.id, biomeId: b })} onSea={(game) => setScreen({ kind: 'sea', game })} />}
      {screen.kind === 'sea' && <SeaBonus key={screen.game} state={state} setState={setState} game={screen.game} onClose={() => setScreen({ kind: 'map' })} />}
      {screen.kind === 'habitat' && <Habitat key={screen.speciesId} state={state} setState={setState} species={getSpecies(screen.speciesId)} biome={getBiome(screen.biomeId)} onPlace={(b) => setScreen({ kind: 'habitat', speciesId: screen.speciesId, biomeId: b })} onWhere={setHere} onBusy={setBusy} />}
      {screen.kind === 'passport' && <Passport state={state} onClose={() => setScreen(back)} />}
      {screen.kind === 'album' && <PhotoAlbum state={state} setState={setState} current={screen.speciesId} onClose={() => setScreen(back)} />}
      {screen.kind === 'friends' && <Friends circle={circle} settings={state.settings} onClose={() => setScreen(back)} />}
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
      <span className="topbar-text">{text}</span>
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
/** Rayon de l'anneau de progression, dans un carré de 100 (svg de la taille du bouton, un peu débordant). */
const RING_R = 47;
const RING_LEN = 2 * Math.PI * RING_R;

export function SpeciesHop({ current, state, onPick }: { current: string; state?: GameState; onPick: (s: SpeciesDef) => void }) {
  const list = continentMates(current);
  // anneau vert : jeux réussis avec toute la famille de chaque animal ; calculé après coup (rendu de faible
  // priorité) pour ne pas ralentir la fin d'un jeu
  const calm = useDeferredValue(state);
  const progress = useMemo(() => (calm ? new Map(continentMates(current).map((s) => [s.id, familyProgress(calm, s)])) : null), [calm, current]);
  if (list.length < 2) return null;
  return (
    <div className="hop" role="group" aria-label="Animals">
      {list.map((s) => {
        const art = spriteFor(s.id, { role: 'father' });
        const here = s.id === current;
        const p = progress?.get(s.id);
        const share = p && p.total ? p.done / p.total : 0;
        return (
          <span key={s.id} className={`hop-item${p && p.total && p.done === p.total ? ' all' : ''}`}>
            <button className={`hop-btn${here ? ' here' : ''}`} onClick={() => onPick(s)} aria-label={p ? `${s.nameEn}, ${p.done} / ${p.total} games` : s.nameEn} aria-current={here ? 'true' : undefined} title={s.nameEn}>
              {art ? <img src={assetUrl(art)} alt="" draggable={false} /> : <span>{s.icon}</span>}
            </button>
            {p && p.total > 0 && (
              <svg className="hop-ring" viewBox="0 0 100 100" aria-hidden="true">
                <circle className="hop-ring-track" cx="50" cy="50" r={RING_R} />
                {p.done > 0 && <circle className="hop-ring-done" cx="50" cy="50" r={RING_R} strokeDasharray={`${RING_LEN * share} ${RING_LEN}`} />}
              </svg>
            )}
          </span>
        );
      })}
    </div>
  );
}

/** Logo dessiné de la barre du haut (la pastille ronde est dans l'image). */
function TopIcon({ name }: { name: TopbarIcon }) {
  return <img className="tb-logo" src={topbarIconUrl(name)} alt="" draggable={false} />;
}
