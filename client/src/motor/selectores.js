import { normalizarLetra } from './normalizacion.js';
import { letrasUnicasPorCategoria } from './letras.js';

// Un equipo debe pasar a Modo Adivinar cuando agotó AMBOS límites de
// intentos (requerimientos.md 3.5.a). Se deriva, no se guarda en el
// estado, para no tener dos fuentes de verdad.
export function debeAdivinar(equipo) {
  return equipo.intentos.vocales === 0 && equipo.intentos.consonantes === 0;
}

// Progreso visual de la frase: qué caracteres mostrar y cuáles ocultar.
// Los espacios y signos de puntuación siempre se muestran.
export function progresoDeFrase(fraseTexto, letrasUsadas) {
  return fraseTexto.split('').map((caracter) => {
    if (!/[A-ZÑa-zñ]/i.test(caracter)) {
      return { caracter, revelada: true };
    }
    const letraNorm = normalizarLetra(caracter);
    return { caracter, revelada: letrasUsadas[letraNorm] === 'acierto' };
  });
}

// Para habilitar/deshabilitar el botón de Acierto Seguro en la UI.
export function hayLetrasDisponiblesAciertoSeguro(fraseTexto, categoria, letrasUsadas) {
  return letrasUnicasPorCategoria(fraseTexto, categoria).some((letra) => !letrasUsadas[letra]);
}

// Equipo que tiene el turno en este momento (considera el robo).
export function equipoEnTurnoActual(estado) {
  if (estado.modoRobo) return estado.equipos[estado.modoRobo.equipoId];
  const id = estado.ordenTurnoActual[estado.turnoActualIndex];
  return id ? estado.equipos[id] : null;
}
