import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../lib/firebase.js';

const AuthContext = createContext(null);

// La sesión del docente la maneja Firebase Auth: persiste sola entre
// recargas y el estado se sincroniza con onAuthStateChanged. Aquí solo
// exponemos una vista mínima del usuario y las tres acciones.
function aUsuario(fbUser) {
  if (!fbUser) return null;
  return { uid: fbUser.uid, email: fbUser.email, nombre: fbUser.displayName || '' };
}

const MENSAJES_ERROR = {
  'auth/invalid-email': 'El email no es válido.',
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/wrong-password': 'Email o contraseña incorrectos.',
  'auth/user-not-found': 'Email o contraseña incorrectos.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
  'auth/weak-password': 'La contraseña debe tener al menos 8 caracteres.',
  'auth/network-request-failed': 'No se pudo conectar. Revisa tu conexión a internet.',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Espera un momento e inténtalo de nuevo.',
};

function traducirError(error) {
  return new Error(
    MENSAJES_ERROR[error?.code] || 'No se pudo completar la operación. Inténtalo de nuevo.',
  );
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  // Firebase resuelve el estado de sesión de forma asíncrona al cargar;
  // hasta entonces no sabemos si hay un docente autenticado.
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (fbUser) => {
      setUsuario(aUsuario(fbUser));
      setCargando(false);
    });
  }, []);

  const registrar = useCallback(async ({ email, password, nombre }) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (nombre?.trim()) {
        await updateProfile(cred.user, { displayName: nombre.trim() });
      }
      setUsuario(aUsuario(cred.user));
    } catch (error) {
      throw traducirError(error);
    }
  }, []);

  const iniciarSesion = useCallback(async ({ email, password }) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setUsuario(aUsuario(cred.user));
    } catch (error) {
      throw traducirError(error);
    }
  }, []);

  const cerrarSesion = useCallback(async () => {
    await signOut(auth);
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, cargando, registrar, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
