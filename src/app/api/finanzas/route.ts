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
    const startDate = url.searchParams.get('start')
    const endDate = url.searchParams.get('end')

    let query = supabase
      .from('transacciones')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('fecha', { ascending: false })

    if (startDate) query = query.gte('fecha', startDate)
    if (endDate) query = query.lte('fecha', endDate)

    const { data, error } = await query
    if (error) throw error

    const ingresos = data?.filter(t => t.tipo === 'ingreso').reduce((sum, t) => sum + t.monto, 0) || 0
    const egresos = data?.filter(t => t.tipo === 'egreso').reduce((sum, t) => sum + t.monto, 0) || 0
    const saldo = ingresos - egresos

    return NextResponse.json({
      success: true,
      data: data || [],
      resumen: { ingresos, egresos, saldo }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tipo, monto, categoria, descripcion, fecha, tenant_id } = body

    if (!tipo || !monto || !tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos: tipo, monto, tenant_id' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('transacciones')
      .insert({
        tipo,
        monto,
        categoria: categoria || 'General',
        descripcion: descripcion || '',
        fecha: fecha || new Date().toISOString().split('T')[0],
        tenant_id,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
