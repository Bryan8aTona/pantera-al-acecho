import { describe, it, expect } from 'vitest';
import { SET_EJEMPLO } from '../setEjemplo.js';
import { FRASES_POR_SET } from '../../motor/constantes.js';
import { crearEstadoInicial } from '../../motor/estadoInicial.js';
import { letrasUnicasDeTexto } from '../../motor/letras.js';

describe('Set de ejemplo del modo invitado', () => {
  it('tiene exactamente las frases que pide una partida, con id único', () => {
    expect(SET_EJEMPLO.frases).toHaveLength(FRASES_POR_SET);
    const ids = SET_EJEMPLO.frases.map((f) => f.id);
    expect(new Set(ids).size).toBe(FRASES_POR_SET);
  });

  it('todas las frases tienen letras que adivinar', () => {
    for (const frase of SET_EJEMPLO.frases) {
      expect(letrasUnicasDeTexto(frase.texto).length).toBeGreaterThan(0);
    }
  });

  it('el motor puede arrancar una partida con él', () => {
    const estado = crearEstadoInicial({ set: SET_EJEMPLO });
    expect(Object.keys(estado.mazo)).toHaveLength(FRASES_POR_SET);
  });
});
