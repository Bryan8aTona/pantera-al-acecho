import prisma from '../../lib/prisma.js';
import AppError from '../../utils/AppError.js';

function normalizarFrases(frases) {
  return frases.map((f) => ({ texto: f.texto.trim(), orden: f.orden }));
}

/**
 * Lista los sets del docente autenticado (sin las frases completas,
 * para mantener el listado liviano). Incluye la cantidad de frases
 * como referencia rápida en el back-office.
 */
export async function listarSetsPorUsuario(usuarioId) {
  const sets = await prisma.set.findMany({
    where: { usuarioId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      nombre: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { frases: true } },
    },
  });

  return sets.map(({ _count, ...set }) => ({
    ...set,
    cantidadFrases: _count.frases,
  }));
}

/**
 * Busca un set del docente autenticado junto con sus frases completas,
 * ordenadas por posición (1-8). Se usa tanto para editar en el
 * back-office como para descargar el set completo al iniciar partida.
 *
 * Devuelve 404 tanto si el set no existe como si pertenece a otro
 * docente, para no revelar la existencia de sets ajenos.
 */
export async function obtenerSetConFrases(usuarioId, setId) {
  const set = await prisma.set.findFirst({
    where: { id: setId, usuarioId },
    include: { frases: { orderBy: { orden: 'asc' } } },
  });

  if (!set) {
    throw new AppError(404, 'Set no encontrado');
  }

  return set;
}

export async function crearSet(usuarioId, { nombre, frases }) {
  const set = await prisma.set.create({
    data: {
      usuarioId,
      nombre: nombre.trim(),
      frases: { create: normalizarFrases(frases) },
    },
    include: { frases: { orderBy: { orden: 'asc' } } },
  });

  return set;
}

/**
 * Actualiza nombre y frases de un set existente. Como el back-office
 * siempre reenvía las 8 frases completas (no hay reordenamiento
 * parcial), la forma más simple y segura de mantener consistencia es
 * reemplazar las frases dentro de una transacción.
 */
export async function actualizarSet(usuarioId, setId, { nombre, frases }) {
  const setExistente = await prisma.set.findFirst({
    where: { id: setId, usuarioId },
  });

  if (!setExistente) {
    throw new AppError(404, 'Set no encontrado');
  }

  const setActualizado = await prisma.$transaction(async (tx) => {
    await tx.frase.deleteMany({ where: { setId } });

    return tx.set.update({
      where: { id: setId },
      data: {
        nombre: nombre.trim(),
        frases: { create: normalizarFrases(frases) },
      },
      include: { frases: { orderBy: { orden: 'asc' } } },
    });
  });

  return setActualizado;
}

/**
 * Elimina un set. Las frases se eliminan en cascada (ON DELETE CASCADE
 * definido en el schema de Prisma / la base de datos).
 */
export async function eliminarSet(usuarioId, setId) {
  const setExistente = await prisma.set.findFirst({
    where: { id: setId, usuarioId },
  });

  if (!setExistente) {
    throw new AppError(404, 'Set no encontrado');
  }

  await prisma.set.delete({ where: { id: setId } });
}
