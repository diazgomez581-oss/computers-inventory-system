"""Pruebas de aceptación FIN-03, fase 1 (Estado de Resultados)."""
from datetime import date, datetime
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from gastos.models import GastoOperativo
from ventas.models import Venta

URL_ESTADO_RESULTADOS = "/api/estado-resultados/?anio=2026&mes=11"


class EstadoResultadosTests(TestCase):
    def setUp(self):
        self.usuario = get_user_model().objects.create_user(
            username="fin03_pruebas", password="ClaveSegura123!"
        )
        self.api = APIClient()
        self.api.force_authenticate(user=self.usuario)

    def crear_venta(self, dia, subtotal, costo, estado="EMITIDA", mes=11):
        venta = Venta.objects.create(
            cliente="Prueba", subtotal=Decimal(subtotal),
            costo_total=Decimal(costo), iva=Decimal("0.00"),
            total=Decimal(subtotal), estado=estado,
            registrado_por=self.usuario,
        )
        Venta.objects.filter(pk=venta.pk).update(
            fecha=timezone.make_aware(datetime(2026, mes, dia, 12, 0))
        )

    def crear_gasto(self, dia, categoria, monto, mes=11):
        GastoOperativo.objects.create(
            fecha=date(2026, mes, dia), categoria=categoria,
            descripcion="Gasto de prueba", monto=Decimal(monto),
            registrado_por=self.usuario,
        )

    def test_calcula_utilidad_neta_con_ventas_y_gastos(self):
        self.crear_venta(5, "33.00", "30.00")
        self.crear_venta(6, "33.00", "30.00")
        self.crear_gasto(7, "ADMINISTRACION", "2.00")
        self.crear_gasto(8, "VENTA", "1.00")
        respuesta = self.api.get(URL_ESTADO_RESULTADOS)
        self.assertEqual(respuesta.status_code, 200)
        for campo, esperado in {
            "ventas_netas": "66.00", "costo_ventas": "60.00",
            "utilidad_bruta": "6.00", "gastos_administracion": "2.00",
            "gastos_venta": "1.00", "gastos_operativos": "3.00",
            "utilidad_neta": "3.00",
        }.items():
            self.assertEqual(respuesta.data[campo], esperado)

    def test_excluye_ventas_anuladas_y_otros_meses(self):
        self.crear_venta(5, "33.00", "30.00")
        self.crear_venta(6, "900.00", "800.00", estado="ANULADA")
        self.crear_venta(7, "50.00", "40.00", mes=10)
        self.crear_gasto(8, "ADMINISTRACION", "5.00", mes=10)
        respuesta = self.api.get(URL_ESTADO_RESULTADOS)
        self.assertEqual(respuesta.data["ventas_netas"], "33.00")
        self.assertEqual(respuesta.data["costo_ventas"], "30.00")
        self.assertEqual(respuesta.data["gastos_operativos"], "0.00")

    def test_periodo_sin_movimientos_devuelve_ceros(self):
        respuesta = self.api.get(URL_ESTADO_RESULTADOS)
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["utilidad_neta"], "0.00")

    def test_rechaza_periodo_invalido(self):
        self.assertEqual(self.api.get("/api/estado-resultados/?anio=2026&mes=13").status_code, 400)
        self.assertEqual(self.api.get("/api/estado-resultados/?anio=0&mes=11").status_code, 400)

    def test_requiere_autenticacion(self):
        respuesta = APIClient().get(URL_ESTADO_RESULTADOS)
        self.assertIn(respuesta.status_code, (401, 403))


# ============================================================
# FIN-03 | 2. PRUEBAS DEL BALANCE GENERAL
# ============================================================

from datetime import date, datetime
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from .models import AporteCapital
from compras.models import Compra
from ventas.models import Venta
from gastos.models import GastoOperativo
from inventario.models import Producto, MovimientoKardex

URL_BALANCE_GENERAL = '/api/balance-general/?fecha=2026-11-20'


class BalanceGeneralTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='balance_test', password='P4ssword!')
        self.api = APIClient()
        self.api.force_authenticate(user=self.user)

    def fijar_fecha(self, modelo, pk, dia):
        modelo.objects.filter(pk=pk).update(
            fecha=timezone.make_aware(datetime(2026, 11, dia, 12, 0)))

    def test_api_exige_autenticacion(self):
        self.assertIn(APIClient().get(URL_BALANCE_GENERAL).status_code, (401, 403))

    def test_api_valida_fecha(self):
        self.assertEqual(self.api.get('/api/balance-general/?fecha=abc').status_code, 400)

    def test_aporte_capital_incrementa_efectivo_y_patrimonio(self):
        AporteCapital.objects.create(fecha=date(2026, 11, 1), descripcion='Aporte real',
                                    monto=Decimal('500.00'), registrado_por=self.user)
        datos = self.api.get(URL_BALANCE_GENERAL).data
        self.assertEqual(datos['activo']['efectivo'], '500.00')
        self.assertEqual(datos['patrimonio']['capital'], '500.00')
        self.assertTrue(datos['comprobacion']['cuadra'])

    def test_venta_aumenta_efectivo_y_utilidad(self):
        venta = Venta.objects.create(cliente='Contado', subtotal=Decimal('100.00'),
             iva=Decimal('13.00'), total=Decimal('113.00'), costo_total=Decimal('0.00'),
             estado='EMITIDA', registrado_por=self.user)
        self.fijar_fecha(Venta, venta.pk, 10)
        datos = self.api.get(URL_BALANCE_GENERAL).data
        self.assertEqual(datos['activo']['efectivo'], '113.00')
        self.assertEqual(datos['pasivo']['iva_por_pagar'], '13.00')
        self.assertEqual(datos['patrimonio']['utilidad_ejercicio'], '100.00')
        self.assertTrue(datos['comprobacion']['cuadra'])

    def test_iva_credito_se_muestra_como_activo(self):
        compra = Compra.objects.create(numero_documento='PRUEBA-IVA',
             subtotal_neto=Decimal('100.00'), iva_credito_fiscal=Decimal('13.00'),
             total_pagar=Decimal('113.00'), registrado_por=self.user)
        self.fijar_fecha(Compra, compra.pk, 10)
        datos = self.api.get(URL_BALANCE_GENERAL).data
        self.assertEqual(datos['activo']['iva_a_favor'], '13.00')
        self.assertEqual(datos['pasivo']['iva_por_pagar'], '0.00')
        self.assertEqual(datos['activo']['efectivo'], '-113.00')
        self.assertFalse(datos['comprobacion']['cuadra'])


    def test_inventario_consulta_ultimo_kardex_a_fecha(self):
        # FIN-03 | Balance General
        # Comprobar la valoración histórica del inventario.

        producto = Producto.objects.create(
            descripcion="Prueba balance",
            stock=2,
            costo_promedio=Decimal("10.0000")
        )

        # Establecer la fecha del producto antes del corte.
        Producto.objects.filter(pk=producto.pk).update(
            fecha_creacion=timezone.make_aware(
                datetime(2026, 11, 9, 12, 0)
            )
        )

        movimiento = MovimientoKardex.objects.create(
            producto=producto,
            tipo="ENTRADA",
            detalle="Compra prueba",
            cantidad_entrada=2,
            costo_unitario_entrada=Decimal("10.0000"),
            total_entrada=Decimal("20.00"),
            saldo_cantidad=2,
            saldo_costo_unitario=Decimal("10.0000"),
            saldo_total=Decimal("20.00")
        )

        # El movimiento ocurre antes de la fecha de corte.
        self.fijar_fecha(
            MovimientoKardex,
            movimiento.pk,
            10
        )

        respuesta = self.api.get(URL_BALANCE_GENERAL)

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(
            respuesta.data["activo"]["inventarios"],
            "20.00"
        )

# ============================================================
# FIN-03 | 3. PRUEBAS DE RAZONES FINANCIERAS
# ============================================================

class RazonesFinancierasTests(TestCase):
    def setUp(self):
        self.usuario = get_user_model().objects.create_user(
            username='ratios_pruebas', password='ClaveSegura123!'
        )
        self.api = APIClient()
        self.api.force_authenticate(user=self.usuario)
        self.url = '/api/razones-financieras/?anio=2026&mes=11'

    def test_margen_neto_calculado_del_estado_de_resultados(self):
        venta = Venta.objects.create(
            cliente='Contado', subtotal=Decimal('66.00'), iva=Decimal('8.58'),
            total=Decimal('74.58'), costo_total=Decimal('60.00'),
            estado='EMITIDA', registrado_por=self.usuario
        )
        Venta.objects.filter(pk=venta.pk).update(
            fecha=timezone.make_aware(datetime(2026, 11, 10, 12, 0))
        )
        respuesta = self.api.get(self.url)
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data['margen_neto'], '9.09')
        self.assertEqual(respuesta.data['razon_corriente'], '8.69')
        # 74.58 / 8.58 = 8.69 (sin inventario ni capital); comprobamos
        # con precisión la fórmula en lugar de presuponer un valor.

    def test_pasivo_cero_razon_corriente_no_calculable(self):
        respuesta = self.api.get(self.url)
        self.assertEqual(respuesta.status_code, 200)
        self.assertIsNone(respuesta.data['razon_corriente'])
        self.assertIsNone(respuesta.data['margen_neto'])

    def test_periodo_invalido(self):
        respuesta = self.api.get('/api/razones-financieras/?anio=2026&mes=13')
        self.assertEqual(respuesta.status_code, 400)

    def test_requiere_autenticacion(self):
        respuesta = APIClient().get(self.url)
        self.assertIn(respuesta.status_code, (401, 403))
