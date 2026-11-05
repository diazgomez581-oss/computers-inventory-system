from decimal import Decimal

from rest_framework import serializers

from inventario.models import Producto
from proveedores.models import Proveedor
from .models import Compra, DetalleCompra


class DetalleCompraEntradaSerializer(serializers.Serializer):
    producto = serializers.PrimaryKeyRelatedField(queryset=Producto.objects.all())
    cantidad = serializers.IntegerField(min_value=1)
    costo_unitario_neto = serializers.DecimalField(
        max_digits=12, decimal_places=4, min_value=Decimal('0.0001')
    )


class CompraEntradaSerializer(serializers.Serializer):
    numero_documento = serializers.CharField(max_length=60, trim_whitespace=True)
    proveedor = serializers.PrimaryKeyRelatedField(
        queryset=Proveedor.objects.filter(activo=True), required=False, allow_null=True
    )
    detalles = DetalleCompraEntradaSerializer(many=True, allow_empty=False)

    def validate_numero_documento(self, value):
        if not value.strip():
            raise serializers.ValidationError('El número de factura o CCF es obligatorio.')
        if Compra.objects.filter(numero_documento=value).exists():
            raise serializers.ValidationError('Ya existe una compra con ese número de documento.')
        return value

    def validate_detalles(self, value):
        ids = [item['producto'].pk for item in value]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError('No repitas productos; combina sus cantidades en una sola fila.')
        return value


class DetalleCompraSalidaSerializer(serializers.ModelSerializer):
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    producto_descripcion = serializers.CharField(source='producto.descripcion', read_only=True)

    class Meta:
        model = DetalleCompra
        fields = [
            'id', 'producto', 'producto_codigo', 'producto_descripcion',
            'cantidad', 'costo_unitario_neto', 'subtotal_neto',
            'stock_anterior', 'stock_nuevo',
            'costo_promedio_anterior', 'costo_promedio_nuevo',
        ]


class CompraSalidaSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.CharField(source='proveedor.razon_social', read_only=True, default=None)
    registrado_por_nombre = serializers.CharField(source='registrado_por.username', read_only=True)
    detalles = DetalleCompraSalidaSerializer(many=True, read_only=True)

    class Meta:
        model = Compra
        fields = [
            'id', 'numero_documento', 'proveedor', 'proveedor_nombre',
            'fecha', 'subtotal_neto', 'iva_credito_fiscal', 'total_pagar',
            'registrado_por_nombre', 'detalles',
        ]
