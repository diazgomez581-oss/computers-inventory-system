
from rest_framework import serializers
from .models import Proveedor


class ProveedorSerializer(serializers.ModelSerializer):

    class Meta:
        model = Proveedor

        fields = [
            'id',
            'razon_social',
            'nrc',
            'nit',
            'telefono',
            'contacto',
            'activo',
            'fecha_registro',
        ]

        read_only_fields = [
            'id',
            'fecha_registro',
        ]

    def validate_razon_social(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "La razón social es obligatoria."
            )

        return value

    def validate_nrc(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "El NRC es obligatorio."
            )

        return value

    def validate_nit(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "El NIT es obligatorio."
            )

        return value

    def validate_telefono(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "El teléfono es obligatorio."
            )

        return value

    def validate_contacto(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "La persona de contacto es obligatoria."
            )

        return value
