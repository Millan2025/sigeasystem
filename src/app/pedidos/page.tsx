'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Truck, MapPin, CheckCircle, User, Phone, Search, X, Navigation, Ban } from 'lucide-react'

interface Pedido {
  id: string; cliente?: string; customer_name?: string; direccion_entrega?: string;
  total: number; status: string; created_at: string; repartidor?: string; items?: string; telefono?: string;
}

const repartidores = ['Juan Pérez', 'Carlos Gómez']

export default function PedidosPage() {
  const [tab, setTab] = useState<'pendientes'|'camino'|'entregados'>('pendientes')
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [showAsignar, setShowAsignar] = useState<string | null>(null)
  const [repartidorSel, setRepartidorSel] = useState('')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => { fetch('/api/orders').then(r => r.json()).then(d => { if (d.success) setPedidos(d.data || []) }).catch(() => {}) }, [])

  const pendientes = pedidos.filter(p => p.status === 'pending_payment' || p.status === 'pending')
  const enCamino = pedidos.filter(p => p.status === 'in_transit' || p.status === 'en_camino')
  const entregados = pedidos.filter(p => p.status === 'delivered' || p.status === 'entregado')
  const filtrados = (tab === 'pendientes' ? pendientes : tab === 'camino' ? enCamino : entregados).filter(p => !busqueda || (p.cliente || p.customer_name || '').toLowerCase().includes(busqueda.toLowerCase()))

  function asignarRepartidor(orderId: string) {
    if (!repartidorSel) return
    setPedidos(prev => prev.map(p => p.id === orderId ? { ...p, status: 'en_camino', repartidor: repartidorSel } : p))
    setShowAsignar(null); setRepartidorSel('')
  }

  function verRuta(dir: string) { window.open('https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(dir || ''), '_blank') }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3 mb-3"><Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link><div className="flex-1"><h1 className="text-xl font-bold">Pedidos</h1></div></div>
        <div className="flex gap-2 mb-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" /><input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/10 text-white text-sm" /></div></div>
        <div className="flex gap-1 bg-stone-700 rounded-xl p-1">
          <button onClick={() => setTab('pendientes')} className={'flex-1 py-1.5 rounded-lg text-xs font-medium ' + (tab === 'pendientes' ? 'bg-white text-stone-800' : 'text-stone-300')}>Pendientes ({pendientes.length})</button>
          <button onClick={() => setTab('camino')} className={'flex-1 py-1.5 rounded-lg text-xs font-medium ' + (tab === 'camino' ? 'bg-white text-stone-800' : 'text-stone-300')}>En Camino ({enCamino.length})</button>
          <button onClick={() => setTab('entregados')} className={'flex-1 py-1.5 rounded-lg text-xs font-medium ' + (tab === 'entregados' ? 'bg-white text-stone-800' : 'text-stone-300')}>Entregados ({entregados.length})</button>
        </div>
      </header>
      <div className="p-4 space-y-3">
        {filtrados.map(p => (
          <div key={p.id} className="bg-white rounded-2xl p-4 border">
            <div className="flex justify-between items-start mb-2"><div><h3 className="font-bold text-stone-900">#{p.id?.slice(-6)} - {p.cliente || p.customer_name || 'Cliente'}</h3><p className="text-xs text-stone-400">{new Date(p.created_at).toLocaleString()}</p></div><span className={'px-2 py-1 rounded-full text-xs font-bold ' + (p.status.includes('pending') ? 'bg-amber-100 text-amber-700' : p.status.includes('transit') || p.status.includes('camino') ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700')}>{p.status.includes('pending') ? 'Pendiente' : p.status.includes('transit') || p.status.includes('camino') ? 'En Camino' : 'Entregado'}</span></div>
            <p className="text-sm text-stone-600 mb-2">{p.items || 'Productos'}</p>
            <div className="flex items-center gap-2 text-sm text-stone-500 mb-2"><MapPin className="w-4 h-4 text-red-400" />{p.direccion_entrega || 'Sin dirección'}<button onClick={() => verRuta(p.direccion_entrega || '')} className="text-sky-500 text-xs ml-auto"><Navigation className="w-3 h-3 inline" /> Ver ruta</button></div>
            <div className="flex justify-between items-center pt-2 border-t"><p className="text-lg font-bold text-emerald-600">${Number(p.total).toLocaleString()}</p>
              {p.status.includes('pending') && <button onClick={() => setShowAsignar(p.id)} className="bg-sky-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium"><User className="w-3 h-3 inline mr-1" />Asignar</button>}
              {p.status.includes('transit') || p.status.includes('camino') ? <span className="text-sm text-sky-600"><Truck className="w-4 h-4 inline" /> {p.repartidor || 'Repartidor'}</span> : null}
            </div>
          </div>
        ))}
      </div>
      {showAsignar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAsignar(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}><h2 className="font-bold text-xl mb-4">Asignar Repartidor</h2>{repartidores.map(r => <button key={r} onClick={() => setRepartidorSel(r)} className={'w-full p-3 rounded-xl mb-2 text-left font-medium border-2 ' + (repartidorSel === r ? 'border-sky-500 bg-sky-50' : 'border-stone-200')}>🛵 {r}</button>)}<div className="flex gap-3 mt-4"><button onClick={() => setShowAsignar(null)} className="flex-1 bg-stone-200 py-3 rounded-xl font-bold">Cancelar</button><button onClick={() => asignarRepartidor(showAsignar!)} disabled={!repartidorSel} className="flex-1 bg-sky-500 text-white py-3 rounded-xl font-bold disabled:opacity-30">Asignar</button></div></div>
        </div>
      )}
    </div>
  )
}
