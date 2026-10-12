"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { NEGOCIOS } from "@/config/negocios";
import { 
  ShoppingCart, Package, TrendingUp, Users, Truck, BarChart3, 
  ShoppingBag, Receipt, Megaphone, Armchair, Gamepad2, FileText, 
  Heart, BookOpen, Lightbulb, Share2, Copy, LogOut, User, Settings, Bell 
} from "lucide-react";
import PageHeader from "./PageHeader";
import OfflineBanner from "./OfflineBanner";
import NotificationBell from "./NotificationBell";
import GuiaPasoAPaso from "./GuiaPasoAPaso";
import SugerenciasMejoras from "./SugerenciasMejoras";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface NegocioHomeProps {
  negocioSlug?: string;
  tenantId?: string;
}
export default function NegocioHome({ negocioSlug: propSlug, tenantId: propTenantId }: NegocioHomeProps = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathParts = pathname?.split("/") || [];
  const isDemo = pathParts[1] === "demo";
  const currentSlug = propSlug || (isDemo ? pathParts[2] : pathParts[1]);
  const negocioSlug = currentSlug || "restaurante";
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const tenantFromConfig = negocio?.tenantId || null;
  const tenantId = propTenantId || searchParams.get("tenant") || tenantFromConfig || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";

  const [config, setConfig] = useState<any>(null);
  const [ventasDia, setVentasDia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCredModal, setShowCredModal] = useState(false);
  const [showGuiaPasoAPaso, setShowGuiaPasoAPaso] = useState(false);
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Cargar configuración y ventas del día
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resConfig, resVentas] = await Promise.all([
          fetch(`/api/tenant-config?tenant=${tenantId}`),
          fetch(`/api/ventas?tenant=${tenantId}&start=${new Date().toISOString().split('T')[0]}`)
        ]);
        const dataConfig = await resConfig.json();
        const dataVentas = await resVentas.json();
        
        if (dataConfig.success) setConfig(dataConfig.data);
        if (dataVentas.success) setVentasDia(dataVentas.data || []);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [tenantId]);

  // Warm-up de cache para modo offline
  useEffect(() => {
    if (!navigator.onLine) return;
    const warmKey = "warm-" + tenantId;
    if (sessionStorage.getItem(warmKey)) return;
    
    const prefix = isDemo ? `/demo/${negocioSlug}` : `/${negocioSlug}`;
    const modulosToWarm = ["pos", "inventario", "finanzas", "clientes", "pedidos"];
    const apisToWarm = [
      `/api/ventas?tenant=${tenantId}`,
      `/api/finanzas?tenant=${tenantId}`,
      `/api/pedidos?tenant=${tenantId}`
    ];
    
    const timers: any[] = [];
    modulosToWarm.forEach((m, i) => {
      timers.push(setTimeout(() => {
        fetch(`${prefix}/${m}?tenant=${tenantId}`).catch(() => {});
      }, 1500 + i * 300));
    });
    apisToWarm.forEach((u, i) => {
      timers.push(setTimeout(() => {
        fetch(u).catch(() => {});
      }, 1500 + i * 300));
    });
    
    sessionStorage.setItem(warmKey, "1");
    return () => timers.forEach(clearTimeout);
  }, [tenantId, negocioSlug, isDemo]);

  const prefix = isDemo ? `/demo/${negocioSlug}` : `/${negocioSlug}`;
  
  const modulos = [
    { id: "pos", label: "Nueva Venta", icon: ShoppingCart, color: "bg-amber-50 border-2 border-[#B8860B] text-amber-600", href: `${prefix}/pos?tenant=${tenantId}` },
    { id: "produccion", label: "Producción", icon: Package, color: "bg-lime-50 border-2 border-[#B8860B] text-lime-600", href: `${prefix}/produccion?tenant=${tenantId}` },
    { id: "inventario", label: "Inventario", icon: Package, color: "bg-amber-50 border-2 border-[#B8860B] text-amber-600", href: `${prefix}/inventario?tenant=${tenantId}` },
    { id: "personal", label: "Personal", icon: Users, color: "bg-purple-50 border-2 border-[#B8860B] text-purple-600", href: `${prefix}/personal?tenant=${tenantId}` },
    { id: "pedidos", label: "Pedidos", icon: Truck, color: "bg-sky-50 border-2 border-[#B8860B] text-sky-600", href: `${prefix}/pedidos?tenant=${tenantId}` },
    { id: "reportes", label: "Reportes", icon: BarChart3, color: "bg-rose-50 border-2 border-[#B8860B] text-rose-600", href: `${prefix}/reportes?tenant=${tenantId}` },
    { id: "finanzas", label: "Finanzas", icon: TrendingUp, color: "bg-teal-50 border-2 border-[#B8860B] text-teal-600", href: `${prefix}/finanzas?tenant=${tenantId}` },
    { id: "tienda", label: "Domicilios", icon: Truck, color: "bg-blue-50 border-2 border-[#B8860B] text-blue-600", href: `${prefix}/tienda?tenant=${tenantId}` },
    { id: "compras", label: "Compras", icon: ShoppingBag, color: "bg-indigo-50 border-2 border-[#B8860B] text-indigo-600", href: `${prefix}/compras?tenant=${tenantId}` },
    { id: "creditos", label: "Créditos", icon: Receipt, color: "bg-pink-50 border-2 border-[#B8860B] text-pink-600", href: `${prefix}/creditos?tenant=${tenantId}` },
    { id: "marketing", label: "Marketing", icon: Megaphone, color: "bg-emerald-50 border-2 border-emerald-600 text-emerald-700 shadow-lg", href: `${prefix}/marketing?tenant=${tenantId}` },
    { id: "mesas", label: "Mesas", icon: Armchair, color: "bg-yellow-50 border-2 border-[#B8860B] text-yellow-700", href: `/mesas-gestion?origen=${encodeURIComponent(pathname)}&tenant=${tenantId}` },
    { id: "conecta", label: "Conecta y Diviértete", icon: Gamepad2, color: "bg-violet-50 border-2 border-fuchsia-400 text-fuchsia-700", href: `${prefix}/conecta?tenant=${tenantId}` },
    { id: "facturacion", label: "Facturación", icon: FileText, color: "bg-amber-50 border-2 border-[#B8860B] text-amber-600", href: `${prefix}/facturacion?tenant=${tenantId}` },
    { id: "clientes", label: "Clientes", icon: Heart, color: "bg-pink-50 border-2 border-[#B8860B] text-pink-600", href: `${prefix}/clientes?tenant=${tenantId}` },
    { id: "guia", label: "Guía Paso a Paso", icon: BookOpen, color: "bg-cyan-50 border-2 border-cyan-600 text-cyan-700 shadow-lg", href: "#guia", esEspecial: true },
    { id: "sugerencias", label: "Mejoras y Sugerencias", icon: Lightbulb, color: "bg-violet-50 border-2 border-violet-600 text-violet-700 shadow-lg", href: "#sugerencias", esEspecial: true },
  ];

  const totalVentas = ventasDia.reduce((sum: number, v: any) => sum + Number(v.total || 0), 0);
  const totalTransacciones = ventasDia.length;

  const cerrarSesion = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (e) {
      window.location.href = "/login";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fdb813]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <OfflineBanner />
      <PageHeader 
        negocioSlug={negocioSlug} 
        titulo={config?.nombre_negocio || negocio?.titulo || "Mi Negocio"} 
        icono="🏠" 
        subtitulo="Dashboard Principal" 
        tenantId={tenantId} 
      />

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex justify-end">
          <button onClick={cerrarSesion} className="bg-stone-900 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-stone-800">
            <LogOut className="w-4 h-4" /> Cerrar Sesion
          </button>
        </div>
        {/* Métricas del Día */}
        <div className="bg-gradient-to-br from-[#fdb813] to-[#e8a800] rounded-2xl p-6 text-stone-900 shadow-lg">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">💰 Ventas del Día</h2>
          <p className="text-5xl font-extrabold mb-2">${totalVentas.toLocaleString("es-CO")}</p>
          <p className="text-stone-800 font-medium">
            {totalTransacciones} transacciones 
            {totalTransacciones > 0 && (
              <span className="ml-2 text-sm bg-stone-900/10 px-2 py-1 rounded-full">
                Promedio: ${(totalVentas / totalTransacciones).toLocaleString("es-CO")}
              </span>
            )}
          </p>
        </div>

        {/* Accesos Rápidos */}
        <div>
          <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
            🚀 Accesos Rápidos
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {modulos.map((m) => {
              const Icon = m.icon as any;
              const esEspecial = (m as any).esEspecial;
              
              const handleClick = (e: React.MouseEvent) => {
                if (m.id === "guia") {
                  e.preventDefault();
                  setShowGuiaPasoAPaso(true);
                } else if (m.id === "sugerencias") {
                  e.preventDefault();
                  setShowSugerencias(true);
                }
              };

              return (
                <a
                  key={m.id}
                  href={m.href}
                  onClick={handleClick}
                  className={`${m.color} rounded-2xl p-4 hover:scale-[1.02] transition-all duration-300 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-xl active:scale-95 ${esEspecial ? 'ring-2 ring-offset-2 ring-cyan-400/50' : ''}`}
                >
                  <Icon className="w-8 h-8" />
                  <span className="text-sm font-bold text-center leading-tight">{m.label}</span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Compartir Enlaces */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
          <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">🔗 Compartir Enlaces</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
              <p className="text-sm font-semibold text-stone-600 mb-2">Enlace del POS (para cajeros)</p>
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={`${window.location.origin}${prefix}/pos?tenant=${tenantId}`} 
                  className="flex-1 bg-white border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-600"
                />
                <button 
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}${prefix}/pos?tenant=${tenantId}`)}
                  className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-stone-800 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" /> Copiar
                </button>
              </div>
            </div>
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
              <p className="text-sm font-semibold text-stone-600 mb-2">Enlace de la Tienda (para clientes)</p>
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={`${window.location.origin}${prefix}/tienda?tenant=${tenantId}`} 
                  className="flex-1 bg-white border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-600"
                />
                <button 
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}${prefix}/tienda?tenant=${tenantId}`)}
                  className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-stone-800 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" /> Copiar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Guía Paso a Paso */}
      {showGuiaPasoAPaso && (
        <GuiaPasoAPaso
          tenantId={tenantId}
          negocioNombre={config?.nombre_negocio || negocio?.titulo}
          onClose={() => setShowGuiaPasoAPaso(false)}
        />
      )}

      {/* Modal de Sugerencias y Mejoras */}
      {showSugerencias && (
        <SugerenciasMejoras
          tenantId={tenantId}
          onClose={() => setShowSugerencias(false)}
        />
      )}
    </div>
  );
}


