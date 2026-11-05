
from decimal import Decimal
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Venta(models.Model):
    ESTADOS = [
        ("EMITIDA", "Emitida"),
        ("ANULADA", "Anulada"),
    ]

    fecha = models.DateTimeField(auto_now_add=True)

    numero_comprobante = models.CharField(
        max_length=30,
        unique=True,
        null=True,
        blank=True
    )

    cliente = models.CharField(
        max_length=150,
        default="Consumidor final"
    )

    subtotal = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00")
    )

    iva = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00")
    )

    total = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00")
    )

    costo_total = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00")
    )

    estado = models.CharField(
        max_length=10,
        choices=ESTADOS,
        default="EMITIDA"
    )

    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="ventas_registradas"
    )

    class Meta:
        db_table = "ventas"
        ordering = ["-fecha", "-id"]
        verbose_name = "Venta"
        verbose_name_plural = "Ventas"

    def __str__(self):
        return self.numero_comprobante or f"Venta #{self.pk}"


class DetalleVenta(models.Model):
    venta = models.ForeignKey(
        Venta,
        on_delete=models.CASCADE,
        related_name="detalles"
    )

    producto = models.ForeignKey(
        "inventario.Producto",
        on_delete=models.PROTECT,
        related_name="detalles_venta"
    )

    cantidad = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )

    precio_unitario = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.01"))
        ]
    )

    costo_unitario = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        default=Decimal("0.0000")
    )

    subtotal = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00")
    )

    costo_total = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00")
    )

    class Meta:
        db_table = "ventas_detalle"
        verbose_name = "Detalle de venta"
        verbose_name_plural = "Detalles de venta"

    def __str__(self):
        return f"{self.producto.codigo} x {self.cantidad}"
