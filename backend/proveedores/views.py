
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Proveedor
from .serializers import ProveedorSerializer


class ProveedorViewSet(viewsets.ModelViewSet):
    serializer_class = ProveedorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Proveedor.objects.all().order_by('razon_social')

    @action(detail=False, methods=['get'], url_path='activos')
    def activos(self, request):
        proveedores = Proveedor.objects.filter(
            activo=True
        ).order_by('razon_social')

        serializer = self.get_serializer(
            proveedores,
            many=True
        )

        return Response(serializer.data)
