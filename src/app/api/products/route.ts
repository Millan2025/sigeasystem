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
    const tenantIdParam = url.searchParams.get('tenant')
    const tenantId = tenantIdParam || '7e045520-5e36-4e3f-a39f-10ea7d6dce76'

    // 🔥 Primero, obtener todos los productos del tenant (sin filtro)
    const { data: allData, error: allError } = await supabase
      .from('productos')
      .select('*')
      .eq('tenant_id', tenantId)

    if (allError) {
      return NextResponse.json({ 
        success: false, 
        error: allError.message,
        debug: { tenantId }
      })
    }

    // 🔥 Luego, filtrar por categoría si se proporciona
    let query = supabase
      .from('productos')
      .select('*')
      .eq('tenant_id', tenantId)

    if (categoria && categoria !== 'null' && categoria !== 'undefined') {
      query = query.eq('categoria', categoria)
    }

    const { data, error } = await query.order('nombre')

    return NextResponse.json({
      success: true,
      data: data || [],
      totalTenant: allData?.length || 0,
      tenantId: tenantId,
      categoria: categoria || 'todas',
      debug: {
        allDataCount: allData?.length || 0,
        filteredCount: data?.length || 0
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    })
  }
}
