/**
 * Politique de sécurité du jeu construit (balise meta, vite.config.ts) : le jeu ne charge que ses propres
 * fichiers et ne parle qu'à l'adresse qui le sert (copie de la partie et voix du prénom sur l'ordinateur
 * de la maison) et, en ligne, au service de partie partagée (cloud/worker.mjs). Aucun script, style ou
 * média venu d'ailleurs. Testé dans src/engine/access.test.ts.
 */
const BASE = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
];

export const CSP = BASE.join('; ');

/** Même politique, en autorisant aussi les appels vers le service de partie partagée (origine seule). */
export function cspFor(cloudUrl) {
  let origin = null;
  try {
    origin = cloudUrl ? new URL(cloudUrl).origin : null;
  } catch {
    origin = null;
  }
  if (!origin || !/^https?:\/\/[a-z0-9.-]+(:\d+)?$/i.test(origin)) return CSP;
  return BASE.map((d) => (d === "connect-src 'self'" ? `connect-src 'self' ${origin}` : d)).join('; ');
}
