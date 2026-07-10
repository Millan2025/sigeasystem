import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET: listar todos los tenants (solo admin master)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('business_config')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: crear nuevo tenant (usado por admin master)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre, tipo, gerente, email, telefono, direccion, plan } = body

    if (!nombre || !tipo || !gerente || !email) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    // Generar tenant_id
    const tenant_id = crypto.randomUUID()

    // Insertar en business_config
    const { data, error } = await supabase
      .from('business_config')
      .insert({
        tenant_id,
        nombre,
        tipo_negocio: tipo,
        gerente,
        email,
        telefono,
        direccion,
        plan: plan || 'Free',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // También crear un usuario admin para este tenant (opcional)
    // Se puede hacer en un paso separado

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
