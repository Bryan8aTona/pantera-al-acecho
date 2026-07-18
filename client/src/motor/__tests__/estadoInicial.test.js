import { describe, it, expect } from 'vitest';
import { crearEstadoInicial } from '../estadoInicial.js';
import { SALDO_INICIAL, LIMITES_INTENTOS } from '../constantes.js';

const SET_EJEMPLO = {
  id: 'set-1',
  nombre: 'Unidad 2 – Redes',
  frases: Array.from({ length: 8 }, (_, i) => ({
    id: `frase-${i + 1}`,
    texto: `Frase de prueba ${i + 1}`,
    orden: i + 1,
  })),
};

describe('crearEstadoInicial', () => {
  it('rechaza un set sin exactamente 8 frases', () => {
    expect(() => crearEstadoInicial({ set: { ...SET_EJEMPLO, frases: SET_EJEMPLO.frases.slice(0, 3) } })).toThrow();
  });

  it('inicializa los 4 equipos con saldo y límites de Ronda 1', () => {
    const estado = crearEstadoInicial({ set: SET_EJEMPLO, aleatorio: () => 0.5 });

    expect(Object.keys(estado.equipos)).toHaveLength(4);
    for (const equipo of Object.values(estado.equipos)) {
      expect(equipo.saldo).toBe(SALDO_INICIAL);
      expect(equipo.intentos).toEqual(LIMITES_INTENTOS[1]);
      expect(equipo.panteraEstado).toBe(0);
      expect(equipo.gano).toBeNull();
    }
  });

  it('crea un mazo de 8 cartas sin jugar', () => {
    const estado = crearEstadoInicial({ set: SET_EJEMPLO, aleatorio: () => 0.5 });
    expect(Object.keys(estado.mazo)).toHaveLength(8);
    expect(Object.values(estado.mazo).every((c) => !c.jugada)).toBe(true);
  });

  it('arranca en Ronda 1, sin carta elegida ni robo activo', () => {
    const estado = crearEstadoInicial({ set: SET_EJEMPLO, aleatorio: () => 0.5 });
    expect(estado.fase).toBe('RONDA1');
    expect(estado.ronda).toBe(1);
    expect(estado.cartaActualId).toBeNull();
    expect(estado.modoRobo).toBeNull();
    expect(estado.turnoActualIndex).toBe(0);
  });
});
