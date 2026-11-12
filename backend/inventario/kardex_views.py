
from decimal import Decimal

from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework import status

from .models import Producto, MovimientoKardex


class KardexProductoView(APIView):
    """
    Tarjeta Kárdex perpetua por producto.

    GET /api/productos/kardex/?producto_id=1

    Devuelve:
    - Información del producto.
    - Resumen de existencias y valoración actual.
    - Movimientos históricos de entrada y salida.
    - Totales acumulados de entradas y salidas.

    Los costos y saldos históricos se consultan directamente
    de MovimientoKardex, sin reconstruirlos artificialmente.
    """

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    @staticmethod
    def decimal_texto(valor, decimales=2):
        if valor is None:
            valor = Decimal("0")

        return f"{Decimal(str(valor)):.{decimales}f}"

    def get(self, request):
        producto_id = request.query_params.get("producto_id")

        if not producto_id:
            return Response(
                {
                    "error": (
                        "Debe seleccionar un producto "
                        "para consultar su Kárdex."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            producto_id = int(producto_id)

            if producto_id <= 0:
                raise ValueError()

        except (ValueError, TypeError):
            return Response(
                {"error": "El identificador del producto no es válido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            producto = Producto.objects.get(pk=producto_id)

        except Producto.DoesNotExist:
            return Response(
                {"error": "El producto seleccionado no existe."},
                status=status.HTTP_404_NOT_FOUND,
            )

        movimientos_db = (
            MovimientoKardex.objects
            .filter(producto=producto)
            .order_by("fecha", "id")
        )

        movimientos = []

        for movimiento in movimientos_db:
            movimientos.append(
                {
                    "id": movimiento.id,
                    "fecha": movimiento.fecha.isoformat(),
                    "tipo": movimiento.tipo,
                    "detalle": movimiento.detalle,

                    "entrada": {
                        "cantidad": movimiento.cantidad_entrada,
                        "costo_unitario": self.decimal_texto(
                            movimiento.costo_unitario_entrada, 4
                        ),
                        "total": self.decimal_texto(
                            movimiento.total_entrada
                        ),
                    },

                    "salida": {
                        "cantidad": movimiento.cantidad_salida,
                        "costo_unitario": self.decimal_texto(
                            movimiento.costo_unitario_salida, 4
                        ),
                        "total": self.decimal_texto(
                            movimiento.total_salida
                        ),
                    },

                    "saldo": {
                        "cantidad": movimiento.saldo_cantidad,
                        "costo_promedio": self.decimal_texto(
                            movimiento.saldo_costo_unitario, 4
                        ),
                        "total": self.decimal_texto(
                            movimiento.saldo_total
                        ),
                    },
                }
            )

        totales = movimientos_db.aggregate(
            unidades_entrada=Sum("cantidad_entrada"),
            valor_entrada=Sum("total_entrada"),
            unidades_salida=Sum("cantidad_salida"),
            valor_salida=Sum("total_salida"),
        )

        valor_actual = (
            Decimal(producto.stock)
            * producto.costo_promedio
        )

        ultimo_movimiento = movimientos[-1] if movimientos else None

        saldo_coincide = None

        if ultimo_movimiento:
            saldo_coincide = (
                ultimo_movimiento["saldo"]["cantidad"]
                == producto.stock
            )

        respuesta = {
            "producto": {
                "id": producto.id,
                "codigo": producto.codigo,
                "descripcion": producto.descripcion,
                "marca": producto.marca,
                "modelo": producto.modelo,
                "categoria": producto.categoria,
                "stock_actual": producto.stock,
                "costo_promedio_actual": self.decimal_texto(
                    producto.costo_promedio, 4
                ),
                "valor_inventario_actual": self.decimal_texto(
                    valor_actual
                ),
            },

            "resumen": {
                "cantidad_movimientos": len(movimientos),

                "total_unidades_entrada": (
                    totales["unidades_entrada"] or 0
                ),
                "total_valor_entrada": self.decimal_texto(
                    totales["valor_entrada"]
                ),

                "total_unidades_salida": (
                    totales["unidades_salida"] or 0
                ),
                "total_valor_salida": self.decimal_texto(
                    totales["valor_salida"]
                ),

                "saldo_coincide_con_inventario": saldo_coincide,
            },

            "movimientos": movimientos,
        }

        return Response(respuesta, status=status.HTTP_200_OK)
