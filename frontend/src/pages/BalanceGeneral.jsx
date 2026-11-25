import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Divider,
  Paper, Stack, TextField, Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { API_URL } from '../api';

// ============================================================
// FIN-03 | 2. BALANCE GENERAL
// ============================================================

const formatoUSD = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD',
});
const dinero = (valor) => formatoUSD.format(Number(valor ?? 0));
const base = String(API_URL).replace(/\/+$/, '').replace(/\/api$/, '');
const tarjeta = {
  bgcolor: '#FFFFFF',
  border: '1px solid #E2E9F4',
  borderRadius: 3,
  boxShadow: 'none',
};

function fechaLocalISO() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function Fila({ nombre, valor, destacado = false, color }) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 2, py: destacado ? 1.9 : 1.6, px: destacado ? 2 : 1,
      bgcolor: destacado ? '#F3F6FF' : 'transparent', borderRadius: 2,
    }}>
      <Typography sx={{
        color: destacado ? '#172744' : '#4C5E7A',
        fontWeight: destacado ? 800 : 500,
      }}>
        {nombre}
      </Typography>
      <Typography sx={{
        color: color || '#172744', fontWeight: 800,
        fontSize: destacado ? 20 : 16,
        fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
      }}>
        {dinero(valor)}
      </Typography>
    </Box>
  );
}

function Seccion({ titulo, children }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography sx={{ color: '#172744', fontSize: 16, fontWeight: 900, mb: 1 }}>
        {titulo}
      </Typography>
      {children}
    </Box>
  );
}

export default function BalanceGeneral() {
  const [fecha, setFecha] = useState(fechaLocalISO);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  const cargar = useCallback(async (signal) => {
    setCargando(true);
    setError('');
    try {
      const usuario = JSON.parse(localStorage.getItem('stb_user') || 'null');
      if (!usuario?.token) {
        throw new Error('Tu sesión no está disponible. Inicia sesión nuevamente.');
      }
      const respuesta = await fetch(
        `${base}/api/balance-general/?fecha=${encodeURIComponent(fecha)}`,
        { signal, headers: { Authorization: `Token ${usuario.token}` } }
      );
      const cuerpo = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(
          cuerpo?.detail || `No se pudo consultar el Balance General (HTTP ${respuesta.status}).`
        );
      }
      if (!signal.aborted) setDatos(cuerpo);
    } catch (e) {
      if (e.name !== 'AbortError' && !signal.aborted) {
        setDatos(null);
        setError(e.message || 'No se pudo conectar con el servidor.');
      }
    } finally {
      if (!signal.aborted) setCargando(false);
    }
  }, [fecha]);

  useEffect(() => {
    const controlador = new AbortController();
    cargar(controlador.signal);
    return () => controlador.abort();
  }, [cargar, version]);

  const cuadra = datos?.comprobacion?.cuadra === true;
  const fechaTitulo = datos?.fecha_corte
    ? new Date(`${datos.fecha_corte}T12:00:00`).toLocaleDateString('es-SV', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '';

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ color: '#102C56', fontWeight: 900, mb: 0.5 }}>
        Balance General
      </Typography>
      <Typography sx={{ color: '#7184A5', mb: 3 }}>
        FIN-03 · Situación financiera a una fecha de corte, calculada con los datos registrados.
      </Typography>

      {/* FECHA DE CORTE */}
      <Paper elevation={0} sx={{ ...tarjeta, p: { xs: 2, sm: 2.5 }, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Typography sx={{ color: '#172744', fontSize: 16, fontWeight: 800, whiteSpace: 'nowrap' }}>
            Fecha de corte
          </Typography>
          <TextField
            type="date" size="small" label="Fecha" value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', sm: 190 }, '& .MuiOutlinedInput-root': { borderRadius: '7px' } }}
          />
          <Button variant="outlined" startIcon={<RefreshIcon />}
            disabled={cargando || !fecha}
            onClick={() => setVersion((v) => v + 1)}
            sx={{ height: 40, px: 2.5, minWidth: 175, borderRadius: '9px',
              textTransform: 'none', fontWeight: 700, color: '#3665FF',
              borderColor: '#DCE5FF', whiteSpace: 'nowrap', bgcolor: '#F7F9FF',
              '&:hover': { bgcolor: '#EDF2FF', borderColor: '#9CB5FF' } }}>
            Actualizar datos
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {cargando ? (
        <Box sx={{ py: 8, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={26} />
          <Typography>Consultando Balance General...</Typography>
        </Box>
      ) : datos ? (
        <Paper elevation={0} sx={{ ...tarjeta, p: { xs: 2, sm: 4 } }}>
          <Typography sx={{ fontWeight: 900, fontSize: 20, color: '#172744' }}>
            STB Computers · Balance General
          </Typography>
          <Typography sx={{ color: '#7184A5', mb: 3 }}>
            Al {fechaTitulo}
          </Typography>

          <Seccion titulo="ACTIVO CORRIENTE">
            <Fila nombre="Efectivo y equivalentes" valor={datos.activo?.efectivo} />
            <Fila nombre="Inventarios (costo promedio Kárdex)" valor={datos.activo?.inventarios} />
            <Fila nombre="IVA a favor" valor={datos.activo?.iva_a_favor} />
            <Divider sx={{ my: 1 }} />
            <Fila nombre="TOTAL ACTIVO" valor={datos.activo?.total} destacado />
          </Seccion>

          <Seccion titulo="PASIVO CORRIENTE">
            <Fila nombre="Cuentas por pagar" valor={datos.pasivo?.cuentas_por_pagar} />
            <Fila nombre="Salarios por pagar" valor={datos.pasivo?.salarios_por_pagar} />
            <Fila nombre="IVA neto por pagar" valor={datos.pasivo?.iva_por_pagar} />
            <Divider sx={{ my: 1 }} />
            <Fila nombre="TOTAL PASIVO" valor={datos.pasivo?.total} destacado />
          </Seccion>

          <Seccion titulo="PATRIMONIO">
            <Fila nombre="Capital aportado" valor={datos.patrimonio?.capital} />
            <Fila nombre="Resultados de ejercicios anteriores" valor={datos.patrimonio?.resultados_anteriores} />
            <Fila nombre="Utilidad del ejercicio" valor={datos.patrimonio?.utilidad_ejercicio} />
            <Divider sx={{ my: 1 }} />
            <Fila nombre="TOTAL PATRIMONIO" valor={datos.patrimonio?.total} destacado />
          </Seccion>

          <Divider sx={{ mb: 2 }} />
          <Fila nombre="TOTAL PASIVO + PATRIMONIO"
            valor={Number(datos.pasivo?.total || 0) + Number(datos.patrimonio?.total || 0)}
            destacado />

          <Alert severity={cuadra ? 'success' : 'warning'} sx={{ mt: 3 }}>
            {cuadra
              ? 'La ecuación contable se cumple: Activo = Pasivo + Patrimonio.'
              : `El balance presenta una diferencia de ${dinero(datos.comprobacion?.diferencia)}. Revisa los registros históricos y los saldos iniciales; no se ajustarán automáticamente.`}
          </Alert>

          {Array.isArray(datos.advertencias) && datos.advertencias.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography sx={{ fontWeight: 800, color: '#172744', mb: 1 }}>
                Observaciones contables
              </Typography>
              <Stack spacing={1}>
                {datos.advertencias.map((mensaje, indice) => (
                  <Alert severity="info" key={`${indice}-${mensaje}`}>
                    {mensaje}
                  </Alert>
                ))}
              </Stack>
            </Box>
          )}

          <Typography sx={{ color: '#7184A5', mt: 3, fontSize: 12 }}>
            Reporte generado a partir de los registros del sistema. Las ventas se consideran
            cobradas y las compras pagadas de inmediato, conforme a las reglas actuales.
            Verifica los saldos de apertura antes de utilizar el balance como estado definitivo.
          </Typography>
        </Paper>
      ) : null}
    </Box>
  );
}
