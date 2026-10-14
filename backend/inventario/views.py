from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, F
from decimal import Decimal
from .models import Producto, MovimientoKardex

class DashboardStatsView(APIView):
    def get(self, request):
        # 1. Total en bodega a costo promedio ponderado
        total_bodega = Producto.objects.aggregate(
            total=Sum(F('stock_actual') * F('costo_promedio'))
        )['total'] or Decimal('0.00')

        # 2. Cantidad de productos registrados
        total_productos = Producto.objects.count()

        # 3. Total de salidas registradas
        total_salidas = MovimientoKardex.objects.filter(tipo='SALIDA').aggregate(
            salidas=Sum('cantidad_salida')
        )['salidas'] or 0

        return Response({
            'total_bodega': f"${total_bodega:,.2f}",
            'total_productos': total_productos,
            'total_salidas': f"{total_salidas} unidades",
        })