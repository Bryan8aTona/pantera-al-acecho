import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        // Separa dependencias grandes y estables en su propio chunk:
        // se descargan en paralelo con el código de la app y quedan en
        // caché del navegador entre despliegues. lottie solo lo pide el
        // chunk diferido del Tablero, así que se descarga junto con él.
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore/lite'],
          react: ['react', 'react-dom', 'react-router-dom'],
          lottie: ['lottie-react'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
    // Las de la capa de datos necesitan los emuladores de Firebase:
    // van aparte, con `npm run test:firebase` (vitest.firebase.config.js).
    exclude: [...configDefaults.exclude, '**/*.firebase.test.js'],
  },
});
