import { describe, it, expect } from 'vitest';
import { normalizarTexto, normalizarLetra } from '../normalizacion.js';

describe('normalizarTexto', () => {
  it('quita tildes de las vocales', () => {
    expect(normalizarTexto('canción')).toBe('CANCION');
    expect(normalizarTexto('árbol')).toBe('ARBOL');
  });

  it('ignora mayúsculas/minúsculas', () => {
    expect(normalizarTexto('HTTP es un protocolo sin estado')).toBe(
      'HTTP ES UN PROTOCOLO SIN ESTADO',
    );
  });

  it('NUNCA convierte la Ñ en N (no es una tilde, es otra letra)', () => {
    expect(normalizarTexto('año')).toBe('AÑO');
    expect(normalizarTexto('ÑOÑO')).toBe('ÑOÑO');
  });

  it('normaliza la diéresis en ü', () => {
    expect(normalizarTexto('pingüino')).toBe('PINGUINO');
  });
});

describe('normalizarLetra', () => {
  it('normaliza una sola letra', () => {
    expect(normalizarLetra('é')).toBe('E');
    expect(normalizarLetra('ñ')).toBe('Ñ');
  });
});
