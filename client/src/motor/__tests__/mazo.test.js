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

  it('es determinístico con la misma función aleatoria', () => {
    const mazoA = crearMazo(FRASES_EJEMPLO, () => 0.42);
    const mazoB = crearMazo(FRASES_EJEMPLO, () => 0.42);
    expect(mazoA).toEqual(mazoB);
  });
});
