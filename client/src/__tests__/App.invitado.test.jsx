import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StrictMode } from 'react';
import App from '../App.jsx';

// Sin sesión: se simula AuthContext para no cargar el SDK de Firebase.
// Se monta la App real (rutas, React.lazy y guardas) igual que main.jsx.
vi.mock('../context/AuthContext.jsx', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    usuario: null,
    cargando: false,
    iniciarSesion: vi.fn(),
    registrar: vi.fn(),
    cerrarSesion: vi.fn(),
  }),
}));

// El Tablero es un chunk diferido: su primera carga puede tardar.
const ESPERA = { timeout: 5000 };

function montarEn(ruta) {
  window.history.pushState({}, '', ruta);
  return render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

afterEach(() => {
  window.history.pushState({}, '', '/');
});

describe('Modo invitado (sin cuenta)', () => {
  it('desde la portada, "Probar sin cuenta" abre el Tablero con el set de ejemplo', async () => {
    montarEn('/');
    fireEvent.click(screen.getByRole('button', { name: 'Probar sin cuenta' }));

    expect(await screen.findByRole('heading', { name: 'Ciencias naturales (ejemplo)' }, ESPERA)).toBeInTheDocument();
    expect(window.location.pathname).toBe('/partida');
  });

  it('desde el login también se puede probar sin cuenta', async () => {
    montarEn('/login');
    fireEvent.click(screen.getByRole('button', { name: 'Probar sin cuenta' }));

    expect(await screen.findByRole('heading', { name: 'Ciencias naturales (ejemplo)' }, ESPERA)).toBeInTheDocument();
  });

  it('al salir de la partida, el invitado vuelve a la portada', async () => {
    montarEn('/');
    fireEvent.click(screen.getByRole('button', { name: 'Probar sin cuenta' }));
    await screen.findByRole('heading', { name: 'Ciencias naturales (ejemplo)' }, ESPERA);

    fireEvent.keyDown(document, { key: 'Escape' }); // cierra la demostración
    fireEvent.click(screen.getByRole('button', { name: 'Salir de la partida' }));

    expect(await screen.findByRole('heading', { name: '¿Qué es Pantera al Acecho?' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
  });

  it('entrar a /partida sin una partida en memoria termina en el login', async () => {
    montarEn('/partida');
    expect(await screen.findByRole('tab', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });

  it.each(['/panel', '/sets/nuevo', '/configuracion-partida'])('%s sigue pidiendo sesión', async (ruta) => {
    montarEn(ruta);
    expect(await screen.findByRole('tab', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });
});
