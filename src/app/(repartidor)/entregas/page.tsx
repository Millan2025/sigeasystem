'use client'

import { useState } from 'react'
import { MapPin, CheckCircle, Navigation, Phone } from 'lucide-react'

const pedidosAsignados = [
  { id: 'ord-001', direccion: 'Calle 45 #23-12, Barrio La Paz', total: 25000, cliente: 'Ana GarcÃ­a', telefono: '3124567890', distancia: '1.2 km' },
]

export default function EntregasPage() {
  const [pedidoActual, setPedidoActual] = useState(pedidosAsignados[0])
  const [entregado, setEntregado] = useState(false)

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-orange-500 to-red-500 p-6">
        <h1 className="text-2xl font-bold">ðŸ›µ Repartidor</h1>
        <p className="text-sm opacity-80">PanaderÃ­a DoÃ±a Rosa</p>
      </header>

      <div className="p-4">
        {!entregado && pedidoActual ? (
          <div className="rounded-2xl bg-gray-800 p-4">
            <h2 className="mb-3 text-lg font-bold">Pedido #{pedidoActual.id}</h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="h-4 w-4 text-red-400" />
                <span>{pedidoActual.direccion}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Phone className="h-4 w-4 text-green-400" />
                <span>
                  {pedidoActual.cliente} - {pedidoActual.telefono}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Navigation className="h-4 w-4 text-blue-400" />
                <span>{pedidoActual.distancia}</span>
              </div>
            </div>

            <p className="mt-4 text-2xl font-bold text-green-400">${pedidoActual.total.toLocaleString()}</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold">
                <Navigation className="h-4 w-4" /> Ver Ruta
              </button>
              <button
                onClick={() => setEntregado(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-bold"
              >
                <CheckCircle className="h-4 w-4" /> Entregado
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <span className="text-6xl">âœ…</span>
            <h2 className="mt-4 text-xl font-bold">Â¡Entrega completada!</h2>
            <p className="mt-2 text-gray-400">Esperando nuevo pedido...</p>
          </div>
        )}

        <div className="mt-4 rounded-2xl bg-gray-800 p-4">
          <h3 className="mb-2 font-bold">ðŸ’° Hoy</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold">5</p>
              <p className="text-xs text-gray-400">Entregas</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-400">$32,000</p>
              <p className="text-xs text-gray-400">Ganado</p>
            </div>
            <div>
              <p className="text-xl font-bold text-yellow-400">4.9</p>
              <p className="text-xs text-gray-400">â­ Rating</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
