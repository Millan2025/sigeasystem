import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 🔥 Consulta con más detalles
    const { data, error, count } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      })
    }

    return NextResponse.json({ 
      success: true, 
      data: data || [],
      count: count || 0,
      muestra: data?.length || 0,
      message: 'Consulta a la tabla productos'
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    })
  }
}
