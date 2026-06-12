'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, TrendingUp, BarChart3, PieChart, Clock, Star, DollarSign } from 'lucide-react'

const ventasPorHora = [
  { hora: '6am', ventas: 85000 }, { hora: '7am', ventas: 120000 }, { hora: '8am', ventas: 95000 },
  { hora: '9am', ventas: 65000 }, { hora: '10am', ventas: 45000 }, { hora: '11am', ventas: 35000 },
  { hora: '12pm', ventas: 28000 }, { hora: '1pm', ventas: 22000 }, { hora: '2pm', ventas: 18000 },
]

const topProductos = [
  { nombre: 'Pan Aliñado Familiar', ventas: 140, total: 700000, icono: '🍞' },
  { nombre: 'Café Tinto 7oz', ventas: 225, total: 405000, icono: '☕' },
  { nombre: 'Croissant', ventas: 60, total: 192000, icono: '🥐' },
  { nombre: 'Torta Tres Leches', ventas: 20, total: 150000, icono: '🍰' },
  { nombre: 'Coca-Cola 350ml', ventas: 75, total: 262500, icono: '🥤' },
]

const metodoPago = [
  { metodo: 'Efectivo', porcentaje: 65, color: 'bg-emerald-500' },
  { metodo: 'Nequi', porcentaje: 20, color: 'bg-purple-500' },
  { metodo: 'Daviplata', porcentaje: 15, color: 'bg-red-500' },
]

const maxVentaHora = Math.max(...ventasPorHora.map(v => v.ventas))

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState<'hoy'|'semana'|'mes'>('hoy')

  function descargarExcel() {
    var csv = 'Producto,Unidades Vendidas,Total Ventas\n'
    topProductos.forEach(function(p) { csv += p.nombre + ',' + p.ventas + ',' + p.total + '\n' })
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = 'reporte_ventas_' + new Date().toISOString().split('T')[0] + '.csv'
    a.click()
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1"><h1 className="text-xl font-bold">📈 Reportes</h1></div>
          <button onClick={descargarExcel} className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1"><Download className="w-4 h-4" /> Excel</button>
        </div>
        <div className="flex gap-1 bg-stone-700 rounded-xl p-1">
          {['hoy','semana','mes'].map(p => (
            <button key={p} onClick={() => setPeriodo(p as any)} className={'flex-1 py-2 rounded-lg text-sm font-medium ' + (periodo === p ? 'bg-white text-stone-800' : 'text-stone-300')}>
              {p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Total */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <p className="text-emerald-100 text-sm">VENTAS {periodo === 'hoy' ? 'DE HOY' : periodo === 'semana' ? 'DE LA SEMANA' : 'DEL MES'}</p>
          <p className="text-4xl font-bold mt-1">${(periodo === 'hoy' ? 450000 : periodo === 'semana' ? 3150000 : 13500000).toLocaleString()}</p>
          <p className="text-sm text-emerald-100 mt-2">{periodo === 'hoy' ? '24' : periodo === 'semana' ? '168' : '720'} transacciones</p>
        </div>

        {/* Gráfico de barras - Ventas por hora */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200">
          <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Ventas por Hora</h3>
          <div className="flex items-end gap-1 h-32">
            {ventasPorHora.map(v => (
              <div key={v.hora} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-stone-500">${(v.ventas/1000).toFixed(0)}k</span>
                <div className="w-full bg-emerald-500 rounded-t-lg" style={{ height: (v.ventas / maxVentaHora * 100) + '%' }}></div>
                <span className="text-xs text-stone-400">{v.hora}</span>
              </div>
            ))}
          </div>
        </div>

        {/* TOP 10 productos */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200">
          <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" /> Más Vendidos</h3>
          {topProductos.map((p, i) => (
            <div key={p.nombre} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">{p.icono}</span>
                <div>
                  <p className="text-sm font-medium text-stone-800">{p.nombre}</p>
                  <p className="text-xs text-stone-400">{p.ventas} unidades</p>
                </div>
              </div>
              <p className="font-bold text-emerald-600">${p.total.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Métodos de pago */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200">
          <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2"><PieChart className="w-4 h-4" /> Métodos de Pago</h3>
          {metodoPago.map(m => (
            <div key={m.metodo} className="mb-3">
              <div className="flex justify-between text-sm mb-1"><span className="text-stone-600">{m.metodo}</span><span className="font-medium">{m.porcentaje}%</span></div>
              <div className="w-full bg-stone-100 rounded-full h-3">
                <div className={m.color + ' h-3 rounded-full'} style={{ width: m.porcentaje + '%' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}