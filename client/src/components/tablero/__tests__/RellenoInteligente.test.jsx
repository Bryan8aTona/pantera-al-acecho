import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RellenoInteligente from '../RellenoInteligente.jsx';

describe('RellenoInteligente', () => {
  it('bloquea las letras ya reveladas y deja editables las demás', () => {
    render(<RellenoInteligente texto="SOL" letrasUsadas={{ O: 'acierto' }} onEnviar={() => {}} />);

    // La O ya revelada se muestra como texto fijo, no como input.
    expect(screen.getByText('O')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Letra 2/i)).not.toBeInTheDocument();

    // S y L quedan como inputs editables.
    expect(screen.getByLabelText('Letra 1 por completar')).toBeInTheDocument();
    expect(screen.getByLabelText('Letra 3 por completar')).toBeInTheDocument();
  });

  it('al escribir una letra, el foco salta a la siguiente celda editable (saltando las bloqueadas)', () => {
    render(<RellenoInteligente texto="SOL" letrasUsadas={{ O: 'acierto' }} onEnviar={() => {}} />);

    const celdaS = screen.getByLabelText('Letra 1 por completar');
    const celdaL = screen.getByLabelText('Letra 3 por completar');

    fireEvent.change(celdaS, { target: { value: 's' } });

    expect(celdaS).toHaveValue('S'); // se guarda en mayúscula
    expect(celdaL).toHaveFocus(); // saltó la O bloqueada directo a la L
  });

  it('Backspace en una celda vacía borra y regresa el foco a la anterior', () => {
    render(<RellenoInteligente texto="SOL" letrasUsadas={{ O: 'acierto' }} onEnviar={() => {}} />);

    const celdaS = screen.getByLabelText('Letra 1 por completar');
    const celdaL = screen.getByLabelText('Letra 3 por completar');

    fireEvent.change(celdaS, { target: { value: 'S' } });
    celdaL.focus();
    fireEvent.keyDown(celdaL, { key: 'Backspace' });

    expect(celdaS).toHaveValue(''); // se borró
    expect(celdaS).toHaveFocus(); // el foco regresó
  });

  it('el botón de envío está deshabilitado hasta llenar todas las celdas', () => {
    const onEnviar = vi.fn();
    render(<RellenoInteligente texto="SOL" letrasUsadas={{}} onEnviar={onEnviar} textoBoton="Adivinar" />);

    const boton = screen.getByRole('button', { name: 'Adivinar' });
    expect(boton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Letra 1 por completar'), { target: { value: 'S' } });
    fireEvent.change(screen.getByLabelText('Letra 2 por completar'), { target: { value: 'O' } });
    expect(boton).toBeDisabled(); // falta la L

    fireEvent.change(screen.getByLabelText('Letra 3 por completar'), { target: { value: 'L' } });
    expect(boton).toBeEnabled();

    fireEvent.click(boton);
    expect(onEnviar).toHaveBeenCalledWith('SOL');
  });

  it('Enter envía la respuesta cuando ya está completa', () => {
    const onEnviar = vi.fn();
    render(<RellenoInteligente texto="MAR" letrasUsadas={{}} onEnviar={onEnviar} />);

    fireEvent.change(screen.getByLabelText('Letra 1 por completar'), { target: { value: 'M' } });
    fireEvent.change(screen.getByLabelText('Letra 2 por completar'), { target: { value: 'A' } });
    const celdaR = screen.getByLabelText('Letra 3 por completar');
    fireEvent.change(celdaR, { target: { value: 'R' } });

    fireEvent.keyDown(celdaR, { key: 'Enter' });
    expect(onEnviar).toHaveBeenCalledWith('MAR');
  });

  it('cada celda toma el caso (mayús/minús) de la frase objetivo', () => {
    const onEnviar = vi.fn();
    // "Ana" -> A mayúscula, n y a minúsculas.
    render(<RellenoInteligente texto="Ana" letrasUsadas={{}} onEnviar={onEnviar} />);

    fireEvent.change(screen.getByLabelText('Letra 1 por completar'), { target: { value: 'a' } });
    fireEvent.change(screen.getByLabelText('Letra 2 por completar'), { target: { value: 'N' } });
    fireEvent.change(screen.getByLabelText('Letra 3 por completar'), { target: { value: 'A' } });

    expect(screen.getByLabelText('Letra 1 por completar')).toHaveValue('A'); // era mayúscula
    expect(screen.getByLabelText('Letra 2 por completar')).toHaveValue('n'); // era minúscula
    expect(screen.getByLabelText('Letra 3 por completar')).toHaveValue('a'); // era minúscula

    fireEvent.click(screen.getByRole('button', { name: 'Adivinar' }));
    expect(onEnviar).toHaveBeenCalledWith('Ana');
  });

  it('los espacios de la frase no generan celda editable ni bloqueada', () => {
    render(<RellenoInteligente texto="EL SOL" letrasUsadas={{}} onEnviar={() => {}} />);
    // "EL SOL" tiene 5 letras -> 5 celdas editables, el espacio no cuenta.
    expect(screen.getAllByRole('textbox')).toHaveLength(5);
  });
});
