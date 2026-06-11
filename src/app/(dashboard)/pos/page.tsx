'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart, Trash2, Plus, Minus, AlertCircle } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  icon: string
  stock: number
  isRecipe: boolean
}

interface CartItem {
  product: Product
  quantity: number
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [showPayment, setShowPayment] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    setProducts([
      { id: 'p1', name: 'Pan Aliñado Familiar', price: 5000, icon: '🍞', stock: 15, isRecipe: true },
      { id: 'p2', name: 'Torta Tres Leches', price: 7500, icon: '🍰', stock: 8, isRecipe: true },
      { id: 'p3', name: 'Coca-Cola 350ml', price: 3500, icon: '🥤', stock: 48, isRecipe: false },
      { id: 'p4', name: 'Café Tinto 7oz', price: 1800, icon: '☕', stock: 100, isRecipe: false },
    ])
    setSessionId('session-001')
  }, [])

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { product, quantity: 1 }]
    })
  }

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.product.id !== id))
  const updateQty = (id: string, d: number) => {
    setCart(prev => prev.map(i => i.product.id === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i))
  }

  const pay = (method: string) => {
    setMessage('✅ Venta realizada - \$' + total.toLocaleString() + ' con ' + method)
    setCart([])
    setShowPayment(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-10 bg-gray-900 p-4 flex justify-between items-center border-b border-gray-800">
        <div>
          <h1 className="text-xl font-bold">🛒 VENTA RÁPIDA</h1>
          <p className="text-xs text-gray-400">Panadería Doña Rosa</p>
        </div>
        <div className="flex items-center gap-2">
          {!sessionId && <span className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Sin caja</span>}
          <button onClick={() => cart.length > 0 && setShowPayment(true)} className="relative bg-green-600 p-3 rounded-full">
            <ShoppingCart className="w-6 h-6" />
            {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center">{cart.length}</span>}
          </button>
        </div>
      </header>

      {message && <div className={'mx-4 mt-3 p-3 rounded-xl text-sm ' + (message.startsWith('✅') ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300')}>{message}</div>}

      <div className="p-4 pb-40">
        <div className="grid grid-cols-2 gap-3">
          {products.map(p => (
            <button key={p.id} onClick={() => addToCart(p)} disabled={loading} className="bg-gray-800 rounded-2xl p-4 flex flex-col items-center active:scale-95 transition-transform disabled:opacity-50">
              <span className="text-5xl mb-2">{p.icon}</span>
              <h3 className="font-semibold text-sm text-center">{p.name}</h3>
              <p className="text-green-400 font-bold text-lg">\</p>
              {p.stock < 10 && <span className="text-xs text-red-400 mt-1">¡Quedan {p.stock}!</span>}
            </button>
          ))}
        </div>
      </div>

      {cart.length > 0 && !showPayment && (
        <div className="fixed bottom-20 left-4 right-4 bg-gray-800 rounded-2xl p-4 border border-gray-700">
          <div className="max-h-32 overflow-y-auto space-y-2 mb-3">
            {cart.map(item => (
              <div key={item.product.id} className="flex justify-between items-center text-sm">
                <span>{item.product.icon} {item.product.name}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.product.id, -1)} className="p-1 bg-gray-700 rounded"><Minus className="w-3 h-3" /></button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.product.id, 1)} className="p-1 bg-gray-700 rounded"><Plus className="w-3 h-3" /></button>
                  <button onClick={() => removeFromCart(item.product.id)} className="p-1 text-red-400"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-right text-xl font-bold text-green-400">\</p>
        </div>
      )}

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-800">
          {showPayment ? (
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => pay('Efectivo')} disabled={loading} className="bg-green-600 rounded-2xl py-4 font-bold text-lg flex flex-col items-center disabled:opacity-50"><span className="text-2xl mb-1">💵</span>EFECTIVO</button>
              <button onClick={() => pay('Nequi')} disabled={loading} className="bg-purple-600 rounded-2xl py-4 font-bold text-lg flex flex-col items-center disabled:opacity-50"><span className="text-2xl mb-1">📱</span>NEQUI</button>
              <button onClick={() => pay('Daviplata')} disabled={loading} className="bg-red-600 rounded-2xl py-4 font-bold text-lg flex flex-col items-center disabled:opacity-50"><span className="text-2xl mb-1">🏧</span>DAVIPLATA</button>
            </div>
          ) : (
            <button onClick={() => setShowPayment(true)} className="w-full bg-green-600 rounded-2xl py-4 font-bold text-xl">{loading ? '⏳ Procesando...' : '💰 COBRAR \$' + total.toLocaleString()}</button>
          )}
        </div>
      )}
    </div>
  )
}
