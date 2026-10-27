import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { esFraseLarga, indicesPorPalabra } from '../palabras.js';
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

describe('esFraseLarga (celdas más chicas para que el Tablero no haga scroll)', () => {
  it('más de 60 caracteres sin contar espacios', () => {
    expect(esFraseLarga('Un riesgo es la probabilidad de que ocurra una circunstancia adversa')).toBe(false); // 58
    expect(esFraseLarga('Efecto de un riesgo: catastrófico, serio, tolerable, insignificante')).toBe(false); // 60
    expect(esFraseLarga('En el Control de riesgos se lleva a cabo el plan de resolución cuando aparecen')).toBe(true); // 64
  });

  it('ProgresoFrase y RellenoInteligente usan la clase compacta solo con frases largas', () => {
    const larga = 'Es mejor la prevención y la eliminación de las causas principales de los riesgos';
    const { container, unmount } = render(<ProgresoFrase texto={larga} letrasUsadas={{}} />);
    expect(container.querySelector('.progreso-frase-larga')).not.toBeNull();
    unmount();

    const corta = render(<RellenoInteligente texto="LA SELVA" letrasUsadas={{}} onEnviar={() => {}} />);
    expect(corta.container.querySelector('.progreso-frase-larga')).toBeNull();
    corta.unmount();

    const otra = render(<RellenoInteligente texto={larga} letrasUsadas={{}} onEnviar={() => {}} />);
    expect(otra.container.querySelector('.progreso-frase-larga')).not.toBeNull();
  });
});
