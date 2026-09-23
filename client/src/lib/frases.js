// Transformaciones puras de las frases de un set, separadas de sets.js
// para poder probarlas sin importar el SDK de Firebase.

// Deja las frases como exactamente [{ orden, texto }] ordenadas por orden.
// Es la forma en que se guardan en Firestore.
export function normalizarFrases(frases) {
  return [...(frases ?? [])]
    .map((f) => ({ orden: Number(f.orden), texto: String(f.texto ?? '').trim() }))
    .sort((a, b) => a.orden - b.orden);
}

// Frases normalizadas + un `id` estable derivado del orden (1–8, único y
// garantizado): el motor de juego indexa el mazo por `frase.id`
// (motor/mazo.js). En Firestore solo se guardan `{ orden, texto }`.
export function frasesConId(frases) {
  return normalizarFrases(frases).map((f) => ({ ...f, id: `f${f.orden}` }));
}
