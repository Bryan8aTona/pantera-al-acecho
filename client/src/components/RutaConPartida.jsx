import { Navigate } from 'react-router-dom';
import { usePartida } from '../context/PartidaContext.jsx';

// Evita entrar directo a /partida (por URL o recarga) sin haber
// pasado por Configuración de partida. Coherente con la decisión de
// que el estado de juego solo existe en memoria: si se perdió (recarga),
// no hay forma de "recuperar" la partida, hay que volver a configurarla.
export default function RutaConPartida({ children }) {
  const { hayPartidaActiva } = usePartida();

  if (!hayPartidaActiva) {
    return <Navigate to="/configuracion-partida" replace />;
  }

  return children;
}
