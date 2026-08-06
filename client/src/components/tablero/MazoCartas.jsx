import { useState } from 'react';

const DURACION_CLICK_MS = 450;

export default function MazoCartas({ mazo, onElegir, deshabilitado }) {
  const [seleccionandoId, setSeleccionandoId] = useState(null);

  const cartasDisponibles = Object.values(mazo)
    .filter((carta) => !carta.jugada)
    .sort((a, b) => a.orden - b.orden);

  function manejarClick(cartaId) {
    if (seleccionandoId) return; // evita doble clic mientras anima
    setSeleccionandoId(cartaId);
    // Deja ver la animación de reacción antes de disparar la acción real.
    setTimeout(() => onElegir(cartaId), DURACION_CLICK_MS);
  }

  return (
    <div className="mazo-cartas">
      <p className="mazo-cartas-instruccion">Elige una carta boca abajo:</p>
      <div className="mazo-cartas-grid">
        {cartasDisponibles.map((carta, i) => (
          <button
            key={carta.id}
            type="button"
            className={
              seleccionandoId === carta.id ? 'carta-boca-abajo carta-seleccionada' : 'carta-boca-abajo'
            }
            style={{ '--i': i }}
            disabled={deshabilitado || Boolean(seleccionandoId)}
            onClick={() => manejarClick(carta.id)}
          >
            <img src="/assets/cartas/carta-reverso.png" alt="" className="carta-imagen" />
            <span className="carta-boca-abajo-num">{carta.orden}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
