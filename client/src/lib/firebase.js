// Inicialización única de Firebase para el cliente.
//
// Las claves NO son secretas: son identificadores públicos que viajan en
// el bundle. La seguridad real la dan Firebase Auth (sesión del docente)
// y las reglas de Firestore (`firestore.rules`), que restringen cada set
// a su dueño. Ver la nota de modelo de amenaza en docs/arquitectura.md.
//
// Los valores se toman de client/.env (ver client/.env.example).

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
// Build "lite": CRUD por petición, sin listeners en tiempo real. El
// docente solo edita sus propios sets; no hace falta sincronización viva
// y así el bundle pesa bastante menos.
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore/lite';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Reutiliza la instancia si ya existe (HMR de Vite / StrictMode).
const app = getApps().length ? getApps()[0] : initializeApp(config);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Modo emulador (client/.env.emulador): Auth y Firestore locales de
// `firebase emulators:start`, con el proyecto ficticio demo-pantera.
// Lo usan las pruebas de la capa de datos y `npm run dev:emulador`.
// El emulador ya conectado no se vuelve a conectar (HMR de Vite).
if (import.meta.env.VITE_USE_EMULATORS === 'true' && !auth.emulatorConfig) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
