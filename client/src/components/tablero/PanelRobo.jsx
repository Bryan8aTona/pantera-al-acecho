import RellenoInteligente from './RellenoInteligente.jsx';

export default function PanelRobo({ equipoQueRoba, equipoOriginal, carta, letrasUsadas, onEnviar, onRendirse }) {
  return (
    <div className="panel-robo">
      <p className="panel-robo-aviso">
        {equipoOriginal?.nombre ?? 'El equipo'} no logró adivinar. <br />
        <strong>{equipoQueRoba.nombre}</strong> tiene una única oportunidad de robar la frase y llevarse la bolsa, sin
        pedir letras ni usar Acierto Seguro.
      </p>

      <RellenoInteligente
        texto={carta.texto}
        letrasUsadas={letrasUsadas}
        onEnviar={onEnviar}
        textoBoton="Declarar frase"
      />

      <div className="panel-adivinar-acciones">
        <button type="button" className="btn-secundario panel-rendirse" onClick={onRendirse}>
          Rendirse
        </button>
      </div>
    </div>
  );
}
