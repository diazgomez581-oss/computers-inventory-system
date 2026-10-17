import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Avatar,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';

export default function Navbar({ currentView, onSelectView }) {
  // Estados para los menús desplegables superiores
  const [anchorInv, setAnchorInv] = useState(null);
  const [anchorFin, setAnchorFin] = useState(null);
  const [anchorUser, setAnchorUser] = useState(null);

  const isInvActive = ['productos', 'kardex'].includes(currentView);
  const isFinActive = ['gastos', 'estado_resultados', 'balance_general', 'ratios'].includes(currentView);

  const btnStyle = (isActive) => ({
    textTransform: 'none',
    fontSize: '0.85rem',
    fontWeight: isActive ? 700 : 500,
    color: isActive ? '#FFFFFF' : '#A0AEC0',
    backgroundColor: isActive ? '#3B82F6' : 'transparent',
    borderRadius: '8px',
    px: 1.6,
    py: 0.7,
    minHeight: '36px',
    '&:hover': {
      backgroundColor: isActive ? '#2563EB' : 'rgba(255, 255, 255, 0.08)',
      color: '#FFFFFF',
    },
  });

  return (
    <Box
      component="header"
      sx={{
        backgroundColor: '#101B31',
        borderBottom: '1px solid #28334A',
        px: { xs: 2, md: 4 },
        py: 1.2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* 1. Logo / Identidad */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 3 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #60A5FA, #3B82F6)',
            display: 'grid',
            placeItems: 'center',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '1.05rem',
            boxShadow: '0 4px 10px rgba(59, 130, 246, 0.35)',
          }}
        >
          S
        </Box>
        <Box>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, fontSize: '0.95rem' }}
          >
            STB Computers
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: '#718096', fontSize: '0.65rem', letterSpacing: 0.8, fontWeight: 700 }}
          >
            PANEL DE ADMINISTRACIÓN
          </Typography>
        </Box>
      </Box>

      {/* 2. Pestañas / Enlaces de navegación horizontal */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexGrow: 1, flexWrap: 'wrap' }}>
        {/* Panel General */}
        <Button
          sx={btnStyle(currentView === 'dashboard')}
          onClick={() => onSelectView('dashboard')}
        >
          ▦ Panel
        </Button>

        {/* Desplegable: Inventario */}
        <Button
          sx={btnStyle(isInvActive)}
          endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 16 }} />}
          onClick={(e) => setAnchorInv(e.currentTarget)}
        >
          ▧ Inventario
        </Button>
        <Menu
          anchorEl={anchorInv}
          open={Boolean(anchorInv)}
          onClose={() => setAnchorInv(null)}
          PaperProps={{
            sx: {
              backgroundColor: '#182742',
              color: '#E2E8F0',
              border: '1px solid #344563',
              borderRadius: '10px',
              mt: 1,
              '& .MuiMenuItem-root': {
                fontSize: '0.825rem',
                py: 1,
                px: 2,
                '&:hover': { backgroundColor: '#24375A' },
              },
            },
          }}
        >
          <MenuItem
            onClick={() => {
              onSelectView('productos');
              setAnchorInv(null);
            }}
          >
            • Catálogo de Productos
          </MenuItem>
          <MenuItem
            onClick={() => {
              onSelectView('kardex');
              setAnchorInv(null);
            }}
          >
            • Tarjeta Kárdex (Costo Promedio)
          </MenuItem>
        </Menu>

        {/* Compras */}
        <Button
          sx={btnStyle(currentView === 'compras')}
          onClick={() => onSelectView('compras')}
        >
          🛒 Compras
        </Button>

        {/* Proveedores */}
        <Button
          sx={btnStyle(currentView === 'proveedores')}
          onClick={() => onSelectView('proveedores')}
        >
          🏢 Proveedores
        </Button>

        {/* Ventas */}
        <Button
          sx={btnStyle(currentView === 'ventas')}
          onClick={() => onSelectView('ventas')}
        >
          🧾 Ventas
        </Button>

        {/* Desplegable: Estados Financieros */}
        <Button
          sx={btnStyle(isFinActive)}
          endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 16 }} />}
          onClick={(e) => setAnchorFin(e.currentTarget)}
        >
          ▤ Estados financieros
        </Button>
        <Menu
          anchorEl={anchorFin}
          open={Boolean(anchorFin)}
          onClose={() => setAnchorFin(null)}
          PaperProps={{
            sx: {
              backgroundColor: '#182742',
              color: '#E2E8F0',
              border: '1px solid #344563',
              borderRadius: '10px',
              mt: 1,
              '& .MuiMenuItem-root': {
                fontSize: '0.825rem',
                py: 1,
                px: 2,
                '&:hover': { backgroundColor: '#24375A' },
              },
            },
          }}
        >
          <MenuItem
            onClick={() => {
              onSelectView('gastos');
              setAnchorFin(null);
            }}
          >
            • Gastos de Operación
          </MenuItem>
          <MenuItem
            onClick={() => {
              onSelectView('estado_resultados');
              setAnchorFin(null);
            }}
          >
            • Estado de Resultados
          </MenuItem>
          <MenuItem
            onClick={() => {
              onSelectView('balance_general');
              setAnchorFin(null);
            }}
          >
            • Balance General
          </MenuItem>
          <MenuItem
            onClick={() => {
              onSelectView('ratios');
              setAnchorFin(null);
            }}
          >
            • Razones Financieras
          </MenuItem>
        </Menu>
      </Box>

      {/* 3. Tarjeta de Usuario (Extremo derecho, idéntica a la maqueta) */}
      <Box
        onClick={(e) => setAnchorUser(e.currentTarget)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.2,
          backgroundColor: '#1B2943',
          border: '1px solid #35435D',
          borderRadius: '10px',
          px: 1.5,
          py: 0.5,
          cursor: 'pointer',
          '&:hover': { backgroundColor: '#233557' },
        }}
      >
        <Avatar
          sx={{
            width: 28,
            height: 28,
            bgcolor: '#3B82F6',
            fontSize: '0.75rem',
            fontWeight: 800,
            borderRadius: '7px',
          }}
        >
          A
        </Avatar>
        <Box sx={{ textAlign: 'left', display: { xs: 'none', sm: 'block' } }}>
          <Typography variant="body2" sx={{ color: '#F1F5F9', fontWeight: 700, fontSize: '0.75rem', lineHeight: 1.1 }}>
            Administrador STB
          </Typography>
          <Typography variant="caption" sx={{ color: '#718096', fontSize: '0.65rem' }}>
            Administrador
          </Typography>
        </Box>
        <KeyboardArrowDownIcon sx={{ color: '#718096', fontSize: 16 }} />
      </Box>

      <Menu
        anchorEl={anchorUser}
        open={Boolean(anchorUser)}
        onClose={() => setAnchorUser(null)}
        PaperProps={{
          sx: {
            backgroundColor: '#182742',
            color: '#E2E8F0',
            border: '1px solid #344563',
            borderRadius: '10px',
            mt: 1,
            '& .MuiMenuItem-root': {
              fontSize: '0.8rem',
              py: 0.8,
              '&:hover': { backgroundColor: '#24375A' },
            },
          },
        }}
      >
        <MenuItem onClick={() => setAnchorUser(null)}>
          <LogoutOutlinedIcon fontSize="small" sx={{ mr: 1, color: '#EF4444' }} />
          Cerrar sesión
        </MenuItem>
      </Menu>
    </Box>
  );
}