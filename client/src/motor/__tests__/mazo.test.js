import { describe, it, expect } from 'vitest';
import { crearMazo } from '../mazo.js';
import { PREMIOS_DISPONIBLES } from '../constantes.js';

const FRASES_EJEMPLO = Array.from({ length: 8 }, (_, i) => ({
  id: `frase-${i + 1}`,
  texto: `Frase número ${i + 1}`,
  orden: i + 1,
}));

describe('crearMazo', () => {
  it('rechaza un set que no tenga exactamente 8 frases', () => {
    expect(() => crearMazo(FRASES_EJEMPLO.slice(0, 7))).toThrow();
  });

  it('crea una carta por cada frase, todas sin jugar', () => {
    const mazo = crearMazo(FRASES_EJEMPLO, () => 0);
    expect(Object.keys(mazo)).toHaveLength(8);
    for (const carta of Object.values(mazo)) {
      expect(carta.jugada).toBe(false);
      expect(carta.ganadorId).toBeNull();
    }
  });

  it('asigna siempre uno de los 5 valores de premio permitidos', () => {
    const secuencia = [0, 0.25, 0.5, 0.75, 0.99, 0.1, 0.6, 0.9];
    let i = 0;
    const aleatorio = () => secuencia[i++ % secuencia.length];
    const mazo = crearMazo(FRASES_EJEMPLO, aleatorio);

    for (const carta of Object.values(mazo)) {
      expect(PREMIOS_DISPONIBLES).toContain(carta.valor);
    }
  });

  it('baraja las frases: el número de carta es su posición en el mazo, no en el set', () => {
    // Con aleatorio = 0, Fisher-Yates siempre intercambia con el índice 0:
    // [1..8] termina como [2, 3, 4, 5, 6, 7, 8, 1].
    const mazo = crearMazo(FRASES_EJEMPLO, () => 0);
    const porNumero = Object.fromEntries(Object.values(mazo).map((c) => [c.orden, c.texto]));

    expect(porNumero[1]).toBe('Frase número 2');
    expect(porNumero[7]).toBe('Frase número 8');
    expect(porNumero[8]).toBe('Frase número 1');
  });

  it('numera las cartas del 1 al 8 sin repetir y conserva las 8 frases', () => {
    const mazo = crearMazo(FRASES_EJEMPLO, () => 0.37);
    const cartas = Object.values(mazo);

    expect(cartas.map((c) => c.orden).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(cartas.map((c) => c.texto).sort()).toEqual(FRASES_EJEMPLO.map((f) => f.texto).sort());
    for (const carta of cartas) {
      expect(FRASES_EJEMPLO.find((f) => f.id === carta.id).texto).toBe(carta.texto);
    }
  });

  it('no modifica las frases recibidas', () => {
    const copia = structuredClone(FRASES_EJEMPLO);
    crearMazo(FRASES_EJEMPLO, () => 0);
    expect(FRASES_EJEMPLO).toEqual(copia);
  });

  it('es determinístico con la misma función aleatoria', () => {
    const mazoA = crearMazo(FRASES_EJEMPLO, () => 0.42);
    const mazoB = crearMazo(FRASES_EJEMPLO, () => 0.42);
    expect(mazoA).toEqual(mazoB);
  });
});
