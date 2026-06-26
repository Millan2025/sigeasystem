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
    const { responsable, telefono, direccion, monto, tenant_id } = body

    if (!responsable || !monto || !tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan: responsable, monto, tenant_id' },
        { status: 400 }
      )
    }

    // Construir observaciones con teléfono y dirección
    const observaciones = `Tel: ${telefono || ''} - Dir: ${direccion || ''}`

    const { data, error } = await supabase
      .from('creditos')
      .insert({
        tenant_id,
        responsable,
        valor_total: monto,
        valor_pagado: 0,
        saldo_pendiente: monto,
        fecha_inicio: new Date().toISOString().split('T')[0],
        estado: 'pendiente',
        observaciones: observaciones.trim()
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

    // Obtener crédito actual
    const { data: credito, error: getErr } = await supabase
      .from('creditos')
      .select('saldo_pendiente, valor_pagado')
      .eq('id', id)
      .single()

    if (getErr) throw getErr

    const nuevoSaldo = credito.saldo_pendiente - monto_abono
    const nuevoPagado = credito.valor_pagado + monto_abono
    const estado = nuevoSaldo <= 0 ? 'pagado' : 'pendiente'

    const { data, error } = await supabase
      .from('creditos')
      .update({
        saldo_pendiente: nuevoSaldo,
        valor_pagado: nuevoPagado,
        estado,
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
