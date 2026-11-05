from decimal import Decimal

from django.conf import settings
from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('inventario', '0005_alter_movimientokardex_producto'),
        ('proveedores', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Compra',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('numero_documento', models.CharField(max_length=60, unique=True)),
                ('fecha', models.DateTimeField(auto_now_add=True)),
                ('subtotal_neto', models.DecimalField(decimal_places=2, max_digits=14)),
                ('iva_credito_fiscal', models.DecimalField(decimal_places=2, max_digits=14)),
                ('total_pagar', models.DecimalField(decimal_places=2, max_digits=14)),
                ('proveedor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='compras', to='proveedores.proveedor')),
                ('registrado_por', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='compras_registradas', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-fecha', '-id']},
        ),
        migrations.CreateModel(
            name='DetalleCompra',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cantidad', models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
                ('costo_unitario_neto', models.DecimalField(decimal_places=4, max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal('0.0001'))])),
                ('subtotal_neto', models.DecimalField(decimal_places=2, max_digits=14)),
                ('costo_promedio_anterior', models.DecimalField(decimal_places=4, max_digits=12)),
                ('costo_promedio_nuevo', models.DecimalField(decimal_places=4, max_digits=12)),
                ('stock_anterior', models.PositiveIntegerField()),
                ('stock_nuevo', models.PositiveIntegerField()),
                ('compra', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='detalles', to='compras.compra')),
                ('producto', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='inventario.producto')),
            ],
        ),
        migrations.AddConstraint(
            model_name='detallecompra',
            constraint=models.UniqueConstraint(fields=('compra', 'producto'), name='compra_producto_unico'),
        ),
    ]
