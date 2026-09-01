import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { usuario, cargando } = useAuth();

  // Mientras Firebase resuelve si hay sesión, no decidimos nada (evita
  // un parpadeo a /login al recargar estando autenticado).
  if (cargando) return null;

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
