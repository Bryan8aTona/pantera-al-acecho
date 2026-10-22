import { useEffect, useRef, useState } from 'react';
import { COLORES_EQUIPO } from './tablero/coloresEquipo.js';
import './DemoPartidaModal.css';

// Demostración en bucle de cómo se juega, que se muestra antes de que
// arranque la partida (ConfiguracionPartidaPage). No usa el motor real:
// es un guion fijo de "fotos" del tablero, una por paso, para que los
// alumnos vean un turno ganado (letras, fallo, Acierto Seguro, Modo
// Adivinar) y uno perdido (pantera hasta el zarpazo y Robo).

const TECLADO = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

const NOMBRE_EQUIPO = { rojo: 'Rojo', azul: 'Azul', amarillo: 'Amarillo' };

export const PASOS = [
  // Turno ganado
  { equipo: 'rojo', frase: 'LA SELVA', saldo: 200, eligiendo: true, ms: 2400,
    leyenda: 'El Equipo Rojo elige una carta del mazo. Detrás hay una frase oculta y un premio.' },
  { equipo: 'rojo', frase: 'LA SELVA', saldo: 200, aciertos: 'A', pedida: 'A', tipo: 'acierto', ms: 2600,
    leyenda: 'Piden la «A»: ¡está en la frase! Aparece en todos sus espacios.' },
  { equipo: 'rojo', frase: 'LA SELVA', saldo: 200, aciertos: 'A', fallos: 'T', pantera: 1, pedida: 'T', tipo: 'fallo', ms: 2800,
    leyenda: 'Piden la «T»: no está. Cada fallo acerca a la pantera un paso.' },
  { equipo: 'rojo', frase: 'LA SELVA', saldo: 200, aciertos: 'AS', fallos: 'T', pantera: 1, pedida: 'S', tipo: 'acierto', ms: 2400,
    leyenda: 'Piden la «S»: ¡otro acierto!' },
  { equipo: 'rojo', frase: 'LA SELVA', saldo: 180, aciertos: 'ASL', fallos: 'T', pantera: 1, pedida: 'L', tipo: 'compra', ms: 2800,
    leyenda: 'Acierto Seguro: pagan 20 🪙 y el sistema les da una consonante correcta.' },
  { equipo: 'rojo', frase: 'LA SELVA', saldo: 180, aciertos: 'ASL', fallos: 'T', pantera: 1, intento: 'LA SELVA', ms: 2800,
    leyenda: 'Creen saberla: el profesor abre el Modo Adivinar y escribe la respuesta del equipo.' },
  { equipo: 'rojo', frase: 'LA SELVA', saldo: 270, aciertos: 'ASLEV', fallos: 'T', pantera: 1, efecto: 'victoria', ms: 3200,
    leyenda: '¡Correcto! Descubren el tesoro y ganan el premio de la carta: +90 🪙.' },

  // Turno perdido
  { equipo: 'azul', frase: 'TUCAN', saldo: 200, fallos: 'O', pantera: 1, pedida: 'O', tipo: 'fallo', ms: 2200,
    leyenda: 'Turno del Equipo Azul. Piden la «O»: fallo.' },
  { equipo: 'azul', frase: 'TUCAN', saldo: 200, fallos: 'OI', pantera: 2, pedida: 'I', tipo: 'fallo', ms: 1600,
    leyenda: 'Otro fallo… la pantera asoma la cabeza.' },
  { equipo: 'azul', frase: 'TUCAN', saldo: 200, fallos: 'OIR', pantera: 3, pedida: 'R', tipo: 'fallo', ms: 1600,
    leyenda: 'Y otro más: ya se ve su lomo.' },
  { equipo: 'azul', frase: 'TUCAN', saldo: 200, fallos: 'OIRS', pantera: 4, pedida: 'S', tipo: 'fallo', ms: 2200,
    leyenda: 'Está lista para saltar: ¡un fallo más y ataca!' },
  { equipo: 'azul', frase: 'TUCAN', saldo: 200, fallos: 'OIRSL', pantera: 5, pedida: 'L', tipo: 'fallo', efecto: 'zarpazo', ms: 2600,
    leyenda: '¡Zarpazo! Al quinto fallo el equipo pierde la carta.' },
  { equipo: 'azul', frase: 'TUCAN', saldo: 200, fallos: 'OIRSL', pantera: 5, efecto: 'robo', ms: 3600,
    leyenda: 'Robo: el siguiente equipo tiene una sola oportunidad de decir la frase completa y llevarse el premio.' },
];

function Pantera({ estado }) {
  return (
    <div className={`demo-pantera demo-pantera-${estado}`} aria-hidden="true">
      {estado === 1 && (
        <span className="demo-pantera-ojos">
          <span />
          <span />
        </span>
      )}
      {estado >= 2 && <span className="demo-pantera-figura">🐆</span>}
    </div>
  );
}

export default function DemoPartidaModal({ onCerrar }) {
  const [indice, setIndice] = useState(0);
  const botonRef = useRef(null);
  const paso = PASOS[indice];

  // Avanza el guion en bucle mientras el modal esté abierto.
  useEffect(() => {
    const temporizador = setTimeout(() => setIndice((i) => (i + 1) % PASOS.length), paso.ms);
    return () => clearTimeout(temporizador);
  }, [indice, paso.ms]);

  useEffect(() => {
    botonRef.current?.focus();
    function alPresionarTecla(e) {
      if (e.key === 'Escape') onCerrar();
    }
    document.addEventListener('keydown', alPresionarTecla);
    return () => document.removeEventListener('keydown', alPresionarTecla);
  }, [onCerrar]);

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
            <h2 id="demo-titulo">¿Cómo se juega?</h2>
            <p>Así se ve un turno en Pantera al Acecho</p>
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
              <span className={saldoCambia ? 'demo-equipo-saldo cambia' : 'demo-equipo-saldo'}>
                🪙 {paso.saldo}
              </span>
              <span className="demo-etiqueta demo-etiqueta-turno">En turno</span>
            </div>

            <div className="demo-pantera-caja">
              <Pantera estado={pantera} />
              <div className="demo-puntos">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className={n <= pantera ? 'demo-punto lleno' : 'demo-punto'} />
                ))}
              </div>
            </div>

            {paso.efecto === 'robo' && (
              <div className="demo-equipo demo-equipo-robo" style={{ '--color-equipo': COLORES_EQUIPO.amarillo }}>
                <span className="demo-equipo-tab">Equipo Amarillo</span>
                <span className="demo-equipo-saldo">🪙 200</span>
                <span className="demo-etiqueta demo-etiqueta-robo">Puede robar</span>
              </div>
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
                            paso.efecto === 'robo' && !aciertos.includes(letra) && 'robo',
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
              <span key={indice} className={`demo-burbuja demo-burbuja-${paso.tipo}`}>
                {paso.tipo === 'compra' ? `Acierto Seguro · ${paso.pedida}` : `¿${paso.pedida}?`}
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
              <span className="demo-victoria-icono">🏆</span>
              <strong>¡Tesoro descubierto!</strong>
              <span>+90 🪙</span>
            </div>
          )}
          {paso.efecto === 'zarpazo' && (
            <div className="demo-zarpazo">
              <img src="/assets/zarpazo-garra.png" alt="" />
            </div>
          )}
        </div>

        <p className="demo-leyenda" key={`leyenda-${indice}`}>
          {paso.leyenda}
        </p>

        <div className="demo-progreso" aria-hidden="true">
          {PASOS.map((_, i) => (
            <span key={i} className={i === indice ? 'activo' : i < indice ? 'hecho' : ''} />
          ))}
        </div>

        <footer className="demo-acciones">
          <button ref={botonRef} type="button" className="btn-primario" onClick={onCerrar}>
            Entendido, ¡a jugar!
          </button>
        </footer>
      </div>
    </div>
  );
}
