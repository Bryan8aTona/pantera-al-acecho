// El video del nuevo estado ahora se reproduce directo en la cajita
// ambiente de PanteraDisplay (con sonido) — este componente solo pone
// un destello rojo tenue de "impacto" sobre toda la pantalla. La
// sacudida la aplica TableroJuegoPage con la clase .tablero-cuerpo-shake
// (sobre el envoltorio interno, no sobre el contenedor con scroll).
export default function EfectoImpacto() {
  return <div className="flash-rojo" aria-hidden="true" />;
}
