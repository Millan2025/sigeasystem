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

    // Buscar en business_config usando tenant_id
    const { data, error } = await supabase
      .from('business_config')
      .select('nombre_negocio, whatsapp, direccion, telefono')
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      console.error('Error al obtener config:', error)
      // Si no hay registro, devolver datos vacíos
      return NextResponse.json({ success: true, data: { whatsapp: '' } })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
