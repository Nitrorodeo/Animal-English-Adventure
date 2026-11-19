/**
 * Plan de mise en cache hors-ligne (fonctions pures, testées ; utilisées par tools/pwa/build_sw.ts).
 *
 * Après `vite build`, tous les fichiers de dist/ sont répartis en deux listes :
 * - `shell` : ce qu'il faut pour ouvrir le jeu (page, code, styles, icônes) ; téléchargé à l'installation ;
 * - `media` : dessins, décors et voix ; téléchargés ensuite en arrière-plan, dessins d'abord.
 * Chaque fichier porte une révision (empreinte de son contenu) : seul un fichier modifié est retéléchargé.
 */

export interface BuiltFile {
  /** chemin relatif à dist/, avec des « / » */
  path: string;
  /** empreinte courte du contenu */
  rev: string;
}

export interface PrecachePlan {
  /** change dès qu'un fichier du jeu change */
  version: string;
  shell: [path: string, rev: string][];
  media: [path: string, rev: string][];
}

/** Fichiers jamais mis en cache : le service worker lui-même, cartes de débogage. */
export function isSkipped(path: string): boolean {
  return path === 'sw.js' || path.endsWith('.map') || path.startsWith('.');
}

/** Dessins et voix : gros fichiers téléchargés en arrière-plan, après le démarrage. */
export function isMedia(path: string): boolean {
  return path.startsWith('audio/') || path.startsWith('assets/characters/') || path.startsWith('assets/backgrounds/') || path.startsWith('assets/map');
}

/** Ordre de téléchargement des médias : images (petites, visibles tout de suite), puis voix. */
function mediaRank(path: string): number {
  return path.startsWith('audio/') ? 1 : 0;
}

/** Empreinte courte et stable d'une liste de révisions (FNV-1a 32 bits). */
export function digest(parts: readonly string[]): string {
  let h = 0x811c9dc5;
  for (const s of parts) {
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    h ^= 0x0a;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function planPrecache(files: readonly BuiltFile[]): PrecachePlan {
  const kept = files.filter((f) => !isSkipped(f.path)).sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const shell = kept.filter((f) => !isMedia(f.path)).map((f): [string, string] => [f.path, f.rev]);
  const media = kept
    .filter((f) => isMedia(f.path))
    .sort((a, b) => mediaRank(a.path) - mediaRank(b.path))
    .map((f): [string, string] => [f.path, f.rev]);
  const version = digest(kept.map((f) => `${f.path}@${f.rev}`));
  return { version, shell, media };
}

/**
 * Médias à effacer du cache à l'activation d'une nouvelle version : ceux dont la révision a changé
 * ou qui ne font plus partie du jeu.
 */
export function staleMedia(cached: Readonly<Record<string, string>>, plan: PrecachePlan): string[] {
  const now = new Map(plan.media);
  return Object.keys(cached).filter((p) => now.get(p) !== cached[p]);
}

/** Lecture d'un en-tête Range (« bytes=début-fin ») pour servir l'audio depuis le cache (Safari l'exige). */
export function parseRange(header: string | null, size: number): { start: number; end: number } | null {
  const m = header ? /^bytes=(\d*)-(\d*)$/.exec(header.trim()) : null;
  if (!m || (m[1] === '' && m[2] === '')) return null;
  let start: number;
  let end: number;
  if (m[1] === '') {
    // « bytes=-500 » : les 500 derniers octets
    start = Math.max(0, size - Number(m[2]));
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start > end || start >= size) return null;
  return { start, end };
}
