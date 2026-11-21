import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { speech } from '../audio/speech';
import type { VoiceRole } from '../audio/voiceKey';
import { DOLPHINS, seaFriend, SEA_HD, SEA_THINGS, type DolphinId, type SeaGameId, type SeaSprite } from '../content/sea';
import type { Line } from '../content/types';
import { currentRound, seaChoose, seaDone, seaNext, seaReward, startSea, type SeaState, type Utter } from '../engine/sea';
import type { GameState } from '../engine/state';
import { Confetti } from './Confetti';
import { DialogueBox } from './DialogueBox';

interface Props {
  state: GameState;
  setState: (fn: (s: GameState) => GameState) => void;
  game: SeaGameId;
  onClose: () => void;
}

/** grandes images HD des jeux (la carte du monde garde ses petites découpes) */
const sprite = (name: SeaSprite) => `${import.meta.env.BASE_URL}assets/sea/${SEA_HD[name]}.webp`;

/** places des choses à trouver, dans l'eau, hors de la bulle de dialogue (en % de la scène) */
const SPOTS = [
  { x: 60, y: 14 },
  { x: 82, y: 34 },
  { x: 64, y: 58 },
];
/** où se pose la tortue, à côté de chaque place */
const TURTLE_HOME = { x: 8, y: 10 };

const DOLPHIN_POS: Record<DolphinId, CSSProperties> = {
  big: { left: '6%', top: '8%', width: '30%' },
  little: { left: '60%', top: '20%', width: '24%' },
};

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
        <div className="sea-sky" aria-hidden />
        <div className="sea-water" aria-hidden>
          {[0, 1, 2, 3, 4, 5].map((i) => <i key={i} className="bubble" style={{ left: `${8 + i * 16}%`, animationDelay: `${i * 1.3}s` }} />)}
        </div>
        <div className="sea-sand" aria-hidden />

        {game === 'whale' && (
          <>
            <button className="sea-actor whale" style={{ left: '4%', top: '20%', width: '40%' }} onClick={replay} aria-label={friend.nameEn}>
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
              const pos = at ? { x: at.x - 17, y: at.y - 2 } : TURTLE_HOME;
              return (
                // déplacement par transform (composé par la carte graphique, sans recalcul de mise en page) :
                // la scène fait 100cqw de large et 56,25cqw de haut (16/9)
                <button className={`sea-actor turtle${ok ? ' swim' : ''}`} style={{ left: 0, top: 0, width: '22%', transform: `translate(${pos.x}cqw, ${pos.y * 0.5625}cqw)` }} onClick={replay} aria-label={friend.nameEn}>
                  <img src={sprite('turtle')} alt="" draggable={false} />
                </button>
              );
            })()}
          </>
        )}

        {game === 'dolphins' &&
          (['big', 'little'] as DolphinId[]).map((d) => (
            <button
              key={d}
              className={`sea-actor dolphin${ok && target === d ? ` move-${round!.move}` : ''}${sea.reveal && target === d ? ' reveal' : ''}${shake?.startsWith(`${d}-`) ? ' shake' : ''}`}
              style={DOLPHIN_POS[d]}
              onClick={() => (round ? choose(d) : undefined)}
              aria-label={DOLPHINS.name[d].en}
            >
              <img key={ok && target === d ? beat : 0} src={sprite(d === 'big' ? 'dolphin_big' : 'dolphin_little')} alt="" draggable={false} />
              {ok && target === d && round?.move === 'splash' && <span className="splash-drops" aria-hidden>💦</span>}
            </button>
          ))}

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
