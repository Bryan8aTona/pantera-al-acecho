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

const COL = 'sets';

function uidActual() {
  const u = auth.currentUser;
  if (!u) throw new Error('No hay una sesión activa.');
  return u.uid;
}

function aFecha(valor) {
  return valor && typeof valor.toDate === 'function' ? valor.toDate() : null;
}

// Deja las frases como exactamente [{ orden, texto }] ordenadas por orden.
function normalizarFrases(frases) {
  return [...(frases ?? [])]
    .map((f) => ({ orden: Number(f.orden), texto: String(f.texto ?? '').trim() }))
    .sort((a, b) => a.orden - b.orden);
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
export async function listarSets() {
  const q = query(collection(db, COL), where('ownerUid', '==', uidActual()));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => {
      const data = d.data();
      return { id: d.id, nombre: data.nombre, updatedAt: aFecha(data.updatedAt) };
    })
    .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
}

// Set completo (nombre + las 8 frases). Lo usan el formulario de edición
// y la pantalla de Configuración de partida.
//
// A cada frase se le añade un `id` estable derivado del orden (1–8, único
// y garantizado): el motor de juego indexa el mazo por `frase.id`
// (motor/mazo.js). En Firestore solo se guardan `{ orden, texto }`.
export async function obtenerSet(id) {
  const { snap } = await leerPropio(id);
  const data = snap.data();
  return {
    id: snap.id,
    nombre: data.nombre,
    frases: normalizarFrases(data.frases).map((f) => ({ ...f, id: `f${f.orden}` })),
    updatedAt: aFecha(data.updatedAt),
  };
}

export async function crearSet({ nombre, frases }) {
  const ref = await addDoc(collection(db, COL), {
    ownerUid: uidActual(),
    nombre: nombre.trim(),
    frases: normalizarFrases(frases),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function actualizarSet(id, { nombre, frases }) {
  const { ref } = await leerPropio(id);
  await updateDoc(ref, {
    nombre: nombre.trim(),
    frases: normalizarFrases(frases),
    updatedAt: serverTimestamp(),
  });
}

export async function eliminarSet(id) {
  const { ref } = await leerPropio(id);
  await deleteDoc(ref);
}
