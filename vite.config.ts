import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Ninguna prueba debe llegar a CoinGecko: el servicio o fetch se simulan en cada caso.
    restoreMocks: true,
    unstubGlobals: true,
  },
});
