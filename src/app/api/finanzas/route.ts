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
    const startDate = url.searchParams.get('start')
    const endDate = url.searchParams.get('end')
    const tipo = url.searchParams.get('tipo')
    const categoriaId = url.searchParams.get('categoria')
    const periodoId = url.searchParams.get('periodo')

    // 1. Obtener TODAS las transacciones (SIN paginación) para el resumen
    let queryAll = supabase
      .from('transacciones')
      .select('tipo, monto, total_con_impuestos, metodo_pago, referencia_tipo, referencia_id, impuesto, retencion')
      .eq('tenant_id', tenantId)

    if (startDate) queryAll = queryAll.gte('fecha', startDate)
    if (endDate) queryAll = queryAll.lte('fecha', endDate)
    if (tipo) queryAll = queryAll.eq('tipo', tipo)
    if (categoriaId) queryAll = queryAll.eq('categoria_contable_id', categoriaId)

    if (periodoId) {
      const { data: periodo } = await supabase
        .from('periodos_fiscales')
        .select('fecha_inicio, fecha_fin')
        .eq('id', periodoId)
        .single()
      if (periodo) {
        queryAll = queryAll.gte('fecha', periodo.fecha_inicio).lte('fecha', periodo.fecha_fin)
      }
    }

    const { data: allTransacciones, error: allError } = await queryAll
    if (allError) throw allError

    // 2. Obtener transacciones paginadas para la tabla (solo 50 registros)
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50')
    const start = (page - 1) * pageSize

    let queryPaginated = supabase
      .from('transacciones')
      .select('*, categorias_contables(*)')
      .eq('tenant_id', tenantId)
      .order('fecha', { ascending: false })
      .range(start, start + pageSize - 1)

    if (startDate) queryPaginated = queryPaginated.gte('fecha', startDate)
    if (endDate) queryPaginated = queryPaginated.lte('fecha', endDate)
    if (tipo) queryPaginated = queryPaginated.eq('tipo', tipo)
    if (categoriaId) queryPaginated = queryPaginated.eq('categoria_contable_id', categoriaId)

    if (periodoId) {
      const { data: periodo } = await supabase
        .from('periodos_fiscales')
        .select('fecha_inicio, fecha_fin')
        .eq('id', periodoId)
        .single()
      if (periodo) {
        queryPaginated = queryPaginated.gte('fecha', periodo.fecha_inicio).lte('fecha', periodo.fecha_fin)
      }
    }

    const { data: dataPaginated, error: paginatedError } = await queryPaginated
    if (paginatedError) throw paginatedError

    // 3. Obtener total de ventas y compras (para el resumen integral)
    const { data: ventasData, error: ventasError } = await supabase
      .from('ventas')
      .select('total, metodo_pago')
      .eq('tenant_id', tenantId)
    if (ventasError) throw ventasError
    const totalVentas = ventasData?.reduce((sum, v) => sum + (v.total || 0), 0) || 0

    const { data: comprasData, error: comprasError } = await supabase
      .from('compras')
      .select('total')
      .eq('tenant_id', tenantId)
    if (comprasError) throw comprasError
    const totalCompras = comprasData?.reduce((sum, c) => sum + (c.total || 0), 0) || 0

    // 4. Calcular ingresos/egresos a partir de TODAS las transacciones (sin paginación)
    const totalIngresosTransacciones = allTransacciones
      .filter(t => t.tipo === 'ingreso')
      .reduce((sum, t) => sum + (t.total_con_impuestos || t.monto || 0), 0)

    const totalEgresosTransacciones = allTransacciones
      .filter(t => t.tipo === 'egreso')
      .reduce((sum, t) => sum + (t.total_con_impuestos || t.monto || 0), 0)

    // 5. Totales integrales
    const ingresos = totalVentas + totalIngresosTransacciones
    const egresos = totalCompras + totalEgresosTransacciones
    const saldo = ingresos - egresos
    const impuestos = allTransacciones.reduce((sum, t) => sum + (t.impuesto || 0), 0)
    const retenciones = allTransacciones.reduce((sum, t) => sum + (t.retencion || 0), 0)

    // 6. Desglose de pagos (ventas + TODAS las transacciones de ingreso)
    const desglosePagos: Record<string, number> = {}
    ventasData?.forEach(v => {
      let metodo = v.metodo_pago || 'Otro'
      if (metodo === 'Otro' || metodo === 'Confirmado') metodo = 'Otros'
      desglosePagos[metodo] = (desglosePagos[metodo] || 0) + (v.total || 0)
    })
    allTransacciones
      .filter(t => t.tipo === 'ingreso')
      .forEach(t => {
        let metodo = t.metodo_pago || 'Otro'
        if (metodo === 'Otro' || metodo === 'Confirmado') metodo = 'Otros'
        desglosePagos[metodo] = (desglosePagos[metodo] || 0) + (t.total_con_impuestos || t.monto || 0)
      })

    // 7. Costo de ventas y gastos operativos (mantener lógica existente)
    const costo_ventas = allTransacciones
      .filter(t => t.tipo === 'egreso' && t.referencia_tipo === 'compra')
      .reduce((sum, t) => sum + (t.total_con_impuestos || t.monto || 0), 0)

    let gastos_operativos = 0
    try {
      const { data: gastosData } = await supabase.from('gastos_operativos').select('monto').eq('tenant_id', tenantId)
      if (gastosData) gastos_operativos = gastosData.reduce((sum, g) => sum + (g.monto || 0), 0)
    } catch (e) {}

    const utilidad_bruta = ingresos - costo_ventas
    const utilidad_neta = utilidad_bruta - gastos_operativos

    // 8. Expandir datos para la tabla (usando los datos paginados)
    // (Se mantiene la lógica de expansión para ventas/compras, pero no es crítica para el resumen)
    // Por simplicidad, devolvemos los datos paginados sin expandir (ya que el frontend muestra los detalles)
    // pero podemos mantener la expansión si es necesaria. En este caso, el frontend solo muestra la tabla
    // con los campos de transacciones, así que devolvemos dataPaginated directamente.
    const expandedData = dataPaginated || []

    const resumen = {
      ingresos,
      egresos,
      saldo,
      impuestos,
      retenciones,
      desglosePagos,
      costo_ventas,
      gastos_operativos,
      utilidad_bruta,
      utilidad_neta
    }

    return NextResponse.json({
      success: true,
      data: expandedData,
      resumen
    })

  } catch (error: any) {
    console.error('❌ Error GET /api/finanzas:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: crear transacción (sin cambios)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tipo, monto, categoria_contable_id, descripcion, fecha, tenant_id, impuesto, retencion, metodo_pago } = body

    if (!tipo || !monto || !tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan: tipo, monto, tenant_id' },
        { status: 400 }
      )
    }

    const total_con_impuestos = monto + (impuesto || 0) - (retencion || 0)

    const { data, error } = await supabase
      .from('transacciones')
      .insert({
        tipo,
        monto,
        categoria_contable_id: categoria_contable_id || null,
        descripcion: descripcion || '',
        fecha: fecha || new Date().toISOString().split('T')[0],
        impuesto: impuesto || 0,
        retencion: retencion || 0,
        total_con_impuestos,
        metodo_pago: metodo_pago || null,
        tenant_id,
        created_at: new Date().toISOString()
      })
      .select('*, categorias_contables(*)')
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('❌ Error POST /api/finanzas:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT: actualizar transacción
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, tipo, monto, categoria_contable_id, descripcion, fecha, impuesto, retencion, metodo_pago } = body

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
        categoria_contable_id: categoria_contable_id || null,
        descripcion: descripcion || '',
        fecha: fecha || new Date().toISOString().split('T')[0],
        impuesto: impuesto || 0,
        retencion: retencion || 0,
        total_con_impuestos,
        metodo_pago: metodo_pago || null
      })
      .eq('id', id)
      .select('*, categorias_contables(*)')
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('❌ Error PUT /api/finanzas:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE: eliminar transacción
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

    const { error } = await supabase
      .from('transacciones')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true, message: 'Transacción eliminada' })
  } catch (error: any) {
    console.error('❌ Error DELETE /api/finanzas:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
