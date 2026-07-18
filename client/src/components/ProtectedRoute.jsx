import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { usuario, token } = useAuth();

  if (!usuario || !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
