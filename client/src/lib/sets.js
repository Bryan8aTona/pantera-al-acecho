// Acceso a los sets de frases en Firestore.
//
// Modelo: colección `sets`, un documento por set:
//   { ownerUid, nombre, frases: [{ orden, texto }], createdAt, updatedAt }
//
// La propiedad de cada set (ownerUid) la refuerzan las reglas de
// seguridad (firestore.rules); aquí también se comprueba antes de
// devolver o modificar, para dar un mensaje claro.

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore/lite';
import { auth, db } from './firebase.js';
import { normalizarFrases, frasesConId } from './frases.js';

const COL = 'sets';

// Mismo criterio que AuthContext: el docente nunca ve el mensaje crudo
// (en inglés) de Firebase. Los errores propios de este módulo (sin
// `code`) ya vienen redactados y pasan tal cual.
const MENSAJES_ERROR = {
  'permission-denied': 'No tienes permiso para acceder a este set.',
  unauthenticated: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  unavailable: 'No se pudo conectar. Revisa tu conexión a internet.',
  'deadline-exceeded': 'El servidor tardó demasiado en responder. Inténtalo de nuevo.',
  'not-found': 'No se encontró el set.',
};

async function conErroresTraducidos(operacion) {
  try {
    return await operacion();
  } catch (error) {
    if (!error?.code) throw error;
    throw new Error(MENSAJES_ERROR[error.code] || 'No se pudo completar la operación. Inténtalo de nuevo.');
  }
}

function uidActual() {
  const u = auth.currentUser;
  if (!u) throw new Error('No hay una sesión activa.');
  return u.uid;
}

function aFecha(valor) {
  return valor && typeof valor.toDate === 'function' ? valor.toDate() : null;
}

async function leerPropio(id) {
  const ref = doc(db, COL, id);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data().ownerUid !== uidActual()) {
    throw new Error('No se encontró el set.');
  }
  return { ref, snap };
}

// Lista los sets del docente actual, más recientes primero. Se ordena en
// el cliente para no necesitar un índice compuesto en Firestore (un
// docente tiene pocos sets).
export function listarSets() {
  return conErroresTraducidos(async () => {
    const q = query(collection(db, COL), where('ownerUid', '==', uidActual()));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => {
        const data = d.data();
        return { id: d.id, nombre: data.nombre, updatedAt: aFecha(data.updatedAt) };
      })
      .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
  });
}

// Set completo (nombre + las 8 frases, con su `id` sintetizado; ver
// lib/frases.js). Lo usan el formulario de edición y la pantalla de
// Configuración de partida.
export function obtenerSet(id) {
  return conErroresTraducidos(async () => {
    const { snap } = await leerPropio(id);
    const data = snap.data();
    return {
      id: snap.id,
      nombre: data.nombre,
      frases: frasesConId(data.frases),
      updatedAt: aFecha(data.updatedAt),
    };
  });
}

export function crearSet({ nombre, frases }) {
  return conErroresTraducidos(async () => {
    const ref = await addDoc(collection(db, COL), {
      ownerUid: uidActual(),
      nombre: nombre.trim(),
      frases: normalizarFrases(frases),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  });
}

export function actualizarSet(id, { nombre, frases }) {
  return conErroresTraducidos(async () => {
    const { ref } = await leerPropio(id);
    await updateDoc(ref, {
      nombre: nombre.trim(),
      frases: normalizarFrases(frases),
      updatedAt: serverTimestamp(),
    });
  });
}

export function eliminarSet(id) {
  return conErroresTraducidos(async () => {
    const { ref } = await leerPropio(id);
    await deleteDoc(ref);
  });
}
