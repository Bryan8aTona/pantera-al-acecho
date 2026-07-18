import AppError from '../../utils/AppError.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarRegistro({ email, password, nombre }) {
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new AppError(400, 'El email no es válido');
  }
  if (!password || password.length < 8) {
    throw new AppError(400, 'La contraseña debe tener al menos 8 caracteres');
  }
  if (!nombre || !nombre.trim()) {
    throw new AppError(400, 'El nombre es obligatorio');
  }
}

export function validarLogin({ email, password }) {
  if (!email || !password) {
    throw new AppError(400, 'Email y contraseña son obligatorios');
  }
}
