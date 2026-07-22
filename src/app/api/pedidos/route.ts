import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const url = new URL(request.url)
  const tenantId = url.searchParams.get('tenant') || '7e045520-5e36-4e3f-a39f-10ea7d6dce76'
  const estado = url.searchParams.get('estado')
  let query = supabase.from('pedidos').select('*').eq('id', tenantId).order('created_at', { ascending: false })
  if (estado) query = query.eq('estado', estado)
  const { data, error } = await query
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tenant_id, cliente, direccion, telefono, metodo_pago, total, items } = body

    if (!tenant_id || !cliente || !items || !total) {
      return NextResponse.json({ success: false, error: 'Faltan datos obligatorios' }, { status: 400 })
    }

    let estado = 'pendiente'
    if (metodo_pago !== 'Crédito') {
      estado = 'pagado'
    }

    const { data: pedido, error: pedidoErr } = await supabase
      .from('pedidos')
      .insert({
        tenant_id,
        cliente,
        direccion,
        telefono,
        metodo_pago,
        total,
        items,
        estado
      })
      .select()
      .single()

    if (pedidoErr) throw pedidoErr

    if (metodo_pago === 'Crédito') {
      await supabase
        .from('creditos')
        .insert({
          tenant_id,
          cliente,
          responsable: cliente,
          valor_total: total,
          valor_pagado: 0,
          fecha_inicio: new Date().toISOString().split('T')[0],
          fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estado: 'pendiente',
          observaciones: Pedido # - Tel:  Dir: 
        })
    } else {
      try {
        const ventaRes = await fetch(${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ventas, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id,
            metodo_pago,
            total,
            items: items.map((item: any) => ({
              producto_id: item.producto_id,
              cantidad: item.cantidad,
              precio_unitario: item.precio,
              subtotal: item.precio * item.cantidad
            }))
          })
        })
        const ventaData = await ventaRes.json()
        if (ventaData.success) {
          await supabase
            .from('pedidos')
            .update({ venta_id: ventaData.data.venta.id, estado: 'pagado' })
            .eq('id', pedido.id)
        }
      } catch (err) {
        console.error('Error al crear venta:', err)
      }
    }

    return NextResponse.json({ success: true, data: pedido })
  } catch (error: any) {
    console.error('Error POST /api/pedidos:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

