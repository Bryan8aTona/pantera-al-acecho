import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StrictMode, useEffect } from 'react';
import { PartidaProvider, usePartida } from '../../context/PartidaContext.jsx';
import TableroJuegoPage from '../TableroJuegoPage.jsx';

const DURACION_CLICK_CARTA_MS = 450;
const DURACION_IMPACTO_MS = 600;
const DURACION_ENCOGER_MS = 400;
const DURACION_LOTTIE_MOCK_MS = 100; // ver src/test-setup.js

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

function escribirEnCeldas(letras) {
  letras.split('').forEach((letra, i) => {
    const celda = screen.getByLabelText(`Letra ${i + 1} por completar`);
    fireEvent.change(celda, { target: { value: letra } });
  });
}

describe('Revelación de la frase (pausa docente)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('tras un robo exitoso: victoria -> revelación con la frase completa -> Continuar libera al siguiente equipo', () => {
    renderTablero();

    elegirCarta('1'); // GATO

    for (const letra of ['B', 'C', 'D', 'F']) {
      pedirLetraLibreYAvanzar(letra);
    }

    // 5to fallo: derrota -> vibración, video, overlay de garras.
    fireEvent.click(screen.getByRole('button', { name: 'H' }));
    act(() => {
      vi.advanceTimersByTime(DURACION_IMPACTO_MS);
    });
    const video = document.querySelector('video');
    act(() => {
      video.dispatchEvent(new Event('ended'));
    });
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByText(/única oportunidad de robar/i)).toBeInTheDocument();

    escribirEnCeldas('GATO');
    fireEvent.click(screen.getByRole('button', { name: 'Declarar frase' }));

    // Hubo ganador -> primero la animación de monedas (Lottie simulado,
    // ver test-setup.js). El valor del premio es aleatorio
    // (100/90/80/70/60), así que lo capturamos en vez de asumirlo.
    const textoVictoria = screen.getByText(/monedas!/i).textContent;
    const valorGanado = textoVictoria.match(/\d+/)[0];
    expect(screen.queryByText('GATO')).not.toBeInTheDocument(); // todavía no la revelación

    act(() => {
      vi.advanceTimersByTime(DURACION_LOTTIE_MOCK_MS);
    });

    // Ahora sí: la frase completa, visible, con pausa para el docente.
    expect(screen.getByText('GATO')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`ganó ${valorGanado}`, 'i'))).toBeInTheDocument();

    // No debe avanzar solo: el mazo del siguiente equipo aún no aparece.
    expect(screen.queryByText(/Elige una carta boca abajo/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    // Recién ahora se libera el turno del siguiente equipo.
    expect(screen.getByText(/Elige una carta boca abajo/i)).toBeInTheDocument();
  });

  it('cuando un equipo gana adivinando todas las letras sueltas (sin Modo Adivinar), también se revela la frase', () => {
    renderTablero();

    elegirCarta('5'); // SOL

    fireEvent.click(screen.getByRole('button', { name: 'S' }));
    fireEvent.click(screen.getByRole('button', { name: 'O' }));
    fireEvent.click(screen.getByRole('button', { name: 'L' })); // completa la frase sola

    const textoVictoria = screen.getByText(/monedas!/i).textContent;
    const valorGanado = textoVictoria.match(/\d+/)[0];

    act(() => {
      vi.advanceTimersByTime(DURACION_LOTTIE_MOCK_MS);
    });

    expect(screen.getByText('SOL')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`ganó ${valorGanado}`, 'i'))).toBeInTheDocument();
  });
});
