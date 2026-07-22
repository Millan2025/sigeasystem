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

    // Usar business_config (la tabla real)
    const { data, error } = await supabase
      .from('business_config')
      .select('nombre_negocio, whatsapp, direccion, telefono')
      .eq('id', tenantId)   // ← IMPORTANTE: usar 'id' no 'tenant_id'
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('❌ Error en tenant-config:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
