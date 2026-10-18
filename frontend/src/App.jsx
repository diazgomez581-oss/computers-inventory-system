import React, { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import Navbar from './components/Sidebar'; // O components/Navbar.jsx
import Productos from './pages/Productos';
import Dashboard from './pages/Dashboard'; // <-- Importar

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#F6F8FC' }}>
      <CssBaseline />

      {/* Navbar horizontal tipo maqueta */}
      <Navbar currentView={currentView} onSelectView={setCurrentView} />

      {/* Contenido principal */}
      <Box component="main" sx={{ p: { xs: 2.5, md: 4 }, maxWidth: '1440px', margin: '0 auto' }}>
        {/* Dashboard completo */}
        {currentView === 'dashboard' && <Dashboard />}

        {/* Catálogo de Productos */}
        {currentView === 'productos' && <Productos />}

        {/* Módulos subsiguientes */}
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