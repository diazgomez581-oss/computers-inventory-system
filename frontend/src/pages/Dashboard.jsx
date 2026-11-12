
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
  TextField,
  MenuItem,
  LinearProgress,
  Button,
} from '@mui/material';

import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';

// ============================================
// CONFIGURACIÓN DE API
// ============================================

const BASE_API = String(API_URL || '')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

const URLS = {
  metricas: `${BASE_API}/api/productos/metricas_dashboard/`,
  productos: `${BASE_API}/api/productos/`,
  ventas: `${BASE_API}/api/ventas/resumen/`,
  gastos: `${BASE_API}/api/gastos/resumen-mensual/`,
};

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril',
  'Mayo', 'Junio', 'Julio', 'Agosto',
  'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const CATEGORIAS = {
  COMPONENTES: 'Componentes',
  ALMACENAMIENTO: 'Almacenamiento',
  PERIFERICOS: 'Periféricos',
  REDES: 'Redes',
  ACCESORIOS: 'Accesorios',
};

// ============================================
// ESTILOS
// ============================================

const COLORES = {
  titulo: '#17243B',
  texto: '#24334E',
  secundario: '#8190A5',
  principal: '#4C67ED',
  borde: '#E8EDF4',
};

const ESTILO_TARJETA = {
  p: 2.5,
  borderRadius: '16px',
  border: `1px solid ${COLORES.borde}`,
  backgroundColor: '#FFFFFF',
  boxShadow: '0 5px 18px rgba(22, 44, 78, 0.03)',
  height: '100%',
};

const ESTILO_TITULO = {
  fontWeight: 800,
  color: COLORES.titulo,
  mb: 0.5,
};

const ESTILO_DESCRIPCION = {
  color: COLORES.secundario,
  display: 'block',
  mb: 3,
};

const ESTILO_TABLA = {
  '& .MuiTableCell-head': {
    fontWeight: 800,
    color: '#64748B',
    fontSize: '0.72rem',
    backgroundColor: '#F8FAFC',
  },
  '& .MuiTableCell-body': {
    color: COLORES.texto,
    borderColor: '#EEF2F7',
  },
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function getAuthHeaders() {
  try {
    const usuario = JSON.parse(
      localStorage.getItem('stb_user') || 'null'
    );

    return usuario?.token
      ? { Authorization: `Token ${usuario.token}` }
      : {};
  } catch {
    return {};
  }
}

function formatoMoneda(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) return '—';

  return numero.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatoNumero(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) return '—';

  return numero.toLocaleString('en-US');
}

function valorProducto(producto) {
  return (
    Number(producto.stock || 0) *
    Number(producto.costo_promedio || 0)
  );
}

async function consultarAPI(url, nombre, signal) {
  const respuesta = await fetch(url, {
    headers: getAuthHeaders(),
    signal,
  });

  if (respuesta.status === 401 || respuesta.status === 403) {
    throw new Error(
      `${nombre}: tu sesión no tiene autorización. Inicia sesión nuevamente.`
    );
  }

  if (!respuesta.ok) {
    throw new Error(
      `${nombre}: no fue posible obtener la información (HTTP ${respuesta.status}).`
    );
  }

  return respuesta.json();
}

// ============================================
// COMPONENTE: TARJETA DE MÉTRICA
// ============================================

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

        <Box
          sx={{
            color: pendiente
              ? '#94A3B8'
              : COLORES.principal,
          }}
        >
          {icono}
        </Box>
      </Box>

      <Typography
        variant="h5"
        sx={{
          fontWeight: 800,
          color: pendiente ? '#94A3B8' : COLORES.texto,
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

// ============================================
// COMPONENTE: ESTADO DE CONEXIÓN
// ============================================

function EstadoIndicador({ disponible, pendiente = false }) {
  const texto = pendiente
    ? 'Pendiente'
    : disponible
      ? 'Conectado'
      : 'Sin datos';

  return (
    <Chip
      label={texto}
      size="small"
      sx={{
        bgcolor: pendiente
          ? '#F1F5F9'
          : disponible
            ? '#EEF1FF'
            : '#FFF6E6',
        color: pendiente
          ? '#64748B'
          : disponible
            ? COLORES.principal
            : '#B57822',
        fontWeight: 700,
      }}
    />
  );
}

// ============================================
// COMPONENTE: FILA DE INDICADOR
// ============================================

function FilaIndicador({
  nombre,
  valor,
  disponible,
  pendiente = false,
}) {
  return (
    <TableRow>
      <TableCell>{nombre}</TableCell>

      <TableCell align="right">
        {disponible && !pendiente ? valor : '—'}
      </TableCell>

      <TableCell align="right">
        <EstadoIndicador
          disponible={disponible}
          pendiente={pendiente}
        />
      </TableCell>
    </TableRow>
  );
}

// ============================================
// DASHBOARD PRINCIPAL
// ============================================

export default function Dashboard() {
  const hoy = new Date();

  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);

  const [metricas, setMetricas] = useState(null);
  const [productos, setProductos] = useState(null);
  const [ventas, setVentas] = useState(null);
  const [gastos, setGastos] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [errores, setErrores] = useState([]);
  const [revision, setRevision] = useState(0);

  // ==========================================
  // CONSULTAR INFORMACIÓN REAL DE DJANGO
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();
    let activo = true;

    async function cargarDashboard() {
      setCargando(true);
      setErrores([]);

      setMetricas(null);
      setProductos(null);
      setVentas(null);
      setGastos(null);

      const periodo = `anio=${anio}&mes=${mes}`;

      const solicitudes = [
        consultarAPI(
          URLS.metricas,
          'Inventario',
          controller.signal
        ),
        consultarAPI(
          URLS.productos,
          'Productos',
          controller.signal
        ),
        consultarAPI(
          `${URLS.ventas}?${periodo}`,
          'Ventas',
          controller.signal
        ),
        consultarAPI(
          `${URLS.gastos}?${periodo}`,
          'Gastos',
          controller.signal
        ),
      ];

      try {
        const resultados = await Promise.allSettled(
          solicitudes
        );

        if (!activo) return;

        const mensajes = [];

        resultados.forEach((resultado, indice) => {
          if (resultado.status === 'rejected') {
            if (resultado.reason?.name !== 'AbortError') {
              mensajes.push(
                resultado.reason?.message ||
                'Error de conexión con el servidor.'
              );
            }
            return;
          }

          const datos = resultado.value;

          if (indice === 0) {
            setMetricas(datos);
          }

          if (indice === 1) {
            if (Array.isArray(datos)) {
              setProductos(datos);
            } else if (Array.isArray(datos?.results)) {
              setProductos(datos.results);
            } else {
              mensajes.push(
                'Productos: formato de respuesta no reconocido.'
              );
            }
          }

          if (indice === 2) {
            setVentas(datos);
          }

          if (indice === 3) {
            setGastos(datos);
          }
        });

        setErrores(mensajes);
      } catch (error) {
        if (activo && error.name !== 'AbortError') {
          setErrores([
            error.message || 'Error al cargar el Dashboard.',
          ]);
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarDashboard();

    return () => {
      activo = false;
      controller.abort();
    };
  }, [anio, mes, revision]);

  // ==========================================
  // DISPONIBILIDAD DE INFORMACIÓN
  // ==========================================

  const inventarioDisponible = metricas !== null;
  const productosDisponibles = productos !== null;
  const ventasDisponibles = ventas !== null;
  const gastosDisponibles = gastos !== null;

  const finanzasDisponibles =
    ventasDisponibles && gastosDisponibles;

  // ==========================================
  // INDICADORES DE INVENTARIO
  // ==========================================

  const inversion = metricas?.inversion_bodega ?? 0;
  const unidades = metricas?.unidades_stock ?? 0;
  const totalProductos = metricas?.total_productos ?? 0;

  // ==========================================
  // INDICADORES DE VENTAS
  // ==========================================

  const ventasNetas = Number(
    ventas?.ventas_netas ?? 0
  );

  const costoVentas = Number(
    ventas?.costo_ventas ?? 0
  );

  const ivaDebito = Number(
    ventas?.iva_debito ?? 0
  );

  const totalCobrado = Number(
    ventas?.total_cobrado ?? 0
  );

  const cantidadVentas = Number(
    ventas?.cantidad_ventas ?? 0
  );

  const utilidadBruta =
    ventasNetas - costoVentas;

  // ==========================================
  // INDICADORES DE GASTOS
  // ==========================================

  const gastosAdministracion = Number(
    gastos?.total_administracion ?? 0
  );

  const gastosVenta = Number(
    gastos?.total_venta ?? 0
  );

  const totalGastos = Number(
    gastos?.total_gastos ?? 0
  );

  const cantidadGastos = Number(
    gastos?.cantidad_registros ?? 0
  );

  // ==========================================
  // UTILIDAD OPERATIVA REAL
  // ==========================================

  const utilidadOperativa =
    utilidadBruta - totalGastos;

  // ==========================================
  // RESUMEN DEL CATÁLOGO
  // ==========================================

  const listaProductos = productos ?? [];

  const productosConStock = listaProductos.filter(
    (producto) => Number(producto.stock) > 0
  ).length;

  const productosSinStock = listaProductos.filter(
    (producto) => Number(producto.stock) <= 0
  ).length;

  const topProductos = [...listaProductos]
    .sort((a, b) => valorProducto(b) - valorProducto(a))
    .slice(0, 5);

  const valorMaximo = Math.max(
    0,
    ...topProductos.map(valorProducto)
  );

  const resumenCategorias = Object.entries(
    CATEGORIAS
  ).map(([codigo, nombre]) => {
    const filtrados = listaProductos.filter(
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
  });

  const actualizarDatos = () => {
    setRevision((valor) => valor + 1);
  };

  const periodoTexto = `${MESES[mes - 1]} ${anio}`;

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <Box>
      {/* ======================================
          ENCABEZADO
      ====================================== */}

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
              color: COLORES.titulo,
              mb: 0.5,
              letterSpacing: '-0.04em',
            }}
          >
            Panel general
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: COLORES.secundario }}
          >
            Resumen ejecutivo de STB Computers.
            Indicadores reales de inventario,
            ventas y gastos operativos.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <TextField
            select
            size="small"
            label="Mes"
            value={mes}
            onChange={(evento) =>
              setMes(Number(evento.target.value))
            }
            sx={{ minWidth: 145 }}
          >
            {MESES.map((nombre, indice) => (
              <MenuItem
                key={nombre}
                value={indice + 1}
              >
                {nombre}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            size="small"
            label="Año"
            type="number"
            value={anio}
            onChange={(evento) => {
              const valor = Number(evento.target.value);

              if (valor >= 2000 && valor <= 9999) {
                setAnio(valor);
              }
            }}
            inputProps={{
              min: 2000,
              max: 9999,
            }}
            sx={{ width: 110 }}
          />

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={actualizarDatos}
            disabled={cargando}
            sx={{
              borderColor: '#DCE4F0',
              color: COLORES.principal,
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              minHeight: 40,
            }}
          >
            Actualizar datos
          </Button>
        </Box>
      </Box>

      {/* ======================================
          ESTADOS DE CARGA Y ERRORES
      ====================================== */}

      {cargando && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />

          <Typography
            variant="caption"
            sx={{
              color: COLORES.secundario,
              mt: 1,
              display: 'block',
            }}
          >
            Consultando información del servidor...
          </Typography>
        </Box>
      )}

      {errores.map((mensaje, indice) => (
        <Alert
          key={`${indice}-${mensaje}`}
          severity="error"
          sx={{ mb: 2, borderRadius: '12px' }}
        >
          {mensaje}
        </Alert>
      ))}

      {/* ======================================
          TARJETAS PRINCIPALES
      ====================================== */}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <TarjetaMetrica
            titulo="Inversión en Bodega (Costo)"
            valor={
              inventarioDisponible
                ? formatoMoneda(inversion)
                : '—'
            }
            detalle={
              inventarioDisponible
                ? `${formatoNumero(unidades)} unidades físicas`
                : 'Información no disponible'
            }
            icono={<Inventory2OutlinedIcon />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <TarjetaMetrica
            titulo="Ventas netas (Mes)"
            valor={
              ventasDisponibles
                ? formatoMoneda(ventasNetas)
                : '—'
            }
            detalle={
              ventasDisponibles
                ? `${formatoNumero(cantidadVentas)} ventas emitidas`
                : 'Información no disponible'
            }
            icono={<ShoppingCartOutlinedIcon />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <TarjetaMetrica
            titulo="Utilidad operativa"
            valor={
              finanzasDisponibles
                ? formatoMoneda(utilidadOperativa)
                : '—'
            }
            detalle={
              finanzasDisponibles
                ? 'Ventas netas - costo - gastos'
                : 'Requiere ventas y gastos'
            }
            icono={<TrendingUpOutlinedIcon />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <TarjetaMetrica
            titulo="Razón corriente"
            pendiente
            detalle="Pendiente: activos y pasivos corrientes"
            icono={<AccountBalanceOutlinedIcon />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <TarjetaMetrica
            titulo="Catálogo de Artículos"
            valor={
              inventarioDisponible
                ? formatoNumero(totalProductos)
                : '—'
            }
            detalle="Productos registrados"
            icono={<CategoryOutlinedIcon />}
          />
        </Grid>
      </Grid>

      {/* ======================================
          INFORMACIÓN DEL PERÍODO
      ====================================== */}

      <Alert
        severity="info"
        sx={{
          mb: 3,
          borderRadius: '12px',
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        Los indicadores de ventas, costos y gastos
        corresponden a <strong>{periodoTexto}</strong>.
        El inventario representa las existencias
        actuales valorizadas a costo promedio WAC.
        La razón corriente permanece pendiente
        hasta disponer de activos y pasivos corrientes.
      </Alert>

      {/* ======================================
          RESUMEN FINANCIERO
      ====================================== */}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{ ...ESTILO_TARJETA, p: 3 }}
          >
            <Typography
              variant="subtitle1"
              sx={ESTILO_TITULO}
            >
              Resumen de ventas
            </Typography>

            <Typography
              variant="caption"
              sx={ESTILO_DESCRIPCION}
            >
              Ventas emitidas durante {periodoTexto}.
              Importes obtenidos del módulo de Ventas.
            </Typography>

            <TableContainer>
              <Table size="small" sx={ESTILO_TABLA}>
                <TableHead>
                  <TableRow>
                    <TableCell>INDICADOR</TableCell>
                    <TableCell align="right">
                      VALOR
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {[
                    [
                      'Ventas netas (sin IVA)',
                      formatoMoneda(ventasNetas),
                    ],
                    [
                      'IVA débito fiscal',
                      formatoMoneda(ivaDebito),
                    ],
                    [
                      'Total cobrado (con IVA)',
                      formatoMoneda(totalCobrado),
                    ],
                    [
                      'Costo de ventas',
                      formatoMoneda(costoVentas),
                    ],
                    [
                      'Utilidad bruta',
                      formatoMoneda(utilidadBruta),
                    ],
                    [
                      'Cantidad de ventas',
                      formatoNumero(cantidadVentas),
                    ],
                  ].map(([nombre, valor]) => (
                    <TableRow key={nombre}>
                      <TableCell>{nombre}</TableCell>

                      <TableCell
                        align="right"
                        sx={{ fontWeight: 700 }}
                      >
                        {ventasDisponibles ? valor : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{ ...ESTILO_TARJETA, p: 3 }}
          >
            <Typography
              variant="subtitle1"
              sx={ESTILO_TITULO}
            >
              Gastos y resultado operativo
            </Typography>

            <Typography
              variant="caption"
              sx={ESTILO_DESCRIPCION}
            >
              Gastos registrados durante {periodoTexto}
              y resultado de las operaciones.
            </Typography>

            <TableContainer>
              <Table size="small" sx={ESTILO_TABLA}>
                <TableHead>
                  <TableRow>
                    <TableCell>INDICADOR</TableCell>
                    <TableCell align="right">
                      VALOR
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {[
                    [
                      'Gastos administrativos',
                      formatoMoneda(gastosAdministracion),
                      gastosDisponibles,
                    ],
                    [
                      'Gastos de venta',
                      formatoMoneda(gastosVenta),
                      gastosDisponibles,
                    ],
                    [
                      'Total gastos operativos',
                      formatoMoneda(totalGastos),
                      gastosDisponibles,
                    ],
                    [
                      'Registros de gastos',
                      formatoNumero(cantidadGastos),
                      gastosDisponibles,
                    ],
                    [
                      'Utilidad operativa',
                      formatoMoneda(utilidadOperativa),
                      finanzasDisponibles,
                    ],
                  ].map(([nombre, valor, disponible]) => (
                    <TableRow key={nombre}>
                      <TableCell>{nombre}</TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          fontWeight:
                            nombre === 'Utilidad operativa'
                              ? 800
                              : 700,
                          color:
                            nombre === 'Utilidad operativa'
                              ? COLORES.principal
                              : COLORES.texto,
                        }}
                      >
                        {disponible ? valor : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* ======================================
          RESUMEN DE INVENTARIO
      ====================================== */}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* PRODUCTOS CON MAYOR VALOR */}

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{ ...ESTILO_TARJETA, p: 3 }}
          >
            <Typography
              variant="subtitle1"
              sx={ESTILO_TITULO}
            >
              Productos por valor en inventario
            </Typography>

            <Typography
              variant="caption"
              sx={ESTILO_DESCRIPCION}
            >
              Cinco productos con mayor valoración
              según existencias y costo promedio.
            </Typography>

            {!productosDisponibles ? (
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
                              color: COLORES.texto,
                            }}
                          >
                            {producto.descripcion}
                          </Typography>

                          <Typography
                            variant="caption"
                            sx={{
                              color: COLORES.secundario,
                            }}
                          >
                            {producto.codigo} ·{' '}
                            {producto.stock} unidades
                          </Typography>
                        </Box>

                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 800,
                            color: COLORES.principal,
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
                            bgcolor: COLORES.principal,
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

        {/* DISTRIBUCIÓN POR CATEGORÍA */}

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{ ...ESTILO_TARJETA, p: 3 }}
          >
            <Typography
              variant="subtitle1"
              sx={ESTILO_TITULO}
            >
              Resumen del catálogo
            </Typography>

            <Typography
              variant="caption"
              sx={ESTILO_DESCRIPCION}
            >
              Distribución de artículos por categoría.
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 6 }}>
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
                      color: COLORES.principal,
                    }}
                  >
                    {productosDisponibles
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

              <Grid size={{ xs: 6 }}>
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
                    {productosDisponibles
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
              <Table size="small" sx={ESTILO_TABLA}>
                <TableHead>
                  <TableRow>
                    <TableCell>CATEGORÍA</TableCell>
                    <TableCell align="right">
                      PRODUCTOS
                    </TableCell>
                    <TableCell align="right">
                      UNIDADES
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {productosDisponibles ? (
                    resumenCategorias.map((categoria) => (
                      <TableRow key={categoria.codigo}>
                        <TableCell>
                          {categoria.nombre}
                        </TableCell>

                        <TableCell align="right">
                          {formatoNumero(categoria.cantidad)}
                        </TableCell>

                        <TableCell align="right">
                          {formatoNumero(categoria.unidades)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        align="center"
                      >
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

      {/* ======================================
          VALUACIÓN CONTABLE WAC
      ====================================== */}

      <Paper
        elevation={0}
        sx={{ ...ESTILO_TARJETA, p: 3 }}
      >
        <Typography
          variant="subtitle1"
          sx={ESTILO_TITULO}
        >
          Inventario: Valuación a Costo Promedio (WAC)
        </Typography>

        <Typography
          variant="caption"
          sx={{
            ...ESTILO_DESCRIPCION,
            mb: 2,
          }}
        >
          Valuación según existencias y costo promedio
          registrado. El costo de ventas corresponde
          al período seleccionado y proviene de las
          ventas emitidas.
        </Typography>

        <TableContainer>
          <Table size="small" sx={ESTILO_TABLA}>
            <TableHead>
              <TableRow>
                <TableCell>INDICADOR</TableCell>
                <TableCell align="right">
                  VALOR
                </TableCell>
                <TableCell align="right">
                  ESTADO
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              <FilaIndicador
                nombre="Valor total del inventario"
                valor={formatoMoneda(inversion)}
                disponible={inventarioDisponible}
              />

              <FilaIndicador
                nombre="Unidades disponibles"
                valor={formatoNumero(unidades)}
                disponible={inventarioDisponible}
              />

              <FilaIndicador
                nombre={`Costo de ventas (${periodoTexto})`}
                valor={formatoMoneda(costoVentas)}
                disponible={ventasDisponibles}
              />

              <FilaIndicador
                nombre="Rotación de inventarios"
                disponible={false}
                pendiente
              />

              <FilaIndicador
                nombre="Días promedio de inventario"
                disponible={false}
                pendiente
              />
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
