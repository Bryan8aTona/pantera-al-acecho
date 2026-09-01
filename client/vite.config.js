import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
        // caché del navegador entre despliegues.
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore/lite'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
  },
});
