export default function MazoCartas({ mazo, onElegir, deshabilitado }) {
  const cartasDisponibles = Object.values(mazo)
    .filter((carta) => !carta.jugada)
    .sort((a, b) => a.orden - b.orden);

  return (
    <div className="mazo-cartas">
      <p className="mazo-cartas-instruccion">Elige una carta boca abajo:</p>
      <div className="mazo-cartas-grid">
        {cartasDisponibles.map((carta) => (
          <button
            key={carta.id}
            type="button"
            className="carta-boca-abajo"
            disabled={deshabilitado}
            onClick={() => onElegir(carta.id)}
          >
            <span aria-hidden="true">🐆</span>
            <span className="carta-boca-abajo-num">{carta.orden}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
