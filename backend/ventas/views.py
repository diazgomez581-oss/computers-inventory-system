
from decimal import Decimal

from django.db.models import Sum
from django.db.models.functions import Coalesce
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Venta
from .serializers import (
    CrearVentaSerializer,
    VentaSerializer,
    ProductoVentaSerializer,
)
from inventario.models import Producto


class VentaViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]

    queryset = Venta.objects.select_related(
        "registrado_por"
    ).prefetch_related(
        "detalles__producto"
    ).order_by("-fecha", "-id")

    def get_serializer_class(self):
        if self.action == "create":
            return CrearVentaSerializer
        return VentaSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        anio = self.request.query_params.get("anio")
        mes = self.request.query_params.get("mes")
        estado = self.request.query_params.get("estado")

        if anio:
            queryset = queryset.filter(fecha__year=anio)

        if mes:
            queryset = queryset.filter(fecha__month=mes)

        if estado:
            queryset = queryset.filter(estado=estado)

        return queryset

    def list(self, request):
        queryset = self.filter_queryset(
            self.get_queryset()
        )

        serializer = VentaSerializer(
            queryset,
            many=True
        )

        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        venta = self.get_object()

        serializer = VentaSerializer(venta)

        return Response(serializer.data)

    def create(self, request):
        serializer = CrearVentaSerializer(
            data=request.data,
            context={"request": request}
        )

        serializer.is_valid(raise_exception=True)

        venta = serializer.save()

        resultado = VentaSerializer(venta)

        return Response(
            resultado.data,
            status=status.HTTP_201_CREATED
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="productos"
    )
    def productos(self, request):
        productos = Producto.objects.filter(
            stock__gt=0
        ).order_by("descripcion")

        serializer = ProductoVentaSerializer(
            productos,
            many=True
        )

        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        url_path="resumen"
    )
    def resumen(self, request):
        queryset = self.get_queryset().filter(
            estado="EMITIDA"
        )

        totales = queryset.aggregate(
            ventas_netas=Coalesce(
                Sum("subtotal"),
                Decimal("0.00")
            ),
            iva_debito=Coalesce(
                Sum("iva"),
                Decimal("0.00")
            ),
            total_cobrado=Coalesce(
                Sum("total"),
                Decimal("0.00")
            ),
            costo_ventas=Coalesce(
                Sum("costo_total"),
                Decimal("0.00")
            ),
        )

        utilidad_bruta = (
            totales["ventas_netas"]
            - totales["costo_ventas"]
        )

        return Response({
            "cantidad_ventas": queryset.count(),
            "ventas_netas": totales["ventas_netas"],
            "iva_debito": totales["iva_debito"],
            "total_cobrado": totales["total_cobrado"],
            "costo_ventas": totales["costo_ventas"],
            "utilidad_bruta": utilidad_bruta,
        })
