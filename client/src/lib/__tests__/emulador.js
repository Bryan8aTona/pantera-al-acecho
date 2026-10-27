// Ayudas para las pruebas *.firebase.test.js (emuladores de Auth y
// Firestore, proyecto ficticio demo-pantera; ver vitest.firebase.config.js).
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase.js';

const PROYECTO = 'demo-pantera';

// Seguro: estas pruebas crean cuentas y escriben documentos. Si por
// cualquier motivo no se cargó client/.env.emulador (p. ej. Vitest sin
// `--mode emulador`), firebase.js apuntaría al proyecto real con el .env
// de producción. En ese caso se aborta antes de la primera petición.
if (
  import.meta.env.VITE_USE_EMULATORS !== 'true' ||
  import.meta.env.VITE_FIREBASE_PROJECT_ID !== PROYECTO ||
  !auth.emulatorConfig
) {
  throw new Error(
    `Las pruebas de Firebase solo corren contra los emuladores (proyecto ${PROYECTO}). ` +
      `Se cargó el proyecto "${import.meta.env.VITE_FIREBASE_PROJECT_ID}": usa \`npm run test:firebase\`.`,
  );
}
const CONTRASENA = 'secreta123';

// Cuentas creadas desde la última limpieza.
const creadas = new Set();

async function borrarEnEmulador(url, opciones) {
  let respuesta;
  try {
    respuesta = await fetch(url, { method: 'DELETE', ...opciones });
  } catch {
    throw new Error('No encontré los emuladores. Levántalos con `npm run emuladores` en otra terminal.');
  }
  if (!respuesta.ok) throw new Error(`El emulador rechazó la limpieza (${respuesta.status}): ${url}`);
}

// Deja los emuladores vacíos: sin sesión, sin cuentas y sin documentos.
export async function limpiarEmuladores() {
  await signOut(auth);
  creadas.clear();
  // El emulador de Auth solo acepta este borrado con el token "owner".
  await borrarEnEmulador(`http://127.0.0.1:9099/emulator/v1/projects/${PROYECTO}/accounts`, {
    headers: { Authorization: 'Bearer owner' },
  });
  await borrarEnEmulador(`http://127.0.0.1:8080/emulator/v1/projects/${PROYECTO}/databases/(default)/documents`);
}

// Inicia sesión como `nombre` (creando la cuenta la primera vez) y
// devuelve su uid.
export async function entrarComo(nombre) {
  const email = `${nombre}@prueba.mx`;
  await signOut(auth);
  if (creadas.has(email)) {
    await signInWithEmailAndPassword(auth, email, CONTRASENA);
  } else {
    await createUserWithEmailAndPassword(auth, email, CONTRASENA);
    creadas.add(email);
  }
  return auth.currentUser.uid;
}

export function salir() {
  return signOut(auth);
}

// Las 8 frases que exige un set, en el formato en que se guardan.
export function frasesValidas() {
  return Array.from({ length: 8 }, (_, i) => ({ orden: i + 1, texto: `Frase ${i + 1}` }));
}
