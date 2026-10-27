import { BOLSA_BASE, BOLSA_POR_LETRA, FRASES_POR_SET } from './constantes.ts';
import { letrasUnicasDeTexto } from './letras.ts';
import { sortearOrden } from './sorteo.ts';
import type { Frase, Mazo } from './tipos.ts';

// Bolsa con la que arranca una frase (requerimientos.md 3.3): más letras
// distintas, más difícil de adivinar y más monedas en juego.
export function bolsaInicialDe(texto: string): number {
  return BOLSA_BASE + BOLSA_POR_LETRA * letrasUnicasDeTexto(texto).length;
}

// frases: [{ id, texto, orden }] — exactamente 8, tal como las entrega
// lib/sets.js (que sintetiza el `id`; ver modelo-datos.md). `aleatorio`
// es inyectable para que los tests sean determinísticos.
//
// Las frases se barajan en cada partida: el `orden` de una carta (el
// número 1–8 que ve el grupo boca abajo) es su posición en el mazo
// barajado, no la posición de la frase en el set. Así un mismo set no
// reparte siempre la misma frase detrás del mismo número.
export function crearMazo(frases: Frase[], aleatorio: () => number = Math.random): Mazo {
  if (!Array.isArray(frases) || frases.length !== FRASES_POR_SET) {
    throw new Error(`El mazo requiere exactamente ${FRASES_POR_SET} frases`);
  }

  const barajadas = sortearOrden(frases, aleatorio);
  const mazo: Mazo = {};
  barajadas.forEach((frase, i) => {
    const bolsa = bolsaInicialDe(frase.texto);
    mazo[frase.id] = {
      id: frase.id,
      texto: frase.texto,
      orden: i + 1,
      bolsaInicial: bolsa,
      bolsa,
      jugada: false,
      ganadorId: null,
    };
  });
  return mazo;
}
