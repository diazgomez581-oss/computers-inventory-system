"""Registros financieros propios de FIN-03; no modifica Compra ni Venta."""
from decimal import Decimal
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class AporteCapital(models.Model):
    """Aportación de dinero efectivamente recibida (no valor de inventario)."""
    fecha = models.DateField()
    descripcion = models.CharField(max_length=200)
    monto = models.DecimalField(
        max_digits=14, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='aportes_capital_fin03'
    )

    class Meta:
        ordering = ['fecha', 'id']
        verbose_name = 'Aporte de capital en efectivo'
        verbose_name_plural = 'Aportes de capital en efectivo'

    def __str__(self):
        return f'{self.fecha}: {self.descripcion} (${self.monto})'
