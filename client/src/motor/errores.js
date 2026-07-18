// Se lanza ante cualquier acción inválida dada la fase/turno actual.
// El Tablero (Fase 4) la captura para mostrar el mensaje al docente
// sin corromper el estado de la partida.
export class MotorError extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}
