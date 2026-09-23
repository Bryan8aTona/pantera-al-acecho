import { useCallback, useEffect, useRef, useState } from 'react';
import { FASES } from '../motor/constantes.js';

// Detecta el instante en que la partida pasa de la Ronda 1 a la Ronda
// de Repechaje para mostrar, una sola vez, un panel que lo anuncie con
// claridad (antes solo cambiaba una etiqueta en el encabezado y pasaba
// desapercibido).
//
// Mismo patrón seguro bajo React.StrictMode que useVidaPerdida /
// useSecuenciasDramaticas: la comparación contra el valor anterior vive
// en una ref mutada DENTRO de un useEffect, nunca durante el render.
export function useAnuncioRepechaje(estado) {
  const faseActual = estado.fase;
  const prevRef = useRef(faseActual);
  const [mostrarAnuncioRepechaje, setMostrar] = useState(false);

  useEffect(() => {
    const anterior = prevRef.current;
    if (faseActual !== anterior) {
      if (anterior === FASES.RONDA1 && faseActual === FASES.REPECHAJE) {
        setMostrar(true);
      }
      prevRef.current = faseActual;
    }
  }, [faseActual]);

  const completarAnuncioRepechaje = useCallback(() => setMostrar(false), []);

  return { mostrarAnuncioRepechaje, completarAnuncioRepechaje };
}
