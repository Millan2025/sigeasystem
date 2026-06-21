'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, TrendingUp, DollarSign, Calculator, FileText, Link2, Building } from 'lucide-react'

const libroDiario = [
  { fecha: '2025-06-14', concepto: 'Venta mostrador', ingreso: 450000, egreso: 0, cuenta: 'Ingresos operacionales' },
  { fecha: '2025-06-14', concepto: 'Compra harina', ingreso: 0, egreso: 120000, cuenta: 'Compras' },
  { fecha: '2025-06-14', concepto: 'Nomina', ingreso: 0, egreso: 85000, cuenta: 'Personal' },
  { fecha: '2025-06-14', concepto: 'Servicios', ingreso: 0, egreso: 45000, cuenta: 'Gastos' },
]

export default function FinanzasPage() {
  const [tab, setTab] = useState<'resumen'|'libro'|'balance'|'cierre'|'api'>('resumen')
  const [ventasHoy, setVentasHoy] = useState(450000)
  const [efectivoContado, setEfectivoContado] = useState('')
  const [resultadoCierre, setResultadoCierre] = useState('')

  useEffect(() => { fetch('/api/sales').then(r => r.json()).then(d => { if (d.success && d.totales) setVentasHoy(d.totales.total || 0) }).catch(() => {}) }, [])

  const totalIngresos = libroDiario.reduce((s, l) => s + l.ingreso, 0)
  const totalEgresos = libroDiario.reduce((s, l) => s + l.egreso, 0)
  const utilidadHoy = ventasHoy - 180000 - 85000 - 45000

  function descargarExcel() {
    let csv = '\uFEFFFecha,Concepto,Cuenta,Ingreso,Egreso\n'
    libroDiario.forEach(l => { csv += l.fecha + ',' + l.concepto + ',' + l.cuenta + ',' + l.ingreso + ',' + l.egreso + '\n' })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'libro_diario.csv'; a.click()
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3 mb-4"><Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link><div><h1 className="text-xl font-bold">Finanzas</h1></div></div>
        <div className="flex gap-1 bg-stone-700 rounded-xl p-1 overflow-x-auto">
          {[{ id: 'resumen', label: 'Resumen', icon: TrendingUp }, { id: 'libro', label: 'Libro Diario', icon: FileText }, { id: 'balance', label: 'Balance', icon: Calculator }, { id: 'cierre', label: 'Cierre Caja', icon: DollarSign }, { id: 'api', label: 'API', icon: Link2 }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={'flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ' + (tab === t.id ? 'bg-white text-stone-800' : 'text-stone-300')}><t.icon className="w-3.5 h-3.5" /> {t.label}</button>
          ))}
        </div>
      </header>
      <div className="p-4">
        {tab === 'resumen' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 border"><p className="text-sm font-bold text-stone-700">Ventas Hoy</p><p className="text-2xl font-bold text-emerald-600">${ventasHoy.toLocaleString()}</p></div>
            <div className="bg-white rounded-2xl p-4 border"><p className="text-sm font-bold text-stone-700">Egresos</p><p className="text-2xl font-bold text-rose-600">${totalEgresos.toLocaleString()}</p></div>
            <div className={'rounded-2xl p-4 border ' + (utilidadHoy >= 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300')}><p className="text-sm font-bold text-stone-700">Utilidad</p><p className="text-2xl font-bold">{utilidadHoy >= 0 ? '${' + utilidadHoy.toLocaleString() + '}' : '-$' + Math.abs(utilidadHoy).toLocaleString()}</p></div>
            <button onClick={descargarExcel} className="w-full bg-emerald-500 text-white rounded-2xl py-4 font-bold"><Download className="w-5 h-5 inline mr-2" />Descargar para Contador</button>
          </div>
        )}
        {tab === 'libro' && (
          <div>
            <div className="flex justify-between items-center mb-3"><h2 className="font-bold text-stone-800">Libro Diario</h2><button onClick={descargarExcel} className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs"><Download className="w-3 h-3 inline mr-1" />Excel</button></div>
            <div className="space-y-2">{libroDiario.map((l, i) => (
              <div key={i} className="bg-white rounded-xl p-3 border"><div className="flex justify-between text-xs text-stone-500 mb-1"><span>{l.fecha}</span><span>{l.cuenta}</span></div><p className="text-sm font-medium text-stone-800">{l.concepto}</p><div className="flex justify-between text-sm"><span className="text-emerald-600">{l.ingreso > 0 ? '$' + l.ingreso.toLocaleString() : ''}</span><span className="text-rose-600">{l.egreso > 0 ? '-$' + l.egreso.toLocaleString() : ''}</span></div></div>
            ))}</div>
          </div>
        )}
        {tab === 'cierre' && (
          <div className="bg-white rounded-2xl p-5 border"><h3 className="font-bold text-stone-800 mb-4">Cierre de Caja</h3><p className="text-sm mb-2">Ventas hoy: <span className="font-bold">${ventasHoy.toLocaleString()}</span></p><label className="block text-sm font-bold text-stone-700 mb-2">Efectivo contado</label><input type="number" value={efectivoContado} onChange={e => setEfectivoContado(e.target.value)} className="w-full p-4 text-center bg-stone-100 rounded-2xl mb-3" /><button onClick={() => { const d = Number(efectivoContado) - ventasHoy * 0.65; setResultadoCierre(d > -1000 && d < 1000 ? '✅ Cuadre correcto' : '⚠️ Descuadre: $' + Math.abs(d).toLocaleString()) }} className="w-full bg-stone-800 text-white rounded-2xl py-4 font-bold">Calcular Cuadre</button>{resultadoCierre && <p className="mt-3 text-sm font-bold">{resultadoCierre}</p>}</div>
        )}
      </div>
    </div>
  )
}
