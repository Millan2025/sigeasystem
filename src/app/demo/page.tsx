import Link from 'next/link'

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-8 text-center">
      <span className="text-6xl mb-6">🍞</span>
      <h1 className="text-3xl font-bold text-stone-800 mb-4">SIGEA System</h1>
      <p className="text-stone-500 mb-8 max-w-md">El ERP inteligente para negocios de barrio. Panaderias, restaurantes, tiendas y mas.</p>
      <div className="space-y-3 w-full max-w-sm">
        <a href="https://wa.me/573016111412?text=Hola%20Quiero%20informacion%20de%20SIGEA%20System" target="_blank" className="block w-full bg-green-500 text-white rounded-2xl py-4 font-bold text-lg hover:bg-green-600 transition text-center no-underline">Escribenos por WhatsApp · 301-6111412</a>
        <a href="/registro" className="block w-full bg-stone-800 text-white rounded-2xl py-4 font-bold text-lg hover:bg-stone-900 transition text-center no-underline">Comenzar Gratis</a>
      </div>
    </div>
  )
}
