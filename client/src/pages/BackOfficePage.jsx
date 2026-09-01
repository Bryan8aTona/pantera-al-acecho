import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listarSets, eliminarSet } from '../lib/sets.js';
import { useAuth } from '../context/AuthContext.jsx';
import './BackOfficePage.css';

export default function BackOfficePage() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  async function manejarCerrarSesion() {
    await cerrarSesion();
    navigate('/');
  }

  const [sets, setSets] = useState(null); // null = cargando
  const [error, setError] = useState(null);
  const [confirmando, setConfirmando] = useState(null); // id del set a eliminar
  const [eliminandoId, setEliminandoId] = useState(null);

  const cargarSets = useCallback(async () => {
    try {
      setSets(await listarSets());
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los sets');
    }
  }, []);

  useEffect(() => {
    cargarSets();
  }, [cargarSets]);

  async function confirmarEliminar(id) {
    setEliminandoId(id);
    try {
      await eliminarSet(id);
      setConfirmando(null);
      await cargarSets();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el set');
    } finally {
      setEliminandoId(null);
    }
  }

  return (
    <div className="backoffice">
      <header className="backoffice-header">
        <div>
          <h1>Mis sets de frases</h1>
          <p className="backoffice-usuario">{usuario?.nombre}</p>
        </div>
        <button type="button" className="btn-secundario" onClick={manejarCerrarSesion}>
          Cerrar sesión
        </button>
      </header>

      {error && <p className="backoffice-error" role="alert">{error}</p>}

      <div className="backoffice-toolbar">
        <Link to="/sets/nuevo" className="btn-primario">
          + Nuevo set
        </Link>
        <Link to="/configuracion-partida" className="btn-secundario">
          Iniciar partida →
        </Link>
      </div>

      {sets === null && <p className="backoffice-estado">Cargando tus sets…</p>}

      {sets && sets.length === 0 && (
        <div className="backoffice-vacio">
          <p>Todavía no tienes sets de frases.</p>
          <p className="backoffice-vacio-sub">
            Crea el primero para poder iniciar una partida con tu grupo.
          </p>
        </div>
      )}

      {sets && sets.length > 0 && (
        <ul className="sets-grid">
          {sets.map((set) => (
            <li key={set.id} className="set-card">
              <div>
                <h3>{set.nombre}</h3>
              </div>

              {confirmando === set.id ? (
                <div className="set-card-confirmar">
                  <span>¿Eliminar este set?</span>
                  <div className="set-card-confirmar-botones">
                    <button
                      type="button"
                      className="btn-peligro"
                      onClick={() => confirmarEliminar(set.id)}
                      disabled={eliminandoId === set.id}
                    >
                      {eliminandoId === set.id ? 'Eliminando…' : 'Sí, eliminar'}
                    </button>
                    <button type="button" className="btn-secundario" onClick={() => setConfirmando(null)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="set-card-acciones">
                  <Link to={`/sets/${set.id}/editar`} className="btn-secundario">
                    Editar
                  </Link>
                  <button type="button" className="btn-peligro-outline" onClick={() => setConfirmando(set.id)}>
                    Eliminar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
