
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class GastoOperativo(models.Model):

    class Categoria(models.TextChoices):
        ADMINISTRACION = "ADMINISTRACION", "Administración"
        VENTA = "VENTA", "Venta"

    fecha = models.DateField(
        default=timezone.localdate,
        verbose_name="Fecha del gasto"
    )

    categoria = models.CharField(
        max_length=20,
        choices=Categoria.choices,
        verbose_name="Categoría"
    )

    descripcion = models.CharField(
        max_length=255,
        verbose_name="Descripción"
    )

    monto = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Monto en USD"
    )

    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="gastos_operativos",
        verbose_name="Registrado por"
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True
    )

    fecha_actualizacion = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "gastos_operativos"
        verbose_name = "Gasto operativo"
        verbose_name_plural = "Gastos operativos"
        ordering = ["-fecha", "-id"]
        indexes = [
            models.Index(
                fields=["fecha", "categoria"],
                name="gastos_fecha_cat_idx"
            )
        ]

    def clean(self):
        super().clean()

        if self.descripcion is not None:
            self.descripcion = self.descripcion.strip()

        if not self.descripcion:
            raise ValidationError({
                "descripcion": "La descripción es obligatoria."
            })

        if self.monto is not None and self.monto <= Decimal("0.00"):
            raise ValidationError({
                "monto": "El monto debe ser mayor que cero."
            })

        if self.categoria not in self.Categoria.values:
            raise ValidationError({
                "categoria": "Seleccione una categoría válida."
            })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.fecha} - "
            f"{self.get_categoria_display()} - "
            f"{self.descripcion} - "
            f"${self.monto}"
        )
