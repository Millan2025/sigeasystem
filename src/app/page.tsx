"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  ShoppingCart, DollarSign, Package, Users, Truck, 
  BarChart3, TrendingUp, Share2, ChefHat 
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [cajaAbierta, setCajaAbierta] = useState(true);
  const [ventasHoy, setVentasHoy] = useState(0);
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    cargarUsuarioYVentas();
  }, []);

  const cargarUsuarioYVentas = async () => {
    try {
      // 1. Obtener usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 2. Obtener datos del usuario (tenant_id, nombre)
      const { data: userData, error } = await supabase
        .from("usuarios")
        .select("tenant_id, nombre, email")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error cargando usuario:", error);
        // Si no tiene datos en public.usuarios, crear registro
        await supabase
          .from("usuarios")
          .insert([{ id: user.id, email: user.email, tenant_id: crypto.randomUUID(), nombre: "Mi Negocio" }]);
        // Recargar
        return cargarUsuarioYVentas();
      }

      setUsuario(userData);

      // 3. Cargar ventas del tenant
      if (userData?.tenant_id) {
        const res = await fetch(`/api/sales?tenant=${userData.tenant_id}`);
        const data = await res.json();
        if (data.success && data.totales) {
          setVentasHoy(data.totales.total || 0);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!usuario) {
    return <div className="min-h-screen flex items-center justify-center">No se pudo cargar el usuario</div>;
  }

  const shareLinks = [
    { label: "POS Vendedor", url: "/pos", icon: "💰", color: "bg-emerald-600" },
    { label: "Tienda Clientes", url: "/tienda", icon: "🛒", color: "bg-amber-600" },
    { label: "App Repartidor", url: "/entregas", icon: "🛵", color: "bg-sky-600" },
  ];

  return (
    <div className="min-h-screen bg-stone-50 md:max-w-2xl lg:max-w-4xl mx-auto">
      <a href="/login" className="fixed top-4 left-4 z-50 bg-red-500 text-white px-3 py-1.5 rounded-full shadow-lg text-xs font-bold no-underline hover:bg-red-600">Salir</a>

      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex justify-between items-center">
          <div>
            <img src="/logoBlanco-sigea.png" alt="SIGEA" className="h-8 object-contain mb-1" />
            <h1 className="text-2xl font-bold">{usuario.nombre || "Mi Negocio"}</h1>
            <p className="text-stone-300 text-sm">{new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowShare(!showShare)} className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition">
              <Share2 className="w-5 h-5" />
            </button>
            <span className={"px-4 py-2 rounded-full text-sm font-semibold " + (cajaAbierta ? "bg-emerald-500" : "bg-red-500")}>
              {cajaAbierta ? "Caja Abierta" : "Caja Cerrada"}
            </span>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white cursor-pointer" onClick={() => router.push("/finanzas")}>
          <p className="text-emerald-100 text-sm">VENTAS DE HOY</p>
          <p className="text-4xl font-bold mt-1">${ventasHoy.toLocaleString()}</p>
          <p className="text-sm text-emerald-100 mt-2">Actualizado en tiempo real</p>
        </div>

        <h2 className="font-semibold text-stone-700 mt-4">ACCESOS RAPIDOS</h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push("/pos")} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-left hover:bg-emerald-100">
            <ShoppingCart className="w-7 h-7 text-emerald-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Nueva Venta</span>
            <span className="text-xs text-stone-500">POS con Buscador</span>
          </button>
          <button onClick={() => setCajaAbierta(!cajaAbierta)} className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-left hover:bg-blue-100">
            <DollarSign className="w-7 h-7 text-blue-600 mb-2" />
            <span className="font-semibold text-stone-800 block">{cajaAbierta ? "Cerrar Caja" : "Abrir Caja"}</span>
            <span className="text-xs text-stone-500">Control de caja</span>
          </button>
          <button onClick={() => router.push("/produccion")} className="bg-lime-50 border border-lime-200 rounded-2xl p-5 text-left hover:bg-lime-100">
            <ChefHat className="w-7 h-7 text-lime-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Produccion</span>
            <span className="text-xs text-stone-500">Recetas y compras</span>
          </button>
          <button onClick={() => router.push("/inventario")} className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left hover:bg-amber-100">
            <Package className="w-7 h-7 text-amber-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Inventario</span>
            <span className="text-xs text-stone-500">Stock, alarmas, pedidos</span>
          </button>
          <button onClick={() => router.push("/personal")} className="bg-purple-50 border border-purple-200 rounded-2xl p-5 text-left hover:bg-purple-100">
            <Users className="w-7 h-7 text-purple-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Personal</span>
            <span className="text-xs text-stone-500">Empleados y nomina</span>
          </button>
          <button onClick={() => router.push("/pedidos")} className="bg-sky-50 border border-sky-200 rounded-2xl p-5 text-left hover:bg-sky-100">
            <Truck className="w-7 h-7 text-sky-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Pedidos</span>
            <span className="text-xs text-stone-500">Domicilios activos</span>
          </button>
          <button onClick={() => router.push("/reportes")} className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-left hover:bg-rose-100">
            <BarChart3 className="w-7 h-7 text-rose-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Reportes</span>
            <span className="text-xs text-stone-500">Estadisticas y graficos</span>
          </button>
          <button onClick={() => router.push("/finanzas")} className="bg-teal-50 border border-teal-200 rounded-2xl p-5 text-left hover:bg-teal-100">
            <TrendingUp className="w-7 h-7 text-teal-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Finanzas</span>
            <span className="text-xs text-stone-500">P&G, Balance, Cierre</span>
          </button>
          <button onClick={() => router.push("/tienda")} className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-left hover:bg-orange-100">
            <ShoppingCart className="w-7 h-7 text-orange-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Tienda</span>
            <span className="text-xs text-stone-500">Vista del cliente</span>
          </button>
        </div>
      </div>
    </div>
  );
}

   
 