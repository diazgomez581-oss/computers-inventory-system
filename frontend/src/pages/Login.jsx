import React, { useState } from 'react';
import { API_URL } from '../api';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

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
     //const response = await fetch('http://127.0.0.1:8000/api/login/', 
      const response = await fetch(`${API_URL}/api/login/`,{
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
        backgroundColor: '#0B132B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 400,
          width: '100%',
          p: { xs: 3, sm: 4.5 },
          borderRadius: '20px',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #60A5FA, #3B82F6)',
            display: 'grid',
            placeItems: 'center',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '1.4rem',
            margin: '0 auto 16px auto',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
          }}
        >
          S
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 800, color: '#17243B', mb: 0.5 }}>
          STB Computers
        </Typography>
        <Typography variant="body2" sx={{ color: '#8190A5', mb: 3 }}>
          Sistema Integral de Contabilidad
        </Typography>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px', fontSize: '0.85rem' }}>
            {errorMsg}
          </Alert>
        )}
        {sessionExpired && (
          <Alert severity="warning" sx={{ mb: 2.5, borderRadius: '8px', fontSize: '0.85rem' }}>
            {sessionExpired}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Usuario"
            size="small"
            fullWidth
            required
            value={credentials.username}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
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
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={<LockOutlinedIcon />}
            sx={{
              mt: 1,
              py: 1.2,
              backgroundColor: '#4C67ED',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '10px',
              '&:hover': { backgroundColor: '#3F55D7' },
            }}
          >
            {loading ? 'Accediendo...' : 'Iniciar Sesión'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}