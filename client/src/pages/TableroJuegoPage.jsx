import { useNavigate } from 'react-router-dom';
import { usePartida } from '../context/PartidaContext.jsx';
import { usePartidaEngine } from '../hooks/usePartidaEngine.js';
import { debeAdivinar, hayLetrasDisponiblesAciertoSeguro } from '../motor/index.js';
import { COSTO_ACIERTO_SEGURO } from '../motor/constantes.js';
import EquipoPanel from '../components/tablero/EquipoPanel.jsx';
import Teclado from '../components/tablero/Teclado.jsx';
import MazoCartas from '../components/tablero/MazoCartas.jsx';
import ProgresoFrase from '../components/tablero/ProgresoFrase.jsx';
import PanelRobo from '../components/tablero/PanelRobo.jsx';
import PanelCierre from '../components/tablero/PanelCierre.jsx';
import PanelAdivinar from '../components/tablero/PanelAdivinar.jsx';
import './TableroJuegoPage.css';

const NOMBRE_FASE = {
  RONDA1: 'Ronda 1',
  REPECHAJE: 'Ronda de Repechaje',
  CIERRE: 'Cierre',
};

export default function TableroJuegoPage() {
  const { set, salirPartida } = usePartida();
  const { estado, dispatch, limpiarError } = usePartidaEngine(set);
  const navigate = useNavigate();

  function manejarSalida() {
    salirPartida();
    navigate('/configuracion-partida');
  }

  if (estado.fase === 'CIERRE') {
    return (
      <div className="tablero">
        <PanelCierre cierre={estado.cierre} onSalir={manejarSalida} />
      </div>
    );
  }

  const equipoTurnoId = estado.ordenTurnoActual[estado.turnoActualIndex];
  const equipoOriginal = estado.equipos[equipoTurnoId];
  const equipoActual = estado.modoRobo ? estado.equipos[estado.modoRobo.equipoId] : equipoOriginal;
  const cartaActual = estado.modoRobo
    ? estado.mazo[estado.modoRobo.cartaId]
    : estado.cartaActualId
      ? estado.mazo[estado.cartaActualId]
      : null;

  const forzarAdivinar = !estado.modoRobo && cartaActual ? debeAdivinar(equipoActual) : false;
  const mostrandoAdivinar = estado.modoAdivinarActivo || forzarAdivinar;

  return (
    <div className="tablero">
      <header className="tablero-header">
        <div>
          <p className="tablero-fase">{NOMBRE_FASE[estado.fase]}</p>
          <h1>{set.nombre}</h1>
        </div>
        <button type="button" className="btn-secundario" onClick={manejarSalida}>
          Salir de la partida
        </button>
      </header>

      {estado.error && (
        <div className="tablero-error" role="alert">
          {estado.error.mensaje}
          <button type="button" onClick={limpiarError} aria-label="Cerrar">
            ✕
          </button>
        </div>
      )}

      <div className="tablero-equipos">
        {Object.values(estado.equipos)
          .filter((e) => estado.ordenTurnoActual.includes(e.id) || estado.fase === 'RONDA1')
          .map((equipo) => (
            <EquipoPanel
              key={equipo.id}
              equipo={equipo}
              esTurnoActual={equipo.id === equipoTurnoId}
              esQuienRoba={estado.modoRobo?.equipoId === equipo.id}
            />
          ))}
      </div>

      <main className="tablero-mesa">
        {estado.modoRobo ? (
          <PanelRobo
            equipoQueRoba={equipoActual}
            equipoOriginal={equipoOriginal}
            carta={cartaActual}
            onEnviar={(intento) => dispatch({ type: 'ENVIAR_RESPUESTA', intento })}
          />
        ) : !estado.cartaActualId ? (
          <MazoCartas mazo={estado.mazo} onElegir={(cartaId) => dispatch({ type: 'ELEGIR_CARTA', cartaId })} />
        ) : (
          <>
            <ProgresoFrase texto={cartaActual.texto} letrasUsadas={estado.letrasUsadas} />

            {mostrandoAdivinar ? (
              <PanelAdivinar
                obligatorio={forzarAdivinar}
                onEnviar={(intento) => dispatch({ type: 'ENVIAR_RESPUESTA', intento })}
                onCancelar={() => dispatch({ type: 'CANCELAR_MODO_ADIVINAR' })}
              />
            ) : (
              <>
                <Teclado
                  letrasUsadas={estado.letrasUsadas}
                  equipo={equipoActual}
                  onPedirLetra={(letra) => dispatch({ type: 'PEDIR_LETRA_LIBRE', letra })}
                />

                {estado.ronda === 1 && (
                  <div className="acierto-seguro">
                    <button
                      type="button"
                      className="btn-secundario"
                      disabled={
                        equipoActual.intentos.vocales <= 0 ||
                        equipoActual.saldo < COSTO_ACIERTO_SEGURO.vocal ||
                        !hayLetrasDisponiblesAciertoSeguro(cartaActual.texto, 'vocal', estado.letrasUsadas)
                      }
                      onClick={() => dispatch({ type: 'COMPRAR_ACIERTO_SEGURO', categoria: 'vocal' })}
                    >
                      Acierto Seguro · Vocal ({COSTO_ACIERTO_SEGURO.vocal} 🪙)
                    </button>
                    <button
                      type="button"
                      className="btn-secundario"
                      disabled={
                        equipoActual.intentos.consonantes <= 0 ||
                        equipoActual.saldo < COSTO_ACIERTO_SEGURO.consonante ||
                        !hayLetrasDisponiblesAciertoSeguro(cartaActual.texto, 'consonante', estado.letrasUsadas)
                      }
                      onClick={() => dispatch({ type: 'COMPRAR_ACIERTO_SEGURO', categoria: 'consonante' })}
                    >
                      Acierto Seguro · Consonante ({COSTO_ACIERTO_SEGURO.consonante} 🪙)
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  className="btn-primario btn-grande"
                  onClick={() => dispatch({ type: 'ACTIVAR_MODO_ADIVINAR' })}
                >
                  Modo Adivinar
                </button>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
