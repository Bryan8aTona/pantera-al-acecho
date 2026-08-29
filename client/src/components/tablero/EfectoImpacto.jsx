// El video del nuevo estado ahora se reproduce directo en la cajita
// ambiente de PanteraDisplay (con sonido) — este componente solo pone
// el destello rojo de "impacto" sobre toda la pantalla. La vibración
// de pantalla la aplica TableroJuegoPage con la clase .tablero-shake.
export default function EfectoImpacto() {
  return <div className="flash-rojo" aria-hidden="true" />;
}
