import { useLayoutEffect, useRef, useState } from 'react';
import { speech } from '../audio/speech';
import { adventuresOf } from '../content/adventures';
import { speciesOfContinent } from '../content/species';
import { SEA_FRIENDS, type SeaGameId } from '../content/sea';
import { say } from '../content/utterances';
import type { BiomeId, ContinentId, SpeciesDef } from '../content/types';
import { CONTINENTS } from '../content/world';
import type { GameState } from '../engine/state';
import { stickerDef } from '../engine/stickers';
import { assetUrl, background, spriteFor } from './scene';
import { isDrag } from './drag';
import { labelY, mapFit, type MapFit } from './mapFit';

interface Props {
  state: GameState;
  onPick: (species: SpeciesDef, biome: BiomeId) => void;
  /** jeux bonus de la mer (baleine, tortue, dauphins) */
  onSea: (game: SeaGameId) => void;
}

const seaSprite = (name: string) => `${import.meta.env.BASE_URL}assets/sea/${name}.webp`;

/** Carte du monde libre : aucun continent verrouillé, aucun ordre imposé. */
export function WorldMap({ state, onPick, onSea }: Props) {
  const [open, setOpen] = useState<ContinentId | null>(null);
  /** animal marin touché : il bouge, dit bonjour et propose son jeu */
  const [sea, setSea] = useState<{ id: SeaGameId; n: number } | null>(null);
  const friend = SEA_FRIENDS.find((f) => f.id === sea?.id);
  const map = background('world_map');
  const continent = CONTINENTS.find((c) => c.id === open);
  const fr = state.settings.frenchHelp;
  const view = useMapView();

  return (
    <div className="screen map-screen">
      <div className="map-scroll" ref={view.ref} {...view.mouse}>
      <div className="map-stage" style={view.fit ? { width: view.fit.w, height: view.fit.h } : undefined}>
        {map ? <img className="map-img" src={assetUrl(map)} alt="" draggable={false} /> : <div className="map-img map-fallback" />}
        {CONTINENTS.map((c) => (
          <button
            key={c.id}
            className={`continent-hit${open === c.id ? ' active' : ''}`}
            style={{ left: `${c.mapHit.x}%`, top: `${c.mapHit.y}%`, width: `${c.mapHit.w}%`, height: `${c.mapHit.h}%` }}
            aria-label={c.nameEn}
            onClick={() => {
              setOpen(c.id);
              setSea(null);
              void speech.speak(say.continent(c.nameEn));
            }}
          />
        ))}
        {SEA_FRIENDS.flatMap((f) =>
          f.sprites.map((sp) => (
            <button
              key={`${sp.sprite}-${sea?.id === f.id ? sea.n : 0}`}
              className={`sea-friend${sea?.id === f.id ? ' awake' : ''}`}
              style={{ left: `${sp.box.x}%`, top: `${sp.box.y}%`, width: `${sp.box.w}%`, height: `${sp.box.h}%` }}
              aria-label={f.nameEn}
              onClick={() => {
                setOpen(null);
                setSea((cur) => ({ id: f.id, n: (cur?.n ?? 0) + 1 }));
                void speech.speak(f.hello.en, { role: f.voice, slow: state.settings.slowVoice });
              }}
            >
              <img src={seaSprite(sp.sprite)} alt="" draggable={false} />
            </button>
          )),
        )}
        {friend && (
          <div
            className="sea-offer"
            style={{
              left: `${Math.min(...friend.sprites.map((s) => s.box.x)) + (Math.max(...friend.sprites.map((s) => s.box.x + s.box.w)) - Math.min(...friend.sprites.map((s) => s.box.x))) / 2}%`,
              top: `${Math.min(...friend.sprites.map((s) => s.box.y))}%`,
            }}
          >
            <button className="sea-offer-play" onClick={() => onSea(friend.id)} aria-label={`Jouer : ${friend.titleEn}`}>
              <span className="sea-offer-icon">{friend.icon}</span>
              <span className="sea-offer-title">
                {friend.titleEn}
                {fr && <small>{friend.titleFr}</small>}
              </span>
              <span className="sea-offer-go">▶</span>
            </button>
            <button className="sea-offer-close" onClick={() => setSea(null)} aria-label="Fermer">✕</button>
          </div>
        )}
        {state.player.stickers.map((st, i) => {
          const def = stickerDef(st.id);
          if (!def) return null;
          const last = i === state.player.stickers.length - 1;
          return (
            <button
              key={`${i}-${st.id}`}
              className={`map-sticker${last ? ' newest' : ''}`}
              style={{ left: `${st.x}%`, top: `${st.y}%`, rotate: `${((i * 47) % 30) - 15}deg` }}
              aria-label={def.en}
              onClick={(e) => {
                const el = e.currentTarget;
                el.classList.remove('wiggle');
                void el.offsetWidth; // relance l'animation
                el.classList.add('wiggle');
                void speech.speak(say.sticker(def.en));
              }}
            >
              {def.icon}
            </button>
          );
        })}
        {CONTINENTS.map((c) => (
          <span key={`l-${c.id}`} className="continent-label" style={{ left: `${c.label.x}%`, top: `${labelY(c.label.y, view.seen)}%` }}>
            {c.nameEn}
            {state.player.visitedContinents.includes(c.id) && <span className="visited">✓</span>}
            <TreasureCount state={state} continentId={c.id} />
          </span>
        ))}
      </div>
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

/**
 * Carte en plein écran (voir mapFit.ts) : elle remplit toute la zone sous le bandeau et se recentre quand
 * l'écran change de taille. Au doigt, on la fait glisser nativement ; à la souris, on l'attrape et on la tire.
 */
function useMapView() {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<MapFit | null>(null);
  /** partie de la carte visible à l'écran, en % de sa hauteur */
  const [seen, setSeen] = useState({ top: 0, bottom: 100 });
  const grab = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      const f = mapFit(el.clientWidth, el.clientHeight);
      setFit((cur) => (cur && cur.w === f.w && cur.h === f.h ? cur : f));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // recentrée à chaque nouvelle taille : on voit le milieu de la carte, le reste se découvre en la faisant glisser
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !fit) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
    look();
  }, [fit]);
  const frame = useRef(0);
  function look() {
    const el = ref.current;
    if (!el || !el.scrollHeight) return;
    const top = (el.scrollTop / el.scrollHeight) * 100;
    const bottom = ((el.scrollTop + el.clientHeight) / el.scrollHeight) * 100;
    setSeen((cur) => (Math.abs(cur.top - top) < 0.2 && Math.abs(cur.bottom - bottom) < 0.2 ? cur : { top, bottom }));
  }
  const onScroll = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(look);
  };
  const mouse = {
    onScroll,
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      const el = e.currentTarget;
      grab.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop, moved: false };
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      const g = grab.current;
      if (!g) return;
      const dx = e.clientX - g.x;
      const dy = e.clientY - g.y;
      if (!g.moved && !isDrag({ x: dx, y: dy })) return;
      if (!g.moved) {
        g.moved = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        e.currentTarget.classList.add('grabbing');
      }
      e.currentTarget.scrollLeft = g.left - dx;
      e.currentTarget.scrollTop = g.top - dy;
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.classList.remove('grabbing');
      if (!grab.current?.moved) grab.current = null;
    },
    // la carte a été tirée : ce n'était pas un toucher de continent
    onClickCapture: (e: React.MouseEvent) => {
      if (grab.current?.moved) {
        e.stopPropagation();
        e.preventDefault();
      }
      grab.current = null;
    },
  };
  return { ref, fit, seen, mouse };
}
