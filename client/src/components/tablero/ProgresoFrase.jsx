import { progresoDeFrase } from '../../motor/index.ts';
import { esFraseLarga, indicesPorPalabra } from './palabras.js';

export default function ProgresoFrase({ texto, letrasUsadas }) {
  const progreso = progresoDeFrase(texto, letrasUsadas);
  const clase = esFraseLarga(texto) ? 'progreso-frase progreso-frase-larga' : 'progreso-frase';

  return (
    <div className={clase} aria-label="Frase a adivinar">
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
