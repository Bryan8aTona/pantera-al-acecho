import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Estado de la partida: vive EXCLUSIVAMENTE en memoria del cliente
// (arquitectura.md, sección 1 y 6). No se persiste en localStorage ni
// en el servidor. Si el navegador se recarga, se pierde por diseño.
const PartidaContext = createContext(null);

export function PartidaProvider({ children }) {
  const [set, setSet] = useState(null);
  // Partida del modo invitado (sin cuenta): al salir vuelve a la
  // portada en vez de a Configuración de partida, que pide sesión.
  const [esInvitado, setEsInvitado] = useState(false);

  const iniciarPartida = useCallback((setCompleto, { invitado = false } = {}) => {
    setSet(setCompleto);
    setEsInvitado(invitado);
  }, []);

  const salirPartida = useCallback(() => {
    setSet(null);
    setEsInvitado(false);
  }, []);

  const hayPartidaActiva = set !== null;

  // Red de seguridad ante recargas/cierres accidentales durante el
  // juego (arquitectura.md, sección 3.4): el navegador pregunta antes
  // de descartar la sesión en memoria.
  useEffect(() => {
    if (!hayPartidaActiva) return undefined;

    function alIntentarSalir(e) {
      e.preventDefault();
      e.returnValue = '';
    }

    window.addEventListener('beforeunload', alIntentarSalir);
    return () => window.removeEventListener('beforeunload', alIntentarSalir);
  }, [hayPartidaActiva]);

  return (
    <PartidaContext.Provider value={{ set, esInvitado, hayPartidaActiva, iniciarPartida, salirPartida }}>
      {children}
    </PartidaContext.Provider>
  );
}

export function usePartida() {
  const ctx = useContext(PartidaContext);
  if (!ctx) throw new Error('usePartida debe usarse dentro de <PartidaProvider>');
  return ctx;
}
