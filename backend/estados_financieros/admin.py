from decimal import Decimal
from django.contrib import admin
from .models import AporteCapital


@admin.register(AporteCapital)
class AporteCapitalAdmin(admin.ModelAdmin):
    list_display = ('fecha', 'descripcion', 'monto', 'registrado_por')
    list_filter = ('fecha',)
    search_fields = ('descripcion',)
    readonly_fields = ('registrado_por',)

    def save_model(self, request, obj, form, change):
        if not change:
            obj.registrado_por = request.user
        super().save_model(request, obj, form, change)


# ============================================================
# FIN-03 | 4. GESTION DE SALARIOS PENDIENTES
# ============================================================
from .models import SalarioPorPagar, PagoSalario
from django.db.models import Sum

@admin.register(SalarioPorPagar)
class SalarioPorPagarAdmin(admin.ModelAdmin):
    list_display = ('descripcion', 'fecha_devengo', 'fecha_vencimiento',
                    'monto', 'pagado', 'pendiente')
    list_filter = ('fecha_devengo', 'fecha_vencimiento')
    search_fields = ('descripcion',)
    readonly_fields = ('registrado_por',)

    @admin.display(description='Pagado')
    def pagado(self, obj):
        return obj.pagos.aggregate(s=Sum('monto'))['s'] or Decimal('0.00')

    @admin.display(description='Pendiente')
    def pendiente(self, obj):
        return obj.monto - self.pagado(obj)

    def save_model(self, request, obj, form, change):
        if not change:
            obj.registrado_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(PagoSalario)
class PagoSalarioAdmin(admin.ModelAdmin):
    list_display = ('salario', 'fecha', 'monto', 'registrado_por')
    list_filter = ('fecha',)
    search_fields = ('salario__descripcion',)
    readonly_fields = ('registrado_por',)

    def save_model(self, request, obj, form, change):
        if not change:
            obj.registrado_por = request.user
        super().save_model(request, obj, form, change)
