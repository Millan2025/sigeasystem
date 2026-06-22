"use client";

import { useState } from "react";

export default function IntroPage() {
  const [moduloActivo, setModuloActivo] = useState<string | null>(null);

  const modulos = [
    { 
      id: "pos", 
      nombre: "Punto de Venta", 
      color: "from-emerald-500 to-emerald-600",
      bgColor: "hover:bg-emerald-50 border-emerald-200",
      beneficio: "Vende más rápido, cobra sin errores. Tu atención al cliente mejora y tus ventas crecen."
    },
    { 
      id: "inventario", 
      nombre: "Inventario", 
      color: "from-blue-500 to-blue-600",
      bgColor: "hover:bg-blue-50 border-blue-200",
      beneficio: "Sabes exactamente qué tienes, qué falta y qué sobra. Compras con datos, no con corazonadas."
    },
    { 
      id: "produccion", 
      nombre: "Producción", 
      color: "from-amber-500 to-amber-600",
      bgColor: "hover:bg-amber-50 border-amber-200",
      beneficio: "Planifica tu producción diaria, reduce mermas y maximiza tu rendimiento."
    },
    { 
      id: "finanzas", 
      nombre: "Finanzas", 
      color: "from-purple-500 to-purple-600",
      bgColor: "hover:bg-purple-50 border-purple-200",
      beneficio: "Conoce tus utilidades en tiempo real. Toma decisiones financieras con confianza."
    },
    { 
      id: "pedidos", 
      nombre: "Pedidos", 
      color: "from-rose-500 to-rose-600",
      bgColor: "hover:bg-rose-50 border-rose-200",
      beneficio: "Organiza tus pedidos, nunca olvides una entrega. Clientes felices, negocios que crecen."
    },
    { 
      id: "personal", 
      nombre: "Personal", 
      color: "from-teal-500 to-teal-600",
      bgColor: "hover:bg-teal-50 border-teal-200",
      beneficio: "Gestiona tu equipo, horarios y desempeño. Un equipo motivado da mejores resultados."
    },
    { 
      id: "reportes", 
      nombre: "Reportes", 
      color: "from-indigo-500 to-indigo-600",
      bgColor: "hover:bg-indigo-50 border-indigo-200",
      beneficio: "Visualiza tus datos, encuentra oportunidades y crece con información real."
    },
    { 
      id: "admin", 
      nombre: "Administración", 
      color: "from-stone-500 to-stone-600",
      bgColor: "hover:bg-stone-50 border-stone-200",
      beneficio: "Configura tu negocio a tu medida. SIGEA se adapta a ti, no tú a SIGEA."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-12">

        {/* LOGO CENTRAL - 50% MÁS GRANDE */}
        <div className="text-center pt-6">
          <div className="flex justify-center mb-4">
            <img 
              src="/logoBlanco-sigea.png" 
              alt="SIGEA" 
              className="w-48 h-48 object-contain" 
              style={{ width: "12rem", height: "12rem" }}
            />
          </div>
          <h1 className="text-6xl sm:text-7xl font-light tracking-tight text-stone-900">SIGEA</h1>
          <p className="text-xl sm:text-2xl text-stone-400 font-light mt-3 tracking-wide">Tu negocio merece crecer sin estrés</p>
        </div>

        {/* GALERÍA DE IMÁGENES - IMÁGENES LIVIANAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Tienda', 'Panaderia', 'Restaurante', 'Ferreteria'].map((name) => (
            <div key={name} className="group relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500">
              <img 
                src={`/${name}-opt2.jpg`} 
                alt={name} 
                className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
                width="400"
                height="300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-stone-900/80 via-stone-900/30 to-transparent p-4">
                <p className="text-white text-sm font-medium tracking-wide">{name}</p>
              </div>
            </div>
          ))}
        </div>

        {/* BENEFICIOS - CON COLORES ARMÓNICOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group p-6 rounded-2xl border border-stone-100 bg-gradient-to-br from-emerald-50/30 to-white hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-emerald-700">Control Total</h3>
            <p className="text-sm text-stone-500 leading-relaxed mt-1">Gestiona ventas, inventario, producción y finanzas rápido y facilísimo.</p>
          </div>
          <div className="group p-6 rounded-2xl border border-stone-100 bg-gradient-to-br from-blue-50/30 to-white hover:border-blue-300 hover:shadow-lg transition-all duration-300">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold text-blue-700">Eficiencia</h3>
            <p className="text-sm text-stone-500 leading-relaxed mt-1">Automatiza procesos y reduce errores. Más tiempo libre, más tranquilidad.</p>
          </div>
          <div className="group p-6 rounded-2xl border border-stone-100 bg-gradient-to-br from-amber-50/30 to-white hover:border-amber-300 hover:shadow-lg transition-all duration-300">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xl mb-3">💰</div>
            <h3 className="text-lg font-semibold text-amber-700">Ahorra</h3>
            <p className="text-sm text-stone-500 leading-relaxed mt-1">Decide las compras con datos reales. Conoce tus utilidades en tiempo real.</p>
          </div>
        </div>

        {/* DEMO - MÓDULOS CON COLORES */}
        <div>
          <h2 className="text-3xl font-light text-center text-stone-800 mb-8">Explora lo que SIGEA puede hacer por ti</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {modulos.map((mod) => (
              <button
                key={mod.id}
                onClick={() => setModuloActivo(moduloActivo === mod.id ? null : mod.id)}
                className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                  moduloActivo === mod.id 
                    ? `bg-gradient-to-r ${mod.color} text-white shadow-lg scale-105` 
                    : "border-stone-200 hover:border-stone-300 bg-white hover:shadow-md"
                }`}
              >
                <div className={`text-2xl ${moduloActivo === mod.id ? "text-white/80" : "text-stone-400"}`}>✦</div>
                <div className={`text-sm font-semibold mt-1 ${moduloActivo === mod.id ? "text-white" : "text-stone-700"}`}>
                  {mod.nombre}
                </div>
                {moduloActivo === mod.id && (
                  <p className="text-xs text-white/90 mt-2 leading-relaxed">{mod.beneficio}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* BOTONES ACCIÓN */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <a href="/login" className="bg-stone-900 hover:bg-stone-800 text-white px-10 py-4 rounded-xl font-medium transition shadow-lg hover:shadow-xl text-center">
            Iniciar Sesión
          </a>
          <a href="/registro" className="border-2 border-stone-900 hover:bg-stone-900 hover:text-white text-stone-900 px-10 py-4 rounded-xl font-medium transition text-center">
            Crear Cuenta
          </a>
        </div>

        {/* FOOTER */}
        <p className="text-xs text-stone-300 text-center tracking-widest">SIGEA</p>
      </div>
    </div>
  );
}
