'use client'

import { useState } from 'react'
import { DollarSign, ShoppingCart, AlertTriangle, TrendingUp, Package } from 'lucide-react'

const ultimasVentas = [
  { hora: '10:30 AM', producto: 'Pan Aliñado Familiar', total: 15000, metodo: 'Efectivo' },
  { hora: '10:15 AM', producto: 'Coca-Cola 350ml', total: 3500, metodo: 'Nequi' },
  { hora: '09:50 AM', producto: 'Torta Tres Leches', total: 22500, metodo: 'Efectivo' },
  { hora: '09:30 AM', producto: 'Café Tinto 7oz', total: 5400, metodo: 'Daviplata' },
]

const alertas = [
  { tipo: 'warning', mensaje: 'Harina de Trigo: 2.5 kg restantes (mínimo 5 kg)' },
  { tipo: 'danger', mensaje: 'Caja matutina sin cerrar - diferencia: -$12,000' },
]

export default function DashboardPage() {
  const [cajaAbierta, setCajaAbierta] = useState(true)

  return (
    <div className="min-h-screen bg-gray-950 p-4 text-white">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🍞 Panadería Doña Rosa</h1>
          <p className="text-sm text-gray-400">
            {new Date().toLocaleDateString('es-CO', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${cajaAbierta ? 'bg-green-600' : 'bg-red-600'}`}>
          {cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}
        </span>
      </header>

      <div className="mb-6 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-700 p-6">
        <p className="mb-1 text-sm text-green-200">VENTAS DE HOY</p>
        <p className="text-4xl font-bold">$450,000</p>
        <div className="mt-3 flex gap-4 text-sm text-green-100">
          <span>🛒 24 transacciones</span>
          <span>💵 Efectivo: 65%</span>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          ALERTAS
        </h2>
        {alertas.map((alerta, index) => (
          <div
            key={index}
            className={`mb-2 rounded-xl p-3 ${
              alerta.tipo === 'danger' ? 'border border-red-700 bg-red-900/50' : 'border border-yellow-700 bg-yellow-900/50'
            }`}
          >
            <p className="text-sm">{alerta.mensaje}</p>
          </div>
        ))}
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold">ACCIONES RÁPIDAS</h2>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex flex-col items-center gap-2 rounded-2xl bg-green-700 p-4">
            <ShoppingCart className="h-8 w-8" />
            <span className="font-bold">Nueva Venta</span>
          </button>
          <button
            onClick={() => setCajaAbierta(!cajaAbierta)}
            className="flex flex-col items-center gap-2 rounded-2xl bg-blue-700 p-4"
          >
            <DollarSign className="h-8 w-8" />
            <span className="font-bold">{cajaAbierta ? 'Cerrar Caja' : 'Abrir Caja'}</span>
          </button>
          <button className="flex flex-col items-center gap-2 rounded-2xl bg-orange-700 p-4">
            <Package className="h-8 w-8" />
            <span className="font-bold">Inventario</span>
          </button>
          <button className="flex flex-col items-center gap-2 rounded-2xl bg-purple-700 p-4">
            <TrendingUp className="h-8 w-8" />
            <span className="font-bold">Reportes</span>
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">ÚLTIMAS VENTAS</h2>
        <div className="space-y-2">
          {ultimasVentas.map((venta, index) => (
            <div key={index} className="flex items-center justify-between rounded-xl bg-gray-800 p-3">
              <div>
                <p className="text-sm font-semibold">{venta.producto}</p>
                <p className="text-xs text-gray-400">
                  {venta.hora} • {venta.metodo}
                </p>
              </div>
              <p className="font-bold text-green-400">${venta.total.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}