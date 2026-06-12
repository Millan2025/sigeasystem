'use client'

import { useState } from 'react'
import { Search, Star, Clock } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  icon: string
  stock: number
  category: string
}

const products: Product[] = [
  { id: 'p1', name: 'Pan AliÃƒÂ±ado Familiar', price: 5000, icon: 'Ã°Å¸ÂÅ¾', stock: 15, category: 'PanaderÃƒÂ­a' },
  { id: 'p2', name: 'Torta Tres Leches', price: 7500, icon: 'Ã°Å¸ÂÂ°', stock: 8, category: 'PastelerÃƒÂ­a' },
  { id: 'p3', name: 'Coca-Cola 350ml', price: 3500, icon: 'Ã°Å¸Â¥Â¤', stock: 48, category: 'Bebidas' },
  { id: 'p4', name: 'CafÃƒÂ© Tinto 7oz', price: 1800, icon: 'Ã¢Ëœâ€¢', stock: 100, category: 'Bebidas' },
  { id: 'p5', name: 'Croissant', price: 3200, icon: 'Ã°Å¸Â¥Â', stock: 12, category: 'PanaderÃƒÂ­a' },
  { id: 'p6', name: 'Jugo Natural', price: 4000, icon: 'Ã°Å¸Â§Æ’', stock: 20, category: 'Bebidas' },
]

const categories = ['Todo', 'PanaderÃƒÂ­a', 'PastelerÃƒÂ­a', 'Bebidas']

export default function TiendaPage() {
  const [cart, setCart] = useState<Product[]>([])
  const [selectedCat, setSelectedCat] = useState('Todo')
  const [search, setSearch] = useState('')

  const filtered = products.filter(product => {
    if (selectedCat !== 'Todo' && product.category !== selectedCat) {
      return false
    }

    if (search && !product.name.toLowerCase().includes(search.toLowerCase())) {
      return false
    }

    return true
  })

  const addToCart = (product: Product) => {
    setCart(prev => [...prev, product])
  }

  return (
    <div className="min-h-screen bg-stone-50 max-w-lg mx-auto">
      <header className="sticky top-0 z-10 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-2xl">
            Ã°Å¸ÂÅ¾
          </div>
          <div>
            <h1 className="text-lg font-bold">PanaderÃƒÂ­a DoÃƒÂ±a Rosa</h1>
            <div className="flex items-center gap-2 text-sm text-yellow-500">
              <Star className="h-4 w-4 fill-current" />
              <span>4.8 (256 pedidos)</span>
              <Clock className="ml-1 h-4 w-4" />
              <span>30-45 min</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Buscar productos..."
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="w-full rounded-xl bg-gray-100 py-3 pl-10 pr-4 text-sm"
          />
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto p-4">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCat(category)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium shadow transition ${
              selectedCat === category ? 'bg-orange-500 text-white' : 'bg-white text-gray-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pb-24">
        {filtered.map(product => (
          <button
            key={product.id}
            onClick={() => addToCart(product)}
            className="rounded-2xl bg-white p-3 text-left shadow-sm transition-transform active:scale-95"
          >
            <div className="mb-2 flex h-32 items-center justify-center rounded-xl bg-gray-100 text-5xl">
              {product.icon}
            </div>
            <h3 className="text-sm font-semibold">{product.name}</h3>
            <p className="text-lg font-bold text-orange-600">${product.price.toLocaleString()}</p>
            {product.stock < 10 && <span className="text-xs text-red-500">Ã‚Â¡Quedan {product.stock}!</span>}
          </button>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4">
          <button className="flex w-full items-center justify-between rounded-2xl bg-orange-500 p-4 text-lg font-bold text-white shadow-lg">
            <span>Ã°Å¸â€ºâ€™ {cart.length} productos</span>
            <span>${cart.reduce((sum, product) => sum + product.price, 0).toLocaleString()}</span>
            <span>Ver carrito Ã¢â€ â€™</span>
          </button>
        </div>
      )}
    </div>
  )
}
