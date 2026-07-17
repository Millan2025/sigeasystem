'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Plus, X, ChefHat, ShoppingCart, AlertTriangle, Beaker } from 'lucide-react'

interface Receta {
  id: string; producto: string; icono: string; costoTotal: number; precioVenta: number;
  vendidosHoy: number; producidosHoy: number; ingredientes: Array<{ nombre: string; cantidad: number; unidad: string }>;
}

export default function ProduccionPage() {
  const [tab, setTab] = useState<'recetas'|'produccion'|'compras'>('recetas')
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [cantidadProducir, setCantidadProducir] = useState<{[key: string]: number}>({})

  useEffect(() => {
  const tenantId = '7e045520-5e36-4e3f-a39f-10ea7d6dce76'; // Obtener del contexto
  fetch(`/api/products?tenant=${tenantId}`)
    .then(r => r.json())
    .then(d => {
      if (d.success) {
        const recetas = d.data.map((p: any) => ({
          id: p.id,
          producto: p.nombre,
          icono: p.icono || '🍞',
          costoTotal: p.precio_compra || 0,
          precioVenta: p.precio || 0,
          vendidosHoy: 0,
          producidosHoy: 0,
          ingredientes: []
        }));
        setRecetas(recetas);
      }
    })
    .catch(() => {});
}, []);)

  const totalProducidos = recetas.reduce((s, r) => s + r.producidosHoy, 0)
  const totalVendidos = recetas.reduce((s, r) => s + r.vendidosHoy, 0)

  function descargarCompras() {
    let csv = '\uFEFFIngrediente,Cantidad,Unidad\n'
    recetas.forEach(r => r.ingredientes.forEach(i => { csv += i.nombre + ',' + (i.cantidad * r.vendidosHoy) + ',' + i.unidad + '\n' }))
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'compras.csv'; a.click()
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3 mb-4"><Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link><div className="flex-1"><h1 className="text-xl font-bold">🏭 Producción</h1></div></div>
        <div className="flex gap-1 bg-stone-700 rounded-xl p-1">
          {[{ id: 'recetas', label: 'Recetas', icon: Beaker }, { id: 'produccion', label: 'Producción', icon: ChefHat }, { id: 'compras', label: 'Compras', icon: ShoppingCart }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={'flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ' + (tab === t.id ? 'bg-white text-stone-800' : 'text-stone-300')}><t.icon className="w-3.5 h-3.5" /> {t.label}</button>
          ))}
        </div>
      </header>
      <div className="p-4">
        {tab === 'recetas' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-center text-xs mb-3"><div className="bg-white rounded-xl p-3 border"><p className="text-stone-400">Recetas</p><p className="text-xl font-bold">{recetas.length}</p></div><div className="bg-emerald-50 rounded-xl p-3 border"><p className="text-emerald-500">Vendidos hoy</p><p className="text-xl font-bold text-emerald-600">{totalVendidos}</p></div></div>
            {recetas.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border p-4">
                <div className="flex justify-between items-center"><div className="flex items-center gap-2"><span className="text-3xl">{r.icono}</span><div><h3 className="font-bold text-stone-900">{r.producto}</h3></div></div><div className="text-right"><p className="text-xs text-stone-400">Costo</p><p className="font-bold text-amber-600">${r.costoTotal.toLocaleString()}</p><p className="text-xs text-emerald-600">Venta: ${r.precioVenta.toLocaleString()}</p></div></div>
                <div className="mt-2 pt-2 border-t"><p className="text-xs font-medium text-stone-500">Ingredientes:</p>{r.ingredientes.map(i => <p key={i.nombre} className="text-xs text-stone-600">{i.nombre}: {i.cantidad} {i.unidad}</p>)}</div>
              </div>
            ))}
          </div>
        )}
        {tab === 'produccion' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center text-xs"><div className="bg-white rounded-xl p-3 border"><p className="text-stone-400">Productos</p><p className="text-xl font-bold">{recetas.length}</p></div><div className="bg-emerald-50 rounded-xl p-3 border"><p className="text-emerald-500">Producidos</p><p className="text-xl font-bold text-emerald-600">{totalProducidos}</p></div><div className="bg-sky-50 rounded-xl p-3 border"><p className="text-sky-500">Vendidos</p><p className="text-xl font-bold text-sky-600">{totalVendidos}</p></div></div>
            {recetas.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-4 border">
                <div className="flex items-center gap-2 mb-2"><span className="text-2xl">{r.icono}</span><h3 className="font-bold">{r.producto}</h3></div>
                <div className="flex gap-2"><input type="number" value={cantidadProducir[r.id] || ''} onChange={e => setCantidadProducir({...cantidadProducir, [r.id]: Number(e.target.value)})} placeholder="Cantidad" className="flex-1 p-2 bg-stone-50 border rounded-lg text-sm" /><button onClick={() => alert('Producir ' + (cantidadProducir[r.id] || 0) + ' unidades')} className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold">Producir</button></div>
              </div>
            ))}
          </div>
        )}
        {tab === 'compras' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border p-4"><h3 className="font-bold mb-2">🛒 Lista de Compras</h3>{recetas.map(r => r.ingredientes.map(i => <p key={i.nombre} className="text-sm flex justify-between"><span>{i.nombre}</span><span className="font-bold">{i.cantidad * r.vendidosHoy} {i.unidad}</span></p>))}</div>
            <button onClick={descargarCompras} className="w-full bg-emerald-500 text-white rounded-2xl py-4 font-bold"><Download className="w-5 h-5 inline mr-2" />Descargar Lista</button>
          </div>
        )}
      </div>
    </div>
  )
}



