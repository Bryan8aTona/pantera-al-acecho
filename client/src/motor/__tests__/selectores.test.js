import { describe, it, expect } from 'vitest';
import {
  debeAdivinar,
  progresoDeFrase,
  impedimentoAciertoSeguro,
  equipoEnTurnoActual,
  equipoDelTurnoNormal,
  cartaEnJuego,
  hayDerrotaPendiente,
} from '../selectores.js';
import { esLetra } from '../letras.js';

function oculto(texto, letrasUsadas = {}) {
  return progresoDeFrase(texto, letrasUsadas)
    .map((c) => (c.revelada ? c.caracter : '_'))
    .join('');
}

describe('esLetra', () => {
  it('cuenta como letra las vocales con tilde o diéresis y la Ñ', () => {
    for (const c of ['a', 'Z', 'ñ', 'Ñ', 'á', 'É', 'í', 'Ó', 'ú', 'ü']) {
      expect(esLetra(c)).toBe(true);
    }
  });

  it('no cuenta espacios, dígitos ni signos', () => {
    for (const c of [' ', '1', ',', '¿', '?', '¡', '!', '-', '.', '']) {
      expect(esLetra(c)).toBe(false);
    }
  });
});

describe('progresoDeFrase', () => {
  it('oculta las vocales con tilde igual que las demás letras', () => {
    expect(oculto('Canción')).toBe('_______');
  });

  it('la vocal con tilde se revela al acertar la vocal sin tilde', () => {
    expect(oculto('Canción', { O: 'acierto' })).toBe('_____ó_');
  });

  it('una letra fallada no revela nada', () => {
    expect(oculto('Canción', { O: 'fallo' })).toBe('_______');
  });

  it('los espacios y signos de puntuación siempre se muestran', () => {
    expect(oculto('¿Sí, señor?')).toBe('¿__, _____?');
  });

  it('la Ñ solo se revela con la Ñ, no con la N', () => {
    expect(oculto('Año', { N: 'acierto' })).toBe('___');
    expect(oculto('Año', { Ñ: 'acierto' })).toBe('_ñ_');
  });
});

describe('debeAdivinar', () => {
  it('solo cuando se agotaron ambas categorías', () => {
    expect(debeAdivinar({ intentos: { vocales: 0, consonantes: 0 } })).toBe(true);
    expect(debeAdivinar({ intentos: { vocales: 0, consonantes: 1 } })).toBe(false);
    expect(debeAdivinar({ intentos: { vocales: 1, consonantes: 0 } })).toBe(false);
  });
});

describe('impedimentoAciertoSeguro', () => {
  const equipo = { saldo: 200, intentos: { vocales: 3, consonantes: 8 } };

  it('null cuando la compra es posible', () => {
    expect(impedimentoAciertoSeguro(equipo, 'vocal', 'SOL', {})).toBeNull();
  });

  it('sin intentos de la categoría', () => {
    const sinVocales = { ...equipo, intentos: { vocales: 0, consonantes: 8 } };
    expect(impedimentoAciertoSeguro(sinVocales, 'vocal', 'SOL', {}).codigo).toBe('SIN_INTENTOS');
  });

  it('saldo insuficiente (35 para vocal, 20 para consonante)', () => {
    const pobre = { ...equipo, saldo: 34 };
    expect(impedimentoAciertoSeguro(pobre, 'vocal', 'SOL', {}).codigo).toBe('SALDO_INSUFICIENTE');
    expect(impedimentoAciertoSeguro(pobre, 'consonante', 'SOL', {})).toBeNull();
  });

  it('sin letras de esa categoría por descubrir', () => {
    expect(impedimentoAciertoSeguro(equipo, 'vocal', 'SOL', { O: 'acierto' }).codigo).toBe(
      'SIN_LETRAS_DISPONIBLES',
    );
  });
});

describe('equipo y carta en juego', () => {
  const base = {
    ronda: 1,
    equipos: {
      rojo: { id: 'rojo', panteraEstado: 0 },
      azul: { id: 'azul', panteraEstado: 0 },
    },
    mazo: { c1: { id: 'c1' }, c2: { id: 'c2' } },
    ordenTurnoActual: ['rojo', 'azul'],
    turnoActualIndex: 0,
    cartaActualId: null,
    modoRobo: null,
  };

  it('sin robo: el equipo del turno normal y su carta (o null si no eligió)', () => {
    expect(equipoEnTurnoActual(base).id).toBe('rojo');
    expect(equipoDelTurnoNormal(base).id).toBe('rojo');
    expect(cartaEnJuego(base)).toBeNull();
    expect(cartaEnJuego({ ...base, cartaActualId: 'c2' }).id).toBe('c2');
  });

  it('con robo: juega el que roba, sobre la carta en robo', () => {
    const enRobo = { ...base, modoRobo: { equipoId: 'azul', cartaId: 'c1' } };
    expect(equipoEnTurnoActual(enRobo).id).toBe('azul');
    expect(equipoDelTurnoNormal(enRobo).id).toBe('rojo');
    expect(cartaEnJuego(enRobo).id).toBe('c1');
  });
});

describe('hayDerrotaPendiente', () => {
  const enRonda2 = {
    ronda: 2,
    equipos: { azul: { id: 'azul', panteraEstado: 5 } },
    ordenTurnoActual: ['azul'],
    turnoActualIndex: 0,
    cartaActualId: 'c5',
    modoRobo: null,
  };

  it('Ronda 2, pantera en 5 y carta abierta', () => {
    expect(hayDerrotaPendiente(enRonda2)).toBe(true);
  });

  it('no en Ronda 1, ni sin carta, ni con la pantera por debajo de 5', () => {
    expect(hayDerrotaPendiente({ ...enRonda2, ronda: 1 })).toBe(false);
    expect(hayDerrotaPendiente({ ...enRonda2, cartaActualId: null })).toBe(false);
    expect(
      hayDerrotaPendiente({ ...enRonda2, equipos: { azul: { id: 'azul', panteraEstado: 4 } } }),
    ).toBe(false);
  });
});
