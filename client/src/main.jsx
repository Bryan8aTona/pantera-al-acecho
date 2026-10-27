import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
// Hojas de las páginas que App.jsx carga con React.lazy. Se importan
// aquí, en el mismo orden en que las traían sus páginas, para que sigan
// en el CSS principal y DELANTE de global.css: si llegaran con su chunk
// diferido quedarían detrás y le ganarían los empates (ver "Orden de la
// cascada CSS" en CLAUDE.md).
import './pages/BackOfficePage.css';
import './components/SetForm.css';
import './pages/SetFormPage.css';
import './pages/ConfiguracionPartidaPage.css';
import './components/tablero/DemoPartidaModal.css';
import './components/tablero/BolsaTesoro.css';
import './components/tablero/AnimacionVictoria.css';
import './components/tablero/MedidorVidas.css';
import './pages/TableroJuegoPage.css';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
