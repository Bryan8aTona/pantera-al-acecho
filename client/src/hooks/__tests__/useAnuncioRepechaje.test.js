import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { StrictMode } from 'react';
import { useAnuncioRepechaje } from '../useAnuncioRepechaje.js';

describe('useAnuncioRepechaje', () => {
  it('levanta la bandera solo al pasar de RONDA1 a REPECHAJE', () => {
    const { result, rerender } = renderHook(({ estado }) => useAnuncioRepechaje(estado), {
      wrapper: StrictMode,
      initialProps: { estado: { fase: 'RONDA1' } },
    });

    expect(result.current.mostrarAnuncioRepechaje).toBe(false);

    rerender({ estado: { fase: 'REPECHAJE' } });
    expect(result.current.mostrarAnuncioRepechaje).toBe(true);

    act(() => result.current.completarAnuncioRepechaje());
    expect(result.current.mostrarAnuncioRepechaje).toBe(false);
  });

  it('no se dispara en otras transiciones de fase', () => {
    const { result, rerender } = renderHook(({ estado }) => useAnuncioRepechaje(estado), {
      wrapper: StrictMode,
      initialProps: { estado: { fase: 'REPECHAJE' } },
    });

    rerender({ estado: { fase: 'CIERRE' } });
    expect(result.current.mostrarAnuncioRepechaje).toBe(false);
  });
});
