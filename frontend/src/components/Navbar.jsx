import React from 'react';
import { AppBar, Toolbar, Typography, Box, Avatar, IconButton } from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import MenuIcon from '@mui/icons-material/Menu';

export default function Navbar({ titulo, mostrarMenu = false, onMenuClick }) {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: '#FFFFFF',
        color: '#1E293B',
        borderBottom: '1px solid #E2E8F0',
        width: '100%',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, gap: 1, minHeight: { xs: 56, sm: 64 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          {mostrarMenu && (
            <IconButton aria-label="Abrir menú" onClick={onMenuClick} edge="start" size="small">
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              textTransform: 'capitalize',
              fontSize: { xs: '1rem', sm: '1.25rem' },
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {titulo}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexShrink: 0 }}>
          <IconButton size="small" aria-label="Notificaciones" sx={{ backgroundColor: '#F1F5F9' }}>
            <NotificationsNoneIcon fontSize="small" />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#0F4C81', width: 36, height: 36, fontSize: '0.875rem' }}>
              C
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                Crhistian
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Administrador
              </Typography>
            </Box>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}