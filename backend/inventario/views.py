
from decimal import Decimal

from django.contrib.auth import authenticate
from django.db.models import (
    Sum,
    F,
    DecimalField,
    ExpressionWrapper
)
from django.db.models.deletion import ProtectedError

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Producto, MovimientoKardex
from .serializers import ProductoSerializer


class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all().order_by('-id')
    serializer_class = ProductoSerializer
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        producto = self.get_object()

        if producto.movimientos.exists():
            return Response(
                {
                    'detail': (
                        'No se puede eliminar este producto '
                        'porque tiene movimientos registrados '
                        'en el Kárdex.'
                    )
                },
                status=status.HTTP_409_CONFLICT
            )

        try:
            producto.delete()
        except ProtectedError:
            return Response(
                {
                    'detail': (
                        'No se puede eliminar el producto '
                        'porque tiene registros relacionados.'
                    )
                },
                status=status.HTTP_409_CONFLICT
            )

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )

    @action(detail=False, methods=['get'])
    def metricas_dashboard(self, request):

        productos = Producto.objects.all()

        total_inversion = sum(
            (
                producto.stock * producto.costo_promedio
                for producto in productos
            ),
            Decimal('0.00')
        )

        total_items_stock = sum(
            producto.stock for producto in productos
        )

        total_catalogo = productos.count()

        return Response({
            'inversion_bodega': round(total_inversion, 2),
            'unidades_stock': total_items_stock,
            'total_productos': total_catalogo,

            # Datos provisionales hasta completar ventas y finanzas.
            'ventas_mes': 86400.00,
            'utilidad_neta': 11250.00,
            'razon_corriente': 1.82,
            'gastos_mes': 2450.00,
        })


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        valor_inventario = ExpressionWrapper(
            F('stock') * F('costo_promedio'),
            output_field=DecimalField(
                max_digits=18,
                decimal_places=4
            )
        )

        total_bodega = Producto.objects.aggregate(
            total=Sum(valor_inventario)
        )['total'] or Decimal('0.00')

        total_productos = Producto.objects.count()

        total_salidas = MovimientoKardex.objects.filter(
            tipo='SALIDA'
        ).aggregate(
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

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user is not None:
            token, _ = Token.objects.get_or_create(user=user)

            return Response({
                'mensaje': 'Inicio de sesión exitoso',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'nombre': user.first_name or user.username,
                    'rol': (
                        'Administrador'
                        if user.is_staff
                        else 'Operador'
                    ),
                    'token': token.key,
                }
            }, status=status.HTTP_200_OK)

        return Response({
            'error': (
                'Credenciales inválidas. '
                'Verifica usuario y contraseña.'
            )
        }, status=status.HTTP_401_UNAUTHORIZED)
