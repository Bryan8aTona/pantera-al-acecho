import { useNavigate } from 'react-router-dom';
import { usePartida } from '../context/PartidaContext.jsx';
import { usePartidaEngine } from '../hooks/usePartidaEngine.js';
import { useSecuenciasDramaticas } from '../hooks/useSecuenciasDramaticas.js';
import { useVidaPerdida } from '../hooks/useVidaPerdida.js';
import { debeAdivinar, hayLetrasDisponiblesAciertoSeguro } from '../motor/index.js';
import { COSTO_ACIERTO_SEGURO, LIMITES_INTENTOS } from '../motor/constantes.js';
import EquipoPanel from '../components/tablero/EquipoPanel.jsx';
import Teclado from '../components/tablero/Teclado.jsx';
import MazoCartas from '../components/tablero/MazoCartas.jsx';
import ProgresoFrase from '../components/tablero/ProgresoFrase.jsx';
import PanelRobo from '../components/tablero/PanelRobo.jsx';
import PanelCierre from '../components/tablero/PanelCierre.jsx';
import PanelAdivinar from '../components/tablero/PanelAdivinar.jsx';
import PanelRevelacion from '../components/tablero/PanelRevelacion.jsx';
import PanteraDisplay from '../components/tablero/PanteraDisplay.jsx';
import EfectoImpacto from '../components/tablero/EfectoImpacto.jsx';
import AnimacionVictoria from '../components/tablero/AnimacionVictoria.jsx';
import './TableroJuegoPage.css';

const NOMBRE_FASE = {
  RONDA1: 'Ronda 1',
  REPECHAJE: 'Ronda de Repechaje',
  CIERRE: 'Cierre',
};

export default function TableroJuegoPage() {
  const { set, salirPartida } = usePartida();
  const { estado, dispatch, limpiarError } = usePartidaEngine(set);
  const { estadoAnunciando, completarAnuncio } = useVidaPerdida(estado);
  const {
    mostrarVictoria,
    cartaGanadora,
    completarVictoria,
    mostrarRevelacion,
    cartaRevelada,
    completarRevelacion,
  } = useSecuenciasDramaticas(estado);
  const navigate = useNavigate();

  function manejarSalida() {
    salirPartida();
    navigate('/configuracion-partida');
  }

  const haySecuenciaPendiente = Boolean(estadoAnunciando) || mostrarVictoria || mostrarRevelacion;

  // Aunque ya se haya llegado a Cierre, si la ÚLTIMA carta de la
  // partida todavía no terminó su secuencia, seguimos mostrando el
  // tablero normal hasta que el docente presione "Continuar".
  if (estado.fase === 'CIERRE' && !haySecuenciaPendiente) {
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
  const limites = LIMITES_INTENTOS[estado.ronda];

  // Pantera: mientras se está anunciando una vida perdida, la cajita
  // reproduce el video del nuevo estado CON sonido. En reposo, se ve
  // fija: primer fotograma si nunca perdió vidas, último fotograma del
  // estado alcanzado si ya perdió alguna.
  const panteraEstadoAmostrar = estadoAnunciando ?? (equipoActual.panteraEstado === 0 ? 1 : equipoActual.panteraEstado);
  const panteraPrimerFrame = !estadoAnunciando && equipoActual.panteraEstado === 0;

  const mostrandoControlesNormales =
    !estadoAnunciando &&
    !mostrarVictoria &&
    !mostrarRevelacion &&
    !estado.modoRobo &&
    Boolean(cartaActual) &&
    !mostrandoAdivinar;

  return (
    <div className={estadoAnunciando ? 'tablero tablero-shake' : 'tablero'}>
      <header className="tablero-header">
        <div>
          <p className="tablero-titulo">Pantera al Acecho</p>
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

      {estadoAnunciando && <EfectoImpacto />}

      <div className="tablero-cuerpo">
        <div className="tablero-jugada">
          {mostrarVictoria ? (
            <AnimacionVictoria carta={cartaGanadora} onCompleta={completarVictoria} />
          ) : mostrarRevelacion ? (
            <PanelRevelacion
              carta={cartaRevelada}
              equipoGanador={cartaRevelada.ganadorId ? estado.equipos[cartaRevelada.ganadorId] : null}
              onContinuar={completarRevelacion}
            />
          ) : estado.modoRobo && !estadoAnunciando ? (
            <PanelRobo
              equipoQueRoba={equipoActual}
              equipoOriginal={equipoOriginal}
              carta={cartaActual}
              letrasUsadas={estado.letrasUsadas}
              onEnviar={(intento) => dispatch({ type: 'ENVIAR_RESPUESTA', intento })}
            />
          ) : (
            <>
              <div className="jugada-superior">
                <PanteraDisplay
                  estado={panteraEstadoAmostrar}
                  reproducir={Boolean(estadoAnunciando)}
                  mostrarPrimerFrame={panteraPrimerFrame}
                  onSecuenciaCompleta={estadoAnunciando ? completarAnuncio : undefined}
                />
                <MazoCartas
                  mazo={estado.mazo}
                  interactivo={!estado.cartaActualId}
                  cartaElegidaId={estado.cartaActualId}
                  onElegir={(cartaId) => dispatch({ type: 'ELEGIR_CARTA', cartaId })}
                />
              </div>

              <div className="jugada-frase">
                {!cartaActual ? (
                  <p className="jugada-frase-vacia">Elige una carta para comenzar</p>
                ) : mostrandoAdivinar ? (
                  <PanelAdivinar
                    texto={cartaActual.texto}
                    letrasUsadas={estado.letrasUsadas}
                    obligatorio={forzarAdivinar}
                    onEnviar={(intento) => dispatch({ type: 'ENVIAR_RESPUESTA', intento })}
                    onCancelar={() => dispatch({ type: 'CANCELAR_MODO_ADIVINAR' })}
                  />
                ) : (
                  <ProgresoFrase texto={cartaActual.texto} letrasUsadas={estado.letrasUsadas} />
                )}
              </div>
            </>
          )}
        </div>

        <div className="tablero-equipos">
          {Object.values(estado.equipos)
            .filter((e) => estado.ordenTurnoActual.includes(e.id) || estado.fase === 'RONDA1')
            .map((equipo) => (
              <EquipoPanel
                key={equipo.id}
                equipo={equipo}
                limites={limites}
                esTurnoActual={equipo.id === equipoTurnoId}
                esQuienRoba={estado.modoRobo?.equipoId === equipo.id}
              />
            ))}
        </div>

        <div className="tablero-controles">
          {mostrandoControlesNormales && (
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
        </div>
      </div>
    </div>
  );
}
