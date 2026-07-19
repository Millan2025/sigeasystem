import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usar SERVICE_ROLE_KEY para bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: listar ventas (con SERVICE_ROLE_KEY)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenant') || '7e045520-5e36-4e3f-a39f-10ea7d6dce76'
    const startDate = url.searchParams.get('start')
    const endDate = url.searchParams.get('end')
    const metodo_pago = url.searchParams.get('metodo_pago')

    let query = supabase
      .from('ventas')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('fecha', { ascending: false })

    if (startDate) query = query.gte('fecha', startDate)
    if (endDate) query = query.lte('fecha', endDate)
    if (metodo_pago) query = query.eq('metodo_pago', metodo_pago)

    const { data, error } = await query
    if (error) throw error

    // Calcular totales para el resumen
    const total = data?.reduce((sum, v) => sum + (v.total || 0), 0) || 0
    const transacciones = data?.length || 0

    return NextResponse.json({
      success: true,
      data: data || [],
      totales: { total, count: transacciones }
    })
  } catch (error: any) {
    console.error('❌ Error en /api/ventas GET:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: crear venta (ya existente, con SERVICE_ROLE_KEY)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tenant_id, metodo_pago, total, items } = body

    if (!tenant_id || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos: tenant_id e items son requeridos' },
        { status: 400 }
      )
    }

    // 1. Insertar cabecera de venta
    const { data: venta, error: ventaErr } = await supabase
      .from('ventas')
      .insert({
        tenant_id,
        metodo_pago,
        total,
        fecha: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (ventaErr) throw ventaErr

    // 2. Insertar items de venta (solo si existe la tabla sale_items)
    // Si no existe, podemos guardar los items en un campo JSON o en otra tabla.
    // Por ahora, intentamos insertar en sale_items.
    try {
      const saleItems = items.map((item: any) => ({
        sale_id: venta.id,
        product_id: item.producto_id,
        quantity: item.cantidad,
        price_at_sale: item.precio_unitario,
        subtotal: item.subtotal,
        tenant_id: tenant_id
      }))

      const { error: itemsErr } = await supabase
        .from('sale_items')
        .insert(saleItems)

      if (itemsErr) console.warn('⚠️ No se pudieron insertar items en sale_items:', itemsErr)
    } catch (e) {
      console.warn('⚠️ Error al insertar items:', e)
    }

    // 3. Descontar stock (crear movimientos de salida)
    for (const item of items) {
      await supabase
        .from('movimientos_inventario')
        .insert({
          producto_id: item.producto_id,
          tipo: 'salida',
          cantidad: item.cantidad,
          motivo: `Venta #${venta.id}`,
          tenant_id,
          created_at: new Date().toISOString()
        })

      const { data: movs, error: movsErr } = await supabase
        .from('movimientos_inventario')
        .select('tipo, cantidad')
        .eq('producto_id', item.producto_id)
        .eq('tenant_id', tenant_id)

      if (!movsErr && movs) {
        let nuevoStock = 0
        movs.forEach(m => {
          nuevoStock += m.tipo === 'entrada' ? m.cantidad : -m.cantidad
        })
        await supabase
          .from('productos')
          .update({ stock: nuevoStock })
          .eq('id', item.producto_id)
          .eq('tenant_id', tenant_id)
      }
    }

    return NextResponse.json({
      success: true,
      data: { venta },
      message: `Venta #${venta.id} registrada`
    })

  } catch (error: any) {
    console.error('❌ Error en /api/ventas POST:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
