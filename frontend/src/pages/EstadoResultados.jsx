
import React, { useCallback, useEffect, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import RefreshIcon from '@mui/icons-material/Refresh';
import { API_URL } from '../api';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const dinero = (valor) => USD.format(Number(valor || 0));

const base = String(API_URL)
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

const tarjeta = {
  bgcolor: '#fff',
  border: '1px solid #E2E9F4',
  borderRadius: 3,
  boxShadow: 'none',
};

// FILAS DEL ESTADO DE RESULTADOS
function Fila({
  nombre,
  valor,
  destacado = false,
  color,
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        py: destacado ? 2 : 1.7,
        px: destacado ? 2 : 1,
        bgcolor: destacado ? '#F3F6FF' : 'transparent',
        borderRadius: 2,
      }}
    >
      <Typography
        sx={{
          color: destacado ? '#172744' : '#4C5E7A',
          fontWeight: destacado ? 800 : 500,
        }}
      >
        {nombre}
      </Typography>

      <Typography
        sx={{
          color: color || '#172744',
          fontWeight: destacado ? 800 : 700,
          fontSize: destacado ? 20 : 16,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {dinero(valor)}
      </Typography>
    </Box>
  );
}

// COMPONENTE PRINCIPAL
export default function EstadoResultados() {
  const [periodo, setPeriodo] = useState(() => ({
    anio: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
  }));

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  // CONSULTAR DATOS DEL BACKEND
  const cargar = useCallback(async (signal) => {
    setCargando(true);
    setError('');

    try {
      const usuario = JSON.parse(
        localStorage.getItem('stb_user') || 'null'
      );

      if (!usuario?.token) {
        throw new Error(
          'Tu sesión no está disponible. Inicia sesión nuevamente.'
        );
      }

      const url =
        `${base}/api/estado-resultados/` +
        `?anio=${periodo.anio}&mes=${periodo.mes}`;

      const respuesta = await fetch(url, {
        signal,
        headers: {
          Authorization: `Token ${usuario.token}`,
        },
      });

      const cuerpo = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          cuerpo?.detail ||
          `No fue posible consultar el Estado de Resultados (HTTP ${respuesta.status}).`
        );
      }

      if (!signal.aborted) {
        setDatos(cuerpo);
      }
    } catch (e) {
      if (e.name !== 'AbortError' && !signal.aborted) {
        setDatos(null);
        setError(
          e.message || 'No se pudo conectar con el servidor.'
        );
      }
    } finally {
      if (!signal.aborted) {
        setCargando(false);
      }
    }
  }, [periodo.anio, periodo.mes]);

  useEffect(() => {
    const controlador = new AbortController();

    cargar(controlador.signal);

    return () => controlador.abort();
  }, [cargar, version]);

  const utilidadPositiva =
    Number(datos?.utilidad_neta || 0) >= 0;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>

      {/* ENCABEZADO */}
      <Typography
        variant="h4"
        sx={{
          color: '#102C56',
          fontWeight: 900,
          mb: 0.5,
        }}
      >
        Estado de Resultados
      </Typography>

      <Typography
        sx={{
          color: '#7184A5',
          mb: 3,
        }}
      >
        FIN-03 · Resultados del período calculados
        a partir de ventas emitidas y gastos operativos.
      </Typography>

      {/* PERÍODO CONTABLE - DISEÑO MEJORADO */}
      <Paper
        elevation={0}
        sx={{
          ...tarjeta,
          p: { xs: 2, sm: 2.5 },
          mb: 3,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              color: '#172744',
              fontSize: '16px',
              whiteSpace: 'nowrap',
              mr: { md: 1 },
            }}
          >
            Período contable
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            sx={{
              flexWrap: 'wrap',
              rowGap: 2,
              flex: 1,
            }}
          >
            {/* MES */}
            <TextField
              select
              label="Mes"
              size="small"
              value={periodo.mes}
              onChange={(e) =>
                setPeriodo((p) => ({
                  ...p,
                  mes: Number(e.target.value),
                }))
              }
              sx={{
                width: { xs: '100%', sm: 165 },
                flexShrink: 0,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '7px',
                  backgroundColor: '#fff',
                },
              }}
            >
              {MESES.map((mes, index) => (
                <MenuItem key={mes} value={index + 1}>
                  {mes}
                </MenuItem>
              ))}
            </TextField>

            {/* AÑO */}
            <TextField
              label="Año"
              type="number"
              size="small"
              value={periodo.anio}
              onChange={(e) =>
                setPeriodo((p) => ({
                  ...p,
                  anio: e.target.value,
                }))
              }
              onBlur={() =>
                setPeriodo((p) => ({
                  ...p,
                  anio: Math.max(
                    1,
                    Math.min(
                      9999,
                      Number(p.anio) ||
                      new Date().getFullYear()
                    )
                  ),
                }))
              }
              inputProps={{
                min: 1,
                max: 9999,
              }}
              sx={{
                width: { xs: '100%', sm: 115 },
                flexShrink: 0,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '7px',
                  backgroundColor: '#fff',
                },
              }}
            />

            {/* BOTÓN ACTUALIZAR */}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => setVersion((v) => v + 1)}
              disabled={cargando}
              sx={{
                height: 40,
                px: 2.5,
                minWidth: 175,
                borderRadius: '9px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '14px',
                color: '#3665FF',
                borderColor: '#DCE5FF',
                whiteSpace: 'nowrap',
                backgroundColor: '#F7F9FF',
                '&:hover': {
                  backgroundColor: '#EDF2FF',
                  borderColor: '#9CB5FF',
                },
              }}
            >
              Actualizar datos
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* MENSAJES DE ERROR */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* INDICADOR DE CARGA */}
      {cargando ? (
        <Box
          sx={{
            py: 7,
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
            alignItems: 'center',
          }}
        >
          <CircularProgress size={25} />
          <Typography>
            Consultando estado financiero...
          </Typography>
        </Box>
      ) : datos ? (

        /* REPORTE DE ESTADO DE RESULTADOS */
        <Paper
          sx={{
            ...tarjeta,
            p: { xs: 2, md: 4 },
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              color: '#172744',
              fontSize: 20,
            }}
          >
            STB Computers · Estado de Resultados
          </Typography>

          <Typography
            sx={{
              color: '#7184A5',
              mb: 3,
            }}
          >
            {MESES[datos.mes - 1]} de {datos.anio}
            {' · '}
            {datos.cantidad_ventas} venta(s) emitida(s)
          </Typography>

          {/* VENTAS NETAS */}
          <Fila
            nombre="Ventas netas (sin IVA)"
            valor={datos.ventas_netas}
          />

          {/* COSTO DE VENTAS */}
          <Fila
            nombre="(-) Costo de ventas"
            valor={datos.costo_ventas}
          />

          <Divider sx={{ my: 1 }} />

          {/* UTILIDAD BRUTA */}
          <Fila
            nombre="(=) Utilidad bruta"
            valor={datos.utilidad_bruta}
            destacado
          />

          <Box sx={{ my: 2 }} />

          {/* GASTOS OPERATIVOS */}
          <Typography
            sx={{
              color: '#172744',
              fontWeight: 800,
              fontSize: 15,
              mb: 1,
            }}
          >
            Gastos operativos
          </Typography>

          <Fila
            nombre="(-) Gastos de administración"
            valor={datos.gastos_administracion}
          />

          <Fila
            nombre="(-) Gastos de venta"
            valor={datos.gastos_venta}
          />

          <Fila
            nombre="Total gastos operativos"
            valor={datos.gastos_operativos}
          />

          <Divider sx={{ my: 2 }} />

          {/* UTILIDAD NETA */}
          <Fila
            nombre="(=) Utilidad neta del ejercicio"
            valor={datos.utilidad_neta}
            destacado
            color={
              utilidadPositiva
                ? '#087F5B'
                : '#C2413B'
            }
          />

          {/* NOTA DEL REPORTE */}
          <Typography
            sx={{
              mt: 2,
              color: '#7184A5',
              fontSize: 12,
            }}
          >
            Reporte calculado con datos registrados
            en el sistema. No incluye partidas contables
            no contempladas por los módulos actuales.
          </Typography>
        </Paper>
      ) : null}

    </Box>
  );
}
