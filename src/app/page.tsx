'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  LayoutDashboard, ShoppingCart, Package, Users, 
  Truck, BarChart3, Settings, LogOut, TrendingUp,
  DollarSign, AlertTriangle, Clock, ArrowRight,
  Store, ChefHat, Megaphone, Share2, QrCode
} from 'lucide-react'

const ventasHoy = { total: 450000, transacciones: 24, metodoTop: 'Efectivo' }
const alertas = [
  { tipo: 'warning', msg: 'Harina de Trigo: 2.5 kg restantes' },
  { tipo: 'danger', msg: 'Caja matutina sin cerrar' },
]
const ultimasVentas = [
  { hora: '10:30', producto: 'Pan Aliñado Familiar', total: 15000, metodo: 'Efectivo' },
  { hora: '10:15', producto: 'Coca-Cola 350ml', total: 3500, metodo: 'Nequi' },
  { hora: '09:50', producto: 'Torta Tres Leches', total: 22500, metodo: 'Efectivo' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [cajaAbierta, setCajaAbierta] = useState(true)
  const [showShare, setShowShare] = useState(false)

  const shareLinks = [
    { label: 'POS Vendedor', url: '/pos', icon: '💰', color: 'bg-emerald-600' },
    { label: 'Tienda Clientes', url: '/tienda', icon: '🛒', color: 'bg-amber-600' },
    { label: 'App Repartidor', url: '/entregas', icon: '🛵', color: 'bg-sky-600' },
  ]

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header elegante */}
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex justify-between items-center mb-1">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">🍞 Panadería Doña Rosa</h1>
            <p className="text-stone-300 text-sm font-light">
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowShare(!showShare)}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              cajaAbierta ? 'bg-emerald-500' : 'bg-red-500'
            }`}>
              {cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}
            </span>
          </div>
        </div>
      </header>

      {/* Panel de compartir */}
      {showShare && (
        <div className="bg-white mx-4 mt-4 p-5 rounded-2xl shadow-lg border border-stone-200">
          <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Compartir Accesos
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {shareLinks.map(link => (
              <div key={link.url} className="text-center">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://sigea-system.vercel.app${link.url}`)
                    alert('✅ Enlace copiado: ' + link.label)
                  }}
                  className={`${link.color} w-full text-white p-3 rounded-xl font-medium text-sm hover:opacity-90 transition`}
                >
                  <span className="text-2xl block mb-1">{link.icon}</span>
                  {link.label}
                </button>
                <button
                  onClick={() => {
                    const msg = `🔗 Accede a ${link.label}: https://sigea-system.vercel.app${link.url}`
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
                  }}
                  className="text-green-600 text-xs mt-1 hover:underline"
                >
                  📤 Enviar por WhatsApp
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Ventas de Hoy */}
        <div 
          onClick={() => router.push('/reportes')}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white cursor-pointer hover:shadow-lg transition"
        >
          <p className="text-emerald-100 text-sm font-light">VENTAS DE HOY</p>
          <p className="text-4xl font-bold mt-1">${ventasHoy.total.toLocaleString()}</p>
          <div className="flex gap-4 mt-3 text-sm text-emerald-100">
            <span>🛒 {ventasHoy.transacciones} transacciones</span>
            <span>💵 {ventasHoy.metodoTop} 65%</span>
          </div>
        </div>

        {/* Alertas */}
        <div className="space-y-2">
          {alertas.map((a, i) => (
            <div key={i} className={`p-3 rounded-xl ${
              a.tipo === 'danger' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
            }`}>
              <p className="text-sm text-stone-700 flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${a.tipo === 'danger' ? 'text-red-500' : 'text-amber-500'}`} />
                {a.msg}
              </p>
            </div>
          ))}
        </div>

        {/* Navegación Principal */}
        <h2 className="font-semibold text-stone-700 mt-4">ACCESOS RÁPIDOS</h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push('/pos')} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-left hover:bg-emerald-100 transition">
            <ShoppingCart className="w-7 h-7 text-emerald-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Nueva Venta</span>
            <span className="text-xs text-stone-500">POS Táctil</span>
          </button>
          <button onClick={() => setCajaAbierta(!cajaAbierta)} className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-left hover:bg-blue-100 transition">
            <DollarSign className="w-7 h-7 text-blue-600 mb-2" />
            <span className="font-semibold text-stone-800 block">{cajaAbierta ? 'Cerrar Caja' : 'Abrir Caja'}</span>
            <span className="text-xs text-stone-500">Control de caja</span>
          </button>
          <button onClick={() => router.push('/inventario')} className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left hover:bg-amber-100 transition">
            <Package className="w-7 h-7 text-amber-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Inventario</span>
            <span className="text-xs text-stone-500">Stock e ingredientes</span>
          </button>
          <button onClick={() => router.push('/personal')} className="bg-purple-50 border border-purple-200 rounded-2xl p-5 text-left hover:bg-purple-100 transition">
            <Users className="w-7 h-7 text-purple-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Personal</span>
            <span className="text-xs text-stone-500">Empleados y nómina</span>
          </button>
          <button onClick={() => router.push('/pedidos')} className="bg-sky-50 border border-sky-200 rounded-2xl p-5 text-left hover:bg-sky-100 transition">
            <Truck className="w-7 h-7 text-sky-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Pedidos</span>
            <span className="text-xs text-stone-500">Domicilios activos</span>
          </button>
          <button onClick={() => router.push('/reportes')} className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-left hover:bg-rose-100 transition">
            <BarChart3 className="w-7 h-7 text-rose-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Reportes</span>
            <span className="text-xs text-stone-500">Estadísticas y finanzas</span>
          </button>
        </div>

        {/* Últimas Ventas */}
        <h2 className="font-semibold text-stone-700 mt-4">ÚLTIMAS VENTAS</h2>
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          {ultimasVentas.map((v, i) => (
            <div key={i} className="flex justify-between items-center p-4 border-b border-stone-100 last:border-0 hover:bg-stone-50">
              <div>
                <p className="font-medium text-stone-800">{v.producto}</p>
                <p className="text-xs text-stone-400">{v.hora} • {v.metodo}</p>
              </div>
              <p className="text-emerald-600 font-bold">${v.total.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
