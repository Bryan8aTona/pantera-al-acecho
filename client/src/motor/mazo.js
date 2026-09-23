import { PREMIOS_DISPONIBLES, FRASES_POR_SET } from './constantes.js';

// frases: [{ id, texto, orden }] — exactamente 8, tal como las entrega
// lib/sets.js (que sintetiza el `id`; ver modelo-datos.md). `aleatorio`
// es inyectable para que los tests sean determinísticos.
export function crearMazo(frases, aleatorio = Math.random) {
  if (!Array.isArray(frases) || frases.length !== FRASES_POR_SET) {
    throw new Error(`El mazo requiere exactamente ${FRASES_POR_SET} frases`);
  }

  const mazo = {};
  for (const frase of frases) {
    const valor = PREMIOS_DISPONIBLES[Math.floor(aleatorio() * PREMIOS_DISPONIBLES.length)];
    mazo[frase.id] = {
      id: frase.id,
      texto: frase.texto,
      orden: frase.orden,
      valor,
      jugada: false,
      ganadorId: null,
    };
  }
  return mazo;
}
