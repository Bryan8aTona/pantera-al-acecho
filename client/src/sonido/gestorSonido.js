// Gestor de efectos de sonido del juego. Sin dependencias: usa
// HTMLAudioElement. Si un archivo no existe, la llamada simplemente no
// suena (no rompe nada). El estado de "silenciado" se guarda en
// localStorage para que se recuerde entre partidas.
//
// Los archivos los coloca el docente en client/public/assets/sonidos/
// con los nombres de ARCHIVOS_SONIDO (ver también el README de esa
// carpeta). Formatos recomendados: .mp3 u .ogg, cortos (<1 s salvo
// victoria/derrota).

const BASE = '/assets/sonidos/';

export const ARCHIVOS_SONIDO = {
  repartir: 'repartir-cartas.mp3', // el mazo se despliega al inicio del turno
  hoverCarta: 'hover-carta.mp3', // el mouse pasa por una carta elegible
  elegirCarta: 'elegir-carta.mp3', // el equipo elige su carta
  fallo: 'fallo-letra.mp3', // letra al aire incorrecta (avanza la pantera)
  acierto: 'acierto-letra.mp3', // letra correcta (gratuita o Acierto Seguro)
  comprar: 'comprar-letra.mp3', // se pulsa un botón de Acierto Seguro
  victoria: 'victoria.mp3', // un equipo adivina la frase
  derrota: 'derrota.mp3', // la pantera llega al estado 5 (zarpazo)
  robo: 'robo.mp3', // se abre el panel de Robo  (sin cablear aún, opcional)
  repechaje: 'inicio-repechaje.mp3', // arranca la Ronda de Repechaje
  cierre: 'marcador-final.mp3', // se llega al marcador final
};

const CLAVE_SILENCIO = 'pantera:sonido:silenciado';

let silenciado = false;
let leidoDeAlmacenamiento = false;
const cache = new Map();
const suscriptores = new Set();

// Lectura perezosa: no se toca localStorage al importar el módulo (eso
// dispara un warning en el entorno de pruebas), sino la primera vez que
// algo consulta el estado, ya con el navegador/jsdom montado.
function asegurarInicial() {
  if (leidoDeAlmacenamiento) return;
  leidoDeAlmacenamiento = true;
  try {
    silenciado = window.localStorage.getItem(CLAVE_SILENCIO) === '1';
  } catch {
    /* almacenamiento no disponible */
  }
}

function obtenerBase(nombre) {
  if (cache.has(nombre)) return cache.get(nombre);
  const archivo = ARCHIVOS_SONIDO[nombre];
  if (!archivo) return null;
  const audio = new Audio(BASE + archivo);
  audio.preload = 'auto';
  cache.set(nombre, audio);
  return audio;
}

export function precargarSonidos() {
  Object.keys(ARCHIVOS_SONIDO).forEach(obtenerBase);
}

export function reproducirSonido(nombre, { volumen = 1 } = {}) {
  asegurarInicial();
  if (silenciado) return;
  const ref = obtenerBase(nombre);
  if (!ref) return;
  // Se clona para permitir solapamiento (p. ej. teclas rápidas seguidas).
  const audio = ref.cloneNode(true);
  audio.volume = volumen;
  const p = audio.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});
}

export function estaSilenciado() {
  asegurarInicial();
  return silenciado;
}

export function alternarSilencio() {
  asegurarInicial();
  silenciado = !silenciado;
  try {
    window.localStorage.setItem(CLAVE_SILENCIO, silenciado ? '1' : '0');
  } catch {
    /* almacenamiento no disponible: se queda solo en memoria */
  }
  suscriptores.forEach((fn) => fn(silenciado));
  return silenciado;
}

export function suscribirseASilencio(fn) {
  suscriptores.add(fn);
  return () => suscriptores.delete(fn);
}
