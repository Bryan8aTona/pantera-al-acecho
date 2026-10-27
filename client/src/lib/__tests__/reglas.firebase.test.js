import { describe, it, expect, beforeEach } from 'vitest';
import {
  doc,
  collection,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore/lite';
import { db } from '../firebase.js';
import { limpiarEmuladores, entrarComo, salir, frasesValidas } from './emulador.js';

// firestore.rules probadas directamente con el SDK (sin pasar por
// lib/sets.js, que ya comprueba el dueño antes de escribir): así se ve
// que la protección la dan las reglas aunque alguien se salte el cliente.

const DENEGADO = { code: 'permission-denied' };

function setDe(ownerUid, cambios = {}) {
  return { ownerUid, nombre: 'Set', frases: frasesValidas(), ...cambios };
}

beforeEach(limpiarEmuladores);

describe('firestore.rules — propiedad del set', () => {
  it('el dueño puede crear, leer, editar y borrar su set', async () => {
    const ana = await entrarComo('ana');
    const ref = await addDoc(collection(db, 'sets'), setDe(ana));

    expect((await getDoc(ref)).data().nombre).toBe('Set');
    await updateDoc(ref, { nombre: 'Editado' });
    expect((await getDoc(ref)).data().nombre).toBe('Editado');
    await deleteDoc(ref);
    const propios = await getDocs(query(collection(db, 'sets'), where('ownerUid', '==', ana)));
    expect(propios.empty).toBe(true);
  });

  // La regla de lectura usa resource.data, que es null si el documento no
  // existe: Firestore lo niega en vez de devolver "no existe". Por eso
  // sets.js muestra "No tienes permiso…" al abrir un set ya borrado.
  it('leer un set que no existe se niega, aun con sesión', async () => {
    await entrarComo('ana');
    await expect(getDoc(doc(db, 'sets', 'no-existe'))).rejects.toMatchObject(DENEGADO);
  });

  it('otro usuario no puede leer, editar ni borrar el set ajeno', async () => {
    const ana = await entrarComo('ana');
    const ref = await addDoc(collection(db, 'sets'), setDe(ana));

    const beto = await entrarComo('beto');
    await expect(getDoc(ref)).rejects.toMatchObject(DENEGADO);
    await expect(updateDoc(ref, { nombre: 'Robado' })).rejects.toMatchObject(DENEGADO);
    await expect(setDoc(ref, setDe(beto))).rejects.toMatchObject(DENEGADO);
    await expect(deleteDoc(ref)).rejects.toMatchObject(DENEGADO);
  });

  it('sin sesión no se puede leer ni crear', async () => {
    const ana = await entrarComo('ana');
    const ref = await addDoc(collection(db, 'sets'), setDe(ana));

    await salir();
    await expect(getDoc(ref)).rejects.toMatchObject(DENEGADO);
    await expect(addDoc(collection(db, 'sets'), setDe('cualquiera'))).rejects.toMatchObject(DENEGADO);
  });

  it('no se puede crear un set a nombre de otro', async () => {
    await entrarComo('ana');
    await expect(addDoc(collection(db, 'sets'), setDe('uid-de-otro'))).rejects.toMatchObject(DENEGADO);
  });

  it('el dueño no puede regalar su set cambiando ownerUid', async () => {
    const ana = await entrarComo('ana');
    const ref = await addDoc(collection(db, 'sets'), setDe(ana));

    await expect(updateDoc(ref, { ownerUid: 'uid-de-otro' })).rejects.toMatchObject(DENEGADO);
  });

  it('un id elegido a mano (setDoc) no evita la comprobación del dueño', async () => {
    await entrarComo('ana');
    await expect(setDoc(doc(db, 'sets', 'mi-id'), setDe('uid-de-otro'))).rejects.toMatchObject(DENEGADO);
  });
});

describe('firestore.rules — forma del set', () => {
  const frases = frasesValidas;
  const casos = [
    ['nombre vacío', { nombre: '' }],
    ['nombre de 101 caracteres', { nombre: 'x'.repeat(101) }],
    ['nombre que no es texto', { nombre: 42 }],
    ['7 frases', { frases: frases().slice(0, 7) }],
    ['9 frases', { frases: [...frases(), { orden: 9, texto: 'Extra' }] }],
    ['una frase vacía', { frases: frases().map((f, i) => (i === 3 ? { ...f, texto: '' } : f)) }],
    [
      'una frase de 501 caracteres',
      { frases: frases().map((f, i) => (i === 3 ? { ...f, texto: 'x'.repeat(501) } : f)) },
    ],
    ['frases fuera de orden', { frases: frases().reverse() }],
  ];

  it.each(casos)('rechaza crear un set con %s', async (_, cambios) => {
    const ana = await entrarComo('ana');
    await expect(addDoc(collection(db, 'sets'), setDe(ana, cambios))).rejects.toMatchObject(DENEGADO);
  });

  it.each(casos)('rechaza editar un set para dejarlo con %s', async (_, cambios) => {
    const ana = await entrarComo('ana');
    const ref = await addDoc(collection(db, 'sets'), setDe(ana));
    await expect(updateDoc(ref, cambios)).rejects.toMatchObject(DENEGADO);
  });

  it('acepta los límites exactos: nombre de 100 y frases de 500 caracteres', async () => {
    const ana = await entrarComo('ana');
    const limite = setDe(ana, {
      nombre: 'x'.repeat(100),
      frases: frases().map((f) => ({ ...f, texto: 'x'.repeat(500) })),
    });
    const ref = await addDoc(collection(db, 'sets'), limite);
    expect((await getDoc(ref)).exists()).toBe(true);
  });
});
