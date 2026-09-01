import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listarSets, obtenerSet } from '../lib/sets.js';
import { usePartida } from '../context/PartidaContext.jsx';
import './ConfiguracionPartidaPage.css';

const formateador = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' });

export default function ConfiguracionPartidaPage() {
  const [sets, setSets] = useState(null); // null = cargando
  const [seleccionId, setSeleccionId] = useState(null);
  const [error, setError] = useState(null);
  const [iniciando, setIniciando] = useState(false);

  const { iniciarPartida } = usePartida();
  const navigate = useNavigate();

  useEffect(() => {
    listarSets()
      .then((lista) => setSets(lista))
      .catch((err) => setError(err.message || 'No se pudieron cargar tus sets'));
  }, []);

  async function manejarInicio() {
    if (!seleccionId) return;
    setError(null);
    setIniciando(true);
    try {
      // Descarga completa del set elegido: nombre + las 8 frases.
      // A partir de aquí toda la partida corre en memoria del cliente.
      const set = await obtenerSet(seleccionId);
      iniciarPartida(set);
      navigate('/partida');
    } catch (err) {
      setError(err.message || 'No se pudo iniciar la partida');
      setIniciando(false);
    }
  }

  return (
    <div className="config-partida">
      <header className="config-partida-header">
        <div>
          <h1>Configurar partida</h1>
          <p className="config-partida-sub">Elige el set de frases con el que va a jugar el grupo</p>
        </div>
        <Link to="/panel" className="btn-secundario">
          ← Mis sets
        </Link>
      </header>

      {error && <p className="config-partida-error" role="alert">{error}</p>}

      {sets === null && <p className="config-partida-estado">Cargando tus sets…</p>}

      {sets && sets.length === 0 && (
        <div className="config-partida-vacio">
          <p>No tienes sets de frases todavía.</p>
          <Link to="/panel" className="btn-primario">
            Crear mi primer set
          </Link>
        </div>
      )}

      {sets && sets.length > 0 && (
        <>
          <ul className="config-partida-lista" role="radiogroup" aria-label="Set de frases">
            {sets.map((set) => (
              <li key={set.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={seleccionId === set.id}
                  className={seleccionId === set.id ? 'set-opcion seleccionada' : 'set-opcion'}
                  onClick={() => setSeleccionId(set.id)}
                >
                  <span className="set-opcion-check" aria-hidden="true" />
                  <span>
                    <strong>{set.nombre}</strong>
                    {set.updatedAt && <small>Editado el {formateador.format(set.updatedAt)}</small>}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="config-partida-acciones">
            <button
              type="button"
              className="btn-primario btn-grande"
              disabled={!seleccionId || iniciando}
              onClick={manejarInicio}
            >
              {iniciando ? 'Cargando partida…' : 'Iniciar partida'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
