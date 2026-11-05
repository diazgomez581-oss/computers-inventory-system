from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from inventario.models import Producto, MovimientoKardex
from .models import Compra, DetalleCompra


class ComprasTest(TestCase):
    def setUp(self):
        self.usuario = get_user_model().objects.create_user(username='admin_compra', password='testPass000', is_staff=True)
        self.token = Token.objects.create(user=self.usuario)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.producto = Producto.objects.create(
            categoria='COMPONENTES', marca='TEST', modelo='WAC-1',
            descripcion='Producto para prueba COMP-02',
        )
        self.producto.stock = 10
        self.producto.costo_promedio = Decimal('2.0000')
        self.producto.save(update_fields=['stock', 'costo_promedio'])

    def test_compra_calcula_iva_wac_y_kardex(self):
        respuesta = self.client.post('/api/compras/', {
            'numero_documento': 'CCF-001',
            'proveedor': None,
            'detalles': [{'producto': self.producto.pk, 'cantidad': 10, 'costo_unitario_neto': '3.5000'}],
        }, format='json')
        self.assertEqual(respuesta.status_code, 201, respuesta.data)
        self.assertEqual(Compra.objects.count(), 1)
        self.assertEqual(DetalleCompra.objects.count(), 1)
        compra = Compra.objects.get()
        self.assertEqual(compra.subtotal_neto, Decimal('35.00'))
        self.assertEqual(compra.iva_credito_fiscal, Decimal('4.55'))
        self.assertEqual(compra.total_pagar, Decimal('39.55'))
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock, 20)
        self.assertEqual(self.producto.costo_promedio, Decimal('2.7500'))
        kardex = MovimientoKardex.objects.get(producto=self.producto)
        self.assertEqual(kardex.tipo, 'ENTRADA')
        self.assertEqual(kardex.saldo_cantidad, 20)
        self.assertEqual(kardex.saldo_total, Decimal('55.00'))

    def test_documento_repetido_no_altera_stock(self):
        carga = {'numero_documento': 'FACT-77', 'detalles': [
            {'producto': self.producto.pk, 'cantidad': 2, 'costo_unitario_neto': '5.00'}
        ]}
        self.assertEqual(self.client.post('/api/compras/', carga, format='json').status_code, 201)
        self.assertEqual(self.client.post('/api/compras/', carga, format='json').status_code, 400)
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock, 12)
        self.assertEqual(MovimientoKardex.objects.count(), 1)

    def test_rechaza_cantidad_cero_y_productos_duplicados(self):
        base = {'numero_documento': 'TEST-INVALIDO', 'detalles': [
            {'producto': self.producto.pk, 'cantidad': 0, 'costo_unitario_neto': '5.00'}
        ]}
        self.assertEqual(self.client.post('/api/compras/', base, format='json').status_code, 400)
        base['detalles'][0]['cantidad'] = 1
        base['detalles'].append(dict(base['detalles'][0]))
        self.assertEqual(self.client.post('/api/compras/', base, format='json').status_code, 400)
        self.assertFalse(Compra.objects.exists())
