'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Plus, X, ChefHat, ShoppingCart, AlertTriangle, Beaker } from 'lucide-react'

interface Producto {
  id: string; nombre: string; icono: string; categoria: string; stock: number; precio: number; precio_compra: number;
  es_producido: boolean; unidad: string; proveedor: string;
}

export default function ProduccionPage() {
  const [tab, setTab] = useState<'recetas'|'produccion'|'compras'>('recetas')
  const [productos, setProductos] = useState<Producto[]>([])
  const [cantidadProducir, setCantidadProducir] = useState<{[key: string]: number}>({})
  const [loading, setLoading] = useState(true)
  const [tenantId, setTenantId] = useState('7e045520-5e36-4e3f-a39f-10ea7d6dce76')

  // Obtener tenant del usuario o de la URL
  useEffect(() => {
    // En un entorno real, se obtiene del contexto de autenticación
    // Por ahora usamos el tenant por defecto
    const url = new URL(window.location.href)
    const tenant = url.searchParams.get('tenant') || '7e045520-5e36-4e3f-a39f-10ea7d6dce76'
    setTenantId(tenant)
    cargarProductos(tenant)
  }, [])

  const cargarProductos = async (tenant: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/products?tenant=${tenant}`)
      const data = await res.json()
      if (data.success) {
        // Filtrar solo productos que son producidos (es_producido=true) o todos si no tienen ese campo
        const producidos = data.data.filter((p: any) => p.es_producido !== false) // asumimos que si no tiene el campo, es producido
        setProductos(producidos)
      }
    } catch (e) {
      console.error('Error cargando productos', e)
    }
    setLoading(false)
  }

  const totalProducidos = productos.reduce((s, p) => s + (p.stock || 0), 0)

  function descargarCompras() {
    let csv = '\uFEFFProducto,Cantidad a producir,Ingredientes\n'
    productos.forEach(p => {
      const cant = cantidadProducir[p.id] || 0
      csv += `${p.nombre},${cant},${p.proveedor || 'Sin ingredientes'}\n`
    })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'produccion.csv'; a.click()
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1"><h1 className="text-xl font-bold">🏭 Producción</h1></div>
          <button onClick={descargarCompras} className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1">
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>
        <div className="flex gap-1 bg-stone-700 rounded-xl p-1">
          {[{ id: 'recetas', label: 'Recetas', icon: Beaker }, { id: 'produccion', label: 'Producción', icon: ChefHat }, { id: 'compras', label: 'Compras', icon: ShoppingCart }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={'flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ' + (tab === t.id ? 'bg-white text-stone-800' : 'text-stone-300')}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4">
        {tab === 'recetas' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-center text-xs mb-3">
              <div className="bg-white rounded-xl p-3 border"><p className="text-stone-400">Productos</p><p className="text-xl font-bold">{productos.length}</p></div>
              <div className="bg-emerald-50 rounded-xl p-3 border"><p className="text-emerald-500">Stock total</p><p className="text-xl font-bold text-emerald-600">{totalProducidos}</p></div>
            </div>
            {loading ? (
              <div className="text-center py-8 text-stone-500">Cargando productos...</div>
            ) : productos.length === 0 ? (
              <div className="text-center py-8 text-stone-500">No hay productos para producción. Carga productos desde el Admin Master.</div>
            ) : (
              productos.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{p.icono || '📦'}</span>
                      <div>
                        <h3 className="font-bold text-stone-900">{p.nombre}</h3>
                        <p className="text-xs text-stone-500">{p.categoria} · Stock: {p.stock} {p.unidad}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-stone-400">Costo</p>
                      <p className="font-bold text-amber-600">${(p.precio_compra || 0).toLocaleString()}</p>
                      <p className="text-xs text-emerald-600">Venta: ${(p.precio || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t text-xs text-stone-500">
                    Proveedor: {p.proveedor || 'No especificado'} · {p.es_producido ? '✅ Producido' : '📦 Comprado'}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'produccion' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white rounded-xl p-3 border"><p className="text-stone-400">Productos</p><p className="text-xl font-bold">{productos.length}</p></div>
              <div className="bg-emerald-50 rounded-xl p-3 border"><p className="text-emerald-500">Stock</p><p className="text-xl font-bold text-emerald-600">{totalProducidos}</p></div>
              <div className="bg-sky-50 rounded-xl p-3 border"><p className="text-sky-500">Pendientes</p><p className="text-xl font-bold text-sky-600">0</p></div>
            </div>
            {productos.map(p => (
              <div key={p.id} className="bg-white rounded-2xl p-4 border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{p.icono || '📦'}</span>
                  <h3 className="font-bold">{p.nombre}</h3>
                  <span className="text-xs text-stone-500 ml-auto">Stock: {p.stock}</span>
                </div>
                <div className="flex gap-2">
                  <input type="number" value={cantidadProducir[p.id] || ''} onChange={e => setCantidadProducir({...cantidadProducir, [p.id]: Number(e.target.value)})} placeholder="Cantidad" className="flex-1 p-2 bg-stone-50 border rounded-lg text-sm" />
                  <button onClick={() => alert(`Producir ${cantidadProducir[p.id] || 0} unidades de ${p.nombre}`)} className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold">Producir</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'compras' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border p-4">
              <h3 className="font-bold mb-2">🛒 Lista de Compras</h3>
              {productos.filter(p => (p.stock || 0) < 10).map(p => (
                <p key={p.id} className="text-sm flex justify-between">
                  <span>{p.nombre}</span>
                  <span className="font-bold text-amber-600">Stock: {p.stock} {p.unidad}</span>
                </p>
              ))}
              {productos.filter(p => (p.stock || 0) < 10).length === 0 && (
                <p className="text-stone-500 text-sm">Todos los productos tienen stock suficiente.</p>
              )}
            </div>
            <button onClick={descargarCompras} className="w-full bg-emerald-500 text-white rounded-2xl py-4 font-bold">
              <Download className="w-5 h-5 inline mr-2" />Descargar Lista
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
