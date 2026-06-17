'use client'

import { useState } from 'react'
import { ShoppingCart, Minus, Plus, Trash2, ArrowLeft, X, Mic, Scale } from 'lucide-react'
import Link from 'next/link'

interface ProductoBase {
  id: string; nombre: string; icono: string; stock: number; cat: string; esPeso: boolean;
  precio?: number; precioPorKg?: number; keywords?: string[];
}

interface CartItem {
  id: string; nombre: string; icono: string; cantidad: number; precioUnitario: number; subtotal: number;
}

const productos: ProductoBase[] = [
  { id: 'p1', nombre: 'Pan Aliñado Familiar', precio: 5000, icono: '🍞', stock: 15, cat: 'Panadería', esPeso: false, keywords: ['pan', 'aliñado'] },
  { id: 'p2', nombre: 'Torta Tres Leches', precio: 7500, icono: '🍰', stock: 8, cat: 'Pastelería', esPeso: false, keywords: ['torta', 'leches'] },
  { id: 'p3', nombre: 'Croissant', precio: 3200, icono: '🥐', stock: 12, cat: 'Panadería', esPeso: false, keywords: ['croissant'] },
  { id: 'p4', nombre: 'Café Tinto 7oz', precio: 1800, icono: '☕', stock: 100, cat: 'Bebidas', esPeso: false, keywords: ['cafe', 'café', 'tinto'] },
  { id: 'p5', nombre: 'Coca-Cola 350ml', precio: 3500, icono: '🥤', stock: 48, cat: 'Bebidas', esPeso: false, keywords: ['coca', 'cola', 'gaseosa'] },
  { id: 'p6', nombre: 'Jugo Natural', precio: 4000, icono: '🧃', stock: 20, cat: 'Bebidas', esPeso: false, keywords: ['jugo', 'natural'] },
  { id: 'p7', nombre: 'Queso Campesino', precioPorKg: 28000, icono: '🧀', stock: 5, cat: 'Lácteos', esPeso: true, keywords: ['queso', 'campesino'] },
  { id: 'p8', nombre: 'Tomate Chonto', precioPorKg: 5000, icono: '🍅', stock: 10, cat: 'Verduras', esPeso: true, keywords: ['tomate', 'chonto'] },
  { id: 'p9', nombre: 'Aguacate Hass', precioPorKg: 8000, icono: '🥑', stock: 15, cat: 'Verduras', esPeso: true, keywords: ['aguacate', 'hass', 'palta'] },
]

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const [msg, setMsg] = useState('')
  const [catFilter, setCatFilter] = useState('Todo'); const [searchTerm, setSearchTerm] = useState('')
  const [listening, setListening] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [productoPesaje, setProductoPesaje] = useState<ProductoBase | null>(null)
  const [pesoInput, setPesoInput] = useState('')

  const cats = ['Todo', 'Panadería', 'Pastelería', 'Bebidas', 'Lácteos', 'Verduras']
  const searchFiltered = searchTerm ? productos.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase())) : productos; const filtered = catFilter === 'Todo' ? searchFiltered : searchFiltered.filter(p => p.cat === catFilter)
  const totalItems = cart.reduce((s, i) => s + i.cantidad, 0)
  const totalPrecio = cart.reduce((s, i) => s + i.subtotal, 0)

  function addItem(p: ProductoBase) {
    if (p.esPeso) { setProductoPesaje(p); setPesoInput(''); return }
    setCart(prev => {
      const exist = prev.find(i => i.id === p.id)
      if (exist) return prev.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.precioUnitario || 0) * (i.cantidad + 1) } : i)
      return [...prev, { id: p.id, nombre: p.nombre, icono: p.icono, cantidad: 1, precioUnitario: p.precio || 0, subtotal: p.precio || 0 }]
    })
    setMsg('✓ ' + p.nombre)
    setTimeout(() => setMsg(''), 1000)
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
      subtotal: precioFinal 
    }])
    setMsg('✓ ' + productoPesaje!.nombre + ' ' + gramos + 'g = $' + precioFinal.toLocaleString())
    setProductoPesaje(null); setPesoInput('')
    setTimeout(() => setMsg(''), 2000)
  }

  function pay(m: string) {
    setMsg('✅ Cobrado: $' + totalPrecio.toLocaleString() + ' - ' + m)
    setCart([]); setShowPay(false); setShowCart(false)
    setTimeout(() => setMsg(''), 3000)
  }

  function startVoice() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { setMsg('Usa Chrome para voz'); setTimeout(() => setMsg(''), 3000); return }
    const recognition = new SpeechRecognition()
    recognition.lang = 'es-CO'; recognition.continuous = false
    recognition.onresult = (event: any) => {
      const texto = event.results[0][0].transcript.toLowerCase().trim()
      setVoiceText(texto); procesarVoz(texto); setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognition.start(); setListening(true)
  }

  function procesarVoz(texto: string) {
    const partes = texto.split(/,| y /)
    let count = 0
    partes.forEach(parte => {
      parte = parte.trim(); if (!parte) return
      const match = parte.match(/(\d+|[un]na?)\s*(?:de\s+)?(.+)/)
      if (!match) return
      let cantidad = 1
      if (match[1] === 'un' || match[1] === 'una') cantidad = 1
      else if (!isNaN(Number(match[1]))) cantidad = Number(match[1])
      const nombreBuscar = match[2].trim()
      const prod = productos.find(p => (p.keywords || []).some(k => nombreBuscar.includes(k)))
      if (!prod) return
      if (prod.esPeso) { setProductoPesaje(prod); setPesoInput(String(cantidad)); return }
      const price = prod.precio || 0
      setCart(prev => {
        const exist = prev.find(i => i.id === prod.id)
        if (exist) return prev.map(i => i.id === prod.id ? { ...i, cantidad: i.cantidad + cantidad, subtotal: price * (i.cantidad + cantidad) } : i)
        return [...prev, { id: prod.id, nombre: prod.nombre, icono: prod.icono, cantidad, precioUnitario: price, subtotal: price * cantidad }]
      })
      count += cantidad
    })
    if (count > 0) setMsg('✓ ' + count + ' items por voz')
    setTimeout(() => setMsg(''), 2000)
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* HEADER FIJO */}
      <header className="bg-white shadow-sm p-3 flex items-center gap-2 sticky top-0 z-20">
        <Link href="/" className="p-2 hover:bg-stone-100 rounded-xl shrink-0"><ArrowLeft className="w-5 h-5 text-stone-600" /></Link>
        <div className="flex-1 min-w-0"><h1 className="font-bold text-stone-800 truncate">Nueva Venta</h1></div>
        <button onClick={startVoice} className={`shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl font-medium text-sm text-white ${listening ? 'bg-red-500 animate-pulse' : 'bg-sky-500'}`}>
          <Mic className="w-4 h-4" />{listening ? '' : 'Voz'}
        </button>
      </header>

      {/* BARRA DE CARRITO - SIEMPRE VISIBLE */}
      {cart.length > 0 && (
        <div className="bg-emerald-500 text-white px-4 py-2 flex items-center justify-between cursor-pointer sticky top-[57px] z-10" onClick={() => setShowCart(true)}>
          <span className="font-bold">🛒 {totalItems} items</span>
          <span className="font-bold text-lg">${totalPrecio.toLocaleString()}</span>
          <span className="text-xs bg-white text-emerald-600 px-2 py-1 rounded-full font-bold">Ver</span>
        </div>
      )}

      {/* MENSAJES */}
      {voiceText && <div className="px-4 py-1 bg-sky-50 text-sky-700 text-sm italic">🎤 "{voiceText}"</div>}
      {msg && <div className={`px-4 py-2 text-sm font-medium ${msg.startsWith('✅') ? 'bg-emerald-500 text-white' : msg.startsWith('✓') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{msg}</div>}

      {/* CATEGORÍAS */}
      <div className="flex gap-1 p-2 overflow-x-auto bg-white border-b shrink-0">
        {cats.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${catFilter === c ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600'}`}>{c}</button>
        ))}
      </div>

      {/* PRODUCTOS - SCROLL VERTICAL */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-2">
          {filtered.map(p => (
            <button key={p.id} onClick={() => addItem(p)} className="bg-white rounded-xl p-2 shadow-sm border border-stone-200 active:scale-95 transition text-left">
              <span className="text-3xl block text-center mb-1">{p.icono}</span>
              <h3 className="font-medium text-stone-800 text-xs leading-tight line-clamp-2">{p.nombre}</h3>
              <p className="text-emerald-600 font-bold text-sm mt-1">
                {p.esPeso ? '$' + (p.precioPorKg || 0).toLocaleString() + '/kg' : '$' + (p.precio || 0).toLocaleString()}
              </p>
              {p.esPeso && <span className="text-[10px] text-amber-500 flex items-center gap-0.5"><Scale className="w-2.5 h-2.5" />gramos</span>}
            </button>
          ))}
        </div>
      </div>

      {/* BOTÓN COBRAR - SIEMPRE VISIBLE */}
      {cart.length > 0 && (
        <div className="bg-white border-t p-3 shrink-0">
          <button onClick={() => setShowPay(true)} className="w-full bg-emerald-500 text-white rounded-2xl py-4 font-bold text-lg hover:bg-emerald-600 transition shadow-lg">
            💰 Cobrar ${totalPrecio.toLocaleString()}
          </button>
        </div>
      )}

      {/* MODAL PESAJE */}
      {productoPesaje && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setProductoPesaje(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-xl mb-1 text-stone-900">{productoPesaje.icono} {productoPesaje.nombre}</h3>
            <p className="text-stone-700 mb-4 font-medium">${(productoPesaje.precioPorKg || 0).toLocaleString()} / kilogramo</p>
            
            {/* INPUT GRANDE Y VISIBLE */}
            <input 
              type="number" 
              value={pesoInput} 
              onChange={e => setPesoInput(e.target.value)} 
              placeholder="0"
              className="w-full p-5 text-5xl text-center font-bold bg-stone-50 rounded-2xl mb-4 border-4 border-amber-400 focus:border-amber-500 outline-none text-stone-800" 
              autoFocus 
            />
            <p className="text-center text-stone-400 text-sm mb-4">Ingresa los gramos</p>
            
            {pesoInput && Number(pesoInput) > 0 && (
              <div className="bg-emerald-50 rounded-2xl p-4 text-center mb-4">
                <p className="text-sm text-emerald-600">Precio calculado</p>
                <p className="text-4xl font-bold text-emerald-700">${Math.round((Number(pesoInput) / 1000) * (productoPesaje.precioPorKg || 0)).toLocaleString()}</p>
                <p className="text-xs text-emerald-500 mt-1">{Number(pesoInput)}g × ${(productoPesaje.precioPorKg || 0).toLocaleString()}/kg</p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button onClick={() => setProductoPesaje(null)} className="flex-1 bg-stone-200 py-3 rounded-xl font-bold text-stone-700 text-lg hover:bg-stone-300">Cancelar</button>
              <button onClick={confirmarPeso} disabled={!pesoInput || Number(pesoInput) <= 0} className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold text-lg disabled:opacity-30 hover:bg-amber-600">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CARRITO */}
      {showCart && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center md:justify-center" onClick={() => setShowCart(false)}>
          <div className="bg-white w-full md:max-w-lg md:rounded-3xl rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2">
              <h2 className="font-bold text-xl text-stone-900 mb-0">🛒 Carrito ({totalItems} items)</h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-stone-100 rounded-xl"><X className="w-5 h-5 text-stone-800" /></button>
            </div>
            
            {cart.map(i => (
              <div key={i.id} className="py-3 border-b border-stone-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-stone-900">{i.icono} {i.nombre}</span>
                  <button onClick={() => setCart(prev => prev.filter(x => x.id !== i.id))} className="p-1 text-red-400 hover:bg-red-50 rounded-lg shrink-0 ml-2"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCart(prev => prev.map(x => x.id === i.id ? { ...x, cantidad: Math.max(1, x.cantidad - 1), subtotal: x.precioUnitario * Math.max(1, x.cantidad - 1) } : x))} className="p-2 bg-stone-200 rounded-lg hover:bg-stone-300"><Minus className="w-4 h-4 text-stone-800" /></button>
                    <span className="w-8 text-center font-bold text-stone-900 text-lg">{i.cantidad}</span>
                    <button onClick={() => setCart(prev => prev.map(x => x.id === i.id ? { ...x, cantidad: x.cantidad + 1, subtotal: x.precioUnitario * (x.cantidad + 1) } : x))} className="p-2 bg-stone-200 rounded-lg hover:bg-stone-300"><Plus className="w-4 h-4 text-stone-800" /></button>
                  </div>
                  <span className="font-bold text-emerald-600 text-lg">${i.subtotal.toLocaleString()}</span>
                </div>
              </div>
            ))}
            
            <div className="mt-4 pt-4 border-t-2 border-stone-200 sticky bottom-0 bg-white">
              <p className="text-right text-2xl font-bold text-stone-900">Total: <span className="text-emerald-600">${totalPrecio.toLocaleString()}</span></p>
              <button onClick={() => { setShowCart(false); setShowPay(true) }} className="w-full bg-emerald-500 text-white rounded-2xl py-4 font-bold text-lg mt-3">
                💰 Cobrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PAGO */}
      {showPay && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center md:justify-center" onClick={() => setShowPay(false)}>
          <div className="bg-white w-full md:max-w-sm md:rounded-3xl rounded-t-3xl p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-xl mb-3 text-stone-900">Método de pago</h2>
            <p className="text-stone-700 mb-4 font-medium">Total a cobrar: <span className="text-emerald-600 font-bold text-2xl">${totalPrecio.toLocaleString()}</span></p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <button onClick={() => pay('Efectivo')} className="bg-emerald-500 text-white rounded-2xl py-5 font-bold text-base hover:bg-emerald-600">💵<br/>Efectivo</button>
              <button onClick={() => pay('Nequi')} className="bg-purple-500 text-white rounded-2xl py-5 font-bold text-base hover:bg-purple-600">📱<br/>Nequi</button>
              <button onClick={() => pay('Daviplata')} className="bg-red-500 text-white rounded-2xl py-5 font-bold text-base hover:bg-red-600">🏧<br/>DAVIPLATA</button><button onClick={() => pay('Bancolombia')} className='bg-yellow-500 text-white rounded-2xl py-5 font-bold text-sm'>🏦<br/>BANCOLOMBIA</button>
            </div>
            <button onClick={() => setShowPay(false)} className="w-full py-3 text-stone-500 font-medium">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}







