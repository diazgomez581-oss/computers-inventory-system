
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.db.models import F
from rest_framework.exceptions import ValidationError

from inventario.models import Producto, MovimientoKardex
from .models import Venta, DetalleVenta


CENTAVO = Decimal("0.01")
IVA_FACTOR = Decimal("1.13")


def redondear(valor):
    return Decimal(valor).quantize(
        CENTAVO,
        rounding=ROUND_HALF_UP
    )


@transaction.atomic
def registrar_venta(*, usuario, cliente, productos):
    """
    Registra una venta multiproducto.

    Los precios recibidos incluyen IVA del 13%.
    El backend calcula los importes y registra
    las salidas de inventario y Kárdex.
    """

    if not usuario or not usuario.is_authenticated:
        raise ValidationError(
            "Debe iniciar sesión para registrar ventas."
        )

    if not productos:
        raise ValidationError(
            "Debe agregar al menos un producto."
        )

    ids = [item["producto_id"] for item in productos]

    if len(ids) != len(set(ids)):
        raise ValidationError(
            "No puede repetir el mismo producto en la venta."
        )

    productos_db = {
        p.id: p
        for p in Producto.objects.select_for_update()
        .filter(id__in=ids)
        .order_by("id")
    }

    detalles_preparados = []
    total_cobrado = Decimal("0.00")
    costo_total_venta = Decimal("0.00")

    for item in productos:
        producto_id = item["producto_id"]
        cantidad = item["cantidad"]
        precio = redondear(item["precio_unitario"])

        producto = productos_db.get(producto_id)

        if producto is None:
            raise ValidationError(
                f"El producto {producto_id} no existe."
            )

        if cantidad <= 0:
            raise ValidationError(
                "La cantidad debe ser mayor que cero."
            )

        if precio <= 0:
            raise ValidationError(
                "El precio debe ser mayor que cero."
            )

        if producto.stock < cantidad:
            raise ValidationError(
                f"Stock insuficiente para "
                f"{producto.descripcion}. "
                f"Disponible: {producto.stock}, "
                f"solicitado: {cantidad}."
            )

        importe = redondear(precio * cantidad)

        costo_unitario = producto.costo_promedio

        costo_linea = redondear(
            costo_unitario * cantidad
        )

        detalles_preparados.append({
            "producto": producto,
            "cantidad": cantidad,
            "precio": precio,
            "importe": importe,
            "costo_unitario": costo_unitario,
            "costo_linea": costo_linea,
        })

        total_cobrado += importe
        costo_total_venta += costo_linea

    total_cobrado = redondear(total_cobrado)
    subtotal_neto = redondear(
        total_cobrado / IVA_FACTOR
    )
    iva_debito = total_cobrado - subtotal_neto

    venta = Venta.objects.create(
        cliente=(cliente or "Consumidor final").strip(),
        subtotal=subtotal_neto,
        iva=iva_debito,
        total=total_cobrado,
        costo_total=redondear(costo_total_venta),
        registrado_por=usuario,
        estado="EMITIDA",
    )

    # Número correlativo interno, no número fiscal DTE.
    venta.numero_comprobante = f"VTA-{venta.id:08d}"
    venta.save(update_fields=["numero_comprobante"])

    for item in detalles_preparados:
        producto = item["producto"]
        cantidad = item["cantidad"]

        # Actualización condicional para evitar stock negativo,
        # incluso cuando varias ventas compiten por existencias.
        actualizados = Producto.objects.filter(
            pk=producto.pk,
            stock__gte=cantidad
        ).update(stock=F("stock") - cantidad)

        if actualizados != 1:
            raise ValidationError(
                f"El stock de {producto.descripcion} "
                "cambió durante la operación. "
                "Intente nuevamente."
            )

        producto.refresh_from_db(fields=["stock"])

        DetalleVenta.objects.create(
            venta=venta,
            producto=producto,
            cantidad=cantidad,
            precio_unitario=item["precio"],
            costo_unitario=item["costo_unitario"],
            subtotal=item["importe"],
            costo_total=item["costo_linea"],
        )

        MovimientoKardex.objects.create(
            producto=producto,
            tipo="SALIDA",
            detalle=(
                f"Venta {venta.numero_comprobante}"
            ),
            cantidad_entrada=0,
            costo_unitario_entrada=Decimal("0.0000"),
            total_entrada=Decimal("0.00"),
            cantidad_salida=cantidad,
            costo_unitario_salida=item["costo_unitario"],
            total_salida=item["costo_linea"],
            saldo_cantidad=producto.stock,
            saldo_costo_unitario=producto.costo_promedio,
            saldo_total=redondear(
                producto.stock * producto.costo_promedio
            ),
        )

    return venta
