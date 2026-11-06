from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction, IntegrityError
from rest_framework.exceptions import ValidationError

from inventario.models import Producto, MovimientoKardex
from .models import Compra, DetalleCompra

CENT = Decimal('0.01')
FOUR = Decimal('0.0001')
IVA = Decimal('0.13')


def money(value):
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


@transaction.atomic

def registrar_compra(datos, usuario):
    # Bloqueo por producto para evitar que dos compras recalculen el mismo saldo simultáneamente.
    # En SQLite el bloqueo se aplica a nivel de escritura; en PostgreSQL es select_for_update.
    detalles = datos['detalles']
    ids = sorted(item['producto'].pk for item in detalles)
    productos = {
        p.pk: p for p in Producto.objects.select_for_update().filter(pk__in=ids).order_by('pk')
    }
    if len(productos) != len(ids):
        raise ValidationError({'detalles': 'Uno de los productos ya no existe.'})

    subtotal = sum((money(Decimal(item['cantidad']) * item['costo_unitario_neto']) for item in detalles), Decimal('0.00'))
    impuesto = money(subtotal * IVA)
    compra = Compra.objects.create(
        numero_documento=datos['numero_documento'],
        proveedor=datos.get('proveedor'),
        subtotal_neto=subtotal,
        iva_credito_fiscal=impuesto,
        total_pagar=subtotal + impuesto,
        registrado_por=usuario,
    )

    for item in detalles:
        producto = productos[item['producto'].pk]
        previo = producto.stock
        costo_anterior = producto.costo_promedio
        cantidad = item['cantidad']
        costo = item['costo_unitario_neto']
        nuevo_stock = previo + cantidad
        nuevo_promedio = (
            (Decimal(previo) * costo_anterior + Decimal(cantidad) * costo)
            / Decimal(nuevo_stock)
        ).quantize(FOUR, rounding=ROUND_HALF_UP)
        detalle = DetalleCompra.objects.create(
            compra=compra,
            producto=producto,
            cantidad=cantidad,
            costo_unitario_neto=costo,
            subtotal_neto=money(Decimal(cantidad) * costo),
            costo_promedio_anterior=costo_anterior,
            costo_promedio_nuevo=nuevo_promedio,
            stock_anterior=previo,
            stock_nuevo=nuevo_stock,
        )
        producto.stock = nuevo_stock
        producto.costo_promedio = nuevo_promedio
        producto.save(update_fields=['stock', 'costo_promedio'])
        MovimientoKardex.objects.create(
            producto=producto,
            tipo='ENTRADA',
            detalle=f'Compra {compra.numero_documento} (ID {compra.pk})',
            cantidad_entrada=cantidad,
            costo_unitario_entrada=costo,
            total_entrada=detalle.subtotal_neto,
            saldo_cantidad=nuevo_stock,
            saldo_costo_unitario=nuevo_promedio,
            saldo_total=money(Decimal(nuevo_stock) * nuevo_promedio),
        )
    return compra
