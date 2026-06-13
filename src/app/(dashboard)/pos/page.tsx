'use client'

import { useState, useRef } from 'react'
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
  { id: 'p3', nombre: 'Croissant', precio: 3200, icono: '🥐', stock: 12, cat: 'Panadería', esPeso: false, keywords: ['croissant', 'cruasan'] },
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
  const [catFilter, setCatFilter] = useState('Todo')
  const [listening, setListening] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [productoPesaje, setProductoPesaje] = useState<ProductoBase | null>(null)
  const [pesoInput, setPesoInput] = useState('')
  const recognitionRef = useRef<any>(null)

  const cats = ['Todo', 'Panadería', 'Pastelería', 'Bebidas', 'Lácteos', 'Verduras']
  const filtered = catFilter === 'Todo' ? productos : productos.filter(p => p.cat === catFilter)
  const totalItems = cart.reduce((s, i) => s + i.cantidad, 0)
  const totalPrecio = cart.reduce((s, i) => s + i.subtotal, 0)

  function addItem(p: ProductoBase) {
    if (p.esPeso) { setProductoPesaje(p); setPesoInput(''); return }
    setCart(prev => {
      const exist = prev.find(i => i.id === p.id)
      if (exist) return prev.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.precioUnitario || 0) * (i.cantidad + 1) } : i)
      return [...prev, { id: p.id, nombre: p.nombre, icono: p.icono, cantidad: 1, precioUnitario: p.precio || 0, subtotal: p.precio || 0 }]
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
      subtotal: precioFinal 
    }])
    setProductoPesaje(null)
    setPesoInput('')
  }

  function pay(m: string) {
    setMsg('✅ Venta: $' + totalPrecio.toLocaleString() + ' - ' + m)
    setCart([])
    setShowPay(false)
    setShowCart(false)
    setTimeout(() => setMsg(''), 3000)
  }

  function startVoice() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { alert('Usa Chrome para dictado por voz'); return }
    
    const recognition = new SpeechRecognition()
    recognition.lang = 'es-CO'
    recognition.continuous = false
    
    recognition.onresult = (event: any) => {
      const texto = event.results[0][0].transcript.toLowerCase().trim()
      setVoiceText(texto)
      procesarVoz(texto)
      setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    
    recognition.start()
    setListening(true)
  }

  function procesarVoz(texto: string) {
    const partes = texto.split(/,| y /)
    let count = 0
    
    partes.forEach(parte => {
      parte = parte.trim()
      if (!parte) return
      
      // "2 panes", "500 de tomate", "un cafe", "2 aguacates"
      const match = parte.match(/(\d+|[un]na?)\s*(?:de\s+)?(.+)/)
      if (!match) return
      
      let cantidad = 1
      if (match[1] === 'un' || match[1] === 'una') cantidad = 1
      else if (!isNaN(Number(match[1]))) cantidad = Number(match[1])
      
      const nombreBuscar = match[2].trim()
      const prod = productos.find(p => (p.keywords || []).some(k => nombreBuscar.includes(k)))
      
      if (prod) {
        if (prod.esPeso) {
          // Producto por peso: "500 de tomate" = 500 gramos
          const gramos = cantidad > 100 ? cantidad : cantidad * 1000
          const precioFinal = Math.round((gramos / 1000) * (prod.precioPorKg || 0))
          setCart(prev => [...prev, {
            id: prod.id + '-' + Date.now(),
            nombre: prod.nombre + ' (' + gramos + 'g)',
            icono: prod.icono,
            cantidad: 1,
            precioUnitario: precioFinal,
            subtotal: precioFinal
          }])
          count++
        } else {
          // Producto por unidad: "2 panes" = 2 unidades
          const price = prod.precio || 0
          setCart(prev => {
            const exist = prev.find(i => i.id === prod.id)
            if (exist) return prev.map(i => i.id === prod.id ? { ...i, cantidad: i.cantidad + cantidad, subtotal: price * (i.cantidad + cantidad) } : i)
            return [...prev, { id: prod.id, nombre: prod.nombre, icono: prod.icono, cantidad, precioUnitario: price, subtotal: price * cantidad }]
          })
          count += cantidad
        }
      }
    })
    
    if (count > 0) setMsg('✅ ' + count + ' items agregados por voz')
    else setMsg('⚠️ No se encontró: "' + texto + '"')
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="min-h-screen bg-stone-100 md:max-w-2xl lg:max-w-4xl mx-auto">
      {/* Header */}
      <header className="bg-white shadow-sm p-3 flex items-center gap-2 sticky top-0 z-10">
        <Link href="/" className="p-2 hover:bg-stone-100 rounded-xl"><ArrowLeft className="w-5 h-5 text-stone-600" /></Link>
        <div className="flex-1"><h1 className="font-bold text-stone-800 text-lg">Punto de Venta</h1></div>
        <button onClick={startVoice} className={`flex items-center gap-1 px-3 py-2 rounded-xl font-medium text-sm text-white ${listening ? 'bg-red-500 animate-pulse' : 'bg-sky-500'}`}>
          <Mic className="w-4 h-4" />{listening ? '...' : 'Voz'}
        </button>
        <button onClick={() => setShowCart(true)} className="relative bg-emerald-500 text-white px-4 py-2 rounded-xl font-medium">
          🛒 {totalItems} · ${totalPrecio.toLocaleString()}
        </button>
      </header>

      {voiceText && <div className="mx-4 mt-2 p-2 bg-sky-50 rounded-xl text-sm text-sky-700">🎤 "{voiceText}"</div>}
      {msg && <div className={`mx-4 mt-2 p-2 rounded-xl text-sm ${msg.startsWith('✅') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{msg}</div>}

      {/* Categorías */}
      <div className="flex gap-2 p-3 overflow-x-auto">
        {cats.map(c => <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${catFilter === c ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 border'}`}>{c}</button>)}
      </div>

      {/* Productos - Grid responsive */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-3 pb-24">
        {filtered.map(p => (
          <button key={p.id} onClick={() => addItem(p)} className="bg-white rounded-2xl p-3 shadow-sm border border-stone-200 active:scale-95 transition text-left hover:shadow-md">
            <span className="text-4xl block text-center mb-2">{p.icono}</span>
            <h3 className="font-medium text-stone-800 text-sm leading-tight">{p.nombre}</h3>
            <p className="text-emerald-600 font-bold mt-1">
              {p.esPeso ? '$' + (p.precioPorKg || 0).toLocaleString() + '/kg' : '$' + (p.precio || 0).toLocaleString()}
            </p>
            {p.esPeso && <span className="text-xs text-amber-500 flex items-center gap-1 mt-1"><Scale className="w-3 h-3" /> Por peso</span>}
          </button>
        ))}
      </div>

      {/* Modal Pesaje */}
      {productoPesaje && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4" onClick={() => setProductoPesaje(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-xl mb-1">{productoPesaje.icono} {productoPesaje.nombre}</h3>
            <p className="text-stone-500 mb-4">${(productoPesaje.precioPorKg || 0).toLocaleString()} / kg</p>
            <input type="number" value={pesoInput} onChange={e => setPesoInput(e.target.value)} 
              placeholder="Gramos (ej: 300)" 
              className="w-full p-4 text-xl text-center bg-stone-100 rounded-2xl mb-4 border-2 border-stone-200 focus:border-amber-400 outline-none" autoFocus />
            {pesoInput && (
              <div className="bg-emerald-50 rounded-2xl p-4 text-center mb-4">
                <p className="text-sm text-emerald-600">Precio calculado</p>
                <p className="text-4xl font-bold text-emerald-700">${Math.round((Number(pesoInput) / 1000) * (productoPesaje.precioPorKg || 0)).toLocaleString()}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setProductoPesaje(null)} className="flex-1 bg-stone-100 py-3 rounded-xl font-medium text-stone-700">Cancelar</button>
              <button onClick={confirmarPeso} disabled={!pesoInput} className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold disabled:opacity-50">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Carrito */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-20 flex items-end" onClick={() => setShowCart(false)}>
          <div className="bg-white w-full max-w-lg lg:max-w-2xl mx-auto rounded-t-3xl p-5 max-h-[70vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl text-stone-800">🛒 Carrito ({totalItems} items)</h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-stone-100 rounded-xl"><X className="w-5 h-5 text-stone-500" /></button>
            </div>
            
            {cart.length === 0 ? (
              <p className="text-center text-stone-400 py-8">Carrito vacío</p>
            ) : (
              <>
                {cart.map(i => (
                  <div key={i.id} className="flex items-center justify-between py-3 border-b border-stone-100">
                    <span className="text-base flex-1 font-medium text-stone-800">{i.icono} {i.nombre}</span>
                    <div className="flex items-center gap-2 mx-3">
                      <button onClick={() => setCart(prev => prev.map(x => x.id === i.id ? { ...x, cantidad: Math.max(1, x.cantidad - 1), subtotal: x.precioUnitario * Math.max(1, x.cantidad - 1) } : x))} className="p-1.5 bg-stone-100 rounded-lg hover:bg-stone-200"><Minus className="w-4 h-4 text-stone-600" /></button>
                      <span className="w-8 text-center font-bold text-stone-800">{i.cantidad}</span>
                      <button onClick={() => setCart(prev => prev.map(x => x.id === i.id ? { ...x, cantidad: x.cantidad + 1, subtotal: x.precioUnitario * (x.cantidad + 1) } : x))} className="p-1.5 bg-stone-100 rounded-lg hover:bg-stone-200"><Plus className="w-4 h-4 text-stone-600" /></button>
                      <button onClick={() => setCart(prev => prev.filter(x => x.id !== i.id))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <span className="w-28 text-right font-bold text-emerald-600 text-base">${i.subtotal.toLocaleString()}</span>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t-2 border-stone-200">
                  <p className="text-right text-2xl font-bold text-stone-800">Total: <span className="text-emerald-600">${totalPrecio.toLocaleString()}</span></p>
                  <button onClick={() => { setShowCart(false); setShowPay(true) }} className="w-full bg-emerald-500 text-white rounded-2xl py-4 font-bold text-lg mt-3 hover:bg-emerald-600 transition">
                    💰 Cobrar ${totalPrecio.toLocaleString()}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Pago */}
      {showPay && (
        <div className="fixed inset-0 bg-black/50 z-20 flex items-end" onClick={() => setShowPay(false)}>
          <div className="bg-white w-full max-w-lg mx-auto rounded-t-3xl p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-xl text-stone-800 mb-3">Método de pago</h2>
            <p className="text-stone-500 mb-4">Total a cobrar: <span className="text-emerald-600 font-bold text-2xl">${totalPrecio.toLocaleString()}</span></p>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => pay('Efectivo')} className="bg-emerald-500 text-white rounded-2xl py-5 font-bold text-base hover:bg-emerald-600 transition">💵<br/>Efectivo</button>
              <button onClick={() => pay('Nequi')} className="bg-purple-500 text-white rounded-2xl py-5 font-bold text-base hover:bg-purple-600 transition">📱<br/>Nequi</button>
              <button onClick={() => pay('Daviplata')} className="bg-red-500 text-white rounded-2xl py-5 font-bold text-base hover:bg-red-600 transition">🏧<br/>Daviplata</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

