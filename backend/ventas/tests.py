# Create your tests here.
"""Pruebas de aceptación VENT-02:
Descarga de costo de ventas en Kárdex.
"""

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Sum
from django.test import TestCase
from rest_framework.exceptions import ValidationError

from inventario.models import MovimientoKardex, Producto
from ventas.models import DetalleVenta, Venta
from ventas.services import registrar_venta

class VentaKardexTests(TestCase):
    def setUp(self):
        self.usuario = get_user_model().objects.create_user(
            username="prueba_vent02", password="clave_temporal_vent02"
        )
        self.producto = Producto.objects.create(
            descripcion="Producto de prueba VENT-02",
            categoria="PERIFERICOS",
            stock=5,
            costo_promedio=Decimal("30.0000"),
        )

    def vender(self, cantidad=1):
        return registrar_venta(
            usuario=self.usuario,
            cliente="Consumidor final",
            productos=[{
                "producto_id": self.producto.pk,
                "cantidad": cantidad,
                "porcentaje_ganancia": Decimal("10.00"),
            }],
        )

    def test_salida_utiliza_costo_promedio_y_no_lo_modifica(self):
        venta = self.vender(cantidad=2)
        self.producto.refresh_from_db()
        movimiento = MovimientoKardex.objects.get(
            detalle=f"Venta {venta.numero_comprobante}"
        )
        detalle = DetalleVenta.objects.get(venta=venta)

        self.assertEqual(movimiento.tipo, "SALIDA")
        self.assertEqual(movimiento.cantidad_salida, 2)
        self.assertEqual(movimiento.costo_unitario_salida, Decimal("30.0000"))
        self.assertEqual(movimiento.total_salida, Decimal("60.00"))
        self.assertEqual(detalle.costo_unitario, Decimal("30.0000"))
        self.assertEqual(detalle.costo_total, Decimal("60.00"))
        self.assertEqual(venta.costo_total, Decimal("60.00"))
        self.assertEqual(self.producto.stock, 3)
        self.assertEqual(self.producto.costo_promedio, Decimal("30.0000"))
        self.assertEqual(movimiento.saldo_cantidad, 3)
        self.assertEqual(movimiento.saldo_costo_unitario, Decimal("30.0000"))
        self.assertEqual(movimiento.saldo_total, Decimal("90.00"))

    def test_dos_ventas_acumulan_costos_sin_alterar_wac(self):
        primera = self.vender()
        segunda = self.vender()
        self.producto.refresh_from_db()

        self.assertEqual(primera.costo_total, Decimal("30.00"))
        self.assertEqual(segunda.costo_total, Decimal("30.00"))
        self.assertEqual(
            Venta.objects.filter(estado="EMITIDA").aggregate(
                total=Sum("costo_total")
            )["total"],
            Decimal("60.00"),
        )
        movimientos = MovimientoKardex.objects.filter(
            producto=self.producto, tipo="SALIDA"
        )
        self.assertEqual(movimientos.count(), 2)
        self.assertEqual(
            movimientos.aggregate(total=Sum("total_salida"))["total"],
            Decimal("60.00"),
        )
        self.assertEqual(self.producto.stock, 3)
        self.assertEqual(self.producto.costo_promedio, Decimal("30.0000"))

    def test_stock_insuficiente_no_crea_venta_ni_salida(self):
        with self.assertRaises(ValidationError):
            self.vender(cantidad=6)
        self.producto.refresh_from_db()

        self.assertEqual(self.producto.stock, 5)
        self.assertEqual(Venta.objects.count(), 0)
        self.assertEqual(DetalleVenta.objects.count(), 0)
        self.assertEqual(MovimientoKardex.objects.count(), 0)

    def test_venta_multiproducto_conserva_costos_individuales(self):
        segundo = Producto.objects.create(
            descripcion="Segundo producto VENT-02",
            categoria="ACCESORIOS",
            stock=4,
            costo_promedio=Decimal("47.3333"),
        )
        venta = registrar_venta(
            usuario=self.usuario,
            cliente="Consumidor final",
            productos=[
                {"producto_id": self.producto.pk, "cantidad": 1,
                 "porcentaje_ganancia": Decimal("10")},
                {"producto_id": segundo.pk, "cantidad": 3,
                 "porcentaje_ganancia": Decimal("10")},
            ],
        )
        self.producto.refresh_from_db()
        segundo.refresh_from_db()

        # 3 * 47.3333 = 141.9999, redondeado a 142.00
        self.assertEqual(venta.costo_total, Decimal("172.00"))
        self.assertEqual(venta.detalles.count(), 2)
        self.assertEqual(
            MovimientoKardex.objects.filter(tipo="SALIDA").count(), 2
        )
        self.assertEqual(self.producto.stock, 4)
        self.assertEqual(segundo.stock, 1)
        self.assertEqual(segundo.costo_promedio, Decimal("47.3333"))
