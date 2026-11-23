"""FIN-03: cálculos del Estado de Resultados mensual, sin modificar registros."""
from datetime import date
from decimal import Decimal
from django.db.models import Sum
from gastos.models import GastoOperativo
from ventas.models import Venta

CERO = Decimal("0.00")


def calcular_estado_resultados(anio: int, mes: int) -> dict:
    # Valida año y mes antes de consultar el período.
    date(anio, mes, 1)

    ventas = Venta.objects.filter(
        fecha__year=anio, fecha__month=mes, estado="EMITIDA"
    )
    ventas_netas = ventas.aggregate(valor=Sum("subtotal"))["valor"] or CERO
    costo_ventas = ventas.aggregate(valor=Sum("costo_total"))["valor"] or CERO

    gastos = GastoOperativo.objects.filter(fecha__year=anio, fecha__month=mes)
    gastos_administracion = (
        gastos.filter(categoria=GastoOperativo.Categoria.ADMINISTRACION)
        .aggregate(valor=Sum("monto"))["valor"] or CERO
    )
    gastos_venta = (
        gastos.filter(categoria=GastoOperativo.Categoria.VENTA)
        .aggregate(valor=Sum("monto"))["valor"] or CERO
    )
    utilidad_bruta = ventas_netas - costo_ventas
    gastos_operativos = gastos_administracion + gastos_venta
    utilidad_neta = utilidad_bruta - gastos_operativos

    def dinero(valor):
        return str(valor.quantize(Decimal("0.01")))

    return {
        "anio": anio,
        "mes": mes,
        "cantidad_ventas": ventas.count(),
        "ventas_netas": dinero(ventas_netas),
        "costo_ventas": dinero(costo_ventas),
        "utilidad_bruta": dinero(utilidad_bruta),
        "gastos_administracion": dinero(gastos_administracion),
        "gastos_venta": dinero(gastos_venta),
        "gastos_operativos": dinero(gastos_operativos),
        "utilidad_neta": dinero(utilidad_neta),
    }


# ============================================================
# FIN-03 | 2. BALANCE GENERAL
# ============================================================

from datetime import date, datetime, time, timedelta
from decimal import Decimal, ROUND_HALF_UP
from django.db.models import Sum
from django.utils import timezone
from compras.models import Compra
from gastos.models import GastoOperativo
from inventario.models import MovimientoKardex, Producto
from ventas.models import Venta
from .models import AporteCapital

CENT = Decimal('0.01')


def redondear(x):
    return Decimal(x).quantize(CENT, rounding=ROUND_HALF_UP)


def total(queryset, campo):
    return queryset.aggregate(suma=Sum(campo))['suma'] or CERO


def cierre_exclusivo(fecha):
    """Inicio local del día siguiente, convertido en datetime aware."""
    siguiente = fecha + timedelta(days=1)
    return timezone.make_aware(datetime.combine(siguiente, time.min))


def calcular_balance_general(fecha_corte: date) -> dict:
    if not isinstance(fecha_corte, date):
        raise ValueError('Fecha de corte inválida')
    hasta = cierre_exclusivo(fecha_corte)
    inicio_ejercicio = timezone.make_aware(datetime(fecha_corte.year, 1, 1))
    ventas = Venta.objects.filter(estado='EMITIDA', fecha__lt=hasta)
    compras = Compra.objects.filter(fecha__lt=hasta)
    gastos = GastoOperativo.objects.filter(fecha__lte=fecha_corte)

    cobros = total(ventas, 'total')
    pagos_compras = total(compras, 'total_pagar')
    pagos_gastos = total(gastos, 'monto')
    aportes = AporteCapital.objects.filter(fecha__lte=fecha_corte)
    capital = total(aportes, 'monto')
    efectivo = redondear(capital + cobros - pagos_compras - pagos_gastos)

    # IVA neto: crédito a favor se reconoce como activo, no pasivo negativo.
    iva_neto = redondear(total(ventas, 'iva') - total(compras, 'iva_credito_fiscal'))
    iva_por_pagar = max(iva_neto, CERO)
    iva_a_favor = max(-iva_neto, CERO)

    # Saldo histórico del Kárdex por producto, no stock de hoy para fechas pasadas.
    inventario = CERO
    productos_sin_historial = []
    for producto in Producto.objects.filter(fecha_creacion__lt=hasta):
        ultimo = (MovimientoKardex.objects.filter(producto=producto, fecha__lt=hasta)
                  .order_by('-fecha', '-pk').first())
        if ultimo is not None:
            inventario += ultimo.saldo_total
        else:
            # No es posible reconstruir el valor del inventario anterior sin historial.
            productos_sin_historial.append(producto.codigo)
    inventario = redondear(inventario)

    # Resultado acumulado hasta el corte, separado por ejercicio actual y previos.
    def resultado(ventas_qs, gastos_qs):
        return redondear(
            total(ventas_qs, 'subtotal') - total(ventas_qs, 'costo_total')
            - total(gastos_qs, 'monto')
        )

    utilidad_ejercicio = resultado(
        ventas.filter(fecha__gte=inicio_ejercicio),
        gastos.filter(fecha__gte=fecha_corte.replace(month=1, day=1))
    )
    resultados_anteriores = resultado(
        ventas.filter(fecha__lt=inicio_ejercicio),
        gastos.filter(fecha__lt=fecha_corte.replace(month=1, day=1))
    )

    activo = redondear(efectivo + inventario + iva_a_favor)
    pasivo = redondear(iva_por_pagar)  # Compras al contado: sin CxP registradas.
    patrimonio = redondear(capital + utilidad_ejercicio + resultados_anteriores)
    diferencia = redondear(activo - pasivo - patrimonio)

    advertencias = []
    if productos_sin_historial:
        advertencias.append(
            'Hay productos sin movimientos de Kárdex anteriores al corte: '
            + ', '.join(productos_sin_historial)
            + '. No se presupone su valor inicial.'
        )
    if efectivo < 0:
        advertencias.append(
            'El efectivo calculado es negativo. Registre únicamente aportes reales '
            'o revise saldos iniciales y operaciones históricas.'
        )
    if diferencia != 0:
        advertencias.append(
            'El balance no cuadra: se muestra la diferencia real. '
            'Revise inventarios iniciales, redondeos, saldos de apertura y registros.'
        )
    advertencias.append(
        'El balance se genera automáticamente con los registros del sistema, '
        'considerando las ventas cobradas, compras y gastos pagados al momento de su registro.'
    )

    def d(x):
        return str(redondear(x))

    return {
        'fecha_corte': fecha_corte.isoformat(),
        'activo': {'efectivo': d(efectivo), 'inventarios': d(inventario),
                   'iva_a_favor': d(iva_a_favor), 'total': d(activo)},
        'pasivo': {'cuentas_por_pagar': d(CERO), 'iva_por_pagar': d(iva_por_pagar),
                   'total': d(pasivo)},
        'patrimonio': {'capital': d(capital),
                       'resultados_anteriores': d(resultados_anteriores),
                       'utilidad_ejercicio': d(utilidad_ejercicio), 'total': d(patrimonio)},
        'comprobacion': {'diferencia': d(diferencia), 'cuadra': diferencia == 0},
        'advertencias': advertencias,
    }


# ============================================================
# FIN-03 | 3. RAZONES FINANCIERAS
# ============================================================

def calcular_razones_financieras(anio: int, mes: int) -> dict:
    """Razón corriente al cierre mensual y margen neto del mismo mes."""
    import calendar
    date(anio, mes, 1)  # valida el período
    fecha_corte = date(anio, mes, calendar.monthrange(anio, mes)[1])
    estado = calcular_estado_resultados(anio, mes)
    balance = calcular_balance_general(fecha_corte)

    activo = Decimal(balance['activo']['total'])
    pasivo = Decimal(balance['pasivo']['total'])
    ventas = Decimal(estado['ventas_netas'])
    utilidad = Decimal(estado['utilidad_neta'])

    # No se informa infinito ni cero cuando el denominador es cero.
    razon = redondear(activo / pasivo) if pasivo > 0 else None
    margen = redondear(utilidad / ventas * 100) if ventas != 0 else None

    observaciones = list(balance['advertencias'])
    if razon is None:
        observaciones.append('Razón corriente no calculable: el pasivo corriente es cero.')
    if margen is None:
        observaciones.append('Margen neto no calculable: las ventas netas del mes son cero.')
    if not balance['comprobacion']['cuadra']:
        observaciones.append('Los saldos del Balance General requieren conciliación.')

    return {
        'anio': anio,
        'mes': mes,
        'fecha_corte': fecha_corte.isoformat(),
        'razon_corriente': str(razon) if razon is not None else None,
        'margen_neto': str(margen) if margen is not None else None,
        'activo_corriente': str(redondear(activo)),
        'pasivo_corriente': str(redondear(pasivo)),
        'ventas_netas': str(redondear(ventas)),
        'utilidad_neta': str(redondear(utilidad)),
        'balance_cuadra': balance['comprobacion']['cuadra'],
        'datos_provisionales': bool(observaciones),
        'advertencias': observaciones,
    }
