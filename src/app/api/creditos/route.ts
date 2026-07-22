import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
    const { responsable, cliente, telefono, direccion, monto, tenant_id } = body

    // Asegurar que tengamos un nombre de cliente (usar "Cliente" por defecto si viene vacío)
    const nombreCliente = responsable || cliente || "Cliente sin nombre"
    if (!monto || !tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan: monto, tenant_id' },
        { status: 400 }
      )
    }

    const observaciones = `Tel: ${telefono || ''} - Dir: ${direccion || ''}`

    // Calcular fecha_fin (30 días después de fecha_inicio)
    const fechaInicio = new Date().toISOString().split('T')[0]
    const fechaFinDate = new Date()
    fechaFinDate.setDate(fechaFinDate.getDate() + 30)
    const fechaFin = fechaFinDate.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('creditos')
      .insert({
        tenant_id,
        cliente: nombreCliente,
        responsable: nombreCliente,
        valor_total: monto,
        valor_pagado: 0,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
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

    // Obtener crédito actual (incluyendo tenant_id para finanzas)
    const { data: credito, error: getErr } = await supabase
      .from('creditos')
      .select('saldo_pendiente, valor_pagado, tenant_id')
      .eq('id', id)
      .single()

    if (getErr) throw getErr

    const nuevoSaldo = credito.saldo_pendiente - monto_abono
    const nuevoPagado = credito.valor_pagado + monto_abono
    const estado = nuevoSaldo <= 0 ? 'pagado' : 'pendiente'

    // Actualizar crédito (sin saldo_pendiente porque es GENERATED ALWAYS)
    const { data, error } = await supabase
      .from('creditos')
      .update({
        valor_pagado: nuevoPagado,
        estado,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // 🔥 REGISTRAR INGRESO EN FINANZAS POR EL ABONO
    try {
      const { data: categoria, error: catErr } = await supabase
        .from('categorias_contables')
        .select('id')
        .eq('codigo', '1-01-01')
        .eq('tenant_id', credito.tenant_id)
        .single()

      if (!catErr && categoria) {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/finanzas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'ingreso',
            monto: monto_abono,
            categoria_contable_id: categoria.id,
            descripcion: `Abono a crédito #${id}`,
            fecha: new Date().toISOString().split('T')[0],
            impuesto: 0,
            retencion: 0,
            metodo_pago: 'Abono',
            tenant_id: credito.tenant_id,
            referencia_id: id,
            referencia_tipo: 'credito'
          })
        })
      }
    } catch (finErr) {
      console.error('Error al registrar abono en finanzas:', finErr)
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

