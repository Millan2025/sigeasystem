import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const url = new URL(request.url)
    const isDemo = url.searchParams.get('demo') === 'true'

    let tenantId = null

    if (isDemo) {
      // 🔥 Usar el tenant_id como string, Supabase lo convertirá automáticamente
      tenantId = '7e045520-5e36-4e3f-a39f-10ea7d6dce76'
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ success: false, data: [], error: 'No autenticado' }, { status: 401 })
      }

      const { data: userData } = await supabase
        .from('usuarios')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      tenantId = userData?.tenant_id
    }

    if (!tenantId) {
      return NextResponse.json({ success: false, data: [], error: 'Sin tenant' }, { status: 400 })
    }

    // 🔥 Consulta directa con el tenant_id
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nombre')

    if (error) {
      console.error('Error en query:', error)
      return NextResponse.json({ success: false, data: [], error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [], source: isDemo ? 'demo' : 'productos' })
  } catch (error) {
    console.error('Error en API productos:', error)
    return NextResponse.json({ success: false, data: [], error: 'Error interno' }, { status: 500 })
  }
}
