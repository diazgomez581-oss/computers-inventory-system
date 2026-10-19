import React, { useState, useEffect } from 'react';
import { API_URL as BASE_URL } from '../api';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// Respaldo directo en caso de que la variable de entorno no esté disponible
const API_URL = BASE_URL || import.meta.env.VITE_API_URL || 'https://computers-backend-bpk0.onrender.com';
const ENDPOINT_PRODUCTOS = `${API_URL}/api/productos/`;

const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('stb_user') || 'null');
  return user?.token ? { Authorization: `Token ${user.token}` } : {};
};

const CATEGORIAS = [
  { value: 'COMPONENTES', label: 'Componentes (RAM, CPU, GPU, Fuentes)' },
  { value: 'ALMACENAMIENTO', label: 'Almacenamiento (SSD, HDD, M.2)' },
  { value: 'PERIFERICOS', label: 'Periféricos (Monitores, Teclados, Mouse)' },
  { value: 'REDES', label: 'Redes y Conectividad' },
  { value: 'ACCESORIOS', label: 'Accesorios y Varios' },
];

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [productoEliminando, setProductoEliminando] = useState(null);
  const [errorEliminar, setErrorEliminar] = useState('');
  const [form, setForm] = useState({
    categoria: 'COMPONENTES',
    marca: '',
    modelo: '',
    descripcion: '',
  });
  const [errorMsg, setErrorMsg] = useState('');

  const fetchProductos = async () => {
    try {
      const res = await fetch(ENDPOINT_PRODUCTOS, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setProductos(data);
      }
    } catch (err) {
      console.error('Error al consultar productos:', err);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleGuardar = async () => {
    setErrorMsg('');
    if (!form.descripcion.trim()) {
      setErrorMsg('La descripción del producto es obligatoria.');
      return;
    }

    try {
      const url = productoEditando
        ? `${ENDPOINT_PRODUCTOS}${productoEditando.id}/`
        : ENDPOINT_PRODUCTOS;
      const res = await fetch(url, {
        method: productoEditando ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setForm({
          categoria: 'COMPONENTES',
          marca: '',
          modelo: '',
          descripcion: '',
        });
        setProductoEditando(null);
        setOpenModal(false);
        fetchProductos();
      } else {
        const errorData = await res.json();
        const nonFieldErrors = errorData.non_field_errors;
        const duplicateProductError = Array.isArray(nonFieldErrors)
          && nonFieldErrors.some(
            (error) => typeof error === 'string' && error.toLowerCase().includes('unique set'),
          );

        if (duplicateProductError) {
          setErrorMsg('Este producto ya está registrado en el catálogo maestro.');
        } else if (errorData.descripcion) {
          setErrorMsg(Array.isArray(errorData.descripcion) ? errorData.descripcion[0] : errorData.descripcion);
        } else if (nonFieldErrors) {
          setErrorMsg(Array.isArray(nonFieldErrors) ? nonFieldErrors[0] : nonFieldErrors);
        } else {
          setErrorMsg('Error al registrar el producto o ya existe en el catálogo.');
        }
      }
    } catch (err) {
      setErrorMsg('No se pudo conectar con el servidor.');
    }
  };

  const handleEditar = (producto) => {
    setProductoEditando(producto);
    setForm({
      categoria: producto.categoria,
      marca: producto.marca,
      modelo: producto.modelo,
      descripcion: producto.descripcion,
    });
    setErrorMsg('');
    setOpenModal(true);
  };

  const handleEliminar = async () => {
    if (!productoEliminando) return;

    setErrorEliminar('');
    try {
      const res = await fetch(`${ENDPOINT_PRODUCTOS}${productoEliminando.id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setProductoEliminando(null);
        fetchProductos();
      } else {
        const errorData = await res.json();
        setErrorEliminar(errorData.detail || 'No se pudo eliminar el producto.');
      }
    } catch {
      setErrorEliminar('No se pudo conectar con el servidor.');
    }
  };

  return (
    <Box>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#17243B', mb: 0.5 }}>
            Catálogo Maestro de Productos
          </Typography>
          <Typography variant="body2" sx={{ color: '#8190A5' }}>
            Registro de artículos. El stock y costo promedio se actualizan mediante compras y ventas.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setErrorMsg('');
            setProductoEditando(null);
            setForm({
              categoria: 'COMPONENTES',
              marca: '',
              modelo: '',
              descripcion: '',
            });
            setOpenModal(true);
          }}
          sx={{
            backgroundColor: '#4C67ED',
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '10px',
            px: 2.5,
            py: 1,
            boxShadow: '0 4px 12px rgba(76, 103, 237, 0.25)',
            '&:hover': { backgroundColor: '#3F55D7' },
          }}
        >
          Nuevo Producto
        </Button>
      </Box>

      {/* Tabla */}
      <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid #E8EDF4', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#F8FAFF' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#8190A6', fontSize: '0.75rem' }}>CÓDIGO</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#8190A6', fontSize: '0.75rem' }}>CATEGORÍA</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#8190A6', fontSize: '0.75rem' }}>MARCA / MODELO</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#8190A6', fontSize: '0.75rem' }}>DESCRIPCIÓN</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#8190A6', fontSize: '0.75rem' }}>STOCK</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#8190A6', fontSize: '0.75rem' }}>COSTO PROM. (WAC)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#8190A6', fontSize: '0.75rem' }}>ESTADO</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#8190A6', fontSize: '0.75rem' }}>ACCIONES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#8190A5' }}>
                    No hay productos registrados en el catálogo aún.
                  </TableCell>
                </TableRow>
              ) : (
                productos.map((prod) => (
                  <TableRow key={prod.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 800, color: '#4C67ED' }}>{prod.codigo}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#64748B', fontSize: '0.8rem' }}>{prod.categoria}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#17243B' }}>
                      {prod.marca || prod.modelo ? `${prod.marca} ${prod.modelo}` : '—'}
                    </TableCell>
                    <TableCell sx={{ color: '#334155' }}>{prod.descripcion}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#24334E' }}>
                      {prod.stock} uds
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#17243B' }}>
                      ${Number(prod.costo_promedio).toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={prod.stock > 0 ? 'En Existencia' : 'Sin Stock'}
                        size="small"
                        sx={{
                          backgroundColor: prod.stock > 0 ? '#EEF1FF' : '#FFF6E6',
                          color: prod.stock > 0 ? '#4C67ED' : '#B57822',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Editar producto">
                        <IconButton
                          aria-label={`Editar ${prod.descripcion}`}
                          onClick={() => handleEditar(prod)}
                          size="small"
                          sx={{ color: '#4C67ED' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar producto">
                        <IconButton
                          aria-label={`Eliminar ${prod.descripcion}`}
                          onClick={() => {
                            setErrorEliminar('');
                            setProductoEliminando(prod);
                          }}
                          size="small"
                          sx={{ color: '#D14343' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Modal Crear/Editar Producto */}
      <Dialog
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setProductoEditando(null);
        }}
        PaperProps={{ sx: { borderRadius: '16px', p: 1.5, maxWidth: '520px', width: '100%' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#17243B' }}>
          {productoEditando ? 'Editar Producto del Catálogo' : 'Registrar Producto en Catálogo'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '10px !important' }}>
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
          
          <Typography variant="caption" sx={{ color: '#8190A5' }}>
            {productoEditando
              ? `Código de producto: ${productoEditando.codigo}`
              : '* El código de producto será generado automáticamente por el sistema (ej. PROD-0001).'}
          </Typography>

          <TextField
            select
            label="Categoría"
            fullWidth
            size="small"
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          >
            {CATEGORIAS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Marca"
              placeholder="Ej. Kingston, ASUS"
              fullWidth
              size="small"
              value={form.marca}
              onChange={(e) => setForm({ ...form, marca: e.target.value })}
            />
            <TextField
              label="Modelo"
              placeholder="Ej. Fury Beast, Prime B550"
              fullWidth
              size="small"
              value={form.modelo}
              onChange={(e) => setForm({ ...form, modelo: e.target.value })}
            />
          </Box>

          <TextField
            label="Descripción o Especificaciones"
            placeholder="Ej. Memoria RAM 16GB DDR4 3200MHz RGB"
            fullWidth
            size="small"
            multiline
            rows={2}
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setOpenModal(false);
              setProductoEditando(null);
            }}
            sx={{ color: '#8190A5', textTransform: 'none', fontWeight: 600 }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleGuardar}
            sx={{
              backgroundColor: '#4C67ED',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '8px',
              '&:hover': { backgroundColor: '#3F55D7' },
            }}
          >
            {productoEditando ? 'Guardar cambios' : 'Crear en Catálogo'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(productoEliminando)}
        onClose={() => setProductoEliminando(null)}
        PaperProps={{ sx: { borderRadius: '16px', p: 1.5, maxWidth: '460px', width: '100%' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#17243B' }}>Eliminar producto</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {errorEliminar && <Alert severity="error">{errorEliminar}</Alert>}
          <Typography>
            ¿Seguro que deseas eliminar “{productoEliminando?.descripcion}”? No se podrán eliminar productos con movimientos en el kárdex.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setProductoEliminando(null)} sx={{ color: '#8190A5', textTransform: 'none', fontWeight: 600 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleEliminar}
            sx={{ backgroundColor: '#D14343', textTransform: 'none', fontWeight: 700, '&:hover': { backgroundColor: '#B83232' } }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}