
from datetime import date
from decimal import Decimal

from django.db.models import Sum
from django.db.models.functions import Coalesce
from django.utils import timezone

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import GastoOperativo
from .serializers import GastoOperativoSerializer


class GastoOperativoViewSet(viewsets.ModelViewSet):
    """
    FIN-02: Gestión de gastos operativos.

    Permite:
    - Registrar gastos.
    - Consultar gastos.
    - Editar gastos.
    - Eliminar gastos.
    - Consultar acumulados mensuales.
    """

    serializer_class = GastoOperativoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = GastoOperativo.objects.select_related(
            "registrado_por"
        ).all()

        anio = self.request.query_params.get("anio")
        mes = self.request.query_params.get("mes")
        categoria = self.request.query_params.get("categoria")

        if anio:
            queryset = queryset.filter(fecha__year=anio)

        if mes:
            queryset = queryset.filter(fecha__month=mes)

        if categoria:
            queryset = queryset.filter(categoria=categoria)

        return queryset.order_by("-fecha", "-id")

    def perform_create(self, serializer):
        serializer.save(
            registrado_por=self.request.user
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="resumen-mensual"
    )
    def resumen_mensual(self, request):
        """
        Devuelve los gastos acumulados del mes.

        Ejemplo:
        /api/gastos/resumen-mensual/?anio=2026&mes=11
        """

        hoy = timezone.localdate()

        try:
            anio = int(
                request.query_params.get("anio", hoy.year)
            )
            mes = int(
                request.query_params.get("mes", hoy.month)
            )

            if anio < 1 or anio > 9999:
                raise ValueError

            date(anio, mes, 1)

        except (ValueError, TypeError):
            return Response(
                {
                    "detail": (
                        "El año o mes proporcionado "
                        "no es válido."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        gastos = GastoOperativo.objects.filter(
            fecha__year=anio,
            fecha__month=mes
        )

        totales = gastos.values(
            "categoria"
        ).annotate(
            total=Coalesce(
                Sum("monto"),
                Decimal("0.00")
            )
        )

        total_administracion = Decimal("0.00")
        total_venta = Decimal("0.00")

        for registro in totales:
            if registro["categoria"] == "ADMINISTRACION":
                total_administracion = registro["total"]

            elif registro["categoria"] == "VENTA":
                total_venta = registro["total"]

        total_general = (
            total_administracion + total_venta
        )

        return Response({
            "anio": anio,
            "mes": mes,
            "total_administracion": str(
                total_administracion.quantize(
                    Decimal("0.01")
                )
            ),
            "total_venta": str(
                total_venta.quantize(
                    Decimal("0.01")
                )
            ),
            "total_gastos": str(
                total_general.quantize(
                    Decimal("0.01")
                )
            ),
            "cantidad_registros": gastos.count()
        })
