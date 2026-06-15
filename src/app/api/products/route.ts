import { NextResponse } from 'next/server'

function getIcono(categoria: string, nombre: string): string {
  const mapaIconos: {[key: string]: string} = {
    'pan': '🍞', 'panadería': '🍞', 'torta': '🍰', 'pastelería': '🍰', 'pastel': '🍰',
    'croissant': '🥐', 'café': '☕', 'cafe': '☕', 'tinto': '☕', 'bebida': '🥤',
    'coca': '🥤', 'gaseosa': '🥤', 'jugo': '🧃', 'queso': '🧀', 'lácteo': '🧀',
    'tomate': '🍅', 'verdura': '🥑', 'aguacate': '🥑', 'harina': '🌾', 'insumo': '🌾',
    'huevo': '🥚', 'mantequilla': '🧈', 'azúcar': '🍬', 'leche': '🥛',
  }
  
  const texto = (categoria + ' ' + nombre).toLowerCase()
  for (const [clave, icono] of Object.entries(mapaIconos)) {
    if (texto.includes(clave)) return icono
  }
  
  const porCategoria: {[key: string]: string} = {
    'panadería': '🍞', 'pastelería': '🍰', 'bebidas': '🥤', 'lácteos': '🧀',
    'verduras': '🥑', 'insumos': '🌾', 'cafetería': '☕',
  }
  
  for (const [clave, icono] of Object.entries(porCategoria)) {
    if (texto.includes(clave)) return icono
  }
  
  return '📦'
}

export async function GET() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data: cats } = await supabase.from('categories').select('*')
    const categorias: {[key: string]: string} = {}
    cats?.forEach((c: any) => { categorias[c.id] = c.name })

    const { data, error } = await supabase.from('products').select('*').eq('active', true)
    
    if (!error && data && data.length > 0) {
      const productos = data.map((p: any) => {
        const cat = categorias[p.category_id] || ''
        return {
          id: p.id,
          name: p.name,
          nombre: p.name,
          price: Number(p.price),
          precio: Number(p.price),
          stock: Number(p.stock),
          icon: getIcono(cat, p.name),
          icono: getIcono(cat, p.name),
          category: cat,
          categoria: cat,
          is_recipe: p.is_recipe,
          esPeso: cat.toLowerCase().includes('verdura') || cat.toLowerCase().includes('lácteo'),
          image_url: p.image_url,
          imageUrl: p.image_url,
          sku: p.sku,
        }
      })
      
      return NextResponse.json({ success: true, data: productos, source: 'supabase' })
    }
    
    return NextResponse.json({ success: true, data: [], source: 'vacio' })
  } catch {
    return NextResponse.json({ success: true, data: [], source: 'error' })
  }
}
