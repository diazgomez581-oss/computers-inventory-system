import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, MenuItem, Paper, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography
} from '@mui/material';
import { API_URL } from '../api';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const AZUL = '#4F63F5';
const MARINO = '#172744';
const BORDE = '#E5EAF3';
const VACIO = { total_administracion: '0.00', total_venta: '0.00', total_gastos: '0.00', cantidad_registros: 0 };

function hoyLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const nuevoFormulario = () => ({ fecha: hoyLocal(), categoria: 'ADMINISTRACION', descripcion: '', monto: '' });
const dinero = (valor) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(valor) || 0);
const fechaVisible = (fecha) => fecha ? fecha.split('-').reverse().join('/') : '—';

function urlApi(ruta) {
  const base = String(API_URL || '').replace(/\/+$/, '');
  const api = base.endsWith('/api') ? base : `${base}/api`;
  return `${api}/${ruta.replace(/^\/+/, '')}`;
}

async function api(ruta, opciones = {}) {
  let usuario;
  try { usuario = JSON.parse(localStorage.getItem('stb_user') || 'null'); } catch { usuario = null; }
  if (!usuario?.token) throw new Error('La sesión no está disponible. Inicia sesión nuevamente.');
  const respuesta = await fetch(urlApi(ruta), {
    ...opciones,
    headers: {
      Authorization: `Token ${usuario.token}`,
      ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
      ...opciones.headers
    }
  });
  if (respuesta.status === 204) return null;
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    if (respuesta.status === 401 || respuesta.status === 403) throw new Error('No tienes autorización para realizar esta operación.');
    const detalle = datos?.detail || (datos && typeof datos === 'object'
      ? Object.entries(datos).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
      : null);
    throw new Error(detalle || `No se pudo completar la solicitud (${respuesta.status}).`);
  }
  return datos;
}

function Indicador({ titulo, valor, subtitulo, color, fondo }) {
  return (
    <Paper elevation={0} sx={{ flex: '1 1 240px', minWidth: 0, p: 2.5, border: `1px solid ${BORDE}`, borderRadius: 3, bgcolor: '#FFF' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ color: '#667B9D', fontSize: 12, fontWeight: 700, letterSpacing: '.2px' }}>{titulo}</Typography>
        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      </Box>
      <Typography sx={{ color: MARINO, fontWeight: 800, fontSize: { xs: 25, sm: 30 }, mt: 1 }}>{dinero(valor)}</Typography>
      <Box sx={{ display: 'inline-flex', bgcolor: fondo, borderRadius: 1.5, px: 1, py: 0.5, mt: 1 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color }}>{subtitulo}</Typography>
      </Box>
    </Paper>
  );
}

export default function Gastos() {
  const [periodo, setPeriodo] = useState(() => ({ anio: new Date().getFullYear(), mes: new Date().getMonth() + 1 }));
  const [gastos, setGastos] = useState([]);
  const [resumen, setResumen] = useState(VACIO);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formulario, setFormulario] = useState(nuevoFormulario);
  const [eliminando, setEliminando] = useState(null);
  const [errorFormulario, setErrorFormulario] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const query = `anio=${periodo.anio}&mes=${periodo.mes}`;
      const [lista, total] = await Promise.all([
        api(`gastos/?${query}`),
        api(`gastos/resumen-mensual/?${query}`)
      ]);
      setGastos(Array.isArray(lista) ? lista : Array.isArray(lista?.results) ? lista.results : []);
      setResumen(total || VACIO);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [periodo.anio, periodo.mes]);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = useMemo(() => gastos.filter((g) =>
    `${g.descripcion} ${g.categoria_nombre || g.categoria}`.toLocaleLowerCase('es')
      .includes(busqueda.trim().toLocaleLowerCase('es'))
  ), [gastos, busqueda]);

  function abrirNuevo() {
    setEditando(null);
    setFormulario({ ...nuevoFormulario(), fecha: `${periodo.anio}-${String(periodo.mes).padStart(2, '0')}-${String(Math.min(new Date().getDate(), new Date(periodo.anio, periodo.mes, 0).getDate())).padStart(2, '0')}` });
    setErrorFormulario('');
    setAbierto(true);
  }
  function abrirEditar(g) {
    setEditando(g);
    setFormulario({ fecha: g.fecha, categoria: g.categoria, descripcion: g.descripcion, monto: String(g.monto) });
    setErrorFormulario('');
    setAbierto(true);
  }
  function campo(nombre, valor) { setFormulario((prev) => ({ ...prev, [nombre]: valor })); }

  async function guardar(e) {
    e.preventDefault();
    setErrorFormulario('');
    const monto = Number(formulario.monto);
    if (!formulario.fecha || !formulario.descripcion.trim() || !['ADMINISTRACION', 'VENTA'].includes(formulario.categoria)) {
      setErrorFormulario('Completa correctamente todos los campos.');
      return;
    }
    if (!Number.isFinite(monto) || monto <= 0 || monto > 9999999999.99 || !/^\d+(\.\d{1,2})?$/.test(String(formulario.monto))) {
      setErrorFormulario('Ingresa un monto positivo con máximo dos decimales.');
      return;
    }
    setGuardando(true);
    try {
      await api(editando ? `gastos/${editando.id}/` : 'gastos/', {
        method: editando ? 'PATCH' : 'POST',
        body: JSON.stringify({ fecha: formulario.fecha, categoria: formulario.categoria,
          descripcion: formulario.descripcion.trim(), monto: monto.toFixed(2) })
      });
      setAbierto(false);
      setExito(editando ? 'Gasto actualizado correctamente.' : 'Gasto registrado correctamente.');
      const [anio, mes] = formulario.fecha.split('-').map(Number);
      if (anio !== periodo.anio || mes !== periodo.mes) setPeriodo({ anio, mes });
      else await cargar();
    } catch (err) { setErrorFormulario(err.message); }
    finally { setGuardando(false); }
  }

  async function eliminar() {
    if (!eliminando) return;
    setGuardando(true);
    setError('');
    try {
      await api(`gastos/${eliminando.id}/`, { method: 'DELETE' });
      setEliminando(null);
      setExito('Gasto eliminado correctamente.');
      await cargar();
    } catch (e) { setError(e.message); }
    finally { setGuardando(false); }
  }

  const tituloPeriodo = `${MESES[periodo.mes - 1]} ${periodo.anio}`;
  const boton = { textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 2.3 };

  return (
    <Box sx={{ maxWidth: 1160, mx: 'auto', pb: 5 }}>
      <Box sx={{ display: 'flex', alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography sx={{ color: MARINO, fontWeight: 800, fontSize: { xs: 25, md: 30 }, letterSpacing: '-.5px' }}>Gastos Operativos</Typography>
          <Typography sx={{ color: '#7B8DAC', fontSize: 13, mt: 0.3 }}>FIN-02 · Registro y control mensual de egresos</Typography>
        </Box>
        <Button variant="contained" onClick={abrirNuevo} sx={{ ...boton, bgcolor: AZUL, py: 1.2, boxShadow: '0 3px 9px #4F63F52B', '&:hover': { bgcolor: '#3E52DD' } }}>＋ Registrar gasto</Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {exito && <Alert severity="success" onClose={() => setExito('')} sx={{ mb: 2 }}>{exito}</Alert>}

      <Paper elevation={0} sx={{ border: `1px solid ${BORDE}`, borderRadius: 3, p: 2.3, mb: 2.5 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ color: MARINO, fontWeight: 700, fontSize: 13, mr: 1 }}>Período contable</Typography>
          <TextField select size="small" label="Mes" value={periodo.mes} onChange={(e) => setPeriodo((p) => ({ ...p, mes: Number(e.target.value) }))} sx={{ minWidth: 155 }}>
            {MESES.map((m, i) => <MenuItem key={m} value={i + 1}>{m}</MenuItem>)}
          </TextField>
          <TextField size="small" type="number" label="Año" value={periodo.anio} onChange={(e) => {
            const a = Number(e.target.value);
            if (Number.isInteger(a) && a >= 1 && a <= 9999) setPeriodo((p) => ({ ...p, anio: a }));
          }} sx={{ width: 110 }} />
          <Button variant="outlined" disabled={cargando} onClick={cargar} sx={{ ...boton, borderColor: '#D9E0F4', color: AZUL }}>↻ Actualizar</Button>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
        <Indicador titulo="GASTOS DE ADMINISTRACIÓN" valor={resumen.total_administracion} subtitulo={tituloPeriodo} color="#4F63F5" fondo="#EFF1FF" />
        <Indicador titulo="GASTOS DE VENTA" valor={resumen.total_venta} subtitulo={tituloPeriodo} color="#D18B27" fondo="#FFF5E6" />
        <Indicador titulo="TOTAL GASTOS OPERATIVOS" valor={resumen.total_gastos} subtitulo={`${resumen.cantidad_registros || 0} registros en el período`} color="#168D7C" fondo="#E9F7F3" />
      </Box>

      <Paper elevation={0} sx={{ border: `1px solid ${BORDE}`, borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2.3, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, color: MARINO, fontSize: 17 }}>Historial de gastos</Typography>
            <Typography sx={{ fontSize: 12, color: '#7B8DAC', mt: 0.4 }}>{tituloPeriodo} · {resumen.cantidad_registros || 0} registros</Typography>
          </Box>
          <TextField size="small" label="Buscar gasto" placeholder="Descripción o categoría" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} sx={{ width: { xs: '100%', sm: 260 } }} />
        </Box>
        <Divider sx={{ borderColor: BORDE }} />
        <TableContainer>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead sx={{ bgcolor: '#F7F9FD' }}>
              <TableRow>
                {['FECHA', 'CATEGORÍA', 'DESCRIPCIÓN', 'MONTO', 'ACCIONES'].map((h, i) =>
                  <TableCell key={h} align={i >= 3 ? 'right' : 'left'} sx={{ py: 1.8, color: '#7284A3', fontSize: 11, fontWeight: 800, letterSpacing: '.4px' }}>{h}</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {cargando ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><CircularProgress size={26} /></TableCell></TableRow>
                : filtrados.length === 0 ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: '#7B8DAC' }}>{busqueda ? 'No se encontraron gastos con esa búsqueda.' : 'No hay gastos registrados en este período.'}</TableCell></TableRow>
                  : filtrados.map((g) => <TableRow hover key={g.id} sx={{ '& td': { borderColor: '#EDF0F6', py: 1.6 } }}>
                    <TableCell sx={{ color: '#526681', fontSize: 12 }}>{fechaVisible(g.fecha)}</TableCell>
                    <TableCell><Chip size="small" label={g.categoria === 'VENTA' ? 'Venta' : 'Administración'} sx={{ fontWeight: 700, fontSize: 11, bgcolor: g.categoria === 'VENTA' ? '#FFF4E3' : '#EEF1FF', color: g.categoria === 'VENTA' ? '#AE741C' : '#4F63F5' }} /></TableCell>
                    <TableCell sx={{ color: MARINO, fontWeight: 600, fontSize: 12 }}>{g.descripcion}</TableCell>
                    <TableCell align="right" sx={{ color: MARINO, fontWeight: 800, whiteSpace: 'nowrap' }}>{dinero(g.monto)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Button size="small" onClick={() => abrirEditar(g)} sx={{ textTransform: 'none', color: AZUL, fontWeight: 700 }}>Editar</Button>
                      <Button size="small" onClick={() => setEliminando(g)} sx={{ textTransform: 'none', color: '#D34F5C', fontWeight: 700 }}>Eliminar</Button>
                    </TableCell>
                  </TableRow>)}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#FBFCFF', borderTop: `1px solid ${BORDE}` }}>
          <Typography sx={{ color: '#7B8DAC', fontSize: 11 }}>Los totales se calculan automáticamente a partir de los gastos registrados en Django.</Typography>
        </Box>
      </Paper>

      <Dialog open={abierto} onClose={() => { if (!guardando) setAbierto(false); }} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={guardar}>
          <DialogTitle sx={{ color: MARINO, fontWeight: 800, pb: 0.5 }}>{editando ? 'Editar gasto operativo' : 'Registrar nuevo gasto'}</DialogTitle>
          <Typography sx={{ px: 3, pb: 1.5, fontSize: 12, color: '#7B8DAC' }}>Completa la información del egreso para incorporarlo al resumen mensual.</Typography>
          <DialogContent dividers sx={{ borderColor: BORDE }}>
            <Stack spacing={2.2} sx={{ pt: 0.7 }}>
              {errorFormulario && <Alert severity="error">{errorFormulario}</Alert>}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField required label="Fecha del gasto" type="date" value={formulario.fecha} onChange={(e) => campo('fecha', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: '1 1 190px' }} />
                <TextField required select label="Categoría" value={formulario.categoria} onChange={(e) => campo('categoria', e.target.value)} sx={{ flex: '1 1 190px' }}>
                  <MenuItem value="ADMINISTRACION">Administración</MenuItem>
                  <MenuItem value="VENTA">Venta</MenuItem>
                </TextField>
              </Box>
              <TextField required fullWidth label="Descripción del gasto" multiline minRows={2} value={formulario.descripcion} onChange={(e) => campo('descripcion', e.target.value)} slotProps={{ htmlInput: { maxLength: 255 } }} helperText={`${formulario.descripcion.length}/255 caracteres`} />
              <TextField required fullWidth label="Monto (USD)" type="number" value={formulario.monto} onChange={(e) => campo('monto', e.target.value)} slotProps={{ htmlInput: { min: '0.01', step: '0.01' } }} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button disabled={guardando} onClick={() => setAbierto(false)} sx={{ ...boton, color: '#7B8DAC' }}>Cancelar</Button>
            <Button disabled={guardando} type="submit" variant="contained" sx={{ ...boton, bgcolor: AZUL }}>{guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Registrar gasto'}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(eliminando)} onClose={() => { if (!guardando) setEliminando(null); }} fullWidth maxWidth="xs">
        <DialogTitle sx={{ color: MARINO, fontWeight: 800 }}>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: '#526681' }}>¿Eliminar el gasto <strong>{eliminando?.descripcion}</strong> por <strong>{dinero(eliminando?.monto)}</strong>?</Typography>
          <Typography sx={{ mt: 1.5, fontSize: 12, color: '#D34F5C' }}>Esta acción no se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button disabled={guardando} onClick={() => setEliminando(null)} sx={{ ...boton, color: '#7B8DAC' }}>Cancelar</Button>
          <Button disabled={guardando} onClick={eliminar} variant="contained" color="error" sx={boton}>{guardando ? 'Eliminando...' : 'Eliminar gasto'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
