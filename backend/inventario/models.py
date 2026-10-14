from django.db import models
from decimal import Decimal

class Producto(models.Model):
    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    stock_actual = models.PositiveIntegerField(default=0)
    costo_promedio = models.DecimalField(max_digits=12, decimal_places=4, default=Decimal('0.0000'))
    precio_venta = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

class MovimientoKardex(models.Model):
    TIPO_CHOICES = (
        ('ENTRADA', 'Entrada (Compra)'),
        ('SALIDA', 'Salida (Venta)'),
    )

    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='movimientos')
    fecha = models.DateTimeField(auto_now_add=True)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    detalle = models.CharField(max_length=255)  # Ej: Factura F-001 o Venta Mostrador

    # Entrada
    cantidad_entrada = models.PositiveIntegerField(default=0)
    costo_unitario_entrada = models.DecimalField(max_digits=12, decimal_places=4, default=Decimal('0.0000'))
    total_entrada = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    # Salida
    cantidad_salida = models.PositiveIntegerField(default=0)
    costo_unitario_salida = models.DecimalField(max_digits=12, decimal_places=4, default=Decimal('0.0000'))
    total_salida = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    # Saldos acumulados en Kárdex
    saldo_cantidad = models.PositiveIntegerField()
    saldo_costo_unitario = models.DecimalField(max_digits=12, decimal_places=4)
    saldo_total = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.producto.nombre} | {self.tipo} | Saldo: {self.saldo_cantidad} u. @ ${self.saldo_costo_unitario}"