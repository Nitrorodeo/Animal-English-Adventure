import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base './' : le build peut s'ouvrir depuis n'importe quel dossier ou serveur local.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // les tests qui parcourent toutes les variantes jouables (≈ 100 000 scènes) prennent plusieurs secondes
    testTimeout: 60000,
  },
});
