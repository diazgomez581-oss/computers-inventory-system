"""API financiera de FIN-03."""
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .services import calcular_estado_resultados


class EstadoResultadosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hoy = timezone.localdate()
        try:
            anio = int(request.query_params.get("anio", hoy.year))
            mes = int(request.query_params.get("mes", hoy.month))
            if not (1 <= anio <= 9999):
                raise ValueError
            resultado = calcular_estado_resultados(anio, mes)
        except (ValueError, TypeError):
            return Response(
                {"detail": "El año o mes proporcionado no es válido."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(resultado)


# ============================================================
# FIN-03 | 2. BALANCE GENERAL
# ============================================================

from datetime import date
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .services import calcular_balance_general


class BalanceGeneralView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        texto = request.query_params.get('fecha', timezone.localdate().isoformat())
        try:
            fecha = date.fromisoformat(texto)
        except (ValueError, TypeError):
            return Response({'detail': 'La fecha debe usar AAAA-MM-DD.'},
                            status=status.HTTP_400_BAD_REQUEST)
        return Response(calcular_balance_general(fecha))


# ============================================================
# FIN-03 | 3. RAZONES FINANCIERAS
# ============================================================

from .services import calcular_razones_financieras


class RazonesFinancierasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hoy = timezone.localdate()
        try:
            anio = int(request.query_params.get('anio', hoy.year))
            mes = int(request.query_params.get('mes', hoy.month))
            if not (1 <= anio <= 9999 and 1 <= mes <= 12):
                raise ValueError
            resultado = calcular_razones_financieras(anio, mes)
        except (ValueError, TypeError, OverflowError):
            return Response({'detail': 'El período indicado no es válido.'},
                            status=status.HTTP_400_BAD_REQUEST)
        return Response(resultado)
