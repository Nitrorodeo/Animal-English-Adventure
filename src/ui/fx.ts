/**
 * Petits effets de fête (confettis, cœurs) et mise en scène de la naissance : fonctions pures, testées.
 * Les composants (`Confetti.tsx`, `FamilyEvent.tsx`) ne font qu'afficher ce qu'elles décident.
 */

export const CONFETTI_COLORS = ['#e53935', '#fdd835', '#43a047', '#1e88e5', '#f06292', '#8e24aa'] as const;

export interface ConfettiPiece {
  /** position de départ, en % de la largeur */
  left: number;
  /** retard de départ (s) */
  delay: number;
  color: string;
  /** dérive horizontale pendant la chute (cqw, négatif = vers la gauche) */
  drift: number;
}

/** Confettis répartis sur toute la largeur, toujours les mêmes (pas d'aléatoire : rendu stable et testable). */
export function confettiPieces(n: number): ConfettiPiece[] {
  return Array.from({ length: Math.max(0, Math.floor(n)) }, (_, i) => ({
    left: (i * 37 + 7) % 100,
    delay: Math.round(((i % 6) * 0.12 + Math.floor(i / 6) * 0.05) * 100) / 100,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
    drift: ((i * 53) % 9) - 4,
  }));
}

/** Cœurs qui montent : position (%), retard (s) et taille relative. */
export function floatingHearts(n: number): { left: number; delay: number; size: number; icon: string }[] {
  const icons = ['💕', '💗', '💖', '💞'];
  return Array.from({ length: Math.max(0, Math.floor(n)) }, (_, i) => ({
    left: 8 + ((i * 41) % 84),
    delay: Math.round((i * 0.45) % 3.6 * 100) / 100,
    size: 0.8 + ((i * 7) % 5) / 10,
    icon: icons[i % icons.length]!,
  }));
}

export type FamilyPhase = 'intro' | 'surprise' | 'choose' | 'reveal' | 'name' | 'hello' | 'sibling' | 'complete' | 'full';

/** Qui parle à l'écran (et s'anime en « talk ») : la maman à l'intro, le nouveau bébé quand il dit bonjour. */
export function familyTalker(phase: FamilyPhase): 'mother' | 'newBaby' | null {
  if (phase === 'intro') return 'mother';
  if (phase === 'hello' || phase === 'sibling') return 'newBaby';
  return null;
}

/**
 * Ambiance de la scène :
 * love = cœurs qui montent · mystery = le paquet surprise tremble · reveal = éclat de lumière + confettis ·
 * party = confettis + cœurs (fin) · calm = rien de plus.
 */
export function familyMood(phase: FamilyPhase): 'love' | 'mystery' | 'reveal' | 'party' | 'calm' {
  switch (phase) {
    case 'intro':
      return 'love';
    case 'surprise':
    case 'choose':
      return 'mystery';
    case 'reveal':
      return 'reveal';
    case 'complete':
    case 'full':
      return 'party';
    default:
      return 'calm';
  }
}
