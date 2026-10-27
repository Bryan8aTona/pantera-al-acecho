import { useEffect, useRef } from 'react';
import { reproducirSonido } from '../../sonido/gestorSonido.js';
import { COLORES_EQUIPO } from './coloresEquipo.js';
import { SacoMonedas, Polilla } from './SacoMonedas.jsx';
import { useContadorAnimado, prefiereMenosMovimiento } from './useContadorAnimado.js';
import './AnimacionVictoria.css';

// Momento en que la bolsa revienta y empiezan a salir las monedas.
const REVIENTA_MS = 900;
const MONEDAS_FUENTE = 26;

// Trayectoria de cada moneda de la fuente: un abanico hacia arriba con
// alturas y giros variados. Determinista (sin Math.random) para que el
// render sea puro.
function monedasDeLaFuente() {
  return Array.from({ length: MONEDAS_FUENTE }, (_, i) => {
    const t = i / (MONEDAS_FUENTE - 1);
    const ruido = Math.sin(i * 12.9898) * 0.5 + 0.5;
    return {
      dx: Math.round((t - 0.5) * 520 + (ruido - 0.5) * 60),
      alto: Math.round(160 + ruido * 150),
      caida: Math.round(140 + ((i * 37) % 90)),
      retraso: Math.round((i % 7) * 70 + ruido * 120),
      tam: (0.8 + ruido * 0.6).toFixed(2),
    };
  });
}

const MONEDAS = monedasDeLaFuente();

// El equipo adivinó la frase y se lleva la bolsa: el costal cae al centro,
// tiembla, revienta y suelta una fuente de monedas mientras el premio
// cuenta hacia arriba. Con la bolsa vacía sale la polilla.
//
// No se cierra sola: se queda celebrando hasta que el docente da clic (o
// Enter/Espacio), y recién entonces las monedas viajan al saldo del
// equipo. Toma el foco al aparecer para que el teclado funcione de una.
export default function AnimacionVictoria({ carta, equipo, onCompleta }) {
  const premio = carta.bolsa;
  const vacia = premio === 0;
  const mostrado = useContadorAnimado(premio, { desde: 0, retraso: REVIENTA_MS, duracion: 1600 });

  const escenaRef = useRef(null);

  useEffect(() => {
    escenaRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const timers = [];
    if (!vacia) {
      timers.push(setTimeout(() => reproducirSonido('bolsa'), REVIENTA_MS));
      timers.push(setTimeout(() => reproducirSonido('monedas'), REVIENTA_MS + 500));
    } else {
      timers.push(setTimeout(() => reproducirSonido('bolsaVacia'), REVIENTA_MS));
    }
    return () => timers.forEach(clearTimeout);
  }, [vacia]);

  let clase = vacia ? 'animacion-victoria victoria-vacia' : 'animacion-victoria';
  if (prefiereMenosMovimiento()) clase += ' victoria-quieta';

  return (
    <div
      ref={escenaRef}
      className={clase}
      role="button"
      tabIndex={0}
      aria-label="Ganó la carta. Clic para continuar"
      onClick={onCompleta}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onCompleta?.();
      }}
      style={{ '--color-equipo': COLORES_EQUIPO[equipo?.id] ?? 'var(--color-accent)' }}
    >
      <div className="victoria-rayos" aria-hidden="true" />

      <div className="victoria-escena" aria-hidden="true">
        <div className="victoria-saco">
          <SacoMonedas proporcion={vacia ? 0 : 1} className="victoria-saco-svg" />
        </div>
        {!vacia &&
          MONEDAS.map((m, i) => (
            <span
              key={i}
              className="victoria-moneda"
              style={{
                '--dx': `${m.dx}px`,
                '--alto': `${-m.alto}px`,
                '--caida': `${m.caida}px`,
                '--tam': m.tam,
                animationDelay: `${REVIENTA_MS + m.retraso}ms`,
              }}
            >
              🪙
            </span>
          ))}
        {vacia && <Polilla />}
      </div>

      <p className="victoria-equipo">
        {vacia ? `¡Le atinaron, ${equipo?.nombre}!` : `¡${equipo?.nombre} se lleva la bolsa!`}
      </p>
      <p className="animacion-victoria-texto">{vacia ? 'Pero la bolsa quedó vacía' : `+${mostrado} 🪙`}</p>
      <p className="animacion-victoria-hint">clic para continuar</p>
    </div>
  );
}
