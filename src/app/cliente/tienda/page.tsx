'use client'

import { useState, useEffect } from 'react'
import { Search, Star, Clock, ShoppingCart, Plus, Minus, X, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'

const products = [
  { id: 'p1', name: 'Pan Aliñado Familiar', price: 5000, icon: '🍞', stock: 15, category: 'Panadería', desc: 'Fresco del día' },
  { id: 'p2', name: 'Torta Tres Leches', price: 7500, icon: '🍰', stock: 8, category: 'Pastelería', desc: 'Porción generosa' },
  { id: 'p3', name: 'Croissant', price: 3200, icon: '🥐', stock: 12, category: 'Panadería', desc: 'Mantequilla francesa' },
  { id: 'p4', name: 'Café Tinto 7oz', price: 1800, icon: '☕', stock: 100, category: 'Bebidas', desc: 'Café colombiano' },
  { id: 'p5', name: 'Coca-Cola 350ml', price: 3500, icon: '🥤', stock: 48, category: 'Bebidas', desc: 'Botella personal' },
  { id: 'p6', name: 'Jugo Natural', price: 4000, icon: '🧃', stock: 20, category: 'Bebidas', desc: 'Fruta fresca' },
  { id: 'p7', name: 'Queso Campesino', price: 28000, icon: '🧀', stock: 5, category: 'Lácteos', desc: 'Por kilogramo', esPeso: true },
  { id: 'p8', name: 'Aguacate Hass', price: 8000, icon: '🥑', stock: 15, category: 'Verduras', desc: 'Por kilogramo', esPeso: true },
]

const categories = ['Todo', 'Panadería', 'Pastelería', 'Bebidas', 'Lácteos', 'Verduras']

export default function TiendaPage() {
  const [cart, setCart] = useState<Array<{product: typeof products[0], qty: number}>>([])
  const [selectedCat, setSelectedCat] = useState('Todo')
  const [search, setSearch] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [clienteDireccion, setClienteDireccion] = useState('')
  const [guardarDatos, setGuardarDatos] = useState(false); const [loading, setLoading] = useState(false); const [metodoPago, setMetodoPago] = useState('Efectivo')

  const filtered = (products || []).filter(p => {
    if (selectedCat !== 'Todo' && p.category !== selectedCat) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalItems = cart.reduce((s, i) => s + i.qty, 0)
  const totalPrice = cart.reduce((s, i) => s + i.product.price * i.qty, 0)

  function addToCart(p: typeof products[0]) {
    setCart(prev => {
      const exist = prev.find(i => i.product.id === p.id)
      if (exist) return prev.map(i => i.product.id === p.id ? {...i, qty: i.qty + 1} : i)
      return [...prev, {product: p, qty: 1}]
    })
  }

  async function placeOrder() {
    setLoading(true)
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({
            productId: i.product.id,
            productName: i.product.name,
            price: i.product.price,
            quantity: i.qty,
            cantidad: i.qty
          })),
          paymentMethod: metodoPago || 'Efectivo',
          customerName: clienteNombre || 'Cliente Tienda'
        })
      })
      const data = await res.json()
      if (data.success) {
        setOrderPlaced(true)
        setCart([])
        setShowCart(false)
        setShowCheckout(false)
        setTimeout(() => setOrderPlaced(false), 5000)
      }
    } catch (e) {
      alert('Error al procesar pedido')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 bg-white shadow-sm z-10">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/" className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-2xl shrink-0">🍞</Link>
            <div className="flex-1">
              <h1 className="font-bold text-lg text-stone-900">Panadería Doña Rosa</h1>
              <div className="flex items-center gap-2 text-sm">
                <span className="flex items-center gap-1 text-amber-500"><Star className="w-3.5 h-3.5 fill-current" /> 4.8</span>
                <span className="text-stone-400">·</span>
                <span className="flex items-center gap-1 text-stone-500"><Clock className="w-3.5 h-3.5" /> 30-45 min</span>
              </div>
            </div>
            <button onClick={() => setShowCart(true)} className="relative bg-orange-500 text-white p-3 rounded-full">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{totalItems}</span>}
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input type="search" placeholder="¿Qué buscas?" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-100 text-stone-900 placeholder-stone-400 text-sm" />
          </div>
        </div>
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          {categories.map(c => (
            <button key={c} onClick={() => setSelectedCat(c)} className={'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ' + (selectedCat === c ? 'bg-orange-500 text-white shadow' : 'bg-white text-stone-600 border border-stone-200')}>{c}</button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 p-4 pb-24">
        {filtered.map(p => (
          <button key={p.id} onClick={() => addToCart(p)} className="bg-white rounded-2xl p-3 shadow-sm border border-stone-200 active:scale-95 transition text-left hover:shadow-md">
            <div className="bg-stone-50 rounded-xl h-32 mb-2 flex items-center justify-center text-5xl">{p.icon}</div>
            <h3 className="font-semibold text-stone-800 text-sm leading-tight">{p.name}</h3>
            <p className="text-xs text-stone-400 mb-1">{p.desc}</p>
            <div className="flex justify-between items-center">
              <p className="text-orange-600 font-bold text-lg">{p.esPeso ? '$' + p.price.toLocaleString() + '/kg' : '$' + p.price.toLocaleString()}</p>
              {p.stock < 10 && <span className="text-xs text-red-500 font-medium">¡{p.stock}!</span>}
            </div>
          </button>
        ))}
      </div>

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
          <button onClick={() => setShowCart(true)} className="w-full bg-orange-500 text-white p-4 rounded-2xl font-bold text-lg flex justify-between items-center hover:bg-orange-600 transition">
            <span>🛒 {totalItems} productos</span>
            <span>${totalPrice.toLocaleString()}</span>
            <span>Ver →</span>
          </button>
        </div>
      )}

      {orderPlaced && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 text-center max-w-sm">
            <span className="text-6xl block mb-4">✅</span>
            <h2 className="font-bold text-xl text-stone-900 mb-2">¡Pedido Confirmado!</h2>
            <p className="text-stone-500 mb-4">Recibiras una notificacion cuando este listo.</p>
            <p className="text-sm text-stone-400">Tiempo estimado: 30-45 min</p>
          </div>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end" onClick={() => setShowCart(false)}>
          <div className="bg-white w-full rounded-t-3xl p-5 max-h-[75vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl text-stone-900">🛒 Tu Pedido</h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-stone-100 rounded-xl"><X className="w-5 h-5 text-stone-600" /></button>
            </div>
            {cart.length === 0 ? (
              <p className="text-center text-stone-400 py-8">Carrito vacio</p>
            ) : (
              <>
                {cart.map(i => (
                  <div key={i.product.id} className="flex items-center gap-3 py-3 border-b border-stone-100">
                    <span className="text-3xl">{i.product.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-stone-800 text-sm">{i.product.name}</h3>
                      <p className="text-xs text-stone-400">${i.product.price.toLocaleString()} c/u</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCart(prev => prev.map(x => x.product.id === i.product.id ? {...x, qty: Math.max(1, x.qty - 1)} : x))} className="p-1.5 bg-stone-100 rounded-lg"><Minus className="w-4 h-4 text-stone-700" /></button>
                      <span className="w-6 text-center font-bold text-stone-800">{i.qty}</span>
                      <button onClick={() => setCart(prev => prev.map(x => x.product.id === i.product.id ? {...x, qty: x.qty + 1} : x))} className="p-1.5 bg-stone-100 rounded-lg"><Plus className="w-4 h-4 text-stone-700" /></button>
                      <button onClick={() => setCart(prev => prev.filter(x => x.product.id !== i.product.id))} className="p-1.5 text-red-400"><X className="w-4 h-4" /></button>
                    </div>
                    <span className="font-bold text-emerald-600 w-20 text-right">${(i.product.price * i.qty).toLocaleString()}</span>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t-2 border-stone-200">
                  <div className="flex justify-between text-lg font-bold text-stone-900 mb-1"><span>Total</span><span className="text-emerald-600">${totalPrice.toLocaleString()}</span></div>
                  <p className="text-xs text-stone-400 mb-4">Tiempo estimado: 30-45 min</p>
                  <button onClick={() => { setShowCart(false); setShowCheckout(true) }} className="w-full bg-orange-500 text-white rounded-2xl py-4 font-bold text-lg hover:bg-orange-600 transition">
                    Confirmar Pedido · ${totalPrice.toLocaleString()}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end" onClick={() => setShowCheckout(false)}>
          <div className="bg-white w-full rounded-t-3xl p-5 max-h-[75vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-xl text-stone-900 mb-4">📍 Datos de entrega</h2>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Nombre</label>
              <div className="flex items-center gap-2 p-3 bg-stone-50 border border-stone-200 rounded-xl mb-3">
                <input value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Tu nombre completo" className="flex-1 bg-transparent text-sm text-stone-900 placeholder-stone-400 outline-none" />
              </div>
<label className="block text-sm font-bold text-stone-700 mb-1">Direccion</label>
                <div className="flex items-center gap-2 p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                  <input value={clienteDireccion} onChange={e => setClienteDireccion(e.target.value)} placeholder='Calle, barrio, No.' className="flex-1 bg-transparent text-sm text-stone-900 placeholder-stone-400 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Telefono</label>
                <div className="flex items-center gap-2 p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <Phone className="w-4 h-4 text-green-500 shrink-0" />
                  <input value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)} placeholder='312 456 7890' className="flex-1 bg-transparent text-sm text-stone-900 placeholder-stone-400 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Metodo de pago</label>
              <label className="flex items-center gap-2 text-sm text-stone-600 mb-3">
                <input type="checkbox" checked={guardarDatos} onChange={e => setGuardarDatos(e.target.checked)} className="w-4 h-4 rounded" />
                Guardar mis datos para futuros pedidos
              </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Efectivo','Nequi','Daviplata'].map(m => (
                    <button key={m} className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-700 hover:bg-orange-50 hover:border-orange-300">{m}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-stone-50 rounded-xl p-4 mb-4">
              <div className="flex justify-between text-sm mb-1"><span className="text-stone-600">Subtotal</span><span className="font-bold text-stone-800">${totalPrice.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm mb-1"><span className="text-stone-600">Envio</span><span className="font-bold text-emerald-600">GRATIS</span></div>
              <hr className="my-2" />
              <div className="flex justify-between text-lg font-bold"><span className="text-stone-900">Total</span><span className="text-emerald-600">${totalPrice.toLocaleString()}</span></div>
            </div>
            <button onClick={placeOrder} className="w-full bg-orange-500 text-white rounded-2xl py-4 font-bold text-lg hover:bg-orange-600 transition">
              🛵 Hacer Pedido · ${totalPrice.toLocaleString()}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}



