import Lottie from 'lottie-react';
import victoriaAnimacion from '../../assets/lottie/victoria.json';

// Nota: victoria.json (Treasure_Chest.json) se importa de forma
// ESTÁTICA. Se intentó cargarlo con import() dinámico para no inflar
// el bundle principal, pero eso introducía una carrera de tiempos que
// no logré resolver de forma confiable bajo pruebas — se revirtió a
// import estático (más simple, robusto) a costa de un bundle más
// pesado. Pendiente revisar la carga diferida más adelante.
export default function AnimacionVictoria({ carta, onCompleta }) {
  // La animación dura ~5 s. El docente puede adelantarla con un clic
  // (o Enter/Espacio) para no cortar el ritmo de la clase; si no hace
  // nada, `onComplete` de Lottie la cierra igual.
  return (
    <div
      className="animacion-victoria"
      role="button"
      tabIndex={0}
      aria-label="Ganó la carta — clic para continuar"
      onClick={onCompleta}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onCompleta?.();
      }}
    >
      <Lottie
        animationData={victoriaAnimacion}
        loop={false}
        onComplete={onCompleta}
        className="animacion-victoria-lottie"
      />
      <p className="animacion-victoria-texto">¡+{carta.valor} monedas!</p>
      <p className="animacion-victoria-hint">clic para continuar</p>
    </div>
  );
}
