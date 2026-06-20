'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LogoHeader from '@/components/shared/LogoHeader'
import { ArrowLeft, Download, BarChart3, Star } from 'lucide-react'

const ventasPorHora = [{ hora: '6am', ventas: 85000 }, { hora: '7am', ventas: 120000 }, { hora: '8am', ventas: 95000 }, { hora: '9am', ventas: 65000 }, { hora: '10am', ventas: 45000 }, { hora: '11am', ventas: 35000 }]
const maxVentaHora = Math.max(...ventasPorHora.map(v => v.ventas))

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState<'hoy'|'semana'|'mes'>('hoy')
  const [ventasHoy, setVentasHoy] = useState(450000)
  const [transacciones, setTransacciones] = useState(24)

  useEffect(() => { fetch('/api/sales').then(r => r.json()).then(d => { if (d.success && d.totales) { setVentasHoy(d.totales.total || 0); setTransacciones(d.totales.count || 0) } }).catch(() => {}) }, [])

  function descargarExcel() {
    let csv = '\uFEFFProducto,Unidades,Total\nPan Aliñado,140,700000\nCafé Tinto,225,405000\nCroissant,60,192000'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'reporte.csv'; a.click()
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3 mb-3"><LogoHeader /><Link href="/" className="p-2 hover:bg-white/10 rounded-xl ml-2"><ArrowLeft className="w-5 h-5" /></Link><div className="flex-1"><h1 className="text-xl font-bold">📈 Reportes</h1></div><button onClick={descargarExcel} className="bg-white/20 px-3 py-2 rounded-xl text-xs"><Download className="w-3.5 h-3.5 inline mr-1" />Excel</button></div>
        <div className="flex gap-1 bg-stone-700 rounded-xl p-1">{['hoy','semana','mes'].map(p => <button key={p} onClick={() => setPeriodo(p as any)} className={'flex-1 py-1.5 rounded-lg text-xs font-medium ' + (periodo === p ? 'bg-white text-stone-800' : 'text-stone-300')}>{p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Semana' : 'Mes'}</button>)}</div>
      </header>
      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white"><p className="text-emerald-100 text-xs">VENTAS DE HOY</p><p className="text-3xl font-bold mt-1">${ventasHoy.toLocaleString()}</p><p className="text-xs mt-2">{transacciones} transacciones</p></div>
        <div className="bg-white rounded-2xl p-5 border"><h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Ventas por Hora</h3><div className="flex items-end gap-1 h-32">{ventasPorHora.map(v => <div key={v.hora} className="flex-1 flex flex-col items-center gap-1"><span className="text-[9px]">${(v.ventas/1000).toFixed(0)}k</span><div className="w-full bg-emerald-500 rounded-t-md" style={{ height: (v.ventas / maxVentaHora * 100) + '%', minHeight: '4px' }}></div><span className="text-[9px] text-stone-400">{v.hora}</span></div>)}</div></div>
        <div className="bg-white rounded-2xl p-5 border"><h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" /> Top Productos</h3>{['🍞 Pan Aliñado,$700,000,140','☕ Café Tinto,$405,000,225','🥐 Croissant,$192,000,60'].map(p => { const [icon, name, total, ventas] = p.split(','); return <div key={name} className="flex items-center justify-between py-2 border-b last:border-0"><span>{icon} {name} · {ventas} unid.</span><span className="font-bold text-emerald-600">{total}</span></div> })}</div>
      </div>
    </div>
  )
}

