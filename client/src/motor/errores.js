// Se lanza ante cualquier acción inválida dada la fase/turno actual.
// reducerSeguro (hooks/) la captura y la guarda en `estado.error`, para
// que el Tablero muestre el mensaje al docente sin corromper la partida.
export class MotorError extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}
