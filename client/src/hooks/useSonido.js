import { useCallback, useEffect, useState } from 'react';
import {
  reproducirSonido,
  estaSilenciado,
  alternarSilencio as alternarSilencioGestor,
  suscribirseASilencio,
  precargarSonidos,
} from '../sonido/gestorSonido.js';

// Envoltorio de React sobre el gestor de sonido. Sirve, sobre todo,
// para el botón de silencio: se re-renderiza cuando el estado cambia.
// Para disparar sonidos "sueltos" desde otros componentes se puede
// importar `reproducirSonido` directamente del gestor.
export function useSonido() {
  const [silenciado, setSilenciado] = useState(estaSilenciado);

  useEffect(() => {
    precargarSonidos();
    return suscribirseASilencio(setSilenciado);
  }, []);

  return {
    reproducir: useCallback((nombre, opciones) => reproducirSonido(nombre, opciones), []),
    silenciado,
    alternarSilencio: useCallback(() => alternarSilencioGestor(), []),
  };
}
