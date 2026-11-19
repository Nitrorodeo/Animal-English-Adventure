import type { CSSProperties } from 'react';
import { confettiPieces } from './fx';

/** Pluie de confettis (décor seulement). `wide` : sur toute la scène au lieu d'autour d'une carte. */
export function Confetti({ n = 18, wide = false }: { n?: number; wide?: boolean }) {
  return (
    <div className={`confetti${wide ? ' wide' : ''}`} aria-hidden>
      {confettiPieces(n).map((p, i) => (
        <i key={i} style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, background: p.color, '--drift': `${p.drift}cqw` } as CSSProperties} />
      ))}
    </div>
  );
}
