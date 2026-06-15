import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sessionId, items, paymentMethod, customerName } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'No hay productos' }, { status: 400 })
    }

    let totalAmount = 0
    const saleItems = items.map((item: any) => {
      const subtotal = item.price * item.quantity
      totalAmount += subtotal
      return {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        priceAtSale: item.price,
        subtotal
      }
    })

    // Intentar guardar en Supabase
    if (process.env.DATABASE_URL) {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data: sale, error } = await supabase.from('sales').insert({
          session_id: sessionId || 'directa',
          customer_name: customerName || 'Cliente General',
          total_amount: totalAmount,
          payment_method: paymentMethod
        }).select().single()

        if (!error && sale) {
          // Insertar items de venta
          for (const item of saleItems) {
            await supabase.from('sale_items').insert({
              sale_id: sale.id,
              product_id: item.productId,
              quantity: item.quantity,
              price_at_sale: item.priceAtSale,
              subtotal: item.subtotal
            })
          }
          return NextResponse.json({ success: true, data: sale, source: 'supabase' }, { status: 201 })
        }
      } catch {}
    }

    // Respuesta de respaldo
    const ventaRespaldo = {
      id: 'venta-' + Date.now(),
      customer_name: customerName || 'Cliente General',
      total_amount: totalAmount,
      payment_method: paymentMethod,
      items: saleItems,
      created_at: new Date().toISOString()
    }

    return NextResponse.json({ success: true, data: ventaRespaldo, source: 'local' }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al procesar venta' }, { status: 500 })
  }
}
