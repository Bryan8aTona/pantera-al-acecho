import { useEffect, useRef, useState } from 'react';
import { reproducirSonido } from '../../sonido/gestorSonido.js';

const DURACION_CLICK_MS = 450;

// A diferencia de antes, este componente se queda montado durante todo
// el turno del equipo (no solo mientras elige). Antes de elegir es
// interactivo; una vez elegida una carta, todas quedan deshabilitadas
// y la elegida se ve "al frente" (más grande, con brillo), el resto
// atenuadas — visibles pero claramente fuera de juego.
export default function MazoCartas({ mazo, interactivo, cartaElegidaId, onElegir }) {
  const [seleccionandoId, setSeleccionandoId] = useState(null);

  const cartasDisponibles = Object.values(mazo)
    .filter((carta) => !carta.jugada)
    .sort((a, b) => a.orden - b.orden);

  // Sonido de "se reparten las cartas" al empezar cada turno (cuando el
  // mazo pasa a ser interactivo). Ref inicializada en false para que
  // suene también en el primer turno; StrictMode lo dispara una sola vez.
  //
  // Se difiere un instante: en el commit en que una carta se resuelve,
  // `cartaActualId` ya es null y este mazo aparece "interactivo" por un
  // solo render antes de que la animación de victoria/revelación lo tape.
  // Ese parpadeo dispararía un 'repartir' fantasma de fondo sobre la
  // victoria. Si el mazo se desmonta (o deja de ser interactivo) antes de
  // que venza el temporizador, se cancela y no suena.
  const prevInteractivo = useRef(false);
  const repartirPendiente = useRef(null);
  useEffect(() => {
    if (interactivo && !prevInteractivo.current) {
      repartirPendiente.current = setTimeout(() => {
        repartirPendiente.current = null;
        prevInteractivo.current = true;
        reproducirSonido('repartir');
      }, 120);
    } else if (!interactivo) {
      prevInteractivo.current = false;
    }
    return () => {
      if (repartirPendiente.current) {
        clearTimeout(repartirPendiente.current);
        repartirPendiente.current = null;
      }
    };
  }, [interactivo]);

  function manejarClick(cartaId) {
    if (!interactivo || seleccionandoId) return;
    reproducirSonido('elegirCarta');
    setSeleccionandoId(cartaId);
    // Deja ver la animación de reacción antes de disparar la acción real.
    setTimeout(() => onElegir(cartaId), DURACION_CLICK_MS);
  }

  return (
    <div className="mazo-cartas">
      {interactivo && <p className="mazo-cartas-instruccion">Elige una carta boca abajo:</p>}
      <div className="mazo-cartas-grid">
        {cartasDisponibles.map((carta, i) => {
          let clase = 'carta-boca-abajo';
          if (seleccionandoId === carta.id) clase += ' carta-seleccionada';
          if (cartaElegidaId) {
            clase += carta.id === cartaElegidaId ? ' carta-en-frente' : ' carta-atenuada';
          }

          return (
            <button
              key={carta.id}
              type="button"
              className={clase}
              style={{ '--i': i }}
              disabled={!interactivo || Boolean(seleccionandoId)}
              onMouseEnter={() => {
                if (interactivo && !seleccionandoId) reproducirSonido('hoverCarta', { volumen: 0.45 });
              }}
              onClick={() => manejarClick(carta.id)}
            >
              <img src="/assets/cartas/carta-reverso.png" alt="" className="carta-imagen" />
              <span className="carta-boca-abajo-num">{carta.orden}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
