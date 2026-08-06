import RellenoInteligente from './RellenoInteligente.jsx';

export default function PanelAdivinar({ texto, letrasUsadas, obligatorio, onEnviar, onCancelar }) {
  return (
    <div className="panel-adivinar">
      {obligatorio && (
        <p className="panel-adivinar-aviso">
          El equipo agotó sus intentos de letras — debe declarar la frase.
        </p>
      )}

      <RellenoInteligente texto={texto} letrasUsadas={letrasUsadas} onEnviar={onEnviar} textoBoton="Adivinar" />

      {!obligatorio && (
        <button type="button" className="btn-secundario panel-adivinar-cancelar" onClick={onCancelar}>
          Cancelar
        </button>
      )}
    </div>
  );
}
