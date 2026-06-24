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

    // 🔥 Usar el tenant_id de demo para dev
    const tenantId = tenantIdParam || '7e045520-5e36-4e3f-a39f-10ea7d6dce76'

    console.log('=== API PRODUCTOS DEBUG ===')
    console.log('Tenant ID recibido:', tenantIdParam)
    console.log('Tenant ID usado:', tenantId)
    console.log('Categoría:', categoria)

    // 🔥 Consulta SIN filtro de categoría primero
    const { data: allData, error: allError } = await supabase
      .from('productos')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nombre')

    console.log('Total productos del tenant:', allData?.length || 0)

    // 🔥 Consulta CON filtro de categoría
    let query = supabase
      .from('productos')
      .select('*')
      .eq('tenant_id', tenantId)

    if (categoria && categoria !== 'null' && categoria !== 'undefined' && categoria !== '') {
      query = query.eq('categoria', categoria)
      console.log('Filtrando por categoría:', categoria)
    }

    const { data, error } = await query.order('nombre')

    if (error) {
      console.error('Error en la consulta:', error)
      return NextResponse.json({ 
        success: false, 
        data: [], 
        error: error.message,
        debug: { tenantId, categoria }
      })
    }

    console.log('Productos filtrados:', data?.length || 0)

    return NextResponse.json({ 
      success: true, 
      data: data || [],
      count: data?.length || 0,
      totalTenant: allData?.length || 0,
      debug: { tenantId, categoria }
    })
  } catch (error: any) {
    console.error('Error en API:', error)
    return NextResponse.json({ 
      success: false, 
      data: [], 
      error: error.message 
    })
  }
}
