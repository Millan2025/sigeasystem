import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenant')

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Falta tenant_id' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('business_config')
      .select('*')
      .eq('id', tenantId)
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('❌ GET tenant-config:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenant')
    
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Falta tenant_id' }, { status: 400 })
    }

    const body = await request.json()
    
    // Campos permitidos para actualizar
    const camposPermitidos = [
      'nombre_negocio', 'tipo_negocio', 'direccion', 'telefono', 'whatsapp',
      'correo_contacto', 'logo_url', 'color_principal', 'color_secundario',
      'gerente', 'nit', 'cedula', 'nequi', 'bancolombia', 'daviplata',
      'slogan', 'website'
    ]
    
    const updateData: any = {}
    for (const campo of camposPermitidos) {
      if (body[campo] !== undefined) {
        updateData[campo] = body[campo]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'No hay campos para actualizar' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('business_config')
      .update(updateData)
      .eq('id', tenantId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Configuración actualizada correctamente'
    })
  } catch (error: any) {
    console.error('❌ PUT tenant-config:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
