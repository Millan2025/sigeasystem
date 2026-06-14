'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Truck, MapPin, CheckCircle, User, Phone, Clock, Search, X, Navigation, Ban } from 'lucide-react'

const pedidosDemo = [
  { id: 'ORD-001', cliente: 'Ana García', telefono: '3124567890', direccion: 'Calle 45 #23-12, La Paz', total: 25000, estado: 'pendiente', hora: '10:30 AM', items: 'Pan Aliñado x2, Café x1', estimado: '30 min' },
  { id: 'ORD-002', cliente: 'Pedro López', telefono: '3156789012', direccion: 'Carrera 12 #34-56, Centro', total: 35000, estado: 'en_camino', hora: '10:15 AM', repartidor: 'Juan Pérez', items: 'Torta x1, Jugo x2', estimado: '15 min' },
  { id: 'ORD-003', cliente: 'María Rodríguez', telefono: '3189012345', direccion: 'Calle 78 #90-12, Norte', total: 18000, estado: 'entregado', hora: '09:50 AM', repartidor: 'Juan Pérez', items: 'Croissant x3, Café x2', estimado: '20 min' },
  { id: 'ORD-004', cliente: 'Luis Martínez', telefono: '3201234567', direccion: 'Diagonal 23 #45-67, Sur', total: 42000, estado: 'pendiente', hora: '11:00 AM', items: 'Pan Aliñado x4, Queso 500g, Jugo x3', estimado: '35 min' },
  { id: 'ORD-005', cliente: 'Diana Torres', telefono: '3145678901', direccion: 'Calle 100 #15-20, Norte', total: 15000, estado: 'pendiente', hora: '11:15 AM', items: 'Café x3, Croissant x2', estimado: '25 min' },
]

const repartidores = ['Juan Pérez', 'Carlos Gómez']

export default function PedidosPage() {
  const [tab, setTab] = useState<'pendientes'|'camino'|'entregados'>('pendientes')
  const [showAsignar, setShowAsignar] = useState<string | null>(null)
  const [repartidorSel, setRepartidorSel] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [pedidos, setPedidos] = useState(pedidosDemo)
  const [showCancelar, setShowCancelar] = useState<string | null>(null)

  const pendientes = pedidos.filter(p => p.estado === 'pendiente')
  const enCamino = pedidos.filter(p => p.estado === 'en_camino')
  const entregados = pedidos.filter(p => p.estado === 'entregado')

  const filtrados = (tab === 'pendientes' ? pendientes : tab === 'camino' ? enCamino : entregados)
    .filter(p => !busqueda || p.cliente.toLowerCase().includes(busqueda.toLowerCase()) || p.direccion.toLowerCase().includes(busqueda.toLowerCase()) || p.id.toLowerCase().includes(busqueda.toLowerCase()))

  function asignarRepartidor(orderId: string) {
    if (!repartidorSel) return
    setPedidos(prev => prev.map(p => p.id === orderId ? { ...p, estado: 'en_camino', repartidor: repartidorSel } : p))
    setShowAsignar(null); setRepartidorSel('')
  }

  function cancelarPedido(orderId: string) {
    setPedidos(prev => prev.filter(p => p.id !== orderId))
    setShowCancelar(null)
  }

  function verRuta(direccion: string) {
    window.open('https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(direccion), '_blank')
  }

  function getEstadoColor(estado: string) {
    if (estado === 'pendiente') return 'bg-amber-100 text-amber-700 border-amber-300'
    if (estado === 'en_camino') return 'bg-sky-100 text-sky-700 border-sky-300'
    return 'bg-emerald-100 text-emerald-700 border-emerald-300'
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1"><h1 className="text-xl font-bold">Pedidos</h1><p className="text-stone-400 text-xs">Domicilios</p></div>
        </div>
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar pedido o cliente..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 text-white placeholder-white/50 text-sm border border-white/20" />
          </div>
        </div>
        <div className="flex gap-1 bg-stone-700 rounded-xl p-1">
          <button onClick={() => setTab('pendientes')} className={'flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ' + (tab === 'pendientes' ? 'bg-white text-stone-800' : 'text-stone-300')}>
            Pendientes <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{pendientes.length}</span>
          </button>
          <button onClick={() => setTab('camino')} className={'flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ' + (tab === 'camino' ? 'bg-white text-stone-800' : 'text-stone-300')}>
            En Camino <span className="bg-sky-500 text-white text-xs px-2 py-0.5 rounded-full">{enCamino.length}</span>
          </button>
          <button onClick={() => setTab('entregados')} className={'flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ' + (tab === 'entregados' ? 'bg-white text-stone-800' : 'text-stone-300')}>
            Entregados <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">{entregados.length}</span>
          </button>
        </div>
      </header>

      <div className="p-4 space-y-3">
        {filtrados.length === 0 && <p className="text-center text-stone-400 py-8">No hay pedidos {tab === 'pendientes' ? 'pendientes' : tab === 'camino' ? 'en camino' : 'entregados'}</p>}
        {filtrados.map(p => (
          <div key={p.id} className={'bg-white rounded-2xl p-4 border-2 ' + getEstadoColor(p.estado)}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-stone-900">{p.id} - {p.cliente}</h3>
                <p className="text-xs text-stone-400">{p.hora} • ⏱️ {p.estimado}</p>
              </div>
              <span className={'px-3 py-1 rounded-full text-xs font-bold border ' + getEstadoColor(p.estado)}>
                {p.estado === 'pendiente' ? 'Pendiente' : p.estado === 'en_camino' ? 'En Camino' : 'Entregado'}
              </span>
            </div>

            <p className="text-sm text-stone-700 mb-3 font-medium">{p.items}</p>

            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-sm text-stone-600">
                <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                <span>{p.direccion}</span>
                <button onClick={() => verRuta(p.direccion)} className="text-sky-500 text-xs font-medium hover:underline shrink-0 ml-auto flex items-center gap-1"><Navigation className="w-3 h-3" /> Ver ruta</button>
              </div>
              <div className="flex items-center gap-2 text-sm text-stone-600">
                <Phone className="w-4 h-4 text-green-400 shrink-0" />
                <span>{p.telefono}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-stone-100">
              <p className="text-xl font-bold text-emerald-600">${p.total.toLocaleString()}</p>
              
              <div className="flex gap-2">
                {p.estado === 'pendiente' && (
                  <>
                    <button onClick={() => setShowCancelar(p.id)} className="bg-stone-100 hover:bg-red-50 text-stone-500 hover:text-red-500 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1"><Ban className="w-3 h-3" /> Cancelar</button>
                    <button onClick={() => setShowAsignar(p.id)} className="bg-sky-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"><User className="w-4 h-4" /> Asignar</button>
                  </>
                )}
                {p.estado === 'en_camino' && (
                  <span className="text-sm text-sky-600 font-medium flex items-center gap-1"><Truck className="w-4 h-4" /> {p.repartidor}</span>
                )}
                {p.estado === 'entregado' && (
                  <span className="text-emerald-600 font-medium flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Entregado</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL ASIGNAR */}
      {showAsignar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAsignar(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-xl text-stone-900">Asignar Repartidor</h2><button onClick={() => setShowAsignar(null)} className="p-2 hover:bg-stone-100 rounded-xl"><X className="w-5 h-5 text-stone-600" /></button></div>
            <p className="text-sm text-stone-500 mb-4">Pedido: {showAsignar}</p>
            <div className="space-y-2 mb-4">
              {repartidores.map(r => (
                <button key={r} onClick={() => setRepartidorSel(r)} className={'w-full p-4 rounded-xl text-left font-medium transition border-2 ' + (repartidorSel === r ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300')}>
                  🛵 {r}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAsignar(null)} className="flex-1 bg-stone-200 py-3 rounded-xl font-bold text-stone-700">Cancelar</button>
              <button onClick={() => asignarRepartidor(showAsignar)} disabled={!repartidorSel} className="flex-1 bg-sky-500 text-white py-3 rounded-xl font-bold disabled:opacity-30">Asignar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CANCELAR */}
      {showCancelar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCancelar(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-xl text-stone-900 mb-3">Cancelar Pedido</h2>
            <p className="text-stone-500 mb-4">Estas seguro de cancelar el pedido {showCancelar}?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelar(null)} className="flex-1 bg-stone-200 py-3 rounded-xl font-bold text-stone-700">Volver</button>
              <button onClick={() => cancelarPedido(showCancelar!)} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold">Cancelar Pedido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


