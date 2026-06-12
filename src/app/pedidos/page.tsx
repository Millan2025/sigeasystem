'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Truck, MapPin, CheckCircle, User } from 'lucide-react'

const pedidosDemo = [
  { id: 'ORD-001', cliente: 'Ana García', direccion: 'Calle 45 #23-12, La Paz', total: 25000, estado: 'pendiente', hora: '10:30', items: 'Pan Aliñado x2, Café x1' },
  { id: 'ORD-002', cliente: 'Pedro López', direccion: 'Carrera 12 #34-56, Centro', total: 35000, estado: 'en_camino', hora: '10:15', repartidor: 'Juan Pérez', items: 'Torta x1, Jugo x2' },
  { id: 'ORD-003', cliente: 'María Rodríguez', direccion: 'Calle 78 #90-12, Norte', total: 18000, estado: 'entregado', hora: '09:50', repartidor: 'Juan Pérez', items: 'Croissant x3, Café x2' },
]
const repartidores = ['Juan Pérez', 'Carlos Gómez']

export default function PedidosPage() {
  const [tab, setTab] = useState<'pendientes'|'camino'|'entregados'>('pendientes')
  const [showAsignar, setShowAsignar] = useState<string | null>(null)
  const filtrados = pedidosDemo.filter(p => tab === 'pendientes' ? p.estado === 'pendiente' : tab === 'camino' ? p.estado === 'en_camino' : p.estado === 'entregado')

  return (
    <div className="min-h-screen bg-stone-50 max-w-lg lg:max-w-2xl mx-auto">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3 mb-4"><Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link><div><h1 className="text-xl font-bold">Pedidos</h1></div></div>
        <div className="flex gap-1 bg-stone-700 rounded-xl p-1">
          {['pendientes','camino','entregados'].map(t => <button key={t} onClick={() => setTab(t as any)} className={'flex-1 py-2 rounded-lg text-sm font-medium ' + (tab === t ? 'bg-white text-stone-800' : 'text-stone-300')}>{t === 'pendientes' ? 'Pendientes' : t === 'camino' ? 'En Camino' : 'Entregados'}</button>)}
        </div>
      </header>
      <div className="p-4 space-y-3">
        {filtrados.map(p => (
          <div key={p.id} className="bg-white rounded-2xl p-4 border border-stone-200">
            <div className="flex justify-between mb-2"><h3 className="font-semibold">{p.id} - {p.cliente}</h3><span className={'px-2 py-1 rounded-full text-xs font-bold ' + (p.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' : p.estado === 'en_camino' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700')}>{p.estado === 'pendiente' ? 'Pendiente' : p.estado === 'en_camino' ? 'En Camino' : 'Entregado'}</span></div>
            <p className="text-sm text-stone-600 mb-2">{p.items}</p>
            <div className="flex items-center gap-2 text-sm text-stone-500 mb-3"><MapPin className="w-4 h-4 text-red-400" />{p.direccion}</div>
            <div className="flex justify-between items-center"><p className="text-lg font-bold text-emerald-600">${p.total.toLocaleString()}</p>
              {p.estado === 'pendiente' && <button onClick={() => setShowAsignar(p.id)} className="bg-sky-500 text-white px-4 py-2 rounded-xl text-sm font-medium">Asignar</button>}
              {p.estado === 'en_camino' && <span className="text-sm text-sky-600"><Truck className="w-4 h-4 inline" /> {p.repartidor}</span>}
              {p.estado === 'entregado' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
