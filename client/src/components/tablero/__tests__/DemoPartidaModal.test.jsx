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

const leyenda = (i) => screen.getByText(PASOS[i].leyenda);

describe('DemoPartidaModal', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('se cierra con el botón principal y con la ✕', () => {
    const onCerrar = montar();
    fireEvent.click(screen.getByRole('button', { name: '¡A jugar!' }));
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

  it('no avanza solo: se queda en el paso hasta que el docente lo cambia', () => {
    vi.useFakeTimers();
    montar();
    act(() => vi.advanceTimersByTime(120_000));
    expect(leyenda(0)).toBeInTheDocument();
  });

  it('las bolitas y los botones llevan a cualquier paso', () => {
    montar();
    fireEvent.click(screen.getByRole('button', { name: 'Paso 5' }));
    expect(leyenda(4)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Paso siguiente' }));
    expect(leyenda(5)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Paso anterior' }));
    expect(leyenda(4)).toBeInTheDocument();
  });

  it('las flechas del teclado mueven entre pasos, de forma circular', () => {
    montar();
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(leyenda(1)).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(leyenda(PASOS.length - 1)).toBeInTheDocument();
  });
});
