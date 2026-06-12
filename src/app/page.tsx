'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, DollarSign, Package, Users, Truck, BarChart3, TrendingUp, Share2 } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [cajaAbierta, setCajaAbierta] = useState(true)

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Panaderia Doña Rosa</h1>
            <p className="text-stone-300 text-sm">{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <span className={'px-4 py-2 rounded-full text-sm font-semibold ' + (cajaAbierta ? 'bg-emerald-500' : 'bg-red-500')}>
            {cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}
          </span>
        </div>
      </header>
      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white cursor-pointer" onClick={() => router.push('/finanzas')}>
          <p className="text-emerald-100 text-sm">VENTAS DE HOY</p>
          <p className="text-4xl font-bold mt-1">$450,000</p>
          <p className="text-sm text-emerald-100 mt-2">24 transacciones - Efectivo 65%</p>
        </div>
        <h2 className="font-semibold text-stone-700 mt-4">ACCESOS RAPIDOS</h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push('/pos')} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-left hover:bg-emerald-100">
            <ShoppingCart className="w-7 h-7 text-emerald-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Nueva Venta</span>
            <span className="text-xs text-stone-500">POS Tactil con Voz</span>
          </button>
          <button onClick={() => setCajaAbierta(!cajaAbierta)} className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-left hover:bg-blue-100">
            <DollarSign className="w-7 h-7 text-blue-600 mb-2" />
            <span className="font-semibold text-stone-800 block">{cajaAbierta ? 'Cerrar Caja' : 'Abrir Caja'}</span>
            <span className="text-xs text-stone-500">Control de caja</span>
          </button>
          <button onClick={() => router.push('/inventario')} className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left hover:bg-amber-100">
            <Package className="w-7 h-7 text-amber-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Inventario</span>
            <span className="text-xs text-stone-500">Stock, alarmas, pedidos</span>
          </button>
          <button onClick={() => router.push('/personal')} className="bg-purple-50 border border-purple-200 rounded-2xl p-5 text-left hover:bg-purple-100">
            <Users className="w-7 h-7 text-purple-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Personal</span>
            <span className="text-xs text-stone-500">Empleados y nomina</span>
          </button>
          <button onClick={() => router.push('/pedidos')} className="bg-sky-50 border border-sky-200 rounded-2xl p-5 text-left hover:bg-sky-100">
            <Truck className="w-7 h-7 text-sky-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Pedidos</span>
            <span className="text-xs text-stone-500">Domicilios activos</span>
          </button>
          <button onClick={() => router.push('/reportes')} className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-left hover:bg-rose-100">
            <BarChart3 className="w-7 h-7 text-rose-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Reportes</span>
            <span className="text-xs text-stone-500">Estadisticas y graficos</span>
          </button>
          <button onClick={() => router.push('/finanzas')} className="bg-teal-50 border border-teal-200 rounded-2xl p-5 text-left hover:bg-teal-100">
            <TrendingUp className="w-7 h-7 text-teal-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Finanzas</span>
            <span className="text-xs text-stone-500">P&G, Balance, Cierre</span>
          </button>
          <button onClick={() => router.push('/tienda')} className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-left hover:bg-orange-100">
            <ShoppingCart className="w-7 h-7 text-orange-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Tienda</span>
            <span className="text-xs text-stone-500">Vista del cliente</span>
          </button>
        </div>
        <button onClick={() => router.push('/admin')} className="w-full bg-stone-800 text-white rounded-2xl py-4 font-bold mt-4">
          🔐 Admin Master
        </button>
      </div>
    </div>
  )
}