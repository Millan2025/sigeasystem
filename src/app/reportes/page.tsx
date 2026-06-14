'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, BarChart3, PieChart, Star, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Clock } from 'lucide-react'

// DATOS INTEGRADOS DE TODOS LOS MÓDULOS
const datos = {
  ventasHoy: 450000,
  ventasSemana: 3150000,
  ventasMes: 13500000,
  transaccionesHoy: 24,
  transaccionesSemana: 168,
  transaccionesMes: 720,
  costoVentas: 280000,
  nomina: 85000,
  gastos: 45000,
  utilidad: 40000,
  productosStock: 87,
  productosUrgentes: 3,
  pedidosPendientes: 3,
  pedidosEntregados: 12,
  empleados: 3,
  produccionesHoy: 90,
}

const ventasPorHora = [
  { hora: '6am', ventas: 85000 }, { hora: '7am', ventas: 120000 }, { hora: '8am', ventas: 95000 },
  { hora: '9am', ventas: 65000 }, { hora: '10am', ventas: 45000 }, { hora: '11am', ventas: 35000 },
  { hora: '12pm', ventas: 28000 }, { hora: '1pm', ventas: 22000 }, { hora: '2pm', ventas: 18000 },
]

const topProductos = [
  { nombre: 'Pan Aliñado Familiar', ventas: 140, total: 700000, icono: '🍞', categoria: 'Panadería' },
  { nombre: 'Café Tinto 7oz', ventas: 225, total: 405000, icono: '☕', categoria: 'Bebidas' },
  { nombre: 'Croissant', ventas: 60, total: 192000, icono: '🥐', categoria: 'Panadería' },
  { nombre: 'Torta Tres Leches', ventas: 20, total: 150000, icono: '🍰', categoria: 'Pastelería' },
  { nombre: 'Coca-Cola 350ml', ventas: 75, total: 262500, icono: '🥤', categoria: 'Bebidas' },
  { nombre: 'Jugo Natural', ventas: 45, total: 180000, icono: '🧃', categoria: 'Bebidas' },
  { nombre: 'Queso Campesino', ventas: 15, total: 420000, icono: '🧀', categoria: 'Lácteos' },
  { nombre: 'Aguacate Hass', ventas: 30, total: 240000, icono: '🥑', categoria: 'Verduras' },
]

const metodoPago = [
  { metodo: 'Efectivo', porcentaje: 65, color: 'bg-emerald-500', monto: 292500 },
  { metodo: 'Nequi', porcentaje: 20, color: 'bg-purple-500', monto: 90000 },
  { metodo: 'Daviplata', porcentaje: 15, color: 'bg-red-500', monto: 67500 },
]

const margenPorProducto = [
  { nombre: 'Pan Aliñado', costo: 1800, precio: 5000, margen: 64 },
  { nombre: 'Torta Tres Leches', costo: 3200, precio: 7500, margen: 57 },
  { nombre: 'Croissant', costo: 1100, precio: 3200, margen: 66 },
  { nombre: 'Café Tinto', costo: 600, precio: 1800, margen: 67 },
]

const maxVentaHora = Math.max(...ventasPorHora.map(v => v.ventas))

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState<'hoy'|'semana'|'mes'>('hoy')
  const [seccion, setSeccion] = useState<'ventas'|'productos'|'margen'|'pagos'>('ventas')

  const ventasPeriodo = periodo === 'hoy' ? datos.ventasHoy : periodo === 'semana' ? datos.ventasSemana : datos.ventasMes
  const transPeriodo = periodo === 'hoy' ? datos.transaccionesHoy : periodo === 'semana' ? datos.transaccionesSemana : datos.transaccionesMes

  function descargarExcel() {
    var csv = '\uFEFFProducto,Unidades,Total,Categoria,Margen\n'
    topProductos.forEach(p => { 
      const m = margenPorProducto.find(m => p.nombre.includes(m.nombre))
      csv += p.nombre + ',' + p.ventas + ',' + p.total + ',' + p.categoria + ',' + (m ? m.margen + '%' : 'N/A') + '\n'
    })
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url; a.download = 'reporte_ventas_' + new Date().toISOString().split('T')[0] + '.csv'; a.click()
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1"><h1 className="text-xl font-bold">📈 Reportes</h1></div>
          <button onClick={descargarExcel} className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Excel</button>
        </div>
        <div className="flex gap-1 bg-stone-700 rounded-xl p-1 mb-2">
          {['hoy','semana','mes'].map(p => (
            <button key={p} onClick={() => setPeriodo(p as any)} className={'flex-1 py-1.5 rounded-lg text-xs font-medium ' + (periodo === p ? 'bg-white text-stone-800' : 'text-stone-300')}>
              {p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-stone-700 rounded-xl p-1">
          {[
            { id: 'ventas' as const, label: 'Ventas', icon: TrendingUp },
            { id: 'productos' as const, label: 'Productos', icon: Star },
            { id: 'margen' as const, label: 'Margen', icon: DollarSign },
            { id: 'pagos' as const, label: 'Pagos', icon: PieChart },
          ].map(s => (
            <button key={s.id} onClick={() => setSeccion(s.id)} className={'flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ' + (seccion === s.id ? 'bg-white text-stone-800' : 'text-stone-300')}>
              <s.icon className="w-3 h-3" /> {s.label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Total */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
          <p className="text-emerald-100 text-xs">VENTAS {periodo === 'hoy' ? 'DE HOY' : periodo === 'semana' ? 'DE LA SEMANA' : 'DEL MES'}</p>
          <p className="text-3xl font-bold mt-1">${ventasPeriodo.toLocaleString()}</p>
          <div className="flex gap-4 mt-2 text-xs text-emerald-100">
            <span>🛒 {transPeriodo} transacciones</span>
            <span>📦 {datos.productosStock} productos</span>
          </div>
        </div>

        {/* KPIs rápidos */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-white rounded-xl p-3 border border-stone-200">
            <p className="text-stone-400">Utilidad</p>
            <p className="text-lg font-bold text-emerald-600">${datos.utilidad.toLocaleString()}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
            <p className="text-amber-500">Urgentes</p>
            <p className="text-lg font-bold text-amber-600">{datos.productosUrgentes}</p>
          </div>
          <div className="bg-sky-50 rounded-xl p-3 border border-sky-200">
            <p className="text-sky-500">Pedidos</p>
            <p className="text-lg font-bold text-sky-600">{datos.pedidosPendientes}</p>
          </div>
        </div>

        {/* SECCIÓN VENTAS */}
        {seccion === 'ventas' && (
          <div className="bg-white rounded-2xl p-5 border border-stone-200">
            <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Ventas por Hora</h3>
            <div className="flex flex-col gap-2">
              {[0,1,2,3].map(row => (
              <div key={row} className="flex items-end gap-1 h-20">
                {ventasPorHora.slice(row * 4, row * 4 + 4).map(v => (
                  <div key={v.hora} className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[9px] text-stone-500">${(v.ventas/1000).toFixed(0)}k</span>
                    <div className="w-full bg-emerald-500 rounded-t-md" style={{ height: (v.ventas / maxVentaHora * 100) + '%', minHeight: '6px' }}></div>
                    <span className="text-[9px] text-stone-400">{v.hora}</span>
                  </div>
                ))}
              </div>
            ))}
            </div>
          </div>
        )}

        {/* SECCIÓN PRODUCTOS */}
        {seccion === 'productos' && (
          <div className="bg-white rounded-2xl p-5 border border-stone-200">
            <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" /> Top Productos</h3>
            {topProductos.map((p, i) => (
              <div key={p.nombre} className="flex items-center justify-between py-2.5 border-b border-stone-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{p.icono}</span>
                  <div>
                    <p className="text-sm font-medium text-stone-800">{p.nombre}</p>
                    <p className="text-xs text-stone-400">{p.categoria} • {p.ventas} unidades</p>
                  </div>
                </div>
                <p className="font-bold text-emerald-600 text-sm">${p.total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* SECCIÓN MARGEN */}
        {seccion === 'margen' && (
          <div className="space-y-3">
            {margenPorProducto.map(m => (
              <div key={m.nombre} className="bg-white rounded-2xl p-4 border border-stone-200">
                <div className="flex justify-between mb-2">
                  <h4 className="font-semibold text-stone-800 text-sm">{m.nombre}</h4>
                  <span className="text-emerald-600 font-bold">{m.margen}% margen</span>
                </div>
                <div className="flex justify-between text-xs text-stone-400 mb-1">
                  <span>Costo: ${m.costo.toLocaleString()}</span>
                  <span>Precio: ${m.precio.toLocaleString()}</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2.5">
                  <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: m.margen + '%' }}></div>
                </div>
                <p className="text-xs text-stone-500 mt-1">Ganancia por unidad: <span className="text-emerald-600 font-bold">${(m.precio - m.costo).toLocaleString()}</span></p>
              </div>
            ))}
          </div>
        )}

        {/* SECCIÓN PAGOS */}
        {seccion === 'pagos' && (
          <div className="bg-white rounded-2xl p-5 border border-stone-200">
            <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2"><PieChart className="w-4 h-4" /> Métodos de Pago</h3>
            {metodoPago.map(m => (
              <div key={m.metodo} className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-stone-600">{m.metodo}</span>
                  <span className="font-medium">{m.porcentaje}% - ${m.monto.toLocaleString()}</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-3">
                  <div className={m.color + ' h-3 rounded-full'} style={{ width: m.porcentaje + '%' }}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


