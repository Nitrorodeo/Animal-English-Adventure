/**
 * Cadeau du soir à l'écran (2026-11-24) : les trois paquets à ouvrir, puis l'objet posé dans le décor, qu'on
 * déplace au doigt comme les animaux. Règles et sauvegarde : `engine/gifts.ts` ; accord avec le décor : `giftLook.ts`.
 */
import { useEffect, useRef, useState } from 'react';
import { speech, type VoiceRole } from '../audio/speech';
import { GIFT_OFFER, say } from '../content/utterances';
import type { GiftDef } from '../engine/gifts';
import { acceptsDown, endsTrack, isDrag, type Spot } from './drag';
import type { GiftLook, ScenePixels } from './giftLook';

export const giftUrl = (id: string) => `${import.meta.env.BASE_URL}assets/gifts/${id}.webp`;

/** papiers des trois paquets */
const WRAPS = [
  { paper: '#e8534a', ribbon: '#ffd34d' },
  { paper: '#3d8fd6', ribbon: '#ffffff' },
  { paper: '#5cb85c', ribbon: '#ff8fb8' },
];

/** Les trois paquets : un toucher ouvre le paquet, on entend le mot, puis l'objet part dans le décor. */
export function GiftChoice({ offer, role, slow, frenchHelp, onDone }: { offer: GiftDef[]; role: VoiceRole; slow: boolean; frenchHelp: boolean; onDone: (g: GiftDef) => void }) {
  const [opened, setOpened] = useState<GiftDef | null>(null);
  const done = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => void speech.speak(GIFT_OFFER.en, { role, slow }), 500);
    return () => clearTimeout(t);
  }, [role, slow]);
  const finish = (g: GiftDef) => {
    if (done.current) return;
    done.current = true;
    onDone(g);
  };
  const open = (g: GiftDef) => {
    if (opened) return;
    setOpened(g);
    void speech
      .speak(say.gift(g.en), { slow })
      .then(() => new Promise((r) => setTimeout(r, 900)))
      .then(() => finish(g));
  };
  return (
    <div className="grow-overlay sticker-overlay gift-overlay" onClick={() => opened && finish(opened)}>
      <div className="grow-card sticker-card gift-card">
        {opened ? (
          <>
            <img className="gift-opened" src={giftUrl(opened.id)} alt="" draggable={false} />
            <p className="en">{say.gift(opened.en)}</p>
            {frenchHelp && <p className="fr">{opened.fr.charAt(0).toUpperCase() + opened.fr.slice(1)} ! Tu pourras déplacer ton cadeau du doigt dans la maison.</p>}
          </>
        ) : (
          <>
            <p className="en">🎁 {GIFT_OFFER.en}</p>
            {frenchHelp && <p className="fr">{GIFT_OFFER.fr}</p>}
            <div className="sticker-row">
              {offer.map((g, i) => (
                <button
                  key={g.id}
                  className="gift-box"
                  style={{ animationDelay: `${0.2 + i * 0.15}s`, ['--paper' as string]: WRAPS[i % 3]!.paper, ['--ribbon' as string]: WRAPS[i % 3]!.ribbon }}
                  onClick={(e) => {
                    e.stopPropagation();
                    open(g);
                  }}
                  aria-label={`present ${i + 1}`}
                >
                  <span className="gift-bow">🎀</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Un objet posé dans le décor : base en (x, y), hauteur `spot.h × def.h` (la taille du papa à cet endroit,
 * multipliée par la hauteur logique de l'objet). Petit au fond, grand devant, rangé en profondeur avec les animaux.
 */
export function GiftItem({
  def,
  spot,
  look,
  fresh,
  onDragTo,
  onDragEnd,
  onTap,
}: {
  def: GiftDef;
  spot: Spot;
  look: GiftLook | null;
  fresh: boolean;
  onDragTo?: (pointer: { x: number; y: number }, grabDy: number) => void;
  onDragEnd?: () => void;
  onTap?: () => void;
}) {
  const h = spot.h * def.h;
  const drag = useRef<{ pointerId: number; sx: number; sy: number; grabDy: number; on: boolean; rect: DOMRect } | null>(null);
  const dragged = useRef(false);
  const [dragging, setDragging] = useState(false);
  const pending = useRef<{ x: number; y: number; grabDy: number } | null>(null);
  const raf = useRef(0);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const flush = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = 0;
    const m = pending.current;
    pending.current = null;
    if (m) onDragTo?.({ x: m.x, y: m.y }, m.grabDy);
  };
  const toStage = (e: React.PointerEvent, r: DOMRect) => ({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  const end = (e: React.PointerEvent) => {
    if (!endsTrack(drag.current, e.pointerId)) return; // un autre doigt : ce glisser continue
    if (drag.current?.on) {
      flush();
      setDragging(false);
      onDragEnd?.();
    }
    drag.current = null;
  };
  const src = giftUrl(def.id);
  return (
    <button
      className={`gift${fresh ? ' fresh' : ''}${dragging ? ' dragging' : ''}${onDragTo ? ' movable' : ''}`}
      style={{
        height: `${h}%`,
        transform: `translate(${spot.x}cqw, ${(spot.y * 9) / 16}cqw) translate(-50%, -100%)`,
        zIndex: dragging ? 400 : Math.round(spot.y),
        ['--src' as string]: `url("${src}")`,
        ['--ratio' as string]: String(def.ratio),
      }}
      aria-label={def.en}
      onPointerDown={(e) => {
        if (!acceptsDown(drag.current)) return; // déjà tenu par un autre doigt
        dragged.current = false; // un glisser interrompu (geste du système) n'avale plus ce toucher
        const r = e.currentTarget.parentElement?.getBoundingClientRect();
        if (!onDragTo || !r || !r.height) return;
        drag.current = { pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, grabDy: spot.y - toStage(e, r).y, on: false, rect: r };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || d.pointerId !== e.pointerId) return;
        if (!d.on) {
          if (!isDrag({ x: e.clientX - d.sx, y: e.clientY - d.sy })) return;
          d.on = true;
          dragged.current = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          setDragging(true);
        }
        pending.current = { ...toStage(e, d.rect), grabDy: d.grabDy };
        if (!raf.current) raf.current = requestAnimationFrame(flush);
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        if (dragged.current) {
          dragged.current = false;
          return;
        }
        onTap?.();
      }}
    >
      <span className="gift-shadow" style={look ? { background: `radial-gradient(closest-side, ${look.shadow}, transparent)` } : undefined} />
      <span className="gift-body">
        <img src={src} alt="" draggable={false} />
        {look && <span className="gift-tint" style={{ background: look.tint, opacity: look.tintK }} />}
        {look && look.hazeK > 0 && <span className="gift-haze" style={{ background: look.haze, opacity: look.hazeK }} />}
      </span>
    </button>
  );
}

/** Petite copie du décor en pixels, pour accorder la lumière des objets (null tant qu'elle n'est pas lue). */
export function useScenePixels(src: string | undefined): ScenePixels | null {
  const [px, setPx] = useState<ScenePixels | null>(null);
  useEffect(() => {
    setPx(null);
    if (!src) return;
    let on = true;
    const img = new Image();
    img.onload = () => {
      if (!on) return;
      try {
        const c = document.createElement('canvas');
        c.width = 96;
        c.height = 54;
        const g = c.getContext('2d', { willReadFrequently: true });
        if (!g) return;
        g.drawImage(img, 0, 0, c.width, c.height);
        setPx({ w: c.width, h: c.height, data: g.getImageData(0, 0, c.width, c.height).data });
      } catch {
        // dessin illisible (navigateur trop strict) : objets sans accord de lumière, rien de cassé
      }
    };
    img.src = src;
    return () => {
      on = false;
    };
  }, [src]);
  return px;
}
