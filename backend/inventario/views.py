from decimal import Decimal
from django.contrib.auth import authenticate
from django.db.models import Sum, F
from .models import Producto, MovimientoKardex
from .serializers import ProductoSerializer
from rest_framework.decorators import action
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all().order_by('-id')
    serializer_class = ProductoSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def metricas_dashboard(self, request):
        # 1. Total invertido en bodega a costo promedio (Criterio de aceptación STB-3)
        productos = Producto.objects.all()
        total_inversion = sum(p.stock * float(p.costo_promedio) for p in productos)
        total_items_stock = sum(p.stock for p in productos)
        total_catalogo = productos.count()

        # Datos financieros y de ventas (preparados para cuando se registren facturas)
        return Response({
            "inversion_bodega": round(total_inversion, 2),
            "unidades_stock": total_items_stock,
            "total_productos": total_catalogo,
            "ventas_mes": 86400.00,       # Simulado hasta Sprint 2 (VENT-01)
            "utilidad_neta": 11250.00,    # Simulado hasta Sprint 2 (FIN-03)
            "razon_corriente": 1.82,      # Activo Corriente / Pasivo Corriente
            "gastos_mes": 2450.00,
        })



class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

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

class LoginView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(request, username=username, password=password)
        if user is not None:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "mensaje": "Inicio de sesión exitoso",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "nombre": user.first_name or user.username,
                    "rol": "Administrador" if user.is_staff else "Operador",
                    "token": token.key,
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {"error": "Credenciales inválidas. Verifica usuario y contraseña."},
                status=status.HTTP_401_UNAUTHORIZED
            )