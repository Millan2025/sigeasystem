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
    const tenantId = url.searchParams.get('tenant')

    const tenantIdFinal = tenantId || '7e045520-5e36-4e3f-a39f-10ea7d6dce76'

    let query = supabase
      .from('productos')
      .select('*')
      .eq('tenant_id', tenantIdFinal)

    // 🔥 Usar ilike para evitar problemas de tildes y mayúsculas
    if (categoria && categoria !== 'null' && categoria !== 'undefined') {
      query = query.ilike('categoria', categoria)
    }

    const { data, error } = await query.order('nombre')

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      })
    }

    return NextResponse.json({ 
      success: true, 
      data: data || [],
      count: data?.length || 0,
      tenant: tenantIdFinal,
      categoria: categoria || 'todas'
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    })
  }
}
