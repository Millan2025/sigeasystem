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

    const nombreCliente = responsable || cliente
    if (!nombreCliente || !monto || !tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan: responsable, monto, tenant_id' },
        { status: 400 }
      )
    }

    const observaciones = `Tel: ${telefono || ''} - Dir: ${direccion || ''}`
    const hoy = new Date().toISOString().split('T')[0]
    // Establecer fecha_fin a 30 días por defecto
    const fechaFin = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: credito, error } = await supabase
      .from('creditos')
      .insert({
        tenant_id,
        cliente: nombreCliente,
        responsable: nombreCliente,
        valor_total: monto,
        valor_pagado: 0,
        fecha_inicio: hoy,
        fecha_fin: fechaFin,
        estado: 'pendiente',
        observaciones: observaciones.trim()
      })
      .select()
      .single()

    if (error) throw error

    // 🔥 REGISTRAR INGRESO EN FINANZAS (Cuentas por Cobrar)
    try {
      // Obtener o crear categoría "Cuentas por Cobrar" (código 1-01-01)
      let { data: categoria, error: catErr } = await supabase
        .from('categorias_contables')
        .select('id')
        .eq('codigo', '1-01-01')
        .eq('tenant_id', tenant_id)
        .maybeSingle()

      if (!categoria) {
        const { data: newCat, error: createErr } = await supabase
          .from('categorias_contables')
          .insert({
            codigo: '1-01-01',
            nombre: 'Cuentas por Cobrar',
            tipo: 'activo',
            tenant_id: tenant_id
          })
          .select()
          .single()
        if (!createErr && newCat) {
          categoria = newCat
          console.log('✅ Categoría Cuentas por Cobrar creada:', categoria.id)
        }
      }

      if (categoria?.id) {
        await supabase
          .from('transacciones')
          .insert({
            tipo: 'ingreso',
            monto: monto,
            categoria_contable_id: categoria.id,
            descripcion: `Crédito #${credito.id} - ${nombreCliente}`,
            fecha: hoy,
            impuesto: 0,
            retencion: 0,
            total_con_impuestos: monto,
            metodo_pago: 'Crédito',
            tenant_id: tenant_id,
            referencia_id: credito.id,
            referencia_tipo: 'credito',
            created_at: new Date().toISOString()
          })
        console.log('✅ Transacción registrada en finanzas para crédito #' + credito.id)
      }
    } catch (finErr) {
      console.error('Error al registrar transacción en finanzas:', finErr)
      // No bloqueamos la operación, solo log
    }

    return NextResponse.json({ success: true, data: credito })
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
      .select('valor_pagado, tenant_id, valor_total')
      .eq('id', id)
      .single()

    if (getErr) throw getErr

    const nuevoPagado = (credito.valor_pagado || 0) + monto_abono
    const nuevoSaldo = (credito.valor_total || 0) - nuevoPagado
    const estado = nuevoSaldo <= 0 ? 'pagado' : 'pendiente'

    // Actualizar crédito (sin tocar saldo_pendiente, que es GENERATED)
    const updateData: any = {
      valor_pagado: nuevoPagado,
      estado,
      updated_at: new Date().toISOString()
    }
    if (estado === 'pagado') {
      updateData.fecha_fin = new Date().toISOString().split('T')[0]
    }

    const { data, error } = await supabase
      .from('creditos')
      .update(updateData)
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





