import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Footer from '../components/Footer.jsx';
import './HomePage.css';

const PASOS = [
  {
    titulo: 'El docente arma un set de 8 frases',
    detalle:
      'Desde el panel privado crea, nombra y guarda sets de frases que quedan vinculados a su cuenta para reutilizarlos en cualquier clase.',
  },
  {
    titulo: 'Sorteo de los 4 equipos',
    detalle:
      'El sistema baraja a los equipos Rojo, Azul, Amarillo y Verde y fija el orden de turnos de izquierda a derecha.',
  },
  {
    titulo: 'Cada equipo elige una carta y pide letras',
    detalle:
      'En su turno, el equipo toma una tarjeta del mazo y pide letras al aire (gratis) o compra un “Acierto Seguro” con monedas. Cada letra consume un intento, y los intentos por categoría son limitados.',
  },
  {
    titulo: 'La pantera acecha con cada error',
    detalle:
      'Cada fallo en la opción gratuita acerca a la pantera un estado. Al quinto error la pantera ataca: el equipo pierde el turno y la frase queda en juego para que la robe el equipo siguiente.',
  },
  {
    titulo: 'Modo Adivinar para declarar la frase',
    detalle:
      'En cualquier momento el equipo puede intentar la frase completa. El docente escribe la respuesta que el equipo declara en voz alta y el sistema la valida ignorando mayúsculas y acentos.',
  },
  {
    titulo: 'Ronda de Repechaje',
    detalle:
      'Los equipos que no adivinaron en la Ronda 1 juegan una segunda ronda con menos intentos, sin monedas y sin robo: un fallo es derrota directa.',
  },
  {
    titulo: 'Marcador final',
    detalle:
      'Al cerrar la partida se revelan todas las tarjetas restantes con su valor y se muestra el marcador con los saldos de los cuatro equipos.',
  },
];

const MANUAL = [
  {
    titulo: 'Entra con tu cuenta',
    detalle:
      'Abre la aplicación y pulsa “Iniciar sesión”. Si es tu primera vez, crea una cuenta con tu nombre, correo y una contraseña de al menos 8 caracteres. La sesión queda abierta en ese equipo hasta que cierres sesión.',
  },
  {
    titulo: 'Prepara un set de 8 frases',
    detalle:
      'En el panel, crea un set, ponle nombre y escribe exactamente 8 frases en el orden en que quieres jugarlas: las 4 primeras son la Ronda 1 y las 4 siguientes quedan disponibles para el Repechaje. Puedes editar o eliminar tus sets cuando quieras; se guardan en tu cuenta para reutilizarlos en otras clases.',
  },
  {
    titulo: 'Inicia la partida',
    detalle:
      'Entra a “Configuración de partida”, elige el set y comienza. Proyecta la pantalla al grupo y ponla en pantalla completa del navegador (tecla F11). El sorteo de los equipos y el reparto de premios de las cartas son automáticos.',
  },
  {
    titulo: 'Dirige cada turno',
    detalle:
      'En su turno, el equipo elige una carta boca abajo y tú registras en el tablero lo que declaran en voz alta:',
    puntos: [
      'Pedir una letra: púlsala en el teclado virtual. Si la letra no está en la frase, la pantera avanza un estado.',
      'Acierto Seguro: los botones de vocal / consonante gastan monedas del equipo y revelan una letra sin arriesgar a la pantera.',
      'Modo Adivinar: escribe la frase completa que el equipo declara; el sistema la valida ignorando mayúsculas y acentos.',
      'A los 5 fallos la pantera ataca: el equipo pierde el turno y el equipo siguiente puede robar la frase con un único intento.',
    ],
  },
  {
    titulo: 'Ronda de Repechaje',
    detalle:
      'Al terminar la Ronda 1, un panel anuncia el Repechaje: vuelven solo los equipos que no adivinaron su frase, con menos intentos, sin monedas y sin robo. Pulsa “Comenzar repechaje” cuando el grupo esté listo.',
  },
  {
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
        <section className="home-seccion">
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
            equipos ven un tablero de alta visibilidad con la selva, la pantera al acecho, el teclado
            virtual y el saldo de cada equipo.
          </p>

          <ul className="home-datos">
            <li>
              <strong>4</strong>
              equipos: Rojo, Azul, Amarillo y Verde
            </li>
            <li>
              <strong>8</strong>
              frases por partida (4 por ronda)
            </li>
            <li>
              <strong>2</strong>
              rondas: juego y repechaje
            </li>
          </ul>
        </section>

        <section className="home-seccion">
          <h2>¿Cómo se juega?</h2>
          <ol className="home-pasos">
            {PASOS.map((paso) => (
              <li key={paso.titulo}>
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
          <ol className="home-pasos">
            {MANUAL.map((paso) => (
              <li key={paso.titulo}>
                <h3>{paso.titulo}</h3>
                <p>{paso.detalle}</p>
                {paso.puntos && (
                  <ul className="home-subpuntos">
                    {paso.puntos.map((punto) => (
                      <li key={punto}>{punto}</li>
                    ))}
                  </ul>
                )}
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
