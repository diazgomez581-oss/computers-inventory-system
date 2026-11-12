
from django.urls import path

from .views import DashboardStatsView
from .kardex_views import KardexProductoView


urlpatterns = [
    path(
        'dashboard-stats/',
        DashboardStatsView.as_view(),
        name='dashboard-stats'
    ),

    path(
        'kardex/',
        KardexProductoView.as_view(),
        name='kardex-producto'
    ),
]
