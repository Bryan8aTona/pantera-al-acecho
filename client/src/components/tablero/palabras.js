// Posiciones de cada palabra de la frase (los espacios no entran). Las
// celdas se agrupan por palabra para que el renglón solo se corte entre
// palabras: una palabra partida en dos renglones cuesta mucho más
// adivinarla. Los signos pegados a una palabra ("riesgo:") van con ella.
export function indicesPorPalabra(texto) {
  const palabras = [];
  let actual = [];
  // split(''), igual que progresoDeFrase, para que los índices coincidan.
  texto.split('').forEach((caracter, i) => {
    if (caracter === ' ') {
      if (actual.length) palabras.push(actual);
      actual = [];
    } else {
      actual.push(i);
    }
  });
  if (actual.length) palabras.push(actual);
  return palabras;
}
