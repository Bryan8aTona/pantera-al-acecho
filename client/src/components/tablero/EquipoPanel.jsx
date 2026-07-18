const COLORES_EQUIPO = {
  rojo: '#C0392B',
  azul: '#2A6DB0',
  amarillo: '#C9971F',
  verde: '#4C8C3C',
};

// La animación real de la pantera (5 estados con ilustración) es la
// siguiente tarea de Fase 4. Por ahora, un indicador de puntos deja
// claro cuántos errores lleva el equipo sin bloquear el resto del
// tablero.
function PuntosPantera({ estado }) {
  return (
    <div className="pantera-puntos" aria-label={`Pantera en estado ${estado} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= estado ? 'punto lleno' : 'punto'} />
      ))}
    </div>
  );
}

export default function EquipoPanel({ equipo, esTurnoActual, esQuienRoba }) {
  const color = COLORES_EQUIPO[equipo.id];

  let clase = 'equipo-panel';
  if (esTurnoActual) clase += ' en-turno';
  if (esQuienRoba) clase += ' robando';

  return (
    <div className={clase} style={{ '--color-equipo': color }}>
      <div className="equipo-panel-nombre">
        <span className="equipo-punto-color" aria-hidden="true" />
        {equipo.nombre}
      </div>

      <div className="equipo-panel-saldo">{equipo.saldo} 🪙</div>

      <div className="equipo-panel-intentos">
        <span>Vocales: {equipo.intentos.vocales}</span>
        <span>Consonantes: {equipo.intentos.consonantes}</span>
      </div>

      <PuntosPantera estado={equipo.panteraEstado} />

      {esTurnoActual && <div className="equipo-panel-etiqueta">En turno</div>}
      {esQuienRoba && <div className="equipo-panel-etiqueta etiqueta-robo">¡Puede robar!</div>}
    </div>
  );
}
