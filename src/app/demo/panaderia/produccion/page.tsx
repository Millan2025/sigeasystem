"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ShoppingCart, Package, Calendar, Clock, CheckCircle, Truck, Bell,
  RefreshCw, Plus, Store, ClipboardList, X, Trash2, Info, XCircle, AlertTriangle, Eye,
  Check, AlertCircle, Loader2
} from "lucide-react";
import { NEGOCIOS } from "@/config/negocios";
import PageHeader from "@/components/PageHeader";

// ===== CONSTANTES =====
const TIPOS_ORDEN = {
  pedido_tienda: { label: "Pedido Tienda", icon: Store, color: "bg-blue-100 text-blue-700 border-blue-300" },
  pedido_pos: { label: "Pedido POS", icon: ShoppingCart, color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  surtir_vitrina: { label: "Surtir Vitrina", icon: Package, color: "bg-amber-100 text-amber-700 border-amber-300" },
  produccion_planificada: { label: "Producción Planificada", icon: Calendar, color: "bg-purple-100 text-purple-700 border-purple-300" },
};

const ESTADOS = {
  pendiente: { label: "Pendiente", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
  en_produccion: { label: "En Producción", icon: RefreshCw, color: "bg-blue-100 text-blue-700" },
  finalizado: { label: "Finalizado", icon: CheckCircle, color: "bg-emerald-100 text-emerald-700" },
  entregado: { label: "Entregado", icon: Truck, color: "bg-stone-100 text-stone-600" },
  pausada_por_produccion: { label: "Pausada", icon: AlertTriangle, color: "bg-orange-100 text-orange-700" },
  cerrada: { label: "Cerrada", icon: XCircle, color: "bg-red-100 text-red-700" },
};

const ESTADOS_ORDEN = ["pendiente", "en_produccion", "finalizado", "entregado", "pausada_por_produccion", "cerrada"];

// ===== INTERFACES =====
interface InsumoOrden {
  insumo_id: string;
  cantidad: number;
  precio_unitario?: number;
  subtotal?: number;
  insumo?: { id: string; nombre: string; stock?: number; precio_compra?: number };
}

interface Orden {
  id: string;
  pedido_id?: string;
  producto_id?: string;
  cantidad_producida?: number;
  tipo: keyof typeof TIPOS_ORDEN;
  estado: keyof typeof ESTADOS;
  productos?: { nombre: string; cantidad: number; unidad: string }[];
  insumos?: InsumoOrden[];
  producto?: { id: string; nombre: string; stock?: number; precio_compra?: number; tipo_producto?: string };
  nota: string;
  creado_por: string;
  creado_en: string;
  actualizado_en: string;
  producido_por?: string;
  motivo_cierre?: string;
  pausado_por?: string;
  pausado_en?: string;
  cerrado_por?: string;
  fecha_cierre?: string;
}

interface Toast {
  id: string;
  tipo: "success" | "error" | "info" | "warning";
  mensaje: string;
  duracion?: number;
}

interface ConfirmModal {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  onConfirm: () => void;
  tipo?: "danger" | "warning" | "info";
}

// ===== HELPERS =====
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchConRetry = async (url: string, options?: RequestInit, reintentos = 2): Promise<Response> => {
  for (let i = 0; i <= reintentos; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok && res.status >= 500 && i < reintentos) {
        await sleep(1000 * (i + 1));
        continue;
      }
      return res;
    } catch (e) {
      if (i === reintentos) throw e;
      await sleep(1000 * (i + 1));
    }
  }
  throw new Error("Error de red");
};

// ===== COMPONENTE PRINCIPAL =====
function ProduccionContent() {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const pathParts = pathname?.split("/") || [];
  const negocioSlug = pathParts[1] || "restaurante";
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const searchParams = useSearchParams();
  const tenantFromUrl = searchParams.get("tenant");
  const tenantId = tenantFromUrl || negocio?.tenantId || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";

  const esRestaurante = negocioSlug === "restaurante";

  // ===== ESTADOS =====
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loadingOrdenes, setLoadingOrdenes] = useState(true);
  const [showModalOrden, setShowModalOrden] = useState(false);
  const [nuevaOrden, setNuevaOrden] = useState({
    tipo: "pedido_pos" as keyof typeof TIPOS_ORDEN,
    producto_id: "",
    cantidad_producida: 1,
    insumos: [{ insumo_id: "", cantidad: 1 }],
    nota: "",
  });
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [vista, setVista] = useState<"admin" | "productor">("admin");
  const [contadorNuevas, setContadorNuevas] = useState(0);
  const [productos, setProductos] = useState<any[]>([]);
  const [jornada, setJornada] = useState<any[]>([]);
  const [fechaJornada, setFechaJornada] = useState(new Date().toISOString().split("T")[0]);
  const [showModalJornada, setShowModalJornada] = useState(false);
  const [formJornada, setFormJornada] = useState<{ producto_id: string; cantidad: number }[]>([]);
  const [resumenJornada, setResumenJornada] = useState({ planificado: 0, vendido: 0, restante: 0 });
  const [tab, setTab] = useState<"ordenes" | "jornada">("ordenes");
  const [showModalCierre, setShowModalCierre] = useState(false);
  const [ordenACerrar, setOrdenACerrar] = useState<Orden | null>(null);
  const [formCierre, setFormCierre] = useState({ motivo: "", fecha: new Date().toISOString().slice(0, 16) });
  const [showModalDetalles, setShowModalDetalles] = useState(false);
  const [ordenDetalles, setOrdenDetalles] = useState<Orden | null>(null);

  // ===== NUEVOS ESTADOS PARA MEJORAS =====
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmModal, setConfirmModal] = useState<ConfirmModal>({
    abierto: false, titulo: "", mensaje: "", onConfirm: () => {}, tipo: "info"
  });
  const [accionesEnProgreso, setAccionesEnProgreso] = useState<Set<string>>(new Set());

  // ===== SISTEMA DE TOAST =====
  const showToast = (tipo: Toast["tipo"], mensaje: string, duracion = 4000) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, tipo, mensaje, duracion }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duracion);
  };

  const mostrarConfirmacion = (
    titulo: string,
    mensaje: string,
    onConfirm: () => void,
    tipo: ConfirmModal["tipo"] = "info"
  ) => {
    setConfirmModal({ abierto: true, titulo, mensaje, onConfirm, tipo });
  };

  const setAccionEnProgreso = (id: string, enProgreso: boolean) => {
    setAccionesEnProgreso(prev => {
      const nuevo = new Set(prev);
      if (enProgreso) nuevo.add(id);
      else nuevo.delete(id);
      return nuevo;
    });
  };

  // ===== CARGA DE DATOS (OPTIMIZADA) =====
  const cargarProductos = async () => {
    try {
      const res = await fetchConRetry(`/api/products?tenant=${tenantId}`);
      const data = await res.json();
      if (data.success) setProductos(data.data || []);
    } catch (e) {
      console.error("Error cargando productos:", e);
      showToast("error", "Error al cargar productos");
    }
  };

  const cargarOrdenes = async (silencioso = false) => {
    if (!silencioso) setLoadingOrdenes(true);
    try {
      const res = await fetchConRetry(`/api/ordenes-produccion?tenant=${tenantId}`);
      const data = await res.json();
      if (data.success) {
        setOrdenes(data.data || []);
        const nuevas = data.data.filter(
          (o: Orden) => o.estado === "pendiente" && new Date(o.creado_en) > new Date(Date.now() - 60000)
        ).length;
        setContadorNuevas(nuevas);
      }
    } catch (e) {
      setOrdenes([]);
      showToast("error", "Error al cargar órdenes");
    } finally {
      if (!silencioso) setLoadingOrdenes(false);
    }
  };

  const cargarTodo = async () => {
    setLoadingOrdenes(true);
    try {
      await Promise.all([cargarProductos(), cargarOrdenes(true)]);
    } finally {
      setLoadingOrdenes(false);
    }
  };

  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
    cargarTodo();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [tenantId]);

  // ===== CREAR ORDEN (CON VALIDACIÓN DE STOCK) =====
  const crearOrden = async () => {
    if (!nuevaOrden.producto_id) {
      showToast("warning", "Selecciona un producto");
      return;
    }
    if (nuevaOrden.insumos.some(i => !i.insumo_id)) {
      showToast("warning", "Completa todos los insumos");
      return;
    }

    // Validar stock de insumos
    const insumosSinStock = nuevaOrden.insumos.filter(ins => {
      const prod = productos.find(p => p.id === ins.insumo_id);
      return prod && prod.stock !== undefined && prod.stock < ins.cantidad;
    });
    if (insumosSinStock.length > 0) {
      showToast("warning", "Stock insuficiente en algunos insumos");
      return;
    }

    const body = {
      tenant_id: tenantId,
      tipo: nuevaOrden.tipo,
      producto_id: nuevaOrden.producto_id,
      cantidad_producida: nuevaOrden.cantidad_producida,
      insumos: nuevaOrden.insumos,
      nota: nuevaOrden.nota || "",
      creado_por: "Admin",
    };

    setAccionEnProgreso("crear-orden", true);
    try {
      const res = await fetchConRetry("/api/ordenes-produccion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        if (audioRef.current) audioRef.current.play().catch(() => {});
        setContadorNuevas(prev => prev + 1);
        showToast("success", `📢 Nueva orden #${data.data.id.slice(0, 6)} creada`);
        setShowModalOrden(false);
        setNuevaOrden({
          tipo: "pedido_pos", producto_id: "", cantidad_producida: 1,
          insumos: [{ insumo_id: "", cantidad: 1 }], nota: ""
        });
        cargarOrdenes(true);
      } else {
        showToast("error", "Error: " + data.error);
      }
    } catch (e) {
      showToast("error", "Error de conexión al crear orden");
    } finally {
      setAccionEnProgreso("crear-orden", false);
    }
  };

  // ===== CAMBIAR ESTADO =====
  const cambiarEstado = async (id: string, nuevoEstado: keyof typeof ESTADOS) => {
    setAccionEnProgreso(id + nuevoEstado, true);
    try {
      const res = await fetchConRetry("/api/ordenes-produccion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          estado: nuevoEstado,
          producido_por: nuevoEstado === "entregado" ? "Productor" : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", `Estado actualizado a: ${ESTADOS[nuevoEstado].label}`);
        cargarOrdenes(true);
      } else {
        showToast("error", "Error: " + data.error);
      }
    } catch (e) {
      showToast("error", "Error de conexión");
    } finally {
      setAccionEnProgreso(id + nuevoEstado, false);
    }
  };

  // ===== PAUSAR ORDEN =====
  const abrirModalCierre = (orden: Orden) => {
    setOrdenACerrar(orden);
    setFormCierre({ motivo: "", fecha: new Date().toISOString().slice(0, 16) });
    setShowModalCierre(true);
  };

  const confirmarPausaProduccion = async () => {
    if (!ordenACerrar) return;
    if (!formCierre.motivo.trim()) {
      showToast("warning", "Debes indicar el motivo del cierre");
      return;
    }
    setAccionEnProgreso("pausar-" + ordenACerrar.id, true);
    try {
      const res = await fetchConRetry("/api/ordenes-produccion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ordenACerrar.id,
          estado: "pausada_por_produccion",
          motivo_cierre: formCierre.motivo,
          pausado_por: "Productor",
          fecha_cierre: new Date(formCierre.fecha).toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModalCierre(false);
        showToast("info", `⏸️ Orden #${ordenACerrar.id.slice(0, 6)} pausada. Admin revisará.`);
        setOrdenACerrar(null);
        cargarOrdenes(true);
      } else {
        showToast("error", "Error: " + data.error);
      }
    } catch (e) {
      showToast("error", "Error de conexión");
    } finally {
      setAccionEnProgreso("pausar-" + ordenACerrar.id, false);
    }
  };

  // ===== CIERRE DEFINITIVO (ADMIN) =====
  const solicitarCierreDefinitivo = (orden: Orden) => {
    mostrarConfirmacion(
      "Cerrar Orden Definitivamente",
      `¿Estás seguro de cerrar DEFINITIVAMENTE la orden #${orden.id.slice(0, 6)}?\n\nMotivo: ${orden.motivo_cierre}\n\nEsta acción no se puede deshacer.`,
      () => confirmarCierreDefinitivo(orden),
      "danger"
    );
  };

  const confirmarCierreDefinitivo = async (orden: Orden) => {
    setConfirmModal(prev => ({ ...prev, abierto: false }));
    setAccionEnProgreso("cerrar-" + orden.id, true);
    try {
      const res = await fetchConRetry("/api/ordenes-produccion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orden.id,
          estado: "cerrada",
          cerrado_por: "Admin",
          fecha_cierre: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", `✅ Orden #${orden.id.slice(0, 6)} cerrada definitivamente`);
        cargarOrdenes(true);
      } else {
        showToast("error", "Error: " + data.error);
      }
    } catch (e) {
      showToast("error", "Error de conexión");
    } finally {
      setAccionEnProgreso("cerrar-" + orden.id, false);
    }
  };

  // ===== MODAL DETALLES =====
  const abrirModalDetalles = (orden: Orden) => {
    setOrdenDetalles(orden);
    setShowModalDetalles(true);
  };

  // ===== HELPERS =====
  const getNombreProducto = (orden: Orden): string => {
    if (orden.producto?.nombre) return orden.producto.nombre;
    if (orden.producto_id) {
      const p = productos.find(p => p.id === orden.producto_id);
      if (p) return p.nombre;
    }
    if (orden.productos && orden.productos.length > 0) return orden.productos[0].nombre;
    return "Producto desconocido";
  };

  const ordenesFiltradas = ordenes.filter(o => filtroEstado === "todos" || o.estado === filtroEstado);

  const agregarInsumo = () => setNuevaOrden({ ...nuevaOrden, insumos: [...nuevaOrden.insumos, { insumo_id: "", cantidad: 1 }] });
  const actualizarInsumo = (idx: number, campo: string, valor: any) => {
    const nuevos = [...nuevaOrden.insumos];
    nuevos[idx] = { ...nuevos[idx], [campo]: valor };
    setNuevaOrden({ ...nuevaOrden, insumos: nuevos });
  };
  const eliminarInsumo = (idx: number) => {
    if (nuevaOrden.insumos.length <= 1) return;
    setNuevaOrden({ ...nuevaOrden, insumos: nuevaOrden.insumos.filter((_, i) => i !== idx) });
  };

  // ===== CÁLCULOS JORNADA =====
  useEffect(() => {
    if (tab === "jornada") {
      const ordenesDia = ordenes.filter(o => o.creado_en.startsWith(fechaJornada));
      const producidas = ordenesDia
        .filter(o => ["finalizado", "entregado", "cerrada"].includes(o.estado))
        .reduce((sum, o) => sum + (o.cantidad_producida || 0), 0);
      const pendientes = ordenesDia
        .filter(o => ["pendiente", "en_produccion"].includes(o.estado))
        .reduce((sum, o) => sum + (o.cantidad_producida || 0), 0);
      setResumenJornada({ planificado: producidas + pendientes, vendido: producidas, restante: pendientes });
      setJornada(ordenesDia);
    }
  }, [tab, fechaJornada, ordenes]);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ===== HEADER ORIGINAL (MANTENIDO EXACTAMENTE) ===== */}
      <PageHeader
        negocioSlug={negocioSlug}
        titulo="Producción"
        icono="🏭"
        subtitulo={tab === "ordenes" ? "Gestión de órdenes de producción" : "Resumen de jornada diaria"}
        tenantId={tenantId}
        acciones={
          <>
            <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1">
              <button onClick={() => setTab("ordenes")} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === "ordenes" ? "bg-white shadow-sm text-stone-800" : "text-stone-600"}`}>Órdenes</button>
              {esRestaurante && <button onClick={() => setTab("jornada")} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === "jornada" ? "bg-white shadow-sm text-stone-800" : "text-stone-600"}`}>Jornada</button>}
            </div>
            {tab === "ordenes" && (
              <>
                <div className="flex items-center gap-2">
                  <button onClick={() => setVista("admin")} className={`px-3 py-1 rounded-xl text-sm font-medium ${vista === "admin" ? "bg-emerald-500 text-white" : "bg-stone-200 text-stone-700 hover:bg-stone-300"}`}>Admin</button>
                  <button onClick={() => setVista("productor")} className={`px-3 py-1 rounded-xl text-sm font-medium ${vista === "productor" ? "bg-blue-500 text-white" : "bg-stone-200 text-stone-700 hover:bg-stone-300"}`}>Productor</button>
                </div>
                <button onClick={() => cargarOrdenes()} className="p-2 hover:bg-stone-100 rounded-xl"><RefreshCw className="w-5 h-5 text-stone-700" /></button>
                <button onClick={() => setShowModalOrden(true)} className="bg-emerald-500 text-white px-3 sm:px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"><Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nueva Orden</span></button>
                <div className="relative">
                  <Bell className={`w-6 h-6 ${contadorNuevas > 0 ? "text-red-500" : "text-stone-400"}`} />
                  {contadorNuevas > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">{contadorNuevas}</span>}
                </div>
              </>
            )}
          </>
        }
      />

      {/* ===== SISTEMA DE TOASTS ===== */}
      <div className="fixed top-20 right-4 z-[60] space-y-2 pointer-events-none">
        {toasts.map(toast => {
          const colores = {
            success: "bg-emerald-500 text-white",
            error: "bg-red-500 text-white",
            warning: "bg-amber-500 text-white",
            info: "bg-blue-500 text-white",
          };
          const iconos = {
            success: <Check className="w-5 h-5" />,
            error: <AlertCircle className="w-5 h-5" />,
            warning: <AlertTriangle className="w-5 h-5" />,
            info: <Info className="w-5 h-5" />,
          };
          return (
            <div
              key={toast.id}
              className={`${colores[toast.tipo]} px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 min-w-[280px] max-w-md animate-[slideIn_0.3s_ease-out] pointer-events-auto`}
            >
              {iconos[toast.tipo]}
              <span className="text-sm font-medium flex-1">{toast.mensaje}</span>
            </div>
          );
        })}
      </div>

      {/* ===== MODAL DE CONFIRMACIÓN ===== */}
      {confirmModal.abierto && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4" onClick={() => setConfirmModal(prev => ({ ...prev, abierto: false }))}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className={`p-2 rounded-full ${
                confirmModal.tipo === "danger" ? "bg-red-100" :
                confirmModal.tipo === "warning" ? "bg-amber-100" : "bg-blue-100"
              }`}>
                {confirmModal.tipo === "danger" ? <AlertTriangle className="w-6 h-6 text-red-600" /> :
                 confirmModal.tipo === "warning" ? <AlertTriangle className="w-6 h-6 text-amber-600" /> :
                 <Info className="w-6 h-6 text-blue-600" />}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-stone-800">{confirmModal.titulo}</h3>
                <p className="text-sm text-stone-600 mt-2 whitespace-pre-line">{confirmModal.mensaje}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, abierto: false }))}
                className="flex-1 py-2 border border-stone-300 rounded-xl font-medium hover:bg-stone-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, abierto: false }));
                }}
                className={`flex-1 py-2 rounded-xl font-medium text-white ${
                  confirmModal.tipo === "danger" ? "bg-red-500 hover:bg-red-600" :
                  confirmModal.tipo === "warning" ? "bg-amber-500 hover:bg-amber-600" :
                  "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CONTENIDO PRINCIPAL ===== */}
      <div className="p-4 max-w-7xl mx-auto">
        {tab === "ordenes" && (
          <>
            {/* Filtros */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setFiltroEstado("todos")} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filtroEstado === "todos" ? "bg-stone-800 text-white" : "bg-white border text-stone-700"}`}>
                Todos ({ordenes.length})
              </button>
              {ESTADOS_ORDEN.map(e => {
                const info = ESTADOS[e as keyof typeof ESTADOS];
                const count = ordenes.filter(o => o.estado === e).length;
                return (
                  <button key={e} onClick={() => setFiltroEstado(e)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filtroEstado === e ? `${info.color} border-2 border-current` : "bg-white border text-stone-700"}`}>
                    {info.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Contenido */}
            {loadingOrdenes ? (
              <div className="bg-white rounded-2xl p-12 text-center border">
                <Loader2 className="w-12 h-12 text-stone-400 mx-auto mb-4 animate-spin" />
                <p className="text-stone-600 font-medium">Cargando órdenes...</p>
              </div>
            ) : ordenesFiltradas.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border">
                <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="w-12 h-12 text-stone-400" />
                </div>
                <h3 className="text-lg font-bold text-stone-800 mb-2">Sin órdenes</h3>
                <p className="text-stone-600 mb-4">
                  {filtroEstado === "todos"
                    ? "No hay órdenes de producción registradas"
                    : `No hay órdenes con estado "${ESTADOS[filtroEstado as keyof typeof ESTADOS]?.label}"`}
                </p>
                <button
                  onClick={() => setShowModalOrden(true)}
                  className="inline-flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-600"
                >
                  <Plus className="w-5 h-5" />
                  Crear primera orden
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ordenesFiltradas.map(orden => {
                  const TipoIcon = TIPOS_ORDEN[orden.tipo]?.icon || Package;
                  const EstadoIcon = ESTADOS[orden.estado]?.icon || Clock;
                  const estadoInfo = ESTADOS[orden.estado] || ESTADOS.pendiente;
                  const tipoInfo = TIPOS_ORDEN[orden.tipo] || TIPOS_ORDEN.pedido_pos;
                  const nombreProd = getNombreProducto(orden);

                  return (
                    <div key={orden.id} className={`bg-white rounded-2xl p-4 shadow-sm border hover:shadow-md transition ${orden.estado === "pausada_por_produccion" ? "border-orange-400 border-2" : orden.estado === "cerrada" ? "border-red-300 opacity-75" : "border-stone-200"}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <button onClick={() => abrirModalDetalles(orden)} className="font-bold text-emerald-700 hover:text-emerald-900 hover:underline text-sm">
                            #{orden.id.slice(0, 8)}
                          </button>
                          {orden.pedido_id && <span className="text-xs text-stone-600 ml-2">Ped: {orden.pedido_id.slice(0, 6)}</span>}
                          <div className="text-base font-semibold text-stone-800 mt-1 truncate">{nombreProd}</div>
                          <div className="text-xs text-stone-500">× {orden.cantidad_producida || 1}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${tipoInfo.color}`}>
                          <TipoIcon className="w-3 h-3 inline mr-1" />{tipoInfo.label}
                        </span>
                      </div>

                      {orden.nota && <p className="text-xs text-stone-500 mb-2 truncate">📝 {orden.nota}</p>}

                      {orden.estado === "pausada_por_produccion" && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-2 text-xs">
                          <div className="font-semibold text-orange-800 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Pausada</div>
                          <div className="text-orange-700 mt-1 line-clamp-2">{orden.motivo_cierre}</div>
                          <div className="text-orange-600 mt-1">por {orden.pausado_por} - {new Date(orden.pausado_en || orden.creado_en).toLocaleString()}</div>
                        </div>
                      )}

                      {orden.estado === "cerrada" && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2 text-xs">
                          <div className="font-semibold text-red-800">Cerrada por {orden.cerrado_por}</div>
                          <div className="text-red-600">{new Date(orden.fecha_cierre || orden.actualizado_en).toLocaleString()}</div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-stone-600 mb-3">
                        <span>📅 {new Date(orden.creado_en).toLocaleString()}</span>
                        <span className={`px-2 py-0.5 rounded-full ${estadoInfo.color}`}>
                          <EstadoIcon className="w-3 h-3 inline mr-1" />{estadoInfo.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => abrirModalDetalles(orden)} className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Detalles
                        </button>

                        {vista === "productor" && orden.estado !== "entregado" && orden.estado !== "cerrada" && orden.estado !== "pausada_por_produccion" && (
                          <>
                            {["pendiente","en_produccion","finalizado","entregado"].filter(e => ESTADOS_ORDEN.indexOf(e) > ESTADOS_ORDEN.indexOf(orden.estado)).map(e => {
                              const info = ESTADOS[e as keyof typeof ESTADOS];
                              const enProgreso = accionesEnProgreso.has(orden.id + e);
                              return (
                                <button
                                  key={e}
                                  onClick={() => cambiarEstado(orden.id, e as any)}
                                  disabled={enProgreso}
                                  className={`text-xs px-2 py-1 rounded-full ${info.color} disabled:opacity-50 flex items-center gap-1`}
                                >
                                  {enProgreso && <Loader2 className="w-3 h-3 animate-spin" />}
                                  {info.label}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => abrirModalCierre(orden)}
                              disabled={accionesEnProgreso.has("pausar-" + orden.id)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1 ml-auto disabled:opacity-50"
                            >
                              <XCircle className="w-3 h-3" /> Cerrar
                            </button>
                          </>
                        )}

                        {vista === "admin" && orden.estado === "pausada_por_produccion" && (
                          <button
                            onClick={() => solicitarCierreDefinitivo(orden)}
                            disabled={accionesEnProgreso.has("cerrar-" + orden.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center gap-1 ml-auto font-semibold disabled:opacity-50"
                          >
                            {accionesEnProgreso.has("cerrar-" + orden.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                            Confirmar Cierre
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ===== VISTA JORNADA ===== */}
        {tab === "jornada" && (
          <>
            <div className="bg-white rounded-2xl p-4 mb-4 border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-stone-800">Resumen de Jornada</h3>
                <input
                  type="date"
                  value={fechaJornada}
                  onChange={(e) => setFechaJornada(e.target.value)}
                  className="border rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-xs text-blue-700 font-semibold">Planificado</div>
                  <div className="text-2xl font-bold text-blue-900">{resumenJornada.planificado}</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <div className="text-xs text-emerald-700 font-semibold">Producido</div>
                  <div className="text-2xl font-bold text-emerald-900">{resumenJornada.vendido}</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <div className="text-xs text-amber-700 font-semibold">Pendiente</div>
                  <div className="text-2xl font-bold text-amber-900">{resumenJornada.restante}</div>
                </div>
              </div>
            </div>

            {jornada.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border">
                <Calendar className="w-16 h-16 text-stone-400 mx-auto mb-4" />
                <p className="text-stone-600">No hay producción registrada para esta fecha</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className="text-left p-3 font-semibold">Orden</th>
                      <th className="text-left p-3 font-semibold">Producto</th>
                      <th className="text-center p-3 font-semibold">Cantidad</th>
                      <th className="text-left p-3 font-semibold">Estado</th>
                      <th className="text-left p-3 font-semibold">Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jornada.map(o => {
                      const info = ESTADOS[o.estado as keyof typeof ESTADOS];
                      return (
                        <tr key={o.id} className="border-t border-stone-100">
                          <td className="p-3 font-mono text-xs">#{o.id.slice(0, 8)}</td>
                          <td className="p-3 font-medium">{getNombreProducto(o)}</td>
                          <td className="p-3 text-center">{o.cantidad_producida || 1}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${info.color}`}>
                              {info.label}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-stone-600">
                            {new Date(o.creado_en).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== MODAL NUEVA ORDEN ===== */}
      {showModalOrden && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Nueva Orden de Producción</h3>
            <div className="space-y-3">
              <select value={nuevaOrden.tipo} onChange={(e) => setNuevaOrden({ ...nuevaOrden, tipo: e.target.value as any })} className="w-full border rounded-xl p-2">
                {Object.entries(TIPOS_ORDEN).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select value={nuevaOrden.producto_id} onChange={(e) => setNuevaOrden({ ...nuevaOrden, producto_id: e.target.value })} className="w-full border rounded-xl p-2">
                <option value="">Seleccionar producto</option>
                {productos.filter(p => p.tipo_producto === "producido").map(p => <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock || 0})</option>)}
              </select>
              <input type="number" min="1" value={nuevaOrden.cantidad_producida} onChange={(e) => setNuevaOrden({ ...nuevaOrden, cantidad_producida: parseInt(e.target.value) || 1 })} className="w-full border rounded-xl p-2" />
              <div>
                <label className="block text-sm font-medium mb-1">Insumos</label>
                {nuevaOrden.insumos.map((ins, idx) => {
                  const prodSel = productos.find(p => p.id === ins.insumo_id);
                  const sinStock = prodSel && prodSel.stock !== undefined && prodSel.stock < ins.cantidad;
                  return (
                    <div key={idx} className="flex gap-2 mb-2">
                      <select
                        value={ins.insumo_id}
                        onChange={(e) => actualizarInsumo(idx, "insumo_id", e.target.value)}
                        className={`flex-1 border rounded-xl p-2 text-sm ${sinStock ? "border-red-400 bg-red-50" : ""}`}
                      >
                        <option value="">Insumo</option>
                        {productos.filter(p => p.tipo_producto === "insumo").map(p => (
                          <option key={p.id} value={p.id}>{p.nombre} ({p.stock || 0})</option>
                        ))}
                      </select>
                      <input type="number" min="0.1" step="0.1" value={ins.cantidad} onChange={(e) => actualizarInsumo(idx, "cantidad", parseFloat(e.target.value) || 0)} className="w-20 border rounded-xl p-2" />
                      <button onClick={() => eliminarInsumo(idx)} className="text-red-500 p-2" disabled={nuevaOrden.insumos.length <= 1}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  );
                })}
                {nuevaOrden.insumos.some(ins => {
                  const p = productos.find(pr => pr.id === ins.insumo_id);
                  return p && p.stock !== undefined && p.stock < ins.cantidad;
                }) && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Stock insuficiente en uno o más insumos
                  </div>
                )}
                <button onClick={agregarInsumo} className="text-sm text-emerald-600">+ Agregar insumo</button>
              </div>
              <textarea value={nuevaOrden.nota} onChange={(e) => setNuevaOrden({ ...nuevaOrden, nota: e.target.value })} className="w-full border rounded-xl p-2" placeholder="Nota..." rows={2} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModalOrden(false)} className="flex-1 py-2 border rounded-xl">Cancelar</button>
              <button
                onClick={crearOrden}
                disabled={accionesEnProgreso.has("crear-orden")}
                className="flex-1 py-2 bg-emerald-500 text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {accionesEnProgreso.has("crear-orden") && <Loader2 className="w-4 h-4 animate-spin" />}
                Crear Orden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL CIERRE (PAUSAR) ===== */}
      {showModalCierre && ordenACerrar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg font-bold">Pausar Orden #{ordenACerrar.id.slice(0, 8)}</h3>
            </div>
            <p className="text-sm text-stone-600 mb-4">
              Al pausar, la orden quedará en espera hasta que un administrador revise el motivo y confirme el cierre definitivo.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Fecha y hora del incidente *</label>
                <input type="datetime-local" value={formCierre.fecha} onChange={(e) => setFormCierre({ ...formCierre, fecha: e.target.value })} className="w-full border rounded-xl p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Motivo del cierre *</label>
                <textarea value={formCierre.motivo} onChange={(e) => setFormCierre({ ...formCierre, motivo: e.target.value })} className="w-full border rounded-xl p-2" rows={4} placeholder="Ej: Falta insumo harina de trigo, máquina dañada, cliente canceló..." />
                <p className="text-xs text-stone-500 mt-1">Este mensaje será visible para el administrador.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModalCierre(false); setOrdenACerrar(null); }} className="flex-1 py-2 border rounded-xl">Cancelar</button>
              <button
                onClick={confirmarPausaProduccion}
                disabled={accionesEnProgreso.has("pausar-" + ordenACerrar.id)}
                className="flex-1 py-2 bg-orange-500 text-white rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {accionesEnProgreso.has("pausar-" + ordenACerrar.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Pausar Orden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL DETALLES ===== */}
      {showModalDetalles && ordenDetalles && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto text-stone-900 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-black">Orden #{ordenDetalles.id.slice(0, 8)}</h3>
                <p className="text-sm font-semibold text-stone-900 mt-1">{getNombreProducto(ordenDetalles)} × {ordenDetalles.cantidad_producida || 1}</p>
              </div>
              <button onClick={() => setShowModalDetalles(false)} className="p-2 hover:bg-stone-200 rounded-xl">
                <X className="w-5 h-5 text-black" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-100 border border-stone-300 p-3 rounded-xl">
                  <div className="text-xs font-bold text-stone-900">Estado</div>
                  <div className={`inline-block mt-1 px-2 py-0.5 rounded-full text-sm font-bold ${ESTADOS[ordenDetalles.estado]?.color}`}>
                    {ESTADOS[ordenDetalles.estado]?.label}
                  </div>
                </div>
                <div className="bg-stone-100 border border-stone-300 p-3 rounded-xl">
                  <div className="text-xs font-bold text-stone-900">Tipo</div>
                  <div className="text-sm font-semibold text-black mt-1">{TIPOS_ORDEN[ordenDetalles.tipo]?.label}</div>
                </div>
                <div className="bg-stone-100 border border-stone-300 p-3 rounded-xl">
                  <div className="text-xs font-bold text-stone-900">Creada</div>
                  <div className="text-sm font-semibold text-black mt-1">{new Date(ordenDetalles.creado_en).toLocaleString()}</div>
                </div>
                <div className="bg-stone-100 border border-stone-300 p-3 rounded-xl">
                  <div className="text-xs font-bold text-stone-900">Creada por</div>
                  <div className="text-sm font-semibold text-black mt-1">{ordenDetalles.creado_por}</div>
                </div>
              </div>

              {ordenDetalles.nota && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
                  <div className="text-xs font-bold text-blue-900 mb-1">📝 Nota</div>
                  <div className="text-sm font-medium text-blue-950">{ordenDetalles.nota}</div>
                </div>
              )}

              <div>
                <h4 className="font-bold text-black mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Ingredientes / Insumos
                </h4>
                {ordenDetalles.insumos && ordenDetalles.insumos.length > 0 ? (
                  <div className="bg-white border border-stone-300 rounded-xl overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-stone-200">
                        <tr>
                          <th className="text-left p-2 font-bold text-black">Insumo</th>
                          <th className="text-right p-2 font-bold text-black">Cantidad</th>
                          <th className="text-right p-2 font-bold text-black">P. Unit.</th>
                          <th className="text-right p-2 font-bold text-black">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordenDetalles.insumos.map((ins, i) => (
                          <tr key={i} className="border-t border-stone-300">
                            <td className="p-2 font-semibold text-black">{ins.insumo?.nombre || ins.insumo_id.slice(0, 8)}</td>
                            <td className="p-2 text-right font-semibold text-black">{ins.cantidad}</td>
                            <td className="p-2 text-right font-medium text-stone-800">${(ins.precio_unitario || 0).toLocaleString()}</td>
                            <td className="p-2 text-right font-semibold text-stone-900">${(ins.subtotal || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-stone-400 bg-stone-200">
                          <td colSpan={3} className="p-2 font-bold text-black text-right">TOTAL:</td>
                          <td className="p-2 text-right font-bold text-emerald-700">
                            ${ordenDetalles.insumos.reduce((s, i) => s + (i.subtotal || 0), 0).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-stone-800 italic">Sin insumos registrados.</p>
                )}
              </div>

              {(ordenDetalles.estado === "pausada_por_produccion" || ordenDetalles.estado === "cerrada") && (
                <div className="bg-orange-50 border border-orange-300 p-3 rounded-xl">
                  <div className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Información de Cierre
                  </div>
                  <div className="text-sm font-medium text-stone-900 space-y-1">
                    <div><strong className="text-black">Motivo:</strong> {ordenDetalles.motivo_cierre}</div>
                    <div><strong className="text-black">Pausada por:</strong> {ordenDetalles.pausado_por}</div>
                    <div><strong className="text-black">Fecha de pausa:</strong> {new Date(ordenDetalles.pausado_en || ordenDetalles.creado_en).toLocaleString()}</div>
                    {ordenDetalles.cerrado_por && <div><strong className="text-black">Cerrada por:</strong> {ordenDetalles.cerrado_por}</div>}
                    {ordenDetalles.fecha_cierre && <div><strong className="text-black">Fecha de cierre:</strong> {new Date(ordenDetalles.fecha_cierre).toLocaleString()}</div>}
                  </div>
                </div>
              )}

              <details className="text-xs font-medium text-stone-800">
                <summary className="cursor-pointer font-bold text-stone-900">Ver IDs técnicos</summary>
                <div className="mt-2 p-2 bg-stone-100 border border-stone-300 rounded font-mono break-all text-stone-900">
                  <div>Orden: {ordenDetalles.id}</div>
                  <div>Producto: {ordenDetalles.producto_id || "N/A"}</div>
                  <div>Pedido: {ordenDetalles.pedido_id || "N/A"}</div>
                </div>
              </details>
            </div>

            <button onClick={() => setShowModalDetalles(false)} className="w-full mt-6 py-2 bg-stone-900 text-white rounded-xl font-semibold">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProduccionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50 flex items-center justify-center">Cargando...</div>}>
      <ProduccionContent />
    </Suspense>
  );
}
