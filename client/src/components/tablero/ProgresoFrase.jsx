import { progresoDeFrase } from '../../motor/index.js';

export default function ProgresoFrase({ texto, letrasUsadas }) {
  const progreso = progresoDeFrase(texto, letrasUsadas);

  return (
    <div className="progreso-frase" aria-label="Frase a adivinar">
      {progreso.map((item, i) => {
        if (item.caracter === ' ') {
          return <span key={i} className="progreso-espacio" aria-hidden="true" />;
        }
        return (
          <span key={i} className={item.revelada ? 'progreso-celda revelada' : 'progreso-celda'}>
            {item.revelada ? item.caracter : ''}
          </span>
        );
      })}
    </div>
  );
}
