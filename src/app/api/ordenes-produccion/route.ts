import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET: listar órdenes
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenant') || '7e045520-5e36-4e3f-a39f-10ea7d6dce76'
    const estado = url.searchParams.get('estado')
    const productor = url.searchParams.get('productor')

    let query = supabase
      .from('ordenes_produccion')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (estado && estado !== 'todos') query = query.eq('estado', estado)
    if (productor) query = query.eq('productor_asignado', productor)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: crear orden
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tenant_id, tipo, descripcion, fecha_entrega, prioridad, productor_asignado, productos, observaciones } = body

    if (!tenant_id) {
      return NextResponse.json(
        { success: false, error: 'tenant_id es requerido' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('ordenes_produccion')
      .insert({
        tenant_id,
        tipo: tipo || 'produccion_planificada',
        descripcion: descripcion || '',
        fecha_entrega: fecha_entrega || null,
        prioridad: prioridad || 0,
        productor_asignado: productor_asignado || null,
        productos: productos || [],
        observaciones: observaciones || '',
        estado: 'pendiente',
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
