import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 🔥 Consulta SIN filtro de tenant (todos los productos)
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .limit(20)

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
      message: 'Sin filtro de tenant'
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    })
  }
}
