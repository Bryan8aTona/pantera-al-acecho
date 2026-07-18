import { describe, it, expect } from 'vitest';
import { reducerSeguro } from '../reducerSeguro.js';
import { crearEstadoInicial } from '../../motor/index.js';

const SET_EJEMPLO = {
  id: 'set-1',
  nombre: 'Set de prueba',
  frases: Array.from({ length: 8 }, (_, i) => ({
    id: `frase-${i + 1}`,
    texto: `Frase ${i + 1}`,
    orden: i + 1,
  })),
};

function estadoBase() {
  return { ...crearEstadoInicial({ set: SET_EJEMPLO, aleatorio: () => 0.5 }), error: null };
}

describe('reducerSeguro', () => {
  it('aplica acciones válidas igual que motorReducer', () => {
    const estado = reducerSeguro(estadoBase(), { type: 'ELEGIR_CARTA', cartaId: 'frase-1' });
    expect(estado.cartaActualId).toBe('frase-1');
    expect(estado.error).toBeNull();
  });

  it('atrapa un MotorError y lo guarda en estado.error en vez de lanzar', () => {
    const estado = reducerSeguro(estadoBase(), { type: 'PEDIR_LETRA_LIBRE', letra: 'A' });
    // sin carta elegida -> MotorError, pero no debe lanzar
    expect(estado.error).not.toBeNull();
    expect(estado.error.codigo).toBe('SIN_CARTA');
  });

  it('limpia el error con __LIMPIAR_ERROR__ sin tocar el resto del estado', () => {
    let estado = reducerSeguro(estadoBase(), { type: 'PEDIR_LETRA_LIBRE', letra: 'A' });
    expect(estado.error).not.toBeNull();

    estado = reducerSeguro(estado, { type: '__LIMPIAR_ERROR__' });
    expect(estado.error).toBeNull();
    expect(estado.fase).toBe('RONDA1');
  });

  it('un error inesperado (no MotorError) sí se propaga', () => {
    expect(() => reducerSeguro(estadoBase(), { type: 'ELEGIR_CARTA' /* sin cartaId */ })).not.toThrow();
    // ELEGIR_CARTA sin cartaId cae en "carta inexistente" -> sí es MotorError, se atrapa.
    // Forzamos un caso realmente inesperado con una acción rota a propósito:
    const accionRota = { type: 'ELEGIR_CARTA', get cartaId() { throw new TypeError('boom'); } };
    expect(() => reducerSeguro(estadoBase(), accionRota)).toThrow(TypeError);
  });
});
