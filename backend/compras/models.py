from decimal import Decimal

from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator


class Compra(models.Model):
    numero_documento = models.CharField(max_length=60, unique=True)
    proveedor = models.ForeignKey(
        'proveedores.Proveedor', on_delete=models.PROTECT,
        blank=True, null=True, related_name='compras'
    )
    fecha = models.DateTimeField(auto_now_add=True)
    subtotal_neto = models.DecimalField(max_digits=14, decimal_places=2)
    iva_credito_fiscal = models.DecimalField(max_digits=14, decimal_places=2)
    total_pagar = models.DecimalField(max_digits=14, decimal_places=2)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='compras_registradas'
    )

    class Meta:
        ordering = ['-fecha', '-id']

    def __str__(self):
        return f'Compra {self.numero_documento}'


class DetalleCompra(models.Model):
    compra = models.ForeignKey(Compra, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey('inventario.Producto', on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    costo_unitario_neto = models.DecimalField(
        max_digits=12, decimal_places=4,
        validators=[MinValueValidator(Decimal('0.0001'))]
    )
    subtotal_neto = models.DecimalField(max_digits=14, decimal_places=2)
    costo_promedio_anterior = models.DecimalField(max_digits=12, decimal_places=4)
    costo_promedio_nuevo = models.DecimalField(max_digits=12, decimal_places=4)
    stock_anterior = models.PositiveIntegerField()
    stock_nuevo = models.PositiveIntegerField()

    class Meta:
        constraints = [models.UniqueConstraint(fields=['compra', 'producto'], name='compra_producto_unico')]
