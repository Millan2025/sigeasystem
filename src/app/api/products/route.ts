import { NextResponse } from 'next/server'

const iconosPorCategoria: {[key: string]: string} = {
  'Panadería': '🍞',
  'Pastelería': '🍰', 
  'Bebidas': '☕',
  'Lácteos': '🧀',
  'Verduras': '🥑',
  'Insumos': '🌾',
}

const categorias: {[key: string]: string} = {}

export async function GET() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Cargar categorías
    const { data: cats } = await supabase.from('categories').select('*')
    cats?.forEach((c: any) => { categorias[c.id] = c.name })

    // Cargar productos
    const { data, error } = await supabase.from('products').select('*').eq('active', true)
    
    if (!error && data && data.length > 0) {
      const productos = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        nombre: p.name,
        price: Number(p.price),
        precio: Number(p.price),
        stock: Number(p.stock),
        icon: iconosPorCategoria[categorias[p.category_id]] || '📦',
        icono: iconosPorCategoria[categorias[p.category_id]] || '📦',
        category: categorias[p.category_id] || 'General',
        categoria: categorias[p.category_id] || 'General',
        is_recipe: p.is_recipe,
        esPeso: p.is_recipe ? false : (categorias[p.category_id] === 'Verduras' || categorias[p.category_id] === 'Lácteos'),
        image_url: p.image_url,
        imageUrl: p.image_url,
        sku: p.sku,
      }))
      
      return NextResponse.json({ success: true, data: productos, source: 'supabase' })
    }
    
    return NextResponse.json({ success: true, data: [], source: 'supabase-vacio' })
  } catch (error) {
    return NextResponse.json({ success: true, data: [], source: 'error', error: String(error) })
  }
}
