"""FIN-03 | Rutas de los estados financieros."""
from django.urls import path
from .views import EstadoResultadosView, BalanceGeneralView, RazonesFinancierasView

urlpatterns = [
    # FIN-03 | 1. Estado de Resultados
    path("estado-resultados/", EstadoResultadosView.as_view(), name="estado-resultados"),

    # FIN-03 | 2. Balance General
    path("balance-general/", BalanceGeneralView.as_view(), name="balance-general"),
    # FIN-03 | 3. Razones Financieras
    path("razones-financieras/", RazonesFinancierasView.as_view(), name="razones-financieras"),
]
