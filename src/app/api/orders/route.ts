import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, items, direccionEntrega, metodoPago, customerName } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'No hay items' }, { status: 400 })
    }

    const total = items.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0)

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data, error } = await supabase.from('customer_orders').insert({
        customer_id: customerId || '00000000-0000-0000-0000-000000000000',
        status: 'pending_payment',
        subtotal: total,
        total: total,
        metodo_pago: metodoPago || 'Efectivo',
        direccion_entrega: direccionEntrega || 'Pendiente',
      }).select().single()
      if (!error && data) return NextResponse.json({ success: true, data, source: 'supabase' }, { status: 201 })
    } catch {}

    return NextResponse.json({ success: true, data: { id: 'ord-' + Date.now(), total }, source: 'local' }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, error: 'Error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data } = await supabase.from('customer_orders').select('*').order('created_at', { ascending: false })
    return NextResponse.json({ success: true, data: data || [], source: 'supabase' })
  } catch {
    return NextResponse.json({ success: true, data: [], source: 'error' })
  }
}
