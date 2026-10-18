import React, { useCallback, useEffect, useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import Navbar from './components/Sidebar';
import Productos from './pages/Productos';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000;
const INACTIVITY_MESSAGE = 'Tu sesión ha expirado por 15 minutos de inactividad.';

function getInitialAuthState() {
  try {
    const savedUser = localStorage.getItem('stb_user');
    const user = savedUser ? JSON.parse(savedUser) : null;
    if (!user?.token) return { user: null, expired: false };

    const lastActivity = Number(localStorage.getItem('stb_last_activity'));
    const now = Date.now();
    if (
      !Number.isFinite(lastActivity)
      || lastActivity <= 0
      || lastActivity > now
      || now - lastActivity >= INACTIVITY_TIMEOUT
    ) {
      return { user: null, expired: true };
    }

    return { user, expired: false };
  } catch (error) {
    console.error('No se pudo restaurar la sesión guardada:', error);
    return { user: null, expired: false };
  }
}

function App() {
  const [authState, setAuthState] = useState(getInitialAuthState);
  const { user, expired } = authState;

  const [currentView, setCurrentView] = useState('dashboard');

  const handleLogout = useCallback((sessionExpired = false) => {
    localStorage.removeItem('stb_user');
    localStorage.removeItem('stb_last_activity');
    setAuthState({ user: null, expired: sessionExpired });
  }, []);

  useEffect(() => {
    if (!user) {
      localStorage.removeItem('stb_user');
      localStorage.removeItem('stb_last_activity');
      return undefined;
    }

    let timeoutId;
    const scheduleLogout = () => {
      window.clearTimeout(timeoutId);
      const lastActivity = Number(localStorage.getItem('stb_last_activity'));
      const remainingTime = INACTIVITY_TIMEOUT - (Date.now() - lastActivity);
      timeoutId = window.setTimeout(() => {
        const latestActivity = Number(localStorage.getItem('stb_last_activity'));
        if (Date.now() - latestActivity >= INACTIVITY_TIMEOUT) {
          handleLogout(true);
        } else {
          scheduleLogout();
        }
      }, Math.max(remainingTime, 0));
    };
    const updateActivity = () => {
      const lastActivity = Number(localStorage.getItem('stb_last_activity'));
      if (Date.now() - lastActivity >= INACTIVITY_TIMEOUT) {
        handleLogout(true);
        return;
      }
      localStorage.setItem('stb_last_activity', String(Date.now()));
      scheduleLogout();
    };
    const checkInactivity = () => {
      const lastActivity = Number(localStorage.getItem('stb_last_activity'));
      if (Date.now() - lastActivity >= INACTIVITY_TIMEOUT) {
        handleLogout(true);
      } else {
        scheduleLogout();
      }
    };
    const syncActivityAcrossTabs = (event) => {
      if (event.key === 'stb_last_activity') checkInactivity();
    };

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll'];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, updateActivity));
    document.addEventListener('visibilitychange', checkInactivity);
    window.addEventListener('storage', syncActivityAcrossTabs);
    scheduleLogout();

    return () => {
      window.clearTimeout(timeoutId);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, updateActivity));
      document.removeEventListener('visibilitychange', checkInactivity);
      window.removeEventListener('storage', syncActivityAcrossTabs);
    };
  }, [user, handleLogout]);

  const handleLoginSuccess = (userData) => {
    localStorage.setItem('stb_last_activity', String(Date.now()));
    setAuthState({ user: userData, expired: false });
  };

  // Si no está autenticado, solo muestra el Login
  if (!user) {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        sessionExpired={expired ? INACTIVITY_MESSAGE : ''}
      />
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#F6F8FC' }}>
      <CssBaseline />

      {/* Navbar con botón de logout */}
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        onLogout={handleLogout}
        user={user}
      />

      {/* Vistas protegidas */}
      <Box component="main" sx={{ p: { xs: 2.5, md: 4 }, maxWidth: '1440px', margin: '0 auto' }}>
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'productos' && <Productos />}

        {/* Vistas siguientes */}
        {currentView === 'kardex' && <h2>Tarjeta Kárdex a Costo Promedio (INV-02)</h2>}
        {currentView === 'compras' && <h2>Recepción de Compras (COMP-02)</h2>}
        {currentView === 'proveedores' && <h2>Directorio de Proveedores (COMP-01)</h2>}
        {currentView === 'ventas' && <h2>Facturación y Ventas (VENT-01)</h2>}
        {currentView === 'gastos' && <h2>Gastos de Operación (FIN-02)</h2>}
        {currentView === 'estado_resultados' && <h2>Estado de Resultados (FIN-03)</h2>}
        {currentView === 'balance_general' && <h2>Balance General (FIN-03)</h2>}
        {currentView === 'ratios' && <h2>Razones Financieras (FIN-03)</h2>}
      </Box>
    </Box>
  );
}

export default App;