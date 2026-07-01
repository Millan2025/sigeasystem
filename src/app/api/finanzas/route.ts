import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET: devuelve transacciones con metodo_pago
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
      .select(`*, categorias_contables(*)`)
      .eq('tenant_id', tenantId)
      .order('fecha', { ascending: false })

    if (startDate) query = query.gte('fecha', startDate)
    if (endDate) query = query.lte('fecha', endDate)
    if (tipo) query = query.eq('tipo', tipo)
    if (categoriaId) query = query.eq('categoria_contable_id', categoriaId)

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

    const ingresos = data?.filter(t => t.tipo === 'ingreso').reduce((sum, t) => sum + t.total_con_impuestos, 0) || 0
    const egresos = data?.filter(t => t.tipo === 'egreso').reduce((sum, t) => sum + t.total_con_impuestos, 0) || 0
    const impuestos = data?.reduce((sum, t) => sum + (t.impuesto || 0), 0) || 0
    const retenciones = data?.reduce((sum, t) => sum + (t.retencion || 0), 0) || 0
    const saldo = ingresos - egresos

    // Desglose por método de pago (solo ingresos)
    const desglosePagos: Record<string, number> = {}
    data?.filter(t => t.tipo === 'ingreso').forEach(t => {
      const metodo = t.metodo_pago || 'Otro'
      desglosePagos[metodo] = (desglosePagos[metodo] || 0) + t.total_con_impuestos
    })

    return NextResponse.json({
      success: true,
      data: data || [],
      resumen: { ingresos, egresos, saldo, impuestos, retenciones, desglosePagos }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: guarda metodo_pago
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
      .select(`*, categorias_contables(*)`)
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT y DELETE se mantienen igual (solo actualizan los campos que ya tienen)
