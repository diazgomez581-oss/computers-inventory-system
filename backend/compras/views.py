from django.db import IntegrityError
from rest_framework import status, viewsets
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from .models import Compra
from .serializers import CompraEntradaSerializer, CompraSalidaSerializer
from .services import registrar_compra

class CompraViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Compra.objects.select_related('proveedor', 'registrado_por').prefetch_related('detalles__producto')
    serializer_class = CompraSalidaSerializer
    permission_classes = [IsAdminUser]

    def create(self, request):
        entrada = CompraEntradaSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        try:
            compra = registrar_compra(entrada.validated_data, request.user)
        except IntegrityError:
            return Response(
                {'numero_documento': ['Ya existe una compra con ese número de documento.']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(self.get_serializer(compra).data, status=status.HTTP_201_CREATED)
