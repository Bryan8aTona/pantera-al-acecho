import { PREMIOS_DISPONIBLES, FRASES_POR_SET } from './constantes.js';
import { sortearOrden } from './sorteo.js';

// frases: [{ id, texto, orden }] — exactamente 8, tal como las entrega
// lib/sets.js (que sintetiza el `id`; ver modelo-datos.md). `aleatorio`
// es inyectable para que los tests sean determinísticos.
//
// Las frases se barajan en cada partida: el `orden` de una carta (el
// número 1–8 que ve el grupo boca abajo) es su posición en el mazo
// barajado, no la posición de la frase en el set. Así un mismo set no
// reparte siempre la misma frase detrás del mismo número.
export function crearMazo(frases, aleatorio = Math.random) {
  if (!Array.isArray(frases) || frases.length !== FRASES_POR_SET) {
    throw new Error(`El mazo requiere exactamente ${FRASES_POR_SET} frases`);
  }

  const barajadas = sortearOrden(frases, aleatorio);
  const mazo = {};
  barajadas.forEach((frase, i) => {
    const valor = PREMIOS_DISPONIBLES[Math.floor(aleatorio() * PREMIOS_DISPONIBLES.length)];
    mazo[frase.id] = {
      id: frase.id,
      texto: frase.texto,
      orden: i + 1,
      valor,
      jugada: false,
      ganadorId: null,
    };
  });
  return mazo;
}
