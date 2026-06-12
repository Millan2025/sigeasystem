'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Users, Clock, DollarSign, Calendar, UserPlus, Search } from 'lucide-react'

const empleadosDemo = [
  { id: '1', nombre: 'Carlos Gómez', cargo: 'Cajero', salario: 1423500, horario: '06:00-14:00', asistencias: 22, horasExtras: 4, estado: 'activo' },
  { id: '2', nombre: 'María López', cargo: 'Panadera', salario: 1500000, horario: '02:00-10:00', asistencias: 20, horasExtras: 8, estado: 'activo' },
  { id: '3', nombre: 'Juan Pérez', cargo: 'Repartidor', salario: 1300000, horario: '08:00-16:00', asistencias: 21, horasExtras: 3, estado: 'activo' },
  { id: '4', nombre: 'Ana Ruiz', cargo: 'Vendedora', salario: 1300000, horario: '10:00-18:00', asistencias: 18, horasExtras: 0, estado: 'ausente' },
]

const registrosHoy = [
  { empleado: 'Carlos Gómez', tipo: 'entrada', hora: '05:58', metodo: 'app' },
  { empleado: 'María López', tipo: 'entrada', hora: '01:55', metodo: 'app' },
  { empleado: 'Juan Pérez', tipo: 'entrada', hora: '07:50', metodo: 'app' },
  { empleado: 'Carlos Gómez', tipo: 'salida_descanso', hora: '09:00', metodo: 'app' },
  { empleado: 'Carlos Gómez', tipo: 'entrada_descanso', hora: '09:30', metodo: 'app' },
]

export default function PersonalPage() {
  const [tab, setTab] = useState<'empleados'|'asistencia'|'nomina'>('empleados')

  const totalNomina = empleadosDemo.reduce((s, e) => s + e.salario, 0)
  const totalHorasExtras = empleadosDemo.reduce((s, e) => s + e.horasExtras, 0)

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-xl font-bold">👥 Personal</h1>
            <p className="text-stone-400 text-sm">Panadería Doña Rosa</p>
          </div>
        </div>
        <div className="flex gap-1 bg-stone-700 rounded-xl p-1">
          {[
            { id: 'empleados' as const, label: 'Empleados', icon: Users },
            { id: 'asistencia' as const, label: 'Asistencia', icon: Clock },
            { id: 'nomina' as const, label: 'Nómina', icon: DollarSign },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium ' + (tab === t.id ? 'bg-white text-stone-800' : 'text-stone-300')}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4">
        {tab === 'empleados' && (
          <div className="space-y-3">
            <button className="w-full bg-emerald-500 text-white rounded-2xl py-3 font-medium flex items-center justify-center gap-2">
              <UserPlus className="w-5 h-5" /> Agregar Empleado
            </button>
            {empleadosDemo.map(e => (
              <div key={e.id} className="bg-white rounded-2xl p-4 border border-stone-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-stone-800">{e.nombre}</h3>
                    <p className="text-sm text-stone-400">{e.cargo} • {e.horario}</p>
                  </div>
                  <span className={'px-3 py-1 rounded-full text-xs font-bold ' + (e.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                    {e.estado === 'activo' ? 'Activo' : 'Ausente'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-stone-50 rounded-xl p-2">
                    <p className="text-stone-400">Salario</p>
                    <p className="font-bold text-stone-800">${e.salario.toLocaleString()}</p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-2">
                    <p className="text-stone-400">Asistencias</p>
                    <p className="font-bold text-stone-800">{e.asistencias} días</p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-2">
                    <p className="text-stone-400">Horas Extra</p>
                    <p className="font-bold text-amber-600">{e.horasExtras}h</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'asistencia' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 border border-stone-200">
              <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" /> Hoy</h3>
              {registrosHoy.map((r, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-stone-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm text-stone-800">{r.empleado}</p>
                    <p className="text-xs text-stone-400">{r.metodo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-stone-800">{r.hora}</p>
                    <span className={'text-xs px-2 py-0.5 rounded-full ' + (r.tipo.includes('entrada') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                      {r.tipo.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'nomina' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-stone-200">
                <p className="text-xs text-stone-400">Nómina del mes</p>
                <p className="text-2xl font-bold text-stone-800">${totalNomina.toLocaleString()}</p>
              </div>
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                <p className="text-xs text-amber-500">Horas extra</p>
                <p className="text-2xl font-bold text-amber-600">{totalHorasExtras}h</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="grid grid-cols-4 gap-2 p-3 bg-stone-100 text-xs font-medium text-stone-600">
                <span>Empleado</span><span className="text-right">Base</span><span className="text-right">Extras</span><span className="text-right">Total</span>
              </div>
              {empleadosDemo.map(e => {
                const valorHora = e.salario / 240
                const extraTotal = Math.round(valorHora * 1.25 * e.horasExtras)
                return (
                  <div key={e.id} className="grid grid-cols-4 gap-2 p-3 text-sm border-b border-stone-100">
                    <span className="text-stone-700">{e.nombre}</span>
                    <span className="text-right">${e.salario.toLocaleString()}</span>
                    <span className="text-right text-amber-600">${extraTotal.toLocaleString()}</span>
                    <span className="text-right font-bold text-emerald-600">${(e.salario + extraTotal).toLocaleString()}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}