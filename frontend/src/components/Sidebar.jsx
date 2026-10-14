import React from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';

const DRAWER_WIDTH = 240;

export default function Sidebar({
  vistaActual,
  setVistaActual,
  movil = false,
  abierto = false,
  onCerrar,
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Inicio / Resumen', icon: <DashboardIcon fontSize="small" /> },
    { id: 'productos', label: 'Inventario / Productos', icon: <Inventory2Icon fontSize="small" /> },
    { id: 'kardex', label: 'Tarjeta Kárdex', icon: <SwapHorizIcon fontSize="small" /> },
    { id: 'compras', label: 'Entradas / Compras', icon: <ShoppingCartIcon fontSize="small" /> },
    { id: 'ventas', label: 'Salidas / Ventas', icon: <TrendingUpIcon fontSize="small" /> },
    { id: 'reportes', label: 'Reportes Financieros', icon: <AssessmentIcon fontSize="small" /> },
  ];

  return (
    <Drawer
      variant={movil ? 'temporary' : 'permanent'}
      open={movil ? abierto : true}
      onClose={onCerrar}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: '#082545',
          color: '#FFFFFF',
          borderRight: 'none',
          ...(movil ? {} : { position: 'relative' }),
        },
      }}
    >
      {/* Cabecera estilizada con logo.png y proporciones limpias */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          component="img"
          src="/logo.png"
          alt="STB"
          sx={{
            width: 38,
            height: 38,
            borderRadius: 1.5,
            objectFit: 'contain',
            backgroundColor: '#FFFFFF',
            p: 0.3,
            flexShrink: 0,
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <Box sx={{ overflow: 'hidden' }}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 800,
              letterSpacing: '0.5px',
              fontSize: '0.95rem',
              lineHeight: 1.15,
              whiteSpace: 'nowrap',
            }}
          >
            STB COMPUTERS
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#93C5FD',
              fontSize: '0.72rem',
              display: 'block',
              mt: 0.2,
            }}
          >
            Control de Inventarios
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

      <List sx={{ px: 1, py: 1.5 }}>
        {menuItems.map((item) => {
          const activo = vistaActual === item.id;
          return (
            <ListItemButton
              key={item.id}
              onClick={() => setVistaActual(item.id)}
              sx={{
                mb: 0.6,
                py: 1,
                borderRadius: 2,
                backgroundColor: activo ? '#0F4C81' : 'transparent',
                color: activo ? '#FFFFFF' : '#94A3B8',
                '&:hover': {
                  backgroundColor: activo ? '#0F4C81' : 'rgba(255, 255, 255, 0.06)',
                  color: '#FFFFFF',
                },
              }}
            >
              <ListItemIcon sx={{ color: activo ? '#38BDF8' : '#94A3B8', minWidth: 36 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.84rem',
                  fontWeight: activo ? 600 : 500,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}