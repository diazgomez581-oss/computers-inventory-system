
from decimal import Decimal

from rest_framework import serializers

from .models import GastoOperativo


class GastoOperativoSerializer(serializers.ModelSerializer):

    categoria_nombre = serializers.CharField(
        source="get_categoria_display",
        read_only=True
    )

    registrado_por_nombre = serializers.CharField(
        source="registrado_por.username",
        read_only=True
    )

    class Meta:
        model = GastoOperativo

        fields = [
            "id",
            "fecha",
            "categoria",
            "categoria_nombre",
            "descripcion",
            "monto",
            "registrado_por",
            "registrado_por_nombre",
            "fecha_creacion",
            "fecha_actualizacion",
        ]

        read_only_fields = [
            "id",
            "registrado_por",
            "registrado_por_nombre",
            "fecha_creacion",
            "fecha_actualizacion",
        ]

    def validate_descripcion(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "La descripción del gasto es obligatoria."
            )

        return value

    def validate_monto(self, value):
        if value <= Decimal("0.00"):
            raise serializers.ValidationError(
                "El monto debe ser mayor que cero."
            )

        return value

    def validate_categoria(self, value):
        if value not in GastoOperativo.Categoria.values:
            raise serializers.ValidationError(
                "Seleccione Administración o Venta."
            )

        return value
