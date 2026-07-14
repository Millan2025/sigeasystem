import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Body recibido en API:', body);
    const {
      nombre_negocio,
      tipo,
      gerente,
      correo_contacto,
      telefono,
      direccion,
      plan,
      logo_url,
      whatsapp,
      nequi,
      bancolombia,
      daviplata,
      color_principal,
      color_secundario
    } = body

    if (!nombre_negocio || !tipo || !correo_contacto) {
      console.error('Validación fallida:', { nombre_negocio, tipo, correo_contacto });
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios: nombre_negocio, tipo, correo_contacto' },
        { status: 400 }
      )
    }

    const tenant_id = crypto.randomUUID()

    const { data, error } = await supabase
      .from('business_config')
      .insert({
        tenant_id,
        nombre_negocio,
        tipo_negocio: tipo,
        gerente: gerente || null,
        correo_contacto,
        telefono: telefono || null,
        direccion: direccion || null,
        plan: plan || 'Free',
        logo_url: logo_url || null,
        whatsapp: whatsapp || null,
        nequi: nequi || null,
        bancolombia: bancolombia || null,
        daviplata: daviplata || null,
        color_principal: color_principal || '#10B981',
        color_secundario: color_secundario || '#059669',
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

