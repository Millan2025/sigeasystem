'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, CheckCircle, Navigation, Phone } from 'lucide-react'

interface Pedido {
  id: string; cliente?: string; customer_name?: string; direccion_entrega?: string;
  total: number; status: string; telefono?: string; repartidor?: string;
}

export default function EntregasPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [pedidoActual, setPedidoActual] = useState<Pedido | null>(null)
  const [entregado, setEntregado] = useState(false)

  useEffect(() => {
    fetch('/api/orders').then(r => r.json()).then(d => {
      if (d.success) {
        const activos = (d.data || []).filter((p: Pedido) => p.status === 'en_camino' || p.status === 'in_transit')
        setPedidos(activos)
        if (activos.length > 0) setPedidoActual(activos[0])
      }
    }).catch(() => {})
  }, [])

  function verRuta(dir: string) { window.open('https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(dir || ''), '_blank') }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-sky-600 to-sky-700 text-white p-5">
        <div className="flex items-center gap-3 mb-4"><Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link><div><h1 className="text-xl font-bold">🛵 Repartidor</h1><p className="text-sky-200 text-xs">{pedidos.length} pedidos activos</p></div></div>
      </header>
      <div className="p-4">
        {!entregado && pedidoActual ? (
          <div className="bg-white rounded-2xl p-5 border shadow-sm">
            <h2 className="font-bold text-lg mb-3">Pedido #{pedidoActual.id?.slice(-6)}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-red-400 shrink-0" /><span>{pedidoActual.direccion_entrega || 'Sin dirección'}</span></div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-green-500 shrink-0" /><span>{pedidoActual.telefono || pedidoActual.cliente || pedidoActual.customer_name || 'Cliente'}</span></div>
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-3">${Number(pedidoActual.total).toLocaleString()}</p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button onClick={() => verRuta(pedidoActual.direccion_entrega || '')} className="bg-sky-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Navigation className="w-4 h-4" /> Ver Ruta</button>
              <button onClick={() => { setEntregado(true); setPedidoActual(null) }} className="bg-emerald-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Entregado</button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12"><span className="text-6xl">✅</span><h2 className="text-xl font-bold mt-4">{entregado ? '¡Entrega completada!' : 'Sin pedidos activos'}</h2><p className="text-stone-400 mt-2">{entregado ? 'Esperando nuevo pedido...' : 'No hay pedidos asignados'}</p></div>
        )}
        {pedidos.length > 0 && (
          <div className="mt-4 bg-white rounded-2xl p-4 border"><h3 className="font-bold mb-2">📋 Todos los pedidos</h3>{pedidos.map(p => <div key={p.id} className="flex justify-between py-2 border-b last:border-0 text-sm"><span>#{p.id?.slice(-6)} - {p.cliente || p.customer_name}</span><span className="font-bold text-emerald-600">${Number(p.total).toLocaleString()}</span></div>)}</div>
        )}
      </div>
    </div>
  )
}
