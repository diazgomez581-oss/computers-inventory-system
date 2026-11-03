
import React, { useEffect, useState } from 'react';
import { API_URL } from '../api';
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
  Chip,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Switch,
  InputAdornment,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';

const ENDPOINT = `${API_URL}/api/proveedores/`;

const FORM_INICIAL = {
  razon_social: '',
  nrc: '',
  nit: '',
  telefono: '',
  contacto: '',
  activo: true,
};

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

const extraerError = (datos) => {
  if (!datos || typeof datos !== 'object') {
    return 'No fue posible completar la operación.';
  }

  if (typeof datos.detail === 'string') return datos.detail;

  const errores = Object.entries(datos).map(([campo, valor]) => {
    const mensaje = Array.isArray(valor)
      ? valor.join(', ')
      : String(valor);
    return `${campo}: ${mensaje}`;
  });

  return errores.join(' | ') || 'No fue posible completar la operación.';
};

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [actualizandoId, setActualizandoId] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ ...FORM_INICIAL });

  const [error, setError] = useState('');
  const [errorFormulario, setErrorFormulario] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargarProveedores = async () => {
    setCargando(true);
    setError('');

    try {
      const respuesta = await fetch(ENDPOINT, {
        headers: getAuthHeaders(),
      });

      if (!respuesta.ok) {
        throw new Error(
          respuesta.status === 401
            ? 'Tu sesión ha expirado. Inicia sesión nuevamente.'
            : 'No se pudo consultar el directorio de proveedores.'
        );
      }

      const datos = await respuesta.json();

      setProveedores(
        Array.isArray(datos)
          ? datos
          : Array.isArray(datos.results)
            ? datos.results
            : []
      );
    } catch (err) {
      setError(err.message || 'Error de conexión con Django.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ ...FORM_INICIAL });
    setErrorFormulario('');
    setModalAbierto(true);
  };

  const abrirEditar = (proveedor) => {
    setEditando(proveedor);
    setForm({
      razon_social: proveedor.razon_social || '',
      nrc: proveedor.nrc || '',
      nit: proveedor.nit || '',
      telefono: proveedor.telefono || '',
      contacto: proveedor.contacto || '',
      activo: Boolean(proveedor.activo),
    });
    setErrorFormulario('');
    setModalAbierto(true);
  };

  const cambiarCampo = (campo, valor) => {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const guardarProveedor = async () => {
    setErrorFormulario('');

    const campos = [
      'razon_social',
      'nrc',
      'nit',
      'telefono',
      'contacto',
    ];

    if (campos.some((campo) => !form[campo].trim())) {
      setErrorFormulario(
        'Completa todos los campos obligatorios.'
      );
      return;
    }

    setGuardando(true);

    try {
      const url = editando
        ? `${ENDPOINT}${editando.id}/`
        : ENDPOINT;

      const respuesta = await fetch(url, {
        method: editando ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          ...form,
          razon_social: form.razon_social.trim(),
          nrc: form.nrc.trim(),
          nit: form.nit.trim(),
          telefono: form.telefono.trim(),
          contacto: form.contacto.trim(),
        }),
      });

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(extraerError(datos));
      }

      setModalAbierto(false);
      setEditando(null);
      setMensaje(
        editando
          ? 'Proveedor actualizado correctamente.'
          : 'Proveedor registrado correctamente.'
      );

      await cargarProveedores();
    } catch (err) {
      setErrorFormulario(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (proveedor) => {
    setActualizandoId(proveedor.id);
    setError('');
    setMensaje('');

    try {
      const respuesta = await fetch(
        `${ENDPOINT}${proveedor.id}/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            activo: !proveedor.activo,
          }),
        }
      );

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(extraerError(datos));
      }

      setMensaje(
        proveedor.activo
          ? 'Proveedor desactivado correctamente.'
          : 'Proveedor activado correctamente.'
      );

      await cargarProveedores();
    } catch (err) {
      setError(err.message);
    } finally {
      setActualizandoId(null);
    }
  };

  const filtrados = proveedores.filter((proveedor) => {
    const texto = [
      proveedor.razon_social,
      proveedor.nrc,
      proveedor.nit,
      proveedor.telefono,
      proveedor.contacto,
    ]
      .join(' ')
      .toLowerCase();

    return texto.includes(busqueda.toLowerCase().trim());
  });

  const totalActivos = proveedores.filter(
    (proveedor) => proveedor.activo
  ).length;

  const estiloEncabezado = {
    fontWeight: 700,
    color: '#8190A6',
    fontSize: '0.75rem',
    whiteSpace: 'nowrap',
  };

  return (
    <Box>
      {/* Encabezado */}
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
            }}
          >
            Directorio de Proveedores
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: '#8190A5' }}
          >
            COMP-01 · Registro y administración de
            proveedores para el módulo de compras.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={abrirNuevo}
          sx={{
            backgroundColor: '#4C67ED',
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '10px',
            px: 2.5,
            py: 1,
            boxShadow: '0 4px 12px rgba(76,103,237,0.25)',
            '&:hover': {
              backgroundColor: '#3F55D7',
            },
          }}
        >
          Nuevo Proveedor
        </Button>
      </Box>

      {/* Resumen */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          mb: 3,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            minWidth: 190,
            borderRadius: '14px',
            border: '1px solid #E8EDF4',
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: '#8190A5', fontWeight: 700 }}
          >
            Total de proveedores
          </Typography>
          <Typography
            variant="h4"
            sx={{ color: '#17243B', fontWeight: 800 }}
          >
            {proveedores.length}
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            minWidth: 190,
            borderRadius: '14px',
            border: '1px solid #E8EDF4',
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: '#8190A5', fontWeight: 700 }}
          >
            Proveedores activos
          </Typography>
          <Typography
            variant="h4"
            sx={{ color: '#4C67ED', fontWeight: 800 }}
          >
            {totalActivos}
          </Typography>
        </Paper>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {mensaje && (
        <Alert
          severity="success"
          onClose={() => setMensaje('')}
          sx={{ mb: 2 }}
        >
          {mensaje}
        </Alert>
      )}

      {/* Tabla */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          border: '1px solid #E8EDF4',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <TextField
            size="small"
            placeholder="Buscar proveedor, NRC o NIT..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            sx={{ width: { xs: '100%', sm: 340 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94A3B8' }} />
                </InputAdornment>
              ),
            }}
          />

          <Button
            startIcon={<RefreshIcon />}
            onClick={cargarProveedores}
            disabled={cargando}
            sx={{
              textTransform: 'none',
              color: '#4C67ED',
              fontWeight: 700,
            }}
          >
            Actualizar
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#F8FAFF' }}>
              <TableRow>
                <TableCell sx={estiloEncabezado}>
                  RAZÓN SOCIAL
                </TableCell>
                <TableCell sx={estiloEncabezado}>
                  NRC
                </TableCell>
                <TableCell sx={estiloEncabezado}>
                  NIT
                </TableCell>
                <TableCell sx={estiloEncabezado}>
                  TELÉFONO
                </TableCell>
                <TableCell sx={estiloEncabezado}>
                  CONTACTO
                </TableCell>
                <TableCell sx={estiloEncabezado}>
                  ESTADO
                </TableCell>
                <TableCell
                  align="center"
                  sx={estiloEncabezado}
                >
                  ACCIONES
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {cargando ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : filtrados.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 5, color: '#8190A5' }}
                  >
                    {error
                      ? 'No se pudo cargar el directorio.'
                      : busqueda
                        ? 'No se encontraron proveedores.'
                        : 'No hay proveedores registrados.'}
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((proveedor) => (
                  <TableRow key={proveedor.id} hover>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        color: '#17243B',
                      }}
                    >
                      {proveedor.razon_social}
                    </TableCell>

                    <TableCell>{proveedor.nrc}</TableCell>
                    <TableCell>{proveedor.nit}</TableCell>
                    <TableCell>{proveedor.telefono}</TableCell>
                    <TableCell>{proveedor.contacto}</TableCell>

                    <TableCell>
                      <Chip
                        label={
                          proveedor.activo
                            ? 'Activo'
                            : 'Inactivo'
                        }
                        size="small"
                        sx={{
                          bgcolor: proveedor.activo
                            ? '#EEF1FF'
                            : '#F1F5F9',
                          color: proveedor.activo
                            ? '#4C67ED'
                            : '#64748B',
                          fontWeight: 700,
                        }}
                      />
                    </TableCell>

                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Editar proveedor">
                        <IconButton
                          size="small"
                          onClick={() => abrirEditar(proveedor)}
                          sx={{ color: '#4C67ED' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip
                        title={
                          proveedor.activo
                            ? 'Desactivar proveedor'
                            : 'Activar proveedor'
                        }
                      >
                        <span>
                          <Switch
                            size="small"
                            checked={Boolean(proveedor.activo)}
                            disabled={actualizandoId === proveedor.id}
                            onChange={() => cambiarEstado(proveedor)}
                            inputProps={{
                              'aria-label': `Cambiar estado de ${proveedor.razon_social}`,
                            }}
                          />
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Modal de registro y edición */}
      <Dialog
        open={modalAbierto}
        onClose={() => {
          if (!guardando) setModalAbierto(false);
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 1.5,
          },
        }}
      >
        <DialogTitle
          sx={{ fontWeight: 800, color: '#17243B' }}
        >
          {editando
            ? 'Editar Proveedor'
            : 'Registrar Nuevo Proveedor'}
        </DialogTitle>

        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            pt: '10px !important',
          }}
        >
          {errorFormulario && (
            <Alert severity="error">
              {errorFormulario}
            </Alert>
          )}

          <Typography
            variant="caption"
            sx={{ color: '#8190A5' }}
          >
            Completa la información tributaria y de
            contacto del proveedor.
          </Typography>

          <TextField
            label="Razón Social"
            placeholder="Ej. Distribuidora Tecnológica S.A. de C.V."
            fullWidth
            required
            size="small"
            value={form.razon_social}
            onChange={(e) =>
              cambiarCampo('razon_social', e.target.value)
            }
            inputProps={{ maxLength: 200 }}
          />

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
            }}
          >
            <TextField
              label="NRC"
              placeholder="Ej. 123456-7"
              fullWidth
              required
              size="small"
              value={form.nrc}
              onChange={(e) =>
                cambiarCampo('nrc', e.target.value)
              }
              inputProps={{ maxLength: 30 }}
            />

            <TextField
              label="NIT"
              placeholder="Ej. 0614-010190-101-1"
              fullWidth
              required
              size="small"
              value={form.nit}
              onChange={(e) =>
                cambiarCampo('nit', e.target.value)
              }
              inputProps={{ maxLength: 30 }}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
            }}
          >
            <TextField
              label="Teléfono"
              placeholder="Ej. 2222-3333"
              fullWidth
              required
              size="small"
              value={form.telefono}
              onChange={(e) =>
                cambiarCampo('telefono', e.target.value)
              }
              inputProps={{ maxLength: 20 }}
            />

            <TextField
              label="Persona de Contacto"
              placeholder="Ej. Carlos Martínez"
              fullWidth
              required
              size="small"
              value={form.contacto}
              onChange={(e) =>
                cambiarCampo('contacto', e.target.value)
              }
              inputProps={{ maxLength: 150 }}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Switch
              checked={form.activo}
              onChange={(e) =>
                cambiarCampo('activo', e.target.checked)
              }
            />
            <Typography variant="body2">
              Proveedor activo
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            disabled={guardando}
            onClick={() => setModalAbierto(false)}
            sx={{
              textTransform: 'none',
              color: '#8190A5',
              fontWeight: 600,
            }}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            disabled={guardando}
            onClick={guardarProveedor}
            sx={{
              bgcolor: '#4C67ED',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '8px',
              '&:hover': {
                bgcolor: '#3F55D7',
              },
            }}
          >
            {guardando
              ? 'Guardando...'
              : editando
                ? 'Guardar cambios'
                : 'Registrar proveedor'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
