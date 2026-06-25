import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 🔥 Consultar información de las tablas
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(20)

    if (tablesError) {
      return NextResponse.json({ 
        success: false, 
        error: tablesError.message,
        details: 'No se pudieron listar las tablas'
      })
    }

    // 🔥 Intentar consultar la tabla 'productos'
    const { data: productosData, error: productosError } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: false })
      .limit(5)

    // 🔥 Intentar consultar la tabla 'products'
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: false })
      .limit(5)

    return NextResponse.json({ 
      success: true,
      tables: tables || [],
      productos: {
        exists: !productosError,
        count: productosError ? 0 : productosData?.length || 0,
        error: productosError ? productosError.message : null,
        data: productosData || []
      },
      products: {
        exists: !productsError,
        count: productsError ? 0 : productsData?.length || 0,
        error: productsError ? productsError.message : null,
        data: productsData || []
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    })
  }
}
