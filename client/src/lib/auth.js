const TOKEN_KEY = 'pantera_token';
const USUARIO_KEY = 'pantera_usuario';

// El token y los datos básicos del docente se guardan en localStorage
// por simplicidad (ver arquitectura.md, sección 4.1: sistema operado
// únicamente por el docente en su propio equipo).

export function guardarSesion({ token, usuario }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
}

export function obtenerToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function obtenerUsuarioGuardado() {
  const raw = localStorage.getItem(USUARIO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function limpiarSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USUARIO_KEY);
}
