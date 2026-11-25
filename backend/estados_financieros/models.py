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


# ============================================================
# FIN-03 | 4. SALARIOS POR PAGAR (PASIVO CORRIENTE)
# ============================================================
class SalarioPorPagar(models.Model):
    """Obligación salarial devengada y todavía no necesariamente pagada.

    No duplicar este concepto en GastoOperativo: se reconoce aquí como
    gasto de administración al devengarse y como pasivo hasta su pago.
    """
    fecha_devengo = models.DateField()
    fecha_vencimiento = models.DateField()
    descripcion = models.CharField(max_length=200)
    monto = models.DecimalField(max_digits=14, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))])
    registrado_por = models.ForeignKey(settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT, related_name='salarios_por_pagar_fin03')

    class Meta:
        ordering = ['fecha_devengo', 'id']
        verbose_name = 'Salario por pagar'
        verbose_name_plural = 'Salarios por pagar'

    def __str__(self):
        return f'{self.descripcion} - ${self.monto}'

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.fecha_vencimiento and self.fecha_devengo and self.fecha_vencimiento < self.fecha_devengo:
            raise ValidationError({'fecha_vencimiento': 'No puede ser anterior al devengo.'})
        if self.pk and self.monto is not None:
            from django.db.models import Sum
            pagado = self.pagos.aggregate(total=Sum('monto'))['total'] or Decimal('0.00')
            if self.monto < pagado:
                raise ValidationError({'monto': 'El monto no puede ser menor que los pagos registrados.'})


class PagoSalario(models.Model):
    """Abono real a un salario pendiente; disminuye efectivo y deuda."""
    salario = models.ForeignKey(SalarioPorPagar, on_delete=models.PROTECT,
        related_name='pagos')
    fecha = models.DateField()
    monto = models.DecimalField(max_digits=14, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))])
    observacion = models.CharField(max_length=200, blank=True)
    registrado_por = models.ForeignKey(settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT, related_name='pagos_salarios_fin03')

    class Meta:
        ordering = ['fecha', 'id']
        verbose_name = 'Pago de salario'
        verbose_name_plural = 'Pagos de salarios'

    def __str__(self):
        return f'{self.fecha}: ${self.monto} - {self.salario_id}'

    def clean(self):
        from django.core.exceptions import ValidationError
        from django.db.models import Sum
        if not self.salario_id or self.monto is None:
            return
        if self.fecha and self.fecha < self.salario.fecha_devengo:
            raise ValidationError({'fecha': 'El pago no puede ser anterior al devengo.'})
        otros = PagoSalario.objects.filter(salario_id=self.salario_id)
        if self.pk:
            otros = otros.exclude(pk=self.pk)
        pagado = otros.aggregate(total=Sum('monto'))['total'] or Decimal('0.00')
        if pagado + self.monto > self.salario.monto:
            raise ValidationError({'monto': 'La suma de pagos supera el salario adeudado.'})
