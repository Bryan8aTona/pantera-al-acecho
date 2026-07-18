import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../lib/api.js';
import { guardarSesion, obtenerUsuarioGuardado, obtenerToken, limpiarSesion } from '../lib/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => obtenerUsuarioGuardado());
  const [token, setToken] = useState(() => obtenerToken());

  const registrar = useCallback(async ({ email, password, nombre }) => {
    const data = await api.post('/auth/register', { email, password, nombre }, { sinAuth: true });
    guardarSesion(data);
    setUsuario(data.usuario);
    setToken(data.token);
  }, []);

  const iniciarSesion = useCallback(async ({ email, password }) => {
    const data = await api.post('/auth/login', { email, password }, { sinAuth: true });
    guardarSesion(data);
    setUsuario(data.usuario);
    setToken(data.token);
  }, []);

  const cerrarSesion = useCallback(() => {
    limpiarSesion();
    setUsuario(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, token, registrar, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
