'use client'

import { useState } from 'react'
import { ShoppingCart, Minus, Plus, Trash2, ArrowLeft, X, Scale } from 'lucide-react'
import Link from 'next/link'

interface ProductoBase {
  id: string; nombre: string; icono: string; stock: number; cat: string; esPeso: boolean;
  precio?: number; precioPorKg?: number; keywords?: string[];
}

interface CartItem {
  id: string; nombre: string; icono: string; cantidad: number; precioUnitario: number; subtotal: number;
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

  useState(() => {
    fetch('/api/products').then(r => r.json()).then(d => {
      if (d.success && d.data.length > 0) {
        setProductos(d.data.map((p: any) => ({
          id: p.id, nombre: p.nombre || p.name, icono: p.icono || '📦',
          precio: p.precio || p.price || 0, precioPorKg: p.precioPorKg,
          stock: p.stock || 0, cat: p.categoria || p.category || 'General',
          esPeso: p.esPeso || false, keywords: [(p.nombre || '').toLowerCase()]
        })))
      }
    }).catch(() => {})
  }, [])

  const cats = ['Todo', 'Panadería', 'Pastelería', 'Bebidas', 'Lácteos', 'Verduras']
  const searchFiltered = searchTerm ? productos.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase())) : productos
  const filtered = catFilter === 'Todo' ? searchFiltered : searchFiltered.filter(p => p.cat === catFilter)
  const totalItems = cart.reduce((s, i) => s + i.cantidad, 0)
  const totalPrecio = cart.reduce((s, i) => s + i.subtotal, 0)

  function addItem(p: ProductoBase) {
    if (p.esPeso) { setProductoPesaje(p); setPesoInput(''); return }
    setCart(prev => {
      const exist = prev.find(i => i.id === p.id)
      if (exist) return prev.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.precioUnitario || 0) * (i.cantidad + 1) } : i)
      return [...prev, { id: p.id, nombre: p.nombre, icono: p.icono, cantidad: 1, precioUnitario: p.precio || 0, subtotal: p.precio || 0 }]
    })
    setMsg('Agregado: ' + p.nombre)
    setTimeout(() => setMsg(''), 1500)
  }

  function confirmarPeso() {
    if (!productoPesaje || !pesoInput) return
    const gramos = Number(pesoInput)
    const precioFinal = Math.round((gramos / 1000) * (productoPesaje.precioPorKg || 0))
    setCart(prev => [...prev, { id: productoPesaje!.id + '-' + Date.now(), nombre: productoPesaje!.nombre + ' (' + gramos + 'g)', icono: productoPesaje!.icono, cantidad: 1, precioUnitario: precioFinal, subtotal: precioFinal }])
    setProductoPesaje(null); setPesoInput('')
  }

  function pay(m: string) {
    setMsg('Cobrado: $' + totalPrecio.toLocaleString() + ' - ' + m)
    setCart([]); setShowPay(false); setShowCart(false)
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      <header className="bg-white shadow-sm p-3 flex items-center gap-2 sticky top-0 z-20">
        <Link href="/" className="p-2 hover:bg-stone-100 rounded-xl shrink-0"><ArrowLeft className="w-5 h-5 text-stone-600" /></Link>
        <div className="flex-1 min-w-0"><h1 className="font-bold text-stone-800 truncate">Nueva Venta</h1></div>
        <button onClick={() => setShowCart(true)} className="relative bg-emerald-500 text-white px-4 py-2 rounded-xl font-medium text-sm">🛒 {totalItems} · ${totalPrecio.toLocaleString()}</button>
      </header>

      {msg && <div className="px-4 py-2 text-sm font-medium bg-emerald-100 text-emerald-800">{msg}</div>}

      <div className="px-3 pt-2">
        <input type="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar producto..." className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 outline-none" />
      </div>

      <div className="flex gap-1 p-2 overflow-x-auto bg-white border-b shrink-0">
        {cats.map(c => <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${catFilter === c ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600'}`}>{c}</button>)}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-2">
          {filtered.map(p => (
            <button key={p.id} onClick={() => addItem(p)} className="bg-white rounded-xl p-2 shadow-sm border border-stone-200 active:scale-95 transition text-left">
              <span className="text-3xl block text-center mb-1">{p.icono}</span>
              <h3 className="font-medium text-stone-800 text-xs leading-tight line-clamp-2">{p.nombre}</h3>
              <p className="text-emerald-600 font-bold text-sm mt-1">{p.esPeso ? '$' + (p.precioPorKg || 0).toLocaleString() + '/kg' : '$' + (p.precio || 0).toLocaleString()}</p>
              {p.esPeso && <span className="text-[10px] text-amber-500 flex items-center gap-0.5"><Scale className="w-2.5 h-2.5" />gramos</span>}
            </button>
          ))}
        </div>
      </div>

      {cart.length > 0 && (
        <div className="bg-white border-t p-3 shrink-0">
          <button onClick={() => setShowPay(true)} className="w-full bg-emerald-500 text-white rounded-2xl py-4 font-bold text-lg hover:bg-emerald-600 transition shadow-lg">💰 Cobrar ${totalPrecio.toLocaleString()}</button>
        </div>
      )}

      {productoPesaje && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setProductoPesaje(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-xl mb-1 text-stone-900">{productoPesaje.icono} {productoPesaje.nombre}</h3>
            <p className="text-stone-700 mb-4 font-medium">${(productoPesaje.precioPorKg || 0).toLocaleString()} / kilogramo</p>
            <input type="number" value={pesoInput} onChange={e => setPesoInput(e.target.value)} placeholder="0" className="w-full p-5 text-5xl text-center font-bold bg-stone-50 rounded-2xl mb-4 border-4 border-amber-400 outline-none text-stone-800" autoFocus />
            <p className="text-center text-stone-400 text-sm mb-4">Ingresa los gramos</p>
            {pesoInput && Number(pesoInput) > 0 && (
              <div className="bg-emerald-50 rounded-2xl p-4 text-center mb-4">
                <p className="text-sm text-emerald-600">Precio calculado</p>
                <p className="text-4xl font-bold text-emerald-700">${Math.round((Number(pesoInput) / 1000) * (productoPesaje.precioPorKg || 0)).toLocaleString()}</p>
              </div>
            )}
            <div className="flex gap-3"><button onClick={() => setProductoPesaje(null)} className="flex-1 bg-stone-200 py-3 rounded-xl font-bold text-stone-700 text-lg">Cancelar</button><button onClick={confirmarPeso} disabled={!pesoInput || Number(pesoInput) <= 0} className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold text-lg disabled:opacity-30">Agregar</button></div>
          </div>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center md:justify-center" onClick={() => setShowCart(false)}>
          <div className="bg-white w-full md:max-w-lg md:rounded-3xl rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-xl text-stone-900">Carrito ({totalItems} items)</h2><button onClick={() => setShowCart(false)} className="p-2 hover:bg-stone-100 rounded-xl"><X className="w-5 h-5 text-stone-800" /></button></div>
            {cart.map(i => (
              <div key={i.id} className="flex items-center justify-between py-3 border-b border-stone-100 gap-2">
                <span className="text-sm flex-1 font-medium text-stone-900 truncate">{i.icono} {i.nombre}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setCart(prev => prev.map(x => x.id === i.id ? { ...x, cantidad: Math.max(1, x.cantidad - 1), subtotal: x.precioUnitario * Math.max(1, x.cantidad - 1) } : x))} className="p-1.5 bg-stone-100 rounded-lg"><Minus className="w-4 h-4 text-stone-800" /></button>
                  <span className="w-7 text-center font-bold text-stone-900">{i.cantidad}</span>
                  <button onClick={() => setCart(prev => prev.map(x => x.id === i.id ? { ...x, cantidad: x.cantidad + 1, subtotal: x.precioUnitario * (x.cantidad + 1) } : x))} className="p-1.5 bg-stone-100 rounded-lg"><Plus className="w-4 h-4 text-stone-800" /></button>
                  <button onClick={() => setCart(prev => prev.filter(x => x.id !== i.id))} className="p-1.5 text-red-500 ml-1"><Trash2 className="w-4 h-4" /></button>
                </div>
                <span className="w-24 text-right font-bold text-emerald-600 text-base shrink-0">${i.subtotal.toLocaleString()}</span>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t-2 border-stone-200"><p className="text-right text-2xl font-bold text-stone-900">Total: <span className="text-emerald-600">${totalPrecio.toLocaleString()}</span></p><button onClick={() => { setShowCart(false); setShowPay(true) }} className="w-full bg-emerald-500 text-white rounded-2xl py-4 font-bold text-lg mt-3">💰 Cobrar</button></div>
          </div>
        </div>
      )}

      {showPay && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center md:justify-center" onClick={() => setShowPay(false)}>
          <div className="bg-white w-full md:max-w-sm md:rounded-3xl rounded-t-3xl p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-xl mb-3 text-stone-900">Metodo de pago</h2>
            <p className="text-stone-700 mb-4 font-medium">Total: <span className="text-emerald-600 font-bold text-2xl">${totalPrecio.toLocaleString()}</span></p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <button onClick={() => pay('Efectivo')} className="bg-emerald-500 text-white rounded-2xl py-5 font-bold text-base hover:bg-emerald-600">Efectivo</button>
              <button onClick={() => pay('Nequi')} className="bg-purple-500 text-white rounded-2xl py-5 font-bold text-base hover:bg-purple-600">Nequi</button>
              <button onClick={() => pay('Daviplata')} className="bg-red-500 text-white rounded-2xl py-5 font-bold text-base hover:bg-red-600">Daviplata</button>
            </div>
            <button onClick={() => setShowPay(false)} className="w-full py-3 text-stone-500 font-medium">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}
