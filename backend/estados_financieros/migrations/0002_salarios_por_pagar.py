from decimal import Decimal
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


class Migration(migrations.Migration):
    dependencies = [
        ('estados_financieros', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SalarioPorPagar',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha_devengo', models.DateField()),
                ('fecha_vencimiento', models.DateField()),
                ('descripcion', models.CharField(max_length=200)),
                ('monto', models.DecimalField(decimal_places=2, max_digits=14, validators=[django.core.validators.MinValueValidator(Decimal('0.01'))])),
                ('registrado_por', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='salarios_por_pagar_fin03', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['fecha_devengo', 'id'], 'verbose_name': 'Salario por pagar', 'verbose_name_plural': 'Salarios por pagar'},
        ),
        migrations.CreateModel(
            name='PagoSalario',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha', models.DateField()),
                ('monto', models.DecimalField(decimal_places=2, max_digits=14, validators=[django.core.validators.MinValueValidator(Decimal('0.01'))])),
                ('observacion', models.CharField(blank=True, max_length=200)),
                ('registrado_por', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='pagos_salarios_fin03', to=settings.AUTH_USER_MODEL)),
                ('salario', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='pagos', to='estados_financieros.salarioporpagar')),
            ],
            options={'ordering': ['fecha', 'id'], 'verbose_name': 'Pago de salario', 'verbose_name_plural': 'Pagos de salarios'},
        ),
    ]
