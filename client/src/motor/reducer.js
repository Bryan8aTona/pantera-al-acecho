import { MotorError } from './errores.js';
import { LIMITES_INTENTOS, COSTO_ACIERTO_SEGURO, PANTERA_ESTADO_DERROTA, FASES } from './constantes.js';
import { normalizarTexto, normalizarLetra } from './normalizacion.js';
import {
  esLetra,
  categoriaDeLetra,
  claveIntento,
  posicionesDeLetra,
  letrasUnicasPorCategoria,
  letrasUnicasDeTexto,
} from './letras.js';
import { equipoEnTurnoActual, hayDerrotaPendiente, impedimentoAciertoSeguro } from './selectores.js';

// ---------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------

function equipoEnTurno(estado) {
  const equipo = equipoEnTurnoActual(estado);
  if (!equipo) throw new MotorError('SIN_TURNO', 'No hay un equipo en turno');
  return equipo.id;
}

function exigirSinDerrotaPendiente(estado) {
  if (hayDerrotaPendiente(estado)) {
    throw new MotorError('DERROTA_PENDIENTE', 'El equipo ya perdió esta frase');
  }
}

// Validación algorítmica de la respuesta (requerimientos.md 3.5).
function respuestaCorrecta(intento, carta) {
  return normalizarTexto(intento) === normalizarTexto(carta.texto);
}

function actualizarEquipo(estado, equipoId, cambios) {
  return {
    ...estado,
    equipos: {
      ...estado.equipos,
      [equipoId]: { ...estado.equipos[equipoId], ...cambios },
    },
  };
}

function actualizarCarta(estado, cartaId, cambios) {
  return {
    ...estado,
    mazo: {
      ...estado.mazo,
      [cartaId]: { ...estado.mazo[cartaId], ...cambios },
    },
  };
}

// El equipo puede ganar sin pasar nunca por Modo Adivinar, simplemente
// acertando todas las letras de la frase una por una (bug reportado en
// playtesting: el juego no lo detectaba). Se revisa después de cada
// letra correcta y después de cada Acierto Seguro.
function fraseCompletamenteRevelada(texto, letrasUsadas) {
  return letrasUnicasDeTexto(texto).every((letra) => letrasUsadas[letra] === 'acierto');
}

// El robo siempre se calcula sobre el orden COMPLETO del sorteo (los 4
// equipos), nunca sobre el subconjunto de la fase actual, porque el
// robo solo existe en Ronda 1. Es circular: si el equipo que pierde es
// el último del orden, el "siguiente" es el primero.
function obtenerEquipoRobo(estado, equipoFalloId) {
  const orden = estado.ordenTurnoRonda1;
  const idx = orden.indexOf(equipoFalloId);
  return orden[(idx + 1) % orden.length];
}

// ---------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------

export function motorReducer(estado, accion) {
  switch (accion.type) {
    case 'ELEGIR_CARTA':
      return manejarElegirCarta(estado, accion);
    case 'PEDIR_LETRA_LIBRE':
      return manejarPedirLetraLibre(estado, accion);
    case 'COMPRAR_ACIERTO_SEGURO':
      return manejarComprarAciertoSeguro(estado, accion);
    case 'ACTIVAR_MODO_ADIVINAR':
      return manejarActivarModoAdivinar(estado);
    case 'CANCELAR_MODO_ADIVINAR':
      return manejarCancelarModoAdivinar(estado);
    case 'ENVIAR_RESPUESTA':
      return manejarEnviarRespuesta(estado, accion);
    case 'CONFIRMAR_DERROTA':
      return manejarConfirmarDerrota(estado);
    default:
      throw new MotorError('ACCION_DESCONOCIDA', `Acción no reconocida: ${accion.type}`);
  }
}

// ---------------------------------------------------------------------
// ELEGIR_CARTA
// ---------------------------------------------------------------------

function manejarElegirCarta(estado, { cartaId }) {
  if (estado.fase === FASES.CIERRE) {
    throw new MotorError('PARTIDA_CERRADA', 'La partida ya terminó');
  }
  if (estado.modoRobo) {
    throw new MotorError('EN_ROBO', 'No se puede elegir carta durante un robo');
  }
  if (estado.cartaActualId) {
    throw new MotorError('CARTA_YA_ELEGIDA', 'El equipo en turno ya tiene una carta elegida');
  }

  const carta = estado.mazo[cartaId];
  if (!carta) throw new MotorError('CARTA_INEXISTENTE', 'Esa carta no existe');
  if (carta.jugada) throw new MotorError('CARTA_JUGADA', 'Esa carta ya fue jugada');

  return {
    ...estado,
    cartaActualId: cartaId,
    letrasUsadas: {},
    modoAdivinarActivo: false,
  };
}

// ---------------------------------------------------------------------
// PEDIR_LETRA_LIBRE (opción gratuita — puede avanzar a la pantera)
// ---------------------------------------------------------------------

function manejarPedirLetraLibre(estado, { letra }) {
  if (estado.modoRobo) {
    throw new MotorError('EN_ROBO', 'Durante el robo no se piden letras, solo se declara la frase');
  }
  if (!estado.cartaActualId) {
    throw new MotorError('SIN_CARTA', 'El equipo debe elegir una carta antes de pedir letras');
  }
  exigirSinDerrotaPendiente(estado);

  const letraNorm = normalizarLetra(letra);
  if (!esLetra(letraNorm)) {
    throw new MotorError('LETRA_INVALIDA', 'Letra inválida');
  }
  if (estado.letrasUsadas[letraNorm]) {
    throw new MotorError('LETRA_REPETIDA', 'Esa letra ya fue pedida en esta frase');
  }

  const equipoId = equipoEnTurno(estado);
  const equipo = estado.equipos[equipoId];
  const categoria = categoriaDeLetra(letraNorm);
  const clave = claveIntento(categoria);

  if (equipo.intentos[clave] <= 0) {
    throw new MotorError('SIN_INTENTOS', `El equipo no tiene intentos de ${categoria} disponibles`);
  }

  const carta = estado.mazo[estado.cartaActualId];
  const acierto = posicionesDeLetra(carta.texto, letraNorm).length > 0;

  let siguiente = actualizarEquipo(estado, equipoId, {
    intentos: { ...equipo.intentos, [clave]: equipo.intentos[clave] - 1 },
  });

  siguiente = {
    ...siguiente,
    letrasUsadas: { ...siguiente.letrasUsadas, [letraNorm]: acierto ? 'acierto' : 'fallo' },
  };

  if (acierto) {
    // ¿La frase quedó completa con esta letra? El equipo gana de
    // inmediato, sin necesidad de pasar por Modo Adivinar.
    if (fraseCompletamenteRevelada(carta.texto, siguiente.letrasUsadas)) {
      return resolverAciertoDeTurno(siguiente, equipoId);
    }
    return siguiente;
  }

  // Fallo en opción gratuita: avanza la pantera (arquitectura.md 3.4 /
  // requerimientos.md 3.4). Si llega al estado de derrota, el equipo
  // pierde de inmediato, sin pasar por Modo Adivinar.
  const panteraActualizada = Math.min(equipo.panteraEstado + 1, PANTERA_ESTADO_DERROTA);
  siguiente = actualizarEquipo(siguiente, equipoId, { panteraEstado: panteraActualizada });

  if (panteraActualizada >= PANTERA_ESTADO_DERROTA) {
    // Ronda 1: se abre el Robo, que el Tablero muestra al terminar el
    // zarpazo. Ronda 2 no tiene Robo (3.7): la carta queda abierta
    // (hayDerrotaPendiente) hasta que el Tablero termina el zarpazo y la
    // cierra con CONFIRMAR_DERROTA. Si se resolviera aquí mismo, el turno
    // avanzaría en este commit y el Tablero ya no podría mostrar la
    // secuencia de la pantera del equipo que perdió.
    if (estado.ronda === 2) return { ...siguiente, modoAdivinarActivo: false };
    return resolverFalloDeTurno(siguiente, equipoId);
  }

  return siguiente;
}

// ---------------------------------------------------------------------
// COMPRAR_ACIERTO_SEGURO (solo Ronda 1 — siempre acierta, no mueve a la pantera)
// ---------------------------------------------------------------------

function manejarComprarAciertoSeguro(estado, { categoria }) {
  if (estado.ronda !== 1) {
    throw new MotorError('SOLO_RONDA1', 'El Acierto Seguro no está disponible en Ronda 2');
  }
  if (estado.modoRobo) {
    throw new MotorError('EN_ROBO', 'Durante el robo no hay Acierto Seguro');
  }
  if (!estado.cartaActualId) {
    throw new MotorError('SIN_CARTA', 'El equipo debe elegir una carta antes de comprar letras');
  }

  const equipoId = equipoEnTurno(estado);
  const equipo = estado.equipos[equipoId];
  const clave = claveIntento(categoria);
  const carta = estado.mazo[estado.cartaActualId];

  const impedimento = impedimentoAciertoSeguro(equipo, categoria, carta.texto, estado.letrasUsadas);
  if (impedimento) throw impedimento;

  const disponibles = letrasUnicasPorCategoria(carta.texto, categoria).filter(
    (letra) => !estado.letrasUsadas[letra],
  );

  // Determinístico (primera letra sin descubrir, en orden de aparición)
  // en vez de aleatorio: mantiene el motor predecible y fácil de testear,
  // y la regla de negocio no exige que la elección sea al azar.
  const letraElegida = disponibles[0];

  let siguiente = actualizarEquipo(estado, equipoId, {
    saldo: equipo.saldo - COSTO_ACIERTO_SEGURO[categoria],
    intentos: { ...equipo.intentos, [clave]: equipo.intentos[clave] - 1 },
  });

  siguiente = {
    ...siguiente,
    letrasUsadas: { ...siguiente.letrasUsadas, [letraElegida]: 'acierto' },
  };

  if (fraseCompletamenteRevelada(carta.texto, siguiente.letrasUsadas)) {
    return resolverAciertoDeTurno(siguiente, equipoId);
  }

  return siguiente;
}

// ---------------------------------------------------------------------
// ACTIVAR / CANCELAR MODO_ADIVINAR
// ---------------------------------------------------------------------

function manejarActivarModoAdivinar(estado) {
  if (!estado.cartaActualId && !estado.modoRobo) {
    throw new MotorError('SIN_CARTA', 'No hay una carta activa para adivinar');
  }
  exigirSinDerrotaPendiente(estado);
  return { ...estado, modoAdivinarActivo: true };
}

function manejarCancelarModoAdivinar(estado) {
  if (estado.modoRobo) {
    throw new MotorError('EN_ROBO', 'El robo siempre se resuelve con una respuesta, no se puede cancelar');
  }
  return { ...estado, modoAdivinarActivo: false };
}

// ---------------------------------------------------------------------
// ENVIAR_RESPUESTA
// ---------------------------------------------------------------------

function manejarEnviarRespuesta(estado, { intento }) {
  if (estado.modoRobo) {
    return resolverIntentoRobo(estado, intento);
  }

  if (!estado.cartaActualId) {
    throw new MotorError('SIN_CARTA', 'El equipo debe elegir una carta antes de adivinar');
  }
  exigirSinDerrotaPendiente(estado);

  const equipoId = equipoEnTurno(estado);
  const carta = estado.mazo[estado.cartaActualId];

  if (respuestaCorrecta(intento, carta)) {
    return resolverAciertoDeTurno(estado, equipoId);
  }

  // Ronda 2: sin mecánica de robo — fallo es derrota directa (3.7).
  if (estado.ronda === 2) {
    return resolverFalloDirectoSinRobo(estado, equipoId);
  }

  // Ronda 1: fallo en Modo Adivinar activa el Robo de Frase (3.6).
  return resolverFalloDeTurno(estado, equipoId);
}

// ---------------------------------------------------------------------
// CONFIRMAR_DERROTA (Ronda 2: cierra la carta tras el zarpazo)
// ---------------------------------------------------------------------

function manejarConfirmarDerrota(estado) {
  if (!hayDerrotaPendiente(estado)) {
    throw new MotorError('SIN_DERROTA_PENDIENTE', 'No hay una derrota pendiente de confirmar');
  }
  return resolverFalloDirectoSinRobo(estado, equipoEnTurno(estado));
}

function resolverAciertoDeTurno(estado, equipoId) {
  const equipo = estado.equipos[equipoId];
  const carta = estado.mazo[estado.cartaActualId];

  let siguiente = actualizarEquipo(estado, equipoId, {
    saldo: equipo.saldo + carta.valor,
    gano: true,
  });
  siguiente = actualizarCarta(siguiente, carta.id, { jugada: true, ganadorId: equipoId });

  return avanzarTurno(siguiente);
}

// Ronda 1 — el equipo pierde su carta: activa el Robo para el equipo
// siguiente en el orden del sorteo. La carta queda "en juego" hasta que
// el robo se resuelve (no se marca jugada todavía).
function resolverFalloDeTurno(estado, equipoId) {
  const carta = estado.mazo[estado.cartaActualId];
  const equipoQueRobaId = obtenerEquipoRobo(estado, equipoId);

  const siguiente = actualizarEquipo(estado, equipoId, { gano: false });

  return {
    ...siguiente,
    modoRobo: { equipoId: equipoQueRobaId, cartaId: carta.id },
    modoAdivinarActivo: false,
  };
}

// Ronda 2 — sin robo: la carta se resuelve de inmediato sin ganador.
function resolverFalloDirectoSinRobo(estado, equipoId) {
  const carta = estado.mazo[estado.cartaActualId];
  let siguiente = actualizarEquipo(estado, equipoId, { gano: false });
  siguiente = actualizarCarta(siguiente, carta.id, { jugada: true, ganadorId: null });
  return avanzarTurno(siguiente);
}

// Resuelve el intento único del equipo que roba (3.6): sin letras, sin
// monedas, una sola oportunidad. Acierta → se lleva el premio. Falla →
// nadie suma monedas. En ambos casos la carta queda resuelta y el turno
// avanza al equipo que acaba de robar (ver nota de diseño más abajo).
function resolverIntentoRobo(estado, intento) {
  const { equipoId, cartaId } = estado.modoRobo;
  const carta = estado.mazo[cartaId];

  let siguiente = estado;

  if (respuestaCorrecta(intento, carta)) {
    const equipo = estado.equipos[equipoId];
    siguiente = actualizarEquipo(siguiente, equipoId, { saldo: equipo.saldo + carta.valor });
    siguiente = actualizarCarta(siguiente, cartaId, { jugada: true, ganadorId: equipoId });
  } else {
    siguiente = actualizarCarta(siguiente, cartaId, { jugada: true, ganadorId: null });
  }

  siguiente = { ...siguiente, modoRobo: null };

  return avanzarTurno(siguiente);
}

// ---------------------------------------------------------------------
// Avance de turno y transición de fases
// ---------------------------------------------------------------------

// NOTA DE DISEÑO (no especificada literalmente en requerimientos.md):
// el robo es una interjección de UNA sola jugada del "equipo siguiente
// en el orden del sorteo" — no reemplaza ni adelanta el turno normal de
// ese equipo. Por eso, al resolver el robo, simplemente avanzamos el
// puntero de turno en 1 (como con cualquier carta resuelta); el equipo
// que acaba de robar continúa después con su propio turno normal
// (su propia carta), salvo que la fase ya se haya completado (ver
// `turnosCompletados` más abajo, que maneja el caso límite del último
// equipo del sorteo robando a un equipo que ya jugó su turno).
function avanzarTurno(estado) {
  const totalEquiposFase = estado.ordenTurnoActual.length;
  const turnosCompletados = estado.turnosCompletados + 1;

  const siguiente = {
    ...estado,
    cartaActualId: null,
    letrasUsadas: {},
    modoAdivinarActivo: false,
    turnosCompletados,
  };

  if (turnosCompletados >= totalEquiposFase) {
    return transicionarFase(siguiente);
  }

  return {
    ...siguiente,
    turnoActualIndex: (siguiente.turnoActualIndex + 1) % totalEquiposFase,
  };
}

function transicionarFase(estado) {
  if (estado.fase === FASES.RONDA1) {
    const perdedores = estado.ordenTurnoRonda1.filter((id) => estado.equipos[id].gano === false);

    if (perdedores.length === 0) {
      return entrarACierre(estado);
    }

    const equiposActualizados = { ...estado.equipos };
    for (const id of perdedores) {
      equiposActualizados[id] = {
        ...equiposActualizados[id],
        intentos: { ...LIMITES_INTENTOS[2] },
        panteraEstado: 0,
        gano: null,
      };
    }

    return {
      ...estado,
      fase: FASES.REPECHAJE,
      ronda: 2,
      equipos: equiposActualizados,
      ordenTurnoActual: perdedores,
      turnoActualIndex: 0,
      turnosCompletados: 0,
    };
  }

  if (estado.fase === FASES.REPECHAJE) {
    return entrarACierre(estado);
  }

  return estado;
}

// Cierre (3.8): revela automáticamente todas las tarjetas no jugadas y
// arma el marcador final ordenado por saldo.
function entrarACierre(estado) {
  const mazoActualizado = { ...estado.mazo };
  const cartasReveladas = [];

  for (const cartaId of Object.keys(mazoActualizado)) {
    const carta = mazoActualizado[cartaId];
    if (!carta.jugada) {
      const revelada = { ...carta, jugada: true, ganadorId: null };
      mazoActualizado[cartaId] = revelada;
      cartasReveladas.push(revelada);
    }
  }

  const marcador = Object.values(estado.equipos)
    .map((e) => ({ id: e.id, nombre: e.nombre, saldo: e.saldo }))
    .sort((a, b) => b.saldo - a.saldo);

  return {
    ...estado,
    fase: FASES.CIERRE,
    mazo: mazoActualizado,
    cartaActualId: null,
    modoRobo: null,
    cierre: { cartasReveladas, marcador },
  };
}
