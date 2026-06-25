import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 🔥 Probar la conexión primero
    const { data: connectionTest, error: connectionError } = await supabase
      .from('productos')
      .select('count', { count: 'exact', head: true })

    if (connectionError) {
      return NextResponse.json({
        success: false,
        error: 'Error de conexión: ' + connectionError.message,
        details: 'La tabla "productos" podría no existir o no tener permisos'
      })
    }

    // 🔥 Obtener los primeros 10 productos con todos los campos
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .limit(10)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: 'Error al obtener productos'
      })
    }

    return NextResponse.json({
      success: true,
      countTotal: connectionTest?.count || 0,
      data: data || [],
      muestra: data?.length || 0,
      message: `La tabla tiene ${connectionTest?.count || 0} productos. Mostrando ${data?.length || 0}.`
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'Error en el servidor'
    })
  }
}
