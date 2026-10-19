import React, { useState } from 'react';
import { API_URL as BASE_URL } from '../api';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  Grid,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ComputerIcon from '@mui/icons-material/Computer';

// Fallback seguro a la URL de Render para evitar llamadas locales
const API_URL = BASE_URL || import.meta.env.VITE_API_URL || 'https://computers-backend-bpk0.onrender.com';

export default function Login({ onLoginSuccess, sessionExpired = '' }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('stb_user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      setErrorMsg('No hay conexión con el servidor backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        background: 'radial-gradient(ellipse at 80% 20%, #2A0845 0%, #0B132B 50%, #050813 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 950,
          width: '100%',
          borderRadius: '24px',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <Grid container sx={{ minHeight: { md: 540 } }}>
          {/* Panel Lateral Izquierdo (Hero con degradados y formas geométricas) */}
          <Grid
            item
            xs={12}
            md={5}
            sx={{
              background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 50%, #0F2A4A 100%)',
              p: { xs: 4, md: 5 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Formas circulares decorativas de fondo */}
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                left: -50,
                width: 190,
                height: 190,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.35), rgba(14, 165, 233, 0.1))',
                filter: 'blur(10px)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 30,
                right: -40,
                width: 220,
                height: 220,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.4), rgba(59, 130, 246, 0.15))',
                transform: 'rotate(-20deg)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 110,
                right: 30,
                width: 75,
                height: 160,
                borderRadius: '40px',
                background: 'linear-gradient(180deg, #0284C7, #0369A1)',
                opacity: 0.75,
                transform: 'rotate(35deg)',
              }}
            />

            {/* Cabecera del panel izquierdo */}
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.2,
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  px: 2,
                  py: 0.8,
                  borderRadius: '12px',
                  backdropFilter: 'blur(8px)',
                  mb: 4,
                }}
              >
                <ComputerIcon sx={{ color: '#38BDF8', fontSize: '1.4rem' }} />
                <Typography sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.95rem', letterSpacing: 0.5 }}>
                  COMPUTERS
                </Typography>
              </Box>

              <Typography
                variant="h4"
                sx={{
                  color: '#FFFFFF',
                  fontWeight: 800,
                  lineHeight: 1.2,
                  mb: 2,
                  letterSpacing: '-0.03em',
                }}
              >
                Bienvenido a <br />
                <Box component="span" sx={{ color: '#38BDF8' }}>
                  Computers
                </Box>
              </Typography>

              <Typography sx={{ color: '#94A3B8', fontSize: '0.92rem', lineHeight: 1.6, maxWidth: 320 }}>
                Control integral de inventario permanente, kardex computarizado y valuación por promedio ponderado.
              </Typography>
            </Box>

            {/* Pie del panel izquierdo */}
            <Box sx={{ position: 'relative', zIndex: 1, mt: 4 }}>
              <Typography sx={{ color: '#64748B', fontSize: '0.78rem' }}>
                Sistema Contable &copy; 2026
              </Typography>
            </Box>
          </Grid>

          {/* Formulario Derecho */}
          <Grid
            item
            xs={12}
            md={7}
            sx={{
              p: { xs: 3.5, sm: 5, md: 6 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ maxWidth: 360, width: '100%', mx: 'auto' }}>
              {/* Logo / Icono */}
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #0284C7, #2563EB)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#FFFFFF',
                  boxShadow: '0 8px 18px rgba(2, 132, 199, 0.35)',
                  mb: 2,
                }}
              >
                <ComputerIcon sx={{ fontSize: '1.6rem' }} />
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5, letterSpacing: '-0.02em' }}>
                Iniciar Sesión
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                Ingresa tus credenciales para acceder al panel
              </Typography>

              {errorMsg && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '0.85rem' }}>
                  {errorMsg}
                </Alert>
              )}
              {sessionExpired && (
                <Alert severity="warning" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '0.85rem' }}>
                  {sessionExpired}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
                <TextField
                  label="Usuario"
                  size="small"
                  fullWidth
                  required
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />

                <TextField
                  label="Contraseña"
                  size="small"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={<LockOutlinedIcon />}
                  sx={{
                    mt: 1,
                    py: 1.3,
                    background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    borderRadius: '12px',
                    boxShadow: '0 6px 20px rgba(2, 132, 199, 0.35)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0369A1 0%, #1D4ED8 100%)',
                    },
                  }}
                >
                  {loading ? 'Accediendo...' : 'Iniciar Sesión'}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}