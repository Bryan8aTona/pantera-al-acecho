import { VOCALES } from './constantes.ts';
import { MotorError } from './errores.ts';
import { normalizarLetra, normalizarTexto } from './normalizacion.ts';
import type { Categoria, ClaveIntento } from './tipos.ts';

// ¿El carácter es una letra jugable? Se evalúa sobre la forma
// normalizada, así que las vocales con tilde o diéresis (Á, ü...) cuentan
// como letra, igual que la Ñ. Espacios, dígitos y signos de puntuación no.
export function esLetra(caracter: string): boolean {
  return /^[A-ZÑ]$/.test(normalizarLetra(caracter));
}

export function esVocal(letra: string): boolean {
  return VOCALES.includes(normalizarLetra(letra));
}

export function categoriaDeLetra(letra: string): Categoria {
  return esVocal(letra) ? 'vocal' : 'consonante';
}

// Clave de `equipo.intentos` que corresponde a una categoría de letra.
// El `throw` cubre las llamadas desde JS, donde el tipo no se comprueba.
export function claveIntento(categoria: Categoria): ClaveIntento {
  if (categoria === 'vocal') return 'vocales';
  if (categoria === 'consonante') return 'consonantes';
  throw new MotorError('CATEGORIA_INVALIDA', `Categoría inválida: ${String(categoria)}`);
}

// Índices (0-based) donde aparece la letra dentro del texto, comparando
// de forma normalizada (sin tildes en vocales, sin distinguir mayúsculas,
// preservando la Ñ como letra distinta).
export function posicionesDeLetra(textoOriginal: string, letra: string): number[] {
  const normalizado = normalizarTexto(textoOriginal);
  const letraNorm = normalizarLetra(letra);
  const posiciones: number[] = [];

  for (let i = 0; i < normalizado.length; i += 1) {
    if (normalizado[i] === letraNorm) posiciones.push(i);
  }
  return posiciones;
}

// Todas las letras únicas (normalizadas) del texto, sin filtrar por
// categoría. Se usa para detectar cuándo una frase quedó completamente
// revelada por adivinanza de letras sueltas (sin pasar por Modo Adivinar).
export function letrasUnicasDeTexto(textoOriginal: string): string[] {
  const normalizado = normalizarTexto(textoOriginal);
  const vistas = new Set<string>();
  for (const caracter of normalizado) {
    if (esLetra(caracter)) vistas.add(caracter);
  }
  return [...vistas];
}

// Letras únicas (normalizadas) de una categoría presentes en el texto,
// en su orden de primera aparición. Se usa para Acierto Seguro.
export function letrasUnicasPorCategoria(textoOriginal: string, categoria: Categoria): string[] {
  const normalizado = normalizarTexto(textoOriginal);
  const vistas = new Set<string>();
  const resultado: string[] = [];

  for (const caracter of normalizado) {
    if (!esLetra(caracter)) continue; // ignora espacios y signos
    if (vistas.has(caracter)) continue;
    if (categoriaDeLetra(caracter) !== categoria) continue;
    vistas.add(caracter);
    resultado.push(caracter);
  }

  return resultado;
}
