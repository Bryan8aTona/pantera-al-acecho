import { useState } from 'react';
import ZarpazoOverlay from './ZarpazoOverlay.jsx';

// Nombres exactos documentados en client/public/assets/pantera/README.md
const RUTA_VIDEOS = {
  1: '/assets/pantera/pantera-estado-1.mp4',
  2: '/assets/pantera/pantera-estado-2.mp4',
  3: '/assets/pantera/pantera-estado-3.mp4',
  4: '/assets/pantera/pantera-estado-4.mp4',
  5: '/assets/pantera/pantera-estado-5-zarpazo.mp4',
};

// Dos modos de uso, siempre dentro de la misma cajita (ya no hay
// versión a pantalla completa):
//
// - Ambiente (`reproducir=false`): el video queda fijo, sin sonido.
//   `mostrarPrimerFrame` deja el estado 1 en su primer fotograma (selva
//   en calma, antes de cualquier error); si no, se queda en el ÚLTIMO
//   fotograma del estado alcanzado.
//
// - Anuncio (`reproducir=true`): reproduce el video completo CON
//   sonido, dentro de la misma cajita. Al terminar, si es el estado 5
//   (derrota) dispara el overlay de garras; si no, avisa directo que
//   la secuencia terminó.
export default function PanteraDisplay({ estado, reproducir = true, mostrarPrimerFrame = false, onSecuenciaCompleta }) {
  const [mostrarImpacto, setMostrarImpacto] = useState(false);

  if (!estado) {
    return <div className="pantera-display pantera-display-vacia" aria-hidden="true" />;
  }

  const esDerrota = estado === 5;

  function manejarFinDeVideo() {
    if (esDerrota) {
      setMostrarImpacto(true);
      return;
    }
    onSecuenciaCompleta?.();
  }

  // Si el archivo todavía no existe o falla la carga, no dejamos el
  // juego esperando para siempre un video que nunca va a terminar.
  const manejarErrorDeVideo = manejarFinDeVideo;

  function manejarCargaMetadatos(e) {
    if (!reproducir) {
      e.target.currentTime = mostrarPrimerFrame ? 0 : e.target.duration || 0;
    }
  }

  return (
    <div className="pantera-display">
      <video
        key={`${estado}-${reproducir}`}
        src={RUTA_VIDEOS[estado]}
        autoPlay={reproducir}
        muted={!reproducir}
        playsInline
        onLoadedMetadata={manejarCargaMetadatos}
        onEnded={manejarFinDeVideo}
        onError={manejarErrorDeVideo}
        className="pantera-video"
      />
      {esDerrota && mostrarImpacto && <ZarpazoOverlay onCompleta={onSecuenciaCompleta} />}
    </div>
  );
}
