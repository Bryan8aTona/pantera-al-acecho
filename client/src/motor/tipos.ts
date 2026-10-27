// Tipos del motor de reglas: la forma del estado de la partida y de las
// acciones que acepta el reducer. Solo tipos, no generan código.

export type EquipoId = 'rojo' | 'azul' | 'amarillo' | 'verde';

export type Categoria = 'vocal' | 'consonante';

// Claves de `equipo.intentos` (ver claveIntento en letras.ts).
export type ClaveIntento = 'vocales' | 'consonantes';

export type Intentos = Record<ClaveIntento, number>;

export type Fase = 'RONDA1' | 'REPECHAJE' | 'CIERRE';

export type Ronda = 1 | 2;

// Letra normalizada → cómo resultó en la carta activa.
export type LetrasUsadas = Record<string, 'acierto' | 'fallo'>;

// Frase de un set, tal como la entrega lib/sets.js (con `id` sintetizado).
export interface Frase {
  id: string;
  texto: string;
  orden: number;
}

export interface SetDeFrases {
  id: string;
  nombre: string;
  frases: Frase[];
}

export interface Carta {
  id: string;
  texto: string;
  orden: number; // número 1–8 que se ve boca abajo (posición en el mazo barajado)
  bolsaInicial: number; // 50 + 10 × letras distintas de la frase
  bolsa: number; // lo que queda: baja con cada letra pedida, nunca de 0
  jugada: boolean;
  ganadorId: EquipoId | null;
}

export type Mazo = Record<string, Carta>;

export interface Equipo {
  id: EquipoId;
  nombre: string;
  saldo: number;
  intentos: Intentos;
  panteraEstado: number; // 0 (sin errores) a PANTERA_ESTADO_DERROTA
  gano: boolean | null; // null = aún jugando, true = ganó su carta, false = la perdió
}

export interface ModoRobo {
  equipoId: EquipoId; // equipo que intenta robar
  cartaId: string;
}

export interface EntradaMarcador {
  id: EquipoId;
  nombre: string;
  saldo: number;
}

export interface Cierre {
  cartasReveladas: Carta[];
  marcador: EntradaMarcador[];
}

export interface EstadoPartida {
  fase: Fase;
  ronda: Ronda;
  equipos: Record<EquipoId, Equipo>;
  ordenTurnoRonda1: EquipoId[]; // fijo: se usa para calcular quién roba
  ordenTurnoActual: EquipoId[]; // subconjunto activo en la fase actual
  turnoActualIndex: number;
  turnosCompletados: number;
  mazo: Mazo;
  cartaActualId: string | null;
  letrasUsadas: LetrasUsadas; // solo de la carta activa; se reinicia por carta
  modoAdivinarActivo: boolean;
  modoRobo: ModoRobo | null; // mientras se resuelve un robo
  cierre: Cierre | null; // al llegar a la fase CIERRE
}

export type AccionMotor =
  | { type: 'ELEGIR_CARTA'; cartaId: string }
  | { type: 'PEDIR_LETRA_LIBRE'; letra: string }
  | { type: 'COMPRAR_ACIERTO_SEGURO'; categoria: Categoria }
  | { type: 'ACTIVAR_MODO_ADIVINAR' }
  | { type: 'CANCELAR_MODO_ADIVINAR' }
  | { type: 'ENVIAR_RESPUESTA'; intento: string }
  | { type: 'RENDIRSE' }
  | { type: 'CONFIRMAR_DERROTA' };

// Datos de una acción concreta, sin su `type`.
export type DatosAccion<T extends AccionMotor['type']> = Omit<Extract<AccionMotor, { type: T }>, 'type'>;
