import { NextResponse } from 'next/server'

const ICONOS: {[key: string]: string} = {
  'PAN-001': '🍞', 'PAN-002': '🍞', 'PAN-003': '🧀',
  'PAS-001': '🍰', 'PAS-002': '🍰',
  'BEB-001': '☕', 'BEB-002': '🧃', 'BEB-003': '💧',
  'MENU-001': '🍛', 'MENU-002': '🍲',
}

const CATEGORIAS: {[key: string]: string} = {
  'PAN': 'Panaderia', 'PAS': 'Pasteleria', 'BEB': 'Bebidas',
  'MENU-001': 'Plato Fuerte', 'MENU-002': 'Sopas',
}

export async function GET() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data, error } = await supabase.from('products').select('*, categories(name)').eq('active', true)
    
    if (!error && data && data.length > 0) {
      const productos = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        nombre: p.name,
        price: Number(p.price),
        precio: Number(p.price),
        stock: Number(p.stock),
        icon: ICONOS[p.sku] || '📦',
        icono: ICONOS[p.sku] || '📦',
        category: CATEGORIAS[p.sku] || p.categories?.name || 'General',
        categoria: CATEGORIAS[p.sku] || p.categories?.name || 'General',
        is_recipe: p.is_recipe,
        esPeso: false,
        image_url: p.image_url,
        imageUrl: p.image_url,
        sku: p.sku,
      }))
      
      return NextResponse.json({ success: true, data: productos, source: 'supabase' })
    }
    
    return NextResponse.json({ success: true, data: [], source: 'vacio' })
  } catch {
    return NextResponse.json({ success: true, data: [], source: 'error' })
  }
}
