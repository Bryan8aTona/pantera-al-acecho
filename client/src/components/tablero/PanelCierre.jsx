export default function PanelCierre({ cierre, onSalir }) {
  return (
    <div className="panel-cierre">
      <h2>Marcador final</h2>
      <ol className="panel-cierre-marcador">
        {cierre.marcador.map((equipo, i) => (
          <li key={equipo.id}>
            <span className="panel-cierre-puesto">{i + 1}</span>
            <span className="panel-cierre-nombre">{equipo.nombre}</span>
            <span className="panel-cierre-saldo">{equipo.saldo} 🪙</span>
          </li>
        ))}
      </ol>

      {cierre.cartasReveladas.length > 0 && (
        <>
          <h3>Frases que no se jugaron</h3>
          <ul className="panel-cierre-reveladas">
            {cierre.cartasReveladas.map((carta) => (
              <li key={carta.id}>
                <span className="panel-cierre-frase">{carta.texto}</span>
                <span className="panel-cierre-valor">{carta.valor} 🪙</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <button type="button" className="btn-primario" onClick={onSalir}>
        Salir de la partida
      </button>
    </div>
  );
}
