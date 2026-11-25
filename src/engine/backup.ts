/**
 * Copie de la partie sur l'ordinateur qui fait tourner le jeu (serveur de `npm run dev` ou `npm run preview`).
 *
 * Pourquoi : la sauvegarde du navigateur (localStorage) est liée à l'adresse exacte du jeu. Si la
 * tablette ouvre le jeu à une autre adresse (l'adresse du PC change sur la box, nouveau favori…),
 * elle ne retrouve plus la partie. Le PC en garde donc une copie, rendue automatiquement à un
 * appareil qui n'a encore rien. Sans serveur (fichier ouvert ailleurs), tout cela échoue en silence.
 *
 * Ce fichier ne contient que les décisions (testées). Réseau : `src/ui/useGame.ts` ;
 * côté PC : `tools/save/savePlugin.mjs` (fichiers dans `saves/`).
 */
import { fromOldEra, migrate } from './save';
import type { GameState } from './state';

/** Adresse de la copie, relative au jeu (marche aussi dans un sous-dossier). */
export const BACKUP_PATH = 'api/save';
/** Taille maximale acceptée par le PC pour une sauvegarde (bien au-delà d'une vraie partie). */
export const BACKUP_MAX_BYTES = 2_000_000;
/** Délai avant l'envoi : on groupe les petits changements successifs. */
export const BACKUP_DELAY_MS = 1500;

/** Une partie qui mérite d'être copiée : un vrai début de jeu, pas un écran titre jamais quitté. */
export function hasProgress(s: GameState): boolean {
  return (
    s.onboarded ||
    s.player.activityCounter > 0 ||
    s.player.visitedContinents.length > 0 ||
    s.player.name !== 'Explorer' ||
    Object.values(s.families).some((f) => f.babies.length > 0)
  );
}

/** Lit une copie reçue du PC ; `null` si elle est absente, illisible, d'une version future ou vide. */
export function parseBackup(text: string | null | undefined): GameState | null {
  if (!text) return null;
  try {
    const state = migrate(JSON.parse(text));
    // une copie d'avant la remise à zéro générale n'est ni reprise ni acceptée par le PC
    return state && !fromOldEra(state) && hasProgress(state) ? state : null;
  } catch {
    return null;
  }
}

/**
 * Au démarrage : faut-il reprendre la copie du PC ? Seulement si cet appareil n'a pas de partie
 * (nouvelle ou illisible) et que l'enfant n'a pas déjà commencé à jouer entre-temps.
 */
export function shouldRestore(localStatus: 'new' | 'loaded' | 'migrated' | 'corrupt', alreadyPlaying: boolean, backup: GameState | null): backup is GameState {
  return (localStatus === 'new' || localStatus === 'corrupt') && !alreadyPlaying && backup !== null;
}

/** Côté PC : le contenu reçu est-il une sauvegarde acceptable ? */
export function acceptableBackup(body: string): boolean {
  return body.length > 0 && body.length <= BACKUP_MAX_BYTES && parseBackup(body) !== null;
}

/** Côté PC : nom de la copie du jour (une par jour, gardée en historique) ou de la partie effacée. */
export function historyFileName(now: Date, kind: 'day' | 'erased'): string {
  const p = (n: number) => String(n).padStart(2, '0');
  const day = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
  return kind === 'day' ? `save-${day}.json` : `save-effacee-${day}_${p(now.getHours())}h${p(now.getMinutes())}m${p(now.getSeconds())}s.json`;
}
