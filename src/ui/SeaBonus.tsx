import { useEffect, useRef, useState } from 'react';
import { speech } from '../audio/speech';
import type { VoiceRole } from '../audio/voiceKey';
import { DOLPHIN_FAMILY, DOLPHIN_ZONES, DOLPHINS, seaDecor, SEA_DECORS, SEA_DECOR_NAMES, seaFriend, SEA_HD, SEA_THINGS, type DolphinId, type SeaGameId, type SeaSprite } from '../content/sea';
import type { Line } from '../content/types';
import { currentRound, seaChoose, seaDone, seaNext, seaReward, startSea, type SeaState, type Utter } from '../engine/sea';
import type { GameState } from '../engine/state';
import { Confetti } from './Confetti';
import { DialogueBox } from './DialogueBox';
import { isDrag, seaDragPos } from './drag';

interface Props {
  state: GameState;
  setState: (fn: (s: GameState) => GameState) => void;
  game: SeaGameId;
  onClose: () => void;
}

/** grandes images HD des jeux (la carte du monde garde ses petites découpes) */
const sprite = (name: SeaSprite) => `${import.meta.env.BASE_URL}assets/sea/${SEA_HD[name]}.webp`;

/** fonds sous-marins de chaque animal (`SEA_DECORS`) */
const decorUrl = (name: string) => `${import.meta.env.BASE_URL}assets/sea/${name}.webp`;

/** places des choses à trouver, dans l'eau, hors de la bulle de dialogue (en % de la scène) */
const SPOTS = [
  { x: 60, y: 14 },
  { x: 82, y: 34 },
  { x: 64, y: 58 },
];
/** où se pose la tortue, à côté de chaque place */
const TURTLE_HOME = { x: 16, y: 10 };

/** places de départ des animaux (coin haut-gauche, en % de la scène) ; l'enfant les déplace ensuite au doigt */
const START = { whale: { x: 4, y: 20 }, dolphins: { x: 22, y: 6 } };
/** largeur de chaque animal (en % de la scène) */
const WIDTH = { whale: 40, dolphins: 56, turtle: 22 };

type P = { x: number; y: number };

/**
 * Déplacer un animal de la mer au doigt (2026-11-24, « on doit aussi pouvoir les déplacer »). Un appui sans mouvement
 * reste un toucher (consigne redite, ou réponse) ; au-delà du seuil, l'animal suit le doigt, sans sortir de l'eau.
 */
function useSeaDrag(start: P, w: number) {
  const [pos, setPos] = useState<P>(start);
  const [dragging, setDragging] = useState(false);
  const moved = useRef(false);
  /** fin du glisser en cours (écoute retirée) ; on suit le doigt sur toute la fenêtre : un geste vif qui sort
   *  de l'animal avant le premier mouvement n'est plus perdu (essai à la souris du 2026-11-24) */
  const stop = useRef<(() => void) | null>(null);
  useEffect(() => () => stop.current?.(), []);
  const bind = (onTap?: () => void) => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      const rect = e.currentTarget.closest('.sea-stage')?.getBoundingClientRect();
      if (!rect || !rect.width) return;
      stop.current?.();
      const g = { sx: e.clientX, sy: e.clientY, id: e.pointerId, from: pos, on: false };
      moved.current = false;
      const move = (ev: PointerEvent) => {
        if (ev.pointerId !== g.id) return;
        const dx = ev.clientX - g.sx;
        const dy = ev.clientY - g.sy;
        if (!g.on) {
          if (!isDrag({ x: dx, y: dy })) return;
          g.on = true;
          moved.current = true;
          setDragging(true);
        }
        setPos(seaDragPos(g.from, { x: (dx / rect.width) * 100, y: (dy / rect.height) * 100 }, w));
      };
      const end = (ev: PointerEvent) => {
        if (ev.pointerId === g.id) stop.current?.();
      };
      stop.current = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
        if (g.on) setDragging(false);
        stop.current = null;
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    onClick: () => {
      if (moved.current) {
        moved.current = false;
        return;
      }
      onTap?.();
    },
  });
  /** vrai juste après un glisser : le toucher qui le termine ne compte pas comme une réponse */
  const wasDrag = () => moved.current;
  return { pos, dragging, bind, wasDrag };
}

/** nom affiché au-dessus de la réplique, d'après la voix qui parle */
function speakerName(game: SeaGameId, voice: VoiceRole): string {
  if (game === 'dolphins') return voice === 'boy' ? DOLPHINS.name.big.en : voice === 'girl' ? DOLPHINS.name.little.en : '🐬';
  return seaFriend(game).nameEn;
}

/** Jeu bonus de la mer : la baleine, la tortue ou les dauphins (src/engine/sea.ts pour les règles). */
export function SeaBonus({ state, setState, game, onClose }: Props) {
  const friend = seaFriend(game);
  const settings = state.settings;
  const [sea, setSea] = useState<SeaState>(() => startSea(game, Date.now() % 100000).state);
  const [said, setSaid] = useState<Utter | null>(null);
  /** relance les animations (jets d'eau, geste du dauphin, secousse d'une mauvaise carte) */
  const [beat, setBeat] = useState(0);
  const [shake, setShake] = useState<string | null>(null);
  const rewarded = useRef(false);
  /** fond choisi par l'enfant (vignettes en haut) : sinon les deux fonds alternent d'une manche à l'autre */
  const [chosenDecor, setChosenDecor] = useState<string | null>(null);
  const whaleDrag = useSeaDrag(START.whale, WIDTH.whale);
  const turtleDrag = useSeaDrag(TURTLE_HOME, WIDTH.turtle);
  const dolphinDrag = useSeaDrag(START.dolphins, WIDTH.dolphins);

  const talk = (say: Utter[]) => {
    if (!say.length) return;
    setSaid(say[say.length - 1]!);
    void say.reduce<Promise<void>>((p, u) => p.then(() => speech.speak(u.line.en, { role: u.voice, slow: settings.slowVoice })), Promise.resolve());
  };

  // introduction dite à l'ouverture
  useEffect(() => {
    const first = startSea(game, 0).say;
    const t = setTimeout(() => talk(first), 300);
    return () => {
      clearTimeout(t);
      speech.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  const round = currentRound(sea);
  const done = seaDone(sea);
  const ok = sea.feedback === 'ok';

  const next = () => {
    const out = seaNext(sea);
    setSea(out.state);
    setBeat((b) => b + 1);
    setShake(null);
    talk(out.say);
    if (seaDone(out.state) && !rewarded.current) {
      rewarded.current = true;
      setState((s) => ({ ...s, player: seaReward(s.player, out.state) }));
    }
  };

  const choose = (id: string) => {
    const out = seaChoose(sea, id);
    if (out.state === sea) return;
    setSea(out.state);
    if (out.state.feedback === 'ok') setBeat((b) => b + 1);
    else setShake(`${id}-${out.state.wrong}`);
    talk(out.say);
  };

  /** toucher l'animal redit la consigne (et la baleine ressouffle ses jets) */
  const replay = () => {
    if (!round || ok) return;
    setBeat((b) => b + 1);
    talk([{ voice: round.promptVoice, line: round.prompt }]);
  };

  const line: Line | undefined = said?.line;
  const target = round?.answer;

  return (
    <div className="screen sea-screen">
      <div className={`stage sea-stage sea-${game}`}>
        {/* les deux décors de l'animal, l'un sur l'autre : celui de la manche se fond en douceur dans l'autre */}
        {SEA_DECORS[game].map((name) => (
          <img key={name} className={`sea-bg${name === (chosenDecor ?? seaDecor(game, sea.index)) ? ' on' : ''}`} src={decorUrl(name)} alt="" draggable={false} aria-hidden />
        ))}
        <div className="place-strip sea-decors" role="group" aria-label="Backgrounds">
          {SEA_DECORS[game].map((name) => {
            const here = name === (chosenDecor ?? seaDecor(game, sea.index));
            return (
              <button key={name} className={`place-chip${here ? ' here' : ''}`} onClick={() => setChosenDecor(name)} aria-label={SEA_DECOR_NAMES[name]} aria-current={here ? 'true' : undefined}>
                <span className="place-thumb" style={{ backgroundImage: `url("${decorUrl(name)}")` }} />
                <span className="place-name">{SEA_DECOR_NAMES[name]}</span>
              </button>
            );
          })}
        </div>
        <div className="sea-water" aria-hidden>
          {[0, 1, 2, 3, 4, 5].map((i) => <i key={i} className="bubble" style={{ left: `${8 + i * 16}%`, animationDelay: `${i * 1.3}s` }} />)}
        </div>

        {game === 'whale' && (
          <>
            <button
              className={`sea-actor whale movable${whaleDrag.dragging ? ' dragging' : ''}`}
              style={{ left: `${whaleDrag.pos.x}%`, top: `${whaleDrag.pos.y}%`, width: `${WIDTH.whale}%` }}
              {...whaleDrag.bind(replay)}
              aria-label={friend.nameEn}
            >
              <img src={sprite('whale')} alt="" draggable={false} />
            </button>
            {round?.splashes && (
              <div key={beat} className="spouts" aria-hidden>
                {Array.from({ length: round.splashes }, (_, i) => (
                  <span key={i} className="spout" style={{ left: `${12 + i * 17}%`, animationDelay: `${0.4 + i * 0.9}s` }}>💦</span>
                ))}
              </div>
            )}
          </>
        )}

        {game === 'turtle' && (
          <>
            {round?.choices.map((c, i) => {
              const spot = SPOTS[i]!;
              const found = ok && c.id === target;
              return (
                <button
                  key={`${sea.index}-${c.id}`}
                  className={`sea-thing${sea.reveal && c.id === target ? ' reveal' : ''}${found ? ' found' : ''}${shake?.startsWith(`${c.id}-`) ? ' shake' : ''}`}
                  style={{ left: `${spot.x}%`, top: `${spot.y}%`, animationDelay: `${i * 0.4}s` }}
                  onClick={() => choose(c.id)}
                  aria-label={SEA_THINGS.find((t) => t.id === c.id)?.find.en.replace('Find the ', '').replace('!', '')}
                >
                  {c.icon}
                </button>
              );
            })}
            {(() => {
              const at = ok && round ? SPOTS[round.choices.findIndex((c) => c.id === target)]! : null;
              // chez elle : là où l'enfant l'a posée ; une chose trouvée : elle y nage
              const pos = at && !turtleDrag.dragging ? { x: at.x - 17, y: at.y - 2 } : turtleDrag.pos;
              const moving = `${ok ? ' swim' : ''} movable${turtleDrag.dragging ? ' dragging' : ''}`;
              return (
                // déplacement par transform (composé par la carte graphique, sans recalcul de mise en page) :
                // la scène fait 100cqw de large et 56,25cqw de haut (16/9)
                <>
                  <button className={`sea-actor turtle${moving}`} style={{ left: 0, top: 0, width: `${WIDTH.turtle}%`, transform: `translate(${pos.x}cqw, ${pos.y * 0.5625}cqw)` }} {...turtleDrag.bind(replay)} aria-label={friend.nameEn}>
                    <img src={sprite('turtle')} alt="" draggable={false} />
                  </button>
                  {/* la petite tortue suit sa maman, un peu derrière */}
                  <button className={`sea-actor turtle baby${moving}`} style={{ left: 0, top: 0, width: '12%', transform: `translate(${pos.x - 11}cqw, ${pos.y * 0.5625 - 1}cqw)` }} {...turtleDrag.bind(replay)} aria-label="Baby turtle">
                    <img src={sprite('turtle_baby')} alt="" draggable={false} />
                  </button>
                </>
              );
            })()}
          </>
        )}

        {game === 'dolphins' && (
          // la maman et son petit nagent ensemble (une seule image) : on touche l'un ou l'autre, on les déplace ensemble
          <div
            key={shake ?? 'still'}
            className={`sea-actor dolphin movable${dolphinDrag.dragging ? ' dragging' : ''}${ok && round ? ` move-${round.move}` : ''}${shake ? ' shake' : ''}`}
            style={{ left: `${dolphinDrag.pos.x}%`, top: `${dolphinDrag.pos.y}%`, width: `${WIDTH.dolphins}%` }}
            {...dolphinDrag.bind()}
            role="group"
            aria-label="Dolphins"
          >
            <img key={ok ? beat : 0} src={`${import.meta.env.BASE_URL}assets/sea/${DOLPHIN_FAMILY}.webp`} alt="" draggable={false} />
            {(['big', 'little'] as DolphinId[]).map((d) =>
              DOLPHIN_ZONES[d].map((z, i) => (
                <button
                  key={`${d}-${i}`}
                  className={`dolphin-zone${sea.reveal && target === d && i === 0 ? ' reveal' : ''}${ok && target === d && i === 0 ? ' found' : ''}`}
                  style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (dolphinDrag.wasDrag()) return;
                    if (round && !ok) choose(d);
                    else replay();
                  }}
                  aria-label={DOLPHINS.name[d].en}
                >
                  {ok && target === d && i === 0 && round?.move === 'splash' && <span className="splash-drops" aria-hidden>🫧</span>}
                </button>
              )),
            )}
          </div>
        )}

        {done && <Confetti n={26} wide />}

        <DialogueBox
          speaker={said ? speakerName(game, said.voice) : friend.nameEn}
          line={line}
          frenchHelp={settings.frenchHelp}
          mood={sea.feedback}
          onReplay={(slow) => said && void speech.speak(said.line.en, { role: said.voice, slow: slow || settings.slowVoice })}
        >
          {game === 'whale' && round && (
            <div className="options">
              {round.choices.map((c) => (
                <div key={`${sea.index}-${c.id}`} className={`option${sea.reveal && c.id === target ? ' reveal' : ''}${ok && c.id === target ? ' done' : ''}${shake?.startsWith(`${c.id}-`) ? ' shake' : ''}`}>
                  <button className="option-main number-card" disabled={ok} onClick={() => choose(c.id)}>
                    <span className="opt-icon">{c.id}</span>
                    <span>{c.label?.en}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          {!done && (sea.index < 0 || ok) && <button className="big next" onClick={next} aria-label="Continuer">▶</button>}
          {done && (
            <div className="celebrate">
              <span className="stars stars-pop" aria-label="Bravo !">
                {[0, 1, 2].map((i) => <span key={i} style={{ animationDelay: `${0.15 + i * 0.3}s` }}>⭐</span>)}
              </span>
              <button className="big next" onClick={onClose} aria-label="Retour à la carte">✓</button>
            </div>
          )}
          {!done && round && !ok && game !== 'whale' && <p className="hint-tap">👆</p>}
        </DialogueBox>
      </div>
    </div>
  );
}
