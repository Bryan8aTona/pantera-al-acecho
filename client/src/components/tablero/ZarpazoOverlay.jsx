import { useEffect } from 'react';

// Aparece justo cuando termina el video del zarpazo: destello rojo +
// la imagen de la garra (client/public/assets/pantera/zarpazo-garra.png
// — reemplázala por la definitiva, el nombre de archivo es lo único
// que importa) con una animación de entrada.
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
      <img src="/assets/pantera/zarpazo-garra.png" alt="" className="zarpazo-imagen" />
    </div>
  );
}
