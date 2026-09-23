import { VOCALES } from './constantes.js';
import { MotorError } from './errores.js';
import { normalizarLetra, normalizarTexto } from './normalizacion.js';

// ¿El carácter es una letra jugable? Se evalúa sobre la forma
// normalizada, así que las vocales con tilde o diéresis (Á, ü...) cuentan
// como letra, igual que la Ñ. Espacios, dígitos y signos de puntuación no.
export function esLetra(caracter) {
  return /^[A-ZÑ]$/.test(normalizarLetra(caracter));
}

export function esVocal(letra) {
  return VOCALES.includes(normalizarLetra(letra));
}

export function categoriaDeLetra(letra) {
  return esVocal(letra) ? 'vocal' : 'consonante';
}

// Clave de `equipo.intentos` que corresponde a una categoría de letra.
export function claveIntento(categoria) {
  if (categoria === 'vocal') return 'vocales';
  if (categoria === 'consonante') return 'consonantes';
  throw new MotorError('CATEGORIA_INVALIDA', `Categoría inválida: ${categoria}`);
}

// Índices (0-based) donde aparece la letra dentro del texto, comparando
// de forma normalizada (sin tildes en vocales, sin distinguir mayúsculas,
// preservando la Ñ como letra distinta).
export function posicionesDeLetra(textoOriginal, letra) {
  const normalizado = normalizarTexto(textoOriginal);
  const letraNorm = normalizarLetra(letra);
  const posiciones = [];

  for (let i = 0; i < normalizado.length; i += 1) {
    if (normalizado[i] === letraNorm) posiciones.push(i);
  }
  return posiciones;
}

// Todas las letras únicas (normalizadas) del texto, sin filtrar por
// categoría. Se usa para detectar cuándo una frase quedó completamente
// revelada por adivinanza de letras sueltas (sin pasar por Modo Adivinar).
export function letrasUnicasDeTexto(textoOriginal) {
  const normalizado = normalizarTexto(textoOriginal);
  const vistas = new Set();
  for (const caracter of normalizado) {
    if (esLetra(caracter)) vistas.add(caracter);
  }
  return [...vistas];
}

// Letras únicas (normalizadas) de una categoría presentes en el texto,
// en su orden de primera aparición. Se usa para Acierto Seguro.
export function letrasUnicasPorCategoria(textoOriginal, categoria) {
  const normalizado = normalizarTexto(textoOriginal);
  const vistas = new Set();
  const resultado = [];

  for (const caracter of normalizado) {
    if (!esLetra(caracter)) continue; // ignora espacios y signos
    if (vistas.has(caracter)) continue;
    if (categoriaDeLetra(caracter) !== categoria) continue;
    vistas.add(caracter);
    resultado.push(caracter);
  }

  return resultado;
}
