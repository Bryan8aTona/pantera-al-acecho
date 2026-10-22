import { StrictMode } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import DemoPartidaModal, { PASOS } from '../DemoPartidaModal.jsx';

function montar() {
  const onCerrar = vi.fn();
  render(
    <StrictMode>
      <DemoPartidaModal onCerrar={onCerrar} />
    </StrictMode>,
  );
  return onCerrar;
}

describe('DemoPartidaModal', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('se cierra con el botón principal y con la ✕', () => {
    const onCerrar = montar();
    fireEvent.click(screen.getByRole('button', { name: /a jugar/i }));
    fireEvent.click(screen.getByRole('button', { name: /cerrar demostración/i }));
    expect(onCerrar).toHaveBeenCalledTimes(2);
  });

  it('se cierra con Esc', () => {
    const onCerrar = montar();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it('se cierra con clic fuera, pero no con clic dentro', () => {
    const onCerrar = montar();
    const dialogo = screen.getByRole('dialog');
    fireEvent.click(dialogo);
    expect(onCerrar).not.toHaveBeenCalled();
    fireEvent.click(dialogo.parentElement);
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it('recorre el guion y vuelve a empezar en bucle', () => {
    vi.useFakeTimers();
    montar();
    expect(screen.getByText(PASOS[0].leyenda)).toBeInTheDocument();

    for (let i = 1; i < PASOS.length; i++) {
      act(() => vi.advanceTimersByTime(PASOS[i - 1].ms));
      expect(screen.getByText(PASOS[i].leyenda)).toBeInTheDocument();
    }

    act(() => vi.advanceTimersByTime(PASOS[PASOS.length - 1].ms));
    expect(screen.getByText(PASOS[0].leyenda)).toBeInTheDocument();
  });
});
