import { useEffect, useState } from 'react';

// Aparece justo cuando termina el video del zarpazo: destello rojo + la
// imagen de la garra (client/public/assets/zarpazo-garra.png). Si el
// archivo falla al cargar, el overlay se queda solo con el destello
// radial — la secuencia igual avanza a los 1100 ms.
const DURACION_MS = 1100;

export default function ZarpazoOverlay({ onCompleta }) {
  const [imagenRota, setImagenRota] = useState(false);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      onCompleta?.();
    }, DURACION_MS);
    return () => clearTimeout(temporizador);
  }, [onCompleta]);

  return (
    <div className="zarpazo-overlay" aria-hidden="true">
      {!imagenRota && (
        <img
          src="/assets/zarpazo-garra.png"
          alt=""
          className="zarpazo-imagen"
          onError={() => setImagenRota(true)}
        />
      )}
    </div>
  );
}
