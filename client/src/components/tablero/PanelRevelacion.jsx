export default function PanelRevelacion({ carta, equipoGanador, onContinuar }) {
  return (
    <div className="panel-revelacion">
      <p className="panel-revelacion-etiqueta">La frase era</p>
      <p className="panel-revelacion-frase">{carta.texto}</p>

      {equipoGanador ? (
        <p className="panel-revelacion-resultado ganador">
          {equipoGanador.nombre} ganó {carta.valor} 🪙
        </p>
      ) : (
        <p className="panel-revelacion-resultado">Nadie ganó esta frase</p>
      )}

      <button type="button" className="btn-primario" onClick={onContinuar}>
        Continuar
      </button>
    </div>
  );
}
