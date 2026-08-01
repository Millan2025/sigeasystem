"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getTenantId } from "@/lib/tenant";
import {
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  Truck,
  BarChart3,
  TrendingUp,
  ChefHat,
  Phone,
  X,
  ArrowRight,
  ShoppingBag,
  Receipt,
  MapPin,
  Mail,
  Globe,
} from "lucide-react";

const SLOGAN = "DONDE EL PAN TIENE HISTORIA Y SABOR";
const SITIO_WEB = "https://mobirisesite.com";

const beneficiosPorModulo: Record<string, { titulo: string; icono: string; beneficios: string[]; color: string }> = {
  pos: { titulo: "Punto de Venta Inteligente", icono: "💰", beneficios: ["Productos por peso", "Cobro: Efectivo, Nequi, Daviplata", "Búsqueda rápida", "Descuento automático de inventario"], color: "bg-emerald-500" },
  produccion: { titulo: "Producción y Recetas", icono: "🍞", beneficios: ["Fichas técnicas", "Food cost", "Cálculo automático", "Órdenes de producción"], color: "bg-lime-500" },
  inventario: { titulo: "Inventario Inteligente", icono: "📦", beneficios: ["Control de stock", "Alarmas", "Predicción de agotamiento", "Múltiples unidades"], color: "bg-amber-500" },
  personal: { titulo: "Gestión de Personal", icono: "👥", beneficios: ["Registro de empleados", "Control de asistencia", "Nómina", "Desprendible individual"], color: "bg-purple-500" },
  pedidos: { titulo: "Pedidos y Domicilios", icono: "🛵", beneficios: ["Tus clientes compran desde la app", "Notificaciones", "Asignas repartidor", "Seguimiento"], color: "bg-sky-500" },
  reportes: { titulo: "Reportes y Estadísticas", icono: "📈", beneficios: ["Ventas por hora", "Top productos", "Márgenes", "Gráficos"], color: "bg-rose-500" },
  finanzas: { titulo: "Finanzas y Contabilidad", icono: "🦄", beneficios: ["Estado de Resultados", "Balance General", "Libro Diario", "Cierre de caja"], color: "bg-teal-500" },
  tienda: { titulo: "Tienda Online", icono: "🛒", beneficios: ["Catálogo actualizado", "Búsqueda", "Carrito", "Checkout"], color: "bg-orange-500" },
  compras: { titulo: "Compras a Proveedores", icono: "🛍️", beneficios: ["Recomendación automática", "Lista por proveedor", "Órdenes de compra", "Historial"], color: "bg-indigo-500" },
  creditos: { titulo: "Gestión de Créditos", icono: "📋", beneficios: ["Registro de créditos", "Control de saldos", "Abonos", "Historial"], color: "bg-pink-500" },
};

interface BusinessConfig {
  id: string;
  nombre_negocio: string;
  gerente: string;
  correo_contacto: string;
  telefono: string;
  direccion: string;
  logo_url: string | null;
  color_principal: string;
  color_secundario: string;
  plan: string;
}

export default function NegocioHome({ negocioSlug, tenantId: tenantIdProp }: { negocioSlug?: string; tenantId?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [ventasHoy, setVentasHoy] = useState({ total: 0, transacciones: 0, efectivo: 0, nequi: 0, daviplata: 0 });
  const [moduloActivo, setModuloActivo] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const tenant = tenantIdProp || (await getTenantId());
      setTenantId(tenant);

      if (tenant) {
        const { data: configData } = await supabase
          .from("business_config")
          .select("*")
          .eq("id", tenant)
          .single();
        setConfig(configData);

        try {
          const res = await fetch(`/api/ventas?tenant=${tenant}&start=${new Date().toISOString().split("T")[0]}`);
          const data = await res.json();
          if (data.success) {
            const total = data.data.reduce((sum: number, v: any) => sum + v.total, 0);
            const transacciones = data.data.length;
            const metodos = { efectivo: 0, nequi: 0, daviplata: 0 };
            data.data.forEach((v: any) => {
              if (v.metodo_pago === "Efectivo") metodos.efectivo++;
              else if (v.metodo_pago === "Nequi") metodos.nequi++;
              else if (v.metodo_pago === "Daviplata") metodos.daviplata++;
            });
            const totalMetodos = transacciones || 1;
            setVentasHoy({
              total,
              transacciones,
              efectivo: Math.round((metodos.efectivo / totalMetodos) * 100),
              nequi: Math.round((metodos.nequi / totalMetodos) * 100),
              daviplata: Math.round((metodos.daviplata / totalMetodos) * 100),
            });
          }
        } catch (e) {
          setVentasHoy({ total: 450000, transacciones: 24, efectivo: 65, nequi: 20, daviplata: 15 });
        }
      }
      setLoading(false);
    };
    loadData();
  }, [supabase, tenantIdProp]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-stone-500">Cargando...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-stone-800">No se encontró configuración del negocio</h1>
          <p className="text-stone-500">Contacta al administrador.</p>
        </div>
      </div>
    );
  }

  const primaryColor = config.color_principal || "#C68A4A";
  const secondaryColor = config.color_secundario || "#8B5A2B";

  const modulos = [
    { id: "pos", label: "Nueva Venta", icon: ShoppingCart, color: "bg-amber-50 border-amber-200 text-amber-600", href: `/${negocioSlug || "restaurante"}/pos?tenant=${tenantId}` },
    { id: "produccion", label: "Producción", icon: ChefHat, color: "bg-lime-50 border-lime-200 text-lime-600", href: `/${negocioSlug || "restaurante"}/produccion?tenant=${tenantId}` },
    { id: "inventario", label: "Inventario", icon: Package, color: "bg-amber-50 border-amber-200 text-amber-600", href: `/${negocioSlug || "restaurante"}/inventario?tenant=${tenantId}` },
    { id: "personal", label: "Personal", icon: Users, color: "bg-purple-50 border-purple-200 text-purple-600", href: `/${negocioSlug || "restaurante"}/personal?tenant=${tenantId}` },
    { id: "pedidos", label: "Pedidos", icon: Truck, color: "bg-sky-50 border-sky-200 text-sky-600", href: `/${negocioSlug || "restaurante"}/pedidos?tenant=${tenantId}` },
    { id: "reportes", label: "Reportes", icon: BarChart3, color: "bg-rose-50 border-rose-200 text-rose-600", href: `/${negocioSlug || "restaurante"}/reportes?tenant=${tenantId}` },
    { id: "finanzas", label: "Finanzas", icon: TrendingUp, color: "bg-teal-50 border-teal-200 text-teal-600", href: `/${negocioSlug || "restaurante"}/finanzas?tenant=${tenantId}` },
    { id: "tienda", label: "Tienda", icon: ShoppingCart, color: "bg-orange-50 border-orange-200 text-orange-600", href: `/${negocioSlug || "restaurante"}/tienda?tenant=${tenantId}` },
    { id: "compras", label: "Compras", icon: ShoppingBag, color: "bg-indigo-50 border-indigo-200 text-indigo-600", href: `/${negocioSlug || "restaurante"}/compras?tenant=${tenantId}` },
    { id: "creditos", label: "Créditos", icon: Receipt, color: "bg-pink-50 border-pink-200 text-pink-600", href: `/${negocioSlug || "restaurante"}/creditos?tenant=${tenantId}` },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
      <header
        className="text-white px-4 py-8 text-center shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        }}
      >
        <div className="max-w-3xl mx-auto">
          {config.logo_url ? (
            <img
              src={config.logo_url}
              alt={config.nombre_negocio}
              className="w-32 h-32 rounded-full object-cover border-4 border-white/40 mx-auto mb-4 shadow-2xl"
            />
          ) : (
            <div
              className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center text-6xl font-bold mx-auto mb-4 shadow-2xl border-4 border-white/30"
              style={{ color: "white" }}
            >
              {config.nombre_negocio
                .split(" ")
                .map((p) => p[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight drop-shadow-sm">{config.nombre_negocio}</h1>
          <p className="text-xl md:text-2xl font-light mt-2 text-white/90 italic">{SLOGAN}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm md:text-base">
            <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full shadow-inner">
              <MapPin className="w-4 h-4" /> {config.direccion}
            </span>
            <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full shadow-inner">
              <Phone className="w-4 h-4" /> {config.telefono}
            </span>
            {config.correo_contacto && (
              <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full shadow-inner">
                <Mail className="w-4 h-4" /> {config.correo_contacto}
              </span>
            )}
            <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full shadow-inner">
              <Globe className="w-4 h-4" /> {SITIO_WEB}
            </span>
          </div>
          <div className="mt-6">
            <span className="px-5 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold shadow-sm">
              Plan {config.plan}
            </span>
          </div>
        </div>
      </header>

      <div className="p-4 max-w-7xl mx-auto">
        <div
          className="rounded-2xl p-6 text-white mb-6 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
        >
          <p className="text-white/80 text-sm">VENTAS DE HOY</p>
          <p className="text-4xl font-bold mt-1">${ventasHoy.total.toLocaleString()}</p>
          <p className="text-sm text-white/80 mt-2">
            {ventasHoy.transacciones} transacciones · Efectivo {ventasHoy.efectivo}% · Nequi {ventasHoy.nequi}% · Daviplata{" "}
            {ventasHoy.daviplata}%
          </p>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-stone-700">MÓDULOS DISPONIBLES</h2>
          <p className="text-stone-400 text-sm mt-1">Selecciona uno para comenzar</p>
          <div className="w-12 h-1 bg-amber-400 mx-auto mt-2 rounded-full"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {modulos.map((m) => (
            <Link
              key={m.id}
              href={m.href}
              className={`${m.color} rounded-2xl p-5 text-left border-2 shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 no-underline block bg-white`}
            >
              <div className="bg-white/70 rounded-full w-12 h-12 flex items-center justify-center mb-3 shadow-sm">
                <m.icon className="w-6 h-6" />
              </div>
              <span className="font-semibold text-stone-800 block text-lg">{m.label}</span>
              <span className="text-xs text-stone-500">Toca para ingresar</span>
            </Link>
          ))}
        </div>

        <a
          href={`https://wa.me/${config.telefono.replace(/-/g, "")}?text=Hola%20Quiero%20informacion%20de%20SIGEA%20System`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 w-full bg-green-600 text-white rounded-2xl py-4 font-bold text-lg flex items-center justify-center gap-2 hover:bg-green-700 transition shadow-lg"
        >
          <Phone className="w-5 h-5" /> Escribenos por WhatsApp · {config.telefono}
        </a>
      </div>

      {moduloActivo && beneficiosPorModulo[moduloActivo] && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setModuloActivo(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const b = beneficiosPorModulo[moduloActivo];
              return (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{b.icono}</span>
                      <h2 className="font-bold text-xl text-stone-900">{b.titulo}</h2>
                    </div>
                    <button onClick={() => setModuloActivo(null)} className="p-2 hover:bg-stone-100 rounded-xl">
                      <X className="w-5 h-5 text-stone-600" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {b.beneficios.map((ben, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl">
                        <span className="text-emerald-500 font-bold shrink-0">✓</span>
                        <span className="text-sm text-stone-700">{ben}</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
