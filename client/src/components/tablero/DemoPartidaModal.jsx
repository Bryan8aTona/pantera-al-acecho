import { useCallback, useEffect, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import victoriaAnimacion from '../../assets/lottie/victoria.json';
import { COLORES_EQUIPO } from './coloresEquipo.js';
import { RUTA_VIDEOS } from './PanteraDisplay.jsx';
import './DemoPartidaModal.css';

// Demostración de cómo se juega, encima del Tablero al arrancar la
// partida (TableroJuegoPage). No usa el motor real: es un guion fijo de
// "fotos" del tablero, una por paso, con un turno ganado (letras, fallo,
// Acierto Seguro, Modo Adivinar) y uno perdido (pantera hasta el zarpazo
// y Robo). No avanza sola: el docente pasa de un paso a otro (bolitas,
// flechas del teclado o botones) al ritmo de su explicación.

const TECLADO = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

const NOMBRE_EQUIPO = { rojo: 'Rojo', azul: 'Azul', amarillo: 'Amarillo' };

export const PASOS = [
  // Turno ganado
  { equipo: 'rojo', frase: 'LA SELVA', saldo: 200, eligiendo: true,
    leyenda: 'Cuando es tu turno, eliges una carta del mazo. Detrás hay una frase escondida y un premio en monedas.' },
  { equipo: 'rojo', frase: 'LA SELVA', saldo: 200, aciertos: 'A', pedida: 'A', tipo: 'acierto',
    leyenda: 'Si pides la A y está en la frase, aparece en todos los lugares donde va.' },
  { equipo: 'rojo', frase: 'LA SELVA', saldo: 200, aciertos: 'A', fallos: 'T', pantera: 1, pedida: 'T', tipo: 'fallo',
    leyenda: 'Si pides la T y no está, la pantera se acerca un poco más.' },
  { equipo: 'rojo', frase: 'LA SELVA', saldo: 200, aciertos: 'AS', fallos: 'T', pantera: 1, pedida: 'S', tipo: 'acierto',
    leyenda: 'Pides la S y también está. ¡Vas bien!' },
  { equipo: 'rojo', frase: 'LA SELVA', saldo: 180, aciertos: 'ASL', fallos: 'T', pantera: 1, pedida: 'L', tipo: 'compra',
    leyenda: '¿No se te ocurre ninguna? Con Acierto Seguro pagas 20 monedas y el juego te da una consonante que sí está.' },
  { equipo: 'rojo', frase: 'LA SELVA', saldo: 180, aciertos: 'ASL', fallos: 'T', pantera: 1, intento: 'LA SELVA',
    leyenda: '¿Ya sabes cuál es la frase? Pide adivinarla y dila completa.' },
  { equipo: 'rojo', frase: 'LA SELVA', saldo: 270, aciertos: 'ASLEV', fallos: 'T', pantera: 1, efecto: 'victoria',
    leyenda: '¡Le atinaste! Te llevas el premio de la carta: 90 monedas más.' },

  // Turno perdido
  { equipo: 'azul', frase: 'TUCAN', saldo: 200, fallos: 'O', pantera: 1, pedida: 'O', tipo: 'fallo',
    leyenda: 'Ahora juega el Equipo Azul. Si pides la O y no está, la pantera empieza a acercarse.' },
  { equipo: 'azul', frase: 'TUCAN', saldo: 200, fallos: 'OI', pantera: 2, pedida: 'I', tipo: 'fallo',
    leyenda: 'Otro fallo y la pantera ya asoma la cabeza.' },
  { equipo: 'azul', frase: 'TUCAN', saldo: 200, fallos: 'OIR', pantera: 3, pedida: 'R', tipo: 'fallo',
    leyenda: 'Con cada fallo se acerca más.' },
  { equipo: 'azul', frase: 'TUCAN', saldo: 200, fallos: 'OIRS', pantera: 4, pedida: 'S', tipo: 'fallo',
    leyenda: '¡Cuidado! Está lista para saltar. Un fallo más y te ataca.' },
  { equipo: 'azul', frase: 'TUCAN', saldo: 200, fallos: 'OIRSL', pantera: 5, pedida: 'L', tipo: 'fallo', efecto: 'zarpazo',
    leyenda: 'Al quinto fallo, ¡zarpazo! Pierdes la carta.' },
  { equipo: 'azul', frase: 'TUCAN', saldo: 200, fallos: 'OIRSL', pantera: 5, efecto: 'robo',
    leyenda: 'Cuando un equipo pierde, el siguiente puede robar la frase: tiene una sola oportunidad de decirla completa y quedarse con el premio.' },
];

// Los mismos videos de la pantera que usa el Tablero, sin sonido. En un
// paso de fallo el video del nuevo estado se reproduce desde el inicio;
// en cualquier otro se queda quieto en su último fotograma (o en el
// primero del estado 1, si el equipo todavía no ha fallado).
function PanteraDemo({ estado, reproducir, pasoId, onFin }) {
  const videoRef = useRef(null);
  const ruta = RUTA_VIDEOS[Math.max(estado, 1)];

  const colocar = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (reproducir) {
        v.currentTime = 0;
        const p = v.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } else {
        v.pause();
        v.currentTime = estado === 0 ? 0 : v.duration || 0;
      }
    } catch {
      /* jsdom / metadata aún no lista: se reintenta en onLoadedMetadata */
    }
  }, [estado, reproducir]);

  // pasoId: al volver a un mismo paso de fallo, el video se repite.
  useEffect(colocar, [colocar, pasoId, ruta]);

  return (
    <div className="demo-pantera" aria-hidden="true">
      <video
        key={ruta}
        ref={videoRef}
        src={ruta}
        muted
        playsInline
        preload="auto"
        onLoadedMetadata={colocar}
        onEnded={onFin}
        className="demo-pantera-video"
      />
    </div>
  );
}

export default function DemoPartidaModal({ onCerrar }) {
  const [indice, setIndice] = useState(0);
  // Índice del paso cuyo zarpazo ya terminó su video (la garra se ve
  // solo en ese paso; comparar con `indice` evita un fotograma de garra
  // al salir de él).
  const [garraEn, setGarraEn] = useState(null);
  const botonRef = useRef(null);
  const paso = PASOS[indice];

  // Circular: después del último paso vuelve al primero, y viceversa.
  const irA = useCallback((i) => {
    setIndice((i + PASOS.length) % PASOS.length);
  }, []);

  useEffect(() => {
    setGarraEn(null);
  }, [indice]);

  useEffect(() => {
    botonRef.current?.focus();
  }, []);

  useEffect(() => {
    function alPresionarTecla(e) {
      if (e.key === 'Escape') onCerrar();
      else if (e.key === 'ArrowRight') irA(indice + 1);
      else if (e.key === 'ArrowLeft') irA(indice - 1);
    }
    document.addEventListener('keydown', alPresionarTecla);
    return () => document.removeEventListener('keydown', alPresionarTecla);
  }, [onCerrar, irA, indice]);

  const aciertos = paso.aciertos ?? '';
  const fallos = paso.fallos ?? '';
  const pantera = paso.pantera ?? 0;
  const resuelta = paso.efecto === 'victoria';
  const saldoCambia = indice > 0 && PASOS[indice - 1].saldo !== paso.saldo;

  function estadoTecla(letra) {
    if (aciertos.includes(letra)) return 'acierto';
    if (fallos.includes(letra)) return 'fallo';
    return '';
  }

  return (
    <div
      className="demo-fondo"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div className="demo-modal" role="dialog" aria-modal="true" aria-labelledby="demo-titulo">
        <header className="demo-cabecera">
          <div>
            <p className="demo-kicker">Antes de empezar</p>
            <h2 id="demo-titulo">¿Cómo se juega?</h2>
          </div>
          <button type="button" className="demo-cerrar" onClick={onCerrar} aria-label="Cerrar demostración">
            ✕
          </button>
        </header>

        {/* Cada fallo vuelve a montar el escenario para que la sacudida
            se repita aunque haya varios fallos seguidos. */}
        <div
          key={paso.tipo === 'fallo' ? `escenario-${indice}` : 'escenario'}
          className={paso.tipo === 'fallo' && !paso.efecto ? 'demo-escenario demo-sacudida' : 'demo-escenario'}
          aria-hidden="true"
        >
          <div className="demo-superior">
            <div className="demo-equipo" style={{ '--color-equipo': COLORES_EQUIPO[paso.equipo] }}>
              <span className="demo-equipo-tab">Equipo {NOMBRE_EQUIPO[paso.equipo]}</span>
              <span className={saldoCambia ? 'demo-equipo-saldo cambia' : 'demo-equipo-saldo'}>🪙 {paso.saldo}</span>
              <span className="demo-etiqueta demo-etiqueta-turno">En turno</span>
            </div>

            <div className="demo-pantera-caja">
              <PanteraDemo
                estado={pantera}
                reproducir={paso.tipo === 'fallo'}
                pasoId={indice}
                onFin={() => {
                  if (paso.efecto === 'zarpazo') setGarraEn(indice);
                }}
              />
              <div className="demo-puntos">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className={n <= pantera ? 'demo-punto lleno' : 'demo-punto'} />
                ))}
              </div>
            </div>

            {paso.efecto === 'robo' ? (
              <div className="demo-equipo demo-equipo-robo" style={{ '--color-equipo': COLORES_EQUIPO.amarillo }}>
                <span className="demo-equipo-tab">Equipo Amarillo</span>
                <span className="demo-equipo-saldo">🪙 200</span>
                <span className="demo-etiqueta demo-etiqueta-robo">¡Puede robar!</span>
              </div>
            ) : (
              <div className="demo-equipo demo-equipo-hueco" />
            )}
          </div>

          <div className="demo-centro">
            {paso.eligiendo ? (
              <div className="demo-mazo">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className={n === 3 ? 'demo-carta elegida' : 'demo-carta'}>
                    <img src="/assets/cartas/carta-reverso.png" alt="" />
                    <span>{n}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={paso.intento ? 'demo-frase demo-frase-intento' : 'demo-frase'}>
                {paso.frase.split(' ').map((palabra, i) => (
                  <div key={i} className="demo-palabra">
                    {palabra.split('').map((letra, j) => {
                      const visible = resuelta || aciertos.includes(letra);
                      const tecleada = paso.intento && !aciertos.includes(letra);
                      const nueva = paso.pedida === letra && paso.tipo !== 'fallo';
                      return (
                        <span
                          key={j}
                          className={[
                            'demo-celda',
                            visible && 'visible',
                            tecleada && 'tecleada',
                            nueva && 'nueva',
                            paso.efecto === 'robo' && 'robo',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          style={tecleada ? { animationDelay: `${(i * 4 + j) * 140}ms` } : undefined}
                        >
                          {visible || tecleada ? letra : ''}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {paso.pedida && (
              <span key={`burbuja-${indice}`} className={`demo-burbuja demo-burbuja-${paso.tipo}`}>
                {paso.tipo === 'compra' ? `Acierto Seguro: ${paso.pedida}` : `¿${paso.pedida}?`}
              </span>
            )}
            {paso.intento && <span className="demo-burbuja demo-burbuja-adivinar">Modo Adivinar</span>}
          </div>

          <div className="demo-teclado">
            {TECLADO.map((letra) => (
              <span
                key={letra}
                className={['demo-tecla', estadoTecla(letra), paso.pedida === letra && 'pulsada'].filter(Boolean).join(' ')}
              >
                {letra}
              </span>
            ))}
          </div>

          {resuelta && (
            <div className="demo-victoria">
              <Lottie animationData={victoriaAnimacion} loop={false} className="demo-victoria-lottie" />
              <strong>¡+90 monedas!</strong>
            </div>
          )}
          {garraEn === indice && (
            <div className="demo-zarpazo">
              <img src="/assets/zarpazo-garra.png" alt="" />
            </div>
          )}
        </div>

        <p className="demo-leyenda" key={`leyenda-${indice}`}>
          {paso.leyenda}
        </p>

        <nav className="demo-navegacion" aria-label="Pasos de la demostración">
          <button type="button" className="demo-nav-btn" onClick={() => irA(indice - 1)} aria-label="Paso anterior">
            ‹
          </button>
          <div className="demo-progreso">
            {PASOS.map((_, i) => (
              <button
                key={i}
                type="button"
                className={i === indice ? 'activo' : i < indice ? 'hecho' : ''}
                onClick={() => irA(i)}
                aria-label={`Paso ${i + 1}`}
                aria-current={i === indice ? 'step' : undefined}
              />
            ))}
          </div>
          <button type="button" className="demo-nav-btn" onClick={() => irA(indice + 1)} aria-label="Paso siguiente">
            ›
          </button>
        </nav>

        <footer className="demo-acciones">
          <button ref={botonRef} type="button" className="btn-primario" onClick={onCerrar}>
            ¡Iniciar partida!
          </button>
        </footer>
      </div>
    </div>
  );
}
