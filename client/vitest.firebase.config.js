import { defineConfig } from 'vitest/config';

// Pruebas de la capa de datos contra los emuladores de Firebase (Auth +
// Firestore). No corren con `npm test`: necesitan los emuladores
// levantados, así que se lanzan con `npm run test:firebase`, que los
// arranca con `firebase emulators:exec`. `--mode emulador` (en el
// script; Vitest ignora `mode` aquí) carga
// client/.env.emulador (proyecto ficticio demo-pantera).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.firebase.test.js'],
    // Comparten los mismos emuladores y los vacían entre pruebas.
    fileParallelism: false,
    testTimeout: 15000,
  },
});
