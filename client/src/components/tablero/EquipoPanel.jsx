import { COLORES_EQUIPO } from './coloresEquipo.js';

// La animación real de la pantera vive en su propio componente; aquí
// solo un indicador compacto de cuántas vidas lleva perdidas el equipo.
function PuntosPantera({ estado }) {
  return (
    <div className="pantera-puntos" aria-label={`Pantera en estado ${estado} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= estado ? 'punto lleno' : 'punto'} />
      ))}
    </div>
  );
}

export default function EquipoPanel({ equipo, limites, esTurnoActual, esQuienRoba }) {
  const color = COLORES_EQUIPO[equipo.id];

  let clase = 'equipo-panel-v2';
  if (esTurnoActual) clase += ' en-turno';
  if (esQuienRoba) clase += ' robando';

  return (
    <div className={clase} style={{ '--color-equipo': color }}>
      <div className="equipo-panel-v2-tab">{equipo.nombre}</div>

      <div className="equipo-panel-v2-fila">
        <span className="equipo-panel-v2-label">SALDO ACTUAL</span>
        <span className="equipo-panel-v2-saldo">
          <span className="equipo-panel-v2-moneda" aria-hidden="true">
            🪙
          </span>
          {equipo.saldo}
        </span>
      </div>

      <div className="equipo-panel-v2-divisor" />

      <div className="equipo-panel-v2-fila">
        <span className="equipo-panel-v2-label">CONTADORES</span>
        <div className="equipo-panel-v2-contadores">
          <span>
            <span className="equipo-panel-v2-categoria">Vocales:</span> {equipo.intentos.vocales}/
            {limites.vocales}
          </span>
          <span>
            <span className="equipo-panel-v2-categoria">Consonantes:</span> {equipo.intentos.consonantes}/
            {limites.consonantes}
          </span>
        </div>
      </div>

      <PuntosPantera estado={equipo.panteraEstado} />

      {esTurnoActual && <div className="equipo-panel-v2-etiqueta etiqueta-en-turno">En turno</div>}
      {esQuienRoba && <div className="equipo-panel-v2-etiqueta etiqueta-robo">¡Puede robar!</div>}
    </div>
  );
}
