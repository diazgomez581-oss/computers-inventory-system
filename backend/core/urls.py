
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from inventario.views import ProductoViewSet, LoginView


# Rutas automáticas para el catálogo de productos
router = DefaultRouter()
router.register(
    r'productos',
    ProductoViewSet,
    basename='productos'
)


urlpatterns = [
    # Administrador de Django
    path('admin/', admin.site.urls),

    # CRUD de productos y métricas del dashboard
    path('api/', include(router.urls)),

    # Inicio de sesión
    path(
        'api/login/',
        LoginView.as_view(),
        name='login'
    ),

    # Estadísticas adicionales de inventario
    path(
        'api/',
        include('inventario.urls')
    ),
]
