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
    <div className="min-h-screen bg-white text-stone-900">
      
      {/* HEADER - LOGO SIGEA */}
      <div className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <img src="/favicon-v2.ico" alt="SIGEA" className="w-10 h-10 object-contain" />
          <span className="text-2xl font-bold text-stone-800">SIGEA</span>
          <span className="text-sm text-stone-400 ml-auto">Tu negocio merece crecer sin estrés.</span>
        </div>
      </div>

      {/* INTRO - IMÁGENES Y MENSAJE */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-12">

        {/* TÍTULO */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-stone-900">SIGEA System</h1>
          <p className="text-lg text-stone-500">Tu negocio merece crecer sin estrés.</p>
        </div>

        {/* GALERÍA DE IMÁGENES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl overflow-hidden shadow-md border border-stone-200">
            <img src="/Tienda.png" alt="Tienda" className="w-full h-40 object-cover" />
            <p className="text-xs text-stone-500 text-center py-1">Tienda</p>
          </div>
          <div className="rounded-xl overflow-hidden shadow-md border border-stone-200">
            <img src="/Panaderia.png" alt="Panadería" className="w-full h-40 object-cover" />
            <p className="text-xs text-stone-500 text-center py-1">Panadería</p>
          </div>
          <div className="rounded-xl overflow-hidden shadow-md border border-stone-200">
            <img src="/Restaurante.png" alt="Restaurante" className="w-full h-40 object-cover" />
            <p className="text-xs text-stone-500 text-center py-1">Restaurante</p>
          </div>
          <div className="rounded-xl overflow-hidden shadow-md border border-stone-200">
            <img src="/Ferreteria.png" alt="Ferretería" className="w-full h-40 object-cover" />
            <p className="text-xs text-stone-500 text-center py-1">Ferretería</p>
          </div>
        </div>

        {/* BENEFICIOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-stone-200 bg-stone-50/30 text-center">
            <div className="text-4xl mb-2">📊</div>
            <h3 className="text-lg font-bold text-stone-800">Control Total</h3>
            <p className="text-sm text-stone-500">Gestiona ventas, inventario, producción y finanzas rápido y facilísimo.</p>
          </div>
          <div className="p-6 rounded-2xl border border-stone-200 bg-stone-50/30 text-center">
            <div className="text-4xl mb-2">⚡</div>
            <h3 className="text-lg font-bold text-stone-800">Eficiencia</h3>
            <p className="text-sm text-stone-500">Automatiza procesos y reduce errores. Más tiempo libre, más tranquilidad.</p>
          </div>
          <div className="p-6 rounded-2xl border border-stone-200 bg-stone-50/30 text-center">
            <div className="text-4xl mb-2">💰</div>
            <h3 className="text-lg font-bold text-stone-800">Ahorra</h3>
            <p className="text-sm text-stone-500">Decide las compras con datos reales. Conoce tus utilidades en tiempo real.</p>
          </div>
        </div>

        {/* DEMO - MÓDULOS CON BENEFICIOS */}
        <div>
          <h2 className="text-2xl font-bold text-stone-800 text-center mb-6">Conoce lo que SIGEA puede hacer por ti</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {modulos.map((mod) => (
              <button
                key={mod.id}
                onClick={() => setModuloActivo(moduloActivo === mod.id ? null : mod.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  moduloActivo === mod.id 
                    ? "border-emerald-500 bg-emerald-50 shadow-md" 
                    : "border-stone-200 hover:border-emerald-300 hover:bg-stone-50"
                }`}
              >
                <div className="text-3xl mb-1">{mod.icono}</div>
                <div className="font-bold text-stone-800">{mod.nombre}</div>
                {moduloActivo === mod.id && (
                  <p className="text-sm text-stone-600 mt-2">{mod.beneficio}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* BOTONES ACCIÓN */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <a href="/login" className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-3 rounded-2xl font-bold transition shadow-md text-center">
            Iniciar Sesión
          </a>
          <a href="/registro" className="bg-stone-700 hover:bg-stone-800 text-white px-10 py-3 rounded-2xl font-bold transition shadow-md text-center">
            Crear Cuenta
          </a>
        </div>

        {/* FOOTER - SIN NOMBRE DE NEGOCIO */}
        <p className="text-xs text-stone-400 text-center">SIGEA System</p>
      </div>
    </div>
  );
}
