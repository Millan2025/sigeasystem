import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenant') || '7e045520-5e36-4e3f-a39f-10ea7d6dce76'
    const productoId = url.searchParams.get('producto')
    const tipo = url.searchParams.get('tipo')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const stockOnly = url.searchParams.get('stock') === 'true'

    if (stockOnly) {
      const { data: movimientos, error } = await supabase
        .from('movimientos_inventario')
        .select('producto_id, tipo, cantidad')
        .eq('tenant_id', tenantId)

      if (error) throw error

      const stockMap = new Map()
      movimientos?.forEach(m => {
        const current = stockMap.get(m.producto_id) || 0
        const delta = m.tipo === 'entrada' ? m.cantidad : -m.cantidad
        stockMap.set(m.producto_id, current + delta)
      })

      const { data: allProducts, error: allErr } = await supabase
        .from('productos')
        .select('id, nombre, stock, unidad')
        .eq('tenant_id', tenantId)
        .order('nombre')

      if (allErr) throw allErr

      const result = allProducts.map(p => ({
        ...p,
        stock_actual: stockMap.get(p.id) ?? 0
      }))

      return NextResponse.json({ success: true, data: result, source: 'stock' })
    }

    let query = supabase
      .from('movimientos_inventario')
      .select('*, productos(nombre)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (productoId) query = query.eq('producto_id', productoId)
    if (tipo) query = query.eq('tipo', tipo)

    const { data, error } = await query
    if (error) throw error

    const countQuery = supabase
      .from('movimientos_inventario')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
    if (productoId) countQuery.eq('producto_id', productoId)
    if (tipo) countQuery.eq('tipo', tipo)
    const { count } = await countQuery

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      limit,
      offset
    })

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const body = await request.json()
    const { producto_id, tipo, cantidad, motivo, tenant_id } = body

    if (!producto_id || !tipo || !cantidad || !tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    if (!['entrada', 'salida', 'ajuste'].includes(tipo)) {
      return NextResponse.json(
        { success: false, error: 'tipo debe ser entrada, salida o ajuste' },
        { status: 400 }
      )
    }

    if (tipo === 'salida') {
      const { data: movs, error: movErr } = await supabase
        .from('movimientos_inventario')
        .select('tipo, cantidad')
        .eq('producto_id', producto_id)
        .eq('tenant_id', tenant_id)

      if (movErr) throw movErr

      let stock = 0
      movs?.forEach(m => {
        stock += m.tipo === 'entrada' ? m.cantidad : -m.cantidad
      })

      if (stock < cantidad) {
        return NextResponse.json(
          { success: false, error: `Stock insuficiente. Stock actual: ${stock}` },
          { status: 400 }
        )
      }
    }

    const { data, error } = await supabase
      .from('movimientos_inventario')
      .insert({
        producto_id,
        tipo,
        cantidad,
        motivo,
        tenant_id,
        created_at: new Date().toISOString()
      })
      .select()

    if (error) throw error

    // Recalcular stock actualizado y guardar en la tabla productos
    const { data: movsAll, error: movErr2 } = await supabase
      .from('movimientos_inventario')
      .select('tipo, cantidad')
      .eq('producto_id', producto_id)
      .eq('tenant_id', tenant_id)

    if (movErr2) throw movErr2

    let nuevoStock = 0
    movsAll?.forEach(m => {
      nuevoStock += m.tipo === 'entrada' ? m.cantidad : -m.cantidad
    })

    await supabase
      .from('productos')
      .update({ stock: nuevoStock })
      .eq('id', producto_id)
      .eq('tenant_id', tenant_id)

    return NextResponse.json({
      success: true,
      data: data?.[0] || null,
      nuevoStock
    })

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
