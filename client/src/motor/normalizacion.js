// Normalización "al vuelo" para comparar la respuesta del equipo contra
// la frase objetivo (requerimientos.md 3.5, arquitectura.md 3.5).
//
// IMPORTANTE: no usamos un strip genérico de diacríticos Unicode
// (texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) porque eso
// también le quita la virgulilla a la "Ñ" (que se descompone en NFD
// como N + U+0303) y la convertiría en "N". En español la Ñ es una
// letra propia, no una "N con tilde" — deben seguir siendo distintas
// para el teclado virtual y la comparación de letras/frases.
//
// En su lugar, mapeamos explícitamente solo las vocales acentuadas.

const MAPA_ACENTOS = {
  Á: 'A',
  É: 'E',
  Í: 'I',
  Ó: 'O',
  Ú: 'U',
  Ü: 'U',
};

export function normalizarTexto(texto) {
  if (typeof texto !== 'string') return '';
  return texto
    .toUpperCase()
    .split('')
    .map((caracter) => MAPA_ACENTOS[caracter] ?? caracter)
    .join('')
    .trim();
}

// Normaliza una sola letra (toma el primer carácter tras normalizar,
// por si llega con espacios accidentales desde el teclado del docente).
export function normalizarLetra(letra) {
  return normalizarTexto(letra).charAt(0);
}
