"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, DollarSign, Package, Users, Truck, BarChart3, TrendingUp, Share2, ChefHat, ArrowLeft } from "lucide-react";

interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  icono: string;
  unidad: string;
}

export function NegocioPage({
  titulo,
  icono,
  categoria,
  tenantId = "7e045520-5e36-4e3f-a39f-10ea7d6dce76"
}: {
  titulo: string;
  icono: string;
  categoria: string;
  tenantId?: string;
}) {
  const router = useRouter();
  const [cajaAbierta, setCajaAbierta] = useState(true);
  const [ventasHoy, setVentasHoy] = useState(450000);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    // Cargar productos filtrados por categoría
    fetch(`/api/products?categoria=${encodeURIComponent(categoria)}&tenant=${tenantId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setProductos(d.data || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Cargar ventas
    fetch("/api/sales")
      .then(r => r.json())
      .then(d => {
        if (d.success && d.totales) setVentasHoy(d.totales.total || 0);
      })
      .catch(() => {});
  }, [categoria, tenantId]);

  const shareLinks = [
    { label: "POS Vendedor", url: "/pos", icon: "💰", color: "bg-emerald-600" },
    { label: "Tienda Clientes", url: "/tienda", icon: "🛒", color: "bg-amber-600" },
    { label: "App Repartidor", url: "/entregas", icon: "🛵", color: "bg-sky-600" },
  ];

  return (
    <div className="min-h-screen bg-stone-50 md:max-w-2xl lg:max-w-4xl mx-auto">
      <a href="/login" className="fixed top-4 left-4 z-50 bg-red-500 text-white px-3 py-1.5 rounded-full shadow-lg text-xs font-bold no-underline hover:bg-red-600">Salir</a>

      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/demo" className="p-2 hover:bg-white/10 rounded-xl transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{titulo}</h1>
            <p className="text-stone-300 text-sm">{icono} Demo · {productos.length} productos</p>
          </div>
          <button onClick={() => setShowShare(!showShare)} className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition">
            <Share2 className="w-5 h-5" />
          </button>
          <span className="px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500">Caja Abierta</span>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white cursor-pointer" onClick={() => router.push("/finanzas")}>
          <p className="text-emerald-100 text-sm">VENTAS DE HOY</p>
          <p className="text-4xl font-bold mt-1">${ventasHoy.toLocaleString()}</p>
          <p className="text-sm text-emerald-100 mt-2">{productos.length} productos disponibles</p>
        </div>

        {/* Productos del negocio */}
        <div>
          <h2 className="font-semibold text-stone-700 mb-3">📦 Productos de {titulo}</h2>
          {loading ? (
            <div className="text-center py-8 text-stone-400">Cargando productos...</div>
          ) : productos.length === 0 ? (
            <div className="text-center py-8 text-stone-400">
              No hay productos disponibles para este negocio
              <div className="text-xs text-stone-300 mt-2">Categoría: {categoria}</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {productos.slice(0, 12).map((p) => (
                <div key={p.id} className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
                  <div className="text-3xl mb-1">{p.icono || "📦"}</div>
                  <div className="text-sm font-semibold text-stone-800 truncate">{p.nombre}</div>
                  <div className="text-xs text-stone-400">{p.unidad || "unidad"}</div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-bold text-emerald-600">${p.precio?.toLocaleString()}</span>
                    <span className="text-xs text-stone-400">Stock: {p.stock}</span>
                  </div>
                </div>
              ))}
              {productos.length > 12 && (
                <div className="col-span-full text-center text-xs text-stone-400 mt-2">
                  + {productos.length - 12} productos más
                </div>
              )}
            </div>
          )}
        </div>

        <h2 className="font-semibold text-stone-700 mt-4">ACCESOS RAPIDOS</h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push("/pos")} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-left hover:bg-emerald-100">
            <ShoppingCart className="w-7 h-7 text-emerald-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Nueva Venta</span>
            <span className="text-xs text-stone-500">POS con Buscador</span>
          </button>
          <button onClick={() => router.push("/inventario")} className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left hover:bg-amber-100">
            <Package className="w-7 h-7 text-amber-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Inventario</span>
            <span className="text-xs text-stone-500">Stock, alarmas, pedidos</span>
          </button>
          <button onClick={() => router.push("/produccion")} className="bg-lime-50 border border-lime-200 rounded-2xl p-5 text-left hover:bg-lime-100">
            <ChefHat className="w-7 h-7 text-lime-600 mb-2" />
            <span className="font-semibold text-stone-800 block">Produccion</span>
            <span className="text-xs text-stone-500">Recetas y compras</span>
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
