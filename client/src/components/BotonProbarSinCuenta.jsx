import { useNavigate } from 'react-router-dom';
import { usePartida } from '../context/PartidaContext.jsx';
import { SET_EJEMPLO } from '../lib/setEjemplo.js';

// Modo invitado: arranca una partida con el set de ejemplo, sin cuenta
// y sin tocar Firestore, y lleva directo al Tablero.
export default function BotonProbarSinCuenta({ className }) {
  const { iniciarPartida } = usePartida();
  const navigate = useNavigate();

  function probar() {
    iniciarPartida(SET_EJEMPLO, { invitado: true });
    navigate('/partida');
  }

  return (
    <button type="button" className={className} onClick={probar}>
      Probar sin cuenta
    </button>
  );
}
