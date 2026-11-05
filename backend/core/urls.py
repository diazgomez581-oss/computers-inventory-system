
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from inventario.views import ProductoViewSet, LoginView
from proveedores.views import ProveedorViewSet
from compras.views import CompraViewSet


# Rutas automáticas de la API
router = DefaultRouter()

# Catálogo de productos
router.register(
    r'productos',
    ProductoViewSet,
    basename='productos'
)

# Directorio y registro de proveedores
router.register(
    r'proveedores',
    ProveedorViewSet,
    basename='proveedores'
)

# COMP-02: Recepción y registro de compras
router.register(
    r'compras',
    CompraViewSet,
    basename='compras'
)


urlpatterns = [
    # Administrador de Django
    path('admin/', admin.site.urls),

    # CRUD de productos, proveedores y compras
    path(
        'api/',
        include(router.urls)
    ),

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

    # Gestión de gastos operativos
    path(
        'api/',
        include('gastos.urls')
    ),
]
