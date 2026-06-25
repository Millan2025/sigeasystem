"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ShoppingCart, DollarSign, Package, Users, Truck, 
  BarChart3, TrendingUp, Share2, ChefHat, ArrowLeft,
  Store
} from "lucide-react";

interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  icono: string;
  unidad: string;
}

interface NegocioConfig {
  titulo: string;
  icono: string;
  categoria: string;
  tenantId: string;
}

export function NegocioDashboard({ 
  negocio,
  config 
}: { 
  negocio: string;
  config: NegocioConfig;
}) {
  const router = useRouter();
  const [cajaAbierta, setCajaAbierta] = useState(true);
  const [ventasHoy, setVentasHoy] = useState(450000);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    fetch(`/api/products?categoria=${encodeURIComponent(config.categoria)}&tenant=${config.tenantId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setProductos(d.data || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/sales")
      .then(r => r.json())
      .then(d => {
        if (d.success && d.totales) setVentasHoy(d.totales.total || 0);
      })
      .catch(() => {});
  }, [config]);

  const modulos = [
    { label: "Nueva Venta", icon: ShoppingCart, href: `/demo/${negocio}/pos`, color: "emerald" },
    { label: "Inventario", icon: Package, href: `/demo/${negocio}/inventario`, color: "amber" },
    { label: "Produccion", icon: ChefHat, href: `/demo/${negocio}/produccion`, color: "lime" },
    { label: "Personal", icon: Users, href: `/demo/${negocio}/personal`, color: "purple" },
    { label: "Pedidos", icon: Truck, href: `/demo/${negocio}/pedidos`, color: "sky" },
    { label: "Reportes", icon: BarChart3, href: `/demo/${negocio}/reportes`, color: "rose" },
    { label: "Finanzas", icon: TrendingUp, href: `/demo/${negocio}/finanzas`, color: "teal" },
    { label: "Tienda", icon: ShoppingCart, href: `/demo/${negocio}/tienda`, color: "orange" },
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
            <h1 className="text-2xl font-bold">{config.titulo}</h1>
            <p className="text-stone-300 text-sm">{config.icono} Demo · {productos.length} productos</p>
          </div>
          <button onClick={() => setShowShare(!showShare)} className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition">
            <Share2 className="w-5 h-5" />
          </button>
          <span className="px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500">Caja Abierta</span>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white cursor-pointer" onClick={() => router.push(`/demo/${negocio}/finanzas`)}>
          <p className="text-emerald-100 text-sm">VENTAS DE HOY</p>
          <p className="text-4xl font-bold mt-1">${ventasHoy.toLocaleString()}</p>
          <p className="text-sm text-emerald-100 mt-2">{productos.length} productos disponibles</p>
        </div>

        <div>
          <h2 className="font-semibold text-stone-700 mb-3">📦 Productos de {config.titulo}</h2>
          {loading ? (
            <div className="text-center py-8 text-stone-400">Cargando productos...</div>
          ) : productos.length === 0 ? (
            <div className="text-center py-8 text-stone-400">No hay productos disponibles</div>
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
          {modulos.map((mod) => {
            const colorMap: Record<string, string> = {
              emerald: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-600",
              amber: "bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-600",
              lime: "bg-lime-50 border-lime-200 hover:bg-lime-100 text-lime-600",
              purple: "bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-600",
              sky: "bg-sky-50 border-sky-200 hover:bg-sky-100 text-sky-600",
              rose: "bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-600",
              teal: "bg-teal-50 border-teal-200 hover:bg-teal-100 text-teal-600",
              orange: "bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-600",
            };
            return (
              <Link
                key={mod.label}
                href={mod.href}
                className={`rounded-2xl p-5 text-left border hover:shadow-md transition ${colorMap[mod.color]}`}
              >
                <mod.icon className="w-7 h-7 mb-2" />
                <span className="font-semibold text-stone-800 block">{mod.label}</span>
                <span className="text-xs text-stone-500">Ir al módulo</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
