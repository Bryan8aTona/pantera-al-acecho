import { validarSetPayload } from './sets.validators.js';
import {
  listarSetsPorUsuario,
  obtenerSetConFrases,
  crearSet,
  actualizarSet,
  eliminarSet,
} from './sets.service.js';

export async function listar(req, res, next) {
  try {
    const sets = await listarSetsPorUsuario(req.usuario.id);
    res.status(200).json({ sets });
  } catch (error) {
    next(error);
  }
}

export async function crear(req, res, next) {
  try {
    validarSetPayload(req.body);
    const set = await crearSet(req.usuario.id, req.body);
    res.status(201).json({ set });
  } catch (error) {
    next(error);
  }
}

// GET /api/sets/:id/frases — usado tanto por el back-office (precargar
// el formulario de edición) como por la pantalla de configuración de
// partida (descarga completa del set elegido al iniciar el juego).
export async function obtenerFrases(req, res, next) {
  try {
    const set = await obtenerSetConFrases(req.usuario.id, req.params.id);
    res.status(200).json({ set });
  } catch (error) {
    next(error);
  }
}

export async function actualizar(req, res, next) {
  try {
    validarSetPayload(req.body);
    const set = await actualizarSet(req.usuario.id, req.params.id, req.body);
    res.status(200).json({ set });
  } catch (error) {
    next(error);
  }
}

export async function eliminar(req, res, next) {
  try {
    await eliminarSet(req.usuario.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
