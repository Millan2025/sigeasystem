import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST: Registrar nómina pagada
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      tenant_id, 
      fecha_inicio, 
      fecha_fin, 
      total_pagado, 
      empleados_count, 
      metodo_pago, 
      transaccion_id, 
      aprobado_por, 
      notas 
    } = body

    if (!tenant_id || !fecha_inicio || !fecha_fin || !total_pagado) {
      return NextResponse.json({ 
        success: false, 
        error: 'Faltan campos obligatorios' 
      }, { status: 400 })
    }

    // Verificar si ya existe una nómina para este período
    const { data: existente } = await supabase
      .from('nominas_pagadas')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('fecha_inicio', fecha_inicio)
      .eq('fecha_fin', fecha_fin)
      .single()

    if (existente) {
      return NextResponse.json({ 
        success: false, 
        error: 'Ya existe una nómina registrada para este período' 
      }, { status: 400 })
    }

    // Insertar nueva nómina
    const { data, error } = await supabase
      .from('nominas_pagadas')
      .insert([{
        tenant_id,
        fecha_inicio,
        fecha_fin,
        total_pagado,
        empleados_count,
        metodo_pago: metodo_pago || null,
        transaccion_id: transaccion_id || null,
        aprobado_por: aprobado_por || 'admin',
        notas: notas || null
      }])
      .select()
      .single()

    if (error) {
      console.error('Error POST nominas:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// GET: Listar nóminas pagadas
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenant')

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Falta tenant_id' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('nominas_pagadas')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('fecha_fin', { ascending: false })

    if (error) {
      console.error('Error GET nominas:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
