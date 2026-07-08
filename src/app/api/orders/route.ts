import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET: listar pedidos con detalles
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenant') || '7e045520-5e36-4e3f-a39f-10ea7d6dce76'
    const status = url.searchParams.get('status')
    const customerId = url.searchParams.get('customer_id')

    let query = supabase
      .from('customer_orders')
      .select(`
        *,
        order_items (
          *,
          productos (id, nombre, precio)
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (customerId) query = query.eq('customer_id', customerId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: crear pedido
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customer_id, items, direccion_entrega, metodo_pago, total, tenant_id } = body

    if (!tenant_id || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Faltan: tenant_id, items' },
        { status: 400 }
      )
    }

    // Insertar pedido
    const { data: pedido, error: pedidoErr } = await supabase
      .from('customer_orders')
      .insert({
        customer_id: customer_id || null,
        tenant_id,
        status: 'pendiente',
        subtotal: total,
        total: total,
        metodo_pago: metodo_pago || 'Efectivo',
        direccion_entrega: direccion_entrega || 'Pendiente',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (pedidoErr) throw pedidoErr

    // Insertar items del pedido
    const orderItems = items.map((item: any) => ({
      order_id: pedido.id,
      product_id: item.product_id,
      quantity: item.quantity || 1,
      price: item.price || 0
    }))

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsErr) throw itemsErr

    return NextResponse.json({
      success: true,
      data: pedido,
      message: `Pedido #${pedido.id} creado`
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT: actualizar estado del pedido
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, status, driver_id } = body

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Faltan: id, status' },
        { status: 400 }
      )
    }

    const updateData: any = { status }
    if (driver_id) updateData.driver_id = driver_id

    const { data, error } = await supabase
      .from('customer_orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
