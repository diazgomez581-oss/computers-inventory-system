import React, { useEffect, useState } from 'react';
import { Alert, Box, Grid, Paper, Typography } from '@mui/material';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import PercentIcon from '@mui/icons-material/Percent';
import { API_URL } from '../api';

const base = String(API_URL || '').replace(/\/+$/, '').replace(/\/api$/, '');

function Indicador({ titulo, valor, detalle, icono }) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #E8EDF4', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 1 }}>
        <Typography variant="caption" sx={{ color: '#8290A5', fontWeight: 700 }}>{titulo}</Typography>
        <Box sx={{ color: '#4C67ED' }}>{icono}</Box>
      </Box>
      <Typography variant="h5" sx={{ color: '#24334E', fontWeight: 800, mb: 1 }}>
        {valor}
      </Typography>
      <Typography variant="caption" sx={{ color: '#64748B' }}>{detalle}</Typography>
    </Paper>
  );
}

// Reutilizable tanto dentro del Panel como en la pantalla Razones Financieras.
export default function RatiosDashboard({ anio, mes, revision = 0, mostrarAdvertencias = false }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const controlador = new AbortController();
    async function cargar() {
      setCargando(true);
      setDatos(null);
      setError('');
      try {
        const usuario = JSON.parse(localStorage.getItem('stb_user') || 'null');
        if (!usuario?.token) throw new Error('Inicia sesión para consultar las razones financieras.');
        const respuesta = await fetch(
          `${base}/api/razones-financieras/?anio=${anio}&mes=${mes}`,
          { signal: controlador.signal, headers: { Authorization: `Token ${usuario.token}` } }
        );
        const cuerpo = await respuesta.json().catch(() => null);
        if (!respuesta.ok) throw new Error(cuerpo?.detail || `Error HTTP ${respuesta.status}`);
        if (!controlador.signal.aborted) setDatos(cuerpo);
      } catch (e) {
        if (e.name !== 'AbortError' && !controlador.signal.aborted) setError(e.message);
      } finally {
        if (!controlador.signal.aborted) setCargando(false);
      }
    }
    cargar();
    return () => controlador.abort();
  }, [anio, mes, revision]);

  const razon = datos?.razon_corriente == null ? '—' : `${Number(datos.razon_corriente).toFixed(2)} veces`;
  const margen = datos?.margen_neto == null ? '—' : `${Number(datos.margen_neto).toFixed(2)} %`;

  return (
    <Box sx={{ mb: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Indicador titulo="Razón corriente" valor={cargando ? 'Cargando…' : razon}
            detalle={datos?.pasivo_corriente === '0.00'
              ? 'No calculable: pasivo corriente igual a cero'
              : 'Activo corriente / Pasivo corriente · cierre del mes'}
            icono={<AccountBalanceOutlinedIcon />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Indicador titulo="Margen neto" valor={cargando ? 'Cargando…' : margen}
            detalle="Utilidad neta / Ventas netas × 100 · período seleccionado"
            icono={<PercentIcon />} />
        </Grid>
      </Grid>
      {mostrarAdvertencias && datos?.advertencias?.length > 0 && (
        <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
          Indicadores provisionales: {datos.advertencias.join(' ')}
        </Alert>
      )}
    </Box>
  );
}
