"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, ShoppingCart, Package, ChefHat, DollarSign, ClipboardList, Users, BarChart3, Settings, Store } from "lucide-react";

export default function DemoUniversalPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);

  useEffect(() => {
    cargarDatosDemo();
  }, []);

  const cargarDatosDemo = async () => {
    try {
      // 1. Obtener tenant_id del usuario demo (fjmillan39@gmail.com)
      const { data: userData } = await supabase
        .from("usuarios")
        .select("tenant_id")
        .eq("email", "fjmillan39@gmail.com")
        .single();

      if (!userData) {
        setLoading(false);
        return;
      }

      // 2. Obtener productos del usuario demo
      const { data: productosData } = await supabase
        .from("productos")
        .select("*")
        .eq("tenant_id", userData.tenant_id)
        .order("categoria");

      if (productosData) {
        setProductos(productosData);
        // Agrupar por categoría
        const cats = productosData.reduce((acc: any, p: any) => {
          if (!acc[p.categoria]) acc[p.categoria] = [];
          acc[p.categoria].push(p);
          return acc;
        }, {});
        setCategorias(Object.keys(cats).map(cat => ({ nombre: cat, productos: cats[cat] })));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const modulos = [
    { id: "pos", nombre: "Punto de Venta", icono: <ShoppingCart className="w-5 h-5" />, href: "/pos" },
    { id: "inventario", nombre: "Inventario", icono: <Package className="w-5 h-5" />, href: "/inventario" },
    { id: "produccion", nombre: "Producción", icono: <ChefHat className="w-5 h-5" />, href: "/produccion" },
    { id: "finanzas", nombre: "Finanzas", icono: <DollarSign className="w-5 h-5" />, href: "/finanzas" },
    { id: "pedidos", nombre: "Pedidos", icono: <ClipboardList className="w-5 h-5" />, href: "/pedidos" },
    { id: "personal", nombre: "Personal", icono: <Users className="w-5 h-5" />, href: "/personal" },
    { id: "reportes", nombre: "Reportes", icono: <BarChart3 className="w-5 h-5" />, href: "/reportes" },
    { id: "admin", nombre: "Administración", icono: <Settings className="w-5 h-5" />, href: "/admin" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-white/20 rounded-xl transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold">🌐 Modelo Universal de Negocio</h1>
            <p className="text-xs text-amber-100">Descubre cómo SIGEA se adapta a cualquier negocio</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Mensaje principal */}
        <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-6 border border-amber-200 text-center">
          <Store className="w-16 h-16 text-amber-500 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-stone-800">Tu negocio merece crecer sin estrés</h2>
          <p className="text-stone-500 mt-2 max-w-2xl mx-auto">
            SIGEA se adapta a cualquier tipo de negocio: Tiendas, Panaderías, Restaurantes, 
            Ferreterías, Carnicerías y más. Todos los módulos conectados y sincronizados.
          </p>
        </div>

        {/* Categorías y productos del demo */}
        <div>
          <h3 className="text-lg font-semibold text-stone-800 mb-4">📦 Productos de Demostración</h3>
          {loading ? (
            <div className="text-center py-8 text-stone-400">Cargando productos de demostración...</div>
          ) : categorias.length === 0 ? (
            <div className="text-center py-8 text-stone-400">No hay productos de demostración disponibles</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorias.map((cat: any) => (
                <div key={cat.nombre} className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
                  <h4 className="font-bold text-stone-700 mb-2">{cat.nombre}</h4>
                  <div className="space-y-1">
                    {cat.productos.slice(0, 5).map((p: any) => (
                      <div key={p.id} className="flex justify-between text-sm text-stone-600">
                        <span>{p.icono} {p.nombre}</span>
                        <span className="font-medium text-emerald-600">${p.precio}</span>
                      </div>
                    ))}
                    {cat.productos.length > 5 && (
                      <p className="text-xs text-stone-400">+ {cat.productos.length - 5} más</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Módulos */}
        <div>
          <h3 className="text-lg font-semibold text-stone-800 mb-4">🚀 Módulos del Sistema</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {modulos.map((mod) => (
              <Link
                key={mod.id}
                href={mod.href}
                className="bg-white border border-stone-200 rounded-2xl p-4 text-center hover:border-amber-400 hover:shadow-md transition-all duration-300"
              >
                <div className="text-amber-600 mb-2">{mod.icono}</div>
                <span className="text-sm font-medium text-stone-700">{mod.nombre}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Botones acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <a
            href="https://sigea-system.vercel.app/login"
            className="bg-stone-900 hover:bg-stone-800 text-white px-8 py-3 rounded-2xl font-medium transition text-center"
          >
            Iniciar Sesión
          </a>
          <a
            href="https://sigea-system.vercel.app/registro"
            className="border-2 border-stone-900 hover:bg-stone-900 hover:text-white text-stone-900 px-8 py-3 rounded-2xl font-medium transition text-center"
          >
            Crear Cuenta
          </a>
        </div>

        <p className="text-xs text-stone-400 text-center">SIGEA System · Modelo Universal de Negocio</p>
      </div>
    </div>
  );
}
