import { COSTO_ACIERTO_SEGURO, PANTERA_ESTADO_DERROTA } from './constantes.js';
import { MotorError } from './errores.js';
import { normalizarLetra } from './normalizacion.js';
import { claveIntento, esLetra, letrasUnicasPorCategoria } from './letras.js';

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
    if (!esLetra(caracter)) {
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

// Por qué el equipo NO puede comprar un Acierto Seguro de esa categoría
// sobre esa frase (un MotorError listo para lanzar), o null si puede.
// Única fuente de verdad: el reducer lo lanza y el Tablero lo usa para
// deshabilitar el botón.
export function impedimentoAciertoSeguro(equipo, categoria, fraseTexto, letrasUsadas) {
  const clave = claveIntento(categoria);
  if (equipo.intentos[clave] <= 0) {
    return new MotorError('SIN_INTENTOS', `El equipo no tiene intentos de ${categoria} disponibles`);
  }
  if (equipo.saldo < COSTO_ACIERTO_SEGURO[categoria]) {
    return new MotorError('SALDO_INSUFICIENTE', 'El equipo no tiene saldo suficiente');
  }
  if (!hayLetrasDisponiblesAciertoSeguro(fraseTexto, categoria, letrasUsadas)) {
    return new MotorError(
      'SIN_LETRAS_DISPONIBLES',
      `No quedan letras de tipo ${categoria} por descubrir en esta frase`,
    );
  }
  return null;
}

// Equipo que tiene el turno en este momento (considera el robo).
export function equipoEnTurnoActual(estado) {
  if (estado.modoRobo) return estado.equipos[estado.modoRobo.equipoId];
  const id = estado.ordenTurnoActual[estado.turnoActualIndex];
  return id ? estado.equipos[id] : null;
}

// Equipo dueño del turno normal, sin considerar el robo (el que acaba de
// perder su carta mientras otro equipo intenta robarla).
export function equipoDelTurnoNormal(estado) {
  const id = estado.ordenTurnoActual[estado.turnoActualIndex];
  return id ? estado.equipos[id] : null;
}

// Carta que se está jugando ahora mismo: la del robo si hay uno en curso,
// si no la elegida por el equipo en turno, o null si aún no eligió.
export function cartaEnJuego(estado) {
  if (estado.modoRobo) return estado.mazo[estado.modoRobo.cartaId];
  return estado.cartaActualId ? estado.mazo[estado.cartaActualId] : null;
}

// Ronda 2: el equipo en turno llegó al estado de derrota de la pantera y
// su carta sigue abierta, esperando a que el Tablero termine la secuencia
// del zarpazo y la cierre con CONFIRMAR_DERROTA (en Ronda 1 ese mismo
// momento abre el Robo en su lugar).
export function hayDerrotaPendiente(estado) {
  if (estado.ronda !== 2 || !estado.cartaActualId || estado.modoRobo) return false;
  const equipo = equipoDelTurnoNormal(estado);
  return Boolean(equipo) && equipo.panteraEstado >= PANTERA_ESTADO_DERROTA;
}
