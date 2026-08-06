import { useEffect, useMemo, useRef, useState } from 'react';
import { normalizarLetra } from '../../motor/index.js';

function esLetra(caracter) {
  return /[A-ZÑa-zñ]/i.test(caracter);
}

// Arma, a partir de la frase y las letras ya reveladas, una celda por
// carácter: fija (espacios/signos), bloqueada (letra ya adivinada) o
// editable (todavía oculta). Solo las editables aceptan texto.
function construirCeldas(texto, letrasUsadas) {
  return texto.split('').map((caracter) => {
    if (!esLetra(caracter)) return { tipo: 'fijo', valor: caracter };
    const revelada = letrasUsadas[normalizarLetra(caracter)] === 'acierto';
    return revelada ? { tipo: 'bloqueada', valor: caracter } : { tipo: 'editable', valor: '' };
  });
}

export default function RellenoInteligente({ texto, letrasUsadas = {}, onEnviar, textoBoton = 'Adivinar' }) {
  const celdas = useMemo(() => construirCeldas(texto, letrasUsadas), [texto, letrasUsadas]);
  const indicesEditables = useMemo(
    () => celdas.map((c, i) => (c.tipo === 'editable' ? i : null)).filter((i) => i !== null),
    [celdas],
  );

  const [valores, setValores] = useState(() => celdas.map((c) => c.valor));
  const refs = useRef([]);

  useEffect(() => {
    // Foco en la primera celda vacía al entrar (nueva carta o nuevo robo).
    const primeraVacia = indicesEditables.find((i) => !valores[i]) ?? indicesEditables[0];
    if (primeraVacia !== undefined) refs.current[primeraVacia]?.focus();
    // Solo se ejecuta al montar este intento — no en cada tecla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function siguienteEditable(desde) {
    return indicesEditables.find((i) => i > desde);
  }
  function anteriorEditable(desde) {
    return [...indicesEditables].reverse().find((i) => i < desde);
  }

  function manejarCambio(indice, textoIngresado) {
    const caracter = textoIngresado.slice(-1);
    setValores((prev) => {
      const copia = [...prev];
      copia[indice] = caracter ? caracter.toUpperCase() : '';
      return copia;
    });
    if (caracter) {
      const siguiente = siguienteEditable(indice);
      if (siguiente !== undefined) refs.current[siguiente]?.focus();
    }
  }

  function manejarTeclaAbajo(indice, e) {
    if (e.key === 'Backspace' && !valores[indice]) {
      e.preventDefault();
      const anterior = anteriorEditable(indice);
      if (anterior !== undefined) {
        setValores((prev) => {
          const copia = [...prev];
          copia[anterior] = '';
          return copia;
        });
        refs.current[anterior]?.focus();
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const anterior = anteriorEditable(indice);
      if (anterior !== undefined) refs.current[anterior]?.focus();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const siguiente = siguienteEditable(indice);
      if (siguiente !== undefined) refs.current[siguiente]?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      intentarEnviar();
    }
  }

  const faltanCeldas = indicesEditables.some((i) => !valores[i]);

  function intentarEnviar() {
    if (faltanCeldas) return;
    onEnviar(valores.join(''));
  }

  return (
    <div className="relleno-inteligente">
      <div className="relleno-celdas">
        {celdas.map((celda, i) => {
          if (celda.tipo === 'fijo') {
            return <span key={i} className="progreso-espacio" aria-hidden="true" />;
          }
          if (celda.tipo === 'bloqueada') {
            return (
              <span key={i} className="progreso-celda revelada celda-bloqueada">
                {celda.valor}
              </span>
            );
          }
          return (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="text"
              inputMode="text"
              maxLength={1}
              value={valores[i]}
              onChange={(e) => manejarCambio(i, e.target.value)}
              onKeyDown={(e) => manejarTeclaAbajo(i, e)}
              onFocus={(e) => e.target.select()}
              className="progreso-celda celda-editable"
              aria-label={`Letra ${i + 1} por completar`}
            />
          );
        })}
      </div>

      <button type="button" className="btn-primario" disabled={faltanCeldas} onClick={intentarEnviar}>
        {textoBoton}
      </button>
    </div>
  );
}
