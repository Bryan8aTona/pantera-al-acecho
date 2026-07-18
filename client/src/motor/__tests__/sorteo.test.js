import { describe, it, expect } from 'vitest';
import { sortearOrden } from '../sorteo.js';

describe('sortearOrden', () => {
  it('devuelve los mismos elementos, solo reordenados', () => {
    const equipos = ['rojo', 'azul', 'amarillo', 'verde'];
    const resultado = sortearOrden(equipos, () => 0.999);
    expect(resultado.slice().sort()).toEqual(equipos.slice().sort());
    expect(resultado).toHaveLength(4);
  });

  it('no muta el arreglo original', () => {
    const equipos = ['rojo', 'azul', 'amarillo', 'verde'];
    const copia = [...equipos];
    sortearOrden(equipos, Math.random);
    expect(equipos).toEqual(copia);
  });

  it('es determinístico con la misma función aleatoria', () => {
    const equipos = ['rojo', 'azul', 'amarillo', 'verde'];
    const a = sortearOrden(equipos, () => 0.3);
    const b = sortearOrden(equipos, () => 0.3);
    expect(a).toEqual(b);
  });
});
