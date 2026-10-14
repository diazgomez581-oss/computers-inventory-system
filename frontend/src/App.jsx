import React, { useState } from 'react';
import { ThemeProvider, Box, CssBaseline, useMediaQuery } from '@mui/material';
import theme from './theme.js';
import Sidebar from './components/Sidebar.jsx';
import Navbar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
  const [vistaActual, setVistaActual] = useState('dashboard');
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const esMovil = useMediaQuery(theme.breakpoints.down('md'));

  const cambiarVista = (vista) => {
    setVistaActual(vista);
    setMenuMovilAbierto(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh', bgcolor: 'background.default' }}>
        <Sidebar
          vistaActual={vistaActual}
          setVistaActual={cambiarVista}
          movil={esMovil}
          abierto={menuMovilAbierto}
          onCerrar={() => setMenuMovilAbierto(false)}
        />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: 0,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Navbar
            titulo={vistaActual}
            mostrarMenu={esMovil}
            onMenuClick={() => setMenuMovilAbierto(true)}
          />
          <Box sx={{ flexGrow: 1 }}>
            {vistaActual === 'dashboard' && <Dashboard />}
            {vistaActual !== 'dashboard' && (
              <Box sx={{ p: 3, color: '#64748B' }}>
                Módulo <strong>{vistaActual}</strong> en desarrollo.
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}