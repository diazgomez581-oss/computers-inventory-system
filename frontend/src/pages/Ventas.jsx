
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider,
  IconButton, MenuItem, Paper, Snackbar, Stack,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import { Trash2 } from 'lucide-react';
import { API_URL } from '../api';

const BASE_URL = `${String(API_URL)
  .replace(/\/+$/, '')
  .replace(/\/api$/, '')}/api`;

const USD = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: 'USD',
});

const money = (value) => USD.format(Number(value || 0));

const round = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const cardStyle = {
  border: '1px solid #E2E9F4',
  borderRadius: '14px',
  bgcolor: '#FFFFFF',
  boxShadow: 'none',
};

const headingCell = {
  fontWeight: 800,
  fontSize: 11.5,
  letterSpacing: 0.25,
  color: '#7184A5',
  bgcolor: '#F5F7FC',
  py: 1.5,
  px: 1,
  whiteSpace: 'nowrap',
  borderBottom: '1px solid #E3E9F4',
};

const primaryButton = {
  bgcolor: '#4C5EFF',
  '&:hover': { bgcolor: '#394BDF' },
  color: '#fff',
  textTransform: 'none',
  fontWeight: 800,
  borderRadius: '9px',
  px: 3,
  py: 1.2,
  boxShadow: '0 4px 10px rgba(76,94,255,.16)',
};

function getToken() {
  try {
    return JSON.parse(
      localStorage.getItem('stb_user') || 'null'
    )?.token || '';
  } catch {
    return '';
  }
}

async function api(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Token ${getToken()}`,
      ...(options.body
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      data?.detail ||
      data?.non_field_errors ||
      data?.productos ||
      data?.mensaje ||
      data;

    throw new Error(
      typeof detail === 'string'
        ? detail
        : JSON.stringify(detail || `Error HTTP ${response.status}`)
    );
  }

  return data;
}

function newLine() {
  return {
    key: `${Date.now()}-${Math.random()}`,
    producto_id: '',
    cantidad: '1',
    porcentaje_ganancia: '10',
  };
}

function calculateUnitPrice(line, products) {
  const product = products.find(
    (p) => p.id === Number(line.producto_id)
  );

  const cost = Number(product?.costo_promedio || 0);
  const percentage = Number(line.porcentaje_ganancia);

  if (
    !product ||
    cost <= 0 ||
    !Number.isFinite(percentage) ||
    percentage <= 0
  ) {
    return 0;
  }

  return round(cost * (1 + percentage / 100) * 1.13);
}

function printableReceipt(venta) {
  const escape = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (ch) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[ch])
    );

  const details = (venta.detalles || [])
    .map((d) => `
      <tr>
        <td>${escape(d.producto_codigo)} - ${escape(d.producto_descripcion)}</td>
        <td class="num">${escape(d.cantidad)}</td>
        <td class="num">${money(d.precio_unitario)}</td>
        <td class="num">${money(d.subtotal)}</td>
      </tr>
    `)
    .join('');

  const html = `
    <!doctype html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>${escape(venta.numero_comprobante)}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #17233b;
          max-width: 760px;
          margin: 35px auto;
          padding: 0 18px;
        }
        h1 { margin-bottom: 4px; }
        small { color: #64748b; }
        table {
          border-collapse: collapse;
          width: 100%;
          margin-top: 24px;
        }
        th, td {
          border-bottom: 1px solid #ddd;
          padding: 10px;
          text-align: left;
          font-size: 13px;
        }
        .num { text-align: right; }
        .totals {
          margin: 24px 0 0 auto;
          max-width: 300px;
        }
        .totals div {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
        }
        .grand {
          font-size: 19px;
          font-weight: bold;
          border-top: 2px solid #17233b;
          padding-top: 12px;
        }
        .note {
          margin-top: 38px;
          font-size: 12px;
          color: #64748b;
        }
        @media print {
          body { margin: 0; max-width: none; }
        }
      </style>
    </head>
    <body>
      <h1>STB Computers</h1>
      <small>Comprobante interno de venta — No constituye DTE autorizado</small>

      <p>
        <strong>Comprobante:</strong> ${escape(venta.numero_comprobante)}<br>
        <strong>Fecha:</strong> ${escape(new Date(venta.fecha).toLocaleString('es-SV'))}<br>
        <strong>Cliente:</strong> ${escape(venta.cliente || 'Consumidor final')}
      </p>

      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th class="num">Cantidad</th>
            <th class="num">Precio final</th>
            <th class="num">Importe</th>
          </tr>
        </thead>
        <tbody>${details}</tbody>
      </table>

      <div class="totals">
        <div>
          <span>Venta neta</span>
          <strong>${money(venta.subtotal)}</strong>
        </div>
        <div>
          <span>IVA incluido (13%)</span>
          <strong>${money(venta.iva)}</strong>
        </div>
        <div class="grand">
          <span>Total cobrado</span>
          <span>${money(venta.total)}</span>
        </div>
      </div>

      <p class="note">
        Documento para control interno. La emisión de factura
        electrónica fiscal requiere el procedimiento autorizado
        por el Ministerio de Hacienda de El Salvador.
      </p>
    </body>
    </html>
  `;

  const popup = window.open('', '_blank', 'width=900,height=800');

  if (!popup) {
    throw new Error(
      'El navegador bloqueó la ventana de impresión.'
    );
  }

  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  popup.setTimeout(() => popup.print(), 300);
}

export default function Ventas() {
  const [period, setPeriod] = useState(today());
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [customer, setCustomer] = useState('Consumidor final');
  const [lines, setLines] = useState([newLine()]);
  const [search, setSearch] = useState('');
  const [generalMargin, setGeneralMargin] = useState('10');
  const [notice, setNotice] = useState(null);

  const notify = (message, severity = 'error') =>
    setNotice({ message, severity });

  const loadSales = useCallback(async () => {
    const [year, month] = period.split('-');

    if (year.length !== 4 || !month) return;

    setLoading(true);

    try {
      const query =
        `?anio=${encodeURIComponent(year)}` +
        `&mes=${encodeURIComponent(Number(month))}`;

      const [list, totals] = await Promise.all([
        api(`/ventas/${query}`),
        api(`/ventas/resumen/${query}`),
      ]);

      setSales(
        Array.isArray(list) ? list : list?.results || []
      );
      setSummary(totals);
    } catch (error) {
      notify(error.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const openNewSale = async () => {
    try {
      const available = await api('/ventas/productos/');

      setProducts(
        Array.isArray(available)
          ? available
          : available?.results || []
      );

      setCustomer('Consumidor final');
      setGeneralMargin('10');
      setLines([newLine()]);
      setOpen(true);
    } catch (error) {
      notify(error.message);
    }
  };

  const updateLine = (key, field, value) => {
    setLines((previous) =>
      previous.map((line) =>
        line.key === key
          ? { ...line, [field]: value }
          : line
      )
    );
  };

  const applyGeneralMargin = () => {
    const percentage = Number(generalMargin);

    if (!Number.isFinite(percentage) || percentage <= 0) {
      notify('El porcentaje general debe ser mayor que cero.');
      return;
    }

    setLines((previous) =>
      previous.map((line) => ({
        ...line,
        porcentaje_ganancia: generalMargin,
      }))
    );
  };

  const computed = useMemo(() => {
    const total = round(
      lines.reduce((sum, line) => {
        const quantity = Number(line.cantidad || 0);
        const price = calculateUnitPrice(line, products);

        return sum + round(quantity * price);
      }, 0)
    );

    const net = round(total / 1.13);

    return {
      total,
      net,
      tax: round(total - net),
    };
  }, [lines, products]);

  const saveSale = async () => {
    const ids = lines.map(
      (line) => Number(line.producto_id)
    );

    if (!lines.length || ids.some((id) => !id)) {
      return notify('Seleccioná un producto en cada fila.');
    }

    if (new Set(ids).size !== ids.length) {
      return notify(
        'No repitas productos; modificá la cantidad en la fila existente.'
      );
    }

    for (const line of lines) {
      const product = products.find(
        (p) => p.id === Number(line.producto_id)
      );

      const quantity = Number(line.cantidad);
      const percentage = Number(line.porcentaje_ganancia);

      if (!Number.isInteger(quantity) || quantity < 1) {
        return notify(
          'Las cantidades deben ser enteros mayores que cero.'
        );
      }

      if (
        !Number.isFinite(percentage) ||
        percentage <= 0
      ) {
        return notify(
          'La ganancia debe ser mayor que cero.'
        );
      }

      if (
        !product ||
        Number(product.costo_promedio) <= 0
      ) {
        return notify(
          'El producto no tiene un costo WAC válido.'
        );
      }

      if (quantity > Number(product.stock)) {
        return notify(
          `Stock insuficiente para ${product.descripcion}. Disponible: ${product.stock}.`
        );
      }
    }

    setSaving(true);

    try {
      const result = await api('/ventas/', {
        method: 'POST',
        body: JSON.stringify({
          cliente: customer.trim() || 'Consumidor final',
          productos: lines.map((line) => ({
            producto_id: Number(line.producto_id),
            cantidad: Number(line.cantidad),
            porcentaje_ganancia: line.porcentaje_ganancia,
          })),
        }),
      });

      setOpen(false);
      setReceipt(result);

      notify(
        `Venta ${result.numero_comprobante} registrada correctamente.`,
        'success'
      );

      await loadSales();
    } catch (error) {
      notify(error.message);
    } finally {
      setSaving(false);
    }
  };

  const showReceipt = async (sale) => {
    try {
      setReceipt(await api(`/ventas/${sale.id}/`));
    } catch (error) {
      notify(error.message);
    }
  };

  const visibleSales = sales.filter((sale) =>
    `${sale.numero_comprobante || ''} ${sale.cliente || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const [year, month] = period.split('-');

  const monthLabel = new Date(
    Number(year),
    Number(month) - 1,
    1
  ).toLocaleDateString('es-SV', {
    month: 'long',
    year: 'numeric',
  });

  const metrics = [
    {
      label: 'VENTAS NETAS',
      value: summary?.ventas_netas,
      color: '#5363FF',
    },
    {
      label: 'IVA DÉBITO',
      value: summary?.iva_debito,
      color: '#E39929',
    },
    {
      label: 'TOTAL COBRADO',
      value: summary?.total_cobrado,
      color: '#159684',
    },
    {
      label: 'UTILIDAD BRUTA',
      value: summary?.utilidad_bruta,
      color: '#5363FF',
    },
  ];

  return (
    <Box
      sx={{
        maxWidth: 1250,
        mx: 'auto',
        pb: 6,
        color: '#152B4E',
      }}
    >
      {/* ENCABEZADO */}
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          alignItems: {
            xs: 'stretch',
            sm: 'center',
          },
          flexDirection: {
            xs: 'column',
            sm: 'row',
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: { xs: 27, md: 32 },
              fontWeight: 900,
              letterSpacing: -0.6,
              color: '#12294C',
            }}
          >
            Facturación y Ventas
          </Typography>

          <Typography
            sx={{
              color: '#7B90B1',
              fontSize: 14,
            }}
          >
            VENT-01 · Registro y control de ventas
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={openNewSale}
          sx={{
            ...primaryButton,
            ml: { sm: 'auto' },
            flexShrink: 0,
            alignSelf: {
              xs: 'flex-start',
              sm: 'center',
            },
          }}
        >
          + Nueva venta
        </Button>
      </Box>

      {/* PERÍODO */}
      <Paper
        sx={{
          ...cardStyle,
          p: { xs: 2, md: 2.5 },
          mb: 2.5,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{
            xs: 'stretch',
            sm: 'center',
          }}
          spacing={2}
        >
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 800,
              color: '#142C51',
              mr: 1,
            }}
          >
            Período contable
          </Typography>

          <TextField
            select
            size="small"
            label="Mes"
            value={month}
            onChange={(e) =>
              setPeriod(`${year}-${e.target.value}`)
            }
            sx={{ minWidth: 165 }}
          >
            {Array.from({ length: 12 }, (_, i) => {
              const value = String(i + 1).padStart(2, '0');

              return (
                <MenuItem key={value} value={value}>
                  {new Date(2026, i, 1).toLocaleDateString(
                    'es-SV',
                    { month: 'long' }
                  )}
                </MenuItem>
              );
            })}
          </TextField>

          <TextField
            size="small"
            label="Año"
            type="number"
            value={year}
            onChange={(e) => {
              if (/^\d{0,4}$/.test(e.target.value)) {
                setPeriod(`${e.target.value}-${month}`);
              }
            }}
            sx={{
              width: {
                xs: '100%',
                sm: 120,
              },
            }}
            slotProps={{
              htmlInput: {
                min: 2000,
                max: 2100,
              },
            }}
          />

          <Button
            variant="outlined"
            disabled={loading || year.length !== 4}
            onClick={loadSales}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              borderColor: '#DCE4FF',
              color: '#4C5EFF',
              borderRadius: 2,
            }}
          >
            ↻ Actualizar
          </Button>
        </Stack>
      </Paper>

      {/* INDICADORES */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 2,
          mb: 3,
        }}
      >
        {metrics.map((metric) => (
          <Paper
            key={metric.label}
            sx={{
              ...cardStyle,
              p: 2.5,
              minHeight: 154,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                sx={{
                  color: '#6E83A6',
                  fontSize: 11.5,
                  fontWeight: 900,
                  letterSpacing: 0.55,
                }}
              >
                {metric.label}
              </Typography>

              <Box
                sx={{
                  width: 10,
                  height: 10,
                  bgcolor: metric.color,
                  borderRadius: '50%',
                }}
              />
            </Stack>

            <Typography
              sx={{
                fontSize: { xs: 27, lg: 29 },
                fontWeight: 900,
                color: '#12294C',
                my: 1.2,
              }}
            >
              {money(metric.value)}
            </Typography>

            <Chip
              label={monthLabel}
              size="small"
              sx={{
                bgcolor: `${metric.color}15`,
                color: metric.color,
                fontWeight: 800,
                fontSize: 11,
                borderRadius: '7px',
              }}
            />
          </Paper>
        ))}
      </Box>

      {/* HISTORIAL */}
      <Paper
        sx={{
          ...cardStyle,
          overflow: 'hidden',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{
            xs: 'stretch',
            sm: 'center',
          }}
          spacing={2}
          sx={{
            px: 2.5,
            py: 2.5,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: 20,
                color: '#12294C',
              }}
            >
              Historial de ventas
            </Typography>

            <Typography
              sx={{
                fontSize: 12,
                color: '#8093B1',
              }}
            >
              {monthLabel} · {visibleSales.length} registros
            </Typography>
          </Box>

          <TextField
            size="small"
            placeholder="Buscar comprobante o cliente"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              minWidth: { sm: 270 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {[
                  'COMPROBANTE',
                  'FECHA',
                  'CLIENTE',
                  'VENTA NETA',
                  'IVA',
                  'TOTAL',
                  'ESTADO',
                  'ACCIONES',
                ].map((title) => (
                  <TableCell
                    key={title}
                    sx={{
                      ...headingCell,
                      py: 1.8,
                      px: 2,
                    }}
                  >
                    {title}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                    sx={{ py: 6 }}
                  >
                    <CircularProgress size={26} />
                  </TableCell>
                </TableRow>
              ) : visibleSales.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                    sx={{
                      py: 6,
                      color: '#8192AB',
                    }}
                  >
                    No hay ventas registradas en este período.
                  </TableCell>
                </TableRow>
              ) : (
                visibleSales.map((sale) => (
                  <TableRow
                    key={sale.id}
                    hover
                    sx={{
                      '& td': {
                        py: 1.8,
                        px: 2,
                        borderColor: '#E8EDF5',
                        fontSize: 13,
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: 800,
                        color: '#173154',
                      }}
                    >
                      {sale.numero_comprobante}
                    </TableCell>

                    <TableCell>
                      {new Date(sale.fecha).toLocaleString('es-SV')}
                    </TableCell>

                    <TableCell>{sale.cliente}</TableCell>

                    <TableCell>
                      {money(sale.subtotal)}
                    </TableCell>

                    <TableCell>
                      {money(sale.iva)}
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 800,
                        color: '#12294C',
                      }}
                    >
                      {money(sale.total)}
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          sale.estado === 'EMITIDA'
                            ? 'Emitida'
                            : sale.estado
                        }
                        sx={{
                          bgcolor:
                            sale.estado === 'EMITIDA'
                              ? '#E8F8F2'
                              : '#F0F1F4',
                          color:
                            sale.estado === 'EMITIDA'
                              ? '#078B65'
                              : '#677389',
                          fontWeight: 800,
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => showReceipt(sale)}
                        sx={{
                          textTransform: 'none',
                          color: '#4C5EFF',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Ver comprobante
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            borderTop: '1px solid #E8EDF5',
          }}
        >
          <Typography
            sx={{
              color: '#8093B1',
              fontSize: 11.5,
            }}
          >
            Los comprobantes imprimibles son de control interno;
            no sustituyen un DTE autorizado por Hacienda.
          </Typography>
        </Box>
      </Paper>

      {/* NUEVA VENTA */}
      <Dialog
        open={open}
        onClose={saving ? undefined : () => setOpen(false)}
        maxWidth="lg"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              width: 'calc(100% - 32px)',
              maxWidth: 1180,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2,
            fontWeight: 900,
            color: '#12294C',
            fontSize: 22,
          }}
        >
          Nueva venta multiproducto

          <Typography
            sx={{
              color: '#8093B1',
              fontSize: 12.5,
              mt: 0.5,
            }}
          >
            Precio automático según costo promedio WAC,
            ganancia e IVA del 13 %.
          </Typography>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            px: { xs: 2, md: 3 },
            py: 2,
          }}
        >
          <TextField
            fullWidth
            size="small"
            label="Cliente (opcional)"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            sx={{ mt: 0.5, mb: 2.5 }}
            slotProps={{
              htmlInput: { maxLength: 150 },
            }}
          />

          {/* GANANCIA GENERAL */}
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              mb: 2,
              bgcolor: '#F8FAFF',
              borderColor: '#E5EAF5',
              borderRadius: 2,
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{
                xs: 'stretch',
                sm: 'center',
              }}
            >
              <TextField
                size="small"
                type="number"
                label="Ganancia general (%)"
                value={generalMargin}
                onChange={(e) =>
                  setGeneralMargin(e.target.value)
                }
                slotProps={{
                  htmlInput: {
                    min: 0.0001,
                    step: 'any',
                  },
                }}
                sx={{
                  width: {
                    xs: '100%',
                    sm: 200,
                  },
                }}
              />

              <Button
                variant="outlined"
                onClick={applyGeneralMargin}
                sx={{
                  textTransform: 'none',
                  fontWeight: 800,
                  borderRadius: 2,
                  borderColor: '#CBD5FF',
                  color: '#4C5EFF',
                  whiteSpace: 'nowrap',
                }}
              >
                Aplicar a todos
              </Button>

              <Typography
                sx={{
                  color: '#7B90B1',
                  fontSize: 12,
                }}
              >
                Podés modificar la ganancia de cada producto.
              </Typography>
            </Stack>
          </Paper>

          {/* TABLA DE PRODUCTOS */}
          <TableContainer
            sx={{
              border: '1px solid #E5EAF2',
              borderRadius: 2,
              overflowX: 'auto',
            }}
          >
            <Table
              size="small"
              sx={{
                width: '100%',
                tableLayout: {
                  xs: 'auto',
                  md: 'fixed',
                },
                minWidth: {
                  xs: 850,
                  md: 0,
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      ...headingCell,
                      width: '29%',
                      pl: 1.5,
                    }}
                  >
                    PRODUCTO
                  </TableCell>
                  <TableCell
                    sx={{
                      ...headingCell,
                      width: '6%',
                      textAlign: 'center',
                    }}
                  >
                    STOCK
                  </TableCell>
                  <TableCell
                    sx={{
                      ...headingCell,
                      width: '10%',
                    }}
                  >
                    CANTIDAD
                  </TableCell>
                  <TableCell
                    sx={{
                      ...headingCell,
                      width: '11%',
                    }}
                  >
                    COSTO WAC
                  </TableCell>
                  <TableCell
                    sx={{
                      ...headingCell,
                      width: '12%',
                    }}
                  >
                    GANANCIA %
                  </TableCell>
                  <TableCell
                    sx={{
                      ...headingCell,
                      width: '13%',
                    }}
                  >
                    PRECIO FINAL
                  </TableCell>
                  <TableCell
                    sx={{
                      ...headingCell,
                      width: '13%',
                    }}
                  >
                    IMPORTE
                  </TableCell>
                  <TableCell
                    sx={{
                      ...headingCell,
                      width: '6%',
                    }}
                  />
                </TableRow>
              </TableHead>

              <TableBody>
                {lines.map((line) => {
                  const product = products.find(
                    (p) => p.id === Number(line.producto_id)
                  );

                  const selectedIds = lines
                    .filter((item) => item.key !== line.key)
                    .map((item) => Number(item.producto_id));

                  const price = calculateUnitPrice(
                    line,
                    products
                  );

                  return (
                    <TableRow
                      key={line.key}
                      sx={{
                        '& td': {
                          borderColor: '#EDF1F7',
                          py: 1,
                          px: 0.8,
                        },
                      }}
                    >
                      <TableCell sx={{ pl: '12px !important' }}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Producto"
                          value={line.producto_id}
                          onChange={(e) =>
                            updateLine(
                              line.key,
                              'producto_id',
                              e.target.value
                            )
                          }
                          sx={{
                            '& .MuiSelect-select': {
                              fontSize: 12,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            },
                          }}
                        >
                          {products
                            .filter(
                              (p) => !selectedIds.includes(p.id)
                            )
                            .map((p) => (
                              <MenuItem
                                key={p.id}
                                value={p.id}
                              >
                                {p.codigo} · {p.descripcion}
                              </MenuItem>
                            ))}
                        </TextField>
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          color: '#526785',
                          fontWeight: 700,
                        }}
                      >
                        {product?.stock ?? '—'}
                      </TableCell>

                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={line.cantidad}
                          onChange={(e) =>
                            updateLine(
                              line.key,
                              'cantidad',
                              e.target.value
                            )
                          }
                          slotProps={{
                            htmlInput: {
                              min: 1,
                              step: 1,
                              style: {
                                padding: '9px 6px',
                                fontSize: 12,
                              },
                            },
                          }}
                        />
                      </TableCell>

                      <TableCell
                        sx={{
                          fontSize: 12,
                          color: '#526785',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {product
                          ? money(product.costo_promedio)
                          : '—'}
                      </TableCell>

                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={line.porcentaje_ganancia}
                          onChange={(e) =>
                            updateLine(
                              line.key,
                              'porcentaje_ganancia',
                              e.target.value
                            )
                          }
                          slotProps={{
                            htmlInput: {
                              min: 0.0001,
                              step: 'any',
                              style: {
                                padding: '9px 6px',
                                fontSize: 12,
                              },
                            },
                          }}
                        />
                      </TableCell>

                      <TableCell
                        sx={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: '#173154',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {product ? money(price) : '—'}
                      </TableCell>

                      <TableCell
                        sx={{
                          fontSize: 12,
                          fontWeight: 900,
                          color: '#12294C',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {money(
                          round(
                            Number(line.cantidad || 0) * price
                          )
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <Tooltip title="Quitar producto">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={lines.length === 1}
                              onClick={() =>
                                setLines((previous) =>
                                  previous.filter(
                                    (item) =>
                                      item.key !== line.key
                                  )
                                )
                              }
                            >
                              <Trash2 size={17} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Button
            onClick={() =>
              setLines((previous) => [
                ...previous,
                newLine(),
              ])
            }
            disabled={lines.length >= products.length}
            sx={{
              mt: 1.5,
              textTransform: 'none',
              fontWeight: 800,
              color: '#4C5EFF',
            }}
          >
            + Agregar producto
          </Button>

          {products.length === 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              No hay productos con stock disponible.
            </Alert>
          )}

          <Divider sx={{ my: 2 }} />

          {/* RESUMEN DE VENTA */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <Box
              sx={{
                width: {
                  xs: '100%',
                  sm: 330,
                },
                bgcolor: '#F8FAFF',
                border: '1px solid #E5EAF5',
                borderRadius: 2,
                p: 2,
              }}
            >
              <Stack spacing={1}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                >
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: '#7184A5',
                    }}
                  >
                    Venta neta
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    {money(computed.net)}
                  </Typography>
                </Stack>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                >
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: '#7184A5',
                    }}
                  >
                    IVA incluido (13 %)
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    {money(computed.tax)}
                  </Typography>
                </Stack>

                <Divider />

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: '#12294C',
                    }}
                  >
                    Total a cobrar
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: '#4C5EFF',
                    }}
                  >
                    {money(computed.total)}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            gap: 1,
          }}
        >
          <Button
            disabled={saving}
            onClick={() => setOpen(false)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            disabled={saving || products.length === 0}
            onClick={saveSale}
            sx={primaryButton}
          >
            {saving
              ? 'Registrando…'
              : 'Confirmar venta'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* COMPROBANTE */}
      <Dialog
        open={Boolean(receipt)}
        onClose={() => setReceipt(null)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3 },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 900,
            color: '#12294C',
          }}
        >
          Comprobante {receipt?.numero_comprobante}
        </DialogTitle>

        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Comprobante interno. No constituye una factura
            electrónica DTE autorizada.
          </Alert>

          <Typography>
            <strong>Cliente:</strong> {receipt?.cliente}
          </Typography>

          <Typography>
            <strong>Fecha:</strong>{' '}
            {receipt?.fecha
              ? new Date(receipt.fecha).toLocaleString('es-SV')
              : ''}
          </Typography>

          <TableContainer sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[
                    'Producto',
                    'Cantidad',
                    'Precio final',
                    'Importe',
                  ].map((title) => (
                    <TableCell
                      key={title}
                      sx={headingCell}
                    >
                      {title}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {(receipt?.detalles || []).map((detail) => (
                  <TableRow key={detail.id}>
                    <TableCell>
                      {detail.producto_codigo} ·{' '}
                      {detail.producto_descripcion}
                    </TableCell>
                    <TableCell>
                      {detail.cantidad}
                    </TableCell>
                    <TableCell>
                      {money(detail.precio_unitario)}
                    </TableCell>
                    <TableCell>
                      {money(detail.subtotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack
            alignItems="flex-end"
            spacing={1}
            sx={{ mt: 2 }}
          >
            <Typography>
              Venta neta: {money(receipt?.subtotal)}
            </Typography>
            <Typography>
              IVA incluido: {money(receipt?.iva)}
            </Typography>
            <Typography
              variant="h6"
              fontWeight={900}
              color="#12294C"
            >
              Total: {money(receipt?.total)}
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setReceipt(null)}
            sx={{ textTransform: 'none' }}
          >
            Cerrar
          </Button>

          <Button
            variant="contained"
            sx={primaryButton}
            onClick={() => {
              try {
                printableReceipt(receipt);
              } catch (error) {
                notify(error.message);
              }
            }}
          >
            Imprimir comprobante
          </Button>
        </DialogActions>
      </Dialog>

      {/* NOTIFICACIONES */}
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={6000}
        onClose={() => setNotice(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Alert
          severity={notice?.severity || 'error'}
          onClose={() => setNotice(null)}
        >
          {notice?.message || ''}
        </Alert>
      </Snackbar>
    </Box>
  );
}
