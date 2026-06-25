import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 1. Intentar consultar 'productos'
    const { data: productosData, error: productosError } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true })

    // 2. Intentar consultar 'products'
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      productos: {
        exists: !productosError,
        count: productosData?.length || 0,
        error: productosError?.message || null
      },
      products: {
        exists: !productsError,
        count: productsData?.length || 0,
        error: productsError?.message || null
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    })
  }
}
