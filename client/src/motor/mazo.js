import { PREMIOS_DISPONIBLES } from './constantes.js';

// frases: [{ id, texto, orden }] — exactamente 8, ya validadas por el
// servidor (modelo-datos.md). `aleatorio` es inyectable para que los
// tests sean determinísticos.
export function crearMazo(frases, aleatorio = Math.random) {
  if (!Array.isArray(frases) || frases.length !== 8) {
    throw new Error('El mazo requiere exactamente 8 frases');
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
