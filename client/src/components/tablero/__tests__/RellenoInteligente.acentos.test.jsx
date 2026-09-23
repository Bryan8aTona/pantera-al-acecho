import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RellenoInteligente from '../RellenoInteligente.jsx';

describe('RellenoInteligente — tildes y signos', () => {
  it('una vocal con tilde sin revelar es una celda editable, no un hueco', () => {
    render(<RellenoInteligente texto="Canción" letrasUsadas={{}} onEnviar={() => {}} />);
    expect(screen.getAllByRole('textbox')).toHaveLength(7);
  });

  it('la vocal con tilde queda bloqueada (con su tilde) al acertar la vocal sin tilde', () => {
    const { container } = render(
      <RellenoInteligente texto="Canción" letrasUsadas={{ O: 'acierto' }} onEnviar={() => {}} />,
    );
    expect(screen.getAllByRole('textbox')).toHaveLength(6);
    expect(container.querySelector('.celda-bloqueada')).toHaveTextContent('ó');
  });

  it('los signos de puntuación se muestran fijos y viajan en la respuesta', () => {
    const onEnviar = vi.fn();
    const { container } = render(
      <RellenoInteligente texto="¡Sí!" letrasUsadas={{ S: 'acierto' }} onEnviar={onEnviar} />,
    );
    const fijos = [...container.querySelectorAll('.progreso-celda.revelada:not(.celda-bloqueada)')];
    expect(fijos.map((el) => el.textContent)).toEqual(['¡', '!']);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'i' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adivinar' }));
    expect(onEnviar).toHaveBeenCalledWith('¡Si!');
  });
});
