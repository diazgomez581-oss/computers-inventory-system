from django.db import models
from decimal import Decimal
from django.db import models
from django.core.exceptions import ValidationError

class Producto(models.Model):
    CATEGORIAS = [
        ('COMPONENTES', 'Componentes (RAM, CPU, GPU, Fuentes)'),
        ('ALMACENAMIENTO', 'Almacenamiento (SSD, HDD, M.2)'),
        ('PERIFERICOS', 'Periféricos (Monitores, Teclados, Mouse)'),
        ('REDES', 'Redes y Conectividad'),
        ('ACCESORIOS', 'Accesorios y Varios'),
    ]

    codigo = models.CharField(max_length=50, unique=True, blank=True, verbose_name="Código")
    categoria = models.CharField(max_length=50, choices=CATEGORIAS, default='COMPONENTES')
    marca = models.CharField(max_length=100, blank=True, default='')
    modelo = models.CharField(max_length=100, blank=True, default='')
    descripcion = models.CharField(max_length=255, verbose_name="Descripción / Nombre del producto")
    stock = models.IntegerField(default=0, verbose_name="Stock Disponible")
    costo_promedio = models.DecimalField(
        max_digits=12, decimal_places=4, default=0.0000, verbose_name="Costo Promedio (WAC)"
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Validación para que no existan dos productos idénticos
        constraints = [
            models.UniqueConstraint(
                fields=['marca', 'modelo', 'descripcion'], 
                name='unique_producto_item'
            )
        ]

    def clean(self):
        # Limpieza de espacios en blanco
        self.descripcion = self.descripcion.strip()
        self.marca = self.marca.strip()
        self.modelo = self.modelo.strip()

        # Validación personalizada insensible a mayúsculas/minúsculas
        existe = Producto.objects.filter(
            descripcion__iexact=self.descripcion,
            marca__iexact=self.marca,
            modelo__iexact=self.modelo
        ).exclude(id=self.id).exists()

        if existe:
            raise ValidationError("Ya existe un producto registrado con esa misma marca, modelo y descripción.")

    def save(self, *args, **kwargs):
        self.clean()
        if not self.codigo:
            ultimo = Producto.objects.order_by('-id').first()
            siguiente_id = (ultimo.id + 1) if ultimo else 1
            self.codigo = f"PROD-{siguiente_id:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.codigo} - {self.descripcion}"

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



