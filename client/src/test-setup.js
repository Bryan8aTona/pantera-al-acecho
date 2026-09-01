import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { useEffect } from 'react';

// Node 22 emite un ExperimentalWarning cada vez que se toca el global
// `localStorage` sin `--localstorage-file`. El gestor de sonido usa
// localStorage (a través de window, con try/catch) para recordar el
// silencio; en pruebas ese warning es ruido puro. Se filtra solo ese.
const emitirWarningOriginal = process.emitWarning.bind(process);
process.emitWarning = (aviso, ...resto) => {
  const mensaje = typeof aviso === 'string' ? aviso : aviso?.message;
  if (mensaje && mensaje.includes('localStorage is not available')) return;
  return emitirWarningOriginal(aviso, ...resto);
};

afterEach(() => {
  cleanup();
});

// jsdom no implementa play()/pause() de <video>/<audio>; sin esto,
// PanteraDisplay y el gestor de sonido llenan la salida de pruebas con
// "Not implemented: HTMLMediaElement.prototype.play".
window.HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
window.HTMLMediaElement.prototype.pause = vi.fn();
window.HTMLMediaElement.prototype.load = vi.fn();

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
