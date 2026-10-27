import { useId } from 'react';

// Dibujos de la bolsa, compartidos por BolsaTesoro (la bolsa en juego) y
// AnimacionVictoria (la bolsa que revienta al ganar).

// Saco de cuero con monedas asomando. `proporcion` (0–1) lo desinfla:
// el cuerpo se achata hacia abajo y las monedas de arriba desaparecen.
export function SacoMonedas({ proporcion, className = 'bolsa-svg' }) {
  const escala = 0.55 + 0.45 * proporcion;
  // Ids únicos: puede haber dos bolsas a la vez en pantalla.
  const id = useId();
  const cuero = `${id}-cuero`;
  const oro = `${id}-oro`;
  return (
    <svg className={className} viewBox="0 0 100 112">
      <defs>
        <radialGradient id={cuero} cx="38%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#b9783a" />
          <stop offset="60%" stopColor="#8a5428" />
          <stop offset="100%" stopColor="#5a3417" />
        </radialGradient>
        <radialGradient id={oro} cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff2b0" />
          <stop offset="55%" stopColor="#f2c440" />
          <stop offset="100%" stopColor="#b8861b" />
        </radialGradient>
      </defs>

      <ellipse cx="50" cy="106" rx={30 * escala + 6} ry="4" fill="rgba(0,0,0,0.35)" />

      <g className="bolsa-cuerpo" style={{ transform: `scale(${0.85 + 0.15 * proporcion}, ${escala})` }}>
        {proporcion > 0.15 && (
          <g className="bolsa-monedas-asoman">
            <circle cx="40" cy="26" r="9" fill={`url(#${oro})`} stroke="#9a6d12" strokeWidth="1.5" />
            <circle cx="60" cy="25" r="9" fill={`url(#${oro})`} stroke="#9a6d12" strokeWidth="1.5" />
            <circle cx="50" cy="19" r="10" fill={`url(#${oro})`} stroke="#9a6d12" strokeWidth="1.5" />
          </g>
        )}
        <path
          d="M38 42 C 12 54, 4 102, 50 107 C 96 102, 88 54, 62 42 Z"
          fill={`url(#${cuero})`}
          stroke="#3f2410"
          strokeWidth="2"
        />
        <path
          d="M22 20 Q 34 30 37 43 L 63 43 Q 66 30 78 20 Q 64 28 50 26 Q 36 28 22 20 Z"
          fill="#a8693a"
          stroke="#3f2410"
          strokeWidth="2"
        />
        <path d="M34 44 Q 50 50 66 44" fill="none" stroke="#ecc15a" strokeWidth="5" strokeLinecap="round" />
        <path
          d="M64 45 q 8 4 6 14 M64 45 q 12 0 14 8"
          fill="none"
          stroke="#ecc15a"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="50" cy="76" r="13" fill="none" stroke="#ecc15a" strokeWidth="3" opacity="0.85" />
        <circle cx="50" cy="76" r="7" fill="#ecc15a" opacity="0.85" />
        <path
          d="M24 70 Q 22 88 34 98"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export function Polilla() {
  return (
    <svg className="bolsa-polilla" viewBox="0 0 40 30">
      <g className="polilla-ala izquierda">
        <path d="M20 15 C 10 2, 0 6, 4 16 C 7 22, 15 20, 20 15 Z" fill="#c9bfae" stroke="#7a6f60" strokeWidth="1" />
      </g>
      <g className="polilla-ala derecha">
        <path d="M20 15 C 30 2, 40 6, 36 16 C 33 22, 25 20, 20 15 Z" fill="#c9bfae" stroke="#7a6f60" strokeWidth="1" />
      </g>
      <ellipse cx="20" cy="16" rx="2.4" ry="7" fill="#6b5f50" />
      <path d="M19 9 Q 16 4 14 3 M21 9 Q 24 4 26 3" stroke="#6b5f50" strokeWidth="1" fill="none" />
    </svg>
  );
}
