import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0F4C81',       // Azul institucional STB
      dark: '#082545',
      light: '#2563EB',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0284C7',       // Celeste acento del logo
    },
    background: {
      default: '#F1F5F9',    // Fondo grisáceo suave, agradable y que no cansa la vista
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

export default theme;