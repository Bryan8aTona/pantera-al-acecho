import Lottie from 'lottie-react';
import victoriaAnimacion from '../../assets/lottie/victoria.json';

// Nota: victoria.json (Treasure_Chest.json) se importa de forma
// ESTÁTICA. Se intentó cargarlo con import() dinámico para no inflar
// el bundle principal, pero eso introducía una carrera de tiempos que
// no logré resolver de forma confiable bajo pruebas — se revirtió a
// import estático (más simple, robusto) a costa de un bundle más
// pesado. Pendiente revisar la carga diferida más adelante.
export default function AnimacionVictoria({ carta, onCompleta }) {
  return (
    <div className="animacion-victoria" role="status" aria-live="polite">
      <Lottie
        animationData={victoriaAnimacion}
        loop={false}
        onComplete={onCompleta}
        className="animacion-victoria-lottie"
      />
      <p className="animacion-victoria-texto">¡+{carta.valor} monedas!</p>
    </div>
  );
}
