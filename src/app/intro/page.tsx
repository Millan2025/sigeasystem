"use client";

import { useState } from "react";

export default function IntroPage() {
  const [moduloActivo, setModuloActivo] = useState<string | null>(null);

  const modulos = [
    { 
      id: "pos", 
      nombre: "Punto de Venta", 
      icono: "🛒",
      beneficio: "Vende más rápido, cobra sin errores. Tu atención al cliente mejora y tus ventas crecen."
    },
    { 
      id: "inventario", 
      nombre: "Inventario", 
      icono: "📦",
      beneficio: "Sabes exactamente qué tienes, qué falta y qué sobra. Compras con datos, no con corazonadas."
    },
    { 
      id: "produccion", 
      nombre: "Producción", 
      icono: "🏭",
      beneficio: "Planifica tu producción diaria, reduce mermas y maximiza tu rendimiento."
    },
    { 
      id: "finanzas", 
      nombre: "Finanzas", 
      icono: "💰",
      beneficio: "Conoce tus utilidades en tiempo real. Toma decisiones financieras con confianza."
    },
    { 
      id: "pedidos", 
      nombre: "Pedidos", 
      icono: "📋",
      beneficio: "Organiza tus pedidos, nunca olvides una entrega. Clientes felices, negocios que crecen."
    },
    { 
      id: "personal", 
      nombre: "Personal", 
      icono: "👨‍🍳",
      beneficio: "Gestiona tu equipo, horarios y desempeño. Un equipo motivado da mejores resultados."
    },
    { 
      id: "reportes", 
      nombre: "Reportes", 
      icono: "📊",
      beneficio: "Visualiza tus datos, encuentra oportunidades y crece con información real."
    },
    { 
      id: "admin", 
      nombre: "Administración", 
      icono: "⚙️",
      beneficio: "Configura tu negocio a tu medida. SIGEA se adapta a ti, no tú a SIGEA."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-12">

        {/* LOGO CENTRAL GRANDE */}
        <div className="text-center pt-4">
          <div className="flex justify-center mb-3">
            <img src="/logoBlanco-sigea.png" alt="SIGEA" className="w-32 h-32 object-contain" />
          </div>
          <h1 className="text-5xl sm:text-6xl font-light tracking-tight text-stone-900">SIGEA</h1>
          <p className="text-lg sm:text-xl text-stone-400 font-light mt-2 tracking-wide">Tu negocio merece crecer sin estrés</p>
        </div>

        {/* GALERÍA DE IMÁGENES - 4 COLUMNAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Tienda', 'Panaderia', 'Restaurante', 'Ferreteria'].map((name) => (
            <div key={name} className="group relative overflow-hidden rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300">
              <img 
                src={`/${name}.png`} 
                alt={name} 
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-stone-900/70 to-transparent p-3">
                <p className="text-white text-sm font-medium">{name}</p>
              </div>
            </div>
          ))}
        </div>

        {/* BENEFICIOS - ELEGANTES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group p-6 rounded-2xl border border-stone-100 bg-stone-50/50 hover:border-emerald-200 hover:shadow-md transition-all duration-300">
            <div className="text-emerald-500 text-3xl mb-3">✦</div>
            <h3 className="text-lg font-semibold text-stone-800">Control Total</h3>
            <p className="text-sm text-stone-400 leading-relaxed">Gestiona ventas, inventario, producción y finanzas rápido y facilísimo.</p>
          </div>
          <div className="group p-6 rounded-2xl border border-stone-100 bg-stone-50/50 hover:border-emerald-200 hover:shadow-md transition-all duration-300">
            <div className="text-emerald-500 text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold text-stone-800">Eficiencia</h3>
            <p className="text-sm text-stone-400 leading-relaxed">Automatiza procesos y reduce errores. Más tiempo libre, más tranquilidad.</p>
          </div>
          <div className="group p-6 rounded-2xl border border-stone-100 bg-stone-50/50 hover:border-emerald-200 hover:shadow-md transition-all duration-300">
            <div className="text-emerald-500 text-3xl mb-3">💰</div>
            <h3 className="text-lg font-semibold text-stone-800">Ahorra</h3>
            <p className="text-sm text-stone-400 leading-relaxed">Decide las compras con datos reales. Conoce tus utilidades en tiempo real.</p>
          </div>
        </div>

        {/* DEMO - MÓDULOS */}
        <div>
          <h2 className="text-2xl font-light text-center text-stone-800 mb-8">Explora lo que SIGEA puede hacer por ti</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {modulos.map((mod) => (
              <button
                key={mod.id}
                onClick={() => setModuloActivo(moduloActivo === mod.id ? null : mod.id)}
                className={`p-3 rounded-xl border text-left transition-all duration-300 ${
                  moduloActivo === mod.id 
                    ? "border-emerald-400 bg-emerald-50/50 shadow-md" 
                    : "border-stone-200 hover:border-emerald-300 hover:bg-stone-50"
                }`}
              >
                <div className="text-2xl">{mod.icono}</div>
                <div className="text-sm font-semibold text-stone-700 mt-1">{mod.nombre}</div>
                {moduloActivo === mod.id && (
                  <p className="text-xs text-stone-500 mt-2 leading-relaxed">{mod.beneficio}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* BOTONES ACCIÓN */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <a href="/login" className="bg-stone-900 hover:bg-stone-800 text-white px-8 py-3 rounded-xl font-medium transition text-center">
            Iniciar Sesión
          </a>
          <a href="/registro" className="border-2 border-stone-900 hover:bg-stone-900 hover:text-white text-stone-900 px-8 py-3 rounded-xl font-medium transition text-center">
            Crear Cuenta
          </a>
        </div>

        {/* FOOTER */}
        <p className="text-xs text-stone-300 text-center tracking-widest">SIGEA</p>
      </div>
    </div>
  );
}
