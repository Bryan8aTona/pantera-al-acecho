import { useEffect, useRef, useState } from 'react';

export function prefiereMenosMovimiento() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

// Número que "corre" hasta `valor` cada vez que cambia, como contador de
// tragamonedas. Arranca en `desde` y, en el primer montaje, espera
// `retraso` ms antes de correr. Con movimiento reducido salta directo.
// `pausado` congela el número mostrado (p. ej. mientras se ve el cofre).
export function useContadorAnimado(valor, { desde = valor, retraso = 0, duracion = 900, pausado = false } = {}) {
  const [mostrado, setMostrado] = useState(() => (prefiereMenosMovimiento() ? valor : desde));
  const mostradoRef = useRef(mostrado);
  const primeraVezRef = useRef(true);

  useEffect(() => {
    mostradoRef.current = mostrado;
  }, [mostrado]);

  useEffect(() => {
    if (pausado) return undefined;
    const inicio = mostradoRef.current;
    if (inicio === valor || prefiereMenosMovimiento()) return undefined;

    let frame = 0;
    const espera = primeraVezRef.current ? retraso : 0;
    const timer = setTimeout(() => {
      // Aquí y no antes: StrictMode cancela el primer timer al remontar,
      // y el segundo debe seguir esperando el retraso inicial.
      primeraVezRef.current = false;
      const t0 = performance.now();
      const paso = (ahora) => {
        const avance = Math.min(1, (ahora - t0) / duracion);
        const suavizado = 1 - (1 - avance) ** 3;
        setMostrado(Math.round(inicio + (valor - inicio) * suavizado));
        if (avance < 1) frame = requestAnimationFrame(paso);
      };
      frame = requestAnimationFrame(paso);
    }, espera);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [valor, pausado, retraso, duracion]);

  // Con movimiento reducido no hay animación: se muestra el valor tal cual.
  return prefiereMenosMovimiento() ? valor : mostrado;
}
