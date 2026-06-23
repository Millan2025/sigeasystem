import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Verificar si es modo demo
    const url = new URL(request.url)
    const isDemo = url.searchParams.get('demo') === 'true'

    let tenantId = null

    if (isDemo) {
      // Modo demo: usar tenant_id de fjmillan39
      tenantId = '7e045520-5e36-4e3f-a39f-10ea7d6dce76'
    } else {
      // Modo normal: obtener usuario autenticado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ success: true, data: [], source: 'no-auth' })
      }

      const { data: userData } = await supabase
        .from('usuarios')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      tenantId = userData?.tenant_id
    }

    if (!tenantId) {
      return NextResponse.json({ success: true, data: [], source: 'no-tenant' })
    }

    // Obtener productos
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nombre')

    if (error) {
      console.error('Error al obtener productos:', error)
      return NextResponse.json({ success: true, data: [], source: 'error' })
    }

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

    return NextResponse.json({ success: true, data: productos, source: isDemo ? 'demo' : 'productos' })
  } catch (error) {
    console.error('Error en API productos:', error)
    return NextResponse.json({ success: true, data: [], source: 'catch' })
  }
}
