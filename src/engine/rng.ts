/** Générateur pseudo-aléatoire déterministe (mulberry32) : sélections reproductibles en test. */
export interface Rng {
  next(): number;
  pick<T>(items: readonly T[]): T;
  /** copie mélangée (Fisher-Yates) */
  shuffle<T>(items: readonly T[]): T[];
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new Error('pick() sur une liste vide');
      return items[Math.floor(next() * items.length)] as T;
    },
    shuffle<T>(items: readonly T[]): T[] {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j] as T, out[i] as T];
      }
      return out;
    },
  };
}

/** Graine stable tirée d'un texte (ordre des réponses d'un script donné). */
export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
