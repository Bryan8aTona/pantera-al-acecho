import { useEffect, useRef } from 'react';

// Nombres exactos documentados en client/public/assets/pantera/README.md
const RUTA_VIDEOS = {
  1: '/assets/pantera/pantera-estado-1.mp4',
  2: '/assets/pantera/pantera-estado-2.mp4',
  3: '/assets/pantera/pantera-estado-3.mp4',
  4: '/assets/pantera/pantera-estado-4.mp4',
  5: '/assets/pantera/pantera-estado-5-zarpazo.mp4',
};

// Dos modos de uso, siempre dentro de la misma cajita:
//
// - Ambiente (`reproducir=false`): el video queda fijo, sin sonido.
//   `mostrarPrimerFrame` deja el estado 1 en su primer fotograma (selva
//   en calma); si no, se queda en el ÚLTIMO fotograma del estado
//   alcanzado.
//
// - Anuncio (`reproducir=true`): reproduce el video completo CON sonido.
//   Al terminar (o si falla), avisa que la secuencia terminó — el
//   overlay de garras del estado 5 lo maneja TableroJuegoPage a pantalla
//   completa, ya no este componente.
//
// El `key` del <video> depende SOLO de `estado`: al pasar de anuncio a
// reposo (mismo estado) el elemento NO se vuelve a montar, así que se
// queda en el último fotograma que mostró en vez de parpadear a negro.
// El cambio anuncio-arranca (reproducir false -> true sin cambiar de
// estado, que pasa en el primer fallo) se cubre con el efecto de abajo.
export default function PanteraDisplay({ estado, reproducir = true, mostrarPrimerFrame = false, onSecuenciaCompleta }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !reproducir) return;
    // Arranca el anuncio desde el inicio, con sonido, aunque el <video>
    // no se haya vuelto a montar.
    try {
      v.currentTime = 0;
    } catch {
      /* jsdom / metadata aún no lista: no pasa nada */
    }
    v.muted = false;
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }, [reproducir, estado]);

  if (!estado) {
    return <div className="pantera-display pantera-display-vacia" aria-hidden="true" />;
  }

  function manejarFinDeVideo() {
    onSecuenciaCompleta?.();
  }

  function manejarCargaMetadatos(e) {
    if (!reproducir) {
      e.target.currentTime = mostrarPrimerFrame ? 0 : e.target.duration || 0;
    }
  }

  return (
    <div className="pantera-display">
      <video
        key={estado}
        ref={videoRef}
        src={RUTA_VIDEOS[estado]}
        autoPlay={reproducir}
        muted={!reproducir}
        playsInline
        onLoadedMetadata={manejarCargaMetadatos}
        onEnded={manejarFinDeVideo}
        onError={manejarFinDeVideo}
        className="pantera-video"
      />
    </div>
  );
}
