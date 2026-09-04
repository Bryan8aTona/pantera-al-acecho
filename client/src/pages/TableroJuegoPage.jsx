import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePartida } from '../context/PartidaContext.jsx';
import { usePartidaEngine } from '../hooks/usePartidaEngine.js';
import { useSecuenciasDramaticas } from '../hooks/useSecuenciasDramaticas.js';
import { useVidaPerdida } from '../hooks/useVidaPerdida.js';
import { useAnuncioRepechaje } from '../hooks/useAnuncioRepechaje.js';
import { useSonido } from '../hooks/useSonido.js';
import { useEfectosSonido } from '../hooks/useEfectosSonido.js';
import { debeAdivinar, hayLetrasDisponiblesAciertoSeguro, letrasUnicasDeTexto } from '../motor/index.js';
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
import ZarpazoOverlay from '../components/tablero/ZarpazoOverlay.jsx';
import AnimacionVictoria from '../components/tablero/AnimacionVictoria.jsx';
import PanelRepechaje from '../components/tablero/PanelRepechaje.jsx';
import HojasDecorativas from '../components/tablero/HojasDecorativas.jsx';
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
  const { mostrarAnuncioRepechaje, completarAnuncioRepechaje } = useAnuncioRepechaje(estado);
  const { reproducir, silenciado, alternarSilencio } = useSonido();
  const [mostrarZarpazo, setMostrarZarpazo] = useState(false);
  const navigate = useNavigate();

  // El mensaje "Comienza la Ronda de Repechaje" solo se ve realmente
  // cuando ya no hay un panel de Victoria o de Revelación tapando la
  // pantalla (ver la prioridad de la cadena de ternarios más abajo). El
  // reducer cambia estado.fase en el mismo commit que resuelve la última
  // carta de Ronda 1, así que mostrarAnuncioRepechaje puede llevar rato
  // en true mientras el docente todavía está leyendo "La frase era..."
  // (o viendo la animación de Victoria, si esa última carta tuvo
  // ganador). El sonido debe sonar recién cuando el mensaje se hace
  // visible de verdad, no en el cambio de fase crudo.
  const repechajeVisible = mostrarAnuncioRepechaje && !mostrarRevelacion && !mostrarVictoria;

  useEfectosSonido(estado, { estadoAnunciando, mostrarZarpazo, mostrarVictoria, repechajeVisible });

  function manejarSalida() {
    salirPartida();
    navigate('/configuracion-partida');
  }

  // Fin del video del anuncio de la pantera. En los estados 1-4 termina
  // ahí; en el estado 5 (derrota) dispara el zarpazo a PANTALLA COMPLETA
  // y recién cuando ese termina se continúa hacia el Robo.
  function manejarFinAnuncioVideo() {
    if (estadoAnunciando === 5) {
      setMostrarZarpazo(true);
    } else {
      completarAnuncio();
    }
  }

  function manejarFinZarpazo() {
    setMostrarZarpazo(false);
    completarAnuncio();
  }

  const haySecuenciaPendiente =
    Boolean(estadoAnunciando) || mostrarZarpazo || mostrarVictoria || mostrarRevelacion || mostrarAnuncioRepechaje;

  // Aunque ya se haya llegado a Cierre, si la ÚLTIMA carta de la
  // partida todavía no terminó su secuencia, seguimos mostrando el
  // tablero normal hasta que el docente presione "Continuar".
  if (estado.fase === 'CIERRE' && !haySecuenciaPendiente) {
    return (
      <div className="tablero">
        <HojasDecorativas />
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

  // Si solo queda una letra oculta, el próximo Acierto Seguro completa la
  // frase: en ese caso el reducer reinicia `letrasUsadas` en el mismo
  // commit, así que useEfectosSonido nunca "ve" el acierto. Lo disparamos
  // acá a mano, junto al sonido de compra.
  const compraRevelaFrase =
    Boolean(cartaActual) &&
    letrasUnicasDeTexto(cartaActual.texto).filter((l) => estado.letrasUsadas[l] !== 'acierto').length === 1;

  function comprarAciertoSeguro(categoria) {
    reproducir('comprar');
    if (compraRevelaFrase) reproducir('acierto');
    dispatch({ type: 'COMPRAR_ACIERTO_SEGURO', categoria });
  }

  // Pantera: mientras se está anunciando una vida perdida, la cajita
  // reproduce el video del nuevo estado CON sonido. En reposo, se ve
  // fija: primer fotograma si nunca perdió vidas, último fotograma del
  // estado alcanzado si ya perdió alguna.
  const panteraEstadoAmostrar = estadoAnunciando ?? (equipoActual.panteraEstado === 0 ? 1 : equipoActual.panteraEstado);
  const panteraPrimerFrame = !estadoAnunciando && equipoActual.panteraEstado === 0;

  // Todos los avances de la pantera (1-4 y también el 5) se ven igual en
  // el tablero: el video corre en su cajita y el resto del tablero
  // (teclado incluido) sigue visible, solo deshabilitado durante el
  // "beat". El estado 5 añade encima el zarpazo a pantalla completa; al
  // terminar ese, se pasa al Robo (ahí sí desaparece el teclado).
  const esDerrota = estadoAnunciando === 5;
  const anunciando = Boolean(estadoAnunciando);

  const mostrandoControlesNormales =
    !mostrarVictoria &&
    !mostrarRevelacion &&
    !mostrarAnuncioRepechaje &&
    Boolean(cartaActual) &&
    (anunciando || (!estado.modoRobo && !mostrandoAdivinar));

  return (
    <div className="tablero">
      <HojasDecorativas />
      <header className="tablero-header">
        <div>
          <p className="tablero-titulo">Pantera al Acecho</p>
          <p className="tablero-fase">{NOMBRE_FASE[estado.fase]}</p>
          <h1>{set.nombre}</h1>
        </div>
        <div className="tablero-header-acciones">
          <button
            type="button"
            className="btn-secundario tablero-sonido-btn"
            onClick={alternarSilencio}
            aria-pressed={silenciado}
            title={silenciado ? 'Activar sonido' : 'Silenciar'}
          >
            {silenciado ? '🔇' : '🔊'}
          </button>
          <button type="button" className="btn-secundario" onClick={manejarSalida}>
            Salir de la partida
          </button>
        </div>
      </header>

      {estado.error && (
        <div className="tablero-error" role="alert">
          {estado.error.mensaje}
          <button type="button" onClick={limpiarError} aria-label="Cerrar">
            ✕
          </button>
        </div>
      )}

      {anunciando && <EfectoImpacto />}
      {mostrarZarpazo && <ZarpazoOverlay onCompleta={manejarFinZarpazo} />}

      <div className={anunciando && !esDerrota ? 'tablero-cuerpo tablero-cuerpo-shake' : 'tablero-cuerpo'}>
        <div className="tablero-jugada">
          {mostrarVictoria ? (
            <AnimacionVictoria carta={cartaGanadora} onCompleta={completarVictoria} />
          ) : mostrarRevelacion ? (
            <PanelRevelacion
              carta={cartaRevelada}
              equipoGanador={cartaRevelada.ganadorId ? estado.equipos[cartaRevelada.ganadorId] : null}
              onContinuar={completarRevelacion}
            />
          ) : mostrarAnuncioRepechaje ? (
            <PanelRepechaje
              equipos={estado.ordenTurnoActual.map((id) => estado.equipos[id])}
              onComenzar={completarAnuncioRepechaje}
            />
          ) : estado.modoRobo && !anunciando ? (
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
                  onSecuenciaCompleta={estadoAnunciando ? manejarFinAnuncioVideo : undefined}
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
                equipo={esDerrota ? equipoOriginal : equipoActual}
                onPedirLetra={(letra) => dispatch({ type: 'PEDIR_LETRA_LIBRE', letra })}
                deshabilitado={anunciando}
              />

              {estado.ronda === 1 && (
                <div className="acierto-seguro">
                  <button
                    type="button"
                    className="btn-secundario"
                    disabled={
                      anunciando ||
                      equipoActual.intentos.vocales <= 0 ||
                      equipoActual.saldo < COSTO_ACIERTO_SEGURO.vocal ||
                      !hayLetrasDisponiblesAciertoSeguro(cartaActual.texto, 'vocal', estado.letrasUsadas)
                    }
                    onClick={() => comprarAciertoSeguro('vocal')}
                  >
                    Acierto Seguro · Vocal ({COSTO_ACIERTO_SEGURO.vocal} 🪙)
                  </button>
                  <button
                    type="button"
                    className="btn-secundario"
                    disabled={
                      anunciando ||
                      equipoActual.intentos.consonantes <= 0 ||
                      equipoActual.saldo < COSTO_ACIERTO_SEGURO.consonante ||
                      !hayLetrasDisponiblesAciertoSeguro(cartaActual.texto, 'consonante', estado.letrasUsadas)
                    }
                    onClick={() => comprarAciertoSeguro('consonante')}
                  >
                    Acierto Seguro · Consonante ({COSTO_ACIERTO_SEGURO.consonante} 🪙)
                  </button>
                </div>
              )}

              <button
                type="button"
                className="btn-primario btn-grande"
                disabled={anunciando}
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
