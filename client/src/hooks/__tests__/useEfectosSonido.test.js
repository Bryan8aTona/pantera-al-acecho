import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { useEfectosSonido } from '../useEfectosSonido.js';
import { reproducirSonido } from '../../sonido/gestorSonido.js';

vi.mock('../../sonido/gestorSonido.js', () => ({
  reproducirSonido: vi.fn(),
}));

const ESTADO_BASE = { fase: 'REPECHAJE', letrasUsadas: {} };

function montar(opciones) {
  return renderHook(({ estado, opciones }) => useEfectosSonido(estado, opciones), {
    wrapper: StrictMode,
    initialProps: { estado: ESTADO_BASE, opciones },
  });
}

describe('useEfectosSonido — arranque de la Ronda de Repechaje', () => {
  beforeEach(() => {
    reproducirSonido.mockClear();
  });

  it('no suena si repechajeVisible ya nace en true (sin flanco)', () => {
    montar({ mostrarZarpazo: false, mostrarVictoria: false, repechajeVisible: true });
    expect(reproducirSonido).not.toHaveBeenCalledWith('repechaje');
  });

  it('suena justo en el flanco false -> true de repechajeVisible', () => {
    const { rerender } = montar({ mostrarZarpazo: false, mostrarVictoria: false, repechajeVisible: false });
    expect(reproducirSonido).not.toHaveBeenCalledWith('repechaje');

    rerender({
      estado: ESTADO_BASE,
      opciones: { mostrarZarpazo: false, mostrarVictoria: false, repechajeVisible: true },
    });

    expect(reproducirSonido).toHaveBeenCalledWith('repechaje');
    expect(reproducirSonido).toHaveBeenCalledTimes(1);
  });

  it('no suena mientras el cambio de fase sigue tapado por Victoria/Revelación', () => {
    // Simula: la fase ya cambió a REPECHAJE (mostrarAnuncioRepechaje
    // interno sería true) pero repechajeVisible se mantiene en false
    // porque primero tapa la Victoria y luego la Revelación.
    const { rerender } = montar({ mostrarZarpazo: false, mostrarVictoria: true, repechajeVisible: false });

    rerender({
      estado: ESTADO_BASE,
      opciones: { mostrarZarpazo: false, mostrarVictoria: false, repechajeVisible: false }, // ahora tapa Revelación
    });

    expect(reproducirSonido).not.toHaveBeenCalledWith('repechaje');
  });
});
