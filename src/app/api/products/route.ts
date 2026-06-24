import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const url = new URL(request.url)
    const categoria = url.searchParams.get('categoria')
    const isDemo = url.searchParams.get('demo') === 'true'

    // 🔥 Usar el tenant_id de demo para dev
    const tenantId = '7e045520-5e36-4e3f-a39f-10ea7d6dce76'

    if (!tenantId) {
      return NextResponse.json({ success: true, data: [], source: 'no-tenant' })
    }

    // Construir la consulta
    let query = supabase
      .from('productos')
      .select('*')
      .eq('tenant_id', tenantId)

    // 🔥 Filtrar por categoría si se proporciona
    if (categoria && categoria !== 'null' && categoria !== 'undefined') {
      query = query.eq('categoria', categoria)
    }

    const { data, error } = await query.order('nombre')

    if (error) {
      return NextResponse.json({ success: true, data: [], source: 'error' })
    }

    return NextResponse.json({ 
      success: true, 
      data: data || [], 
      source: isDemo ? 'demo' : 'productos',
      categoria: categoria || 'todas'
    })
  } catch {
    return NextResponse.json({ success: true, data: [], source: 'catch' })
  }
}
