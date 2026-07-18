import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import SetForm from '../components/SetForm.jsx';
import './BackOfficePage.css';

const formateador = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' });

export default function BackOfficePage() {
  const { usuario, cerrarSesion } = useAuth();

  const [sets, setSets] = useState(null); // null = cargando
  const [error, setError] = useState(null);

  const [formulario, setFormulario] = useState(null); // null | 'crear' | { id, nombre, frases }
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(null); // id del set a eliminar
  const [eliminandoId, setEliminandoId] = useState(null);

  const cargarSets = useCallback(async () => {
    try {
      const data = await api.get('/sets');
      setSets(data.sets);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los sets');
    }
  }, []);

  useEffect(() => {
    cargarSets();
  }, [cargarSets]);

  async function abrirEdicion(id) {
    setError(null);
    try {
      const data = await api.get(`/sets/${id}/frases`);
      setFormulario({ modo: 'editar', ...data.set });
    } catch (err) {
      setError(err.message || 'No se pudo abrir el set');
    }
  }

  async function guardarSet(payload) {
    setGuardando(true);
    try {
      if (formulario === 'crear') {
        await api.post('/sets', payload);
      } else {
        await api.put(`/sets/${formulario.id}`, payload);
      }
      setFormulario(null);
      await cargarSets();
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar(id) {
    setEliminandoId(id);
    try {
      await api.del(`/sets/${id}`);
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
        <button type="button" className="btn-secundario" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </header>

      {error && <p className="backoffice-error" role="alert">{error}</p>}

      {formulario && (
        <div className="backoffice-overlay">
          <SetForm
            titulo={formulario === 'crear' ? 'Nuevo set' : 'Editar set'}
            valorInicial={formulario === 'crear' ? null : formulario}
            onGuardar={guardarSet}
            onCancelar={() => setFormulario(null)}
            guardando={guardando}
          />
        </div>
      )}

      <div className="backoffice-toolbar">
        <button type="button" className="btn-primario" onClick={() => setFormulario('crear')}>
          + Nuevo set
        </button>
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
                <p className="set-card-meta">
                  {set.cantidadFrases} frases · actualizado el {formateador.format(new Date(set.updatedAt))}
                </p>
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
                  <button type="button" className="btn-secundario" onClick={() => abrirEdicion(set.id)}>
                    Editar
                  </button>
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
