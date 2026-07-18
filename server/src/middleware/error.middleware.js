/**
 * Manejador de errores centralizado. Debe registrarse al final de la
 * cadena de middlewares en app.js (después de montar todas las rutas).
 */
export default function manejarErrores(err, req, res, next) {
  if (err.isAppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Error de Prisma: violación de restricción única (ej. email duplicado)
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'El recurso ya existe' });
  }

  // Error no anticipado: lo logueamos completo en servidor, pero no
  // exponemos detalles internos al cliente.
  console.error('[Error no manejado]', err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}
