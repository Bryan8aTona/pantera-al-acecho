import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePartida } from '../context/PartidaContext.jsx';
import { usePartidaEngine } from '../hooks/usePartidaEngine.js';
import { useSecuenciasDramaticas } from '../hooks/useSecuenciasDramaticas.js';
import { useVidaPerdida } from '../hooks/useVidaPerdida.js';
import { useAnuncioRepechaje } from '../hooks/useAnuncioRepechaje.js';
import { useSonido } from '../hooks/useSonido.js';
import { useEfectosSonido } from '../hooks/useEfectosSonido.js';
import {
  debeAdivinar,
  impedimentoAciertoSeguro,
  letrasUnicasDeTexto,
  equipoEnTurnoActual,
  equipoDelTurnoNormal,
  cartaEnJuego,
  hayDerrotaPendiente,
} from '../motor/index.ts';
import { COSTO_ACIERTO_SEGURO, LIMITES_INTENTOS, FASES, PANTERA_ESTADO_DERROTA } from '../motor/constantes.ts';
import EquipoPanel from '../components/tablero/EquipoPanel.jsx';
import Teclado from '../components/tablero/Teclado.jsx';
import MazoCartas from '../components/tablero/MazoCartas.jsx';
import ProgresoFrase from '../components/tablero/ProgresoFrase.jsx';
import PanelRobo from '../components/tablero/PanelRobo.jsx';
import PanelCierre from '../components/tablero/PanelCierre.jsx';
import PanelAdivinar from '../components/tablero/PanelAdivinar.jsx';
import PanelRevelacion from '../components/tablero/PanelRevelacion.jsx';
import PanteraDisplay, { precargarPantera } from '../components/tablero/PanteraDisplay.jsx';
import EfectoImpacto from '../components/tablero/EfectoImpacto.jsx';
import ZarpazoOverlay from '../components/tablero/ZarpazoOverlay.jsx';
import AnimacionVictoria from '../components/tablero/AnimacionVictoria.jsx';
import BolsaTesoro from '../components/tablero/BolsaTesoro.jsx';
import MedidorVidas from '../components/tablero/MedidorVidas.jsx';
import { COLORES_EQUIPO } from '../components/tablero/coloresEquipo.js';
import PanelRepechaje from '../components/tablero/PanelRepechaje.jsx';
import HojasDecorativas from '../components/tablero/HojasDecorativas.jsx';
import DemoPartidaModal from '../components/tablero/DemoPartidaModal.jsx';
import './TableroJuegoPage.css';

const NOMBRE_FASE = {
  [FASES.RONDA1]: 'Ronda 1',
  [FASES.REPECHAJE]: 'Ronda de Repechaje',
  [FASES.CIERRE]: 'Cierre',
};

const ETIQUETA_CATEGORIA = { vocal: 'Vocal', consonante: 'Consonante' };

// Tensión del Tablero según las vidas que le quedan al equipo en turno:
// 0 = tranquilo, 1 = alerta (2 vidas), 2 = peligro (1 vida o el zarpazo).
const CLASE_TENSION = ['', ' tension-alerta', ' tension-peligro'];

function nivelDeTension(vidas) {
  if (vidas <= 1) return 2;
  if (vidas === 2) return 1;
  return 0;
}

// Mientras haya tensión, late un corazón (~67 por minuto, igual con 2
// vidas que con la última). Calla durante el video de la pantera.
// El borde rojo y los corazones laten con él: MedidorVidas.css usa el
// mismo periodo y el mismo retraso inicial, y arranca con la clase
// .latiendo, que se pone en el mismo render. El primer golpe se difiere
// también porque en el render en que sube la pantera el anuncio aún no
// arranca (lo levanta useVidaPerdida un render después) y ese cambio
// cancela el temporizador.
const PERIODO_LATIDO_MS = 900;
const RETRASO_LATIDO_MS = 700;

function useLatidoDeTension(nivel, pausado, reproducir) {
  useEffect(() => {
    if (!nivel || pausado) return undefined;
    // Cada golpe se programa contra el reloj desde el arranque (no con
    // setInterval, que se va retrasando) para no desfasarse del CSS.
    const arranque = performance.now() + RETRASO_LATIDO_MS;
    let golpe = 0;
    let temporizador;
    const programar = () => {
      temporizador = setTimeout(
        () => {
          reproducir('latido', { volumen: 0.55 });
          golpe += 1;
          programar();
        },
        Math.max(0, arranque + golpe * PERIODO_LATIDO_MS - performance.now()),
      );
    };
    programar();
    return () => clearTimeout(temporizador);
  }, [nivel, pausado, reproducir]);
}

export default function TableroJuegoPage() {
  const { set, esInvitado, salirPartida } = usePartida();
  const { estado, dispatch, limpiarError } = usePartidaEngine(set);
  const { estadoAnunciando, completarAnuncio } = useVidaPerdida(estado);
  const { mostrarVictoria, cartaGanadora, completarVictoria, mostrarRevelacion, cartaRevelada, completarRevelacion } =
    useSecuenciasDramaticas(estado);
  const { mostrarAnuncioRepechaje, completarAnuncioRepechaje } = useAnuncioRepechaje(estado);
  const { reproducir, silenciado, alternarSilencio } = useSonido();
  const [mostrarZarpazo, setMostrarZarpazo] = useState(false);
  // Demostración de cómo se juega: tapa el tablero al arrancar y la
  // partida no se puede operar hasta que el docente la cierra.
  const [mostrarDemo, setMostrarDemo] = useState(true);
  const cerrarDemo = useCallback(() => setMostrarDemo(false), []);

  useEffect(() => {
    precargarPantera();
  }, []);
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

  const equipoDelTurno = equipoDelTurnoNormal(estado);
  const hayCartaEnJuego = Boolean(cartaEnJuego(estado));
  useLatidoDeTension(
    hayCartaEnJuego && equipoDelTurno && (!estado.modoRobo || estadoAnunciando)
      ? nivelDeTension(PANTERA_ESTADO_DERROTA - equipoDelTurno.panteraEstado)
      : 0,
    Boolean(estadoAnunciando) || mostrarZarpazo,
    reproducir,
  );

  function manejarSalida() {
    salirPartida();
    // El invitado no tiene sesión: Configuración lo mandaría al login.
    navigate(esInvitado ? '/' : '/configuracion-partida');
  }

  // Fin del video del anuncio de la pantera. En los estados 1-4 termina
  // ahí; en el estado 5 (derrota) dispara el zarpazo a PANTALLA COMPLETA
  // y recién cuando ese termina se continúa hacia el Robo (Ronda 1) o se
  // cierra la carta sin ganador (Ronda 2, que no tiene Robo).
  //
  // Ambos manejadores se memorizan: ZarpazoOverlay reinicia su
  // temporizador si cambia la identidad de `onCompleta`.
  const manejarFinAnuncioVideo = useCallback(() => {
    if (estadoAnunciando === PANTERA_ESTADO_DERROTA) {
      setMostrarZarpazo(true);
    } else {
      completarAnuncio();
    }
  }, [estadoAnunciando, completarAnuncio]);

  // Carta cuyo zarpazo ya se mostró completo (ver derrotaSinAnunciar).
  const [zarpazoCumplidoEn, setZarpazoCumplidoEn] = useState(null);
  const derrotaPendiente = hayDerrotaPendiente(estado);
  const idCartaEnJuego = cartaEnJuego(estado)?.id ?? null;
  const manejarFinZarpazo = useCallback(() => {
    setMostrarZarpazo(false);
    setZarpazoCumplidoEn(idCartaEnJuego);
    completarAnuncio();
    if (derrotaPendiente) dispatch({ type: 'CONFIRMAR_DERROTA' });
  }, [derrotaPendiente, idCartaEnJuego, completarAnuncio, dispatch]);

  const haySecuenciaPendiente =
    Boolean(estadoAnunciando) || mostrarZarpazo || mostrarVictoria || mostrarRevelacion || mostrarAnuncioRepechaje;

  // Aunque ya se haya llegado a Cierre, si la ÚLTIMA carta de la
  // partida todavía no terminó su secuencia, seguimos mostrando el
  // tablero normal hasta que el docente presione "Continuar".
  if (estado.fase === FASES.CIERRE && !haySecuenciaPendiente) {
    return (
      <div className="tablero">
        <HojasDecorativas />
        <PanelCierre cierre={estado.cierre} onSalir={manejarSalida} />
      </div>
    );
  }

  const equipoOriginal = equipoDelTurnoNormal(estado);
  const equipoActual = equipoEnTurnoActual(estado);
  const cartaActual = cartaEnJuego(estado);

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
  const esDerrota = estadoAnunciando === PANTERA_ESTADO_DERROTA;
  const anunciando = Boolean(estadoAnunciando);
  // Con la 5ª letra fallada, el reducer activa el Robo en ese mismo commit,
  // pero el anuncio de la pantera arranca un render después (el desfase de
  // CLAUDE.md). Sin esto, ese render montaba un instante la pantalla de
  // Robo y, al volver a la jugada, la carta y la bolsa se montaban de
  // nuevo (animación y sonido otra vez). Hasta que termina el zarpazo se
  // trata como si ya estuviera anunciándose.
  const derrotaSinAnunciar =
    estado.modoRobo && equipoOriginal.panteraEstado >= PANTERA_ESTADO_DERROTA && zarpazoCumplidoEn !== cartaActual?.id;
  const enJugada = anunciando || derrotaSinAnunciar;

  // Vidas del equipo dueño del turno (en el zarpazo de Ronda 1 el robo ya
  // empezó, pero el medidor sigue mostrando a quien acaba de perder).
  const mostrarVidas = Boolean(cartaActual) && (!estado.modoRobo || enJugada);
  const tension =
    mostrarVidas && !mostrarVictoria && !mostrarRevelacion
      ? nivelDeTension(PANTERA_ESTADO_DERROTA - equipoOriginal.panteraEstado)
      : 0;
  // Late (sonido, borde y corazones) salvo mientras se ve la pantera.
  const latiendo = tension > 0 && !anunciando && !mostrarZarpazo;

  const mostrandoControlesNormales =
    !mostrarVictoria &&
    !mostrarRevelacion &&
    !mostrarAnuncioRepechaje &&
    Boolean(cartaActual) &&
    (enJugada || (!estado.modoRobo && !mostrandoAdivinar));

  // Mientras la demostración está abierta, el tablero de fondo queda
  // inerte (ni clic ni Tab llegan a él). React 18 no conoce `inert`,
  // así que se pasa como atributo de texto.
  const fondoInerte = mostrarDemo ? { inert: '' } : {};

  return (
    <div className={`tablero${CLASE_TENSION[tension]}${latiendo ? ' latiendo' : ''}`}>
      <HojasDecorativas />
      {mostrarDemo && <DemoPartidaModal onCerrar={cerrarDemo} />}
      <header className="tablero-header" {...fondoInerte}>
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

      <div
        className={anunciando && !esDerrota ? 'tablero-cuerpo tablero-cuerpo-shake' : 'tablero-cuerpo'}
        {...fondoInerte}
      >
        <div className="tablero-jugada">
          {mostrarVictoria ? (
            <AnimacionVictoria
              carta={cartaGanadora}
              equipo={estado.equipos[cartaGanadora.ganadorId]}
              onCompleta={completarVictoria}
            />
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
          ) : estado.modoRobo && !enJugada ? (
            <>
              <BolsaTesoro
                key={`robo-${cartaActual.id}`}
                bolsa={cartaActual.bolsa}
                bolsaInicial={cartaActual.bolsaInicial}
                entrada="voltear"
                colorEquipo={COLORES_EQUIPO[equipoActual.id]}
                etiqueta={`¡${equipoActual.nombre} va por la bolsa!`}
              />
              <PanelRobo
                equipoQueRoba={equipoActual}
                equipoOriginal={equipoOriginal}
                carta={cartaActual}
                letrasUsadas={estado.letrasUsadas}
                onEnviar={(intento) => dispatch({ type: 'ENVIAR_RESPUESTA', intento })}
                onRendirse={() => dispatch({ type: 'RENDIRSE' })}
              />
            </>
          ) : (
            <>
              <div className={cartaActual ? 'jugada-superior con-carta' : 'jugada-superior'}>
                <div className="pantera-zona">
                  {mostrarVidas && <MedidorVidas errores={equipoOriginal.panteraEstado} />}
                  <PanteraDisplay
                    estado={panteraEstadoAmostrar}
                    reproducir={Boolean(estadoAnunciando)}
                    mostrarPrimerFrame={panteraPrimerFrame}
                    onSecuenciaCompleta={estadoAnunciando ? manejarFinAnuncioVideo : undefined}
                  />
                </div>
                <MazoCartas
                  mazo={estado.mazo}
                  interactivo={!estado.cartaActualId}
                  cartaElegidaId={estado.cartaActualId}
                  onElegir={(cartaId) => dispatch({ type: 'ELEGIR_CARTA', cartaId })}
                />
                {cartaActual && (
                  <BolsaTesoro key={cartaActual.id} bolsa={cartaActual.bolsa} bolsaInicial={cartaActual.bolsaInicial} />
                )}
              </div>

              <div className="jugada-frase">
                {!cartaActual ? (
                  <p className="jugada-frase-vacia">Elige una carta para comenzar</p>
                ) : mostrandoAdivinar && !enJugada ? (
                  // Si la última letra fue un fallo, el panel espera a que
                  // termine el video: mientras tanto el teclado sigue en
                  // pantalla y los dos juntos no caben (el Tablero desbordaba).
                  <PanelAdivinar
                    texto={cartaActual.texto}
                    letrasUsadas={estado.letrasUsadas}
                    obligatorio={forzarAdivinar}
                    onEnviar={(intento) => dispatch({ type: 'ENVIAR_RESPUESTA', intento })}
                    onCancelar={() => dispatch({ type: 'CANCELAR_MODO_ADIVINAR' })}
                    onRendirse={() => dispatch({ type: 'RENDIRSE' })}
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
            .filter((e) => estado.ordenTurnoActual.includes(e.id) || estado.fase === FASES.RONDA1)
            .map((equipo) => (
              <EquipoPanel
                key={equipo.id}
                equipo={equipo}
                limites={limites}
                esTurnoActual={equipo.id === equipoOriginal?.id}
                esQuienRoba={estado.modoRobo?.equipoId === equipo.id}
                retenerSaldo={mostrarVictoria}
              />
            ))}
        </div>

        <div className="tablero-controles">
          {mostrandoControlesNormales && (
            <>
              <button
                type="button"
                className="btn-primario tablero-btn-adivinar"
                disabled={enJugada}
                onClick={() => dispatch({ type: 'ACTIVAR_MODO_ADIVINAR' })}
              >
                Adivinar Frase
              </button>

              <Teclado
                letrasUsadas={estado.letrasUsadas}
                equipo={derrotaSinAnunciar ? equipoOriginal : equipoActual}
                onPedirLetra={(letra) => dispatch({ type: 'PEDIR_LETRA_LIBRE', letra })}
                deshabilitado={enJugada}
              />

              {estado.ronda === 1 && (
                <div className="acierto-seguro">
                  {['vocal', 'consonante'].map((categoria) => (
                    <button
                      key={categoria}
                      type="button"
                      className="btn-secundario"
                      disabled={
                        enJugada ||
                        Boolean(
                          impedimentoAciertoSeguro(equipoActual, categoria, cartaActual.texto, estado.letrasUsadas),
                        )
                      }
                      onClick={() => comprarAciertoSeguro(categoria)}
                    >
                      Acierto Seguro · {ETIQUETA_CATEGORIA[categoria]} (−{COSTO_ACIERTO_SEGURO[categoria]} 🪙 a la
                      bolsa)
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
