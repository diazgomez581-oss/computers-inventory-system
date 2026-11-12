
import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Paper, Typography, TextField, MenuItem, Button, Alert,
  CircularProgress, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Chip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { API_URL as CONFIGURED_API_URL } from '../api';

const LOCAL = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const BASE = (
  LOCAL ? 'http://127.0.0.1:8000' :
  CONFIGURED_API_URL || import.meta.env.VITE_API_URL ||
  'https://computers-backend-bpk0.onrender.com'
).replace(/\/+$/, '').replace(/\/api$/, '');

const COLORS = {
  blue: '#4C67ED', dark: '#17243B', muted: '#8190A5',
  green: '#16866C', red: '#C65353', border: '#E8EDF4'
};

const money = n => Number(n ?? 0).toLocaleString('en-US', {
  style: 'currency', currency: 'USD'
});
const unit = n => Number(n ?? 0).toFixed(4);
const date = n => n ? new Date(n).toLocaleString('es-SV') : '—';

const paper = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: '14px',
  boxShadow: 'none',
  background: '#fff'
};

async function api(path) {
  const user = JSON.parse(localStorage.getItem('stb_user') || 'null');
  const response = await fetch(`${BASE}/api${path}`, {
    headers: user?.token ? { Authorization: `Token ${user.token}` } : {}
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? 'Sesión inválida. Cerrá sesión e ingresá nuevamente.'
        : data.detail || data.error || `Error HTTP ${response.status}`
    );
  }
  return data;
}

function Indicador({ label, value }) {
  return (
    <Box sx={{ flex: 1, minWidth: 150 }}>
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.muted }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 20, fontWeight: 800, color: COLORS.dark }}>
        {value}
      </Typography>
    </Box>
  );
}

const head = {
  fontSize: 11, fontWeight: 800, color: '#64748B',
  background: '#F8FAFF', whiteSpace: 'nowrap',
  borderBottom: `1px solid ${COLORS.border}`
};
const cell = {
  fontSize: 12, color: COLORS.dark, whiteSpace: 'nowrap',
  borderBottom: `1px solid ${COLORS.border}`
};

export default function Kardex() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [productoId, setProductoId] = useState('');
  const [kardex, setKardex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const items = [];
        const visited = new Set();
        let path = '/productos/';

        while (path && !visited.has(path)) {
          visited.add(path);
          const data = await api(path);
          items.push(...(Array.isArray(data) ? data : data.results || []));
          if (!data.next) break;

          const next = new URL(data.next, `${BASE}/api/`);
          const root = new URL(`${BASE}/api/`);
          if (next.origin !== root.origin ||
              !next.pathname.startsWith(root.pathname)) {
            throw new Error('URL de paginación no válida.');
          }
          path = next.pathname.slice(root.pathname.length - 1) + next.search;
        }
        if (active) setProductos(items);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoadingProducts(false);
      }
    }

    loadProducts();
    return () => { active = false; requestId.current++; };
  }, []);

  async function loadKardex(id) {
    const current = ++requestId.current;
    setKardex(null);
    setError('');
    if (!id) return;

    setLoading(true);
    try {
      const data = await api(`/kardex/?producto_id=${encodeURIComponent(id)}`);
      if (current === requestId.current) setKardex(data);
    } catch (e) {
      if (current === requestId.current) setError(e.message);
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }

  const filtered = productos.filter(p =>
    [p.codigo, p.descripcion, p.marca, p.modelo]
      .filter(Boolean).join(' ').toLowerCase()
      .includes(busqueda.toLowerCase().trim())
  );

  const p = kardex?.producto;
  const r = kardex?.resumen;
  const movimientos = kardex?.movimientos || [];

  const numericCells = m => {
    const entry = m.entrada || {};
    const exit = m.salida || {};
    const balance = m.saldo || {};

    return [
      entry.cantidad || '—',
      entry.cantidad ? unit(entry.costo_unitario) : '—',
      entry.cantidad ? money(entry.total) : '—',
      exit.cantidad || '—',
      exit.cantidad ? unit(exit.costo_unitario) : '—',
      exit.cantidad ? money(exit.total) : '—',
      balance.cantidad ?? '—',
      unit(balance.costo_promedio),
      money(balance.total)
    ];
  };

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <Box sx={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.dark }}>
            Tarjeta Kárdex Perpetua
          </Typography>
          <Typography sx={{ fontSize: 13, color: COLORS.muted }}>
            Método de costo promedio ponderado móvil (WAC)
          </Typography>
        </Box>
        <Button
          variant="outlined" startIcon={<RefreshIcon />}
          disabled={!productoId || loading}
          onClick={() => loadKardex(productoId)}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Actualizar
        </Button>
      </Box>

      <Paper sx={{ ...paper, p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small" label="Buscar producto"
            placeholder="Código, descripción, marca..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            sx={{ flex: 1, minWidth: 220 }}
          />
          <TextField
            select size="small" label="Seleccionar producto"
            value={productoId}
            onChange={e => {
              setProductoId(e.target.value);
              loadKardex(e.target.value);
            }}
            sx={{ flex: 1, minWidth: 220 }}
          >
            <MenuItem value="">Seleccionar...</MenuItem>
            {filtered.map(item => (
              <MenuItem key={item.id} value={String(item.id)}>
                {item.codigo} — {item.descripcion}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Typography sx={{ fontSize: 11, color: COLORS.muted, mt: 1 }}>
          {loadingProducts ? 'Cargando catálogo...' : `${filtered.length} productos encontrados`}
        </Typography>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading && (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <CircularProgress size={28} />
          <Typography sx={{ mt: 1, color: COLORS.muted }}>
            Consultando movimientos...
          </Typography>
        </Box>
      )}

      {!loading && !kardex && !error && (
        <Paper sx={{ ...paper, p: 5, textAlign: 'center' }}>
          <Typography sx={{ color: COLORS.muted }}>
            Seleccioná un producto para consultar su historial Kárdex.
          </Typography>
        </Paper>
      )}

      {!loading && kardex && (
        <>
          <Paper sx={{ ...paper, p: 2, mb: 2 }}>
            <Typography sx={{ fontWeight: 800, color: COLORS.dark, mb: 1.5 }}>
              {p?.codigo} — {p?.descripcion}
            </Typography>
            <Box sx={{
              display: 'flex', gap: 2, flexWrap: 'wrap',
              pt: 1.5, borderTop: `1px solid ${COLORS.border}`
            }}>
              <Indicador label="EXISTENCIAS" value={`${p?.stock_actual ?? 0} unidades`} />
              <Indicador label="COSTO PROMEDIO WAC" value={`$${unit(p?.costo_promedio_actual)}`} />
              <Indicador label="VALOR DEL INVENTARIO" value={money(p?.valor_inventario_actual)} />
            </Box>
          </Paper>

          {r?.saldo_coincide_con_inventario === false && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              El saldo del Kárdex no coincide con el inventario actual.
            </Alert>
          )}

          <Paper sx={{ ...paper, overflow: 'hidden' }}>
            <Box sx={{
              px: 2, py: 1.5, display: 'flex',
              justifyContent: 'space-between', alignItems: 'center'
            }}>
              <Typography sx={{ fontWeight: 800, color: COLORS.dark }}>
                Historial de movimientos
              </Typography>
              <Typography sx={{ fontSize: 12, color: COLORS.muted }}>
                {movimientos.length} registros
              </Typography>
            </Box>

            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 1100 }}>
                <TableHead>
                  <TableRow>
                    <TableCell rowSpan={2} sx={head}>Fecha</TableCell>
                    <TableCell rowSpan={2} sx={head}>Detalle</TableCell>
                    {[
                      ['ENTRADAS', COLORS.green],
                      ['SALIDAS', COLORS.red],
                      ['SALDOS', COLORS.blue]
                    ].map(([title, color]) => (
                      <TableCell key={title} colSpan={3} align="center"
                        sx={{ ...head, color }}>
                        {title}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    {[
                      'Cant.', 'C. U.', 'Total',
                      'Cant.', 'C. U.', 'Total',
                      'Cant.', 'C. U. Prom.', 'Total'
                    ].map((title, i) => (
                      <TableCell key={i} align="right" sx={head}>
                        {title}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {movimientos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} align="center"
                        sx={{ py: 4, color: COLORS.muted }}>
                        No hay movimientos registrados.
                      </TableCell>
                    </TableRow>
                  )}

                  {movimientos.map(m => (
                    <TableRow key={m.id} hover>
                      <TableCell sx={cell}>{date(m.fecha)}</TableCell>
                      <TableCell sx={{ ...cell, minWidth: 210, whiteSpace: 'normal' }}>
                        <Chip size="small"
                          label={m.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'}
                          color={m.tipo === 'ENTRADA' ? 'success' : 'warning'}
                          sx={{ mr: 1, mb: 0.5 }}
                        />
                        {m.detalle}
                      </TableCell>
                      {numericCells(m).map((value, i) => (
                        <TableCell key={i} align="right" sx={{
                          ...cell,
                          fontWeight: i === 6 || i === 8 ? 800 : 400,
                          color: i === 8 ? COLORS.blue : COLORS.dark
                        }}>
                          {value}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{
              display: 'flex', flexWrap: 'wrap', gap: 3,
              px: 2, py: 2, background: '#F8FAFF',
              borderTop: `1px solid ${COLORS.border}`
            }}>
              <Indicador label="TOTAL ENTRADAS"
                value={`${r?.total_unidades_entrada ?? 0} u. · ${money(r?.total_valor_entrada)}`} />
              <Indicador label="TOTAL SALIDAS"
                value={`${r?.total_unidades_salida ?? 0} u. · ${money(r?.total_valor_salida)}`} />
              <Indicador label="SALDO FINAL"
                value={`${p?.stock_actual ?? 0} u. · ${money(p?.valor_inventario_actual)}`} />
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
}
