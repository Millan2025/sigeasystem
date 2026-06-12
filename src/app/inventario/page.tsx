'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Search, Plus, Star, AlertTriangle, TrendingDown, TrendingUp, Package, Filter } from 'lucide-react'

interface ProductoInv {
  id: string
  nombre: string
  icono: string
  categoria: string
  stock: number
  stockMin: number
  precio: number
  costo: number
  ventasDiarias: number
  importancia: number
  esPeso: boolean
  precioPorKg?: number
  proveedor: string
  diasParaAgotar: number
}

const inventarioDemo: ProductoInv[] = [
  { id: '1', nombre: 'Pan AliÃ±ado Familiar', icono: 'ðŸž', categoria: 'Panaderia', stock: 45, stockMin: 20, precio: 5000, costo: 1800, ventasDiarias: 28, importancia: 5, esPeso: false, proveedor: 'Harinas El Trigo', diasParaAgotar: 1.6 },
  { id: '2', nombre: 'Torta Tres Leches', icono: 'ðŸ°', categoria: 'Pasteleria', stock: 8, stockMin: 5, precio: 7500, costo: 3200, ventasDiarias: 4, importancia: 4, esPeso: false, proveedor: 'Harinas El Trigo', diasParaAgotar: 2 },
  { id: '3', nombre: 'Coca-Cola 350ml', icono: 'ðŸ¥¤', categoria: 'Bebidas', stock: 48, stockMin: 12, precio: 3500, costo: 2800, ventasDiarias: 15, importancia: 3, esPeso: false, proveedor: 'Coca-Cola FEMSA', diasParaAgotar: 3.2 },
  { id: '4', nombre: 'Cafe Tinto 7oz', icono: 'â˜•', categoria: 'Bebidas', stock: 100, stockMin: 20, precio: 1800, costo: 600, ventasDiarias: 45, importancia: 5, esPeso: false, proveedor: 'Cafe Colombiano', diasParaAgotar: 2.2 },
  { id: '5', nombre: 'Harina de Trigo (kg)', icono: 'ðŸŒ¾', categoria: 'Insumos', stock: 12, stockMin: 5, precio: 0, costo: 3200, ventasDiarias: 8, importancia: 5, esPeso: true, precioPorKg: 3200, proveedor: 'Harinas El Trigo', diasParaAgotar: 1.5 },
  { id: '6', nombre: 'Queso Campesino (kg)', icono: 'ðŸ§€', categoria: 'Lacteos', stock: 5, stockMin: 2, precio: 0, costo: 18000, ventasDiarias: 3, importancia: 4, esPeso: true, precioPorKg: 28000, proveedor: 'Lacteos La Finca', diasParaAgotar: 1.6 },
  { id: '7', nombre: 'Tomate Chonto (kg)', icono: 'ðŸ…', categoria: 'Verduras', stock: 10, stockMin: 3, precio: 0, costo: 2500, ventasDiarias: 6, importancia: 4, esPeso: true, precioPorKg: 5000, proveedor: 'Fruver El Campo', diasParaAgotar: 1.6 },
  { id: '8', nombre: 'Aguacate Hass (kg)', icono: 'ðŸ¥‘', categoria: 'Verduras', stock: 15, stockMin: 5, precio: 0, costo: 4000, ventasDiarias: 8, importancia: 3, esPeso: true, precioPorKg: 8000, proveedor: 'Fruver El Campo', diasParaAgotar: 1.8 },
  { id: '9', nombre: 'Jugo Natural', icono: 'ðŸ§ƒ', categoria: 'Bebidas', stock: 3, stockMin: 10, precio: 4000, costo: 2200, ventasDiarias: 6, importancia: 2, esPeso: false, proveedor: 'Jugos del Valle', diasParaAgotar: 0.5 },
  { id: '10', nombre: 'Croissant', icono: 'ðŸ¥', categoria: 'Panaderia', stock: 25, stockMin: 10, precio: 3200, costo: 1100, ventasDiarias: 12, importancia: 3, esPeso: false, proveedor: 'Harinas El Trigo', diasParaAgotar: 2 },
]

export default function InventarioPage() {
  const [busqueda, setBusqueda] = useState('')
  const [catFilter, setCatFilter] = useState('Todas')
  const [alertaFilter, setAlertaFilter] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [ordenarPor, setOrdenarPor] = useState<'importancia'|'dias'|'nombre'>('importancia')

  const cats = ['Todas', 'Panaderia', 'Pasteleria', 'Bebidas', 'Lacteos', 'Verduras', 'Insumos']

  var filtrado = inventarioDemo.filter(function(p: ProductoInv) {
    if (catFilter !== 'Todas' && p.categoria !== catFilter) return false
    if (busqueda && !p.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false
    if (alertaFilter && p.diasParaAgotar > 2) return false
    return true
  })

  filtrado.sort(function(a: ProductoInv, b: ProductoInv) {
    if (ordenarPor === 'importancia') return b.importancia - a.importancia
    if (ordenarPor === 'dias') return a.diasParaAgotar - b.diasParaAgotar
    return a.nombre.localeCompare(b.nombre)
  })

  function getAlertaColor(dias: number) {
    if (dias <= 1) return 'bg-red-100 text-red-700 border-red-300'
    if (dias <= 2) return 'bg-amber-100 text-amber-700 border-amber-300'
    return 'bg-emerald-100 text-emerald-700 border-emerald-300'
  }

  function getAlertaTexto(dias: number) {
    if (dias <= 1) return 'URGENTE'
    if (dias <= 2) return 'Pedir ya'
    return 'OK'
  }

  function descargarInventario() {
    var csv = '\uFEFFProducto,Categoria,Stock,Stock Min,Precio,Costo,Ventas/dia,Importancia,Dias para agotar,Proveedor\n'
    filtrado.forEach(function(p: ProductoInv) {
      csv += p.nombre + ',' + p.categoria + ',' + p.stock + ',' + p.stockMin + ',' + p.precio + ',' + p.costo + ',' + p.ventasDiarias + ',' + p.importancia + ',' + p.diasParaAgotar.toFixed(1) + ',' + p.proveedor + '\n'
    })
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = 'inventario_' + new Date().toISOString().split('T')[0] + '.csv'
    a.click()
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1"><h1 className="text-xl font-bold">ðŸ“¦ Inventario</h1></div>
          <button onClick={descargarInventario} className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1"><Download className="w-4 h-4" /> Excel</button>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar producto..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 text-white placeholder-white/50 text-sm border border-white/20" />
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-1 whitespace-nowrap"><Plus className="w-4 h-4" /> Agregar</button>
        </div>
      </header>

      <div className="p-3 space-y-3">
        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto">
          {cats.map(function(c: string) { return <button key={c} onClick={() => setCatFilter(c)} className={'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ' + (catFilter === c ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 border border-stone-200')}>{c}</button> })}
        </div>

        <div className="flex gap-2 items-center">
          <button onClick={() => setAlertaFilter(!alertaFilter)} className={'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ' + (alertaFilter ? 'bg-red-500 text-white' : 'bg-white text-stone-600 border border-stone-200')}>
            <AlertTriangle className="w-3 h-3" /> Solo urgentes
          </button>
          <select value={ordenarPor} onChange={e => setOrdenarPor(e.target.value as any)} className="bg-white border border-stone-200 rounded-full px-3 py-1.5 text-xs text-stone-600">
            <option value="importancia">Por importancia</option>
            <option value="dias">Por urgencia</option>
            <option value="nombre">Por nombre</option>
          </select>
        </div>

        {/* Resumen rÃ¡pido */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white rounded-xl p-3 border border-stone-200">
            <p className="text-xs text-stone-400">Productos</p>
            <p className="text-xl font-bold text-stone-800">{inventarioDemo.length}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 border border-red-200">
            <p className="text-xs text-red-500">Urgentes</p>
            <p className="text-xl font-bold text-red-600">{inventarioDemo.filter(function(p: ProductoInv) { return p.diasParaAgotar <= 1 }).length}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
            <p className="text-xs text-amber-500">Por pedir</p>
            <p className="text-xl font-bold text-amber-600">{inventarioDemo.filter(function(p: ProductoInv) { return p.diasParaAgotar > 1 && p.diasParaAgotar <= 2 }).length}</p>
          </div>
        </div>

        {/* Lista */}
        <div className="space-y-2">
          {filtrado.map(function(p: ProductoInv) { return (
            <div key={p.id} className={'bg-white rounded-2xl p-4 border-2 ' + getAlertaColor(p.diasParaAgotar)}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{p.icono}</span>
                  <div>
                    <h3 className="font-semibold text-stone-800 text-sm">{p.nombre}</h3>
                    <p className="text-xs text-stone-400">{p.categoria} â€¢ {p.proveedor}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(function(e: number) { return <Star key={e} className={'w-3 h-3 ' + (e <= p.importancia ? 'fill-amber-400 text-amber-400' : 'text-stone-300')} /> })}
                  </div>
                  <span className={'text-xs font-bold px-2 py-0.5 rounded-full ' + getAlertaColor(p.diasParaAgotar)}>{getAlertaTexto(p.diasParaAgotar)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div><p className="text-stone-400">Stock</p><p className="font-bold text-stone-800">{p.stock}{p.esPeso ? ' kg' : ' u'}</p></div>
                <div><p className="text-stone-400">Min</p><p className="font-bold text-stone-800">{p.stockMin}</p></div>
                <div><p className="text-stone-400">Ventas/dia</p><p className="font-bold text-stone-800">{p.ventasDiarias}</p></div>
                <div><p className="text-stone-400">Se acaba en</p><p className={'font-bold ' + (p.diasParaAgotar <= 1 ? 'text-red-600' : 'text-stone-800')}>{p.diasParaAgotar.toFixed(1)} d</p></div>
              </div>

              {p.diasParaAgotar <= 2 && (
                <div className="mt-3 bg-amber-50 rounded-xl p-3 text-sm">
                  <p className="font-medium text-amber-800">ðŸ“‹ Pedido sugerido: {Math.ceil(p.ventasDiarias * 7 - p.stock)} unidades</p>
                  <p className="text-xs text-amber-600">Proveedor: {p.proveedor}</p>
                </div>
              )}
            </div>
          )})}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">+ Agregar Producto</h3>
            <input placeholder="Nombre del producto" className="w-full p-3 bg-stone-100 rounded-xl mb-2 text-sm" />
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input placeholder="Precio" type="number" className="p-3 bg-stone-100 rounded-xl text-sm" />
              <input placeholder="Costo" type="number" className="p-3 bg-stone-100 rounded-xl text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input placeholder="Stock inicial" type="number" className="p-3 bg-stone-100 rounded-xl text-sm" />
              <input placeholder="Stock minimo" type="number" className="p-3 bg-stone-100 rounded-xl text-sm" />
            </div>
            <select className="w-full p-3 bg-stone-100 rounded-xl mb-2 text-sm">
              <option>Categoria</option>
              <option>Panaderia</option><option>Pasteleria</option><option>Bebidas</option><option>Lacteos</option><option>Verduras</option><option>Insumos</option>
            </select>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-stone-500">Importancia:</span>
              {[1,2,3,4,5].map(function(e: number) { return <button key={e} className="text-lg">{e <= 3 ? 'â­' : 'â˜†'}</button> })}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-stone-100 py-3 rounded-xl font-medium">Cancelar</button>
              <button className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

