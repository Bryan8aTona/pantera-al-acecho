import { useCallback, useEffect, useRef, useState } from 'react';

// El reducer resuelve cada jugada de forma instantánea. Este hook solo
// decide cuándo mostrar, ANTES de la consecuencia normal:
//
//   1. Animación de victoria, si alguien ganó la carta.
//   2. SIEMPRE: revelación de la frase + pausa manual para el docente
//      (requerimientos.md 3.6), tenga o no ganador.
//
// La secuencia de derrota por pantera vive aparte, en useVidaPerdida.js.
//
// NOTA sobre el patrón usado (importante, costó encontrarlo bien):
// la comparación contra el "valor anterior" vive en una ref, mutada
// DENTRO de un useEffect — no durante el render. Una ref mutada
// *durante el render* rompe bajo StrictMode (la doble invocación para
// detectar impurezas ve el cambio ya aplicado y lo pierde). Pero una
// ref mutada dentro de un efecto es el patrón clásico y seguro: los
// efectos SÍ corren una sola vez por commit real bajo StrictMode (con
// su propio mount→cleanup→mount, que no reintroduce este problema).
// El costo es un render extra de diferencia (imperceptible) entre que
// la carta se resuelve y que se detecta — aceptable aquí.
export function useSecuenciasDramaticas(estado) {
  const cartaEnRoboId = estado.modoRobo?.cartaId ?? null;

  const prevRef = useRef({
    turnosCompletados: estado.turnosCompletados,
    cartaActualId: estado.cartaActualId,
    modoRoboCartaId: cartaEnRoboId,
  });

  const [cartaResueltaId, setCartaResueltaId] = useState(null);
  const [victoriaCompletadaId, setVictoriaCompletadaId] = useState(null);
  const [revelacionCompletadaId, setRevelacionCompletadaId] = useState(null);

  useEffect(() => {
    const anterior = prevRef.current;

    if (estado.turnosCompletados !== anterior.turnosCompletados) {
      const idResuelta = anterior.cartaActualId ?? anterior.modoRoboCartaId;
      if (idResuelta) {
        setCartaResueltaId(idResuelta);
      }
    }

    prevRef.current = {
      turnosCompletados: estado.turnosCompletados,
      cartaActualId: estado.cartaActualId,
      modoRoboCartaId: cartaEnRoboId,
    };
  }, [estado.turnosCompletados, estado.cartaActualId, cartaEnRoboId]);

  const cartaResuelta = cartaResueltaId ? estado.mazo[cartaResueltaId] : null;
  const tieneGanador = Boolean(cartaResuelta?.ganadorId);

  // La victoria (si hay ganador) va ANTES de la revelación.
  const necesitaVictoriaPrimero =
    Boolean(cartaResueltaId) && tieneGanador && victoriaCompletadaId !== cartaResueltaId;
  const mostrarVictoria = necesitaVictoriaPrimero;

  // La revelación es obligatoria para TODA carta resuelta, tenga o no
  // ganador, y siempre después de la animación de victoria si la hubo.
  const mostrarRevelacion =
    Boolean(cartaResueltaId) && !necesitaVictoriaPrimero && revelacionCompletadaId !== cartaResueltaId;

  const completarVictoria = useCallback(() => {
    setVictoriaCompletadaId(cartaResueltaId);
  }, [cartaResueltaId]);

  const completarRevelacion = useCallback(() => {
    setRevelacionCompletadaId(cartaResueltaId);
  }, [cartaResueltaId]);

  return {
    mostrarVictoria,
    cartaGanadora: mostrarVictoria ? cartaResuelta : null,
    completarVictoria,

    mostrarRevelacion,
    cartaRevelada: mostrarRevelacion ? cartaResuelta : null,
    completarRevelacion,
  };
}
