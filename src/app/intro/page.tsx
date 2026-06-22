"use client";

export default function IntroPage() {
  return (
    <div className="min-h-screen bg-white text-stone-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-5xl w-full space-y-12">

        {/* LOGO */}
        <div className="text-center">
          <div className="inline-block bg-stone-900 p-4 rounded-2xl">
            <img src="/logoBlanco-sigea.png" alt="SIGEA" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mt-4">SIGEA System</h1>
          <p className="text-xl text-stone-600 mt-2">Tu negocio merece crecer sin estrés.</p>
        </div>

        {/* IMÁGENES DE NEGOCIOS - 3 COLUMNAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-stone-200 transition hover:shadow-lg">
            <img src="/tienda.png" alt="Tienda" className="w-full h-48 object-cover" />
            <div className="p-4">
              <h3 className="text-lg font-bold text-stone-800">Tienda</h3>
              <p className="text-sm text-stone-500">Controla ventas e inventario</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-stone-200 transition hover:shadow-lg">
            <img src="/panaderia.png" alt="Panadería" className="w-full h-48 object-cover" />
            <div className="p-4">
              <h3 className="text-lg font-bold text-stone-800">Panadería</h3>
              <p className="text-sm text-stone-500">Controla producción y ventas</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-stone-200 transition hover:shadow-lg">
            <img src="/restaurante.png" alt="Restaurante" className="w-full h-48 object-cover" />
            <div className="p-4">
              <h3 className="text-lg font-bold text-stone-800">Restaurante</h3>
              <p className="text-sm text-stone-500">Gestiona pedidos e inventario</p>
            </div>
          </div>
        </div>

        {/* BENEFICIOS - 3 COLUMNAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-stone-200 bg-stone-50/30 text-center">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-bold text-stone-800">Control Total</h3>
            <p className="text-stone-600 text-sm mt-1">Gestiona ventas, inventario, producción y finanzas rápido y facilísimo.</p>
          </div>
          <div className="p-6 rounded-2xl border border-stone-200 bg-stone-50/30 text-center">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-xl font-bold text-stone-800">Eficiencia</h3>
            <p className="text-stone-600 text-sm mt-1">Automatiza procesos y reduce errores.<br />Más tiempo libre, más tranquilidad.</p>
          </div>
          <div className="p-6 rounded-2xl border border-stone-200 bg-stone-50/30 text-center">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="text-xl font-bold text-stone-800">Ahorra</h3>
            <p className="text-stone-600 text-sm mt-1">Decide las compras con datos reales, reduce pérdidas.<br />Conoce tus utilidades en tiempo real.</p>
          </div>
        </div>

        {/* BOTONES */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
          <a href="/login" className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-bold text-lg transition shadow-md">
            Iniciar Sesión
          </a>
          <a href="/registro" className="bg-stone-700 hover:bg-stone-800 text-white px-10 py-4 rounded-2xl font-bold text-lg transition shadow-md">
            Crear Cuenta
          </a>
        </div>

        <p className="text-xs text-stone-400 text-center mt-4">SIGEA System</p>
      </div>
    </div>
  );
}
