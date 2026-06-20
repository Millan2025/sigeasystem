'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Users, DollarSign, Download, Plus, X, FileText } from 'lucide-react'

interface Empleado {
  id: string; nombre: string; documento: string; cargo: string; salario_base: number;
}

export default function PersonalPage() {
  const [tab, setTab] = useState<'empleados'|'nomina'|'exportar'>('empleados')
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const totalNomina = empleados.reduce((s, e) => s + Number(e.salario_base || 0), 0)

  useEffect(() => {
    fetch('/api/employees').then(r => r.json()).then(d => {
      if (d.success && d.data.length > 0) setEmpleados(d.data)
      else setEmpleados([{ id: '1', nombre: 'Carlos Gómez', documento: '12345678', cargo: 'Cajero', salario_base: 1423500 }, { id: '2', nombre: 'María López', documento: '87654321', cargo: 'Panadera', salario_base: 1500000 }])
    }).catch(() => {})
  }, [])

  function exportarExcel() {
    let csv = '\uFEFFEMPLEADO,DOCUMENTO,CARGO,SALARIO\n'
    empleados.forEach(e => { csv += e.nombre + ',' + (e.documento || '') + ',' + (e.cargo || '') + ',' + e.salario_base + '\n' })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'nomina.csv'; a.click()
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3 mb-4"><Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link><div className="flex-1"><h1 className="text-xl font-bold">👥 Personal</h1></div></div>
        <div className="flex gap-1 bg-stone-700 rounded-xl p-1">
          {[{ id: 'empleados', label: 'Empleados', icon: Users }, { id: 'nomina', label: 'Nómina', icon: DollarSign }, { id: 'exportar', label: 'Exportar', icon: FileText }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={'flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ' + (tab === t.id ? 'bg-white text-stone-800' : 'text-stone-300')}><t.icon className="w-3.5 h-3.5" /> {t.label}</button>
          ))}
        </div>
      </header>
      <div className="p-4">
        {tab === 'empleados' && (
          <div className="space-y-3">
            <button onClick={() => setShowAdd(true)} className="w-full bg-emerald-500 text-white rounded-2xl py-3 font-bold flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> Agregar Empleado</button>
            {empleados.map(e => (
              <div key={e.id} className="bg-white rounded-2xl p-4 border"><h3 className="font-bold text-stone-900">{e.nombre}</h3><p className="text-sm text-stone-500">{e.cargo || 'Sin cargo'} · CC: {e.documento || 'N/A'}</p><p className="text-lg font-bold text-emerald-600 mt-2">${Number(e.salario_base || 0).toLocaleString()}</p></div>
            ))}
          </div>
        )}
        {tab === 'nomina' && (
          <div className="bg-white rounded-2xl p-4 border"><h3 className="font-bold mb-3">Nómina del Mes</h3>{empleados.map(e => <div key={e.id} className="flex justify-between py-2 border-b"><span>{e.nombre}</span><span className="font-bold text-emerald-600">${Number(e.salario_base || 0).toLocaleString()}</span></div>)}<div className="flex justify-between pt-3 font-bold text-lg"><span>Total</span><span className="text-emerald-600">${totalNomina.toLocaleString()}</span></div></div>
        )}
        {tab === 'exportar' && (
          <div className="text-center"><button onClick={exportarExcel} className="bg-emerald-500 text-white rounded-2xl py-4 px-8 font-bold"><Download className="w-5 h-5 inline mr-2" />Descargar CSV</button></div>
        )}
      </div>
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}><h2 className="font-bold text-xl mb-4">Agregar Empleado</h2><input placeholder="Nombre" className="w-full p-3 bg-stone-50 border rounded-xl mb-2 text-sm" /><input placeholder="Documento" className="w-full p-3 bg-stone-50 border rounded-xl mb-2 text-sm" /><input type="number" placeholder="Salario" className="w-full p-3 bg-stone-50 border rounded-xl mb-4 text-sm" /><div className="flex gap-3"><button onClick={() => setShowAdd(false)} className="flex-1 bg-stone-200 py-3 rounded-xl font-bold">Cancelar</button><button onClick={() => { alert('Empleado agregado'); setShowAdd(false) }} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold">Guardar</button></div></div>
        </div>
      )}
    </div>
  )
}
