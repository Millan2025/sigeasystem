import { NextResponse } from 'next/server'

const orders: any[] = []

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, items, direccionEntrega, metodoPago } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'No hay items' }, { status: 400 })
    }

    const order = {
      id: 'ord-' + Date.now(),
      customerId,
      items,
      direccionEntrega,
      metodoPago,
      status: 'pending_payment',
      total: items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0),
      createdAt: new Date().toISOString(),
    }

    orders.push(order)

    return NextResponse.json({ success: true, data: order }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, error: 'Error al crear pedido' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ success: true, data: orders })
}