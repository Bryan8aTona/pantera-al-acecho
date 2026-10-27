import { PANTERA_ESTADO_DERROTA } from '../../motor/constantes.ts';
import './MedidorVidas.css';

// Vidas que le quedan al equipo en turno antes del zarpazo
// (requerimientos.md 3.4): cada letra fallada al aire rompe un corazón.
// La etiqueta sube el tono conforme se acaban.
export default function MedidorVidas({ errores }) {
  const vidas = Math.max(0, PANTERA_ESTADO_DERROTA - errores);

  let etiqueta = 'Vidas';
  let nivel = '';
  if (vidas === 2) {
    etiqueta = '¡Cuidado!';
    nivel = ' medidor-alerta';
  } else if (vidas === 1) {
    etiqueta = '¡Última vida!';
    nivel = ' medidor-peligro';
  } else if (vidas === 0) {
    etiqueta = '¡Zarpazo!';
    nivel = ' medidor-peligro';
  }

  return (
    <div
      className={`medidor-vidas${nivel}`}
      role="status"
      aria-label={`Les quedan ${vidas} de ${PANTERA_ESTADO_DERROTA} vidas`}
    >
      <div className="medidor-corazones" aria-hidden="true">
        {Array.from({ length: PANTERA_ESTADO_DERROTA }, (_, i) => (
          <Corazon key={i} perdido={i >= vidas} />
        ))}
      </div>
      <span className="medidor-etiqueta">{etiqueta}</span>
    </div>
  );
}

function Corazon({ perdido }) {
  return (
    <svg className={perdido ? 'corazon perdido' : 'corazon'} viewBox="0 0 32 30">
      <path
        className="corazon-forma"
        d="M16 28 C 6 20, 1 14, 1 8.5 C 1 4, 4.5 1, 8.5 1 C 11.5 1, 14 2.8, 16 5.5 C 18 2.8, 20.5 1, 23.5 1 C 27.5 1, 31 4, 31 8.5 C 31 14, 26 20, 16 28 Z"
      />
    </svg>
  );
}
