import { useEffect, useRef, useState } from 'react';
import { COSTO_LETRA } from '../../motor/constantes.ts';
import { reproducirSonido } from '../../sonido/gestorSonido.js';
import { useContadorAnimado, prefiereMenosMovimiento } from './useContadorAnimado.js';
import { SacoMonedas, Polilla } from './SacoMonedas.jsx';
import './BolsaTesoro.css';

// Con esta fracción de la bolsa inicial o menos, tiembla y su placa se
// pone roja. Es relativa porque las bolsas van de ~80 a ~220 monedas.
const FRACCION_BOLSA_BAJA = 0.25;

// La bolsa de monedas de la carta en juego (requerimientos.md 3.3).
// Cae al voltear la carta y su contador sube de 0; cada letra pedida hace
// saltar monedas (una por −5, tres por el −10 del Acierto Seguro) y la
// bolsa se desinfla. Vacía, sale una polilla.
//
// entrada: 'caer' al voltear la carta, 'voltear' cuando la bolsa pasa
// al equipo que roba (sin volver a contar desde 0).
//
// Las restas se detectan comparando con el valor anterior guardado en
// una ref que solo se muta dentro de un useEffect (ver la restricción de
// StrictMode en arquitectura.md 3.5.1).
export default function BolsaTesoro({ bolsa, bolsaInicial, entrada = 'caer', colorEquipo, etiqueta = 'Bolsa' }) {
  const mostrado = useContadorAnimado(bolsa, { desde: entrada === 'caer' ? 0 : bolsa, retraso: 350 });
  const [saltos, setSaltos] = useState([]);
  const anteriorRef = useRef(bolsa);
  const siguienteIdRef = useRef(0);

  // Sonido de la bolsa al caer. Diferido y cancelable: StrictMode monta,
  // desmonta y vuelve a montar, y así solo suena una vez.
  useEffect(() => {
    if (entrada !== 'caer') return undefined;
    const t = setTimeout(() => reproducirSonido('bolsa'), 300);
    return () => clearTimeout(t);
  }, [entrada]);

  useEffect(() => {
    const anterior = anteriorRef.current;
    anteriorRef.current = bolsa;
    if (bolsa >= anterior) return undefined;

    const resta = anterior - bolsa;
    const id = siguienteIdRef.current++;
    setSaltos((actuales) => [...actuales, { id, resta, monedas: resta > COSTO_LETRA ? 3 : 1 }]);
    reproducirSonido(resta > COSTO_LETRA ? 'monedas' : 'moneda');

    const timers = [setTimeout(() => setSaltos((actuales) => actuales.filter((s) => s.id !== id)), 1300)];
    if (bolsa === 0) timers.push(setTimeout(() => reproducirSonido('bolsaVacia'), 450));
    return () => timers.forEach(clearTimeout);
  }, [bolsa]);

  const proporcion = bolsaInicial > 0 ? bolsa / bolsaInicial : 0;
  const vacia = bolsa === 0;
  const baja = !vacia && bolsa <= bolsaInicial * FRACCION_BOLSA_BAJA;

  let clase = `bolsa bolsa-entrada-${entrada}`;
  if (baja) clase += ' bolsa-baja';
  if (vacia) clase += ' bolsa-vacia';
  if (prefiereMenosMovimiento()) clase += ' bolsa-quieta';

  return (
    <div className={clase} style={colorEquipo ? { '--color-bolsa-equipo': colorEquipo } : undefined}>
      <div className="bolsa-figura" aria-hidden="true">
        <SacoMonedas proporcion={proporcion} />
        {saltos.map((salto) =>
          Array.from({ length: salto.monedas }, (_, i) => (
            <span key={`${salto.id}-${i}`} className={`bolsa-moneda-salta salto-${salto.monedas}-${i}`}>
              🪙
            </span>
          )),
        )}
        {vacia && <Polilla />}
      </div>

      <div className="bolsa-placa" role="status" aria-label={`${etiqueta}: ${bolsa} monedas`}>
        <span className="bolsa-etiqueta">{etiqueta}</span>
        <span className="bolsa-valor">
          <span aria-hidden="true">🪙</span> {mostrado}
        </span>
        {saltos.map((salto) => (
          <span
            key={salto.id}
            className={salto.resta > COSTO_LETRA ? 'bolsa-resta grande' : 'bolsa-resta'}
            aria-hidden="true"
          >
            −{salto.resta}
          </span>
        ))}
      </div>
    </div>
  );
}
