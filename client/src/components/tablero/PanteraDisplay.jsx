import { useEffect, useState } from 'react';
import ZarpazoOverlay from './ZarpazoOverlay.jsx';

// Nombres exactos documentados en client/public/assets/pantera/README.md
const RUTA_VIDEOS = {
  1: '/assets/pantera/pantera-estado-1.mp4',
  2: '/assets/pantera/pantera-estado-2.mp4',
  3: '/assets/pantera/pantera-estado-3.mp4',
  4: '/assets/pantera/pantera-estado-4.mp4',
  5: '/assets/pantera/pantera-estado-5-zarpazo.mp4',
};

const DURACION_ENCOGER_MS = 400;

// Dos modos de uso:
//
// - Ambiente (`reproducir=false`, cajita chica): no reproduce nada, se
//   queda fijo en el último frame del video del estado actual — ya se
//   "anunció" a pantalla completa antes, esto es solo la referencia
//   visual mientras el equipo sigue jugando.
//
// - Anuncio (`pantallaCompleta` + `reproducir=true`): reproduce el
//   video completo a pantalla completa. Al terminar, si es el estado 5
//   (derrota) dispara el overlay de garras; si no, se encoge con un
//   fundido antes de avisar que la secuencia terminó.
export default function PanteraDisplay({ estado, pantallaCompleta = false, reproducir = true, onSecuenciaCompleta }) {
  const [mostrarImpacto, setMostrarImpacto] = useState(false);
  const [encogiendo, setEncogiendo] = useState(false);

  useEffect(() => {
    if (!encogiendo) return undefined;
    const temporizador = setTimeout(() => onSecuenciaCompleta?.(), DURACION_ENCOGER_MS);
    return () => clearTimeout(temporizador);
  }, [encogiendo, onSecuenciaCompleta]);

  if (!estado) {
    return <div className="pantera-display pantera-display-vacia" aria-hidden="true" />;
  }

  const esDerrota = estado === 5;

  function manejarFinDeVideo() {
    if (esDerrota) {
      setMostrarImpacto(true);
      return;
    }
    if (pantallaCompleta) {
      setEncogiendo(true);
    }
  }

  // Si el archivo todavía no existe o falla la carga, no dejamos el
  // juego esperando para siempre un video que nunca va a terminar.
  const manejarErrorDeVideo = manejarFinDeVideo;

  function manejarCargaMetadatos(e) {
    if (!reproducir) {
      e.target.currentTime = e.target.duration || 0;
    }
  }

  let clase = 'pantera-display';
  if (pantallaCompleta) clase += ' pantera-display-completa';
  if (encogiendo) clase += ' pantera-display-encogiendo';

  return (
    <div className={clase}>
      <video
        key={`${estado}-${pantallaCompleta}`}
        src={RUTA_VIDEOS[estado]}
        autoPlay={reproducir}
        muted
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
