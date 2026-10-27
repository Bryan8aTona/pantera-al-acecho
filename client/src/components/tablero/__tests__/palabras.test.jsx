import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { indicesPorPalabra } from '../palabras.js';
import ProgresoFrase from '../ProgresoFrase.jsx';
import RellenoInteligente from '../RellenoInteligente.jsx';

// Cuántas celdas tiene cada palabra en pantalla.
function celdasPorPalabra(container) {
  return [...container.querySelectorAll('.progreso-palabra')].map(
    (palabra) => palabra.querySelectorAll('.progreso-celda').length,
  );
}

describe('indicesPorPalabra', () => {
  it('agrupa las posiciones de cada palabra y deja fuera los espacios', () => {
    expect(indicesPorPalabra('EL SOL')).toEqual([
      [0, 1],
      [3, 4, 5],
    ]);
  });

  it('los signos van con la palabra a la que están pegados', () => {
    expect(indicesPorPalabra('Riesgo: alta, baja')).toEqual([
      [0, 1, 2, 3, 4, 5, 6],
      [8, 9, 10, 11, 12],
      [14, 15, 16, 17],
    ]);
  });

  it('ignora espacios repetidos o en los extremos', () => {
    expect(indicesPorPalabra(' A  B ')).toEqual([[1], [4]]);
  });
});

describe('celdas agrupadas por palabra (para no cortar palabras entre renglones)', () => {
  it('ProgresoFrase', () => {
    const { container } = render(<ProgresoFrase texto="EL CONTROL DE RIESGOS" letrasUsadas={{ E: 'acierto' }} />);
    expect(celdasPorPalabra(container)).toEqual([2, 7, 2, 7]);
  });

  it('RellenoInteligente', () => {
    const { container } = render(
      <RellenoInteligente texto="Efecto: serio" letrasUsadas={{ E: 'acierto' }} onEnviar={() => {}} />,
    );
    expect(celdasPorPalabra(container)).toEqual([7, 5]);
  });
});
