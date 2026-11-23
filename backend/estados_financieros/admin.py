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
