import { describe, it, expect } from 'vitest';
import { normalizarFrases, frasesConId } from '../frases.js';

describe('normalizarFrases', () => {
  it('ordena por `orden`, lo convierte a número y recorta el texto', () => {
    expect(
      normalizarFrases([
        { orden: '2', texto: '  Hola  ', extra: 'se descarta' },
        { orden: 1, texto: 'Adiós' },
      ]),
    ).toEqual([
      { orden: 1, texto: 'Adiós' },
      { orden: 2, texto: 'Hola' },
    ]);
  });

  it('tolera frases ausentes o sin texto', () => {
    expect(normalizarFrases(undefined)).toEqual([]);
    expect(normalizarFrases([{ orden: 1 }])).toEqual([{ orden: 1, texto: '' }]);
  });
});

describe('frasesConId', () => {
  it('sintetiza un id estable derivado del orden (lo usa el mazo del motor)', () => {
    expect(frasesConId([{ orden: 3, texto: 'c' }, { orden: 1, texto: 'a' }])).toEqual([
      { orden: 1, texto: 'a', id: 'f1' },
      { orden: 3, texto: 'c', id: 'f3' },
    ]);
  });
});
