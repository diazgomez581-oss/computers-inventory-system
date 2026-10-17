from rest_framework import serializers
from .models import Producto

class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = [
            'id', 'codigo', 'categoria', 'marca', 'modelo', 
            'descripcion', 'stock', 'costo_promedio', 'fecha_creacion'
        ]
        read_only_fields = ['codigo', 'stock', 'costo_promedio', 'fecha_creacion']

    def validate(self, data):
        descripcion = data.get('descripcion', '').strip()
        marca = data.get('marca', '').strip()
        modelo = data.get('modelo', '').strip()

        # Verificar si ya existe en la base de datos
        productos_iguales = Producto.objects.filter(
            descripcion__iexact=descripcion,
            marca__iexact=marca,
            modelo__iexact=modelo
        )
        if self.instance:
            productos_iguales = productos_iguales.exclude(pk=self.instance.pk)

        if productos_iguales.exists():
            raise serializers.ValidationError({
                "descripcion": "Este producto ya está registrado en el catálogo maestro."
            })

        return data