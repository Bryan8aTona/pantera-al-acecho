// Siluetas de follaje para dar profundidad de "selva" al Tablero, sin
// archivos ni impacto en el bundle: es un único SVG inline, decorativo
// (aria-hidden) y sin capturar clics. Se apoya en las esquinas y queda
// muy tenue, por debajo del contenido.

function Fronda({ x, y, rotacion, escala }) {
  // Un abanico de hojas alargadas saliendo de un punto común.
  const hojas = [-42, -21, 0, 21, 42];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotacion}) scale(${escala})`}>
      {hojas.map((ang) => (
        <g key={ang} transform={`rotate(${ang})`}>
          <path d="M0 0 C 22 -14, 30 -52, 0 -96 C -30 -52, -22 -14, 0 0 Z" />
          <path
            d="M0 -6 L0 -88"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="2"
            fill="none"
          />
        </g>
      ))}
    </g>
  );
}

export default function HojasDecorativas() {
  return (
    <svg
      className="tablero-hojas"
      viewBox="0 0 1000 620"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g fill="#0A1F16">
        <Fronda x={-10} y={0} rotacion={150} escala={1.5} />
        <Fronda x={70} y={-20} rotacion={200} escala={1.1} />
        <Fronda x={1010} y={10} rotacion={-150} escala={1.6} />
        <Fronda x={930} y={-15} rotacion={-205} escala={1.15} />
        <Fronda x={40} y={640} rotacion={70} escala={1.2} />
        <Fronda x={975} y={630} rotacion={-70} escala={1.25} />
      </g>
    </svg>
  );
}
