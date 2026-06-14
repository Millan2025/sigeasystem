'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Package, Beaker, ShoppingCart, Calculator, TrendingDown, AlertTriangle, Plus, X, Download, ChefHat } from 'lucide-react'

// DATOS SINCRONIZADOS (simulan conexión con Supabase - products + recipes + ingredients)
const recetas = [
  { 
    id: 'r1', producto: 'Pan Aliñado Familiar', icono: '🍞', rendimiento: 1,
    ingredientes: [
      { nombre: 'Harina de Trigo', cantidad: 250, unidad: 'g', stockActual: 12000, costoUnitario: 0.005 },
      { nombre: 'Azúcar Refinada', cantidad: 30, unidad: 'g', stockActual: 25000, costoUnitario: 0.004 },
      { nombre: 'Mantequilla Premium', cantidad: 50, unidad: 'g', stockActual: 5000, costoUnitario: 0.02 },
      { nombre: 'Huevos Tipo A', cantidad: 1, unidad: 'unidad', stockActual: 360, costoUnitario: 600 },
    ],
    costoTotal: 250*0.005 + 30*0.004 + 50*0.02 + 1*600,
    precioVenta: 5000,
    vendidosHoy: 45,
    producidosHoy: 50,
  },
  { 
    id: 'r2', producto: 'Torta Tres Leches', icono: '🍰', rendimiento: 1,
    ingredientes: [
      { nombre: 'Harina de Trigo', cantidad: 100, unidad: 'g', stockActual: 12000, costoUnitario: 0.005 },
      { nombre: 'Azúcar Refinada', cantidad: 80, unidad: 'g', stockActual: 25000, costoUnitario: 0.004 },
      { nombre: 'Huevos Tipo A', cantidad: 2, unidad: 'unidad', stockActual: 360, costoUnitario: 600 },
    ],
    costoTotal: 100*0.005 + 80*0.004 + 2*600,
    precioVenta: 7500,
    vendidosHoy: 12,
    producidosHoy: 15,
  },
  { 
    id: 'r3', producto: 'Croissant', icono: '🥐', rendimiento: 1,
    ingredientes: [
      { nombre: 'Harina de Trigo', cantidad: 200, unidad: 'g', stockActual: 12000, costoUnitario: 0.005 },
      { nombre: 'Mantequilla Premium', cantidad: 100, unidad: 'g', stockActual: 5000, costoUnitario: 0.02 },
    ],
    costoTotal: 200*0.005 + 100*0.02,
    precioVenta: 3200,
    vendidosHoy: 20,
    producidosHoy: 25,
  },
]

// Calcular consumo total de ingredientes según ventas del día
function calcularConsumoTotal() {
  const consumo: { [key: string]: { cantidad: number, unidad: string, stockActual: number, costoUnitario: number } } = {}
  
  recetas.forEach(r => {
    r.ingredientes.forEach(ing => {
      if (!consumo[ing.nombre]) {
        consumo[ing.nombre] = { cantidad: 0, unidad: ing.unidad, stockActual: ing.stockActual, costoUnitario: ing.costoUnitario }
      }
      consumo[ing.nombre].cantidad += ing.cantidad * r.vendidosHoy
    })
  })
  
  return Object.entries(consumo).map(([nombre, datos]) => ({
    nombre,
    ...datos,
    diasRestantes: Math.floor(datos.stockActual / (datos.cantidad || 1)),
    urgente: datos.stockActual < datos.cantidad * 3
  }))
}

const consumoTotal = calcularConsumoTotal()

export default function ProduccionPage() {
  const [tab, setTab] = useState<'recetas'|'produccion'|'compras'>('recetas')
  const [showReceta, setShowReceta] = useState<string | null>(null)
  const [cantidadProducir, setCantidadProducir] = useState<{[key: string]: number}>({})

  function getUrgenciaColor(dias: number) {
    if (dias <= 1) return 'bg-red-50 text-red-700 border-red-300'
    if (dias <= 3) return 'bg-amber-50 text-amber-700 border-amber-300'
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }

  function descargarListaCompras() {
    var csv = '\uFEFFIngrediente,Cantidad Necesaria,Unidad,Stock Actual,Dias Restantes,Urgente\n'
    consumoTotal.forEach(c => {
      csv += c.nombre + ',' + c.cantidad.toLocaleString() + ',' + c.unidad + ',' + c.stockActual.toLocaleString() + ',' + c.diasRestantes + ',' + (c.urgente ? 'SI' : 'NO') + '\n'
    })
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url; a.download = 'lista_compras_' + new Date().toISOString().split('T')[0] + '.csv'; a.click()
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1"><h1 className="text-xl font-bold">🏭 Producción</h1><p className="text-stone-400 text-xs">Recetas, producción y compras</p></div>
        </div>
        <div className="flex gap-1 bg-stone-700 rounded-xl p-1">
          {[
            { id: 'recetas' as const, label: 'Recetas', icon: Beaker },
            { id: 'produccion' as const, label: 'Producción', icon: ChefHat },
            { id: 'compras' as const, label: 'Compras', icon: ShoppingCart },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={'flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ' + (tab === t.id ? 'bg-white text-stone-800' : 'text-stone-300')}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4">
        {/* TAB RECETAS */}
        {tab === 'recetas' && (
          <div className="space-y-3">
            {recetas.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="p-4 cursor-pointer" onClick={() => setShowReceta(showReceta === r.id ? null : r.id)}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{r.icono}</span>
                      <div>
                        <h3 className="font-bold text-stone-900">{r.producto}</h3>
                        <p className="text-xs text-stone-400">Rendimiento: {r.rendimiento} unidad(es)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-stone-400">Costo unitario</p>
                      <p className="font-bold text-amber-600">${Math.round(r.costoTotal).toLocaleString()}</p>
                      <p className="text-xs text-stone-400">Precio venta: <span className="text-emerald-600 font-bold">${r.precioVenta.toLocaleString()}</span></p>
                      <p className="text-xs text-emerald-600 font-medium">Ganancia: ${(r.precioVenta - Math.round(r.costoTotal)).toLocaleString()} ({(r.precioVenta / Math.round(r.costoTotal) * 100 - 100).toFixed(0)}%)</p>
                    </div>
                  </div>
                </div>
                
                {showReceta === r.id && (
                  <div className="border-t border-stone-200 p-4 bg-stone-50">
                    <h4 className="font-semibold text-stone-700 text-sm mb-2">📋 Ingredientes por unidad</h4>
                    {r.ingredientes.map(ing => (
                      <div key={ing.nombre} className="flex justify-between items-center py-1.5 text-sm border-b border-stone-100 last:border-0">
                        <span className="text-stone-600">{ing.nombre}</span>
                        <span className="font-medium text-stone-800">{ing.cantidad.toLocaleString()} {ing.unidad}</span>
                      </div>
                    ))}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white rounded-xl p-2 text-center">
                        <p className="text-stone-400">Vendidos hoy</p><p className="font-bold text-stone-800">{r.vendidosHoy}</p>
                      </div>
                      <div className="bg-white rounded-xl p-2 text-center">
                        <p className="text-stone-400">Producidos hoy</p><p className="font-bold text-stone-800">{r.producidosHoy}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB PRODUCCIÓN */}
        {tab === 'produccion' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-stone-200">
              <h3 className="font-bold text-stone-900 mb-3">📊 Resumen del día</h3>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-stone-50 rounded-xl p-3">
                  <p className="text-stone-400">Productos</p><p className="text-xl font-bold text-stone-800">{recetas.length}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3">
                  <p className="text-emerald-500">Producidos</p><p className="text-xl font-bold text-emerald-600">{recetas.reduce((s, r) => s + r.producidosHoy, 0)}</p>
                </div>
                <div className="bg-sky-50 rounded-xl p-3">
                  <p className="text-sky-500">Vendidos</p><p className="text-xl font-bold text-sky-600">{recetas.reduce((s, r) => s + r.vendidosHoy, 0)}</p>
                </div>
              </div>
            </div>

            {recetas.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-4 border border-stone-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{r.icono}</span>
                  <div className="flex-1"><h3 className="font-bold text-stone-900">{r.producto}</h3></div>
                  <span className="text-sm text-stone-500">Producidos: {r.producidosHoy}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={cantidadProducir[r.id] || ''} 
                    onChange={e => setCantidadProducir({...cantidadProducir, [r.id]: Number(e.target.value)})}
                    placeholder="Cantidad a producir"
                    className="flex-1 p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 outline-none"
                  />
                  <button 
                    onClick={() => alert('✅ Orden de producción: ' + (cantidadProducir[r.id] || 0) + ' unidades de ' + r.producto)}
                    disabled={!cantidadProducir[r.id]}
                    className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-30"
                  >
                    Producir
                  </button>
                </div>
                {cantidadProducir[r.id] > 0 && (
                  <div className="mt-3 bg-amber-50 rounded-xl p-3 text-xs">
                    <p className="font-medium text-amber-800">📋 Ingredientes necesarios para {cantidadProducir[r.id]} unidades:</p>
                    {r.ingredientes.map(ing => (
                      <div key={ing.nombre} className="flex justify-between mt-1">
                        <span>{ing.nombre}</span>
                        <span className="font-bold">{(ing.cantidad * cantidadProducir[r.id]).toLocaleString()} {ing.unidad}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB COMPRAS */}
        {tab === 'compras' && (
          <div className="space-y-4">
            <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
              <h3 className="font-bold text-red-700 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Ingredientes Urgentes</h3>
              <p className="text-xs text-red-500 mb-3">Se agotarán en menos de 3 días según el consumo actual</p>
              {consumoTotal.filter(c => c.urgente).map(c => (
                <div key={c.nombre} className="flex justify-between items-center py-1.5 text-sm">
                  <span className="text-red-700">{c.nombre}</span>
                  <span className="font-bold text-red-600">{c.diasRestantes} días restantes</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="p-4 bg-stone-50 border-b border-stone-200">
                <h3 className="font-bold text-stone-900">🛒 Lista de Compras Sugerida</h3>
                <p className="text-xs text-stone-400">Basado en ventas de hoy y stock actual</p>
              </div>
              {consumoTotal.map(c => (
                <div key={c.nombre} className={'p-4 border-b border-stone-100 ' + getUrgenciaColor(c.diasRestantes)}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-stone-800">{c.nombre}</h4>
                      <p className="text-xs text-stone-500">Consumo hoy: {c.cantidad.toLocaleString()} {c.unidad} | Stock: {c.stockActual.toLocaleString()} {c.unidad}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-stone-400">Días restantes</p>
                      <p className="font-bold text-lg">{c.diasRestantes}</p>
                    </div>
                  </div>
                  {c.diasRestantes <= 3 && (
                    <p className="text-xs text-red-500 mt-1">⚠️ Pedir {Math.ceil(c.cantidad * 3 - c.stockActual)} {c.unidad} para 3 días</p>
                  )}
                </div>
              ))}
            </div>

            <button onClick={descargarListaCompras} className="w-full bg-emerald-500 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2">
              <Download className="w-5 h-5" /> Descargar Lista de Compras (Excel)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
