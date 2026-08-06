import { useEffect, useState } from 'react';
import PanteraDisplay from './PanteraDisplay.jsx';

const DURACION_IMPACTO_MS = 600;

// Fase 1 ("impacto"): vibración de pantalla (aplicada por el padre vía
// clase CSS) + destello rojo, ~600ms.
// Fase 2 ("video"): el video del nuevo estado a pantalla completa.
// PanteraDisplay se encarga de encogerse (o, si es derrota, mostrar el
// overlay de garras) y avisar cuándo termina toda la secuencia.
export default function SecuenciaVidaPerdida({ estado, onCompleta }) {
  const [fase, setFase] = useState('impacto');

  useEffect(() => {
    if (fase !== 'impacto') return undefined;
    const temporizador = setTimeout(() => setFase('video'), DURACION_IMPACTO_MS);
    return () => clearTimeout(temporizador);
  }, [fase]);

  return (
    <>
      {fase === 'impacto' && <div className="flash-rojo" aria-hidden="true" />}
      {fase === 'video' && (
        <PanteraDisplay estado={estado} pantallaCompleta reproducir onSecuenciaCompleta={onCompleta} />
      )}
    </>
  );
}
