/**
 * Politique de sécurité du jeu construit (balise meta, vite.config.ts) : le jeu ne charge que ses propres
 * fichiers et ne parle qu'à l'adresse qui le sert (copie de la partie et voix du prénom sur l'ordinateur
 * de la maison). Aucun script, style ou média venu d'ailleurs. Testé dans src/engine/access.test.ts.
 */
export const CSP = [
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
].join('; ');
