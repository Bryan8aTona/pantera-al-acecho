import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { PartidaProvider } from './context/PartidaContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RutaConPartida from './components/RutaConPartida.jsx';
import LoginPage from './pages/LoginPage.jsx';
import BackOfficePage from './pages/BackOfficePage.jsx';
import ConfiguracionPartidaPage from './pages/ConfiguracionPartidaPage.jsx';
import TableroJuegoPage from './pages/TableroJuegoPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <PartidaProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <BackOfficePage />
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
        </BrowserRouter>
      </PartidaProvider>
    </AuthProvider>
  );
}
