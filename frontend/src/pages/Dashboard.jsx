import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_bodega: '$0.00',
    total_productos: 0,
    total_salidas: '0 unidades',
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/dashboard-stats/')
      .then((res) => {
        setStats(res.data);
        setCargando(false);
      })
      .catch((err) => {
        console.error('Error conectando al backend:', err);
        setCargando(false);
      });
  }, []);

  const metricas = [
    {
      titulo: 'TOTAL EN BODEGA (COSTO)',
      valor: stats.total_bodega,
      bordeColor: '#0F4C81',
      iconBg: '#E0F2FE',
      icon: <AttachMoneyIcon sx={{ color: '#0F4C81', fontSize: 22 }} />,
    },
    {
      titulo: 'PRODUCTOS REGISTRADOS',
      valor: stats.total_productos,
      bordeColor: '#0284C7',
      iconBg: '#E0F2FE',
      icon: <Inventory2Icon sx={{ color: '#0284C7', fontSize: 22 }} />,
    },
    {
      titulo: 'SALIDAS DEL MES',
      valor: stats.total_salidas,
      bordeColor: '#10B981',
      iconBg: '#D1FAE5',
      icon: <ShoppingCartIcon sx={{ color: '#10B981', fontSize: 22 }} />,
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, boxSizing: 'border-box', width: '100%' }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.15rem' }}>
          Resumen General del Inventario
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem' }}>
          Control continuo bajo el método de Costo Promedio Ponderado
        </Typography>
      </Box>

      {cargando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: 2,
            mb: 3,
            width: '100%',
          }}
        >
          {metricas.map((m, idx) => (
            <Card
              key={idx}
              elevation={0}
              sx={{
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderTop: `3px solid ${m.bordeColor}`,
                borderRadius: 2,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#64748B',
                        fontWeight: 700,
                        fontSize: '0.68rem',
                        letterSpacing: '0.4px',
                        display: 'block',
                      }}
                    >
                      {m.titulo}
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 800,
                        color: '#0F172A',
                        mt: 0.5,
                        fontSize: '1.35rem',
                        lineHeight: 1.2,
                      }}
                    >
                      {m.valor}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1.5,
                      bgcolor: m.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {m.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Card
        elevation={0}
        sx={{
          border: '1px solid #E2E8F0',
          borderRadius: 2,
          p: 2.5,
          bgcolor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.6 }}>
          Valuación de Inventarios: Costo Promedio Ponderado (NIIF para las PYMES - Sección 13)
        </Typography>
        <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.55, fontSize: '0.84rem' }}>
          El sistema opera bajo un control de inventario perpetuo. Cada entrada de mercadería actualiza de manera inmediata el costo unitario promedio ponderado acumulado. Al momento de generar una venta o salida de almacén, el costo de ventas se deduce de forma automatizada con base en el último promedio registrado, garantizando integridad en los registros financieros.
        </Typography>
      </Card>
    </Box>
  );
}