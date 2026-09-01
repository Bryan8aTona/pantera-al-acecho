import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PanelRepechaje from '../PanelRepechaje.jsx';

describe('PanelRepechaje', () => {
  const equipos = [
    { id: 'rojo', nombre: 'Rojo' },
    { id: 'verde', nombre: 'Verde' },
  ];

  it('anuncia el repechaje y lista los equipos que siguen en juego', () => {
    render(<PanelRepechaje equipos={equipos} onComenzar={() => {}} />);

    expect(screen.getByText(/Comienza la Ronda de Repechaje/i)).toBeInTheDocument();
    expect(screen.getByText('Rojo')).toBeInTheDocument();
    expect(screen.getByText('Verde')).toBeInTheDocument();
  });

  it('el botón dispara onComenzar', () => {
    const onComenzar = vi.fn();
    render(<PanelRepechaje equipos={equipos} onComenzar={onComenzar} />);

    fireEvent.click(screen.getByRole('button', { name: /Comenzar repechaje/i }));
    expect(onComenzar).toHaveBeenCalledTimes(1);
  });
});
