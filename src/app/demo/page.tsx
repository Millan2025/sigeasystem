'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, DollarSign, Package, Users, Truck, BarChart3, TrendingUp, ChefHat, Phone, X, ArrowRight } from 'lucide-react'

const beneficiosPorModulo = {
  pos: { titulo: 'Punto de Venta Inteligente', icono: '💰', beneficios: ['Productos por peso: balanza integrada, precio automatico', 'Cobro: Efectivo, Nequi, Daviplata, Bancolombia', 'Busqueda rapida de productos', 'Descuento automatico de inventario', 'Registro de ventas en tiempo real'], color: 'bg-emerald-500' },
  produccion: { titulo: 'Produccion y Recetas', icono: '🏭', beneficios: ['Fichas tecnicas con ingredientes y cantidades exactas', 'Food cost: costo real vs precio de venta', 'Calculo automatico de materia prima segun ventas', 'Ordenes de produccion diarias', 'Lista de compras sugerida al proveedor', 'Adaptable a panaderia, restaurante, cafeteria'], color: 'bg-lime-500' },
  inventario: { titulo: 'Inventario Inteligente', icono: '📦', beneficios: ['Control de stock en tiempo real', 'Alarmas: urgente, pedir ya, OK', 'Ponderacion por importancia del producto', 'Prediccion de agotamiento', 'Multiples unidades: kg, g, L, ml, unidades', 'Exportar a Excel para analisis'], color: 'bg-amber-500' },
  personal: { titulo: 'Gestion de Personal', icono: '👥', beneficios: ['Registro de empleados con datos completos', 'Control de asistencia y horarios', 'Nomina: devengados, deducciones, neto a pagar', 'Apropiaciones para mediana empresa', 'Desprendible individual por empleado', 'Exportar para contador'], color: 'bg-purple-500' },
  pedidos: { titulo: 'Pedidos y Domicilios', icono: '🛵', beneficios: ['Tus clientes compran desde la app', 'Recibes notificacion de nuevos pedidos', 'Asignas repartidor disponible', 'Seguimiento en tiempo real', 'Confirmacion de entrega', 'Historial de pedidos por cliente'], color: 'bg-sky-500' },
  reportes: { titulo: 'Reportes y Estadisticas', icono: '📈', beneficios: ['Ventas por hora, dia, semana, mes', 'Top 10 productos mas vendidos', 'Margenes de ganancia por producto', 'Metodos de pago: % y montos', 'Graficos interactivos', 'Descargar en Excel para analisis'], color: 'bg-rose-500' },
  finanzas: { titulo: 'Finanzas y Contabilidad', icono: '🏦', beneficios: ['Estado de Resultados (P&G)', 'Balance General simplificado', 'Libro Diario con cuentas contables', 'Cierre de caja con cuadre automatico', 'Exportar para contador', 'API de conexion con software DIAN'], color: 'bg-teal-500' },
  tienda: { titulo: 'Tienda Online', icono: '🛒', beneficios: ['Tus clientes ven tu catalogo actualizado', 'Busqueda y filtro por categorias', 'Carrito de compras', 'Checkout con datos de entrega', 'Pago: Efectivo, Nequi, Daviplata, Bancolombia', 'Pedido confirmado con notificacion'], color: 'bg-orange-500' },
}

const negociosDemo = [
  { tipo: 'Panaderia', icono: '🍞', url: '/demo/panaderia' },
  { tipo: 'Restaurante', icono: '🍽️', url: '/demo/restaurante' },
  { tipo: 'Tienda', icono: '🏪', url: '/demo/tienda' },
  { tipo: 'Carniceria', icono: '🥩', url: '/demo/carniceria' },
  { tipo: 'Salsamentaria', icono: '🧀', url: '/demo/salsamentaria' },
  { tipo: 'Ferreteria', icono: '🔩', url: '/demo/ferreteria' },
]

export default function DemoPage() {
  const [moduloActivo, setModuloActivo] = useState<string | null>(null)
  const [cajaAbierta, setCajaAbierta] = useState(true)
  useEffect(() => { fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: 'Visitante Demo', email: 'anonimo@demo.com', origen: 'tour_demo' }) }).catch(() => {}) }, [])

  const modulos = [
    { id: 'pos', label: 'Nueva Venta', icon: ShoppingCart, color: 'bg-emerald-50 border-emerald-200 text-emerald-600' },
    { id: 'produccion', label: 'Produccion', icon: ChefHat, color: 'bg-lime-50 border-lime-200 text-lime-600' },
    { id: 'inventario', label: 'Inventario', icon: Package, color: 'bg-amber-50 border-amber-200 text-amber-600' },
    { id: 'personal', label: 'Personal', icon: Users, color: 'bg-purple-50 border-purple-200 text-purple-600' },
    { id: 'pedidos', label: 'Pedidos', icon: Truck, color: 'bg-sky-50 border-sky-200 text-sky-600' },
    { id: 'reportes', label: 'Reportes', icon: BarChart3, color: 'bg-rose-50 border-rose-200 text-rose-600' },
    { id: 'finanzas', label: 'Finanzas', icon: TrendingUp, color: 'bg-teal-50 border-teal-200 text-teal-600' },
    { id: 'tienda', label: 'Tienda', icon: ShoppingCart, color: 'bg-orange-50 border-orange-200 text-orange-600' },
  ]

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold">Panaderia Doña Rosa</h1><p className="text-stone-600 text-sm">Demo Interactiva · Todos los modulos</p></div><span className={'px-4 py-2 rounded-full text-sm font-semibold ' + (cajaAbierta ? 'bg-emerald-500' : 'bg-red-500')}>{cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}</span></div>
      </header>
      <div className="p-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white mb-4"><p className="text-emerald-100 text-sm">VENTAS DE HOY (DEMO)</p><p className="text-4xl font-bold mt-1">$450,000</p><p className="text-sm text-emerald-100 mt-2">24 transacciones · Efectivo 65% · Nequi 20% · Daviplata 15%</p></div>
        <h2 className="font-semibold text-stone-700 mb-3">CONOCE CADA MODULO (Toca para ver beneficios)</h2>
        <div className="grid grid-cols-2 gap-3">{modulos.map(m => (<button key={m.id} onClick={() => setModuloActivo(moduloActivo === m.id ? null : m.id)} className={m.color + ' rounded-2xl p-5 text-left border hover:shadow-md transition'}><m.icon className="w-7 h-7 mb-2" /><span className="font-semibold text-stone-800 block">{m.label}</span><span className="text-xs text-stone-500">Toca para ver beneficios</span></button>))}</div>
        <a href="https://wa.me/573016111412?text=Hola%20Quiero%20informacion%20de%20SIGEA%20System" target="_blank" className="mt-6 w-full bg-green-500 text-white rounded-2xl py-4 font-bold text-lg flex items-center justify-center gap-2 hover:bg-green-600 transition"><Phone className="w-5 h-5" /> Escribenos por WhatsApp · 301-6111412</a>
        <a href="/registro" className="mt-3 w-full bg-stone-800 text-white rounded-2xl py-4 font-bold text-lg flex items-center justify-center gap-2 hover:bg-stone-900 transition">🚀 Comenzar Gratis <ArrowRight className="w-5 h-5" /></a>

        {/* SELECTOR DE NEGOCIOS */}
        <div className="mt-8"><p className="text-center text-sm font-bold text-stone-700 mb-4">🚀 Elige tu tipo de negocio y descubre como SIGEA transforma tu operacion en minutos. ¡Prueba la demo gratuita ahora!</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{negociosDemo.map(d => (<a key={d.tipo} href={d.url} className="bg-white rounded-2xl p-4 text-center border border-stone-200 hover:shadow-lg hover:border-emerald-300 transition no-underline"><span className="text-4xl block mb-2">{d.icono}</span><span className="text-sm font-bold text-stone-700">{d.tipo}</span><span className="text-xs text-emerald-600 block mt-1">Ver demo →</span></a>))}</div>
        </div>
      </div>

      {moduloActivo && beneficiosPorModulo[moduloActivo as keyof typeof beneficiosPorModulo] && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setModuloActivo(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {(() => { const b = beneficiosPorModulo[moduloActivo as keyof typeof beneficiosPorModulo]; return (<><div className="flex justify-between items-center mb-4"><div className="flex items-center gap-2"><span className="text-3xl">{b.icono}</span><h2 className="font-bold text-xl text-stone-900">{b.titulo}</h2></div><button onClick={() => setModuloActivo(null)} className="p-2 hover:bg-stone-100 rounded-xl"><X className="w-5 h-5 text-stone-600" /></button></div><div className="space-y-2">{b.beneficios.map((ben, i) => (<div key={i} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl"><span className="text-emerald-500 font-bold shrink-0">✓</span><span className="text-sm text-stone-700">{ben}</span></div>))}</div><a href="/registro" className="mt-4 w-full bg-emerald-500 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2">🚀 Probar ahora gratis <ArrowRight className="w-5 h-5" /></a></>) })()}
          </div>
        </div>
      )}
    </div>
  )
}




