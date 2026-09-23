import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StrictMode, useEffect } from 'react';
import { PartidaProvider, usePartida } from '../../context/PartidaContext.jsx';
import TableroJuegoPage from '../TableroJuegoPage.jsx';

// La partida arranca directo en el Repechaje (llegar ahí jugando toda la
// Ronda 1 desde la UI haría la prueba muy larga): solo `azul` sigue en
// juego, con los límites de Ronda 2 y la pantera reiniciada.
vi.mock('../../motor/estadoInicial.js', () => ({
  crearEstadoInicial: () => {
    const equipo = (id, extra) => ({
      id,
      nombre: id[0].toUpperCase() + id.slice(1),
      saldo: 200,
      intentos: { vocales: 3, consonantes: 8 },
      panteraEstado: 0,
      gano: true,
      ...extra,
    });
    const carta = (n, texto, jugada) => ({
      id: `f${n}`, texto, orden: n, valor: 80, jugada, ganadorId: null,
    });
    return {
      fase: 'REPECHAJE',
      ronda: 2,
      equipos: {
        rojo: equipo('rojo'),
        azul: equipo('azul', { intentos: { vocales: 2, consonantes: 5 }, gano: null }),
        amarillo: equipo('amarillo'),
        verde: equipo('verde'),
      },
      ordenTurnoRonda1: ['rojo', 'azul', 'amarillo', 'verde'],
      ordenTurnoActual: ['azul'],
      turnoActualIndex: 0,
      turnosCompletados: 0,
      mazo: {
        f1: carta(1, 'GATO', true),
        f2: carta(2, 'PERRO', true),
        f3: carta(3, 'CASA', true),
        f4: carta(4, 'LUNA', true),
        f5: carta(5, 'SOL', false),
        f6: carta(6, 'MAR', false),
        f7: carta(7, 'RIO', false),
        f8: carta(8, 'FLOR', false),
      },
      cartaActualId: null,
      letrasUsadas: {},
      modoAdivinarActivo: false,
      modoRobo: null,
      cierre: null,
    };
  },
}));

const DURACION_CLICK_CARTA_MS = 450;

function ArrancarPartida({ children }) {
  const { iniciarPartida, set } = usePartida();
  useEffect(() => {
    if (!set) iniciarPartida({ id: 'set-1', nombre: 'Set de prueba', frases: [] });
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

function terminarVideo() {
  act(() => {
    document.querySelector('video').dispatchEvent(new Event('ended'));
  });
}

describe('Repechaje: derrota por pantera (Tablero de juego)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('tras el zarpazo se revela la frase sin ganador — nunca aparece el panel de Robo', () => {
    renderTablero();

    fireEvent.click(screen.getByText('5').closest('button')); // SOL
    act(() => {
      vi.advanceTimersByTime(DURACION_CLICK_CARTA_MS);
    });

    for (const letra of ['B', 'C', 'D', 'F']) {
      fireEvent.click(screen.getByRole('button', { name: letra }));
      terminarVideo();
    }

    // 5º fallo: video del estado 5 en la cajita, aún sin revelación.
    fireEvent.click(screen.getByRole('button', { name: 'G' }));
    expect(document.querySelector('video').getAttribute('src')).toBe(
      '/assets/pantera/pantera-estado-5-zarpazo.mp4',
    );
    expect(screen.queryByText('La frase era')).not.toBeInTheDocument();

    terminarVideo();
    expect(document.querySelector('.zarpazo-overlay')).toBeInTheDocument();
    expect(screen.queryByText('La frase era')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(document.querySelector('.zarpazo-overlay')).not.toBeInTheDocument();
    expect(screen.queryByText(/única oportunidad de robar/i)).not.toBeInTheDocument();
    expect(screen.getByText('La frase era')).toBeInTheDocument();
    expect(screen.getByText('SOL')).toBeInTheDocument();
    expect(screen.getByText('Nadie ganó esta frase')).toBeInTheDocument();

    // Era el único equipo del repechaje: al continuar, marcador final.
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText('Marcador final')).toBeInTheDocument();
  });
});
