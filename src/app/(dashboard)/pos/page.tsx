'use client'

import { useState, useEffect } from 'react'
import { getApiUrl, isDemoMode } from '@/lib/demo-utils'
import { ShoppingCart, Minus, Plus, Trash2, ArrowLeft, X, Scale, Search } from 'lucide-react'
import Link from 'next/link'

interface ProductoBase {
  id: string; nombre: string; icono: string; stock: number; cat: string; esPeso: boolean;
  precio?: number; precioPorKg?: number; unidad?: string;
}

interface CartItem {
  id: string; nombre: string; icono: string; cantidad: number; precioUnitario: number; subtotal: number; unidad?: string;
}

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const [msg, setMsg] = useState('')
  const [catFilter, setCatFilter] = useState('Todo')
  const [searchTerm, setSearchTerm] = useState('')
  const [productoPesaje, setProductoPesaje] = useState<ProductoBase | null>(null)
  const [pesoInput, setPesoInput] = useState('')
  const [productos, setProductos] = useState<ProductoBase[]>([])
  const [cliente, setCliente] = useState('Cliente Universal')

  useEffect(() => {
    fetch(getApiUrl('/api/products')).then(r => r.json()).then(d => {
      console.log('Modo demo:', isDemoMode()); console.log('Productos recibidos:', d.data?.length)
      if (d.success && d.data && d.data.length > 0) {
        setProductos(d.data.map((p: any) => {
          let cat = (p.categoria || p.category || 'General')
          // Normalizar categorías
          const catMap: Record<string, string> = {
            'Panadería': 'Panadería', 'Panaderia': 'Panadería',
            'Pastelería': 'Pastelería', 'Pasteleria': 'Pastelería',
            'Bebidas': 'Bebidas',
            'Lácteos': 'Lácteos', 'Lacteos': 'Lácteos',
            'Tienda': 'Tienda',
            'Restaurante': 'Restaurante',
            'Ferretería': 'Ferretería', 'Ferreteria': 'Ferretería',
            'Carnicería': 'Carnicería', 'Carniceria': 'Carnicería',
            'Verduras': 'Verduras'
          }
          return {
            id: p.id, 
            nombre: p.nombre || p.name, 
            icono: p.icono || p.icon || '📦',
            precio: p.precio || p.price || 0, 
            precioPorKg: p.precioPorKg || 0,
            stock: p.stock || 0, 
            cat: catMap[cat] || cat,
            esPeso: p.esPeso || p.es_peso || false,
            unidad: p.unidad || 'unidad'
          }
        }))
      }
    }).catch((e) => console.error('Error cargando productos:', e))
  }, [])

  // Obtener todas las categorías únicas
  const allCats = ['Todo', ...new Set(productos.map(p => p.cat))].filter(Boolean)
  
  const searchFiltered = searchTerm ? productos.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase())) : productos
  const filtered = catFilter === 'Todo' ? searchFiltered : searchFiltered.filter(p => p.cat === catFilter)
  const totalItems = cart.reduce((s, i) => s + i.cantidad, 0)
  const totalPrecio = cart.reduce((s, i) => s + i.subtotal, 0)

  function addItem(p: ProductoBase) {
    if (p.esPeso) { setProductoPesaje(p); setPesoInput(''); return }
    setCart(prev => {
      const exist = prev.find(i => i.id === p.id)
      if (exist) return prev.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.precioUnitario || 0) * (i.cantidad + 1) } : i)
      return [...prev, { id: p.id, nombre: p.nombre, icono: p.icono, cantidad: 1, precioUnitario: p.precio || 0, subtotal: p.precio || 0, unidad: p.unidad }]
    })
  }

  function confirmarPeso() {
    if (!productoPesaje || !pesoInput) return
    const gramos = Number(pesoInput)
    const precioFinal = Math.round((gramos / 1000) * (productoPesaje.precioPorKg || 0))
    setCart(prev => [...prev, { 
      id: productoPesaje!.id + '-' + Date.now(), 
      nombre: productoPesaje!.nombre + ' (' + gramos + 'g)', 
      icono: productoPesaje!.icono, 
      cantidad: 1, 
      precioUnitario: precioFinal, 
      subtotal: precioFinal,
      unidad: 'g'
    }])
    setProductoPesaje(null); setPesoInput('')
  }

  function pay(m: string) {
    setMsg('✅ Cobrado: $' + totalPrecio.toLocaleString() + ' - ' + m + ' - Cliente: ' + cliente)
    setCart([]); setShowPay(false); setShowCart(false)
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      <header className="bg-white shadow-sm p-3 flex items-center gap-2 sticky top-0 z-20">
        <Link href="/" className="p-2 hover:bg-stone-100 rounded-xl shrink-0"><ArrowLeft className="w-5 h-5 text-stone-600" /></Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-stone-800 truncate">Nueva Venta</h1>
          <input 
            type="text" 
            value={cliente} 
            onChange={(e) => setCliente(e.target.value)}
            className="text-xs text-stone-500 bg-transparent border-b border-stone-300 w-full max-w-[200px] focus:border-emerald-500 outline-none"
            placeholder="Cliente"
          />
        </div>
        <button onClick={() => setShowCart(true)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 relative">
          <ShoppingCart className="w-5 h-5" />
          <span className="font-bold">{totalItems}</span>
          {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">${Math.round(totalPrecio/1000)}k</span>}
        </button>
      </header>

      {msg && <div className="bg-emerald-100 text-emerald-800 p-3 text-center font-bold animate-pulse">{msg}</div>}

      <div className="flex-1 p-3 overflow-y-auto">
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
          <div className="relative flex-1 min-w-[120px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar..." className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-sm" />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white">
            {allCats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {filtered.map(p => (
            <button key={p.id} onClick={() => addItem(p)} className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition border border-stone-200 text-left">
              <div className="text-2xl">{p.icono}</div>
              <div className="text-xs font-bold text-stone-800 truncate">{p.nombre}</div>
              <div className="text-[10px] text-stone-400">{p.cat}</div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm font-bold text-emerald-600">${p.precio?.toLocaleString()}</span>
                <span className="text-[9px] text-stone-400">{p.unidad}</span>
              </div>
              {p.stock !== undefined && p.stock < 5 && <div className="text-[9px] text-amber-500">⚠️ Stock: {p.stock}</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Modal Carrito */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-stone-800">🛒 Carrito</h2>
              <button onClick={() => setShowCart(false)} className="text-stone-400"><X className="w-6 h-6" /></button>
            </div>
            <div className="text-xs text-stone-400 mb-2">Cliente: {cliente}</div>
            {cart.length === 0 ? <p className="text-center text-stone-400 py-8">Carrito vacío</p> : (
              <div className="space-y-2">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b py-2">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-stone-800">{item.nombre}</span>
                      <span className="text-xs text-stone-400 ml-1">{item.unidad || ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => {
                        setCart(prev => prev.filter((_, i) => i !== idx))
                      }} className="text-red-400"><Minus className="w-4 h-4" /></button>
                      <span className="text-sm font-bold w-6 text-center">{item.cantidad}</span>
                      <button onClick={() => {
                        setCart(prev => prev.map((i, index) => index === idx ? { ...i, cantidad: i.cantidad + 1, subtotal: i.precioUnitario * (i.cantidad + 1) } : i))
                      }} className="text-emerald-500"><Plus className="w-4 h-4" /></button>
                      <span className="text-sm font-bold text-stone-800 w-16 text-right">${item.subtotal.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-4 border-t font-bold text-lg">
                  <span>Total</span>
                  <span className="text-emerald-600">${totalPrecio.toLocaleString()}</span>
                </div>
                <button onClick={() => { setShowCart(false); setShowPay(true) }} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold mt-4">
                  Cobrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Pago */}
      {showPay && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-center mb-2">💰 Cobrar</h2>
            <p className="text-3xl font-bold text-center text-emerald-600 mb-4">${totalPrecio.toLocaleString()}</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => pay('Efectivo')} className="bg-emerald-500 text-white py-3 rounded-xl font-bold">Efectivo</button>
              <button onClick={() => pay('Tarjeta Débito')} className="bg-blue-500 text-white py-3 rounded-xl font-bold">Débito</button>
              <button onClick={() => pay('Tarjeta Crédito')} className="bg-purple-500 text-white py-3 rounded-xl font-bold">Crédito</button>
              <button onClick={() => pay('Transferencia')} className="bg-amber-500 text-white py-3 rounded-xl font-bold">Transferencia</button>
            </div>
            <button onClick={() => setShowPay(false)} className="w-full mt-3 text-stone-400 py-2">Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal Pesaje */}
      {productoPesaje && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-center mb-2">⚖️ Pesar {productoPesaje.nombre}</h2>
            <p className="text-center text-stone-400 text-sm">Precio por kg: ${productoPesaje.precioPorKg?.toLocaleString()}</p>
            <input type="number" value={pesoInput} onChange={e => setPesoInput(e.target.value)} placeholder="Peso en gramos" className="w-full p-3 border rounded-xl text-center text-xl my-4" autoFocus />
            <div className="flex gap-3">
              <button onClick={confirmarPeso} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold">Agregar</button>
              <button onClick={() => { setProductoPesaje(null); setPesoInput('') }} className="px-4 py-3 border rounded-xl">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


