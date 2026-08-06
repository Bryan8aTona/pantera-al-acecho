import { useEffect } from 'react';

// Aparece justo cuando termina el video del zarpazo (efecto "pantalla
// arañada"): garras trazadas rápido + destello rojo, se queda un
// instante y se desvanece. La duración debe coincidir con la animación
// definida en TableroJuegoPage.css (--duracion-zarpazo-overlay).
const DURACION_MS = 1100;

export default function ZarpazoOverlay({ onCompleta }) {
  useEffect(() => {
    const temporizador = setTimeout(() => {
      onCompleta?.();
    }, DURACION_MS);
    return () => clearTimeout(temporizador);
  }, [onCompleta]);

  return (
    <div className="zarpazo-overlay" aria-hidden="true">
      <svg
        viewBox="0 0 400 300"
        className="zarpazo-svg"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path className="zarpazo-garra zarpazo-garra-1" d="M40,0 L130,300" />
        <path className="zarpazo-garra zarpazo-garra-2" d="M110,-10 L200,310" />
        <path className="zarpazo-garra zarpazo-garra-3" d="M180,0 L270,300" />
      </svg>
    </div>
  );
}
