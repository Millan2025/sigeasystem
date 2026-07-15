import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, serviceKey || anonKey)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('business_config')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    const mapped = data.map(row => ({ ...row, tenant_id: row.id }))
    return NextResponse.json({ success: true, data: mapped })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      nombre_negocio, tipo, gerente, correo_contacto, telefono, direccion, plan,
      logo_url, whatsapp, nequi, bancolombia, daviplata,
      color_principal, color_secundario
    } = body

    if (!nombre_negocio || !tipo || !correo_contacto) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const { data, error } = await supabase
      .from('business_config')
      .insert({
        id, nombre_negocio, tipo_negocio: tipo,
        gerente, correo_contacto, telefono, direccion,
        plan: plan || 'Free',
        logo_url, whatsapp, nequi, bancolombia, daviplata,
        color_principal: color_principal || '#10B981',
        color_secundario: color_secundario || '#059669',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data: { ...data, tenant_id: data.id } })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// 🔥 PUT: Editar cliente
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const {
      id, nombre_negocio, tipo, gerente, correo_contacto, telefono, direccion, plan,
      logo_url, whatsapp, nequi, bancolombia, daviplata,
      color_principal, color_secundario
    } = body

    if (!id || !nombre_negocio || !tipo || !correo_contacto) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('business_config')
      .update({
        nombre_negocio, tipo_negocio: tipo,
        gerente, correo_contacto, telefono, direccion,
        plan, logo_url, whatsapp, nequi, bancolombia, daviplata,
        color_principal, color_secundario
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data: { ...data, tenant_id: data.id } })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// 🔥 DELETE: Eliminar cliente
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'Se requiere ID' }, { status: 400 })
    }
    const { error } = await supabase
      .from('business_config')
      .delete()
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true, message: 'Cliente eliminado' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
