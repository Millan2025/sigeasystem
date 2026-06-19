import { NextResponse } from 'next/server'

function getIcono(sku: string, name: string): string {
  const nameLower = (name || '').toLowerCase()
  if (nameLower.includes('pan') && nameLower.includes('queso')) return '🧀'
  if (nameLower.includes('pan')) return '🍞'
  if (nameLower.includes('torta') || nameLower.includes('pastel') || nameLower.includes('leches')) return '🍰'
  if (nameLower.includes('café') || nameLower.includes('cafe') || nameLower.includes('tinto')) return '☕'
  if (nameLower.includes('jugo')) return '🧃'
  if (nameLower.includes('agua')) return '💧'
  if (nameLower.includes('bandeja') || nameLower.includes('paisa')) return '🍛'
  if (nameLower.includes('sancocho') || nameLower.includes('sopa')) return '🍲'
  if (nameLower.includes('coca') || nameLower.includes('gaseosa')) return '🥤'
  return '📦'
}

function getCategoria(sku: string, name: string, catName: string): string {
  if (catName && catName !== 'General') return catName
  const skuPrefix = (sku || '').substring(0, 3)
  if (skuPrefix === 'PAN') return 'Panaderia'
  if (skuPrefix === 'PAS') return 'Pasteleria'
  if (skuPrefix === 'BEB') return 'Bebidas'
  if (skuPrefix === 'MEN') return 'Plato Fuerte'
  return 'General'
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
      const productos = data.map((p: any) => {
        const catName = p.categories?.name || ''
        return {
          id: p.id, name: p.name, nombre: p.name,
          price: Number(p.price), precio: Number(p.price),
          stock: Number(p.stock),
          icon: getIcono(p.sku, p.name), icono: getIcono(p.sku, p.name),
          category: getCategoria(p.sku, p.name, catName),
          categoria: getCategoria(p.sku, p.name, catName),
          is_recipe: p.is_recipe, esPeso: false,
          image_url: p.image_url, imageUrl: p.image_url, sku: p.sku,
        }
      })
      return NextResponse.json({ success: true, data: productos, source: 'supabase' })
    }
    return NextResponse.json({ success: true, data: [], source: 'vacio' })
  } catch {
    return NextResponse.json({ success: true, data: [], source: 'error' })
  }
}
