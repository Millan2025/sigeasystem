import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 1. Obtener tenant_id del usuario autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: true, data: [], source: 'no-auth' })
    }

    // 2. Obtener tenant_id de la tabla usuarios
    const { data: userData } = await supabase
      .from('usuarios')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    const tenantId = userData?.tenant_id

    // 3. Si no tiene tenant_id, devolver vacío
    if (!tenantId) {
      return NextResponse.json({ success: true, data: [], source: 'no-tenant' })
    }

    // 4. Obtener productos de la tabla productos
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nombre')

    if (error) {
      console.error('Error al obtener productos:', error)
      return NextResponse.json({ success: true, data: [], source: 'error' })
    }

    // 5. Formatear productos para el POS
    const productos = data.map((p: any) => ({
      id: p.id,
      name: p.nombre,
      nombre: p.nombre,
      price: Number(p.precio) || 0,
      precio: Number(p.precio) || 0,
      stock: Number(p.stock) || 0,
      icon: p.icono || '📦',
      icono: p.icono || '📦',
      category: p.categoria || 'General',
      categoria: p.categoria || 'General',
      is_recipe: false,
      esPeso: p.esPeso || false,
      precioPorKg: p.precioPorKg || 0,
      unidad: p.unidad || 'unidad',
      image_url: null,
      imageUrl: null,
      sku: p.sku || null,
    }))

    return NextResponse.json({ success: true, data: productos, source: 'productos' })
  } catch (error) {
    console.error('Error en API productos:', error)
    return NextResponse.json({ success: true, data: [], source: 'catch' })
  }
}
