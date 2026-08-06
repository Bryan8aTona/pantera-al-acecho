import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StrictMode, useEffect } from 'react';
import { PartidaProvider, usePartida } from '../../context/PartidaContext.jsx';
import TableroJuegoPage from '../TableroJuegoPage.jsx';

const DURACION_CLICK_CARTA_MS = 450;
const DURACION_IMPACTO_MS = 600;
const DURACION_ENCOGER_MS = 400;

// Set determinístico: los IDs y el orden de las frases están fijos, así
// que la carta de "orden 1" siempre es GATO sin importar qué equipo le
// toque jugar (el orden de equipos SÍ es aleatorio, y no nos importa
// para esta prueba).
const SET_PRUEBA = {
  id: 'set-1',
  nombre: 'Set de prueba',
  frases: [
    { id: 'f1', texto: 'GATO', orden: 1 },
    { id: 'f2', texto: 'PERRO', orden: 2 },
    { id: 'f3', texto: 'CASA', orden: 3 },
    { id: 'f4', texto: 'LUNA', orden: 4 },
    { id: 'f5', texto: 'SOL', orden: 5 },
    { id: 'f6', texto: 'MAR', orden: 6 },
    { id: 'f7', texto: 'RIO', orden: 7 },
    { id: 'f8', texto: 'FLOR', orden: 8 },
  ],
};

function ArrancarPartida({ children }) {
  const { iniciarPartida, set } = usePartida();
  useEffect(() => {
    if (!set) iniciarPartida(SET_PRUEBA);
  }, [set, iniciarPartida]);
  if (!set) return null;
  return children;
}

function renderTablero() {
  return render(
    <StrictMode>
      <MemoryRouter>
        <PartidaProvider>
          <ArrancarPartida>
            <TableroJuegoPage />
          </ArrancarPartida>
        </PartidaProvider>
      </MemoryRouter>
    </StrictMode>,
  );
}

function elegirCarta(numero) {
  fireEvent.click(screen.getByText(numero).closest('button'));
  act(() => {
    vi.advanceTimersByTime(DURACION_CLICK_CARTA_MS);
  });
}

// Para un fallo que NO llega a la derrota (estados 1-4): pide la letra
// y avanza toda la mini-secuencia (vibración -> video -> se encoge)
// hasta volver al juego normal, listo para la siguiente letra.
function pedirLetraLibreYAvanzar(letra) {
  fireEvent.click(screen.getByRole('button', { name: letra }));
  act(() => {
    vi.advanceTimersByTime(DURACION_IMPACTO_MS);
  });
  const video = document.querySelector('video');
  act(() => {
    video.dispatchEvent(new Event('ended'));
  });
  act(() => {
    vi.advanceTimersByTime(DURACION_ENCOGER_MS);
  });
}

describe('Secuencia dramática de derrota (Tablero de juego)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reproduce el video del estado 5 y el overlay ANTES de mostrar el panel de Robo', () => {
    renderTablero();

    elegirCarta('1'); // GATO

    // Estado 0: sin video todavía.
    expect(document.querySelector('video')).not.toBeInTheDocument();

    // 4 fallos que no llegan a la derrota, cada uno con su propia
    // mini-secuencia (vibración + pantalla completa + se encoge).
    for (const letra of ['B', 'C', 'D', 'F']) {
      pedirLetraLibreYAvanzar(letra);
    }

    // 5to fallo: derrota. Primero vibración + destello.
    fireEvent.click(screen.getByRole('button', { name: 'H' }));
    act(() => {
      vi.advanceTimersByTime(DURACION_IMPACTO_MS);
    });

    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video.getAttribute('src')).toBe('/assets/pantera/pantera-estado-5-zarpazo.mp4');

    // El Robo todavía NO debe verse: la secuencia lo está tapando.
    expect(screen.queryByText(/única oportunidad de robar/i)).not.toBeInTheDocument();

    act(() => {
      video.dispatchEvent(new Event('ended'));
    });

    // Overlay de garras visible, Robo aún tapado.
    expect(document.querySelector('.zarpazo-overlay')).toBeInTheDocument();
    expect(screen.queryByText(/única oportunidad de robar/i)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    // Recién ahora aparece el panel de Robo.
    expect(screen.getByText(/única oportunidad de robar/i)).toBeInTheDocument();
  });

  it('muestra en vivo el video correspondiente a cada estado de la pantera', () => {
    renderTablero();
    elegirCarta('1');

    fireEvent.click(screen.getByRole('button', { name: 'B' })); // fallo 1
    act(() => {
      vi.advanceTimersByTime(DURACION_IMPACTO_MS);
    });
    expect(document.querySelector('video').getAttribute('src')).toBe(
      '/assets/pantera/pantera-estado-1.mp4',
    );

    act(() => {
      document.querySelector('video').dispatchEvent(new Event('ended'));
    });
    act(() => {
      vi.advanceTimersByTime(DURACION_ENCOGER_MS);
    });

    fireEvent.click(screen.getByRole('button', { name: 'C' })); // fallo 2
    act(() => {
      vi.advanceTimersByTime(DURACION_IMPACTO_MS);
    });
    expect(document.querySelector('video').getAttribute('src')).toBe(
      '/assets/pantera/pantera-estado-2.mp4',
    );
  });

  it('si el video falla al cargar, la secuencia de derrota igual avanza (no deja el juego trabado)', () => {
    renderTablero();
    elegirCarta('1');

    for (const letra of ['B', 'C', 'D', 'F']) {
      pedirLetraLibreYAvanzar(letra);
    }

    fireEvent.click(screen.getByRole('button', { name: 'H' }));
    act(() => {
      vi.advanceTimersByTime(DURACION_IMPACTO_MS);
    });

    const video = document.querySelector('video');
    act(() => {
      video.dispatchEvent(new Event('error'));
    });

    expect(document.querySelector('.zarpazo-overlay')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByText(/única oportunidad de robar/i)).toBeInTheDocument();
  });
});
