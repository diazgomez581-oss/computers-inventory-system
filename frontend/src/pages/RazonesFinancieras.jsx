import React, { useState } from 'react';
import { Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import RatiosDashboard from './RatiosDashboard';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function RazonesFinancieras() {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [revision, setRevision] = useState(0);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ color: '#102C56', fontWeight: 900, mb: 0.5 }}>
        Razones Financieras
      </Typography>
      <Typography sx={{ color: '#7184A5', mb: 3 }}>
        FIN-03 · Indicadores de liquidez y rentabilidad calculados a partir de los estados financieros.
      </Typography>
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid #E2E9F4' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Typography sx={{ fontWeight: 800, color: '#172744', whiteSpace: 'nowrap' }}>Período contable</Typography>
          <TextField select size="small" label="Mes" value={mes}
            onChange={e => setMes(Number(e.target.value))} sx={{ width: { xs: '100%', sm: 175 } }}>
            {MESES.map((nombre, i) => <MenuItem key={nombre} value={i + 1}>{nombre}</MenuItem>)}
          </TextField>
          <TextField size="small" type="number" label="Año" value={anio}
            onChange={e => setAnio(Number(e.target.value))}
            inputProps={{ min: 1, max: 9999 }} sx={{ width: { xs: '100%', sm: 120 } }} />
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => setRevision(x => x + 1)}
            sx={{ textTransform: 'none', minHeight: 40, whiteSpace: 'nowrap', fontWeight: 700, borderRadius: 2 }}>
            Actualizar datos
          </Button>
        </Stack>
      </Paper>
      <RatiosDashboard anio={anio} mes={mes} revision={revision} mostrarAdvertencias />
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E9F4' }}>
        <Typography sx={{ fontWeight: 800, color: '#172744', mb: 1 }}>Interpretación de los indicadores</Typography>
        <Typography sx={{ color: '#4C5E7A', mb: 1 }}>
          Razón corriente = Activo corriente / Pasivo corriente. Si no hay pasivos corrientes, se muestra «—» en lugar de dividir entre cero.
        </Typography>
        <Typography sx={{ color: '#4C5E7A' }}>
          Margen neto = (Utilidad neta del período / Ventas netas del período) × 100.
          Si no hubo ventas netas, se muestra «—».
        </Typography>
      </Paper>
    </Box>
  );
}
