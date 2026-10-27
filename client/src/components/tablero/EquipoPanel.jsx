import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { COLORES_EQUIPO } from './coloresEquipo.js';
import { useContadorAnimado, prefiereMenosMovimiento } from './useContadorAnimado.js';
import { reproducirSonido } from '../../sonido/gestorSonido.js';
import { PANTERA_ESTADO_DERROTA } from '../../motor/constantes.ts';

const ESTADOS_PANTERA = Array.from({ length: PANTERA_ESTADO_DERROTA }, (_, i) => i + 1);

// La animación real de la pantera vive en su propio componente; aquí
// solo un indicador compacto de cuántas vidas lleva perdidas el equipo.
function PuntosPantera({ estado }) {
  return (
    <div className="pantera-puntos" aria-label={`Pantera en estado ${estado} de ${PANTERA_ESTADO_DERROTA}`}>
      {ESTADOS_PANTERA.map((n) => (
        <span key={n} className={n <= estado ? 'punto lleno' : 'punto'} />
      ))}
    </div>
  );
}

// Monedas que vuelan de la jugada al saldo cuando el equipo gana.
const MONEDAS_VUELO = 14;
// Cuándo llegan las primeras monedas al saldo y empieza a contar.
const LLEGADA_MS = 650;
// Cuánto dura la celebración del panel.
const CELEBRACION_MS = 2800;

// Entrega de la bolsa ganada al saldo del equipo. Cuando el saldo sube,
// una fila de monedas vuela desde la jugada hasta el saldo; al llegar, el
// número cuenta hacia arriba agrandado, sube un "+N" y el panel brilla.
//
// `retener` congela todo mientras se ve la bolsa reventando. El arranque
// se difiere y se cancela si `retener` se enciende, porque el saldo
// cambia un render ANTES de que aparezca la victoria (ver el render de
// desfase en CLAUDE.md).
function useSaldoCelebrado(saldo, retener, saldoRef) {
  // `objetivo` es hasta dónde corre el contador: alcanza a `saldo` cuando
  // llegan las monedas.
  const [objetivo, setObjetivo] = useState(saldo);
  const [celebracion, setCelebracion] = useState(null);

  useEffect(() => {
    if (retener || celebracion || saldo === objetivo) return undefined;
    const t = setTimeout(() => {
      if (saldo < objetivo || prefiereMenosMovimiento()) {
        setObjetivo(saldo);
        return;
      }
      // Posiciones medidas aquí (no en el render): de la jugada al saldo.
      const origen = document.querySelector('.tablero-jugada')?.getBoundingClientRect();
      const destino = saldoRef.current?.getBoundingClientRect();
      const ox = origen ? origen.left + origen.width / 2 : 0;
      const oy = origen ? origen.top + origen.height / 2 : 0;
      const dx = destino ? destino.left + destino.width / 2 - ox : 0;
      const dy = destino ? destino.top + destino.height / 2 - oy : 0;
      setCelebracion({ saldo, premio: saldo - objetivo, ox, oy, dx, dy });
    }, 150);
    return () => clearTimeout(t);
  }, [saldo, objetivo, retener, celebracion, saldoRef]);

  useEffect(() => {
    if (!celebracion) return undefined;
    const timers = [
      setTimeout(() => {
        setObjetivo(celebracion.saldo);
        reproducirSonido('monedasSaldo');
      }, LLEGADA_MS),
      setTimeout(() => reproducirSonido('monedasSaldo'), LLEGADA_MS + 350),
      setTimeout(() => reproducirSonido('monedasSaldo'), LLEGADA_MS + 700),
      setTimeout(() => setCelebracion(null), CELEBRACION_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, [celebracion]);

  const mostrado = useContadorAnimado(objetivo, { duracion: 1400 });
  return { mostrado, celebracion };
}

function MonedasEnVuelo({ celebracion }) {
  const { ox, oy, dx, dy } = celebracion;
  return createPortal(
    <div className="saldo-vuelo" aria-hidden="true">
      {Array.from({ length: MONEDAS_VUELO }, (_, i) => {
        const columna = (i % 5) - 2;
        const fila = Math.floor(i / 5) - 1;
        return (
          <span
            key={i}
            className="saldo-vuelo-moneda"
            style={{
              left: ox + columna * 18,
              top: oy + fila * 16,
              '--dx': `${dx - columna * 18}px`,
              '--dy': `${dy - fila * 16}px`,
              '--arco': `${-90 - (i % 4) * 25}px`,
              animationDelay: `${i * 45}ms`,
            }}
          >
            🪙
          </span>
        );
      })}
    </div>,
    document.body,
  );
}

export default function EquipoPanel({ equipo, limites, esTurnoActual, esQuienRoba, retenerSaldo = false }) {
  const color = COLORES_EQUIPO[equipo.id];
  const saldoRef = useRef(null);
  const { mostrado, celebracion } = useSaldoCelebrado(equipo.saldo, retenerSaldo, saldoRef);

  let clase = 'equipo-panel-v2';
  if (esTurnoActual) clase += ' en-turno';
  if (esQuienRoba) clase += ' robando';
  if (celebracion) clase += ' ganando';

  return (
    <div className={clase} style={{ '--color-equipo': color }}>
      <div className="equipo-panel-v2-tab">{equipo.nombre}</div>

      <div className="equipo-panel-v2-fila">
        <span className="equipo-panel-v2-label">SALDO ACTUAL</span>
        <span ref={saldoRef} className={celebracion ? 'equipo-panel-v2-saldo contando' : 'equipo-panel-v2-saldo'}>
          <span className="equipo-panel-v2-moneda" aria-hidden="true">
            🪙
          </span>
          {mostrado}
          {celebracion && (
            <span className="saldo-premio" aria-hidden="true">
              +{celebracion.premio}
            </span>
          )}
        </span>
        {celebracion && <MonedasEnVuelo celebracion={celebracion} />}
      </div>

      <div className="equipo-panel-v2-divisor" />

      <div className="equipo-panel-v2-fila">
        <span className="equipo-panel-v2-label">CONTADORES</span>
        <div className="equipo-panel-v2-contadores">
          <span>
            <span className="equipo-panel-v2-categoria">Vocales:</span> {equipo.intentos.vocales}/{limites.vocales}
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
