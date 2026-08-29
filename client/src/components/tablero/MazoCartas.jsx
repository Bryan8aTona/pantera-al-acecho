import { useState } from 'react';

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

  function manejarClick(cartaId) {
    if (!interactivo || seleccionandoId) return;
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
