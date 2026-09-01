import { COLORES_EQUIPO } from './coloresEquipo.js';

// Anuncio de arranque de la Ronda de Repechaje: aparece una sola vez,
// entre la revelación de la última carta de la Ronda 1 y el primer
// turno del repechaje. El docente lo cierra con el botón.
export default function PanelRepechaje({ equipos, onComenzar }) {
  return (
    <div className="panel-repechaje" role="status">
      <p className="panel-repechaje-kicker">Terminó la Ronda 1</p>
      <h2>Comienza la Ronda de Repechaje</h2>
      <p className="panel-repechaje-texto">
        Vuelven a jugar solo los equipos que no adivinaron su frase. Sin monedas y sin robo:
        2 intentos de vocales y 5 de consonantes.
      </p>

      <ul className="panel-repechaje-equipos">
        {equipos.map((equipo) => (
          <li key={equipo.id} style={{ '--color-equipo': COLORES_EQUIPO[equipo.id] }}>
            <span className="panel-repechaje-punto" aria-hidden="true" />
            {equipo.nombre}
          </li>
        ))}
      </ul>

      <button type="button" className="btn-primario btn-grande" onClick={onComenzar}>
        Comenzar repechaje
      </button>
    </div>
  );
}
