import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Listar asistencias por tenant (opcional por empleado o fecha)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenant')
    const empleadoId = url.searchParams.get('empleado_id')
    const fecha = url.searchParams.get('fecha')

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Falta tenant_id' }, { status: 400 })
    }

    let query = supabase
      .from('asistencias')
      .select('*, employees(nombre, apellido, rol)')
      .eq('tenant_id', tenantId)

    if (empleadoId) query = query.eq('empleado_id', empleadoId)
    if (fecha) query = query.eq('fecha', fecha)

    const { data, error } = await query.order('fecha', { ascending: false }).order('hora_entrada', { ascending: false })

    if (error) {
      console.error('Error GET asistencias:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: Registrar asistencia (check-in o check-out)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tenant_id, empleado_id, fecha, hora_entrada, hora_salida, notas } = body

    if (!tenant_id || !empleado_id || !hora_entrada) {
      return NextResponse.json({ success: false, error: 'tenant_id, empleado_id y hora_entrada son obligatorios' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('asistencias')
      .insert([{
        tenant_id,
        empleado_id,
        fecha: fecha || new Date().toISOString().split('T')[0],
        hora_entrada,
        hora_salida: hora_salida || null,
        notas: notas || null
      }])
      .select()
      .single()

    if (error) {
      console.error('Error POST asistencias:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT: Actualizar asistencia (check-out)
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, tenant_id, hora_salida, notas } = body

    if (!id || !tenant_id) {
      return NextResponse.json({ success: false, error: 'id y tenant_id son obligatorios' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('asistencias')
      .update({ hora_salida, notas, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .select()
      .single()

    if (error) {
      console.error('Error PUT asistencias:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
