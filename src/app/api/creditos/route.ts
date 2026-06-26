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
    const { data, error } = await supabase
      .from('creditos')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('fecha_inicio', { ascending: false })
    if (error) throw error
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { cliente, telefono, direccion, valor_total, tenant_id, responsable, observaciones } = body

    if (!cliente || !valor_total || !tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan: cliente, valor_total, tenant_id' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('creditos')
      .insert({
        cliente,
        responsable: responsable || 'POS',
        valor_total,
        valor_pagado: 0,
        saldo_pendiente: valor_total,
        fecha_inicio: new Date().toISOString().split('T')[0],
        estado: 'pendiente',
        observaciones: observaciones || `Tel: ${telefono || ''} Dir: ${direccion || ''}`,
        tenant_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
    const { id, monto_abono } = body

    if (!id || !monto_abono) {
      return NextResponse.json(
        { success: false, error: 'Faltan: id, monto_abono' },
        { status: 400 }
      )
    }

    const { data: credito, error: getErr } = await supabase
      .from('creditos')
      .select('saldo_pendiente, valor_pagado')
      .eq('id', id)
      .single()

    if (getErr) throw getErr

    const nuevoSaldo = credito.saldo_pendiente - monto_abono
    const nuevoPagado = credito.valor_pagado + monto_abono
    const estado = nuevoSaldo <= 0 ? 'pagado' : 'pendiente'
    const fechaFin = nuevoSaldo <= 0 ? new Date().toISOString().split('T')[0] : null

    const { data, error } = await supabase
      .from('creditos')
      .update({
        saldo_pendiente: nuevoSaldo,
        valor_pagado: nuevoPagado,
        estado,
        fecha_fin: fechaFin,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
