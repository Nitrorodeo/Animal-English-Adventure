import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { speech } from '../audio/speech';
import type { BiomeDef, Line, ResponseOption } from '../content/types';
import { clampOffset, isDrag, type Box, type Offset } from './drag';
import { background, cropStyle } from './scene';
import { frTypo, type Side } from './bubbleSide';

/** Dernière position choisie par l'enfant : la bulle y revient à chaque nouvelle réplique. */
let saved: Offset = { dx: 0, dy: 0 };

function measure(el: HTMLElement, cur: Offset): { base: Box; bounds: Box } {
  const r = el.getBoundingClientRect();
  const base = { left: r.left - cur.dx, top: r.top - cur.dy, right: r.right - cur.dx, bottom: r.bottom - cur.dy };
  const b = ((el.offsetParent as HTMLElement | null) ?? document.body).getBoundingClientRect();
  return { base, bounds: { left: b.left, top: b.top, right: b.right, bottom: b.bottom } };
}

/** La bulle se déplace en la faisant glisser (doigt ou souris) ; les boutons restent de simples boutons. */
function useDraggable(side: Side) {
  const ref = useRef<HTMLDivElement>(null);
  const [off, setOff] = useState<Offset>(saved);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ id: number; x: number; y: number; start: Offset; base: Box; bounds: Box; moved: boolean } | null>(null);

  // la scène a pu changer de taille depuis le dernier déplacement : on garde la bulle dedans
  useLayoutEffect(() => {
    if (!ref.current || (saved.dx === 0 && saved.dy === 0)) return;
    const m = measure(ref.current, saved);
    setOff(clampOffset(saved, { x: 0, y: 0 }, m.base, m.bounds));
  }, [side]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if ((e.target as HTMLElement).closest('button, input, select, textarea, a')) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, start: off, moved: false, ...measure(el, off) };
    el.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const mv = { x: e.clientX - d.x, y: e.clientY - d.y };
    if (!d.moved && !isDrag(mv)) return;
    if (!d.moved) setDragging(true);
    d.moved = true;
    saved = clampOffset(d.start, mv, d.base, d.bounds);
    setOff(saved);
  };
  const end = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== e.pointerId) return;
    drag.current = null;
    setDragging(false);
  };
  return {
    ref,
    dragging,
    style: off.dx || off.dy ? { transform: `translate(${off.dx}px, ${off.dy}px)` } : undefined,
    handlers: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end },
  };
}

interface Props {
  speaker: string;
  line: Line | undefined;
  frenchHelp: boolean;
  onReplay: (slow?: boolean) => void;
  children?: ReactNode;
  mood?: 'try' | 'ok' | null;
  /** côté du décor où se pose la bulle (à droite quand la cible est sous la bulle à gauche) */
  side?: Side;
  /** revenir à la question d'avant (absent : pas de bouton) */
  onBack?: () => void;
}

/** Bulle de dialogue : texte anglais (lu à voix haute), réécoute, ralenti et aide française facultative. */
export function DialogueBox({ speaker, line, frenchHelp, onReplay, children, mood, side = 'left', onBack }: Props) {
  const [showFr, setShowFr] = useState(false);
  const drag = useDraggable(side);
  return (
    <div ref={drag.ref} className={`dialogue${side === 'right' ? ' at-right' : ''}${mood ? ` mood-${mood}` : ''}${drag.dragging ? ' dragging' : ''}`} style={drag.style} {...drag.handlers}>
      <span className="drag-grip" aria-hidden />
      <div className="dialogue-row">
        <span className="speaker">{speaker}</span>
        <p className="en">{line?.en}</p>
        <div className="dialogue-tools">
          {onBack && <button className="round back-btn" onClick={onBack} aria-label="Revenir à la question d'avant">⏪</button>}
          <button className="round" onClick={() => onReplay(false)} aria-label="Réécouter">🔊</button>
          <button className="round" onClick={() => onReplay(true)} aria-label="Plus lentement">🐢</button>
          {frenchHelp && (
            <button className={`round fr-btn${showFr ? ' on' : ''}`} onClick={() => setShowFr((v) => !v)} aria-label="Aide en français">
              FR
            </button>
          )}
        </div>
      </div>
      {frenchHelp && showFr && line && <p className="fr-line">{frTypo(line.fr)}</p>}
      {children}
    </div>
  );
}

interface OptionsProps {
  options: ResponseOption[];
  biome: BiomeDef;
  reveal: boolean;
  disabled: boolean;
  onChoose: (i: number) => void;
  /** jeu d'écoute : seulement les images, ni texte ni 🔊 (la réponse se devine à l'oreille) */
  listen?: boolean;
  /** cartes déjà jouées (ordres donnés) */
  done?: readonly number[];
}

/** Grandes réponses tactiles : image ou pictogramme + texte anglais, écoutables avant de choisir. */
export function Options({ options, biome, reveal, disabled, onChoose, listen, done }: OptionsProps) {
  const bg = background(biome.background);
  return (
    <div className="options">
      {options.map((o, i) => {
        const anchor = o.anchorCrop ? biome.anchors.find((a) => a.id === o.anchorCrop) : undefined;
        return (
          <div key={i} className={`option${reveal && o.correct ? ' reveal' : ''}${listen ? ' listen-only' : ''}${done?.includes(i) ? ' done' : ''}`}>
            <button className="option-main" disabled={disabled} onClick={() => onChoose(i)}>
              {anchor && bg ? <span className="crop" style={cropStyle(bg, anchor.crop ?? anchor.hit)} /> : anchor ? <span className="opt-icon">{anchor.icon}</span> : o.icon ? <span className="opt-icon">{o.icon}</span> : null}
              {!listen && <span className="opt-text">{o.line.en}</span>}
              {done?.includes(i) && <span className="opt-done">✓</span>}
            </button>
            {!listen && (
              <button className="listen" aria-label="Écouter cette réponse" onClick={() => void speech.speak(o.line.en)}>
                🔊
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
