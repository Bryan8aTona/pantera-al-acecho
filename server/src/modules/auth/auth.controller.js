import { validarRegistro, validarLogin } from './auth.validators.js';
import {
  registrarUsuario,
  iniciarSesion,
  obtenerUsuarioPorId,
} from './auth.service.js';

export async function register(req, res, next) {
  try {
    validarRegistro(req.body);
    const { usuario, token } = await registrarUsuario(req.body);
    res.status(201).json({ usuario, token });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    validarLogin(req.body);
    const { usuario, token } = await iniciarSesion(req.body);
    res.status(200).json({ usuario, token });
  } catch (error) {
    next(error);
  }
}

// Ruta protegida de conveniencia: permite al cliente validar si el
// token guardado en localStorage todavía es válido al recargar la SPA
// (fuera de una partida) y recuperar los datos del docente.
export async function me(req, res, next) {
  try {
    const usuario = await obtenerUsuarioPorId(req.usuario.id);
    res.status(200).json({ usuario });
  } catch (error) {
    next(error);
  }
}
