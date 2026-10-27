import { EQUIPOS_BASE, SALDO_INICIAL, LIMITES_INTENTOS, FRASES_POR_SET, FASES } from './constantes.ts';
import { crearMazo } from './mazo.ts';
import { sortearOrden } from './sorteo.ts';
import type { Equipo, EquipoId, EstadoPartida, Frase } from './tipos.ts';

// set: el objeto { id, nombre, frases: [...8] } descargado completo por
// la pantalla de Configuración de partida (ver ConfiguracionPartidaPage).
// Del set, el motor solo usa las frases.
export function crearEstadoInicial({
  set,
  aleatorio = Math.random,
}: {
  set: { frases: Frase[] };
  aleatorio?: () => number;
}): EstadoPartida {
  if (!set?.frases || set.frases.length !== FRASES_POR_SET) {
    throw new Error(`Se requiere un set con exactamente ${FRASES_POR_SET} frases para iniciar la partida`);
  }

  const ordenTurno = sortearOrden(
    EQUIPOS_BASE.map((e) => e.id),
    aleatorio,
  );
  const mazo = crearMazo(set.frases, aleatorio);

  // Empieza vacío y el ciclo lo llena con los 4 equipos de EQUIPOS_BASE.
  const equipos = {} as Record<EquipoId, Equipo>;
  for (const equipo of EQUIPOS_BASE) {
    equipos[equipo.id] = {
      id: equipo.id,
      nombre: equipo.nombre,
      saldo: SALDO_INICIAL,
      intentos: { ...LIMITES_INTENTOS[1] },
      panteraEstado: 0,
      gano: null, // null = aún jugando, true = ganó su carta, false = la perdió
    };
  }

  return {
    fase: FASES.RONDA1, // ver FASES en constantes.ts
    ronda: 1,
    equipos,
    ordenTurnoRonda1: ordenTurno, // fijo: se usa para calcular quién roba
    ordenTurnoActual: ordenTurno, // subconjunto activo en la fase actual
    turnoActualIndex: 0,
    turnosCompletados: 0,
    mazo,
    cartaActualId: null,
    letrasUsadas: {}, // solo de la carta activa; se reinicia por carta
    modoAdivinarActivo: false,
    modoRobo: null, // { equipoId, cartaId } mientras se resuelve un robo
    cierre: null, // { cartasReveladas, marcador } al llegar a fase CIERRE
  };
}
