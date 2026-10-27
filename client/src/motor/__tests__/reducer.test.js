import { describe, it, expect } from 'vitest';
import { motorReducer } from '../reducer.ts';
import { MotorError } from '../errores.ts';

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
    c1: { id: 'c1', texto: 'SOL', orden: 1, bolsaInicial: 100, bolsa: 100, jugada: false, ganadorId: null },
    c2: { id: 'c2', texto: 'MAR', orden: 2, bolsaInicial: 90, bolsa: 90, jugada: false, ganadorId: null },
    c3: { id: 'c3', texto: 'PAN', orden: 3, bolsaInicial: 80, bolsa: 80, jugada: false, ganadorId: null },
    c4: { id: 'c4', texto: 'LUZ', orden: 4, bolsaInicial: 70, bolsa: 70, jugada: false, ganadorId: null },
    c5: { id: 'c5', texto: 'RIO', orden: 5, bolsaInicial: 60, bolsa: 60, jugada: false, ganadorId: null },
    c6: { id: 'c6', texto: 'TREN', orden: 6, bolsaInicial: 100, bolsa: 100, jugada: false, ganadorId: null },
    c7: { id: 'c7', texto: 'FLOR', orden: 7, bolsaInicial: 90, bolsa: 90, jugada: false, ganadorId: null },
    c8: { id: 'c8', texto: 'NUBE', orden: 8, bolsaInicial: 80, bolsa: 80, jugada: false, ganadorId: null },
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
    // Carta sintética con 9 consonantes distintas (una de más, 'X', que
    // nunca se pide) para agotar el límite de consonantes de Ronda 1
    // sin que la frase quede completamente revelada de paso.
    let estado = estadoBase({
      mazo: {
        ...estadoBase().mazo,
        c1: { id: 'c1', texto: 'BCDFGHJKX', orden: 1, bolsaInicial: 100, bolsa: 100, jugada: false, ganadorId: null },
      },
    });
    estado = motorReducer(estado, { type: 'ELEGIR_CARTA', cartaId: 'c1' });

    for (const letra of ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K']) {
      estado = motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra });
    }

    expect(estado.equipos.rojo.intentos.consonantes).toBe(0);
    expect(estado.equipos.rojo.panteraEstado).toBe(0); // ninguna fue fallo
    expect(estado.cartaActualId).toBe('c1'); // la carta sigue en juego (falta la X)
    expect(() => motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra: 'X' })).toThrow(MotorError);
  });
});

describe('Pantera al Acecho — derrota automática', () => {
  it('tras 5 fallos activa el Robo directamente, sin pasar por Modo Adivinar', () => {
    // Carta solo con vocales: cualquier consonante pedida es un fallo garantizado.
    let estado = estadoBase({
      mazo: {
        ...estadoBase().mazo,
        c1: { id: 'c1', texto: 'AEIOU', orden: 1, bolsaInicial: 100, bolsa: 100, jugada: false, ganadorId: null },
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

describe('Bolsa de la carta', () => {
  it('cada letra pedida le quita 5, acierte o falle', () => {
    let estado = motorReducer(estadoBase(), { type: 'ELEGIR_CARTA', cartaId: 'c1' }); // SOL, bolsa 100
    estado = motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra: 'S' });
    expect(estado.mazo.c1.bolsa).toBe(95);
    estado = motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra: 'X' });
    expect(estado.mazo.c1.bolsa).toBe(90);
  });

  it('no baja de 0', () => {
    let estado = motorReducer(estadoBase(), { type: 'ELEGIR_CARTA', cartaId: 'c1' });
    estado = { ...estado, mazo: { ...estado.mazo, c1: { ...estado.mazo.c1, bolsa: 5 } } };
    estado = motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra: 'S' });
    expect(estado.mazo.c1.bolsa).toBe(0);
    estado = motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra: 'X' });
    expect(estado.mazo.c1.bolsa).toBe(0);
  });

  it('con la bolsa vacía, ganar no suma nada', () => {
    let estado = motorReducer(estadoBase(), { type: 'ELEGIR_CARTA', cartaId: 'c1' });
    estado = { ...estado, mazo: { ...estado.mazo, c1: { ...estado.mazo.c1, bolsa: 0 } } };
    estado = motorReducer(estado, { type: 'ENVIAR_RESPUESTA', intento: 'sol' });

    expect(estado.equipos.rojo.gano).toBe(true);
    expect(estado.equipos.rojo.saldo).toBe(200);
  });

  it('no toca la bolsa de las demás cartas', () => {
    let estado = motorReducer(estadoBase(), { type: 'ELEGIR_CARTA', cartaId: 'c1' });
    estado = motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra: 'S' });
    expect(estado.mazo.c2.bolsa).toBe(90);
  });
});

describe('COMPRAR_ACIERTO_SEGURO', () => {
  function estadoConCasa() {
    let estado = estadoBase({
      mazo: {
        ...estadoBase().mazo,
        c1: { id: 'c1', texto: 'CASA', orden: 1, bolsaInicial: 100, bolsa: 100, jugada: false, ganadorId: null },
      },
    });
    return motorReducer(estado, { type: 'ELEGIR_CARTA', cartaId: 'c1' });
  }

  it('le quita 15 a la bolsa (no al saldo), gasta el intento y revela una letra sin afectar la pantera', () => {
    const estado = motorReducer(estadoConCasa(), { type: 'COMPRAR_ACIERTO_SEGURO', categoria: 'vocal' });

    expect(estado.mazo.c1.bolsa).toBe(85); // 100 - 15
    expect(estado.equipos.rojo.saldo).toBe(200);
    expect(estado.equipos.rojo.intentos.vocales).toBe(2);
    expect(estado.equipos.rojo.panteraEstado).toBe(0);
    expect(estado.letrasUsadas.A).toBe('acierto');
  });

  it('se rechaza si no quedan letras de esa categoría por descubrir', () => {
    let estado = motorReducer(estadoConCasa(), { type: 'COMPRAR_ACIERTO_SEGURO', categoria: 'vocal' });
    // CASA solo tiene una vocal distinta (A), ya revelada.
    expect(() => motorReducer(estado, { type: 'COMPRAR_ACIERTO_SEGURO', categoria: 'vocal' })).toThrow(MotorError);
  });

  it('la consonante también cuesta 15 a la bolsa', () => {
    const estado = motorReducer(estadoConCasa(), { type: 'COMPRAR_ACIERTO_SEGURO', categoria: 'consonante' });
    expect(estado.mazo.c1.bolsa).toBe(85);
  });

  it('se puede comprar aunque el equipo no tenga saldo', () => {
    let estado = estadoConCasa();
    estado = { ...estado, equipos: { ...estado.equipos, rojo: { ...estado.equipos.rojo, saldo: 0 } } };
    estado = motorReducer(estado, { type: 'COMPRAR_ACIERTO_SEGURO', categoria: 'consonante' });

    expect(estado.equipos.rojo.saldo).toBe(0);
    expect(estado.mazo.c1.bolsa).toBe(85);
  });

  it('la bolsa no baja de 0', () => {
    let estado = estadoConCasa();
    estado = { ...estado, mazo: { ...estado.mazo, c1: { ...estado.mazo.c1, bolsa: 10 } } };
    estado = motorReducer(estado, { type: 'COMPRAR_ACIERTO_SEGURO', categoria: 'vocal' });
    expect(estado.mazo.c1.bolsa).toBe(0);
  });

  it('no está disponible en Ronda 2', () => {
    const estado = estadoBase({ ronda: 2, cartaActualId: 'c1' });
    expect(() => motorReducer(estado, { type: 'COMPRAR_ACIERTO_SEGURO', categoria: 'vocal' })).toThrow(MotorError);
  });
});

describe('ENVIAR_RESPUESTA — turno normal', () => {
  it('acierto: se lleva la bolsa, marca la carta y avanza el turno', () => {
    let estado = motorReducer(estadoBase(), { type: 'ELEGIR_CARTA', cartaId: 'c1' }); // SOL, bolsa 100
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

  it('robo exitoso: el equipo que roba se lleva la bolsa', () => {
    let estado = motorReducer(estadoEnRobo(), { type: 'ENVIAR_RESPUESTA', intento: 'sol' });

    expect(estado.equipos.azul.saldo).toBe(300); // 200 + 100
    expect(estado.equipos.rojo.saldo).toBe(200); // el equipo original no recibe nada
    expect(estado.mazo.c1.ganadorId).toBe('azul');
    expect(estado.modoRobo).toBeNull();
    expect(estado.turnoActualIndex).toBe(1); // avanza a azul, que ahora juega su propio turno
  });

  it('el que roba se lleva lo que quedó en la bolsa tras las letras del equipo original', () => {
    let estado = motorReducer(estadoBase(), { type: 'ELEGIR_CARTA', cartaId: 'c1' }); // SOL, bolsa 100
    estado = motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra: 'S' }); // 95
    estado = motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra: 'X' }); // 90 (un fallo también cuesta)
    estado = motorReducer(estado, { type: 'ENVIAR_RESPUESTA', intento: 'fallo' }); // robo -> azul
    estado = motorReducer(estado, { type: 'ENVIAR_RESPUESTA', intento: 'sol' });

    expect(estado.equipos.azul.saldo).toBe(290); // 200 + 90
  });

  it('robo fallido: nadie se lleva la bolsa', () => {
    let estado = motorReducer(estadoEnRobo(), { type: 'ENVIAR_RESPUESTA', intento: 'incorrecto' });

    expect(estado.equipos.azul.saldo).toBe(200);
    expect(estado.mazo.c1.ganadorId).toBeNull();
    expect(estado.mazo.c1.jugada).toBe(true);
    expect(estado.modoRobo).toBeNull();
  });

  it('durante el robo no se pueden pedir letras ni comprar Acierto Seguro', () => {
    const estado = estadoEnRobo();
    expect(() => motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra: 'A' })).toThrow(MotorError);
    expect(() => motorReducer(estado, { type: 'COMPRAR_ACIERTO_SEGURO', categoria: 'vocal' })).toThrow(MotorError);
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

describe('Victoria automática al revelar todas las letras (sin Modo Adivinar)', () => {
  it('si el equipo adivina todas las letras sueltas, gana de inmediato sin ENVIAR_RESPUESTA', () => {
    let estado = motorReducer(estadoBase(), { type: 'ELEGIR_CARTA', cartaId: 'c1' }); // SOL, bolsa 100

    estado = motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra: 'S' });
    expect(estado.equipos.rojo.gano).toBeNull(); // todavía falta O y L

    estado = motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra: 'O' });
    expect(estado.equipos.rojo.gano).toBeNull(); // todavía falta L

    // Última letra: la frase queda completa -> gana automáticamente.
    estado = motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra: 'L' });

    expect(estado.equipos.rojo.gano).toBe(true);
    // Cada letra pedida le quitó 5 a la bolsa, también la última: 100 - 15.
    expect(estado.equipos.rojo.saldo).toBe(285);
    expect(estado.mazo.c1.jugada).toBe(true);
    expect(estado.mazo.c1.ganadorId).toBe('rojo');
    expect(estado.cartaActualId).toBeNull(); // el turno ya avanzó
    expect(estado.turnoActualIndex).toBe(1);
  });

  it('también se detecta si la última letra la completa un Acierto Seguro', () => {
    let estado = estadoBase({
      mazo: {
        ...estadoBase().mazo,
        c1: { id: 'c1', texto: 'MAR', orden: 1, bolsaInicial: 90, bolsa: 90, jugada: false, ganadorId: null },
      },
    });
    estado = motorReducer(estado, { type: 'ELEGIR_CARTA', cartaId: 'c1' });
    estado = motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra: 'M' });
    estado = motorReducer(estado, { type: 'PEDIR_LETRA_LIBRE', letra: 'R' });
    expect(estado.equipos.rojo.gano).toBeNull(); // falta la A

    // Compra la única vocal que falta -> frase completa -> gana.
    estado = motorReducer(estado, { type: 'COMPRAR_ACIERTO_SEGURO', categoria: 'vocal' });

    expect(estado.equipos.rojo.gano).toBe(true);
    expect(estado.mazo.c1.ganadorId).toBe('rojo');
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
    expect(() => motorReducer(estado, { type: 'COMPRAR_ACIERTO_SEGURO', categoria: 'vocal' })).toThrow(MotorError);
  });

  it('un fallo es derrota directa, sin activar Robo', () => {
    let estado = motorReducer(estadoRepechaje(), { type: 'ELEGIR_CARTA', cartaId: 'c5' }); // RIO
    estado = motorReducer(estado, { type: 'ENVIAR_RESPUESTA', intento: 'incorrecto' });

    expect(estado.modoRobo).toBeNull();
    expect(estado.mazo.c5.jugada).toBe(true);
    expect(estado.mazo.c5.ganadorId).toBeNull();
    expect(estado.fase).toBe('CIERRE'); // único equipo en repechaje -> termina la ronda
  });

  it('un acierto se lleva la bolsa igual que en Ronda 1', () => {
    let estado = motorReducer(estadoRepechaje(), { type: 'ELEGIR_CARTA', cartaId: 'c5' }); // RIO, bolsa 60
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
    // verde juega y gana c4 (LUZ, bolsa 70) en esta misma prueba, así
    // que su saldo pasa de 90 a 160 — por eso queda antes que rojo (150).
    expect(estado.cierre.marcador.map((e) => e.id)).toEqual(['azul', 'amarillo', 'verde', 'rojo']);
    expect(estado.cierre.cartasReveladas.every((c) => c.jugada)).toBe(true);
  });
});

describe('RENDIRSE', () => {
  const sinIntentos = (equipo) => ({ ...equipo, intentos: { vocales: 0, consonantes: 0 } });

  it('con los intentos agotados, rendirse activa el Robo igual que un fallo', () => {
    const base = estadoBase();
    let estado = estadoBase({ equipos: { ...base.equipos, rojo: sinIntentos(base.equipos.rojo) } });
    estado = motorReducer(estado, { type: 'ELEGIR_CARTA', cartaId: 'c1' });
    estado = motorReducer(estado, { type: 'RENDIRSE' });

    expect(estado.equipos.rojo.gano).toBe(false);
    expect(estado.modoRobo).toEqual({ equipoId: 'azul', cartaId: 'c1' });
  });

  it('en Ronda 2 rendirse es derrota directa: la carta se cierra sin ganador', () => {
    const base = estadoBase();
    let estado = estadoBase({
      fase: 'REPECHAJE',
      ronda: 2,
      ordenTurnoActual: ['rojo'],
      equipos: { ...base.equipos, rojo: sinIntentos(base.equipos.rojo) },
    });
    estado = motorReducer(estado, { type: 'ELEGIR_CARTA', cartaId: 'c1' });
    estado = motorReducer(estado, { type: 'RENDIRSE' });

    expect(estado.mazo.c1.jugada).toBe(true);
    expect(estado.mazo.c1.ganadorId).toBeNull();
    expect(estado.modoRobo).toBeNull();
  });

  it('el equipo que roba puede rendirse: nadie se lleva la bolsa', () => {
    let estado = motorReducer(estadoBase(), { type: 'ELEGIR_CARTA', cartaId: 'c1' });
    estado = motorReducer(estado, { type: 'ENVIAR_RESPUESTA', intento: 'fallo' });
    estado = motorReducer(estado, { type: 'RENDIRSE' });

    expect(estado.equipos.azul.saldo).toBe(200);
    expect(estado.mazo.c1.jugada).toBe(true);
    expect(estado.mazo.c1.ganadorId).toBeNull();
    expect(estado.modoRobo).toBeNull();
  });

  it('en el Modo Adivinar voluntario también se puede rendir (activa el Robo)', () => {
    let estado = motorReducer(estadoBase(), { type: 'ELEGIR_CARTA', cartaId: 'c1' });
    estado = motorReducer(estado, { type: 'ACTIVAR_MODO_ADIVINAR' });
    estado = motorReducer(estado, { type: 'RENDIRSE' });

    expect(estado.modoRobo).toEqual({ equipoId: 'azul', cartaId: 'c1' });
  });

  it('fuera del Modo Adivinar y del Robo no se puede rendir', () => {
    const estado = motorReducer(estadoBase(), { type: 'ELEGIR_CARTA', cartaId: 'c1' });
    expect(() => motorReducer(estado, { type: 'RENDIRSE' })).toThrow(MotorError);
  });
});
