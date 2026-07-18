import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma.js';
import AppError from '../../utils/AppError.js';
import { firmarToken } from '../../utils/jwt.js';

const SALT_ROUNDS = 10;

// Nunca devolver passwordHash al cliente.
function serializarUsuario(usuario) {
  return {
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    createdAt: usuario.createdAt,
  };
}

export async function registrarUsuario({ email, password, nombre }) {
  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    throw new AppError(409, 'Ya existe una cuenta con ese email');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const usuario = await prisma.usuario.create({
    data: { email, passwordHash, nombre: nombre.trim() },
  });

  const token = firmarToken({
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
  });

  return { usuario: serializarUsuario(usuario), token };
}

export async function iniciarSesion({ email, password }) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // Mensaje genérico: no revelar si el email existe o no.
  if (!usuario) {
    throw new AppError(401, 'Credenciales inválidas');
  }

  const passwordValido = await bcrypt.compare(password, usuario.passwordHash);
  if (!passwordValido) {
    throw new AppError(401, 'Credenciales inválidas');
  }

  const token = firmarToken({
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
  });

  return { usuario: serializarUsuario(usuario), token };
}

export async function obtenerUsuarioPorId(id) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) {
    throw new AppError(404, 'Usuario no encontrado');
  }
  return serializarUsuario(usuario);
}
