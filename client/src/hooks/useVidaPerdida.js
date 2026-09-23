import { useCallback, useEffect, useRef, useState } from 'react';
import { equipoDelTurnoNormal } from '../motor/index.js';

// Detecta el instante en que la pantera del equipo en turno avanza de
// estado (se perdió una vida, estados 1-4, o se llegó a la derrota,
// estado 5) para disparar la secuencia de impacto (vibración + destello
// rojo + video a pantalla completa) antes de que el juego continúe.
//
// Ver la nota larga en useSecuenciasDramaticas.js: la comparación
// contra el valor anterior vive en una ref mutada DENTRO de un
// useEffect, no durante el render — ese es el patrón seguro bajo
// React.StrictMode.
export function useVidaPerdida(estado) {
  const panteraActual = equipoDelTurnoNormal(estado)?.panteraEstado ?? 0;

  const prevRef = useRef(panteraActual);
  const [estadoAnunciando, setEstadoAnunciando] = useState(null);

  useEffect(() => {
    const anterior = prevRef.current;
    if (panteraActual !== anterior) {
      if (panteraActual > anterior) {
        setEstadoAnunciando(panteraActual);
      }
      prevRef.current = panteraActual;
    }
  }, [panteraActual]);

  const completarAnuncio = useCallback(() => setEstadoAnunciando(null), []);

  return {
    estadoAnunciando,
    completarAnuncio,
  };
}
