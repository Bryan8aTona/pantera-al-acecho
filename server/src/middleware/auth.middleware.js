import { verificarToken } from '../utils/jwt.js';
import AppError from '../utils/AppError.js';

/**
 * Middleware de autenticación.
 * Exige header "Authorization: Bearer <token>".
 * Si es válido, adjunta el payload decodificado en req.usuario.
 *
 * Se usa en toda ruta privada: CRUD de sets, etc.
 */
export default function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'No se proporcionó un token de acceso'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verificarToken(token);
    // payload: { id, email, nombre, iat, exp }
    req.usuario = payload;
    next();
  } catch (error) {
    return next(new AppError(401, 'Token inválido o expirado'));
  }
}
