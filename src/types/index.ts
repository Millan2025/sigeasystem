export type TipoNegocio = 'panaderia' | 'cafeteria' | 'restaurante' | 'carniceria' | 'tienda' | 'distribuidora'
export type MetodoPago = 'Efectivo' | 'Nequi' | 'Daviplata' | 'Tarjeta' | 'Transferencia'
export type EstadoPedido = 'pending_payment' | 'payment_review' | 'payment_confirmed' | 'preparing' | 'ready' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled'
export type TipoAlerta = 'stock_bajo' | 'temperatura' | 'caja_descuadre' | 'fatiga' | 'iot'
export type Severidad = 'baja' | 'media' | 'alta' | 'critica'

export interface CartItem {
  productId: string; name: string; price: number; quantity: number; isRecipe: boolean
}
export interface OrderNotification {
  orderId: string; customerName: string; total: number; items: number; status: EstadoPedido
}