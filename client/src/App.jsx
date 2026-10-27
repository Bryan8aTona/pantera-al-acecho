import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { PartidaProvider } from './context/PartidaContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RutaConPartida from './components/RutaConPartida.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';

// Inicio y login van en el bundle principal (son la entrada). El resto
// se descarga al entrar a su ruta. Su CSS se importa en main.jsx para no
// alterar la cascada.
const BackOfficePage = lazy(() => import('./pages/BackOfficePage.jsx'));
const SetFormPage = lazy(() => import('./pages/SetFormPage.jsx'));
const ConfiguracionPartidaPage = lazy(() => import('./pages/ConfiguracionPartidaPage.jsx'));
const TableroJuegoPage = lazy(() => import('./pages/TableroJuegoPage.jsx'));

export default function App() {
  return (
    <AuthProvider>
      <PartidaProvider>
        <BrowserRouter>
          {/* Sin indicador: el chunk llega en un instante y un "Cargando…"
              solo parpadearía (mismo criterio que ProtectedRoute). */}
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/panel"
                element={
                  <ProtectedRoute>
                    <BackOfficePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sets/nuevo"
                element={
                  <ProtectedRoute>
                    <SetFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sets/:id/editar"
                element={
                  <ProtectedRoute>
                    <SetFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracion-partida"
                element={
                  <ProtectedRoute>
                    <ConfiguracionPartidaPage />
                  </ProtectedRoute>
                }
              />
              {/* Sin ProtectedRoute: el modo invitado juega sin cuenta. Basta
                  con que haya una partida en memoria, y solo se arranca desde
                  Configuración (con sesión) o "Probar sin cuenta". El Tablero
                  no lee ni escribe en Firestore. */}
              <Route
                path="/partida"
                element={
                  <RutaConPartida>
                    <TableroJuegoPage />
                  </RutaConPartida>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </PartidaProvider>
    </AuthProvider>
  );
}
