'use client'

import { useState } from 'react'
import { ShoppingCart, Minus, Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const productos = [
  { id: 'p1', nombre: 'Pan Aliñado Familiar', precio: 5000, icono: '🍞', stock: 15, cat: 'Panadería' },
  { id: 'p2', nombre: 'Torta Tres Leches', precio: 7500, icono: '🍰', stock: 8, cat: 'Pastelería' },
  { id: 'p3', nombre: 'Croissant', precio: 3200, icono: '🥐', stock: 12, cat: 'Panadería' },
  { id: 'p4', nombre: 'Café Tinto 7oz', precio: 1800, icono: '☕', stock: 100, cat: 'Bebidas' },
  { id: 'p5', nombre: 'Coca-Cola 350ml', precio: 3500, icono: '🥤', stock: 48, cat: 'Bebidas' },
  { id: 'p6', nombre: 'Jugo Natural', precio: 4000, icono: '🧃', stock: 20, cat: 'Bebidas' },
]

export default function POSPage() {
  const [cart, setCart] = useState<Array<{product: typeof productos[0], qty: number}>>([])
  const [showPay, setShowPay] = useState(false)
  const [msg, setMsg] = useState('')
  const [catFilter, setCatFilter] = useState('Todo')

  const cats = ['Todo', 'Panadería', 'Pastelería', 'Bebidas']
  const filtered = catFilter === 'Todo' ? productos : productos.filter(p => p.cat === catFilter)
  const total = cart.reduce((s, i) => s + i.product.precio * i.qty, 0)

  const addItem = (p: typeof productos[0]) => {
    setCart(prev => {
      const exist = prev.find(i => i.product.id === p.id)
      if (exist) return prev.map(i => i.product.id === p.id ? {...i, qty: i.qty + 1} : i)
      return [...prev, {product: p, qty: 1}]
    })
  }

  const pay = (m: string) => {
    setMsg(`✅ Venta: $${total.toLocaleString()} - ${m}`)
    setCart([])
    setShowPay(false)
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/" className="p-2 hover:bg-stone-100 rounded-xl"><ArrowLeft className="w-5 h-5 text-stone-600" /></Link>
        <div className="flex-1">
          <h1 className="font-bold text-stone-800">Punto de Venta</h1>
          <p className="text-xs text-stone-400">Venta rápida</p>
        </div>
        <button onClick={() => cart.length > 0 && setShowPay(true)} className="relative bg-emerald-500 text-white p-3 rounded-xl">
          <ShoppingCart className="w-5 h-5" />
          {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-5 h-5 rounded-full">{cart.length}</span>}
        </button>
      </header>

      {msg && <div className="mx-4 mt-3 p-3 bg-emerald-100 text-emerald-800 rounded-xl text-sm">{msg}</div>}

      {/* Categorías */}
      <div className="flex gap-2 p-4 overflow-x-auto">
        {cats.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            catFilter === c ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 border border-stone-200'
          }`}>{c}</button>
        ))}
      </div>

      {/* Productos */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-40">
        {filtered.map(p => (
          <button key={p.id} onClick={() => addItem(p)} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 active:scale-95 transition">
            <span className="text-5xl block text-center mb-2">{p.icono}</span>
            <h3 className="font-medium text-stone-800 text-sm">{p.nombre}</h3>
            <p className="text-emerald-600 font-bold mt-1">${p.precio.toLocaleString()}</p>
            {p.stock < 10 && <span className="text-xs text-red-400">Quedan {p.stock}</span>}
          </button>
        ))}
      </div>

      {/* Carrito */}
      {cart.length > 0 && !showPay && (
        <div className="fixed bottom-20 left-4 right-4 bg-white rounded-2xl p-4 shadow-lg border border-stone-200">
          {cart.map(i => (
            <div key={i.product.id} className="flex justify-between items-center py-2">
              <span className="text-sm text-stone-700">{i.product.icono} {i.product.nombre}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCart(prev => prev.map(x => x.product.id === i.product.id ? {...x, qty: Math.max(1, x.qty-1)} : x))} className="p-1 bg-stone-100 rounded"><Minus className="w-3 h-3" /></button>
                <span className="w-6 text-center text-sm">{i.qty}</span>
                <button onClick={() => setCart(prev => prev.map(x => x.product.id === i.product.id ? {...x, qty: x.qty+1} : x))} className="p-1 bg-stone-100 rounded"><Plus className="w-3 h-3" /></button>
                <button onClick={() => setCart(prev => prev.filter(x => x.product.id !== i.product.id))} className="p-1 text-red-400"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
          <p className="text-right font-bold text-lg text-emerald-600 mt-2">${total.toLocaleString()}</p>
        </div>
      )}

      {/* Pago */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-200">
          {showPay ? (
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => pay('Efectivo')} className="bg-emerald-500 text-white rounded-2xl py-4 font-bold text-sm">💵<br/>EFECTIVO</button>
              <button onClick={() => pay('Nequi')} className="bg-purple-500 text-white rounded-2xl py-4 font-bold text-sm">📱<br/>NEQUI</button>
              <button onClick={() => pay('Daviplata')} className="bg-red-500 text-white rounded-2xl py-4 font-bold text-sm">🏧<br/>DAVIPLATA</button>
            </div>
          ) : (
            <button onClick={() => setShowPay(true)} className="w-full bg-emerald-500 text-white rounded-2xl py-4 font-bold text-lg">
              COBRAR ${total.toLocaleString()}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
