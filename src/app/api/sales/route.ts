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
      const subtotal = (item.price || item.precio || 0) * (item.quantity || item.cantidad || 1)
      totalAmount += subtotal
      return {
        productId: item.productId || item.id,
        productName: item.productName || item.nombre || item.name,
        quantity: item.quantity || item.cantidad || 1,
        priceAtSale: item.price || item.precio || 0,
        subtotal
      }
    })

    // Guardar en Supabase
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
        payment_method: paymentMethod || 'Efectivo'
      }).select().single()

      if (!error && sale) {
        for (const item of saleItems) {
          await supabase.from('sale_items').insert({
            sale_id: sale.id,
            product_id: item.productId,
            quantity: item.quantity,
            price_at_sale: item.priceAtSale,
            subtotal: item.subtotal
          })
          
          // Descontar inventario
          const { data: product } = await supabase.from('products').select('*').eq('id', item.productId).single()
          if (product) {
            if (product.is_recipe) {
              // Descontar ingredientes
              const { data: recipes } = await supabase.from('recipes').select('*').eq('product_id', item.productId)
              if (recipes) {
                for (const recipe of recipes) {
                  const required = Number(recipe.quantity_required) * item.quantity
                  await supabase.rpc('decrement_ingredient', { 
                    ingredient_id: recipe.ingredient_id, 
                    cantidad: required 
                  })
                }
              }
            } else {
              const newStock = Math.max(0, Number(product.stock) - item.quantity)
              await supabase.from('products').update({ stock: newStock }).eq('id', item.productId)
            }
          }
        }
        // Si la venta viene de Tienda, crear pedido automático
            if (customerName && customerName !== 'Cliente POS') {
              await supabase.from('customer_orders').insert({
                customer_id: customerId || '00000000-0000-0000-0000-000000000000',
                status: 'pending',
                subtotal: totalAmount,
                total: totalAmount,
                metodo_pago: paymentMethod,
                direccion_entrega: 'Pendiente',
              })
            }
            return NextResponse.json({ success: true, data: sale, source: 'supabase' }, { status: 201 })
      }
    } catch (e) {
      console.error('Supabase error:', e)
    }

    return NextResponse.json({ success: true, data: { id: 'local-' + Date.now(), total_amount: totalAmount, payment_method: paymentMethod }, source: 'local' }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al procesar venta' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const hoy = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase.from('sales')
      .select('*')
      .gte('created_at', hoy)
      .order('created_at', { ascending: false })

    if (!error && data) {
      // Calcular totales por método de pago
      const totales = data.reduce((acc: any, s: any) => {
        const metodo = s.payment_method || 'Efectivo'
        acc[metodo] = (acc[metodo] || 0) + Number(s.total_amount)
        acc.total = (acc.total || 0) + Number(s.total_amount)
        return acc
      }, { total: 0, count: data.length })

      return NextResponse.json({ success: true, data, totales, source: 'supabase' })
    }

    return NextResponse.json({ success: true, data: [], totales: { total: 0, count: 0 } })
  } catch {
    return NextResponse.json({ success: true, data: [], totales: { total: 0, count: 0 } })
  }
}

