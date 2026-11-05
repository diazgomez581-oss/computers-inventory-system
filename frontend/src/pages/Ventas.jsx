import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, InputLabel, MenuItem,
  Paper, Select, Snackbar, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { API_URL } from '../api';

const BASE_URL = `${String(API_URL).replace(/\/+$/, '').replace(/\/api$/, '')}/api`;
const USD = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });
const money = (value) => USD.format(Number(value || 0));
const round = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const today = () => new Date().toISOString().slice(0, 7);

function getToken() {
  try { return JSON.parse(localStorage.getItem('stb_user') || 'null')?.token || ''; }
  catch { return ''; }
}

async function api(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Token ${getToken()}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  let data;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok) {
    const detail = data?.detail || data?.non_field_errors || data?.productos || data?.mensaje;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail || data || `Error HTTP ${response.status}`));
  }
  return data;
}

function newLine() { return { key: `${Date.now()}-${Math.random()}`, producto_id: '', cantidad: '1', precio_unitario: '' }; }

function printableReceipt(venta) {
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const details = (venta.detalles || []).map((d) => `<tr><td>${escape(d.producto_codigo || '')} - ${escape(d.producto_descripcion || '')}</td><td class="num">${escape(d.cantidad)}</td><td class="num">${money(d.precio_unitario)}</td><td class="num">${money(d.subtotal)}</td></tr>`).join('');
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"/><title>${escape(venta.numero_comprobante || 'Comprobante')}</title><style>body{font-family:Arial,sans-serif;color:#17233b;max-width:760px;margin:35px auto;padding:0 18px}h1{margin-bottom:4px}small{color:#64748b}table{border-collapse:collapse;width:100%;margin-top:24px}th,td{border-bottom:1px solid #ddd;padding:10px;text-align:left;font-size:13px}.num{text-align:right}.totals{margin:24px 0 0 auto;max-width:300px}.totals div{display:flex;justify-content:space-between;margin:10px 0}.grand{font-size:19px;font-weight:bold;border-top:2px solid #17233b;padding-top:12px}.note{margin-top:38px;font-size:12px;color:#64748b}@media print{body{margin:0;max-width:none}}</style></head><body><h1>STB Computers</h1><small>Comprobante interno de venta — No constituye DTE autorizado</small><p><strong>Comprobante:</strong> ${escape(venta.numero_comprobante)}<br/><strong>Fecha:</strong> ${escape(new Date(venta.fecha).toLocaleString('es-SV'))}<br/><strong>Cliente:</strong> ${escape(venta.cliente || 'Consumidor final')}</p><table><thead><tr><th>Producto</th><th class="num">Cantidad</th><th class="num">Precio final</th><th class="num">Importe</th></tr></thead><tbody>${details}</tbody></table><div class="totals"><div><span>Venta neta</span><strong>${money(venta.subtotal)}</strong></div><div><span>IVA incluido (13%)</span><strong>${money(venta.iva)}</strong></div><div class="grand"><span>Total cobrado</span><span>${money(venta.total)}</span></div></div><p class="note">Documento para control interno. La emisión de factura electrónica fiscal requiere el procedimiento autorizado por el Ministerio de Hacienda de El Salvador.</p></body></html>`;
  const popup = window.open('', '_blank', 'width=900,height=800');
  if (!popup) throw new Error('El navegador bloqueó la ventana de impresión. Habilita las ventanas emergentes.');
  popup.document.open(); popup.document.write(html); popup.document.close(); popup.focus();
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
  const [notice, setNotice] = useState(null);

  const notify = (message, severity = 'error') => setNotice({ message, severity });
  const loadSales = useCallback(async () => {
    const [year, month] = period.split('-');
    setLoading(true);
    try {
      const query = `?anio=${encodeURIComponent(year)}&mes=${encodeURIComponent(Number(month))}`;
      const [list, totals] = await Promise.all([api(`/ventas/${query}`), api(`/ventas/resumen/${query}`)]);
      setSales(Array.isArray(list) ? list : (list?.results || []));
      setSummary(totals);
    } catch (err) { notify(err.message); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { loadSales(); }, [loadSales]);

  const openNewSale = async () => {
    try {
      const available = await api('/ventas/productos/');
      setProducts(Array.isArray(available) ? available : (available?.results || []));
      setCustomer('Consumidor final'); setLines([newLine()]); setOpen(true);
    } catch (err) { notify(err.message); }
  };

  const updateLine = (key, field, value) => setLines((prev) => prev.map((line) => line.key === key ? { ...line, [field]: value } : line));
  const computed = useMemo(() => {
    const total = round(lines.reduce((sum, line) => sum + round(Number(line.cantidad || 0) * Number(line.precio_unitario || 0)), 0));
    const net = round(total / 1.13);
    return { total, net, tax: round(total - net) };
  }, [lines]);

  const saveSale = async () => {
    const ids = lines.map((line) => Number(line.producto_id));
    if (!lines.length || ids.some((id) => !id)) return notify('Selecciona un producto en cada fila.');
    if (new Set(ids).size !== ids.length) return notify('No repitas productos; modifica la cantidad en la fila existente.');
    for (const line of lines) {
      const product = products.find((p) => p.id === Number(line.producto_id));
      const quantity = Number(line.cantidad);
      const price = Number(line.precio_unitario);
      if (!Number.isInteger(quantity) || quantity < 1) return notify('Las cantidades deben ser enteros mayores que cero.');
      if (!Number.isFinite(price) || price <= 0 || round(price) !== price) return notify('Introduce precios válidos con un máximo de dos decimales.');
      if (product && quantity > product.stock) return notify(`Stock insuficiente para ${product.descripcion}. Disponible: ${product.stock}.`);
    }
    setSaving(true);
    try {
      const result = await api('/ventas/', {
        method: 'POST',
        body: JSON.stringify({
          cliente: customer.trim() || 'Consumidor final',
          productos: lines.map((line) => ({ producto_id: Number(line.producto_id), cantidad: Number(line.cantidad), precio_unitario: Number(line.precio_unitario).toFixed(2) })),
        }),
      });
      setOpen(false); setReceipt(result); notify(`Venta ${result.numero_comprobante} registrada correctamente.`, 'success');
      await loadSales();
    } catch (err) { notify(err.message); }
    finally { setSaving(false); }
  };

  const showReceipt = async (sale) => {
    try { setReceipt(await api(`/ventas/${sale.id}/`)); }
    catch (err) { notify(err.message); }
  };

  const visibleSales = sales.filter((sale) => `${sale.numero_comprobante || ''} ${sale.cliente || ''}`.toLowerCase().includes(search.toLowerCase()));
  const headingCell = { fontWeight: 800, fontSize: 12, letterSpacing: 0.3, color: '#7184A5', bgcolor: '#F5F7FC', py: 1.8, whiteSpace: 'nowrap', borderBottom: '1px solid #E3E9F4' };
  const cardStyle = { border: '1px solid #E2E9F4', borderRadius: '14px', bgcolor: '#FFFFFF', boxShadow: 'none' };
  const primaryButton = { bgcolor: '#4C5EFF', '&:hover': { bgcolor: '#394BDF' }, color: '#fff', textTransform: 'none', fontWeight: 800, borderRadius: '9px', px: 3, py: 1.25, boxShadow: '0 4px 10px rgba(76,94,255,.16)' };
  const [year, month] = period.split('-');
  const monthLabel = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('es-SV', { month: 'long', year: 'numeric' });
  const metrics = [
    { label: 'VENTAS NETAS', value: summary?.ventas_netas, color: '#5363FF' },
    { label: 'IVA DÉBITO', value: summary?.iva_debito, color: '#E39929' },
    { label: 'TOTAL COBRADO', value: summary?.total_cobrado, color: '#159684' },
    { label: 'UTILIDAD BRUTA', value: summary?.utilidad_bruta, color: '#5363FF' },
  ];

  return (
    <Box sx={{ maxWidth: 1250, mx: 'auto', pb: 6, color: '#152B4E' }}>
      <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: { xs: 27, md: 32 }, fontWeight: 900, letterSpacing: -0.6, color: '#12294C' }}>Facturación y Ventas</Typography>
          <Typography sx={{ color: '#7B90B1', fontSize: 14 }}>VENT-01 · Registro y control de ventas</Typography>
        </Box>
        <Button variant="contained" onClick={openNewSale} sx={{ ...primaryButton, ml: { sm: 'auto' }, flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'center' } }}>+ Nueva venta</Button>
      </Box>

      <Paper sx={{ ...cardStyle, p: { xs: 2, md: 2.5 }, mb: 2.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#142C51', mr: 1 }}>Período contable</Typography>
          <TextField select size="small" label="Mes" value={month} onChange={(e) => setPeriod(`${year}-${e.target.value}`)} sx={{ minWidth: 165 }}>
            {Array.from({ length: 12 }, (_, i) => {
              const value = String(i + 1).padStart(2, '0');
              return <MenuItem key={value} value={value}>{new Date(2026, i, 1).toLocaleDateString('es-SV', { month: 'long' })}</MenuItem>;
            })}
          </TextField>
          <TextField size="small" label="Año" type="number" value={year} onChange={(e) => { if (/^\d{0,4}$/.test(e.target.value)) setPeriod(`${e.target.value}-${month}`); }} sx={{ width: { xs: '100%', sm: 120 } }} slotProps={{ htmlInput: { min: 2000, max: 2100 } }} />
          <Button variant="outlined" disabled={loading || year.length !== 4} onClick={loadSales} sx={{ textTransform: 'none', fontWeight: 800, borderColor: '#DCE4FF', color: '#4C5EFF', borderRadius: 2 }}>↻ Actualizar</Button>
        </Stack>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {metrics.map((metric) => (
          <Paper key={metric.label} sx={{ ...cardStyle, p: 2.5, minHeight: 154 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ color: '#6E83A6', fontSize: 11.5, fontWeight: 900, letterSpacing: 0.55 }}>{metric.label}</Typography>
              <Box sx={{ width: 10, height: 10, bgcolor: metric.color, borderRadius: '50%' }} />
            </Stack>
            <Typography sx={{ fontSize: { xs: 27, lg: 29 }, fontWeight: 900, color: '#12294C', my: 1.2 }}>{money(metric.value)}</Typography>
            <Chip label={monthLabel} size="small" sx={{ bgcolor: `${metric.color}15`, color: metric.color, fontWeight: 800, fontSize: 11, borderRadius: '7px' }} />
          </Paper>
        ))}
      </Box>

      <Paper sx={{ ...cardStyle, overflow: 'hidden' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} sx={{ px: 2.5, py: 2.5 }}>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 20, color: '#12294C' }}>Historial de ventas</Typography>
            <Typography sx={{ fontSize: 12, color: '#8093B1' }}>{monthLabel} · {visibleSales.length} registros</Typography>
          </Box>
          <TextField size="small" placeholder="Buscar comprobante o cliente" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: { sm: 270 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow>{['COMPROBANTE', 'FECHA', 'CLIENTE', 'VENTA NETA', 'IVA', 'TOTAL', 'ESTADO', 'ACCIONES'].map((h) => <TableCell key={h} sx={headingCell}>{h}</TableCell>)}</TableRow></TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress size={26} /></TableCell></TableRow>
                : visibleSales.length === 0 ? <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: '#8192AB' }}>No hay ventas registradas en este período.</TableCell></TableRow>
                : visibleSales.map((sale) => <TableRow key={sale.id} hover sx={{ '& td': { py: 1.8, borderColor: '#E8EDF5', fontSize: 13 } }}>
                    <TableCell sx={{ fontWeight: 800, color: '#173154' }}>{sale.numero_comprobante}</TableCell>
                    <TableCell>{new Date(sale.fecha).toLocaleString('es-SV')}</TableCell>
                    <TableCell>{sale.cliente}</TableCell>
                    <TableCell>{money(sale.subtotal)}</TableCell>
                    <TableCell>{money(sale.iva)}</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#12294C' }}>{money(sale.total)}</TableCell>
                    <TableCell><Chip size="small" label={sale.estado === 'EMITIDA' ? 'Emitida' : sale.estado} sx={{ bgcolor: sale.estado === 'EMITIDA' ? '#E8F8F2' : '#F0F1F4', color: sale.estado === 'EMITIDA' ? '#078B65' : '#677389', fontWeight: 800 }} /></TableCell>
                    <TableCell><Button size="small" onClick={() => showReceipt(sale)} sx={{ textTransform: 'none', color: '#4C5EFF', fontWeight: 800, whiteSpace: 'nowrap' }}>Ver comprobante</Button></TableCell>
                  </TableRow>)}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid #E8EDF5' }}>
          <Typography sx={{ color: '#8093B1', fontSize: 11.5 }}>Los comprobantes imprimibles son de control interno; no sustituyen un DTE autorizado por Hacienda.</Typography>
        </Box>
      </Paper>

      <Dialog open={open} onClose={saving ? undefined : () => setOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 900, color: '#12294C', fontSize: 23 }}>Nueva venta multiproducto<Typography color="text.secondary" variant="body2">Precios finales con IVA incluido · Consumidor final</Typography></DialogTitle>
        <DialogContent dividers>
          <TextField fullWidth size="small" label="Cliente (opcional)" value={customer} onChange={(e) => setCustomer(e.target.value)} sx={{ mt: 1, mb: 3 }} inputProps={{ maxLength: 150 }} />
          <TableContainer sx={{ border: '1px solid #e5eaf2', borderRadius: 2 }}><Table size="small"><TableHead><TableRow><TableCell sx={headingCell}>Producto</TableCell><TableCell sx={headingCell}>Stock</TableCell><TableCell sx={headingCell}>Cantidad</TableCell><TableCell sx={headingCell}>Precio final unitario</TableCell><TableCell sx={headingCell}>Importe</TableCell><TableCell sx={headingCell} /></TableRow></TableHead><TableBody>
            {lines.map((line) => {
              const product = products.find((p) => p.id === Number(line.producto_id));
              const selectedIds = lines.filter((l) => l.key !== line.key).map((l) => Number(l.producto_id));
              return <TableRow key={line.key}>
                <TableCell sx={{ minWidth: 270 }}><FormControl fullWidth size="small"><InputLabel>Seleccionar producto</InputLabel><Select label="Seleccionar producto" value={line.producto_id} onChange={(e) => updateLine(line.key, 'producto_id', e.target.value)}>{products.filter((p) => !selectedIds.includes(p.id)).map((p) => <MenuItem key={p.id} value={p.id}>{p.codigo} · {p.descripcion}</MenuItem>)}</Select></FormControl></TableCell>
                <TableCell>{product?.stock ?? '—'}</TableCell>
                <TableCell sx={{ minWidth: 100 }}><TextField size="small" type="number" value={line.cantidad} onChange={(e) => updateLine(line.key, 'cantidad', e.target.value)} slotProps={{ htmlInput: { min: 1, step: 1 } }} /></TableCell>
                <TableCell sx={{ minWidth: 145 }}><TextField size="small" type="number" value={line.precio_unitario} onChange={(e) => updateLine(line.key, 'precio_unitario', e.target.value)} slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }} /></TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{money(round(Number(line.cantidad || 0) * Number(line.precio_unitario || 0)))}</TableCell>
                <TableCell><Button size="small" color="error" disabled={lines.length === 1} onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}>Quitar</Button></TableCell>
              </TableRow>;
            })}
          </TableBody></Table></TableContainer>
          <Button sx={{ mt: 2, textTransform: 'none' }} onClick={() => setLines((prev) => [...prev, newLine()])} disabled={lines.length >= products.length}>+ Agregar producto</Button>
          {products.length === 0 && <Alert severity="warning" sx={{ mt: 2 }}>No hay productos con stock disponible. Registra existencias antes de facturar.</Alert>}
          <Divider sx={{ my: 2 }} />
          <Stack alignItems="flex-end" spacing={1}><Typography>Venta neta: <strong>{money(computed.net)}</strong></Typography><Typography>IVA incluido (13%): <strong>{money(computed.tax)}</strong></Typography><Typography variant="h5" fontWeight={800} color="#17335a">Total a cobrar: {money(computed.total)}</Typography></Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}><Button onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button><Button variant="contained" onClick={saveSale} disabled={saving || products.length === 0} sx={primaryButton}>{saving ? 'Registrando…' : 'Confirmar venta'}</Button></DialogActions>
      </Dialog>

      <Dialog open={Boolean(receipt)} onClose={() => setReceipt(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Comprobante {receipt?.numero_comprobante}</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>Comprobante interno. No constituye una factura electrónica DTE autorizada.</Alert>
          <Typography><strong>Cliente:</strong> {receipt?.cliente}</Typography><Typography><strong>Fecha:</strong> {receipt?.fecha ? new Date(receipt.fecha).toLocaleString('es-SV') : ''}</Typography>
          <TableContainer sx={{ mt: 2 }}><Table size="small"><TableHead><TableRow>{['Producto', 'Cantidad', 'Precio final', 'Importe'].map((h) => <TableCell key={h} sx={headingCell}>{h}</TableCell>)}</TableRow></TableHead><TableBody>{(receipt?.detalles || []).map((d) => <TableRow key={d.id}><TableCell>{d.producto_codigo} · {d.producto_descripcion}</TableCell><TableCell>{d.cantidad}</TableCell><TableCell>{money(d.precio_unitario)}</TableCell><TableCell>{money(d.subtotal)}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
          <Stack alignItems="flex-end" spacing={1} sx={{ mt: 2 }}><Typography>Venta neta: {money(receipt?.subtotal)}</Typography><Typography>IVA incluido: {money(receipt?.iva)}</Typography><Typography variant="h6" fontWeight={800}>Total: {money(receipt?.total)}</Typography></Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setReceipt(null)}>Cerrar</Button><Button variant="contained" onClick={() => { try { printableReceipt(receipt); } catch (err) { notify(err.message); } }}>Imprimir comprobante</Button></DialogActions>
      </Dialog>
      <Snackbar open={Boolean(notice)} autoHideDuration={6000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}><Alert severity={notice?.severity || 'error'} onClose={() => setNotice(null)}>{notice?.message || ''}</Alert></Snackbar>
    </Box>
  );
}
