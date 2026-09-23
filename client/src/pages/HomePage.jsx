import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Footer from '../components/Footer.jsx';
import './HomePage.css';

// Íconos de trazo para "¿Cómo se juega?". Heredan el color del círculo
// que los contiene (currentColor) y son decorativos: el título del paso ya
// dice lo mismo, así que van con aria-hidden.
function Icono({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="30"
      height="30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

const IconoSet = () => (
  <Icono>
    <rect x="7" y="3" width="12" height="16" rx="2" />
    <path d="M5 6.5v12A2.5 2.5 0 0 0 7.5 21H15" />
    <path d="M10 8h6M10 11h6M10 14h4" />
  </Icono>
);

const IconoSorteo = () => (
  <Icono>
    <path d="M3 7h3.5c2 0 3 1 4.2 2.8l2.6 4.4C14.5 16 15.5 17 17.5 17H21" />
    <path d="M3 17h3.5c1.4 0 2.3-.5 3.1-1.4M14.4 8.4c.8-.9 1.7-1.4 3.1-1.4H21" />
    <path d="m18.5 4.5 2.5 2.5-2.5 2.5M18.5 14.5l2.5 2.5-2.5 2.5" />
  </Icono>
);

const IconoCartaLetra = () => (
  <Icono>
    <path d="M9.5 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
    <rect x="9.5" y="8" width="11.5" height="13" rx="2" />
    <path d="m12.8 18 2.45-6.5L17.7 18M13.7 15.8h3.1" />
  </Icono>
);

const IconoPantera = () => (
  <Icono>
    <path d="M4 3.5 7.6 7a9 9 0 0 1 8.8 0L20 3.5V12a8 8 0 0 1-16 0V3.5Z" />
    <path d="M8 11.5c.8-.7 1.8-.7 2.6 0M13.4 11.5c.8-.7 1.8-.7 2.6 0" />
    <path d="M10.8 15.5h2.4L12 17l-1.2-1.5Z" />
  </Icono>
);

const IconoAdivinar = () => (
  <Icono>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5v-8Z" />
    <path d="M10 7.8a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.3v.4" />
    <path d="M12 13.4h.01" />
  </Icono>
);

const IconoRepechaje = () => (
  <Icono>
    <path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H19" />
    <path d="m16 3 3 3-3 3" />
    <path d="M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H5" />
    <path d="m8 21-3-3 3-3" />
  </Icono>
);

const IconoTrofeo = () => (
  <Icono>
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
    <path d="M7 6H4.5v1.5A3 3 0 0 0 7.3 10.5M17 6h2.5v1.5a3 3 0 0 1-2.8 3" />
    <path d="M12 14v3M8.5 20h7M9.5 20l.5-3h4l.5 3" />
  </Icono>
);

const PASOS = [
  {
    icono: <IconoSet />,
    titulo: 'El docente arma un set de 8 frases',
    detalle:
      'Desde el panel privado crea, nombra y guarda sets de frases que quedan vinculados a su cuenta para reutilizarlos en cualquier clase.',
  },
  {
    icono: <IconoSorteo />,
    titulo: 'Sorteo de los 4 equipos',
    detalle:
      'El sistema baraja a los equipos Rojo, Azul, Amarillo y Verde y fija el orden de turnos de izquierda a derecha.',
  },
  {
    icono: <IconoCartaLetra />,
    titulo: 'Cada equipo elige una carta y pide letras',
    detalle:
      'En su turno, el equipo toma una tarjeta del mazo y pide letras al aire (gratis) o compra un “Acierto Seguro” con monedas. Cada letra consume un intento, y los intentos por categoría son limitados.',
  },
  {
    icono: <IconoPantera />,
    titulo: 'La pantera acecha con cada error',
    detalle:
      'Cada fallo en la opción gratuita acerca a la pantera un estado. Al quinto error la pantera ataca: el equipo pierde el turno y la frase queda en juego para que la robe el equipo siguiente.',
  },
  {
    icono: <IconoAdivinar />,
    titulo: 'Modo Adivinar para declarar la frase',
    detalle:
      'En cualquier momento el equipo puede intentar la frase completa. El docente escribe la respuesta que el equipo declara en voz alta y el sistema la valida.',
  },
  {
    icono: <IconoRepechaje />,
    titulo: 'Ronda de Repechaje',
    detalle:
      'Los equipos que no adivinaron en la Ronda 1 juegan una segunda ronda con menos intentos, sin monedas y sin robo: un fallo es derrota directa.',
  },
  {
    icono: <IconoTrofeo />,
    titulo: 'Marcador final',
    detalle:
      'Al cerrar la partida se revelan todas las tarjetas restantes con su valor y se muestra el marcador con los saldos de los cuatro equipos.',
  },
];

const MANUAL = [
  {
    imagen: '/assets/home/manual-1-cuenta.webp',
    alt: 'Pantalla de acceso con la pestaña “Crear cuenta” abierta: campos de nombre, correo y contraseña.',
    titulo: 'Entra con tu cuenta',
    detalle:
      'Abre la aplicación y pulsa “Iniciar sesión”. Si es tu primera vez, crea una cuenta con tu nombre, correo y una contraseña de al menos 8 caracteres. La sesión queda abierta en ese equipo hasta que cierres sesión.',
  },
  {
    imagen: '/assets/home/manual-2-set.webp',
    alt: 'Formulario “Nuevo set” con el nombre del set y las frases numeradas del 1 al 8.',
    titulo: 'Prepara un set de 8 frases',
    detalle:
      'En el panel, crea un set, ponle nombre y escribe sus 8 frases. En la partida, cada frase va en una carta boca abajo: en la Ronda 1 cada equipo elige la suya y las que nadie eligió quedan para el Repechaje. Puedes editar o eliminar tus sets cuando quieras; se guardan en tu cuenta para reutilizarlos en otras clases.',
  },
  {
    imagen: '/assets/home/manual-3-partida.webp',
    alt: 'Pantalla “Configurar partida” con la lista de sets, uno seleccionado, y el botón “Iniciar partida”.',
    titulo: 'Inicia la partida',
    detalle:
      'Entra a “Configuración de partida”, elige el set y comienza. Proyecta la pantalla al grupo y ponla en pantalla completa del navegador (tecla F11). El sorteo de los equipos y el reparto de premios de las cartas son automáticos.',
  },
  {
    imagen: '/assets/home/manual-4-turno.webp',
    alt: 'Tablero durante un turno: la carta elegida, la frase con las letras acertadas, el teclado virtual con las letras usadas y la pantera asomando tras dos fallos.',
    titulo: 'Dirige cada turno',
    detalle:
      'En su turno, el equipo elige una carta boca abajo y tú registras en el tablero lo que declaran en voz alta:',
    puntos: [
      'Pedir una letra: púlsala en el teclado virtual. Si la letra no está en la frase, la pantera avanza un estado.',
      'Acierto Seguro: los botones de vocal / consonante gastan monedas del equipo y revelan una letra sin arriesgar a la pantera.',
      'Modo Adivinar: escribe la frase completa que el equipo declara y el sistema la valida.',
      'A los 5 fallos la pantera ataca: el equipo pierde el turno y el equipo siguiente puede robar la frase con un único intento.',
    ],
  },
  {
    imagen: '/assets/home/manual-5-repechaje.webp',
    alt: 'Panel “Comienza la Ronda de Repechaje” con los equipos que vuelven a jugar y el botón “Comenzar repechaje”.',
    titulo: 'Ronda de Repechaje',
    detalle:
      'Al terminar la Ronda 1, un panel anuncia el Repechaje: vuelven solo los equipos que no adivinaron su frase, con menos intentos, sin monedas y sin robo. Pulsa “Comenzar repechaje” cuando el grupo esté listo.',
  },
  {
    imagen: '/assets/home/manual-6-marcador.webp',
    alt: 'Marcador final con los saldos de los cuatro equipos y las frases que no se jugaron con su valor.',
    titulo: 'Cierre y marcador',
    detalle:
      'Al final se revelan las frases no jugadas con su valor y se muestra el marcador con los saldos. Usa “Salir de la partida” para volver a la configuración e iniciar otra.',
  },
];

export default function HomePage() {
  const { usuario, cargando } = useAuth();

  // Un docente ya autenticado no necesita la portada: directo al panel.
  if (!cargando && usuario) {
    return <Navigate to="/panel" replace />;
  }

  return (
    <div className="home">
      <header className="home-hero">
        <img src="/assets/logo-uam.png" alt="Universidad Autónoma Metropolitana" className="home-hero-logo" />
        <h1 className="home-hero-titulo">Pantera al Acecho</h1>
        <p className="home-hero-tagline">Un videojuego para el repaso en clase</p>
        <Link to="/login" className="btn-primario home-hero-cta">
          Iniciar sesión
        </Link>
      </header>

      <main className="home-contenido">
        <section className="home-seccion home-intro">
          <h2>¿Qué es Pantera al Acecho?</h2>
          <p>
            Es una aplicación web que lleva el clásico “juego del ahorcado” al salón de clases y lo
            convierte en una competencia de gestión de recursos y conocimiento entre cuatro equipos.
            El sistema automatiza los turnos, el conteo de letras, el límite de intentos, la validación
            de respuestas y el puntaje, de modo que el docente solo dirige el ritmo de la clase e
            ingresa las decisiones que los equipos declaran en voz alta.
          </p>
          <p>
            Está pensada para proyectarse en el aula: el docente opera desde su computadora y los
            equipos ven en la proyección el tablero con la pantera al acecho, el teclado virtual y el
            saldo de cada equipo.
          </p>
        </section>

        <section className="home-seccion">
          <h2>¿Cómo se juega?</h2>
          <ol className="home-juego">
            {PASOS.map((paso, i) => (
              <li key={paso.titulo} className="home-juego-paso">
                <div className="home-juego-cabeza">
                  <span className="home-juego-icono">{paso.icono}</span>
                  <span className="home-num" aria-hidden="true">
                    {i + 1}
                  </span>
                </div>
                <h3>{paso.titulo}</h3>
                <p>{paso.detalle}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="home-seccion">
          <h2>Manual para el docente</h2>
          <p>
            La partida la operas tú desde tu computadora; los equipos solo miran la proyección y
            declaran sus decisiones en voz alta. Estos son los pasos de principio a fin.
          </p>
          <ol className="home-manual">
            {MANUAL.map((paso, i) => (
              <li key={paso.titulo} className="home-manual-paso">
                <div className="home-manual-texto">
                  <span className="home-num" aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3>{paso.titulo}</h3>
                  <p>{paso.detalle}</p>
                  {paso.puntos && (
                    <ul className="home-subpuntos">
                      {paso.puntos.map((punto) => (
                        <li key={punto}>{punto}</li>
                      ))}
                    </ul>
                  )}
                </div>
                {/* Marco tipo ventana del navegador para la captura de referencia. */}
                <figure className="home-captura">
                  <div className="home-captura-barra" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <img src={paso.imagen} alt={paso.alt} width="960" height="720" loading="lazy" decoding="async" />
                </figure>
              </li>
            ))}
          </ol>
          <p className="home-aviso">
            No recargues ni cierres la pestaña durante la partida: el juego vive en la memoria del
            navegador y se perdería (el navegador te pedirá confirmación). El botón 🔊 / 🔇 del
            encabezado del tablero silencia los efectos de sonido en cualquier momento.
          </p>
        </section>

        <section className="home-seccion home-cierre">
          <h2>¿Todo listo para dirigir la partida?</h2>
          <p>Entra con tu cuenta de docente para preparar tus sets de frases e iniciar el juego.</p>
          <Link to="/login" className="btn-primario">
            Iniciar sesión
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
