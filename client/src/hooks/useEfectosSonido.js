import { useEffect, useRef } from 'react';
import { reproducirSonido } from '../sonido/gestorSonido.js';

function contarAciertos(letrasUsadas) {
  return Object.values(letrasUsadas).filter((v) => v === 'acierto').length;
}

// Traduce transiciones del estado de la partida en efectos de sonido.
// Igual que useVidaPerdida / useSecuenciasDramaticas: cada comparación
// "antes vs. ahora" vive en una ref mutada DENTRO de un useEffect, que
// es el patrón seguro bajo React.StrictMode (si se hiciera durante el
// render, la doble invocación dispararía cada sonido dos veces).
export function useEfectosSonido(
  estado,
  { estadoAnunciando, mostrarZarpazo, mostrarVictoria, repechajeVisible },
) {
  // Fallo de letra al aire: la pantera avanzó de estado. Suena igual en
  // todos los avances, incluido el 5 (la derrota) — ese fallo también es
  // un fallo de letra. El golpe de "derrota" se reserva para el zarpazo
  // (ver más abajo), que ocurre al terminar el video del estado 5.
  const prevPantera = useRef(estadoAnunciando);
  useEffect(() => {
    if (estadoAnunciando !== prevPantera.current) {
      if (estadoAnunciando) reproducirSonido('fallo');
      prevPantera.current = estadoAnunciando;
    }
  }, [estadoAnunciando]);

  // Derrota: suena justo cuando aparece el efecto rojo + el zarpazo a
  // pantalla completa, ya terminado el video del estado 5 de la pantera.
  const prevZarpazo = useRef(mostrarZarpazo);
  useEffect(() => {
    if (mostrarZarpazo && !prevZarpazo.current) reproducirSonido('derrota');
    prevZarpazo.current = mostrarZarpazo;
  }, [mostrarZarpazo]);

  // Letra acertada (opción gratuita o Acierto Seguro): apareció una
  // entrada nueva marcada 'acierto' en letrasUsadas.
  const prevAciertos = useRef(contarAciertos(estado.letrasUsadas));
  useEffect(() => {
    const ahora = contarAciertos(estado.letrasUsadas);
    if (ahora > prevAciertos.current) reproducirSonido('acierto');
    prevAciertos.current = ahora;
  }, [estado.letrasUsadas]);

  // Victoria de una carta.
  const prevVictoria = useRef(mostrarVictoria);
  useEffect(() => {
    if (mostrarVictoria && !prevVictoria.current) reproducirSonido('victoria');
    prevVictoria.current = mostrarVictoria;
  }, [mostrarVictoria]);

  // Arranque de la Ronda de Repechaje: no alcanza con que el reducer haya
  // cambiado estado.fase a REPECHAJE (ocurre en el mismo commit que
  // resuelve la última carta de Ronda 1, mientras AnimacionVictoria o
  // PanelRevelacion pueden seguir tapando la pantalla). El flanco se mide
  // sobre `repechajeVisible` para que suene justo cuando el mensaje se
  // hace visible de verdad.
  const prevRepechaje = useRef(repechajeVisible);
  useEffect(() => {
    if (repechajeVisible && !prevRepechaje.current) reproducirSonido('repechaje');
    prevRepechaje.current = repechajeVisible;
  }, [repechajeVisible]);

  // Marcador final.
  const prevCierre = useRef(estado.fase === 'CIERRE');
  useEffect(() => {
    const enCierre = estado.fase === 'CIERRE';
    if (enCierre && !prevCierre.current) reproducirSonido('cierre');
    prevCierre.current = enCierre;
  }, [estado.fase]);
}
