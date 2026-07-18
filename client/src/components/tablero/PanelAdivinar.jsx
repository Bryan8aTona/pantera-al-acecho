import { useState } from 'react';

// Versión simple: un input de texto libre. El "relleno inteligente"
// (prellenar letras ya reveladas, cursor que salta automáticamente
// entre espacios vacíos) es la siguiente tarea de Fase 4 — aquí el
// docente escribe la frase completa a mano.
export default function PanelAdivinar({ obligatorio, onEnviar, onCancelar }) {
  const [respuesta, setRespuesta] = useState('');

  function manejarEnvio(e) {
    e.preventDefault();
    if (!respuesta.trim()) return;
    onEnviar(respuesta.trim());
  }

  return (
    <div className="panel-adivinar">
      {obligatorio && (
        <p className="panel-adivinar-aviso">
          El equipo agotó sus intentos de letras — debe declarar la frase.
        </p>
      )}

      <form onSubmit={manejarEnvio} className="panel-adivinar-form">
        <input
          type="text"
          value={respuesta}
          onChange={(e) => setRespuesta(e.target.value)}
          placeholder="Escribe la frase completa…"
          autoFocus
        />
        <div className="panel-adivinar-acciones">
          {!obligatorio && (
            <button type="button" className="btn-secundario" onClick={onCancelar}>
              Cancelar
            </button>
          )}
          <button type="submit" className="btn-primario">
            Adivinar
          </button>
        </div>
      </form>
    </div>
  );
}
