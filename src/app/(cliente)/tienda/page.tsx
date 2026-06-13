'use client'
import { useState } from 'react'
import { Search, Star, Clock } from 'lucide-react'

const products = [
  { id: 'p1', name: 'Pan Aliñado Familiar', price: 5000, icon: '🍞', stock: 15, category: 'Panadería' },
  { id: 'p2', name: 'Torta Tres Leches', price: 7500, icon: '🍰', stock: 8, category: 'Pastelería' },
  { id: 'p3', name: 'Coca-Cola 350ml', price: 3500, icon: '🥤', stock: 48, category: 'Bebidas' },
  { id: 'p4', name: 'Café Tinto 7oz', price: 1800, icon: '☕', stock: 100, category: 'Bebidas' },
  { id: 'p5', name: 'Croissant', price: 3200, icon: '🥐', stock: 12, category: 'Panadería' },
  { id: 'p6', name: 'Jugo Natural', price: 4000, icon: '🧃', stock: 20, category: 'Bebidas' },
]

const categories = ['Todo', 'Panadería', 'Pastelería', 'Bebidas']

export default function TiendaPage() {
  const [cart, setCart] = useState<typeof products>([])
  const [selectedCat, setSelectedCat] = useState('Todo')
  const [search, setSearch] = useState('')
  const filtered = products.filter(p => {
    if (selectedCat !== 'Todo' && p.category !== selectedCat) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen bg-stone-50 md:max-w-2xl lg:max-w-4xl mx-auto">
      <header className="sticky top-0 bg-white shadow-sm p-4 z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-2xl">🍞</div>
          <div><h1 className="font-bold text-lg">Panadería Doña Rosa</h1>
            <div className="flex items-center text-sm text-yellow-500 gap-2"><Star className="w-4 h-4 fill-current" />4.8<Clock className="w-4 h-4 ml-1" />30-45 min</div>
          </div>
        </div>
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="search" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 text-sm" />
        </div>
      </header>
      <div className="flex gap-2 p-4 overflow-x-auto">
        {categories.map(c => <button key={c} onClick={() => setSelectedCat(c)} className={'px-4 py-2 rounded-full shadow whitespace-nowrap text-sm font-medium ' + (selectedCat === c ? 'bg-orange-500 text-white' : 'bg-white text-gray-700')}>{c}</button>)}
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 pb-24">
        {filtered.map(p => (
          <button key={p.id} onClick={() => setCart(prev => [...prev, p])} className="bg-white rounded-2xl p-3 shadow-sm active:scale-95 transition text-left">
            <div className="bg-gray-100 rounded-xl h-32 mb-2 flex items-center justify-center text-5xl">{p.icon}</div>
            <h3 className="font-semibold text-sm">{p.name}</h3><p className="text-orange-600 font-bold text-lg">${p.price.toLocaleString()}</p>
            {p.stock < 10 && <span className="text-xs text-red-500">Quedan {p.stock}</span>}
          </button>
        ))}
      </div>
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t md:max-w-2xl lg:max-w-4xl mx-auto">
          <button className="w-full bg-orange-500 text-white p-4 rounded-2xl font-bold text-lg shadow-lg flex justify-between">
            <span>{cart.length} productos</span><span>${cart.reduce((s, p) => s + p.price, 0).toLocaleString()}</span><span>Ver carrito →</span>
          </button>
        </div>
      )}
    </div>
  )
}

