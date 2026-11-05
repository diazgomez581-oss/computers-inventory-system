import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import { API_URL } from '../api';

// COMP-02: Recepción de Compras
// Sin dependencias de librerías de íconos.

const API = `${API_URL}/api`;

const colores = {
  principal: '#2563EB',
  titulo: '#0F172A',
  secundario: '#64748B',
};

const nuevaFila = () => ({
  producto: '',
  cantidad: '1',
  costo_unitario_neto: '',
});

const moneda = (valor) =>
  Number(valor || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

const cuatroDecimales = (valor) =>
  Number(valor || 0).toFixed(4);

const redondear = (valor) =>
  Math.round((valor + Number.EPSILON) * 100) / 100;

// Autenticación
function getHeaders(json = false) {
  let token = '';

  try {
    const usuario = JSON.parse(
      localStorage.getItem('stb_user') || '{}'
    );
    token = usuario.token || '';
  } catch {
    token = '';
  }

  return {
    ...(token
      ? { Authorization: `Token ${token}` }
      : {}),
    ...(json
      ? { 'Content-Type': 'application/json' }
      : {}),
  };
}

// Mensajes de error del backend
function mostrarError(data, estado) {
  if (typeof data === 'string') return data;

  if (data?.detail) {
    return String(data.detail);
  }

  if (data && typeof data === 'object') {
    return Object.entries(data)
      .map(([clave, valor]) => {
        const texto = Array.isArray(valor)
          ? valor
              .map((v) =>
                typeof v === 'string'
                  ? v
                  : JSON.stringify(v)
              )
              .join(', ')
          : String(valor);

        return `${clave}: ${texto}`;
      })
      .join(' | ');
  }

  return `Error HTTP ${estado}`;
}

// Peticiones al backend
async function solicitar(endpoint, options = {}) {
  const respuesta = await fetch(`${API}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(Boolean(options.body)),
      ...options.headers,
    },
  });

  const texto = await respuesta.text();

  let datos;

  try {
    datos = JSON.parse(texto);
  } catch {
    datos = null;
  }

  if (!respuesta.ok) {
    throw new Error(
      datos
        ? mostrarError(datos, respuesta.status)
        : `Error HTTP ${respuesta.status}: ${
            texto.slice(0, 100) || 'Sin respuesta'
          }`
    );
  }

  return datos;
}

export default function Compras() {
  const [compras, setCompras] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [errorForm, setErrorForm] = useState('');

  const [abierto, setAbierto] = useState(false);
  const [detalle, setDetalle] = useState(null);

  const [documento, setDocumento] = useState('');
  const [proveedor, setProveedor] = useState('');

  const [filas, setFilas] = useState([
    nuevaFila(),
  ]);

  // Cargar registros
  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');

    try {
      const [
        listaCompras,
        listaProductos,
        listaProveedores,
      ] = await Promise.all([
        solicitar('/compras/'),
        solicitar('/productos/'),
        solicitar('/proveedores/'),
      ]);

      setCompras(
        Array.isArray(listaCompras)
          ? listaCompras
          : listaCompras?.results || []
      );

      setProductos(
        Array.isArray(listaProductos)
          ? listaProductos
          : listaProductos?.results || []
      );

      setProveedores(
        Array.isArray(listaProveedores)
          ? listaProveedores
          : listaProveedores?.results || []
      );
    } catch (err) {
      console.error('Error cargando compras:', err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const productosPorId = useMemo(
    () =>
      Object.fromEntries(
        productos.map((p) => [
          String(p.id),
          p,
        ])
      ),
    [productos]
  );

  // Totales de compra
  const subtotal = redondear(
    filas.reduce(
      (acumulado, fila) =>
        acumulado +
        redondear(
          Number(fila.cantidad || 0) *
            Number(fila.costo_unitario_neto || 0)
        ),
      0
    )
  );

  const iva = redondear(subtotal * 0.13);

  const total = redondear(subtotal + iva);

  // Abrir formulario
  function abrirNueva() {
    setDocumento('');
    setProveedor('');
    setFilas([nuevaFila()]);
    setErrorForm('');
    setExito('');
    setAbierto(true);
  }

  // Actualizar productos del formulario
  function actualizarFila(index, propiedad, valor) {
    setFilas((anteriores) =>
      anteriores.map((fila, i) =>
        i === index
          ? { ...fila, [propiedad]: valor }
          : fila
      )
    );
  }

  // Registrar compra
  async function registrar(evento) {
    evento.preventDefault();
    setErrorForm('');

    if (!documento.trim()) {
      setErrorForm(
        'Ingresa el número de factura o CCF.'
      );
      return;
    }

    const ids = filas.map(
      (fila) => String(fila.producto)
    );

    if (ids.some((id) => !id)) {
      setErrorForm(
        'Selecciona un producto en cada fila.'
      );
      return;
    }

    if (new Set(ids).size !== ids.length) {
      setErrorForm(
        'No puedes repetir un producto en la misma compra.'
      );
      return;
    }

    const datosInvalidos = filas.some(
      (fila) =>
        !Number.isInteger(Number(fila.cantidad)) ||
        Number(fila.cantidad) <= 0 ||
        !Number.isFinite(
          Number(fila.costo_unitario_neto)
        ) ||
        Number(fila.costo_unitario_neto) <= 0
    );

    if (datosInvalidos) {
      setErrorForm(
        'La cantidad debe ser un entero positivo y el costo neto debe ser mayor que cero.'
      );
      return;
    }

    setGuardando(true);

    try {
      const resultado = await solicitar(
        '/compras/',
        {
          method: 'POST',
          body: JSON.stringify({
            numero_documento: documento.trim(),
            proveedor: proveedor
              ? Number(proveedor)
              : null,
            detalles: filas.map((fila) => ({
              producto: Number(fila.producto),
              cantidad: Number(fila.cantidad),
              costo_unitario_neto: Number(
                fila.costo_unitario_neto
              ).toFixed(4),
            })),
          }),
        }
      );

      setAbierto(false);

      setExito(
        `Compra ${resultado.numero_documento} registrada correctamente.`
      );

      await cargar();
    } catch (err) {
      console.error(
        'Error registrando compra:',
        err
      );
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Box sx={{ color: colores.titulo }}>
      {/* ENCABEZADO */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
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
              letterSpacing: '-0.04em',
            }}
          >
            Recepción de Compras
          </Typography>

          <Typography
            sx={{
              color: colores.secundario,
              mt: 0.7,
            }}
          >
            Registro de mercadería, IVA crédito fiscal
            y costo promedio ponderado.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 1,
          }}
        >
          <Button
            variant="outlined"
            onClick={cargar}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            Actualizar
          </Button>

          <Button
            variant="contained"
            onClick={abrirNueva}
            sx={{
              bgcolor: colores.principal,
              borderRadius: 2,
              py: 1.3,
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            + Nueva Compra
          </Button>
        </Box>
      </Box>

      {/* MENSAJES */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {exito && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setExito('')}
        >
          {exito}
        </Alert>
      )}

      {/* LISTADO DE COMPRAS */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid #E2E8F0',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table sx={{ minWidth: 850 }}>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                {[
                  'FECHA',
                  'DOCUMENTO',
                  'PROVEEDOR',
                  'PRODUCTOS',
                  'SUBTOTAL NETO',
                  'IVA (13%)',
                  'TOTAL A PAGAR',
                  'DETALLE',
                ].map((titulo) => (
                  <TableCell
                    key={titulo}
                    sx={{
                      color: colores.secundario,
                      fontWeight: 800,
                      fontSize: '.74rem',
                    }}
                  >
                    {titulo}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {cargando ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                    sx={{ py: 6 }}
                  >
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : compras.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                    sx={{
                      py: 7,
                      color: colores.secundario,
                    }}
                  >
                    No hay compras registradas todavía.
                  </TableCell>
                </TableRow>
              ) : (
                compras.map((compra) => (
                  <TableRow
                    key={compra.id}
                    hover
                  >
                    <TableCell>
                      {new Date(
                        compra.fecha
                      ).toLocaleDateString('es-SV')}
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      {compra.numero_documento}
                    </TableCell>

                    <TableCell>
                      {compra.proveedor_nombre ||
                        'Sin proveedor'}
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={`${
                          compra.detalles?.length || 0
                        } producto(s)`}
                        sx={{
                          bgcolor: '#EFF6FF',
                          color: '#1D4ED8',
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      {moneda(compra.subtotal_neto)}
                    </TableCell>

                    <TableCell>
                      {moneda(compra.iva_credito_fiscal)}
                    </TableCell>

                    <TableCell sx={{ fontWeight: 800 }}>
                      {moneda(compra.total_pagar)}
                    </TableCell>

                    <TableCell>
                      <Button
                        size="small"
                        onClick={() =>
                          setDetalle(compra)
                        }
                        sx={{
                          textTransform: 'none',
                        }}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* FORMULARIO REGISTRAR COMPRA */}
      <Dialog
        open={abierto}
        onClose={
          guardando
            ? undefined
            : () => setAbierto(false)
        }
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <Box
          component="form"
          onSubmit={registrar}
        >
          <DialogTitle
            sx={{
              fontWeight: 800,
              color: colores.titulo,
              py: 2.5,
            }}
          >
            Registrar Compra
          </DialogTitle>

          <DialogContent
            dividers
            sx={{
              p: { xs: 2, md: 3 },
            }}
          >
            {errorForm && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
              >
                {errorForm}
              </Alert>
            )}

            {/* DOCUMENTO Y PROVEEDOR */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: '1fr 1.8fr',
                },
                gap: 2,
                mb: 2.4,
              }}
            >
              <TextField
                label="No. de factura / CCF"
                value={documento}
                required
                fullWidth
                onChange={(e) =>
                  setDocumento(e.target.value)
                }
              />

              <TextField
                select
                label="Proveedor (opcional)"
                fullWidth
                value={proveedor}
                onChange={(e) =>
                  setProveedor(e.target.value)
                }
              >
                <MenuItem value="">
                  Sin proveedor
                </MenuItem>

                {proveedores
                  .filter((p) => p.activo)
                  .map((p) => (
                    <MenuItem
                      key={p.id}
                      value={String(p.id)}
                    >
                      {p.razon_social}
                    </MenuItem>
                  ))}
              </TextField>
            </Box>

            <Divider sx={{ mb: 2.4 }} />

            {/* PRODUCTOS */}
            {filas.map((fila, i) => {
              const producto =
                productosPorId[
                  String(fila.producto)
                ];

              const stockAnterior = Number(
                producto?.stock || 0
              );

              const promedioAnterior = Number(
                producto?.costo_promedio || 0
              );

              const cantidad = Number(
                fila.cantidad || 0
              );

              const costo = Number(
                fila.costo_unitario_neto || 0
              );

              const stockNuevo =
                stockAnterior + cantidad;

              const promedioNuevo =
                stockNuevo > 0
                  ? (
                      stockAnterior *
                        promedioAnterior +
                      cantidad * costo
                    ) / stockNuevo
                  : 0;

              return (
                <Box
                  key={i}
                  sx={{ mb: 2.4 }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'minmax(200px, 2.5fr) minmax(90px, .65fr) minmax(110px, .9fr) auto auto',
                      },
                      gap: 1.4,
                      alignItems: 'start',
                    }}
                  >
                    <TextField
                      select
                      label="Producto"
                      value={fila.producto}
                      onChange={(e) =>
                        actualizarFila(
                          i,
                          'producto',
                          e.target.value
                        )
                      }
                      fullWidth
                      required
                    >
                      <MenuItem
                        value=""
                        disabled
                      >
                        Seleccionar producto
                      </MenuItem>

                      {productos.map((p) => (
                        <MenuItem
                          key={p.id}
                          value={String(p.id)}
                        >
                          {p.codigo} — {p.descripcion}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      label="Cantidad"
                      type="number"
                      value={fila.cantidad}
                      required
                      inputProps={{
                        min: 1,
                        step: 1,
                      }}
                      onChange={(e) =>
                        actualizarFila(
                          i,
                          'cantidad',
                          e.target.value
                        )
                      }
                    />

                    <TextField
                      label="Costo unit. neto"
                      type="number"
                      required
                      value={
                        fila.costo_unitario_neto
                      }
                      inputProps={{
                        min: 0.0001,
                        step: 0.0001,
                      }}
                      onChange={(e) =>
                        actualizarFila(
                          i,
                          'costo_unitario_neto',
                          e.target.value
                        )
                      }
                    />

                    <Typography
                      sx={{
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        pt: 2,
                      }}
                    >
                      {moneda(cantidad * costo)}
                    </Typography>

                    <IconButton
                      aria-label="Quitar producto"
                      disabled={
                        filas.length === 1
                      }
                      onClick={() =>
                        setFilas((anteriores) =>
                          anteriores.filter(
                            (_, j) => j !== i
                          )
                        )
                      }
                      sx={{ mt: 1 }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 700,
                          color: '#94A3B8',
                        }}
                      >
                        ×
                      </Typography>
                    </IconButton>
                  </Box>

                  {producto && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: colores.secundario,
                        mt: 0.7,
                        display: 'block',
                      }}
                    >
                      Costo promedio: $
                      {cuatroDecimales(
                        promedioAnterior
                      )}
                      {' → '}
                      <b>
                        $
                        {cuatroDecimales(
                          promedioNuevo
                        )}
                      </b>
                      {' · '}
                      Stock tras la compra:
                      {' '}
                      {stockNuevo} uds
                    </Typography>
                  )}
                </Box>
              );
            })}

            <Button
              onClick={() =>
                setFilas((anteriores) => [
                  ...anteriores,
                  nuevaFila(),
                ])
              }
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                mb: 2.2,
              }}
            >
              + Agregar producto
            </Button>

            <Divider />

            {/* RESUMEN */}
            <Box
              sx={{
                ml: 'auto',
                width: {
                  xs: '100%',
                  sm: 315,
                },
                mt: 2.2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  color: colores.secundario,
                  mb: 1,
                }}
              >
                <span>Subtotal Neto</span>
                <b>{moneda(subtotal)}</b>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  color: colores.secundario,
                  mb: 1,
                }}
              >
                <span>
                  IVA Crédito Fiscal (13%)
                </span>
                <b>{moneda(iva)}</b>
              </Box>

              <Divider sx={{ mb: 1 }} />

              <Box
                sx={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  fontWeight: 800,
                  fontSize: '1.15rem',
                }}
              >
                <span>Total a Pagar</span>
                <span>{moneda(total)}</span>
              </Box>

              <Typography
                variant="caption"
                sx={{
                  color: '#94A3B8',
                }}
              >
                El inventario solo absorbe
                el costo neto (sin IVA).
              </Typography>
            </Box>
          </DialogContent>

          <DialogActions
            sx={{
              p: 2.5,
              gap: 1,
            }}
          >
            <Button
              disabled={guardando}
              onClick={() =>
                setAbierto(false)
              }
              sx={{
                color: colores.secundario,
                textTransform: 'none',
              }}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={guardando}
              variant="contained"
              sx={{
                bgcolor: colores.principal,
                fontWeight: 700,
                textTransform: 'none',
              }}
            >
              {guardando
                ? 'Registrando...'
                : 'Registrar compra'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* CONSULTAR DETALLE DE COMPRA */}
      <Dialog
        open={Boolean(detalle)}
        onClose={() =>
          setDetalle(null)
        }
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
          }}
        >
          Compra {detalle?.numero_documento}
        </DialogTitle>

        <DialogContent dividers>
          <Typography
            sx={{
              color: colores.secundario,
              mb: 2,
            }}
          >
            Proveedor:
            {' '}
            {detalle?.proveedor_nombre ||
              'Sin proveedor'}
            {' · '}
            {detalle?.fecha
              ? new Date(
                  detalle.fecha
                ).toLocaleString('es-SV')
              : ''}
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[
                    'Producto',
                    'Cantidad',
                    'Costo neto',
                    'Subtotal',
                    'Stock anterior → nuevo',
                    'Costo promedio nuevo',
                  ].map((titulo) => (
                    <TableCell
                      key={titulo}
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      {titulo}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {(detalle?.detalles || []).map(
                  (item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.producto_codigo}
                        {' — '}
                        {item.producto_descripcion}
                      </TableCell>

                      <TableCell>
                        {item.cantidad}
                      </TableCell>

                      <TableCell>
                        {moneda(
                          item.costo_unitario_neto
                        )}
                      </TableCell>

                      <TableCell>
                        {moneda(
                          item.subtotal_neto
                        )}
                      </TableCell>

                      <TableCell>
                        {item.stock_anterior}
                        {' → '}
                        {item.stock_nuevo}
                      </TableCell>

                      <TableCell>
                        $
                        {cuatroDecimales(
                          item.costo_promedio_nuevo
                        )}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography
            align="right"
            sx={{
              fontWeight: 700,
              mt: 2,
            }}
          >
            Subtotal:
            {' '}
            {moneda(detalle?.subtotal_neto)}
            {' · '}
            IVA:
            {' '}
            {moneda(
              detalle?.iva_credito_fiscal
            )}
            {' · '}
            Total:
            {' '}
            {moneda(detalle?.total_pagar)}
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setDetalle(null)
            }
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
