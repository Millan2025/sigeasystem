'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Truck, MapPin, Phone, CheckCircle, Clock, User } from 'lucide-react'

const pedidosDemo = [
  { id: 'ORD-001', cliente: 'Ana GarcÃ­a', direccion: 'Calle 45 #23-12, La Paz', telefono: '3124567890', total: 25000, estado: 'pendiente', hora: '10:30', items: 'Pan AliÃ±ado x2, CafÃ© x1' },
  { id: 'ORD-002', cliente: 'Pedro LÃ³pez', direccion: 'Carrera 12 #34-56, Centro', telefono: '3156789012', total: 35000, estado: 'en_camino', hora: '10:15', repartidor: 'Juan PÃ©rez', items: 'Torta Tres Leches x1, Jugo x2' },
  { id: 'ORD-003', cliente: 'MarÃ­a RodrÃ­guez', direccion: 'Calle 78 #90-12, Norte', telefono: '3189012345', total: 18000, estado: 'entregado', hora: '09:50', repartidor: 'Juan PÃ©rez', items: 'Croissant x3, CafÃ© x2' },
  { id: 'ORD-004', cliente: 'Luis MartÃ­nez', direccion: 'Diagonal 23 #45-67, Sur', telefono: '3201234567', total: 42000, estado: 'pendiente', hora: '10:45', items: 'Pan AliÃ±ado x4, Queso 500g, Jugo x3' },
]

const repartidores = ['Juan PÃ©rez', 'Carlos GÃ³mez (apoyo)']

export default function PedidosPage() {
  const [tab, setTab] = useState<'pendientes'|'camino'|'entregados'>('pendientes')
  const [showAsignar, setShowAsignar] = useState<string | null>(null)

  const filtrados = pedidosDemo.filter(p => {
    if (tab === 'pendientes') return p.estado === 'pendiente'
    if (tab === 'camino') return p.estado === 'en_camino'
    return p.estado === 'entregado'
  })

  function getEstadoColor(estado: string) {
    if (estado === 'pendiente') return 'bg-amber-100 text-amber-700'
    if (estado === 'en_camino') return 'bg-sky-100 text-sky-700'
    return 'bg-emerald-100 text-emerald-700'
  }

  return (
    <div className="min-h-screen bg-stone-50 max-w-lg mx-auto">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-xl font-bold">ðŸ›µ Pedidos</h1>
            <p className="text-stone-400 text-sm">Domicilios</p>
          </div>
        </div>
        <div className="flex gap-1 bg-stone-700 rounded-xl p-1">
          {[
            { id: 'pendientes' as const, label: 'Pendientes', count: pedidosDemo.filter(p => p.estado === 'pendiente').length },
            { id: 'camino' as const, label: 'En Camino', count: pedidosDemo.filter(p => p.estado === 'en_camino').length },
            { id: 'entregados' as const, label: 'Entregados', count: pedidosDemo.filter(p => p.estado === 'entregado').length },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium ' + (tab === t.id ? 'bg-white text-stone-800' : 'text-stone-300')}>
              {t.label} <span className="bg-stone-600 text-white text-xs px-2 py-0.5 rounded-full">{t.count}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-3">
        {filtrados.map(p => (
          <div key={p.id} className="bg-white rounded-2xl p-4 border border-stone-200">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-stone-800">{p.id} â€¢ {p.cliente}</h3>
                <p className="text-sm text-stone-400">{p.hora}</p>
              </div>
              <span className={'px-3 py-1 rounded-full text-xs font-bold ' + getEstadoColor(p.estado)}>
                {p.estado === 'pendiente' ? 'Pendiente' : p.estado === 'en_camino' ? 'En Camino' : 'Entregado'}
              </span>
            </div>

            <p className="text-sm text-stone-600 mb-2">{p.items}</p>

            <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
              <MapPin className="w-4 h-4 text-red-400" />
              <span>{p.direccion}</span>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-lg font-bold text-emerald-600">${p.total.toLocaleString()}</p>
              
              {p.estado === 'pendiente' && (
                <button onClick={() => setShowAsignar(p.id)} className="bg-sky-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1">
                  <User className="w-4 h-4" /> Asignar
                </button>
              )}
              {p.estado === 'en_camino' && (
                <div className="flex items-center gap-2 text-sm text-sky-600">
                  <Truck className="w-4 h-4" /> {p.repartidor}
                </div>
              )}
              {p.estado === 'entregado' && (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              )}
            </div>
          </div>
        ))}
      </div>

      {showAsignar && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4" onClick={() => setShowAsignar(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Asignar Repartidor</h3>
            <p className="text-sm text-stone-500 mb-3">Pedido: {showAsignar}</p>
            {repartidores.map(r => (
              <button key={r} onClick={() => { alert('Repartidor asignado: ' + r); setShowAsignar(null) }} className="w-full bg-stone-50 hover:bg-emerald-50 p-3 rounded-xl mb-2 text-left text-sm font-medium">
                ðŸ›µ {r}
              </button>
            ))}
            <button onClick={() => setShowAsignar(null)} className="w-full bg-stone-100 py-3 rounded-xl font-medium mt-2">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}