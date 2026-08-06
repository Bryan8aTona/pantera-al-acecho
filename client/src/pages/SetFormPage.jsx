import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import SetForm from '../components/SetForm.jsx';
import './SetFormPage.css';

export default function SetFormPage() {
  const { id } = useParams(); // presente solo en modo edición
  const esEdicion = Boolean(id);
  const navigate = useNavigate();

  const [valorInicial, setValorInicial] = useState(null);
  const [cargando, setCargando] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!esEdicion) return;
    api
      .get(`/sets/${id}/frases`)
      .then((data) => setValorInicial(data.set))
      .catch((err) => setError(err.message || 'No se pudo abrir el set'))
      .finally(() => setCargando(false));
  }, [id, esEdicion]);

  async function guardarSet(payload) {
    setGuardando(true);
    try {
      if (esEdicion) {
        await api.put(`/sets/${id}`, payload);
      } else {
        await api.post('/sets', payload);
      }
      navigate('/');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="set-form-page">
      <header className="set-form-page-header">
        <Link to="/" className="btn-secundario">
          ← Mis sets
        </Link>
        <h1>{esEdicion ? 'Editar set' : 'Nuevo set'}</h1>
      </header>

      {error && <p className="set-form-page-error" role="alert">{error}</p>}

      {cargando ? (
        <p className="set-form-page-estado">Cargando el set…</p>
      ) : (
        <SetForm
          valorInicial={valorInicial}
          onGuardar={guardarSet}
          onCancelar={() => navigate('/')}
          guardando={guardando}
        />
      )}
    </div>
  );
}
