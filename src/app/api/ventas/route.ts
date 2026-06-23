import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 1. Obtener usuario autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    // 2. Obtener tenant_id
    const { data: userData } = await supabase
      .from('usuarios')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ success: false, error: 'Usuario sin tenant' }, { status: 400 })
    }

    // 3. Obtener ventas del body
    const { ventas } = await request.json()
    if (!ventas || ventas.length === 0) {
      return NextResponse.json({ success: false, error: 'No hay ventas' }, { status: 400 })
    }

    // 4. Insertar ventas
    const ventasConTenant = ventas.map((v: any) => ({
      ...v,
      tenant_id: userData.tenant_id
    }))

    const { error } = await supabase
      .from('ventas')
      .insert(ventasConTenant)

    if (error) {
      console.error('Error insertando ventas:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // 5. Actualizar stock de productos
    for (const v of ventas) {
      const productoId = v.producto_id
      if (productoId) {
        await supabase.rpc('reducir_stock', {
          p_producto_id: productoId,
          p_cantidad: v.cantidad
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error en API ventas:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
