import RellenoInteligente from './RellenoInteligente.jsx';

export default function PanelAdivinar({ texto, letrasUsadas, obligatorio, onEnviar, onCancelar, onRendirse }) {
  return (
    <div className="panel-adivinar">
      {obligatorio && (
        <p className="panel-adivinar-aviso">El equipo agotó sus intentos de letras y debe declarar la frase.</p>
      )}

      <RellenoInteligente texto={texto} letrasUsadas={letrasUsadas} onEnviar={onEnviar} textoBoton="Adivinar" />

      <div className="panel-adivinar-acciones">
        {!obligatorio && (
          <button type="button" className="btn-secundario" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="button" className="btn-secundario panel-rendirse" onClick={onRendirse}>
          Rendirse
        </button>
      </div>
    </div>
  );
}
