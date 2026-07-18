import { useState } from 'react';

export default function PanelRobo({ equipoQueRoba, equipoOriginal, carta, onEnviar }) {
  const [respuesta, setRespuesta] = useState('');

  function manejarEnvio(e) {
    e.preventDefault();
    if (!respuesta.trim()) return;
    onEnviar(respuesta.trim());
  }

  return (
    <div className="panel-robo">
      <p className="panel-robo-aviso">
        {equipoOriginal?.nombre ?? 'El equipo'} no logró adivinar. <br />
        <strong>{equipoQueRoba.nombre}</strong> tiene una única oportunidad de robar la frase —
        sin letras, sin monedas.
      </p>

      <form onSubmit={manejarEnvio} className="panel-robo-form">
        <input
          type="text"
          value={respuesta}
          onChange={(e) => setRespuesta(e.target.value)}
          placeholder="Declara la frase completa…"
          autoFocus
        />
        <button type="submit" className="btn-primario">
          Declarar frase
        </button>
      </form>
    </div>
  );
}
