
from decimal import Decimal

from rest_framework import serializers

from inventario.models import Producto
from .models import Venta, DetalleVenta
from .services import registrar_venta


class ProductoVentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = [
            "id",
            "codigo",
            "descripcion",
            "marca",
            "modelo",
            "stock",
            "costo_promedio",
        ]


class DetalleVentaSerializer(serializers.ModelSerializer):
    producto_codigo = serializers.CharField(
        source="producto.codigo",
        read_only=True,
    )
    producto_descripcion = serializers.CharField(
        source="producto.descripcion",
        read_only=True,
    )

    class Meta:
        model = DetalleVenta
        fields = [
            "id",
            "producto",
            "producto_codigo",
            "producto_descripcion",
            "cantidad",
            "precio_unitario",
            "costo_unitario",
            "subtotal",
            "costo_total",
        ]


class VentaSerializer(serializers.ModelSerializer):
    detalles = DetalleVentaSerializer(
        many=True,
        read_only=True,
    )
    registrado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Venta
        fields = [
            "id",
            "numero_comprobante",
            "fecha",
            "cliente",
            "subtotal",
            "iva",
            "total",
            "costo_total",
            "estado",
            "registrado_por_nombre",
            "detalles",
        ]

    def get_registrado_por_nombre(self, obj):
        return obj.registrado_por.get_username()


class ProductoEntradaSerializer(serializers.Serializer):
    producto_id = serializers.IntegerField(min_value=1)
    cantidad = serializers.IntegerField(min_value=1)

    # Recargo porcentual sobre el costo WAC.
    # No se recibe el precio final del navegador.
    porcentaje_ganancia = serializers.DecimalField(
        max_digits=12,
        decimal_places=4,
        min_value=Decimal("0.0001"),
    )


class CrearVentaSerializer(serializers.Serializer):
    cliente = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
        default="Consumidor final",
    )

    productos = ProductoEntradaSerializer(
        many=True,
        allow_empty=False,
    )

    def validate_productos(self, productos):
        ids = [
            item["producto_id"]
            for item in productos
        ]

        if len(ids) != len(set(ids)):
            raise serializers.ValidationError(
                "No agregue un mismo producto dos veces. "
                "Modifique su cantidad en la fila existente."
            )

        return productos

    def create(self, validated_data):
        request = self.context["request"]

        return registrar_venta(
            usuario=request.user,
            cliente=validated_data.get(
                "cliente", "Consumidor final"
            ),
            productos=validated_data["productos"],
        )
