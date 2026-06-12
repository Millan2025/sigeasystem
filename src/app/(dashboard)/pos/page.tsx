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
  { id: 'p1', nombre: 'Pan AliÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±ado Familiar', precio: 5000, icono: 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚ÂÃƒâ€¦Ã‚Â¾', stock: 15, cat: 'Panaderia', esPeso: false, keywords: ['pan', 'aliÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±ado', 'familiar'] },
  { id: 'p2', nombre: 'Torta Tres Leches', precio: 7500, icono: 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚ÂÃƒâ€šÃ‚Â°', stock: 8, cat: 'Pasteleria', esPeso: false, keywords: ['torta', 'tres', 'leches', 'pastel'] },
  { id: 'p3', nombre: 'Croissant', precio: 3200, icono: 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â¥Ãƒâ€šÃ‚Â', stock: 12, cat: 'Panaderia', esPeso: false, keywords: ['croissant', 'cruasan', 'cruasan'] },
  { id: 'p4', nombre: 'Cafe Tinto 7oz', precio: 1800, icono: 'ÃƒÆ’Ã‚Â¢Ãƒâ€¹Ã…â€œÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢', stock: 100, cat: 'Bebidas', esPeso: false, keywords: ['cafe', 'tinto', 'cafÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©', 'tintico'] },
  { id: 'p5', nombre: 'Coca-Cola 350ml', precio: 3500, icono: 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â¥Ãƒâ€šÃ‚Â¤', stock: 48, cat: 'Bebidas', esPeso: false, keywords: ['coca', 'cola', 'cocacola', 'gaseosa'] },
  { id: 'p6', nombre: 'Jugo Natural', precio: 4000, icono: 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â§Ãƒâ€ Ã¢â‚¬â„¢', stock: 20, cat: 'Bebidas', esPeso: false, keywords: ['jugo', 'natural', 'zumo'] },
  { id: 'p7', nombre: 'Queso Campesino', precioPorKg: 28000, icono: 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â§ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬', stock: 5, cat: 'Lacteos', esPeso: true, keywords: ['queso', 'campesino', 'lacteo'] },
  { id: 'p8', nombre: 'Tomate Chonto', precioPorKg: 5000, icono: 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦', stock: 10, cat: 'Verduras', esPeso: true, keywords: ['tomate', 'chonto', 'verdura'] },
  { id: 'p9', nombre: 'Aguacate Hass', precioPorKg: 8000, icono: 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â¥ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“', stock: 15, cat: 'Verduras', esPeso: true, keywords: ['aguacate', 'hass', 'palta'] },
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

  const cats = ['Todo', 'Panaderia', 'Pasteleria', 'Bebidas', 'Lacteos', 'Verduras']
  const filtered = catFilter === 'Todo' ? productos : productos.filter(p => p.cat === catFilter)
  const totalItems = cart.reduce((s, i) => s + i.cantidad, 0)
  const totalPrecio = cart.reduce((s, i) => s + i.subtotal, 0)

  function agregarAlCarrito(p: ProductoBase) {
    if (p.esPeso) { setProductoPesaje(p); setPesoInput(''); return }
    setCart(function(prev: CartItem[]) {
      var exist = prev.find(function(i: CartItem) { return i.id === p.id })
      if (exist) {
        return prev.map(function(i: CartItem) { return i.id === p.id ? { ...i, cantidad: i.cantidad + 1, subtotal: i.precioUnitario * (i.cantidad + 1) } : i })
      }
      return [...prev, { id: p.id, nombre: p.nombre, icono: p.icono, cantidad: 1, precioUnitario: p.precio || 0, subtotal: p.precio || 0 }]
    })
    setMsg('ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ ' + p.nombre + ' agregado')
    setTimeout(function() { setMsg('') }, 1500)
  }

  function buscarProducto(nombreBuscar: string): ProductoBase | null {
    var buscar = nombreBuscar.toLowerCase().trim()
    var encontrado: ProductoBase | null = null
    
    encontrado = productos.find(function(p: ProductoBase) {
      return (p.keywords || []).some(function(k: string) { return buscar.includes(k) || k.includes(buscar) })
    }) || null

    if (!encontrado) {
      encontrado = productos.find(function(p: ProductoBase) {
        return p.nombre.toLowerCase().includes(buscar)
      }) || null
    }

    return encontrado
  }

  function confirmarPeso() {
    if (!productoPesaje || !pesoInput) return
    var gramos = Number(pesoInput)
    var precioFinal = Math.round((gramos / 1000) * (productoPesaje.precioPorKg || 0))
    setCart(function(prev: CartItem[]) {
      return [...prev, { id: productoPesaje!.id + '-' + Date.now(), nombre: productoPesaje!.nombre + ' (' + gramos + 'g)', icono: productoPesaje!.icono, cantidad: 1, precioUnitario: precioFinal, subtotal: precioFinal }]
    })
    setProductoPesaje(null); setPesoInput('')
  }

  function pay(m: string) {
    setMsg('ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Venta realizada: $' + totalPrecio.toLocaleString() + ' - ' + m)
    setCart([]); setShowPay(false); setShowCart(false)
    setTimeout(function() { setMsg('') }, 3000)
  }

  function startVoice() {
    var ua = navigator.userAgent
    var isChrome = /Chrome/i.test(ua) && !/Edge|OPR|Brave/i.test(ua)
    var isEdge = /Edg/i.test(ua)
    
    if (!isChrome && !isEdge) {
      setMsg('ðŸ“± El dictado por voz funciona en Chrome o Edge. Abre esta pagina en uno de esos navegadores para usar voz. Mientras tanto, agrega productos tocando los botones.')
      setTimeout(function() { setMsg('') }, 6000)
      return
    }
    if (listening) {
      if (recognitionRef.current) { recognitionRef.current.stop() }
      setListening(false)
      return
    }

    var SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || (window as any).mozSpeechRecognition || (window as any).msSpeechRecognition
    if (!SpeechRecognition) {
      setMsg('Ã¢Å¡Â Ã¯Â¸Â Voz solo disponible en Chrome. En Firefox/Safari usa los botones para agregar productos.')
      setTimeout(function() { setMsg('') }, 5000)
      return
    }

    var recognition = new SpeechRecognition()
    recognition.lang = 'es-CO'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = function(event: any) {
      var texto = event.results[0][0].transcript.toLowerCase().trim()
      setVoiceText(texto)
      procesarVoz(texto)
      setListening(false)
    }

    recognition.onerror = function(event: any) {
      setListening(false)
      if (event.error === 'not-allowed') {
        setMsg('ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Permiso de microfono denegado. Toca el candado ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ en la barra de direcciones y activa el microfono.')
      } else if (event.error === 'no-speech') {
        setMsg('ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â No se detecto voz. Intenta de nuevo.')
      } else {
        setMsg('ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Error: ' + event.error)
      }
      setTimeout(function() { setMsg('') }, 4000)
    }

    recognition.onend = function() {
      setListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
    setVoiceText('')
  }

  function procesarVoz(texto: string) {
    var itemsAgregados = 0
    var partes = texto.split(/,| y /)
    
    partes.forEach(function(parte: string) {
      parte = parte.trim()
      if (!parte) return
      
      var match = parte.match(/^(\d+|[un]na?)\s*(?:de\s+)?(.+?)(?:\s+de\s+(\d+))?$/)
      if (!match) return

      var cantidad = 1
      if (match[1] === 'un' || match[1] === 'una') cantidad = 1
      else if (!isNaN(Number(match[1]))) cantidad = Number(match[1])
      
      var nombreBuscar = match[2].trim()
      var prod = buscarProducto(nombreBuscar)

      if (prod) {
        if (prod.esPeso) {
          var gramos = match[3] ? Number(match[3]) : cantidad
          var pf = Math.round((gramos / 1000) * (prod.precioPorKg || 0))
          setCart(function(prev: CartItem[]) { 
            return [...prev, { id: prod!.id + '-' + Date.now(), nombre: prod!.nombre + ' (' + gramos + 'g)', icono: prod!.icono, cantidad: 1, precioUnitario: pf, subtotal: pf }] 
          })
          itemsAgregados++
        } else {
          for (var q = 0; q < cantidad; q++) {
            setCart(function(prev: CartItem[]) {
              var exist = prev.find(function(i: CartItem) { return i.id === prod!.id })
              if (exist) {
                return prev.map(function(i: CartItem) { return i.id === prod!.id ? { ...i, cantidad: i.cantidad + 1, subtotal: i.precioUnitario * (i.cantidad + 1) } : i })
              }
              return [...prev, { id: prod!.id, nombre: prod!.nombre, icono: prod!.icono, cantidad: 1, precioUnitario: prod!.precio || 0, subtotal: prod!.precio || 0 }]
            })
          }
          itemsAgregados += cantidad
        }
      }
    })

    if (itemsAgregados > 0) {
      setMsg('ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ ' + itemsAgregados + ' items agregados por voz')
    } else {
      setMsg('ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â No se encontro: "' + texto + '". Toca los productos para agregarlos.')
    }
    setTimeout(function() { setMsg('') }, 3000)
  }

  return (
    <div className="min-h-screen bg-stone-100 max-w-lg mx-auto">
      <header className="bg-white shadow-sm p-3 flex items-center gap-2 sticky top-0 z-10">
        <Link href="/" className="p-2 hover:bg-stone-100 rounded-xl"><ArrowLeft className="w-5 h-5 text-stone-600" /></Link>
        <div className="flex-1"><h1 className="font-bold text-stone-800 text-base">Punto de Venta</h1></div>
        <button onClick={startVoice} className={`flex items-center gap-1 px-3 py-2 rounded-xl font-medium text-sm text-white transition ${listening ? 'bg-red-500 animate-pulse' : 'bg-sky-500 hover:bg-sky-600'}`}>
          <Mic className="w-4 h-4" />{listening ? '...' : 'Voz'}
        </button>
        <button onClick={() => cart.length > 0 && setShowCart(true)} className="relative bg-emerald-500 text-white px-3 py-2 rounded-xl font-medium text-sm">
          <ShoppingCart className="w-4 h-4 inline mr-1" />{totalItems}
        </button>
      </header>
      {voiceText && <div className="mx-4 mt-2 p-2 bg-sky-50 rounded-xl text-sm text-sky-700 italic">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â½Ãƒâ€šÃ‚Â¤ &quot;{voiceText}&quot;</div>}
      {msg && <div className={`mx-4 mt-2 p-2 rounded-xl text-sm ${msg.startsWith('ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦') ? 'bg-emerald-100 text-emerald-800' : msg.startsWith('ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â') ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>{msg}</div>}

      <div className="flex gap-2 p-3 overflow-x-auto">
        {cats.map(c => <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${catFilter === c ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 border border-stone-200'}`}>{c}</button>)}
      </div>

      <div className="grid grid-cols-2 gap-3 px-3 pb-24">
        {filtered.map(p => (
          <button key={p.id} onClick={() => agregarAlCarrito(p)} className="bg-white rounded-2xl p-3 shadow-sm border border-stone-200 active:scale-95 transition text-left">
            <span className="text-4xl block text-center mb-1">{p.icono}</span>
            <h3 className="font-medium text-stone-800 text-xs leading-tight">{p.nombre}</h3>
            <div className="flex items-center justify-between mt-1">
              <p className="text-emerald-600 font-bold text-sm">{p.esPeso ? '$'+(p.precioPorKg||0).toLocaleString()+'/kg' : '$'+(p.precio||0).toLocaleString()}</p>
              {p.esPeso && <Scale className="w-3 h-3 text-amber-500" />}
            </div>
          </button>
        ))}
      </div>

      {productoPesaje && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4" onClick={() => setProductoPesaje(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <Scale className="w-8 h-8 text-amber-600 mb-2" />
            <h3 className="font-bold text-lg">{productoPesaje.nombre}</h3>
            <p className="text-sm text-stone-500 mb-4">${(productoPesaje.precioPorKg||0).toLocaleString()}/kg</p>
            <input type="number" value={pesoInput} onChange={e => setPesoInput(e.target.value)} placeholder="Peso en gramos (ej: 300)" className="w-full p-3 text-lg text-center bg-stone-100 rounded-2xl mb-3" autoFocus />
            {pesoInput && <div className="bg-emerald-50 rounded-2xl p-3 text-center mb-3"><p className="text-3xl font-bold text-emerald-700">${Math.round((Number(pesoInput)/1000)*(productoPesaje.precioPorKg||0)).toLocaleString()}</p></div>}
            <div className="flex gap-3">
              <button onClick={() => setProductoPesaje(null)} className="flex-1 bg-stone-100 py-3 rounded-xl font-medium">Cancelar</button>
              <button onClick={confirmarPeso} disabled={!pesoInput} className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold disabled:opacity-50">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-20 flex items-end" onClick={() => setShowCart(false)}>
          <div className="bg-white w-full rounded-t-3xl p-5 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-lg">Carrito ({totalItems} items)</h2><button onClick={() => setShowCart(false)} className="p-2"><X className="w-5 h-5" /></button></div>
            {cart.map(i => (
              <div key={i.id} className="flex items-center justify-between py-3 border-b border-stone-100">
                <span className="text-sm flex-1">{i.icono} {i.nombre}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCart((prev: CartItem[]) => prev.map((x: CartItem) => x.id === i.id ? { ...x, cantidad: Math.max(1, x.cantidad-1), subtotal: x.precioUnitario * Math.max(1, x.cantidad-1) } : x))} className="p-1.5 bg-stone-100 rounded-lg"><Minus className="w-3 h-3" /></button>
                  <span className="w-6 text-center text-sm font-medium">{i.cantidad}</span>
                  <button onClick={() => setCart((prev: CartItem[]) => prev.map((x: CartItem) => x.id === i.id ? { ...x, cantidad: x.cantidad+1, subtotal: x.precioUnitario * (x.cantidad+1) } : x))} className="p-1.5 bg-stone-100 rounded-lg"><Plus className="w-3 h-3" /></button>
                  <button onClick={() => setCart((prev: CartItem[]) => prev.filter((x: CartItem) => x.id !== i.id))} className="p-1.5 text-red-400"><Trash2 className="w-3 h-3" /></button>
                </div>
                <span className="w-20 text-right font-bold text-emerald-600 text-sm">${i.subtotal.toLocaleString()}</span>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-stone-200">
              <p className="text-right text-xl font-bold">Total: <span className="text-emerald-600">${totalPrecio.toLocaleString()}</span></p>
              <button onClick={() => {setShowCart(false); setShowPay(true)}} className="w-full bg-emerald-500 text-white rounded-2xl py-4 font-bold text-lg mt-3">Cobrar ${totalPrecio.toLocaleString()}</button>
            </div>
          </div>
        </div>
      )}

      {showPay && (
        <div className="fixed inset-0 bg-black/50 z-20 flex items-end" onClick={() => setShowPay(false)}>
          <div className="bg-white w-full rounded-t-3xl p-5" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-lg mb-3">Metodo de pago</h2>
            <p className="text-stone-500 mb-4">Total: <span className="text-emerald-600 font-bold text-xl">${totalPrecio.toLocaleString()}</span></p>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => pay('Efectivo')} className="bg-emerald-500 text-white rounded-2xl py-5 font-bold text-sm">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ãƒâ€šÃ‚Âµ<br/>EFECTIVO</button>
              <button onClick={() => pay('Nequi')} className="bg-purple-500 text-white rounded-2xl py-5 font-bold text-sm">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â±<br/>NEQUI</button>
              <button onClick={() => pay('Daviplata')} className="bg-red-500 text-white rounded-2xl py-5 font-bold text-sm">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚ÂÃƒâ€šÃ‚Â§<br/>DAVIPLATA</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
