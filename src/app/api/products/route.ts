import { NextResponse } from 'next/server'

// Por ahora usamos datos de respaldo mientras conectamos Supabase
// La conexión real se activa cuando las variables de entorno estén configuradas

const productosRespaldo = [
  { id: '1', name: 'Pan Aliñado Familiar', price: 5000, icon: '🍞', stock: 45, category: 'Panadería', is_recipe: true },
  { id: '2', name: 'Torta Tres Leches', price: 7500, icon: '🍰', stock: 8, category: 'Pastelería', is_recipe: true },
  { id: '3', name: 'Croissant', price: 3200, icon: '🥐', stock: 12, category: 'Panadería', is_recipe: true },
  { id: '4', name: 'Café Tinto 7oz', price: 1800, icon: '☕', stock: 100, category: 'Bebidas', is_recipe: false },
  { id: '5', name: 'Coca-Cola 350ml', price: 3500, icon: '🥤', stock: 48, category: 'Bebidas', is_recipe: false },
  { id: '6', name: 'Jugo Natural', price: 4000, icon: '🧃', stock: 20, category: 'Bebidas', is_recipe: false },
  { id: '7', name: 'Queso Campesino', price: 28000, icon: '🧀', stock: 5, category: 'Lácteos', is_recipe: false, esPeso: true, precioPorKg: 28000 },
  { id: '8', name: 'Tomate Chonto', price: 5000, icon: '🍅', stock: 10, category: 'Verduras', is_recipe: false, esPeso: true, precioPorKg: 5000 },
  { id: '9', name: 'Aguacate Hass', price: 8000, icon: '🥑', stock: 15, category: 'Verduras', is_recipe: false, esPeso: true, precioPorKg: 8000 },
]

export async function GET() {
  try {
    // Intentar conectar a Supabase
    if (process.env.DATABASE_URL) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data, error } = await supabase.from('products').select('*').eq('active', true)
      
      if (!error && data && data.length > 0) {
        return NextResponse.json({ success: true, data, source: 'supabase' })
      }
    }
    
    // Respaldos si no hay conexión
    return NextResponse.json({ success: true, data: productosRespaldo, source: 'respaldo' })
  } catch {
    return NextResponse.json({ success: true, data: productosRespaldo, source: 'respaldo' })
  }
}
