import { progresoDeFrase } from '../../motor/index.ts';
import { indicesPorPalabra } from './palabras.js';

export default function ProgresoFrase({ texto, letrasUsadas }) {
  const progreso = progresoDeFrase(texto, letrasUsadas);

  return (
    <div className="progreso-frase" aria-label="Frase a adivinar">
      {indicesPorPalabra(texto).map((indices) => (
        <span key={indices[0]} className="progreso-palabra">
          {indices.map((i) => (
            <span key={i} className={progreso[i].revelada ? 'progreso-celda revelada' : 'progreso-celda'}>
              {progreso[i].revelada ? progreso[i].caracter : ''}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}
