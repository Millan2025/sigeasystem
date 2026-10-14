"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { NEGOCIOS } from "@/config/negocios";
import { Armchair, BarChart3, Bell, BookOpen, Copy, FileText, Gamepad2, Heart, Lightbulb, LogOut, Mail, MapPin, Megaphone, Package, Phone, Receipt, Settings, Share2, ShoppingBag, ShoppingCart, TrendingUp, Truck, User, Users } from 'lucide-react';
import PageHeader from "./PageHeader";
import OfflineBanner from "./OfflineBanner";
import NotificationBell from "./NotificationBell";
import GuiaPasoAPaso from "./GuiaPasoAPaso";
import SugerenciasMejoras from "./SugerenciasMejoras";
import CentroAyuda from "./CentroAyuda";

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
  const [showCentroAyuda, setShowCentroAyuda] = useState(false);
  const [copiado, setCopiado] = useState('');
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

    const brandHex = (() => { const c = config?.color_principal || '#fdb813'; return c.startsWith('#') ? c : '#' + c; })();
  const brandHex2 = (() => { const c = config?.color_secundario || config?.color_principal || '#e8a800'; return c.startsWith('#') ? c : '#' + c; })();
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
      {/* ENCABEZADO INSTITUCIONAL UNIFICADO */}
      <header className="relative text-white overflow-hidden" style={{ background: `linear-gradient(140deg, ${brandHex} 0%, ${brandHex2} 100%)` }}>
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[38rem] h-[38rem] rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-10 md:pt-10 md:pb-12 text-center relative">
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setShowCentroAyuda(true)}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md ring-1 ring-white/25 text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition"
            >
              <BookOpen className="w-4 h-4" /> Ayuda
            </button>
            <button
              onClick={cerrarSesion}
              className="bg-amber-400 hover:bg-amber-300 text-stone-900 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition shadow-lg"
            >
              <LogOut className="w-4 h-4" /> Cerrar Sesión
            </button>
          </div>
          <div className="relative inline-block mb-5">
            {config?.logo_url ? (
              <img
                src={config.logo_url}
                alt={config?.nombre_negocio || 'Logo'}
                className="w-32 h-32 md:w-40 md:h-40 object-contain rounded-[2.2rem] ring-1 ring-white/30 shadow-2xl shadow-black/25"
              />
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.2rem] bg-white/15 backdrop-blur-md ring-1 ring-white/30 flex items-center justify-center text-6xl font-extrabold shadow-2xl">
                {(config?.nombre_negocio || 'MI NEGOCIO').charAt(0)}
              </div>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-sm">
            {config?.nombre_negocio || 'Mi Negocio'}
          </h1>
          {config?.slogan && (
            <p className="mt-3 text-xs md:text-sm uppercase tracking-[0.25em] text-white/80 font-medium">{config.slogan}</p>
          )}
          <div className="flex flex-wrap justify-center gap-2 mt-6 text-xs font-medium text-white/90">
            {config?.direccion && (
              <span className="bg-white/10 backdrop-blur-md ring-1 ring-white/20 rounded-full px-4 py-1.5 flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {config.direccion}</span>
            )}
            {config?.telefono && (
              <span className="bg-white/10 backdrop-blur-md ring-1 ring-white/20 rounded-full px-4 py-1.5 flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {config.telefono}</span>
            )}
            {config?.correo_contacto && (
              <span className="bg-white/10 backdrop-blur-md ring-1 ring-white/20 rounded-full px-4 py-1.5 flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {config.correo_contacto}</span>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-8 text-left max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md ring-1 ring-white/20 rounded-2xl p-4">
              <p className="font-semibold text-white text-sm mb-1 flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Enlace de Ventas (POS)</p>
              <p className="text-[11px] text-white/60 break-all mb-3">{'/' + (negocioSlug || '') + '/pos?tenant=' + tenantId}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(window.location.origin + '/' + (negocioSlug || '') + '/pos?tenant=' + tenantId); setCopiado('pos'); }}
                  className="flex-1 bg-white text-xs font-bold py-2 rounded-xl transition hover:opacity-90"
                  style={{ color: brandHex }}
                >
                  {copiado === 'pos' ? '✅ Copiado' : 'Copiar enlace'}
                </button>
                <a
                  href={'/' + (negocioSlug || '') + '/pos?tenant=' + tenantId}
                  target="_blank"
                  className="flex-1 ring-1 ring-white/30 text-white text-xs font-bold py-2 rounded-xl text-center hover:bg-white/10 transition"
                >
                  Abrir POS
                </a>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md ring-1 ring-white/20 rounded-2xl p-4">
              <p className="font-semibold text-white text-sm mb-1 flex items-center gap-2"><Truck className="w-4 h-4" /> Enlace de Domicilios (Tienda)</p>
              <p className="text-[11px] text-white/60 break-all mb-3">{'/' + (negocioSlug || '') + '/tienda?tenant=' + tenantId}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(window.location.origin + '/' + (negocioSlug || '') + '/tienda?tenant=' + tenantId); setCopiado('tienda'); }}
                  className="flex-1 bg-white text-xs font-bold py-2 rounded-xl transition hover:opacity-90"
                  style={{ color: brandHex }}
                >
                  {copiado === 'tienda' ? '✅ Copiado' : 'Copiar enlace'}
                </button>
                <a
                  href={'/' + (negocioSlug || '') + '/tienda?tenant=' + tenantId}
                  target="_blank"
                  className="flex-1 ring-1 ring-white/30 text-white text-xs font-bold py-2 rounded-xl text-center hover:bg-white/10 transition"
                >
                  Abrir Tienda
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
{/* Métricas del Día */}
        <div className="bg-white rounded-2xl p-6 text-stone-900 shadow-sm border border-stone-200" style={{ borderLeft: `6px solid ${brandHex}` }}>
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
                  className="group bg-white rounded-2xl border border-stone-200/70 p-5 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
                >
                  <span
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: brandHex + '1A', color: brandHex }}
                  >
                    <Icon className="w-6 h-6" strokeWidth={2} />
                  </span>
                  <span className="text-[13px] font-semibold text-stone-700 text-center leading-tight">{m.label}</span>
                </a>
              );
            })}
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

      {/* Modal del Centro de Ayuda */}
      {showCentroAyuda && (
        <CentroAyuda onClose={() => setShowCentroAyuda(false)} />
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







