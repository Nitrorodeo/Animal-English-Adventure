import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { savePlugin } from './tools/save/savePlugin.mjs';
import { namePlugin } from './tools/names/namePlugin.mjs';
import { cspFor } from './tools/pwa/csp.mjs';

// variables de construction (VITE_CLOUD_URL, voir .github/workflows/deploy.yml)
declare const process: { env: Record<string, string | undefined> };

/** Jeu construit (en ligne ou `npm run preview`) : uniquement ses propres fichiers, rien d'extérieur sauf le service de partie partagée. */
const cspPlugin = () => ({
  name: 'aea-csp',
  apply: 'build' as const,
  transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: cspFor(process.env.VITE_CLOUD_URL) }, injectTo: 'head-prepend' as const }],
});

// base './' : le build peut s'ouvrir depuis n'importe quel dossier ou serveur local.
// savePlugin : copie de la partie de la tablette dans saves/ sur l'ordinateur (src/engine/backup.ts).
// namePlugin : phrases dites avec le prénom de la joueuse, enregistrées dans prenoms/ (src/engine/nameVoice.ts).
export default defineConfig({
  base: './',
  plugins: [react(), savePlugin(), namePlugin(), cspPlugin()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // les tests qui parcourent toutes les variantes jouables (≈ 100 000 scènes) prennent plusieurs secondes
    testTimeout: 60000,
  },
});
