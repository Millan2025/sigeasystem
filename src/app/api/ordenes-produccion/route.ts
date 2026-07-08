import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenant') || '7e045520-5e36-4e3f-a39f-10ea7d6dce76'
    const estado = url.searchParams.get('estado')
    const pedidoId = url.searchParams.get('pedido_id')

    let query = supabase
      .from('ordenes_produccion')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('creado_en', { ascending: false })

    if (estado && estado !== 'todos') query = query.eq('estado', estado)
    if (pedidoId) query = query.eq('pedido_id', pedidoId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { pedido_id, tenant_id, tipo, productos, nota, creado_por } = body

    if (!tenant_id || !productos || productos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Faltan: tenant_id, productos' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('ordenes_produccion')
      .insert({
        pedido_id: pedido_id || null,
        tenant_id,
        tipo: tipo || 'pedido_pos',
        productos,
        nota: nota || '',
        creado_por: creado_por || 'Sistema',
        estado: 'pendiente',
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, estado, producido_por } = body

    if (!id || !estado) {
      return NextResponse.json(
        { success: false, error: 'Faltan: id, estado' },
        { status: 400 }
      )
    }

    // 1. Actualizar la orden de producción
    const { data: orden, error: updateErr } = await supabase
      .from('ordenes_produccion')
      .update({
        estado,
        producido_por: producido_por || null,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateErr) throw updateErr

    // 2. 🔥 Si la orden tiene pedido_id, actualizar el estado del pedido
    if (orden.pedido_id) {
      let nuevoEstadoPedido = null
      // Mapeo de estados de producción a estados de pedido
      if (estado === 'finalizado') {
        nuevoEstadoPedido = 'preparando' // o 'listo', según convenga
      } else if (estado === 'entregado') {
        nuevoEstadoPedido = 'entregado'
      }

      if (nuevoEstadoPedido) {
        await supabase
          .from('customer_orders')
          .update({ status: nuevoEstadoPedido })
          .eq('id', orden.pedido_id)
      }
    }

    return NextResponse.json({ success: true, data: orden })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
