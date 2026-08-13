"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getTenantId } from "@/lib/tenant";
import { NEGOCIOS } from "@/config/negocios";
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
  ShoppingBag,
  Receipt,
  MapPin,
  Mail,
  Globe,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import NotificationBell from './NotificationBell';

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
  slogan?: string;
  website?: string;
  whatsapp?: string;
  nequi?: string;
  bancolombia?: string;
  daviplata?: string;
  nit?: string;
  cedula?: string;
}

export default function NegocioHome({ negocioSlug, tenantId: tenantIdProp }: { negocioSlug?: string; tenantId?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [ventasHoy, setVentasHoy] = useState({ total: 0, transacciones: 0, efectivo: 0, nequi: 0, daviplata: 0 });
  const [moduloActivo, setModuloActivo] = useState<string | null>(null);
  const [showSharePos, setShowSharePos] = useState(false);
  const [showShareTienda, setShowShareTienda] = useState(false);
  const [copiadoPos, setCopiadoPos] = useState(false);
  const [copiadoTienda, setCopiadoTienda] = useState(false);
  const [showCredModal, setShowCredModal] = useState(false);
  const [credForm, setCredForm] = useState({ passwordActual: "", passwordNueva: "", passwordConfirmar: "", emailNuevo: "" });
  const [credLoading, setCredLoading] = useState(false);
  const [credError, setCredError] = useState<string | null>(null);
  const [credSuccess, setCredSuccess] = useState(false);
  const [showPassActual, setShowPassActual] = useState(false);
  const [showPassNueva, setShowPassNueva] = useState(false);
  const [emailActual, setEmailActual] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      const tenantFromUrl = searchParams.get("tenant");
      const tenantFromConfig = negocioSlug ? NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS]?.tenantId : null;
      const tenant = tenantIdProp || tenantFromUrl || tenantFromConfig || (await getTenantId());
      setTenantId(tenant);

      if (tenant) {
        try {
          const res = await fetch(`/api/tenant-config?tenant=${tenant}`);
          const dataApi = await res.json();
          if (dataApi.success && dataApi.data) {
            setConfig(dataApi.data);
          }
        } catch (e) {
          console.error("Error cargando config:", e);
        }

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


  const generarEnlace = (modulo: string) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://sigea-system.vercel.app";
    return `${baseUrl}/${negocioSlug || "restaurante"}/${modulo}?tenant=${tenantId}`;
  };

  const copiarAlPortapapeles = async (texto: string, tipo: "pos" | "tienda") => {
    try {
      await navigator.clipboard.writeText(texto);
      if (tipo === "pos") {
        setCopiadoPos(true);
        setTimeout(() => setCopiadoPos(false), 2000);
      } else {
        setCopiadoTienda(true);
        setTimeout(() => setCopiadoTienda(false), 2000);
      }
    } catch (e) {
      alert("No se pudo copiar. Copia manualmente: " + texto);
    }
  };
    // ===== CAMBIO DE CREDENCIALES (SEGURIDAD DEL DUEÑO) =====
  const abrirModalCred = async () => {
    setCredError(null);
    setCredSuccess(false);
    setCredForm({ passwordActual: "", passwordNueva: "", passwordConfirmar: "", emailNuevo: "" });
    const { data } = await supabase.auth.getUser();
    if (data?.user?.email) setEmailActual(data.user.email);
    setShowCredModal(true);
  };

  const fortalezaPass = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
    // ===== CERRAR SESIÓN =====
  const cerrarSesion = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (e) {
      console.error("Error al cerrar sesión:", e);
      window.location.href = "/login";
    }
  };

  const cambiarCredenciales = async () => {
    setCredError(null);
    if (!credForm.passwordActual) { setCredError("Ingresa tu contraseña actual"); return; }
    if (credForm.passwordNueva.length < 8) { setCredError("La nueva contraseña debe tener al menos 8 caracteres"); return; }
    if (!/[A-Z]/.test(credForm.passwordNueva) || !/[0-9]/.test(credForm.passwordNueva)) { setCredError("La nueva contraseña debe incluir al menos 1 mayúscula y 1 número"); return; }
    if (credForm.passwordNueva !== credForm.passwordConfirmar) { setCredError("Las contraseñas nuevas no coinciden"); return; }
    if (credForm.passwordNueva === credForm.passwordActual) { setCredError("La nueva contraseña debe ser diferente a la actual"); return; }
    setCredLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.email) { setCredError("No se pudo obtener tu sesión. Vuelve a iniciar sesión."); return; }
      const emailActualSesion = userData.user.email;
      const { error: authError } = await supabase.auth.signInWithPassword({ email: emailActualSesion, password: credForm.passwordActual });
      if (authError) { setCredError("Contraseña actual incorrecta"); return; }
      if (credForm.emailNuevo && credForm.emailNuevo.trim() && credForm.emailNuevo.trim() !== emailActualSesion) {
        const { error: emailErr } = await supabase.auth.updateUser({ email: credForm.emailNuevo.trim() });
        if (emailErr) { setCredError("Error al cambiar el email: " + emailErr.message); return; }
      }
      const { error: passErr } = await supabase.auth.updateUser({ password: credForm.passwordNueva });
      if (passErr) { setCredError("Error al cambiar la contraseña: " + passErr.message); return; }
      setCredSuccess(true);
      setTimeout(async () => { await supabase.auth.signOut(); window.location.href = "/login"; }, 3000);
    } catch (e) {
      setCredError("Error de conexión. Intenta de nuevo.");
    } finally {
      setCredLoading(false);
    }
  };
  const compartirWhatsApp = (texto: string, enlace: string) => {
    const mensaje = `${texto}\n\n${enlace}`;
    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  };
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

  // Color principal: #fdb813 (amarillo oro vibrante)
  const primaryColor = "#fdb813";
  const secondaryColor = "#D4A017"; // dorado oscuro para el degradado

  const modulos = [
    { id: "pos", label: "Nueva Venta", icon: ShoppingCart, color: "bg-amber-50 border-2 border-[#B8860B] text-amber-600", href: `/${negocioSlug || "restaurante"}/pos?tenant=${tenantId}` },
    { id: "produccion", label: "Producción", icon: ChefHat, color: "bg-lime-50 border-2 border-[#B8860B] text-lime-600", href: `/${negocioSlug || "restaurante"}/produccion?tenant=${tenantId}` },
    { id: "inventario", label: "Inventario", icon: Package, color: "bg-amber-50 border-2 border-[#B8860B] text-amber-600", href: `/${negocioSlug || "restaurante"}/inventario?tenant=${tenantId}` },
    { id: "personal", label: "Personal", icon: Users, color: "bg-purple-50 border-2 border-[#B8860B] text-purple-600", href: `/${negocioSlug || "restaurante"}/personal?tenant=${tenantId}` },
    { id: "pedidos", label: "Pedidos", icon: Truck, color: "bg-sky-50 border-2 border-[#B8860B] text-sky-600", href: `/${negocioSlug || "restaurante"}/pedidos?tenant=${tenantId}` },
    { id: "reportes", label: "Reportes", icon: BarChart3, color: "bg-rose-50 border-2 border-[#B8860B] text-rose-600", href: `/${negocioSlug || "restaurante"}/reportes?tenant=${tenantId}` },
    { id: "finanzas", label: "Finanzas", icon: TrendingUp, color: "bg-teal-50 border-2 border-[#B8860B] text-teal-600", href: `/${negocioSlug || "restaurante"}/finanzas?tenant=${tenantId}` },
    { id: "tienda", label: "Tienda", icon: ShoppingCart, color: "bg-orange-50 border-2 border-[#B8860B] text-orange-600", href: `/${negocioSlug || "restaurante"}/tienda?tenant=${tenantId}` },
    { id: "compras", label: "Compras", icon: ShoppingBag, color: "bg-indigo-50 border-2 border-[#B8860B] text-indigo-600", href: `/${negocioSlug || "restaurante"}/compras?tenant=${tenantId}` },
    { id: "creditos", label: "Créditos", icon: Receipt, color: "bg-pink-50 border-2 border-[#B8860B] text-pink-600", href: `/${negocioSlug || "restaurante"}/creditos?tenant=${tenantId}` },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* HEADER - LANDING CENTRALIZADA CON FONDO AMARILLO ORO VIBRANTE */}
      <header
        className="text-stone-800 px-4 py-12 text-center shadow-lg relative overflow-hidden"
        style={{
          background: `linear-gradient(145deg, #fdb813, #e8a800)`,
        }}
      >
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl mx-auto pt-14 sm:pt-0">
	          {/* Botón Cerrar Sesión - Esquina superior derecha */}
                  {/* Botón Notificaciones - junto al de Cerrar Sesión */}
          <div className="absolute top-0 right-28 z-20">
            <NotificationBell tenantId={tenantId} />
          </div>  
	<button
            onClick={cerrarSesion}
            className="absolute top-0 right-0 bg-white/90 hover:bg-white text-stone-700 font-semibold px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition flex items-center gap-2 text-sm z-20"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
          {config.logo_url ? (
            <img
              src={config.logo_url}
              alt={config.nombre_negocio}
              className="w-48 h-48 rounded-full object-cover border-4 border-[#B8860B] shadow-2xl mx-auto mb-4 transition-transform hover:scale-105"
            />
          ) : (
            <div
              className="w-48 h-48 rounded-full bg-white/30 flex items-center justify-center text-8xl font-bold mx-auto mb-4 shadow-2xl border-4 border-[#B8860B]"
              style={{ color: "#5D4037", textShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
            >
              {config.nombre_negocio
                .split(" ")
                .map((p) => p[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight drop-shadow-md text-stone-800">{config.nombre_negocio}</h1>
          <p className="text-xl md:text-2xl font-light mt-2 text-stone-700/90 italic drop-shadow">{(config as any)?.slogan || ""}</p>

          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm md:text-base">
            <span className="flex items-center gap-2 bg-white/40 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-md border border-[#B8860B]">
              <MapPin className="w-4 h-4 text-stone-700" /> <span className="text-stone-800">{config.direccion}</span>
            </span>
            <span className="flex items-center gap-2 bg-white/40 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-md border border-[#B8860B]">
              <Phone className="w-4 h-4 text-stone-700" /> <span className="text-stone-800">{config.telefono}</span>
            </span>
            {config.correo_contacto && (
              <span className="flex items-center gap-2 bg-white/40 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-md border border-[#B8860B]">
                <Mail className="w-4 h-4 text-stone-700" /> <span className="text-stone-800">{config.correo_contacto}</span>
              </span>
            )}
            <span className="flex items-center gap-2 bg-white/40 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-md border border-[#B8860B]">
              <Globe className="w-4 h-4 text-stone-700" /> <span className="text-stone-800">{SITIO_WEB}</span>
            </span>
          </div>

          <div className="mt-6">
            <span className="px-5 py-1.5 bg-white/40 backdrop-blur-sm rounded-full text-sm font-semibold shadow-md border border-[#B8860B] text-stone-800">
              Plan {config.plan}
            </span>
          </div>
        </div>

          {/* BOTONES DE COMPARTIR ENLACES */}
          <div className="relative z-10 flex flex-wrap gap-3 justify-center mt-6">
            <button
              onClick={() => setShowSharePos(true)}
              className="bg-white/90 hover:bg-white text-amber-700 font-bold px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition flex items-center gap-2 text-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              Compartir POS (Trabajadores)
            </button>
            <button
              onClick={() => setShowShareTienda(true)}
              className="bg-white/90 hover:bg-white text-orange-700 font-bold px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition flex items-center gap-2 text-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              Compartir Tienda (Clientes)
            </button>
	                <button
              onClick={abrirModalCred}
              className="bg-white/90 hover:bg-white text-stone-700 font-bold px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition flex items-center gap-2 text-sm"
            >
              <Lock className="w-4 h-4" />
              Cambiar Credenciales
            </button>
          </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <div className="p-4 max-w-7xl mx-auto">
        {/* Tarjeta de Ventas de Hoy con relieve */}
        <div
          className="rounded-2xl p-6 text-stone-800 mb-6 shadow-2xl relative overflow-hidden transition-transform hover:scale-[1.02]"
          style={{
            background: `linear-gradient(145deg, #fdb813, #e8a800)`,
          }}
        >
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm pointer-events-none"></div>
          <div className="relative z-10">
            <p className="text-stone-700/80 text-sm font-light tracking-wider">VENTAS DE HOY</p>
            <p className="text-4xl font-bold mt-1 drop-shadow text-stone-800">${ventasHoy.total.toLocaleString()}</p>
            <p className="text-sm text-stone-700/80 mt-2">
              {ventasHoy.transacciones} transacciones · Efectivo {ventasHoy.efectivo}% · Nequi {ventasHoy.nequi}% · Daviplata{" "}
              {ventasHoy.daviplata}%
            </p>
          </div>
        </div>

        <h2 className="font-bold text-stone-800 mb-6 text-center text-2xl tracking-wide">
          Tu Negocio Bajo control, productividad, tranquilidad, paz y crecimiento.
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {modulos.map((m) => (
            <Link
              key={m.id}
              href={m.href}
              className={`${m.color} rounded-2xl p-5 text-left border-2 border-[#B8860B] shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] active:scale-95 no-underline block relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>
              <m.icon className="w-7 h-7 mb-2 relative z-10" />
              <span className="font-semibold text-stone-800 block relative z-10">{m.label}</span>
              <span className="text-xs text-stone-500 relative z-10">Toca para ingresar</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Modal de beneficios (sin cambios) */}
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

      {/* ============================================
          MODAL: COMPARTIR POS (Trabajadores)
          ============================================ */}
      {showSharePos && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSharePos(false)}
        >
          <div
            className="bg-white rounded-3xl p-4 sm:p-6 w-full max-w-[calc(100vw-2rem)] sm:max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl text-stone-900 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-amber-600" />
                Compartir POS
              </h2>
              <button onClick={() => setShowSharePos(false)} className="p-2 hover:bg-stone-100 rounded-xl">
                <X className="w-5 h-5 text-stone-600" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
              <p className="text-sm text-stone-700 mb-2">
                <strong>📱 Comparte este enlace</strong> con tus trabajadores para que puedan atender ventas en el POS.
              </p>
              <p className="text-xs text-stone-600">
                Cada trabajador podrá acceder al sistema de cobro con su propio dispositivo.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-stone-700 mb-2">Enlace del POS:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={generarEnlace("pos")}
                  className="flex-1 p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-700 font-mono"
                />
                <button
                  onClick={() => copiarAlPortapapeles(generarEnlace("pos"), "pos")}
                  className={
                    "px-4 py-2 rounded-xl font-bold text-white transition " +
                    (copiadoPos ? "bg-green-500" : "bg-amber-500 hover:bg-amber-600")
                  }
                >
                  {copiadoPos ? "✓ Copiado" : "Copiar"}
                </button>
              </div>
            </div>

            <button
              onClick={() =>
                compartirWhatsApp(
                  `🛒 *Acceso al POS de ${config?.nombre_negocio || "Mi Negocio"}*\\n\\nHola! Usa este enlace para acceder al sistema de punto de venta:`,
                  generarEnlace("pos")
                )
              }
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <Phone className="w-5 h-5" />
              Compartir por WhatsApp
            </button>

            <p className="text-xs text-stone-500 text-center mt-3">
              💡 Tip: Envíalo al grupo de WhatsApp de tu equipo de trabajo
            </p>
          </div>
        </div>
      )}

      {/* ============================================
          MODAL: COMPARTIR TIENDA (Clientes)
          ============================================ */}
      {showShareTienda && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowShareTienda(false)}
        >
          <div
            className="bg-white rounded-3xl p-4 sm:p-6 w-full max-w-[calc(100vw-2rem)] sm:max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl text-stone-900 flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-orange-600" />
                Compartir Tienda
              </h2>
              <button onClick={() => setShowShareTienda(false)} className="p-2 hover:bg-stone-100 rounded-xl">
                <X className="w-5 h-5 text-stone-600" />
              </button>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
              <p className="text-sm text-stone-700 mb-2">
                <strong>🛍️ Comparte este enlace</strong> con tus clientes para que puedan hacer pedidos a domicilio.
              </p>
              <p className="text-xs text-stone-600">
                Ideal para grupos de WhatsApp del barrio, redes sociales o estados.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-stone-700 mb-2">Enlace de la Tienda:</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  readOnly
                  value={generarEnlace("tienda")}
                  className="flex-1 p-3 bg-stone-50 min-w-0 truncate border border-stone-300 rounded-xl text-xs text-stone-700 font-mono"
                />
                <button
                  onClick={() => copiarAlPortapapeles(generarEnlace("tienda"), "tienda")}
                  className={
                    "px-4 py-2 rounded-xl font-bold text-white transition " +
                    (copiadoTienda ? "bg-green-500" : "bg-orange-500 hover:bg-orange-600")
                  }
                >
                  {copiadoTienda ? "✓ Copiado" : "Copiar"}
                </button>
              </div>
            </div>

            <button
              onClick={() =>
                compartirWhatsApp(
                  `🍗 *${config?.nombre_negocio || "Mi Negocio"}*\\n${config?.slogan || "Tu tienda de confianza"}\\n\\n¡Haz tu pedido a domicilio! 🚚`,
                  generarEnlace("tienda")
                )
              }
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <Phone className="w-5 h-5" />
              Compartir por WhatsApp
            </button>

            <p className="text-xs text-stone-500 text-center mt-3">
              💡 Tip: Compártelo en los grupos de WhatsApp del barrio y en tus estados
            </p>
          </div>
        </div>
      )}
            {/* MODAL: CAMBIAR CREDENCIALES */}
      {showCredModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCredModal(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl text-stone-900 flex items-center gap-2">
                <Lock className="w-6 h-6 text-amber-600" />
                Cambiar Credenciales
              </h2>
              <button onClick={() => setShowCredModal(false)} className="p-2 hover:bg-stone-100 rounded-xl">
                <X className="w-5 h-5 text-stone-600" />
              </button>
            </div>

            {credSuccess ? (
              <div className="text-center py-6">
                <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="font-bold text-lg text-stone-900 mb-2">¡Credenciales actualizadas!</h3>
                <p className="text-sm text-stone-600">Por seguridad, cerrarás sesión en unos segundos para ingresar con tu nueva contraseña.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3">
                  <p className="text-xs text-stone-500 mb-1">Usuario actual (email)</p>
                  <p className="text-sm font-semibold text-stone-800 break-all">{emailActual || "Cargando..."}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Contraseña actual *</label>
                  <div className="relative">
                    <input type={showPassActual ? "text" : "password"} value={credForm.passwordActual} onChange={(e) => setCredForm({ ...credForm, passwordActual: e.target.value })} className="w-full border border-stone-300 rounded-xl px-3 py-2 pr-10 text-stone-800" placeholder="Tu contraseña actual" />
                    <button type="button" onClick={() => setShowPassActual(!showPassActual)} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500">
                      {showPassActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Nueva contraseña *</label>
                  <div className="relative">
                    <input type={showPassNueva ? "text" : "password"} value={credForm.passwordNueva} onChange={(e) => setCredForm({ ...credForm, passwordNueva: e.target.value })} className="w-full border border-stone-300 rounded-xl px-3 py-2 pr-10 text-stone-800" placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número" />
                    <button type="button" onClick={() => setShowPassNueva(!showPassNueva)} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500">
                      {showPassNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {credForm.passwordNueva && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((n) => (
                          <div key={n} className={`h-1.5 flex-1 rounded-full ${fortalezaPass(credForm.passwordNueva) >= n ? (fortalezaPass(credForm.passwordNueva) <= 2 ? "bg-red-500" : fortalezaPass(credForm.passwordNueva) === 3 ? "bg-amber-500" : "bg-emerald-500") : "bg-stone-200"}`} />
                        ))}
                      </div>
                      <p className="text-xs text-stone-500 mt-1">{fortalezaPass(credForm.passwordNueva) <= 2 ? "Débil" : fortalezaPass(credForm.passwordNueva) === 3 ? "Media" : "Fuerte"}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Confirmar nueva contraseña *</label>
                  <input type="password" value={credForm.passwordConfirmar} onChange={(e) => setCredForm({ ...credForm, passwordConfirmar: e.target.value })} className="w-full border border-stone-300 rounded-xl px-3 py-2 text-stone-800" placeholder="Repite la nueva contraseña" />
                  {credForm.passwordConfirmar && credForm.passwordConfirmar !== credForm.passwordNueva && (
                    <p className="text-xs text-red-600 mt-1">Las contraseñas no coinciden</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Nuevo email (opcional)</label>
                  <input type="email" value={credForm.emailNuevo} onChange={(e) => setCredForm({ ...credForm, emailNuevo: e.target.value })} className="w-full border border-stone-300 rounded-xl px-3 py-2 text-stone-800" placeholder="Deja vacío para mantener el email actual" />
                  <p className="text-xs text-stone-500 mt-1">Si lo cambias, recibirás un correo de confirmación.</p>
                </div>

                {credError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{credError}</div>
                )}

                <button onClick={cambiarCredenciales} disabled={credLoading} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50">
                  <KeyRound className="w-5 h-5" />
                  {credLoading ? "Actualizando..." : "Actualizar Credenciales"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


