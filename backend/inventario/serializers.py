
from rest_framework import serializers
from .models import Producto


class ProductoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Producto

        fields = [
            'id',
            'codigo',
            'categoria',
            'marca',
            'modelo',
            'descripcion',
            'stock',
            'costo_promedio',
            'fecha_creacion'
        ]

        read_only_fields = [
            'id',
            'codigo',
            'stock',
            'costo_promedio',
            'fecha_creacion'
        ]

    def validate(self, data):
        instancia = self.instance

        descripcion = data.get(
            'descripcion',
            instancia.descripcion if instancia else ''
        ).strip()

        marca = data.get(
            'marca',
            instancia.marca if instancia else ''
        ).strip()

        modelo = data.get(
            'modelo',
            instancia.modelo if instancia else ''
        ).strip()

        if not descripcion:
            raise serializers.ValidationError({
                'descripcion': 'La descripción es obligatoria.'
            })

        productos_iguales = Producto.objects.filter(
            descripcion__iexact=descripcion,
            marca__iexact=marca,
            modelo__iexact=modelo
        )

        if instancia:
            productos_iguales = productos_iguales.exclude(
                pk=instancia.pk
            )

        if productos_iguales.exists():
            raise serializers.ValidationError({
                'descripcion': (
                    'Este producto ya está registrado '
                    'en el catálogo maestro.'
                )
            })

        data['descripcion'] = descripcion
        data['marca'] = marca
        data['modelo'] = modelo

        return data
