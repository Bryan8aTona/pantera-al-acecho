import { categoriaDeLetra, claveIntento } from '../../motor/index.js';

const ALFABETO = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

export default function Teclado({ letrasUsadas, equipo, onPedirLetra, deshabilitado }) {
  return (
    <div className="teclado-virtual" role="group" aria-label="Teclado virtual">
      {ALFABETO.map((letra) => {
        const usoPrevio = letrasUsadas[letra]; // 'acierto' | 'fallo' | undefined
        const categoria = categoriaDeLetra(letra);
        const sinIntentos = equipo.intentos[claveIntento(categoria)] <= 0;
        const inhabilitada = deshabilitado || Boolean(usoPrevio) || sinIntentos;

        let clase = 'tecla';
        if (usoPrevio === 'acierto') clase += ' tecla-acierto';
        else if (usoPrevio === 'fallo') clase += ' tecla-fallo';
        else if (sinIntentos) clase += ' tecla-agotada';

        return (
          <button
            key={letra}
            type="button"
            className={clase}
            disabled={inhabilitada}
            onClick={() => onPedirLetra(letra)}
          >
            {letra}
          </button>
        );
      })}
    </div>
  );
}
