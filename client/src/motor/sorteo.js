// Barajado Fisher-Yates con función aleatoria inyectable (testeable).
// Se usa para el sorteo inicial de los 4 equipos (requerimientos.md 3.1).
export function sortearOrden(items, aleatorio = Math.random) {
  const copia = [...items];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
