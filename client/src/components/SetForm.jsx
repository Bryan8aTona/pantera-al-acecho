import { useState } from 'react';
import { FRASES_POR_SET } from '../motor/constantes.js';
import '../styles/campo.css';
import './SetForm.css';

const POSICIONES = Array.from({ length: FRASES_POR_SET }, (_, i) => i + 1);

function crearFrasesVacias() {
  return POSICIONES.map((orden) => ({ orden, texto: '' }));
}

// Acepta un set ya existente (con .frases en cualquier orden) y lo
// normaliza a un arreglo de 8 posiciones fijas para el formulario.
function normalizarFrasesIniciales(frasesExistentes) {
  const base = crearFrasesVacias();
  if (!frasesExistentes) return base;

  for (const frase of frasesExistentes) {
    const idx = base.findIndex((f) => f.orden === frase.orden);
    if (idx !== -1) base[idx] = { orden: frase.orden, texto: frase.texto };
  }
  return base;
}

export default function SetForm({ valorInicial, onGuardar, onCancelar, guardando }) {
  const [nombre, setNombre] = useState(valorInicial?.nombre ?? '');
  const [frases, setFrases] = useState(normalizarFrasesIniciales(valorInicial?.frases));
  const [error, setError] = useState(null);

  function actualizarFrase(orden, texto) {
    setFrases((prev) => prev.map((f) => (f.orden === orden ? { ...f, texto } : f)));
  }

  const faltanCampos = !nombre.trim() || frases.some((f) => !f.texto.trim());

  async function manejarEnvio(e) {
    e.preventDefault();
    setError(null);

    if (faltanCampos) {
      setError(`Completa el nombre y las ${FRASES_POR_SET} frases antes de guardar.`);
      return;
    }

    try {
      await onGuardar({
        nombre: nombre.trim(),
        frases: frases.map((f) => ({ orden: f.orden, texto: f.texto.trim() })),
      });
    } catch (err) {
      setError(err.message || 'No se pudo guardar el set');
    }
  }

  return (
    <form className="set-form" onSubmit={manejarEnvio}>
      <label className="campo set-form-nombre">
        <span>Nombre del set</span>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder='Ej. "Unidad 2 – Redes"'
          maxLength={100}
        />
      </label>

      <div className="set-form-frases">
        {frases.map((f) => (
          <label key={f.orden} className="frase-fila">
            <span className="frase-fila-num">{f.orden}</span>
            <textarea
              value={f.texto}
              onChange={(e) => actualizarFrase(f.orden, e.target.value)}
              placeholder={`Frase ${f.orden}`}
              maxLength={500}
              rows={2}
            />
          </label>
        ))}
      </div>

      {error && <p className="set-form-error" role="alert">{error}</p>}

      <div className="set-form-acciones">
        <button type="button" className="btn-secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="btn-primario" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar set'}
        </button>
      </div>
    </form>
  );
}
