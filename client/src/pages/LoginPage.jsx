import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/campo.css';
import './LoginPage.css';

export default function LoginPage() {
  const [modo, setModo] = useState('login'); // 'login' | 'registro'
  const [form, setForm] = useState({ email: '', password: '', nombre: '' });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const { iniciarSesion, registrar } = useAuth();
  const navigate = useNavigate();

  function actualizarCampo(campo) {
    return (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      if (modo === 'login') {
        await iniciarSesion({ email: form.email, password: form.password });
      } else {
        await registrar(form);
      }
      navigate('/panel', { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo completar la operación.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <img src="/assets/logo-uam.png" alt="UAM" className="login-brand-mark" />
          <h1>Pantera al Acecho</h1>
          <p className="login-brand-sub">Panel del docente</p>
        </div>

        <div className="login-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={modo === 'login'}
            className={modo === 'login' ? 'login-tab activo' : 'login-tab'}
            onClick={() => setModo('login')}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={modo === 'registro'}
            className={modo === 'registro' ? 'login-tab activo' : 'login-tab'}
            onClick={() => setModo('registro')}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={manejarEnvio} className="login-form">
          {modo === 'registro' && (
            <label className="campo">
              <span>Nombre</span>
              <input
                type="text"
                value={form.nombre}
                onChange={actualizarCampo('nombre')}
                required
                autoComplete="name"
              />
            </label>
          )}

          <label className="campo">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={actualizarCampo('email')}
              required
              autoComplete="email"
            />
          </label>

          <label className="campo">
            <span>Contraseña</span>
            <input
              type="password"
              value={form.password}
              onChange={actualizarCampo('password')}
              required
              minLength={modo === 'registro' ? 8 : undefined}
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
            />
            {modo === 'registro' && <small>Mínimo 8 caracteres</small>}
          </label>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" className="login-submit" disabled={enviando}>
            {enviando ? 'Un momento…' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}
