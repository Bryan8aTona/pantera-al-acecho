import { describe, it, expect } from 'vitest';
import { motorReducer } from '../reducer.js';
import { MotorError } from '../errores.js';

// Casos de flujo que atraviesan varias cartas/fases. El estado se arma a
// mano (como en reducer.test.js) para controlar el orden de equipos y el
// contenido de las cartas.
const IDS = ['rojo', 'azul', 'amarillo', 'verde'];

function estadoBase(overrides = {}) {
  const equipos = {};
  for (const id of IDS) {
    equipos[id] = {
      id,
      nombre: id,
      saldo: 200,
      intentos: { vocales: 3, consonantes: 8 },
      panteraEstado: 0,
      gano: null,
    };
  }
  const textos = ['SOL', 'MAR', 'PAN', 'LUZ', 'RIO', 'TREN', 'FLOR', 'NUBE'];
  const mazo = {};
  textos.forEach((texto, i) => {
    const id = `c${i + 1}`;
    mazo[id] = { id, texto, orden: i + 1, valor: 100, jugada: false, ganadorId: null };
  });

  return {
    fase: 'RONDA1',
    ronda: 1,
    equipos,
    ordenTurnoRonda1: [...IDS],
    ordenTurnoActual: [...IDS],
    turnoActualIndex: 0,
    turnosCompletados: 0,
    mazo,
    cartaActualId: null,
    letrasUsadas: {},
    modoAdivinarActivo: false,
    modoRobo: null,
    cierre: null,
    ...overrides,
  };
}

function aplicar(estado, ...acciones) {
  return acciones.reduce(motorReducer, estado);
}

const elegir = (cartaId) => ({ type: 'ELEGIR_CARTA', cartaId });
const letra = (l) => ({ type: 'PEDIR_LETRA_LIBRE', letra: l });
const responder = (intento) => ({ type: 'ENVIAR_RESPUESTA', intento });

// Repechaje con `ids` jugando (en ese orden), límites de Ronda 2 y la
// pantera reiniciada, tal como lo deja transicionarFase.
function estadoRepechaje(ids) {
  const base = estadoBase();
  const equipos = { ...base.equipos };
  for (const id of IDS) {
    equipos[id] = ids.includes(id)
      ? { ...equipos[id], intentos: { vocales: 2, consonantes: 5 }, gano: null }
      : { ...equipos[id], gano: true };
  }
  const mazo = { ...base.mazo };
  for (const id of ['c1', 'c2', 'c3', 'c4']) mazo[id] = { ...mazo[id], jugada: true };
  return { ...base, fase: 'REPECHAJE', ronda: 2, equipos, mazo, ordenTurnoActual: ids };
}

describe('Ronda 2: derrota por pantera (sin Robo)', () => {
  // RIO no contiene ninguna de estas consonantes.
  const cincoFallos = ['B', 'C', 'D', 'F', 'G'].map(letra);

  it('la 5ª letra fallada NO abre un Robo: la carta queda abierta hasta confirmar la derrota', () => {
    const estado = aplicar(estadoRepechaje(['amarillo', 'rojo']), elegir('c5'), ...cincoFallos);

    expect(estado.modoRobo).toBeNull();
    expect(estado.equipos.amarillo.panteraEstado).toBe(5);
    expect(estado.cartaActualId).toBe('c5');
    expect(estado.mazo.c5.jugada).toBe(false);
    expect(estado.turnosCompletados).toBe(0);
  });

  it('con la derrota pendiente no se puede seguir jugando esa carta', () => {
    const estado = aplicar(estadoRepechaje(['amarillo', 'rojo']), elegir('c5'), ...cincoFallos);

    expect(() => motorReducer(estado, letra('R'))).toThrow(MotorError);
    expect(() => motorReducer(estado, { type: 'ACTIVAR_MODO_ADIVINAR' })).toThrow(MotorError);
    expect(() => motorReducer(estado, responder('rio'))).toThrow(MotorError);
  });

  it('CONFIRMAR_DERROTA cierra la carta sin ganador y pasa al siguiente equipo del repechaje', () => {
    const estado = aplicar(
      estadoRepechaje(['amarillo', 'rojo']),
      elegir('c5'),
      ...cincoFallos,
      { type: 'CONFIRMAR_DERROTA' },
    );

    expect(estado.mazo.c5).toMatchObject({ jugada: true, ganadorId: null });
    expect(estado.equipos.amarillo.gano).toBe(false);
    expect(estado.equipos.amarillo.saldo).toBe(200);
    expect(estado.cartaActualId).toBeNull();
    expect(estado.ordenTurnoActual[estado.turnoActualIndex]).toBe('rojo');
    expect(estado.fase).toBe('REPECHAJE');
  });

  it('si era el último equipo del repechaje, la partida pasa a Cierre', () => {
    const estado = aplicar(estadoRepechaje(['azul']), elegir('c5'), ...cincoFallos, {
      type: 'CONFIRMAR_DERROTA',
    });

    expect(estado.fase).toBe('CIERRE');
    expect(estado.cierre.cartasReveladas.map((c) => c.id)).toEqual(['c6', 'c7', 'c8']);
  });

  it('CONFIRMAR_DERROTA sin una derrota pendiente es inválido', () => {
    expect(() => motorReducer(estadoBase(), { type: 'CONFIRMAR_DERROTA' })).toThrow(MotorError);
    const enJuego = aplicar(estadoRepechaje(['azul']), elegir('c5'), letra('B'));
    expect(() => motorReducer(enJuego, { type: 'CONFIRMAR_DERROTA' })).toThrow(MotorError);
  });
});

describe('Repechaje -> Cierre', () => {
  it('al resolverse las cartas de todos los equipos del repechaje, llega el Cierre', () => {
    let estado = aplicar(estadoRepechaje(['amarillo', 'rojo']), elegir('c5'), responder('rio'));
    expect(estado.fase).toBe('REPECHAJE');
    expect(estado.ordenTurnoActual[estado.turnoActualIndex]).toBe('rojo');

    estado = aplicar(estado, elegir('c6'), responder('incorrecto'));
    expect(estado.fase).toBe('CIERRE');
    expect(estado.equipos.amarillo.saldo).toBe(300);
    expect(estado.cierre.marcador[0].id).toBe('amarillo');
  });
});

describe('Robo: el equipo que roba conserva su propio turno', () => {
  it('tras robar, el equipo que robó juega después su propia carta', () => {
    // rojo falla -> azul roba (y acierta) -> el turno pasa a azul, con su carta propia.
    let estado = aplicar(estadoBase(), elegir('c1'), responder('incorrecto'));
    expect(estado.modoRobo).toEqual({ equipoId: 'azul', cartaId: 'c1' });

    estado = motorReducer(estado, responder('sol'));
    expect(estado.equipos.azul.saldo).toBe(300);
    expect(estado.modoRobo).toBeNull();
    expect(estado.ordenTurnoActual[estado.turnoActualIndex]).toBe('azul');
    expect(estado.cartaActualId).toBeNull();

    estado = aplicar(estado, elegir('c2'), responder('mar'));
    expect(estado.equipos.azul.saldo).toBe(400);
  });

  it('si roba el primer equipo (que ya jugó) tras fallar el último, la ronda termina igual', () => {
    let estado = aplicar(
      estadoBase(),
      elegir('c1'), responder('sol'), // rojo gana
      elegir('c2'), responder('mar'), // azul gana
      elegir('c3'), responder('pan'), // amarillo gana
      elegir('c4'), responder('incorrecto'), // verde falla -> roba rojo
    );
    expect(estado.modoRobo).toEqual({ equipoId: 'rojo', cartaId: 'c4' });

    estado = motorReducer(estado, responder('incorrecto'));
    expect(estado.fase).toBe('REPECHAJE');
    expect(estado.ordenTurnoActual).toEqual(['verde']);
    expect(estado.mazo.c4).toMatchObject({ jugada: true, ganadorId: null });
  });
});

describe('Frases con tildes', () => {
  it('pedir la vocal sin tilde acierta la vocal acentuada y puede completar la frase', () => {
    const base = estadoBase();
    const mazo = { ...base.mazo, c1: { ...base.mazo.c1, texto: 'Sí' } };
    const estado = aplicar({ ...base, mazo }, elegir('c1'), letra('S'), letra('I'));

    expect(estado.mazo.c1).toMatchObject({ jugada: true, ganadorId: 'rojo' });
  });
});
