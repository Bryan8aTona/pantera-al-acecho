import { describe, it, expect } from 'vitest';
import { esVocal, categoriaDeLetra, posicionesDeLetra, letrasUnicasPorCategoria } from '../letras.js';

describe('esVocal / categoriaDeLetra', () => {
  it('clasifica vocales correctamente, incluso acentuadas', () => {
    expect(esVocal('a')).toBe(true);
    expect(esVocal('É')).toBe(true);
    expect(categoriaDeLetra('u')).toBe('vocal');
  });

  it('la Ñ es consonante, no vocal', () => {
    expect(esVocal('ñ')).toBe(false);
    expect(categoriaDeLetra('Ñ')).toBe('consonante');
  });

  it('clasifica consonantes comunes', () => {
    expect(categoriaDeLetra('m')).toBe('consonante');
  });
});

describe('posicionesDeLetra', () => {
  it('encuentra todas las posiciones, ignorando tildes/mayúsculas', () => {
    // "DNS traduce nombres a direcciones IP" -> D en índices 0, 7 y 22
    expect(posicionesDeLetra('DNS traduce nombres a direcciones IP', 'D')).toEqual([0, 7, 22]);
  });

  it('encuentra una vocal acentuada al pedir la vocal sin acento', () => {
    expect(posicionesDeLetra('FTP usa los puertos 20 y 21', 'o')).toEqual([9, 17]);
  });

  it('devuelve arreglo vacío si la letra no aparece', () => {
    expect(posicionesDeLetra('SSL y TLS cifran la comunicación', 'q')).toEqual([]);
  });
});

describe('letrasUnicasPorCategoria', () => {
  it('devuelve solo vocales únicas en orden de aparición', () => {
    expect(letrasUnicasPorCategoria('El modelo OSI tiene siete capas', 'vocal')).toEqual([
      'E',
      'O',
      'I',
      'A',
    ]);
  });

  it('no repite letras ya vistas', () => {
    const resultado = letrasUnicasPorCategoria('TCP garantiza la entrega de paquetes', 'consonante');
    const sinDuplicados = new Set(resultado);
    expect(resultado.length).toBe(sinDuplicados.size);
  });
});
