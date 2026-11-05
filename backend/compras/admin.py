from django.contrib import admin
from .models import Compra, DetalleCompra


class DetalleCompraInline(admin.TabularInline):
    model = DetalleCompra
    extra = 0
    can_delete = False
    readonly_fields = [
        'producto', 'cantidad', 'costo_unitario_neto', 'subtotal_neto',
        'stock_anterior', 'stock_nuevo', 'costo_promedio_anterior', 'costo_promedio_nuevo'
    ]


@admin.register(Compra)
class CompraAdmin(admin.ModelAdmin):
    list_display = ['numero_documento', 'fecha', 'proveedor', 'subtotal_neto', 'iva_credito_fiscal', 'total_pagar']
    readonly_fields = ['numero_documento', 'proveedor', 'fecha', 'subtotal_neto', 'iva_credito_fiscal', 'total_pagar', 'registrado_por']
    inlines = [DetalleCompraInline]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
