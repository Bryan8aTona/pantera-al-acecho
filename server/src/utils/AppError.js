/**
 * Error de aplicación con código HTTP asociado.
 * Se lanza desde services/controllers y lo captura el error.middleware.
 */
class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isAppError = true;
  }
}

export default AppError;
