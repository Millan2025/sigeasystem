"use client";

export default function IntroPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-700 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full text-center space-y-8">
        
        {/* LOGO */}
        <div className="text-9xl mb-4">🍞</div>
        <h1 className="text-5xl font-bold text-emerald-400">SIGEA System</h1>
        <p className="text-xl text-stone-300">Sistema Integral de Gestión Empresarial Adaptativa</p>

        {/* BENEFICIOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 text-left">
          <div className="bg-stone-800/50 p-6 rounded-xl border border-stone-700">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-bold text-emerald-300">Control Total</h3>
            <p className="text-sm text-stone-400">Gestiona ventas, inventario, producción y finanzas en un solo lugar.</p>
          </div>
          <div className="bg-stone-800/50 p-6 rounded-xl border border-stone-700">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-bold text-emerald-300">Eficiencia</h3>
            <p className="text-sm text-stone-400">Automatiza procesos y reduce tiempos de operación diaria.</p>
          </div>
          <div className="bg-stone-800/50 p-6 rounded-xl border border-stone-700">
            <div className="text-3xl mb-2">📱</div>
            <h3 className="font-bold text-emerald-300">Accesible</h3>
            <p className="text-sm text-stone-400">Funciona en PC, tablet y celular. Siempre disponible.</p>
          </div>
        </div>

        {/* GUÍA DE USO */}
        <div className="bg-stone-800/30 p-6 rounded-xl border border-stone-700/50 text-left">
          <h3 className="font-bold text-emerald-300 text-lg mb-3">📖 Guía Rápida</h3>
          <ol className="space-y-2 text-sm text-stone-300 list-decimal list-inside">
            <li><span className="font-semibold text-white">Regístrate</span> con tu correo y contraseña</li>
            <li><span className="font-semibold text-white">Inicia sesión</span> para acceder al dashboard</li>
            <li><span className="font-semibold text-white">Explora los módulos</span>: POS, Inventario, Producción, Finanzas</li>
            <li><span className="font-semibold text-white">Personaliza</span> tu negocio en la sección Admin</li>
          </ol>
        </div>

        {/* BOTONES */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
          <a href="/login" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-semibold transition">
            Iniciar Sesión
          </a>
          <a href="/registro" className="bg-stone-700 hover:bg-stone-600 text-white px-8 py-3 rounded-lg font-semibold transition">
            Crear Cuenta
          </a>
        </div>

        <p className="text-xs text-stone-500 mt-8">v2.0 • Panadería Doña Rosa</p>
      </div>
    </div>
  );
}
