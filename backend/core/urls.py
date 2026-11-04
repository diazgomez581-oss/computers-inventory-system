
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from inventario.views import ProductoViewSet, LoginView
from proveedores.views import ProveedorViewSet


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


urlpatterns = [
    # Administrador de Django
    path('admin/', admin.site.urls),

    # CRUD de productos y proveedores
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
    path('api/', include('gastos.urls')),
]
