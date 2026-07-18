import { motorReducer, MotorError } from '../motor/index.js';

// El motor (motorReducer) lanza MotorError ante acciones inválidas —
// a propósito, para que sea fácil de testear con toThrow(). Pero un
// reducer de useReducer corre durante el render de React: si lanza,
// tumba el componente en vez de mostrar un mensaje. Este wrapper
// intercepta MotorError y lo convierte en un campo `error` dentro del
// estado, para que la UI lo muestre como feedback normal (ej. "no hay
// intentos disponibles") en vez de un crash.
export function reducerSeguro(estado, accion) {
  if (accion.type === '__LIMPIAR_ERROR__') {
    return { ...estado, error: null };
  }

  try {
    return { ...motorReducer(estado, accion), error: null };
  } catch (err) {
    if (err instanceof MotorError) {
      return { ...estado, error: { codigo: err.codigo, mensaje: err.message } };
    }
    // Un error que NO es de dominio (bug real) sí debe propagarse.
    throw err;
  }
}
