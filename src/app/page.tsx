"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  ShoppingCart, Package, ChefHat, DollarSign, 
  ClipboardList, Users, BarChart3, Settings,
  Store, ArrowRight, LogOut
} from "lucide-react";

interface Usuario {
  nombre: string;
  email: string;
  rol: string;
}

export default function DashboardPage() {
  const supabase = createClient();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [ventasHoy, setVentasHoy] = useState(0);

  useEffect(() => {
    cargarUsuario();
    cargarVentas();
  }, []);

  const cargarUsuario = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("usuarios")
        .select("nombre, email, rol")
        .eq("id", user.id)
        .single();

      if (error) {
        setUsuario({ 
          nombre: "Mi Negocio", 
          email: user.email || "",
          rol: "usuario"
        });
      } else {
        setUsuario(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarVentas = async () => {
    try {
      const res = await fetch('/api/sales');
      const data = await res.json();
      if (data.success && data.totales) {
        setVentasHoy(data.totales.total || 0);
      }
    } catch (error) {
      console.error("Error cargando ventas:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const modulos = [
    { id: "pos", nombre: "Punto de Venta", icono: <ShoppingCart className="w-6 h-6" />, color: "from-emerald-500 to-emerald-600", href: "/pos" },
    { id: "inventario", nombre: "Inventario", icono: <Package className="w-6 h-6" />, color: "from-blue-500 to-blue-600", href: "/inventario" },
    { id: "produccion", nombre: "Producción", icono: <ChefHat className="w-6 h-6" />, color: "from-amber-500 to-amber-600", href: "/produccion" },
    { id: "finanzas", nombre: "Finanzas", icono: <DollarSign className="w-6 h-6" />, color: "from-purple-500 to-purple-600", href: "/finanzas" },
    { id: "pedidos", nombre: "Pedidos", icono: <ClipboardList className="w-6 h-6" />, color: "from-rose-500 to-rose-600", href: "/pedidos" },
    { id: "personal", nombre: "Personal", icono: <Users className="w-6 h-6" />, color: "from-teal-500 to-teal-600", href: "/personal" },
    { id: "reportes", nombre: "Reportes", icono: <BarChart3 className="w-6 h-6" />, color: "from-indigo-500 to-indigo-600", href: "/reportes" },
    { id: "admin", nombre: "Administración", icono: <Settings className="w-6 h-6" />, color: "from-stone-500 to-stone-600", href: "/admin" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="text-stone-500 mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header con nombre dinámico */}
      <header className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Store className="w-8 h-8 text-amber-400" />
                <h1 className="text-2xl font-bold">
                  {usuario?.nombre || "Mi Negocio"}
                </h1>
              </div>
              <p className="text-stone-400 text-sm">
                {usuario?.email || ""} · {usuario?.rol === "admin" ? "Administrador" : "Usuario"}
              </p>
              <p className="text-stone-500 text-xs mt-1">SIGEA System</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500/20 hover:bg-red-500/30 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Ventas Hoy */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <p className="text-emerald-100 text-sm">VENTAS DE HOY</p>
          <p className="text-4xl font-bold mt-1">${ventasHoy.toLocaleString()}</p>
          <p className="text-sm text-emerald-100 mt-2">Actualizado en tiempo real</p>
        </div>
      </div>

      {/* Módulos */}
      <div className="max-w-7xl mx-auto p-6">
        <h2 className="text-xl font-semibold text-stone-800 mb-6">
          📋 Módulos del Sistema
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {modulos.map((mod) => (
            <Link
              key={mod.id}
              href={mod.href}
              className={`bg-gradient-to-br ${mod.color} text-white p-6 rounded-2xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 flex flex-col items-center text-center`}
            >
              <div className="bg-white/20 p-3 rounded-xl mb-3">
                {mod.icono}
              </div>
              <span className="font-medium">{mod.nombre}</span>
              <ArrowRight className="w-4 h-4 mt-2 opacity-70" />
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center text-xs text-stone-400 border-t border-stone-100 pt-6">
          SIGEA System · v2.0
        </div>
      </div>
    </div>
  );
}
