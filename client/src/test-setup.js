import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { useEffect } from 'react';

afterEach(() => {
  cleanup();
});

// lottie-web (usado por lottie-react) requiere <canvas>, que jsdom no
// implementa. Se simula con un stub que dispara onComplete tras un
// temporizador corto y controlable con vi.advanceTimersByTime en las
// pruebas — evita depender del paquete nativo "canvas" (frágil de
// compilar, sobre todo en Windows).
vi.mock('lottie-react', () => ({
  default: function LottieMock({ onComplete }) {
    useEffect(() => {
      const temporizador = setTimeout(() => onComplete?.(), 100);
      return () => clearTimeout(temporizador);
    }, [onComplete]);
    return null;
  },
}));
