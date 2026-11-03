
from django.db import models


class Proveedor(models.Model):
    razon_social = models.CharField(
        max_length=200,
        verbose_name="Razón social"
    )

    nrc = models.CharField(
        max_length=30,
        unique=True,
        verbose_name="NRC"
    )

    nit = models.CharField(
        max_length=30,
        unique=True,
        verbose_name="NIT"
    )

    telefono = models.CharField(
        max_length=20,
        verbose_name="Teléfono"
    )

    contacto = models.CharField(
        max_length=150,
        verbose_name="Persona de contacto"
    )

    activo = models.BooleanField(
        default=True,
        verbose_name="Proveedor activo"
    )

    fecha_registro = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ['razon_social']
        verbose_name = "Proveedor"
        verbose_name_plural = "Proveedores"

    def __str__(self):
        return f"{self.razon_social} - {self.nit}"
