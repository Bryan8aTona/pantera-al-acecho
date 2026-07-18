import { obtenerToken, limpiarSesion } from './auth.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function solicitar(ruta, { method = 'GET', body, sinAuth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (!sinAuth) {
    const token = obtenerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // 204 No Content (ej. DELETE exitoso): no hay body que parsear.
  if (respuesta.status === 204) return null;

  const data = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    // Token inválido o expirado: limpiamos la sesión local para forzar
    // el redirect a /login en el próximo render de ProtectedRoute.
    if (respuesta.status === 401) {
      limpiarSesion();
    }
    throw new ApiError(respuesta.status, data?.error || 'Error inesperado');
  }

  return data;
}

export const api = {
  get: (ruta) => solicitar(ruta),
  post: (ruta, body, opts = {}) => solicitar(ruta, { method: 'POST', body, ...opts }),
  put: (ruta, body) => solicitar(ruta, { method: 'PUT', body }),
  del: (ruta) => solicitar(ruta, { method: 'DELETE' }),
};

export { ApiError };
