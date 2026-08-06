import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StrictMode, useEffect } from 'react';
import { PartidaProvider, usePartida } from '../../context/PartidaContext.jsx';
import TableroJuegoPage from '../TableroJuegoPage.jsx';

// Regresión: la primera versión de useSecuenciasDramaticas usaba una
// ref mutada a mano para detectar "se resolvió una carta". Bajo
// React.StrictMode (que main.jsx SÍ activa, a diferencia de una prueba
// sin StrictMode) eso se rompe: StrictMode invoca el render dos veces
// con el mismo estado para detectar impurezas, y la ref -ya mutada por
// la primera pasada- hace que la segunda "vea" el cambio como si ya
// hubiera ocurrido, perdiendo el evento por completo. Por eso estas
// pruebas envuelven todo en <StrictMode>, igual que la app real.

const DURACION_CLICK_CARTA_MS = 450; // animación de clic antes de ELEGIR_CARTA
const DURACION_IMPACTO_MS = 600; // vibración + destello antes del video
const DURACION_ENCOGER_MS = 400; // se encoge de vuelta a la cajita chica

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

describe('Secuencias dramáticas bajo StrictMode (regresión)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('victoria automática por letras SÍ se detecta bajo StrictMode', () => {
    renderTablero();

    elegirCarta('5'); // SOL
    fireEvent.click(screen.getByRole('button', { name: 'S' }));
    fireEvent.click(screen.getByRole('button', { name: 'O' }));
    fireEvent.click(screen.getByRole('button', { name: 'L' }));

    expect(screen.getByText(/monedas!/i)).toBeInTheDocument();
  });

  it('cuando el robo falla (nadie gana), la revelación igual aparece bajo StrictMode', () => {
    renderTablero();

    elegirCarta('1'); // GATO

    for (const letra of ['B', 'C', 'D', 'F']) {
      pedirLetraLibreYAvanzar(letra);
    }

    // 5to fallo: vibración/destello (600ms) y luego el video a pantalla completa.
    fireEvent.click(screen.getByRole('button', { name: 'H' }));
    act(() => {
      vi.advanceTimersByTime(DURACION_IMPACTO_MS);
    });

    const video = document.querySelector('video');
    act(() => {
      video.dispatchEvent(new Event('ended'));
    });
    act(() => {
      vi.advanceTimersByTime(1100); // overlay de garras
    });

    expect(screen.getByText(/única oportunidad de robar/i)).toBeInTheDocument();

    // El robo declara mal la frase a propósito -> nadie gana.
    'XXXX'.split('').forEach((letra, i) => {
      fireEvent.change(screen.getByLabelText(`Letra ${i + 1} por completar`), {
        target: { value: letra },
      });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Declarar frase' }));

    // Sin ganador -> no hay animación de monedas, va directo a la revelación.
    expect(screen.queryByText(/monedas!/i)).not.toBeInTheDocument();
    expect(screen.getByText('GATO')).toBeInTheDocument();
    expect(screen.getByText(/nadie ganó/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText(/Elige una carta boca abajo/i)).toBeInTheDocument();
  });
});
