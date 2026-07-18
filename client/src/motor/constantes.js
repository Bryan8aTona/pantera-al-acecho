// Todos los valores numéricos vienen directo de requerimientos.md —
// no inventar ni ajustar aquí sin actualizar ese documento primero.

export const EQUIPOS_BASE = [
  { id: 'rojo', nombre: 'Rojo' },
  { id: 'azul', nombre: 'Azul' },
  { id: 'amarillo', nombre: 'Amarillo' },
  { id: 'verde', nombre: 'Verde' },
];

// Sección 3.1: 5 niveles de premio, con repetición permitida entre las 8 frases.
export const PREMIOS_DISPONIBLES = [100, 90, 80, 70, 60];

// Sección 3.3
export const SALDO_INICIAL = 200;
export const COSTO_ACIERTO_SEGURO = { vocal: 35, consonante: 20 };

// Sección 3.2
export const LIMITES_INTENTOS = {
  1: { vocales: 3, consonantes: 8 },
  2: { vocales: 2, consonantes: 5 },
};

// Sección 3.4: al llegar a este estado, derrota automática.
export const PANTERA_ESTADO_DERROTA = 5;

export const VOCALES = ['A', 'E', 'I', 'O', 'U'];
