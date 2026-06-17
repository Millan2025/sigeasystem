'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, ShoppingCart, Truck, ChefHat, Package, DollarSign, Users, Star, Zap, ArrowRight, Phone, ChevronDown } from 'lucide-react'

const stats = [
  { label: 'Ventas Hoy', value: '$450,000', icon: TrendingUp, color: 'text-emerald-600' },
  { label: 'Productos', value: '45+', icon: Package, color: 'text-amber-600' },
  { label: 'Clientes', value: '120+', icon: Users, color: 'text-sky-600' },
  { label: 'Pedidos', value: '24', icon: Truck, color: 'text-purple-600' },
]

const beneficios = [
  { title: 'Control Total', desc: 'Inventario en tiempo real, ventas, compras, nomina. Todo en un solo lugar.', icon: Zap },
  { title: 'Voz y Peso', desc: 'Dicta pedidos por voz. Productos por peso con calculo automatico.', icon: ShoppingCart },
  { title: 'Produccion', desc: 'Recetas, food cost, lista de compras automatica segun ventas.', icon: ChefHat },
  { title: 'Reportes', desc: 'Ventas por hora, productos mas vendidos, margenes de ganancia.', icon: BarChart3 },
  { title: 'Domicilios', desc: 'Tus clientes compran desde la app. Tu asignas repartidor.', icon: Truck },
  { title: 'Finanzas', desc: 'P&G, Balance, Cierre de caja. Listo para tu contador.', icon: DollarSign },
]

const demosNegocios = [
  { tipo: 'Panaderia', icono: '🍞', color: 'bg-amber-500', modulos: 'POS · Produccion · Inventario · Domicilios · Finanzas' },
  { tipo: 'Restaurante', icono: '🍽️', color: 'bg-red-500', modulos: 'Menu · Food Cost · Produccion · Pedidos · Reportes' },
  { tipo: 'Tienda', icono: '🏪', color: 'bg-blue-500', modulos: 'POS · Inventario · Pedidos · Finanzas · Reportes' },
  { tipo: 'Distribuidora', icono: '📦', color: 'bg-purple-500', modulos: 'Inventario · Lotes · IoT · Facturacion · Pedidos' },
]

export default function DemoPage() {
  const [contador, setContador] = useState(0)
  const [showNegocio, setShowNegocio] = useState<number | null>(null)

  useEffect(() => {
    const interval = setInterval(() => setContador(c => (c + 1) % 100), 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* HERO */}
      <header className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <span className="text-6xl block mb-6">🍞</span>
          <h1 className="text-4xl font-extrabold mb-4 tracking-tight">SIGEA System</h1>
          <p className="text-xl text-emerald-100 mb-2">El ERP inteligente para negocios de barrio</p>
          <p className="text-emerald-200 text-sm mb-8">Panaderías · Restaurantes · Tiendas · Distribuidoras</p>
          
          <div className="bg-white/10 rounded-3xl p-6 mb-8">
            <div className="grid grid-cols-4 gap-4">
              {stats.map(s => (
                <div key={s.label} className="text-center">
                  <s.icon className="w-6 h-6 mx-auto mb-1 opacity-80" />
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-emerald-200">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="https://wa.me/573124567890?text=Hola%20Quiero%20probar%20SIGEA" target="_blank" className="bg-white text-emerald-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-50 transition flex items-center justify-center gap-2">
              <Phone className="w-5 h-5" /> Hablar por WhatsApp
            </a>
            <a href="/tienda" className="bg-emerald-800 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-900 transition flex items-center justify-center gap-2">
              Ver Demo en Vivo <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* TIPOS DE NEGOCIO */}
      <section className="max-w-2xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-stone-800 text-center mb-2">Un sistema, todos los negocios</h2>
        <p className="text-stone-500 text-center mb-8">Se adapta automaticamente al tipo de negocio</p>
        
        <div className="space-y-4">
          {demosNegocios.map((d, i) => (
            <div key={d.tipo} className="bg-white rounded-2xl border border-stone-200 overflow-hidden cursor-pointer hover:shadow-lg transition" onClick={() => setShowNegocio(showNegocio === i ? null : i)}>
              <div className="p-5 flex items-center gap-4">
                <div className={d.color + ' w-12 h-12 rounded-xl flex items-center justify-center text-2xl'}>{d.icono}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-stone-800">{d.tipo}</h3>
                  <p className="text-xs text-stone-400">{d.modulos}</p>
                </div>
                <ChevronDown className={'w-5 h-5 text-stone-400 transition ' + (showNegocio === i ? 'rotate-180' : '')} />
              </div>
              {showNegocio === i && (
                <div className="px-5 pb-5 border-t border-stone-100 pt-4">
                  <p className="text-sm text-stone-600 mb-3">
                    {d.tipo === 'Panaderia' && 'Controla recetas, produccion diaria, inventario de ingredientes y ventas por voz. Calcula automaticamente la lista de compras segun lo vendido.'}
                    {d.tipo === 'Restaurante' && 'Gestiona tu menu con food cost, fichas tecnicas por plato, control de ingredientes y pedidos a domicilio. Optimiza tus compras.'}
                    {d.tipo === 'Tienda' && 'Inventario inteligente con alarmas de stock, ventas rapidas, pedidos a proveedores y domicilios. Todo desde el celular.'}
                    {d.tipo === 'Distribuidora' && 'Control de lotes, facturacion electronica, IoT para bodegas, multi-almacen y reportes gerenciales.'}
                  </p>
                  <a href="/tienda" className="text-emerald-600 font-bold text-sm hover:underline">Ver demo en vivo →</a>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="bg-stone-50 py-12">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-stone-800 text-center mb-8">¿Por que SIGEA?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {beneficios.map(b => (
              <div key={b.title} className="bg-white rounded-2xl p-5 border border-stone-200 hover:shadow-md transition">
                <b.icon className="w-8 h-8 text-emerald-600 mb-3" />
                <h3 className="font-bold text-stone-800 mb-1">{b.title}</h3>
                <p className="text-sm text-stone-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTADOR ANIMADO */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-6xl font-extrabold mb-2">${(contador * 5000).toLocaleString()}</p>
          <p className="text-emerald-100">pesos ahorrados por nuestros clientes este mes</p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold text-stone-800 mb-4">¿Listo para transformar tu negocio?</h2>
        <p className="text-stone-500 mb-8">Sin instalaciones complicadas. Sin costos ocultos. Empieza hoy.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="https://wa.me/573124567890?text=Hola%20Quiero%20empezar%20con%20SIGEA" target="_blank" className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition">
            💬 Escribenos por WhatsApp
          </a>
          <a href="/registro" className="bg-stone-800 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-stone-900 transition">
            🚀 Comenzar Gratis
          </a>
        </div>
        <p className="text-xs text-stone-400 mt-4">Plan gratuito disponible. Sin tarjeta de credito.</p>
      </section>

      {/* FOOTER */}
      <footer className="bg-stone-900 text-stone-400 text-center py-6 text-sm">
        <p>© 2025 SIGEA System · Francisco Millan · fjmillan38@gmail.com</p>
      </footer>
    </div>
  )
}
