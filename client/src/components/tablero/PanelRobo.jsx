import RellenoInteligente from './RellenoInteligente.jsx';

export default function PanelRobo({ equipoQueRoba, equipoOriginal, carta, letrasUsadas, onEnviar }) {
  return (
    <div className="panel-robo">
      <p className="panel-robo-aviso">
        {equipoOriginal?.nombre ?? 'El equipo'} no logró adivinar. <br />
        <strong>{equipoQueRoba.nombre}</strong> tiene una única oportunidad de robar la frase —
        sin letras, sin monedas.
      </p>

      <RellenoInteligente
        texto={carta.texto}
        letrasUsadas={letrasUsadas}
        onEnviar={onEnviar}
        textoBoton="Declarar frase"
      />
    </div>
  );
}
