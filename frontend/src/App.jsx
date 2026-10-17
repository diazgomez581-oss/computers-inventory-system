import React, { useState } from 'react';
import { Box, CssBaseline, Typography, Paper } from '@mui/material';
import Productos from './pages/Productos';
import Navbar from './components/Sidebar'; // Si mantuviste el archivo como Sidebar.jsx

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#F6F8FC' }}>
      <CssBaseline />

      {/* Barra de navegación superior idéntica a la plantilla */}
      <Navbar currentView={currentView} onSelectView={setCurrentView} />

      {/* Contenedor central de contenido */}
      <Box component="main" sx={{ p: { xs: 2.5, md: 4 }, maxWidth: '1440px', margin: '0 auto' }}>
        {currentView === 'dashboard' && (
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#17243B', mb: 0.5 }}>
              Panel general
            </Typography>
            <Typography variant="body2" sx={{ color: '#8190A5', mb: 3 }}>
              Resumen de STB Computers, calculado con los datos que registre en cada pantalla.
            </Typography>

            <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #E8EDF4' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#17243B' }}>
                Vista previa del Dashboard activo
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Vista del Catálogo de Productos (INV-01) */}
        {currentView === 'productos' && <Productos />}

        {/* Vistas pendientes */}
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