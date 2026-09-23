import { useReducer, useCallback } from 'react';
import { crearEstadoInicial } from '../motor/index.js';
import { reducerSeguro } from './reducerSeguro.js';

// set: el objeto completo { id, nombre, frases } que ya está en memoria
// gracias a PartidaContext (ver ConfiguracionPartidaPage). El estado del
// motor vive aparte, dentro de este hook — PartidaContext solo guarda
// QUÉ set se eligió, este hook guarda CÓMO va la partida en curso.
export function usePartidaEngine(set) {
  // El `dispatch` de useReducer ya es estable entre renders; no hace
  // falta envolverlo.
  const [estado, dispatch] = useReducer(reducerSeguro, set, (setInicial) => ({
    ...crearEstadoInicial({ set: setInicial }),
    error: null,
  }));

  const limpiarError = useCallback(() => dispatch({ type: '__LIMPIAR_ERROR__' }), []);

  return { estado, dispatch, limpiarError };
}
