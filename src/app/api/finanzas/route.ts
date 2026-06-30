import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ============================================
// GET: Obtener transacciones, balances, etc.
// ============================================
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenant') || '7e045520-5e36-4e3f-a39f-10ea7d6dce76'
    const startDate = url.searchParams.get('start')
    const endDate = url.searchParams.get('end')
    const tipo = url.searchParams.get('tipo')
    const categoriaId = url.searchParams.get('categoria')
    const periodoId = url.searchParams.get('periodo')

    let query = supabase
      .from('transacciones')
      .select('*, categorias_contables(nombre)')
      .eq('tenant_id', tenantId)
      .order('fecha', { ascending: false })

    if (startDate) query = query.gte('fecha', startDate)
    if (endDate) query = query.lte('fecha', endDate)
    if (tipo) query = query.eq('tipo', tipo)
    if (categoriaId) query = query.eq('categoria_contable_id', categoriaId)

    // Si se pasa periodoId, usar el rango del período
    if (periodoId) {
      const { data: periodo, error: periodoError } = await supabase
        .from('periodos_fiscales')
        .select('fecha_inicio, fecha_fin')
        .eq('id', periodoId)
        .single()

      if (periodoError) throw periodoError

      query = query
        .gte('fecha', periodo.fecha_inicio)
        .lte('fecha', periodo.fecha_fin)
    }

    const { data, error } = await query
    if (error) throw error

    // Calcular resumen
    const ingresos = data?.filter(t => t.tipo === 'ingreso').reduce((sum, t) => sum + t.total_con_impuestos, 0) || 0
    const egresos = data?.filter(t => t.tipo === 'egreso').reduce((sum, t) => sum + t.total_con_impuestos, 0) || 0
    const impuestos = data?.reduce((sum, t) => sum + (t.impuesto || 0), 0) || 0
    const retenciones = data?.reduce((sum, t) => sum + (t.retencion || 0), 0) || 0
    const saldo = ingresos - egresos

    return NextResponse.json({
      success: true,
      data: data || [],
      resumen: { ingresos, egresos, saldo, impuestos, retenciones }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// ============================================
// POST: Registrar transacción (manual o automática)
// ============================================
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      tipo, monto, categoria_contable_id, descripcion, fecha, 
      tenant_id, impuesto, retencion, referencia_id, referencia_tipo,
      proveedor_id, cliente_id 
    } = body

    if (!tipo || !monto || !tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan: tipo, monto, tenant_id' },
        { status: 400 }
      )
    }

    // Calcular total con impuestos
    const total_con_impuestos = monto + (impuesto || 0) - (retencion || 0)

    const { data, error } = await supabase
      .from('transacciones')
      .insert({
        tipo,
        monto,
        categoria_contable_id,
        descripcion: descripcion || '',
        fecha: fecha || new Date().toISOString().split('T')[0],
        impuesto: impuesto || 0,
        retencion: retencion || 0,
        total_con_impuestos,
        referencia_id,
        referencia_tipo,
        tenant_id,
        created_at: new Date().toISOString()
      })
      .select('*, categorias_contables(nombre)')
      .single()

    if (error) throw error

    // Si es una venta, también actualizar el estado del pedido o venta (opcional)
    // Si es una compra, actualizar inventario (ya lo hace compras)

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// ============================================
// PUT: Actualizar transacción (editar)
// ============================================
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, tipo, monto, categoria_contable_id, descripcion, fecha, impuesto, retencion } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Se requiere ID' },
        { status: 400 }
      )
    }

    const total_con_impuestos = monto + (impuesto || 0) - (retencion || 0)

    const { data, error } = await supabase
      .from('transacciones')
      .update({
        tipo,
        monto,
        categoria_contable_id,
        descripcion,
        fecha,
        impuesto,
        retencion,
        total_con_impuestos,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, categorias_contables(nombre)')
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// ============================================
// DELETE: Eliminar transacción
// ============================================
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Se requiere ID' },
        { status: 400 }
      )
    }

    // Verificar si la transacción está referenciada (ej. venta)
    const { data: ref, error: refErr } = await supabase
      .from('transacciones')
      .select('referencia_id')
      .eq('id', id)
      .single()

    if (refErr) throw refErr

    if (ref.referencia_id) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar una transacción vinculada a una venta o compra' },
        { status: 409 }
      )
    }

    const { error } = await supabase
      .from('transacciones')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true, message: 'Transacción eliminada' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
