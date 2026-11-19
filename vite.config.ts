import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { savePlugin } from './tools/save/savePlugin.mjs';

// base './' : le build peut s'ouvrir depuis n'importe quel dossier ou serveur local.
// savePlugin : copie de la partie de la tablette dans saves/ sur l'ordinateur (src/engine/backup.ts).
export default defineConfig({
  base: './',
  plugins: [react(), savePlugin()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // les tests qui parcourent toutes les variantes jouables (≈ 100 000 scènes) prennent plusieurs secondes
    testTimeout: 60000,
  },
});
