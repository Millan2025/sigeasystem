'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Search, Plus, Star, AlertTriangle, Package, X, Scale } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ProductoInv {
  id: string; nombre: string; icono: string; categoria: string; stock: number; stockMin: number;
  precio: number; costo: number; ventasDiarias: number; importancia: number;
  esPeso: boolean; precioPorKg?: number; proveedor: string; diasParaAgotar: number; unidad: string;
}

export default function InventarioPage() {
  const supabase = createClient()
  const [busqueda, setBusqueda] = useState('')
  const [catFilter, setCatFilter] = useState('Todas')
  const [alertaFilter, setAlertaFilter] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [ordenarPor, setOrdenarPor] = useState<'importancia'|'dias'|'nombre'>('importancia')
  const [productos, setProductos] = useState<ProductoInv[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarProductos()
  }, [])

  const cargarProductos = async () => {
    setLoading(true)
    try {
      // Obtener tenant_id del usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: userData } = await supabase
        .from('usuarios')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!userData) {
        setLoading(false)
        return
      }

      // Obtener productos de Supabase
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .order('nombre')

      if (error) {
        console.error('Error cargando productos:', error)
        setProductos([])
      } else {
        setProductos(data.map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          icono: p.icono || '📦',
          categoria: p.categoria || 'General',
          stock: Number(p.stock) || 0,
          stockMin: 5,
          precio: Number(p.precio) || 0,
          costo: Number(p.precio) * 0.4 || 0,
          ventasDiarias: 5,
          importancia: 3,
          esPeso: p.esPeso || false,
          precioPorKg: p.precioPorKg || 0,
          proveedor: '',
          diasParaAgotar: 10,
          unidad: p.unidad || 'unidad'
        })))
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const cats = ['Todas', 'Panadería', 'Pastelería', 'Bebidas', 'Lácteos', 'Verduras', 'Insumos', 'Tienda', 'Restaurante', 'Ferretería', 'Carnicería', 'Limpieza']
  
  const filtrados = productos.filter((p: ProductoInv) => {
    if (catFilter !== 'Todas' && p.categoria !== catFilter) return false
    if (busqueda && !p.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false
    if (alertaFilter && p.diasParaAgotar > 2) return false
    return true
  }).sort((a: ProductoInv, b: ProductoInv) => {
    if (ordenarPor === 'importancia') return b.importancia - a.importancia
    if (ordenarPor === 'dias') return a.diasParaAgotar - b.diasParaAgotar
    return a.nombre.localeCompare(b.nombre)
  })

  function getAlertaColor(dias: number) {
    if (dias <= 1) return 'bg-red-50 text-red-700 border-red-300'
    if (dias <= 2) return 'bg-amber-50 text-amber-700 border-amber-300'
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
  function getAlertaTexto(dias: number) { return dias <= 1 ? 'URGENTE' : dias <= 2 ? 'Pedir ya' : 'OK' }

  function descargarInventario() {
    if (productos.length === 0) return
    let csv = '\uFEFFSKU;NOMBRE;PRECIO;STOCK;CATEGORIA;UNIDAD\n'
    filtrados.forEach((p: ProductoInv) => { 
      csv += (p.id || '') + ';' + p.nombre + ';' + p.precio + ';' + p.stock + ';' + p.categoria + ';' + p.unidad + '\n' 
    })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = 'inventario_' + new Date().toISOString().split('T')[0] + '.csv'; a.click()
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1"><h1 className="text-xl font-bold">📦 Inventario</h1></div>
          <button onClick={descargarInventario} className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1"><Download className="w-4 h-4" /> Excel</button>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" /><input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar producto..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 text-white placeholder-white/50 text-sm border border-white/20" /></div>
          <button onClick={() => setShowAdd(true)} className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Agregar</button>
        </div>
      </header>
      <div className="p-3 space-y-3">
        <div className="flex gap-2 overflow-x-auto">{cats.map(c => <button key={c} onClick={() => setCatFilter(c)} className={'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ' + (catFilter === c ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 border border-stone-200')}>{c}</button>)}</div>
        <div className="flex gap-2 items-center flex-wrap">
          <button onClick={() => setAlertaFilter(!alertaFilter)} className={'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ' + (alertaFilter ? 'bg-red-500 text-white' : 'bg-white text-stone-600 border border-stone-200')}><AlertTriangle className="w-3 h-3" /> Solo urgentes</button>
          <select value={ordenarPor} onChange={e => setOrdenarPor(e.target.value as any)} className="bg-white border border-stone-200 rounded-full px-3 py-1.5 text-xs text-stone-600"><option value="importancia">Por importancia</option><option value="dias">Por urgencia</option><option value="nombre">Por nombre</option></select>
        </div>
        {loading ? (
          <div className="text-center py-8 text-stone-400">Cargando inventario...</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white rounded-xl p-3 border border-stone-200"><p className="text-xs text-stone-400">Productos</p><p className="text-xl font-bold text-stone-800">{productos.length}</p></div>
              <div className="bg-red-50 rounded-xl p-3 border border-red-200"><p className="text-xs text-red-500">Urgentes</p><p className="text-xl font-bold text-red-600">{productos.filter(p => p.diasParaAgotar <= 1).length}</p></div>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200"><p className="text-xs text-amber-500">Por pedir</p><p className="text-xl font-bold text-amber-600">{productos.filter(p => p.diasParaAgotar > 1 && p.diasParaAgotar <= 2).length}</p></div>
            </div>
            <div className="space-y-2">
              {filtrados.map(p => (
                <div key={p.id} className={'bg-white rounded-2xl p-4 border-2 ' + getAlertaColor(p.diasParaAgotar)}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2"><span className="text-3xl">{p.icono}</span><div><h3 className="font-semibold text-stone-800 text-sm">{p.nombre}</h3><p className="text-xs text-stone-400">{p.categoria} • {p.unidad}</p></div></div>
                    <div className="text-right"><div className="flex items-center gap-1">{[1,2,3,4,5].map(e => <Star key={e} className={'w-3 h-3 ' + (e <= p.importancia ? 'fill-amber-400 text-amber-400' : 'text-stone-300')} />)}</div><span className={'text-xs font-bold px-2 py-0.5 rounded-full ' + getAlertaColor(p.diasParaAgotar)}>{getAlertaTexto(p.diasParaAgotar)}</span></div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div><p className="text-stone-400">Stock</p><p className="font-bold text-stone-800">{p.stock} {p.unidad}</p></div>
                    <div><p className="text-stone-400">Precio</p><p className="font-bold text-stone-800">${p.precio.toLocaleString()}</p></div>
                    <div><p className="text-stone-400">Mínimo</p><p className="font-bold text-stone-800">{p.stockMin}</p></div>
                    <div><p className="text-stone-400">Se acaba en</p><p className={'font-bold ' + (p.diasParaAgotar <= 1 ? 'text-red-600' : 'text-stone-800')}>{p.diasParaAgotar.toFixed(1)} d</p></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-xl text-stone-900 mb-4">Agregar Producto</h2>
            <div className="space-y-3">
              <input placeholder="Nombre" className="w-full p-3 bg-stone-50 border rounded-xl text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Precio" className="p-3 bg-stone-50 border rounded-xl text-sm" />
                <input type="number" placeholder="Stock" className="p-3 bg-stone-50 border rounded-xl text-sm" />
              </div>
              <select className="w-full p-3 bg-stone-50 border rounded-xl text-sm">
                <option>Panadería</option><option>Tienda</option><option>Restaurante</option>
                <option>Ferretería</option><option>Carnicería</option><option>Bebidas</option>
              </select>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-stone-200 py-3 rounded-xl font-bold">Cancelar</button>
              <button onClick={() => { alert('Producto agregado'); setShowAdd(false) }} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
