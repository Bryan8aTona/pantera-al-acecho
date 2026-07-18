import AppError from '../../utils/AppError.js';

const FRASES_POR_SET = 8;
const NOMBRE_MAX_LEN = 100;
const TEXTO_MAX_LEN = 500;

export function validarNombre(nombre) {
  if (!nombre || !nombre.trim()) {
    throw new AppError(400, 'El nombre del set es obligatorio');
  }
  if (nombre.trim().length > NOMBRE_MAX_LEN) {
    throw new AppError(400, `El nombre no puede superar los ${NOMBRE_MAX_LEN} caracteres`);
  }
}

/**
 * Valida el arreglo de frases de un set.
 * Regla de negocio (modelo-datos.md): un set siempre tiene exactamente
 * 8 frases, en posiciones 1-8 sin repetir.
 *
 * Nota: el back-office (React) ya impide llegar a este punto con un
 * conteo distinto de 8, pero se valida también en el servidor como
 * segunda capa de defensa ante llamadas directas a la API.
 */
export function validarFrases(frases) {
  if (!Array.isArray(frases) || frases.length !== FRASES_POR_SET) {
    throw new AppError(400, `Un set debe tener exactamente ${FRASES_POR_SET} frases`);
  }

  const ordenesVistos = new Set();

  for (const frase of frases) {
    if (!frase || typeof frase.texto !== 'string' || !frase.texto.trim()) {
      throw new AppError(400, 'Cada frase debe tener un texto no vacío');
    }
    if (frase.texto.trim().length > TEXTO_MAX_LEN) {
      throw new AppError(400, `Cada frase no puede superar los ${TEXTO_MAX_LEN} caracteres`);
    }
    if (
      !Number.isInteger(frase.orden) ||
      frase.orden < 1 ||
      frase.orden > FRASES_POR_SET
    ) {
      throw new AppError(400, `El orden de cada frase debe ser un entero entre 1 y ${FRASES_POR_SET}`);
    }
    if (ordenesVistos.has(frase.orden)) {
      throw new AppError(400, `El orden ${frase.orden} está repetido`);
    }
    ordenesVistos.add(frase.orden);
  }
}

export function validarSetPayload({ nombre, frases }) {
  validarNombre(nombre);
  validarFrases(frases);
}
