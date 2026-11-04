
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import GastoOperativoViewSet

router = DefaultRouter()

router.register(
    r'gastos',
    GastoOperativoViewSet,
    basename='gastos'
)

urlpatterns = [
    path('', include(router.urls)),
]
