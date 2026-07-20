import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usar SERVICE_ROLE_KEY para bypass RLS
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET: listar compras
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenant') || '7e045520-5e36-4e3f-a39f-10ea7d6dce76'
    const startDate = url.searchParams.get('start')
    const endDate = url.searchParams.get('end')

    let query = supabase
      .from('compras')
      .select(`
        *,
        compra_items (
          *,
          productos (id, nombre, precio_compra)
        )
      `)
      .eq('tenant_id', tenantId)
      .order('fecha', { ascending: false })

    if (startDate) query = query.gte('fecha', startDate)
    if (endDate) query = query.lte('fecha', endDate)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error('❌ Error GET /api/compras:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: crear compra
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tenant_id, proveedor, fecha, metodo_pago, observaciones, items } = body

    if (!tenant_id || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos: tenant_id e items' },
        { status: 400 }
      )
    }

    const total = items.reduce((sum: number, item: any) => sum + (item.cantidad * item.precio_compra), 0)

    // 1. Insertar cabecera de compra
    const { data: compra, error: compraErr } = await supabase
      .from('compras')
      .insert({
        tenant_id,
        proveedor: proveedor || '',
        fecha: fecha || new Date().toISOString().split('T')[0],
        total,
        metodo_pago: metodo_pago || 'contado',
        observaciones: observaciones || '',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (compraErr) throw compraErr

    // 2. Insertar items de compra
    const compraItems = items.map((item: any) => ({
      compra_id: compra.id,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_compra: item.precio_compra,
      subtotal: item.cantidad * item.precio_compra,
      tenant_id: tenant_id
    }))

    const { error: itemsErr } = await supabase
      .from('compra_items')
      .insert(compraItems)

    if (itemsErr) throw itemsErr

    // 3. Actualizar stock (movimientos de entrada)
    for (const item of items) {
      await supabase
        .from('movimientos_inventario')
        .insert({
          producto_id: item.producto_id,
          tipo: 'entrada',
          cantidad: item.cantidad,
          motivo: `Compra #${compra.id}`,
          tenant_id,
          created_at: new Date().toISOString()
        })

      // Recalcular stock
      const { data: movs, error: movsErr } = await supabase
        .from('movimientos_inventario')
        .select('tipo, cantidad')
        .eq('producto_id', item.producto_id)
        .eq('tenant_id', tenant_id)

      if (movsErr) throw movsErr

      let nuevoStock = 0
      movs?.forEach(m => {
        nuevoStock += m.tipo === 'entrada' ? m.cantidad : -m.cantidad
      })

      await supabase
        .from('productos')
        .update({ stock: nuevoStock })
        .eq('id', item.producto_id)
        .eq('tenant_id', tenant_id)
    }

    // 4. Registrar egreso en finanzas
    const categoriaId = metodo_pago === 'credito'
      ? (await supabase.from('categorias_contables').select('id').eq('codigo', '2-01-01').eq('tenant_id', tenant_id).single()).data?.id
      : (await supabase.from('categorias_contables').select('id').eq('codigo', '5-01-01').eq('tenant_id', tenant_id).single()).data?.id

    if (categoriaId) {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/finanzas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'egreso',
          monto: total,
          categoria_contable_id: categoriaId,
          descripcion: `Compra #${compra.id} - ${metodo_pago}`,
          fecha: fecha || new Date().toISOString().split('T')[0],
          impuesto: 0,
          retencion: 0,
          metodo_pago: metodo_pago,
          tenant_id
        })
      })
    }

    return NextResponse.json({
      success: true,
      data: { compra, items: compraItems },
      message: `Compra #${compra.id} registrada`
    })

  } catch (error: any) {
    console.error('❌ Error POST /api/compras:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}









