'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Package, TrendingUp, ArrowLeft, Star } from 'lucide-react'

interface DemoConfig {
  tipo: string
  icono: string
  color: string
  productos: Array<{ nombre: string; precio: number; icono: string }>
  beneficios: string[]
  modulos: string[]
}

export default function DemoNegocioPage({ config }: { config: DemoConfig }) {
  const [mostrarBeneficios, setMostrarBeneficios] = useState(false)

  return (
    <div className="min-h-screen bg-stone-50">
      <header className={config.color + ' text-white p-5'}>
        <div className="flex items-center gap-3 mb-4">
          <Link href="/demo" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold">{config.icono} Demo {config.tipo}</h1>
            <p className="text-white/70 text-sm">Asi funciona SIGEA en tu {config.tipo.toLowerCase()}</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* PRODUCTOS DEMO */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200">
          <h2 className="font-bold text-stone-800 mb-3 flex items-center gap-2"><Package className="w-5 h-5" /> Productos de ejemplo</h2>
          <div className="grid grid-cols-2 gap-2">
            {config.productos.map((p, i) => (
              <div key={i} className="bg-stone-50 rounded-xl p-3 text-center">
                <span className="text-3xl block mb-1">{p.icono}</span>
                <p className="text-sm font-medium text-stone-800">{p.nombre}</p>
                <p className="text-emerald-600 font-bold">${String(p.precio)()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BENEFICIOS */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200">
          <h2 className="font-bold text-stone-800 mb-3 flex items-center gap-2"><Star className="w-5 h-5 text-amber-500" /> Beneficios para tu {config.tipo}</h2>
          <div className="space-y-2">
            {config.beneficios.map((b, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-emerald-50 rounded-lg">
                <span className="text-emerald-500 font-bold">✓</span>
                <span className="text-sm text-stone-700">{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MÓDULOS INCLUIDOS */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200">
          <h2 className="font-bold text-stone-800 mb-3">Modulos incluidos</h2>
          <div className="flex flex-wrap gap-2">
            {config.modulos.map(m => (
              <span key={m} className="bg-stone-100 text-stone-700 px-3 py-1 rounded-full text-xs font-medium">{m}</span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <a href="/registro" className="block w-full bg-emerald-500 text-white rounded-2xl py-4 font-bold text-lg text-center hover:bg-emerald-600 transition">
          🚀 Probar SIGEA para {config.tipo} - Gratis
        </a>
        <p className="text-center text-xs text-stone-400">Sin tarjeta de credito · Configuracion en minutos</p>
      </div>
    </div>
  )
}

