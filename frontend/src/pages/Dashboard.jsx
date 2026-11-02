
import React, { useEffect, useState } from 'react';
import { API_URL } from '../api';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Button,
} from '@mui/material';

import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';

const METRICAS_URL = `${API_URL}/api/productos/metricas_dashboard/`;
const PRODUCTOS_URL = `${API_URL}/api/productos/`;

const getAuthHeaders = () => {
  try {
    const user = JSON.parse(
      localStorage.getItem('stb_user') || 'null'
    );

    return user?.token
      ? { Authorization: `Token ${user.token}` }
      : {};
  } catch {
    return {};
  }
};

const formatoMoneda = (valor) =>
  Number(valor || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatoNumero = (valor) =>
  Number(valor || 0).toLocaleString('en-US');

const ESTILO_TARJETA = {
  p: 2.5,
  borderRadius: '16px',
  border: '1px solid #E8EDF4',
  backgroundColor: '#FFFFFF',
  boxShadow: '0 5px 18px rgba(22, 44, 78, 0.03)',
  height: '100%',
};

const CATEGORIAS = {
  COMPONENTES: 'Componentes',
  ALMACENAMIENTO: 'Almacenamiento',
  PERIFERICOS: 'Periféricos',
  REDES: 'Redes',
  ACCESORIOS: 'Accesorios',
};

function TarjetaMetrica({
  titulo,
  valor,
  detalle,
  icono,
  pendiente = false,
}) {
  return (
    <Paper elevation={0} sx={ESTILO_TARJETA}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 2,
          gap: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: '#8290A5',
            fontWeight: 700,
            fontSize: '0.78rem',
          }}
        >
          {titulo}
        </Typography>

        <Box sx={{ color: pendiente ? '#94A3B8' : '#4C67ED' }}>
          {icono}
        </Box>
      </Box>

      <Typography
        variant="h5"
        sx={{
          fontWeight: 800,
          color: pendiente ? '#94A3B8' : '#24334E',
          letterSpacing: '-0.03em',
          mb: 1,
        }}
      >
        {pendiente ? '—' : valor}
      </Typography>

      <Typography
        variant="caption"
        sx={{
          color: pendiente ? '#94A3B8' : '#64748B',
          fontWeight: 600,
        }}
      >
        {detalle}
      </Typography>
    </Paper>
  );
}

export default function Dashboard() {
  const [metricas, setMetricas] = useState(null);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarDashboard = async () => {
    setCargando(true);
    setError('');

    try {
      const headers = getAuthHeaders();

      const [respuestaMetricas, respuestaProductos] =
        await Promise.all([
          fetch(METRICAS_URL, { headers }),
          fetch(PRODUCTOS_URL, { headers }),
        ]);

      if (
        respuestaMetricas.status === 401 ||
        respuestaProductos.status === 401
      ) {
        throw new Error(
          'Tu sesión no es válida. Inicia sesión nuevamente.'
        );
      }

      if (!respuestaMetricas.ok || !respuestaProductos.ok) {
        throw new Error(
          'No fue posible recuperar los datos del inventario.'
        );
      }

      const datosMetricas = await respuestaMetricas.json();
      const datosProductos = await respuestaProductos.json();

      const listaProductos = Array.isArray(datosProductos)
        ? datosProductos
        : Array.isArray(datosProductos.results)
          ? datosProductos.results
          : [];

      setMetricas(datosMetricas);
      setProductos(listaProductos);
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
      setError(err.message || 'Error de conexión con el servidor.');
      setMetricas(null);
      setProductos([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  // Solo utilizamos datos reales de inventario.
  // Las métricas financieras simuladas del backend se ignoran.
  const inversion = metricas?.inversion_bodega ?? 0;
  const unidades = metricas?.unidades_stock ?? 0;
  const totalProductos = metricas?.total_productos ?? 0;

  const productosConStock = productos.filter(
    (producto) => Number(producto.stock) > 0
  ).length;

  const productosSinStock = productos.filter(
    (producto) => Number(producto.stock) === 0
  ).length;

  const valorProducto = (producto) =>
    Number(producto.stock || 0) *
    Number(producto.costo_promedio || 0);

  const topProductos = [...productos]
    .sort((a, b) => valorProducto(b) - valorProducto(a))
    .slice(0, 5);

  const valorMaximo = Math.max(
    ...topProductos.map(valorProducto),
    0
  );

  const resumenCategorias = Object.entries(CATEGORIAS).map(
    ([codigo, nombre]) => {
      const filtrados = productos.filter(
        (producto) => producto.categoria === codigo
      );

      return {
        codigo,
        nombre,
        cantidad: filtrados.length,
        unidades: filtrados.reduce(
          (total, producto) =>
            total + Number(producto.stock || 0),
          0
        ),
      };
    }
  );

  const datosDisponibles = !cargando && !error && metricas;

  return (
    <Box>
      {/* ENCABEZADO */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: '#17243B',
              mb: 0.5,
              letterSpacing: '-0.04em',
            }}
          >
            Panel general
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: '#8190A5' }}
          >
            Resumen ejecutivo de STB Computers.
            Indicadores conectados al inventario.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={cargarDashboard}
          disabled={cargando}
          sx={{
            borderColor: '#DCE4F0',
            color: '#4C67ED',
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
          }}
        >
          Actualizar datos
        </Button>
      </Box>

      {/* ESTADOS DE CARGA */}
      {cargando && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography
            variant="caption"
            sx={{ color: '#8190A5', mt: 1, display: 'block' }}
          >
            Consultando información del servidor...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* MÉTRICAS */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <TarjetaMetrica
            titulo="Inversión en Bodega (Costo)"
            valor={
              datosDisponibles
                ? formatoMoneda(inversion)
                : '—'
            }
            detalle={
              datosDisponibles
                ? `${formatoNumero(unidades)} unidades físicas`
                : 'Sin datos disponibles'
            }
            icono={<Inventory2OutlinedIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <TarjetaMetrica
            titulo="Ventas netas (Mes)"
            pendiente
            detalle="Pendiente: módulo de ventas"
            icono={<ShoppingCartOutlinedIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <TarjetaMetrica
            titulo="Utilidad neta"
            pendiente
            detalle="Pendiente: estados financieros"
            icono={<TrendingUpOutlinedIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <TarjetaMetrica
            titulo="Razón corriente"
            pendiente
            detalle="Pendiente: datos de liquidez"
            icono={<AccountBalanceOutlinedIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <TarjetaMetrica
            titulo="Catálogo de Artículos"
            valor={datosDisponibles ? totalProductos : '—'}
            detalle="Productos registrados"
            icono={<CategoryOutlinedIcon />}
          />
        </Grid>
      </Grid>

      {/* AVISO DE INTEGRACIÓN */}
      <Alert
        severity="info"
        sx={{
          mb: 3,
          borderRadius: '12px',
          '& .MuiAlert-message': { width: '100%' },
        }}
      >
        Los indicadores de ventas, utilidad y liquidez se
        habilitarán cuando estén integrados los módulos
        financieros. Los valores del inventario se obtienen
        actualmente de Django.
      </Alert>

      {/* RESUMEN DE INVENTARIO */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{ ...ESTILO_TARJETA, p: 3 }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                color: '#17243B',
                mb: 0.5,
              }}
            >
              Productos por valor en inventario
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: '#8190A5',
                display: 'block',
                mb: 3,
              }}
            >
              Cinco productos con mayor valoración
              según existencias y costo promedio.
            </Typography>

            {!datosDisponibles ? (
              <Typography color="text.secondary">
                {cargando
                  ? 'Cargando productos...'
                  : 'Datos no disponibles.'}
              </Typography>
            ) : topProductos.length === 0 ? (
              <Typography color="text.secondary">
                No hay productos registrados.
              </Typography>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2.5,
                }}
              >
                {topProductos.map((producto) => {
                  const valor = valorProducto(producto);

                  const porcentaje =
                    valorMaximo > 0
                      ? (valor / valorMaximo) * 100
                      : 0;

                  return (
                    <Box key={producto.id}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 2,
                          mb: 1,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: '#24334E',
                            }}
                          >
                            {producto.descripcion}
                          </Typography>

                          <Typography
                            variant="caption"
                            sx={{ color: '#8190A5' }}
                          >
                            {producto.codigo} ·{' '}
                            {producto.stock} unidades
                          </Typography>
                        </Box>

                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 800,
                            color: '#4C67ED',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatoMoneda(valor)}
                        </Typography>
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={porcentaje}
                        sx={{
                          height: 9,
                          borderRadius: 8,
                          bgcolor: '#EEF1FF',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: '#4C67ED',
                            borderRadius: 8,
                          },
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{ ...ESTILO_TARJETA, p: 3 }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                color: '#17243B',
                mb: 0.5,
              }}
            >
              Resumen del catálogo
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: '#8190A5',
                display: 'block',
                mb: 3,
              }}
            >
              Distribución de artículos por categoría.
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: '#EEF1FF',
                    borderRadius: '12px',
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      color: '#4C67ED',
                    }}
                  >
                    {datosDisponibles
                      ? productosConStock
                      : '—'}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{ color: '#64748B' }}
                  >
                    Productos con stock
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: '#FFF6E6',
                    borderRadius: '12px',
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      color: '#B57822',
                    }}
                  >
                    {datosDisponibles
                      ? productosSinStock
                      : '—'}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{ color: '#64748B' }}
                  >
                    Productos sin stock
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell> CATEGORÍA </TableCell>
                    <TableCell align="right">
                      PRODUCTOS
                    </TableCell>
                    <TableCell align="right">
                      UNIDADES
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {datosDisponibles ? (
                    resumenCategorias.map((categoria) => (
                      <TableRow key={categoria.codigo}>
                        <TableCell>
                          {categoria.nombre}
                        </TableCell>
                        <TableCell align="right">
                          {categoria.cantidad}
                        </TableCell>
                        <TableCell align="right">
                          {categoria.unidades}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        Sin datos disponibles
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* VALUACIÓN CONTABLE */}
      <Paper
        elevation={0}
        sx={{ ...ESTILO_TARJETA, p: 3 }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 800,
            color: '#17243B',
            mb: 0.5,
          }}
        >
          Inventario: Valuación a Costo Promedio (WAC)
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color: '#8190A5',
            display: 'block',
            mb: 2,
          }}
        >
          Valuación según existencias y costo promedio
          registrado. La trazabilidad por compras y ventas
          se integrará posteriormente.
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>INDICADOR</TableCell>
                <TableCell align="right">VALOR</TableCell>
                <TableCell align="right">ESTADO</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              <TableRow>
                <TableCell>
                  Valor total del inventario
                </TableCell>
                <TableCell align="right">
                  {datosDisponibles
                    ? formatoMoneda(inversion)
                    : '—'}
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label="Conectado"
                    size="small"
                    sx={{
                      bgcolor: '#EEF1FF',
                      color: '#4C67ED',
                    }}
                  />
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>
                  Unidades disponibles
                </TableCell>
                <TableCell align="right">
                  {datosDisponibles
                    ? formatoNumero(unidades)
                    : '—'}
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label="Conectado"
                    size="small"
                    sx={{
                      bgcolor: '#EEF1FF',
                      color: '#4C67ED',
                    }}
                  />
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>
                  Costo de ventas acumulado
                </TableCell>
                <TableCell align="right">—</TableCell>
                <TableCell align="right">
                  <Chip
                    label="Pendiente"
                    size="small"
                    sx={{
                      bgcolor: '#F1F5F9',
                      color: '#64748B',
                    }}
                  />
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>
                  Rotación de inventarios
                </TableCell>
                <TableCell align="right">—</TableCell>
                <TableCell align="right">
                  <Chip
                    label="Pendiente"
                    size="small"
                    sx={{
                      bgcolor: '#F1F5F9',
                      color: '#64748B',
                    }}
                  />
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>
                  Días promedio de inventario
                </TableCell>
                <TableCell align="right">—</TableCell>
                <TableCell align="right">
                  <Chip
                    label="Pendiente"
                    size="small"
                    sx={{
                      bgcolor: '#F1F5F9',
                      color: '#64748B',
                    }}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
