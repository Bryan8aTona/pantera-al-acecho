import { describe, it, expect } from 'vitest';
import { motorReducer } from '../reducer.js';
import { MotorError } from '../errores.js';

// Estado base reutilizable para las pruebas. Se construye a mano (sin
// pasar por crearEstadoInicial/aleatorio) para tener control total y
// determinismo sobre el orden de equipos y el contenido de las cartas.
// Los textos de las cartas son cadenas sintéticas elegidas para poder
// calcular resultados a mano fácilmente, no frases reales del juego.
function estadoBase(overrides = {}) {
  const equiposBase = ['rojo', 'azul', 'amarillo', 'verde'].reduce((acc, id) => {
    acc[id] = {
      id,
      nombre: id[0].toUpperCase() + id.slice(1),
      saldo: 200,
      intentos: { vocales: 3, consonantes: 8 },
      panteraEstado: 0,
      gano: null,
    };
    return acc;
  }, {});

  const mazoBase = {
    c1: { id: 'c1', texto: 'SOL', orden: 1, valor: 100, jugada: false, ganadorId: null },
    c2: { id: 'c2', texto: 'MAR', orden: 2, valor: 90, jugada: false, ganadorId: null },
    c3: { id: 'c3', texto: 'PAN', orden: 3, valor: 80, jugada: false, ganadorId: null },
    c4: { id: 'c4', texto: 'LUZ', orden: 4, valor: 70, jugada: false, ganadorId: null },
    c5: { id: 'c5', texto: 'RIO', orden: 5, valor: 60, jugada: false, ganadorId: null },
    c6: { id: 'c6', texto: 'TREN', orden: 6, valor: 100, jugada: false, ganadorId: null },
    c7: { id: 'c7', texto: 'FLOR', orden: 7, valor: 90, jugada: false, ganadorId: null },
    c8: { id: 'c8', texto: 'NUBE', orden: 8, valor: 80, jugada: false, ganadorId: null },
  };

  return {
    fase: 'RONDA1',
    ronda: 1,
    equipos: equiposBase,
    ordenTurnoRonda1: ['rojo', 'azul', 'amarillo', 'verde'],
    ordenTurnoActual: ['rojo', 'azul', 'amarillo', 'verde'],
    turnoActualIndex: 0,
    turnosCompletados: 0,
    mazo: mazoBase,
    cartaActualId: null,
    letrasUsadas: {},
    modoAdivinarActivo: false,
    modoRobo: null,
    cierre: null,
    ...overrides,
  };
}

describe('ELEGIR_CARTA', () => {
  it('asigna la carta al equipo en turno', () => {
    const estado = motorReducer(estadoBase(), { type: 'ELEGIR_CARTA', cartaId: 'c1' });
    expect(estado.cartaActualId).toBe('c1');
  });

  it('rechaza elegir una segunda carta sin haber resuelto la actual', () => {
    let estado = estadoBase();
    estado = motorReducer(estado, { type: 'ELEGIR_CARTA', cartaId: 'c1' });
    expect(() => motorReducer(estado, { type: 'ELEGIR_CARTA', cartaId: 'c2' })).toThrow(MotorError);
  });

  it('rechaza una carta ya jugada', () => {
    const estado = estadoBase({
      mazo: {
        ...estadoBase().mazo,
        c1: { ...estadoBase().mazo.c1, jugada: true },
      },
    });
    expect(() => motorReducer(estado, { type: 'ELEGIR_CARTA', cartaId: 'c1' })).toThrow(MotorError);
  });
});

describe('PEDIR_LETRA_LIBRE', () => {
  it('revela la letra correcta sin afectar a la pantera', () => {
    let estado = motorReducer(estadoBase(), { type: 'ELEGIR_CARTA', cartaId: 'c1' }); // SOL
    estado = motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra: 'O' });

    expect(estado.letrasUsadas.O).toBe('acierto');
    expect(estado.equipos.rojo.intentos.vocales).toBe(2); // consumió 1 de 3
    expect(estado.equipos.rojo.panteraEstado).toBe(0);
  });

  it('una letra incorrecta consume el intento y avanza la pantera', () => {
    let estado = motorReducer(estadoBase(), { type: 'ELEGIR_CARTA', cartaId: 'c1' }); // SOL
    estado = motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra: 'Z' }); // no está en SOL... pero sí en LUZ, ok para SOL no aparece

    expect(estado.letrasUsadas.Z).toBe('fallo');
    expect(estado.equipos.rojo.intentos.consonantes).toBe(7);
    expect(estado.equipos.rojo.panteraEstado).toBe(1);
  });

  it('no permite pedir la misma letra dos veces', () => {
    let estado = motorReducer(estadoBase(), { type: 'ELEGIR_CARTA', cartaId: 'c1' });
    estado = motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra: 'O' });
    expect(() => motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra: 'o' })).toThrow(MotorError);
  });

  it('bloquea pedir letras de una categoría sin intentos restantes', () => {
    // Carta sintética con 8 consonantes distintas y sin vocales, para
    // agotar el límite de consonantes de Ronda 1 sin ningún fallo.
    let estado = estadoBase({
      mazo: {
        ...estadoBase().mazo,
        c1: { id: 'c1', texto: 'BCDFGHJK', orden: 1, valor: 100, jugada: false, ganadorId: null },
      },
    });
    estado = motorReducer(estado, { type: 'ELEGIR_CARTA', cartaId: 'c1' });

    for (const letra of ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K']) {
      estado = motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra });
    }

    expect(estado.equipos.rojo.intentos.consonantes).toBe(0);
    expect(estado.equipos.rojo.panteraEstado).toBe(0); // ninguna fue fallo
    expect(() => motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra: 'L' })).toThrow(MotorError);
  });
});

describe('Pantera al Acecho — derrota automática', () => {
  it('tras 5 fallos activa el Robo directamente, sin pasar por Modo Adivinar', () => {
    // Carta solo con vocales: cualquier consonante pedida es un fallo garantizado.
    let estado = estadoBase({
      mazo: {
        ...estadoBase().mazo,
        c1: { id: 'c1', texto: 'AEIOU', orden: 1, valor: 100, jugada: false, ganadorId: null },
      },
    });
    estado = motorReducer(estado, { type: 'ELEGIR_CARTA', cartaId: 'c1' });

    for (const letra of ['B', 'C', 'D', 'F']) {
      estado = motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra });
      expect(estado.modoRobo).toBeNull();
    }
    expect(estado.equipos.rojo.panteraEstado).toBe(4);

    // Quinto fallo: derrota automática.
    estado = motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra: 'G' });

    expect(estado.equipos.rojo.panteraEstado).toBe(5);
    expect(estado.equipos.rojo.gano).toBe(false);
    expect(estado.modoRobo).toEqual({ equipoId: 'azul', cartaId: 'c1' });
  });
});

describe('COMPRAR_ACIERTO_SEGURO', () => {
  function estadoConCasa() {
    let estado = estadoBase({
      mazo: {
        ...estadoBase().mazo,
        c1: { id: 'c1', texto: 'CASA', orden: 1, valor: 100, jugada: false, ganadorId: null },
      },
    });
    return motorReducer(estado, { type: 'ELEGIR_CARTA', cartaId: 'c1' });
  }

  it('descuenta saldo e intento, y revela una letra sin afectar la pantera', () => {
    const estado = motorReducer(estadoConCasa(), { type: 'COMPRAR_ACIERTO_SEGURO', categoria: 'vocal' });

    expect(estado.equipos.rojo.saldo).toBe(165); // 200 - 35
    expect(estado.equipos.rojo.intentos.vocales).toBe(2);
    expect(estado.equipos.rojo.panteraEstado).toBe(0);
    expect(estado.letrasUsadas.A).toBe('acierto');
  });

  it('se rechaza si no quedan letras de esa categoría por descubrir', () => {
    let estado = motorReducer(estadoConCasa(), { type: 'COMPRAR_ACIERTO_SEGURO', categoria: 'vocal' });
    // CASA solo tiene una vocal distinta (A), ya revelada.
    expect(() => motorReducer(estado, { type: 'COMPRAR_ACIERTO_SEGURO', categoria: 'vocal' })).toThrow(
      MotorError,
    );
  });

  it('se rechaza si el saldo es insuficiente', () => {
    let estado = estadoConCasa();
    estado = { ...estado, equipos: { ...estado.equipos, rojo: { ...estado.equipos.rojo, saldo: 10 } } };
    expect(() =>
      motorReducer(estado, { type: 'COMPRAR_ACIERTO_SEGURO', categoria: 'consonante' }),
    ).toThrow(MotorError);
  });

  it('no está disponible en Ronda 2', () => {
    const estado = estadoBase({ ronda: 2, cartaActualId: 'c1' });
    expect(() =>
      motorReducer(estado, { type: 'COMPRAR_ACIERTO_SEGURO', categoria: 'vocal' }),
    ).toThrow(MotorError);
  });
});

describe('ENVIAR_RESPUESTA — turno normal', () => {
  it('acierto: suma el premio, marca la carta y avanza el turno', () => {
    let estado = motorReducer(estadoBase(), { type: 'ELEGIR_CARTA', cartaId: 'c1' }); // SOL, valor 100
    estado = motorReducer(estado, { type: 'ENVIAR_RESPUESTA', intento: 'sol' });

    expect(estado.equipos.rojo.saldo).toBe(300);
    expect(estado.equipos.rojo.gano).toBe(true);
    expect(estado.mazo.c1.jugada).toBe(true);
    expect(estado.mazo.c1.ganadorId).toBe('rojo');
    expect(estado.turnoActualIndex).toBe(1); // pasa a azul
    expect(estado.cartaActualId).toBeNull();
  });

  it('fallo en Ronda 1: activa el Robo para el siguiente equipo del sorteo', () => {
    let estado = motorReducer(estadoBase(), { type: 'ELEGIR_CARTA', cartaId: 'c1' });
    estado = motorReducer(estado, { type: 'ENVIAR_RESPUESTA', intento: 'luna' });

    expect(estado.equipos.rojo.gano).toBe(false);
    expect(estado.modoRobo).toEqual({ equipoId: 'azul', cartaId: 'c1' });
    expect(estado.mazo.c1.jugada).toBe(false); // aún no se resuelve
  });
});

describe('Robo de frase', () => {
  function estadoEnRobo() {
    let estado = motorReducer(estadoBase(), { type: 'ELEGIR_CARTA', cartaId: 'c1' }); // SOL, rojo
    return motorReducer(estado, { type: 'ENVIAR_RESPUESTA', intento: 'fallo' }); // activa robo -> azul
  }

  it('robo exitoso: el equipo que roba se lleva el premio', () => {
    let estado = motorReducer(estadoEnRobo(), { type: 'ENVIAR_RESPUESTA', intento: 'sol' });

    expect(estado.equipos.azul.saldo).toBe(300); // 200 + 100
    expect(estado.equipos.rojo.saldo).toBe(200); // el equipo original no recibe nada
    expect(estado.mazo.c1.ganadorId).toBe('azul');
    expect(estado.modoRobo).toBeNull();
    expect(estado.turnoActualIndex).toBe(1); // avanza a azul, que ahora juega su propio turno
  });

  it('robo fallido: nadie recibe el premio', () => {
    let estado = motorReducer(estadoEnRobo(), { type: 'ENVIAR_RESPUESTA', intento: 'incorrecto' });

    expect(estado.equipos.azul.saldo).toBe(200);
    expect(estado.mazo.c1.ganadorId).toBeNull();
    expect(estado.mazo.c1.jugada).toBe(true);
    expect(estado.modoRobo).toBeNull();
  });

  it('durante el robo no se pueden pedir letras ni comprar Acierto Seguro', () => {
    const estado = estadoEnRobo();
    expect(() => motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra: 'A' })).toThrow(MotorError);
    expect(() =>
      motorReducer(estado, { type: 'COMPRAR_ACIERTO_SEGURO', categoria: 'vocal' }),
    ).toThrow(MotorError);
  });

  it('caso límite: si el último equipo del sorteo pierde, el robo cae en el primero (circular)', () => {
    // verde es el último (índice 3); el robo debe caer en rojo (índice 0),
    // aunque rojo ya haya jugado su propio turno antes en la ronda.
    let estado = estadoBase({
      turnoActualIndex: 3,
      turnosCompletados: 3,
      equipos: {
        ...estadoBase().equipos,
        rojo: { ...estadoBase().equipos.rojo, gano: true }, // rojo ya jugó y ganó su turno
      },
    });
    estado = motorReducer(estado, { type: 'ELEGIR_CARTA', cartaId: 'c4' }); // verde juega c4 (LUZ)
    estado = motorReducer(estado, { type: 'ENVIAR_RESPUESTA', intento: 'fallo' });

    expect(estado.modoRobo).toEqual({ equipoId: 'rojo', cartaId: 'c4' });

    // Al resolver el robo, como ya se completaron los 4 turnos de la
    // ronda, se transiciona de fase (turnosCompletados se reinicia a 0
    // para la nueva fase, que es el comportamiento correcto).
    estado = motorReducer(estado, { type: 'ENVIAR_RESPUESTA', intento: 'luz' });
    expect(estado.mazo.c4.jugada).toBe(true);
    expect(estado.mazo.c4.ganadorId).toBe('rojo'); // rojo robó exitosamente
    expect(['REPECHAJE', 'CIERRE']).toContain(estado.fase);
  });
});

describe('Transición Ronda 1 -> Repechaje / Cierre', () => {
  function jugarTurnoGanador(estado, cartaId, respuestaCorrecta) {
    let siguiente = motorReducer(estado, { type: 'ELEGIR_CARTA', cartaId });
    return motorReducer(siguiente, { type: 'ENVIAR_RESPUESTA', intento: respuestaCorrecta });
  }

  it('si los 4 equipos ganan su carta, salta directo a Cierre (sin Repechaje)', () => {
    let estado = estadoBase();
    estado = jugarTurnoGanador(estado, 'c1', 'sol'); // rojo
    estado = jugarTurnoGanador(estado, 'c2', 'mar'); // azul
    estado = jugarTurnoGanador(estado, 'c3', 'pan'); // amarillo
    estado = jugarTurnoGanador(estado, 'c4', 'luz'); // verde

    expect(estado.fase).toBe('CIERRE');
    expect(estado.ronda).toBe(1); // nunca hubo repechaje
    // Las 4 cartas restantes se revelan automáticamente.
    expect(estado.cierre.cartasReveladas).toHaveLength(4);
    expect(estado.cierre.marcador).toHaveLength(4);
  });

  it('si algún equipo pierde, pasa a Repechaje solo con los equipos perdedores', () => {
    let estado = estadoBase();
    estado = jugarTurnoGanador(estado, 'c1', 'sol'); // rojo gana

    // azul pierde su turno (fallo -> robo -> robo también falla)
    estado = motorReducer(estado, { type: 'ELEGIR_CARTA', cartaId: 'c2' });
    estado = motorReducer(estado, { type: 'ENVIAR_RESPUESTA', intento: 'nada' }); // activa robo (amarillo roba)
    estado = motorReducer(estado, { type: 'ENVIAR_RESPUESTA', intento: 'nada-tampoco' }); // robo falla

    estado = jugarTurnoGanador(estado, 'c3', 'pan'); // amarillo gana su propio turno
    estado = jugarTurnoGanador(estado, 'c4', 'luz'); // verde gana

    expect(estado.fase).toBe('REPECHAJE');
    expect(estado.ronda).toBe(2);
    expect(estado.ordenTurnoActual).toEqual(['azul']);
    expect(estado.equipos.azul.intentos).toEqual({ vocales: 2, consonantes: 5 });
    expect(estado.equipos.azul.panteraEstado).toBe(0);
    expect(estado.equipos.azul.gano).toBeNull();
  });
});

describe('Ronda 2 (Repechaje)', () => {
  function estadoRepechaje() {
    return estadoBase({
      fase: 'REPECHAJE',
      ronda: 2,
      ordenTurnoActual: ['azul'],
      turnoActualIndex: 0,
      turnosCompletados: 0,
      equipos: {
        ...estadoBase().equipos,
        azul: {
          ...estadoBase().equipos.azul,
          intentos: { vocales: 2, consonantes: 5 },
          gano: null,
        },
      },
    });
  }

  it('no permite Acierto Seguro', () => {
    let estado = motorReducer(estadoRepechaje(), { type: 'ELEGIR_CARTA', cartaId: 'c5' });
    expect(() =>
      motorReducer(estado, { type: 'COMPRAR_ACIERTO_SEGURO', categoria: 'vocal' }),
    ).toThrow(MotorError);
  });

  it('un fallo es derrota directa, sin activar Robo', () => {
    let estado = motorReducer(estadoRepechaje(), { type: 'ELEGIR_CARTA', cartaId: 'c5' }); // RIO
    estado = motorReducer(estado, { type: 'ENVIAR_RESPUESTA', intento: 'incorrecto' });

    expect(estado.modoRobo).toBeNull();
    expect(estado.mazo.c5.jugada).toBe(true);
    expect(estado.mazo.c5.ganadorId).toBeNull();
    expect(estado.fase).toBe('CIERRE'); // único equipo en repechaje -> termina la ronda
  });

  it('un acierto suma el premio igual que en Ronda 1', () => {
    let estado = motorReducer(estadoRepechaje(), { type: 'ELEGIR_CARTA', cartaId: 'c5' }); // RIO, valor 60
    estado = motorReducer(estado, { type: 'ENVIAR_RESPUESTA', intento: 'rio' });

    expect(estado.equipos.azul.saldo).toBe(260);
  });
});

describe('Cierre', () => {
  it('revela todas las cartas no jugadas y ordena el marcador por saldo', () => {
    let estado = estadoBase({
      equipos: {
        rojo: { ...estadoBase().equipos.rojo, saldo: 150 },
        azul: { ...estadoBase().equipos.azul, saldo: 400 },
        amarillo: { ...estadoBase().equipos.amarillo, saldo: 200 },
        verde: { ...estadoBase().equipos.verde, saldo: 90 },
      },
    });

    // Simula que ya se jugaron 4 cartas y toca cerrar: forzamos el
    // último turno para disparar la transición a Cierre.
    estado = { ...estado, turnoActualIndex: 3, turnosCompletados: 3 };
    estado = motorReducer(estado, { type: 'ELEGIR_CARTA', cartaId: 'c4' });
    estado = motorReducer(estado, { type: 'ENVIAR_RESPUESTA', intento: 'luz' });

    expect(estado.fase).toBe('CIERRE');
    // verde juega y gana c4 (LUZ, valor 70) en esta misma prueba, así
    // que su saldo pasa de 90 a 160 — por eso queda antes que rojo (150).
    expect(estado.cierre.marcador.map((e) => e.id)).toEqual(['azul', 'amarillo', 'verde', 'rojo']);
    expect(estado.cierre.cartasReveladas.every((c) => c.jugada)).toBe(true);
  });
});
