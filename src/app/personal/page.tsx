'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Users, Clock, DollarSign } from 'lucide-react'

const empleadosDemo = [
  { id: '1', nombre: 'Carlos Gómez', cargo: 'Cajero', salario: 1423500, horario: '06:00-14:00', asistencias: 22, horasExtras: 4, estado: 'activo' },
  { id: '2', nombre: 'María López', cargo: 'Panadera', salario: 1500000, horario: '02:00-10:00', asistencias: 20, horasExtras: 8, estado: 'activo' },
  { id: '3', nombre: 'Juan Pérez', cargo: 'Repartidor', salario: 1300000, horario: '08:00-16:00', asistencias: 21, horasExtras: 3, estado: 'activo' },
  { id: '4', nombre: 'Ana Ruiz', cargo: 'Vendedora', salario: 1300000, horario: '10:00-18:00', asistencias: 18, horasExtras: 0, estado: 'ausente' },
]

export default function PersonalPage() {
  const [tab, setTab] = useState<'empleados'|'nomina'>('empleados')

  return (
    <div className="min-h-screen bg-stone-50 max-w-lg lg:max-w-2xl mx-auto">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3 mb-4"><Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link><div><h1 className="text-xl font-bold">Personal</h1></div></div>
        <div className="flex gap-1 bg-stone-700 rounded-xl p-1">
          <button onClick={() => setTab('empleados')} className={'flex-1 py-2 rounded-lg text-sm font-medium ' + (tab === 'empleados' ? 'bg-white text-stone-800' : 'text-stone-300')}><Users className="w-4 h-4 inline mr-1" />Empleados</button>
          <button onClick={() => setTab('nomina')} className={'flex-1 py-2 rounded-lg text-sm font-medium ' + (tab === 'nomina' ? 'bg-white text-stone-800' : 'text-stone-300')}><DollarSign className="w-4 h-4 inline mr-1" />Nómina</button>
        </div>
      </header>
      <div className="p-4">
        {tab === 'empleados' && empleadosDemo.map(e => (
          <div key={e.id} className="bg-white rounded-2xl p-4 border border-stone-200 mb-3">
            <div className="flex justify-between items-start mb-2"><div><h3 className="font-semibold">{e.nombre}</h3><p className="text-sm text-stone-400">{e.cargo} - {e.horario}</p></div><span className={'px-3 py-1 rounded-full text-xs font-bold ' + (e.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{e.estado}</span></div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-stone-50 rounded-xl p-2"><p className="text-stone-400">Salario</p><p className="font-bold">${e.salario.toLocaleString()}</p></div>
              <div className="bg-stone-50 rounded-xl p-2"><p className="text-stone-400">Asistencias</p><p className="font-bold">{e.asistencias} días</p></div>
              <div className="bg-stone-50 rounded-xl p-2"><p className="text-stone-400">H. Extra</p><p className="font-bold text-amber-600">{e.horasExtras}h</p></div>
            </div>
          </div>
        ))}
        {tab === 'nomina' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            <h3 className="font-bold mb-3">Nómina del Mes</h3>
            {empleadosDemo.map(e => <div key={e.id} className="flex justify-between py-2 border-b border-stone-100"><span>{e.nombre}</span><span className="font-bold text-emerald-600">${e.salario.toLocaleString()}</span></div>)}
            <div className="flex justify-between pt-3 font-bold text-lg"><span>Total</span><span className="text-emerald-600">${empleadosDemo.reduce((s, e) => s + e.salario, 0).toLocaleString()}</span></div>
          </div>
        )}
      </div>
    </div>
  )
}
