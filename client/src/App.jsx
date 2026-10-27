import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { PartidaProvider } from './context/PartidaContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RutaConPartida from './components/RutaConPartida.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';

// Inicio y login van en el bundle principal (son la entrada). El resto
// se descarga al entrar a su ruta; el Tablero, con el JSON de Lottie
// (que dentro de su chunk sigue siendo un import estático), es el más
// pesado. Su CSS se importa en main.jsx para no alterar la cascada.
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
              <Route
                path="/partida"
                element={
                  <ProtectedRoute>
                    <RutaConPartida>
                      <TableroJuegoPage />
                    </RutaConPartida>
                  </ProtectedRoute>
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
