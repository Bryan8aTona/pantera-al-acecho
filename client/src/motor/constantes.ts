import type { Categoria, EquipoId, Fase, Intentos, Ronda } from './tipos.ts';

// Todos los valores numéricos vienen directo de requerimientos.md —
// no inventar ni ajustar aquí sin actualizar ese documento primero.

export const EQUIPOS_BASE: readonly { id: EquipoId; nombre: string }[] = [
  { id: 'rojo', nombre: 'Rojo' },
  { id: 'azul', nombre: 'Azul' },
  { id: 'amarillo', nombre: 'Amarillo' },
  { id: 'verde', nombre: 'Verde' },
];

// Sección 3.1: cada set tiene exactamente 8 frases (las que no se juegan
// en Ronda 1 alimentan el Repechaje). firestore.rules exige lo mismo.
export const FRASES_POR_SET = 8;

// Sección 3.3: la bolsa de cada carta. Empieza en BOLSA_BASE más
// BOLSA_POR_LETRA por cada letra distinta de la frase, y cada letra
// pedida le resta lo suyo (nunca baja de 0). Quien adivina se lleva lo
// que queda.
export const SALDO_INICIAL = 0;
export const BOLSA_BASE = 50;
export const BOLSA_POR_LETRA = 5;
export const COSTO_LETRA = 5;
export const COSTO_ACIERTO_SEGURO: Record<Categoria, number> = { vocal: 15, consonante: 15 };

// Sección 3.2
export const LIMITES_INTENTOS: Record<Ronda, Intentos> = {
  1: { vocales: 3, consonantes: 8 },
  2: { vocales: 2, consonantes: 5 },
};

// Fases de la partida (máquina de estados del reducer).
export const FASES = {
  RONDA1: 'RONDA1',
  REPECHAJE: 'REPECHAJE',
  CIERRE: 'CIERRE',
} as const satisfies Record<Fase, Fase>;

// Sección 3.4: al llegar a este estado, derrota automática.
export const PANTERA_ESTADO_DERROTA = 5;

export const VOCALES = ['A', 'E', 'I', 'O', 'U'];
