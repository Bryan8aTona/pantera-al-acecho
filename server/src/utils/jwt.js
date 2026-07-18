import jwt from 'jsonwebtoken';

const { JWT_SECRET, JWT_EXPIRES_IN = '8h' } = process.env;

/**
 * Firma un token JWT con el payload del usuario.
 * Payload mínimo: no incluir passwordHash ni datos sensibles.
 */
export function firmarToken(payload) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifica un token JWT y devuelve el payload decodificado.
 * Lanza si el token es inválido o expiró (lo captura el middleware de auth).
 */
export function verificarToken(token) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }
  return jwt.verify(token, JWT_SECRET);
}
