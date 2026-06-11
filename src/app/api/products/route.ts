import { NextResponse } from 'next/server'

export async function GET() {
  const products = [
    { id: 'p1', name: 'Pan Aliñado Familiar', price: 5000, icon: '🍞', stock: 15, isRecipe: true },
    { id: 'p2', name: 'Torta Tres Leches', price: 7500, icon: '🍰', stock: 8, isRecipe: true },
    { id: 'p3', name: 'Coca-Cola 350ml', price: 3500, icon: '🥤', stock: 48, isRecipe: false },
    { id: 'p4', name: 'Café Tinto 7oz', price: 1800, icon: '☕', stock: 100, isRecipe: false },
    { id: 'p5', name: 'Croissant', price: 3200, icon: '🥐', stock: 12, isRecipe: true },
    { id: 'p6', name: 'Jugo Natural', price: 4000, icon: '🧃', stock: 20, isRecipe: false },
  ]

  return NextResponse.json({ success: true, data: products })
}