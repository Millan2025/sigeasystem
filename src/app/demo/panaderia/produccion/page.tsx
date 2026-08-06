"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation"
import Link from "next/link";
import {
  ArrowLeft, ShoppingCart, Package, Calendar, Clock, CheckCircle, Truck, Bell,
  RefreshCw, Plus, Store, ClipboardList, X, Trash2, Info, XCircle, AlertTriangle, Eye
} from "lucide-react";
import { NEGOCIOS } from "@/config/negocios";

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
  const [notificacion, setNotificacion] = useState<string | null>(null);
  const [contadorNuevas, setContadorNuevas] = useState(0);
  const [productos, setProductos] = useState<any[]>([]);
  const [jornada, setJornada] = useState<any[]>([]);
  const [fechaJornada, setFechaJornada] = useState(new Date().toISOString().split("T")[0]);
  const [showModalJornada, setShowModalJornada] = useState(false);
  const [formJornada, setFormJornada] = useState<{ producto_id: string; cantidad: number }[]>([]);
  const [resumenJornada, setResumenJornada] = useState({ planificado: 0, vendido: 0, restante: 0 });
  const [tab, setTab] = useState<"ordenes" | "jornada">("ordenes");

  // ===== NUEVOS ESTADOS PARA LAS 3 MEJORAS =====
  const [showModalCierre, setShowModalCierre] = useState(false);
  const [ordenACerrar, setOrdenACerrar] = useState<Orden | null>(null);
  const [formCierre, setFormCierre] = useState({ motivo: "", fecha: new Date().toISOString().slice(0, 16) });

  const [showModalDetalles, setShowModalDetalles] = useState(false);
  const [ordenDetalles, setOrdenDetalles] = useState<Orden | null>(null);

  const cargarProductos = async () => {
    try {
      const res = await fetch(`/api/products?tenant=${tenantId}`);
      const data = await res.json();
      if (data.success) setProductos(data.data || []);
    } catch (e) { console.error("Error cargando productos:", e); }
  };

  const cargarOrdenes = async () => {
    setLoadingOrdenes(true);
    try {
      const res = await fetch(`/api/ordenes-produccion?tenant=${tenantId}`);
      const data = await res.json();
      if (data.success) {
        setOrdenes(data.data || []);
        const nuevas = data.data.filter(
          (o: Orden) => o.estado === "pendiente" && new Date(o.creado_en) > new Date(Date.now() - 60000)
        ).length;
        setContadorNuevas(nuevas);
      }
    } catch (e) { setOrdenes([]); }
    setLoadingOrdenes(false);
  };

  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
    cargarProductos();
    cargarOrdenes();
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };
  }, [tenantId]);

  const crearOrden = async () => {
    if (!nuevaOrden.producto_id) { alert("Selecciona un producto."); return; }
    if (nuevaOrden.insumos.some(i => !i.insumo_id)) { alert("Completa todos los insumos."); return; }
    const body = {
      tenant_id: tenantId, tipo: nuevaOrden.tipo, producto_id: nuevaOrden.producto_id,
      cantidad_producida: nuevaOrden.cantidad_producida, insumos: nuevaOrden.insumos,
      nota: nuevaOrden.nota || "", creado_por: "Admin",
    };
    try {
      const res = await fetch("/api/ordenes-produccion", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        if (audioRef.current) audioRef.current.play().catch(() => {});
        setContadorNuevas(prev => prev + 1);
        setNotificacion(`📢 Nueva orden #${data.data.id.slice(0, 6)}`);
        setTimeout(() => setNotificacion(null), 5000);
        setShowModalOrden(false);
        setNuevaOrden({ tipo: "pedido_pos", producto_id: "", cantidad_producida: 1, insumos: [{ insumo_id: "", cantidad: 1 }], nota: "" });
        cargarOrdenes();
      } else { alert("Error: " + data.error); }
    } catch (e) { alert("Error de conexión"); }
  };

  const cambiarEstado = async (id: string, nuevoEstado: keyof typeof ESTADOS) => {
    try {
      const res = await fetch("/api/ordenes-produccion", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id, estado: nuevoEstado,
          producido_por: nuevoEstado === "entregado" ? "Productor" : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) cargarOrdenes();
      else alert("Error: " + data.error);
    } catch (e) { alert("Error de conexión"); }
  };

  // ===== NUEVA FUNCIÓN: Pausar orden (productor) =====
  const abrirModalCierre = (orden: Orden) => {
    setOrdenACerrar(orden);
    setFormCierre({ motivo: "", fecha: new Date().toISOString().slice(0, 16) });
    setShowModalCierre(true);
  };

  const confirmarPausaProduccion = async () => {
    if (!ordenACerrar) return;
    if (!formCierre.motivo.trim()) { alert("Debes indicar el motivo del cierre"); return; }
    try {
      const res = await fetch("/api/ordenes-produccion", {
        method: "PUT", headers: { "Content-Type": "application/json" },
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
        setOrdenACerrar(null);
        setNotificacion(`⏸️ Orden #${ordenACerrar.id.slice(0, 6)} pausada. Admin revisará.`);
        setTimeout(() => setNotificacion(null), 5000);
        cargarOrdenes();
      } else { alert("Error: " + data.error); }
    } catch (e) { alert("Error de conexión"); }
  };

  // ===== NUEVA FUNCIÓN: Confirmar cierre definitivo (admin) =====
  const confirmarCierreDefinitivo = async (orden: Orden) => {
    if (!confirm(`¿Cerrar DEFINITIVAMENTE la orden #${orden.id.slice(0, 6)}?\n\nMotivo: ${orden.motivo_cierre}`)) return;
    try {
      const res = await fetch("/api/ordenes-produccion", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orden.id,
          estado: "cerrada",
          cerrado_por: "Admin",
          fecha_cierre: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotificacion(`✅ Orden #${orden.id.slice(0, 6)} cerrada definitivamente`);
        setTimeout(() => setNotificacion(null), 5000);
        cargarOrdenes();
      } else { alert("Error: " + data.error); }
    } catch (e) { alert("Error de conexión"); }
  };

  // ===== NUEVA FUNCIÓN: Abrir modal de detalles =====
  const abrirModalDetalles = (orden: Orden) => {
    setOrdenDetalles(orden);
    setShowModalDetalles(true);
  };

  // ===== Helpers =====
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
    const nuevos = [...nuevaOrden.insumos]; nuevos[idx] = { ...nuevos[idx], [campo]: valor };
    setNuevaOrden({ ...nuevaOrden, insumos: nuevos });
  };
  const eliminarInsumo = (idx: number) => {
    if (nuevaOrden.insumos.length <= 1) return;
    setNuevaOrden({ ...nuevaOrden, insumos: nuevaOrden.insumos.filter((_, i) => i !== idx) });
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-20 flex-wrap">
        <Link href={`/demo/${negocioSlug}`} className="p-2 hover:bg-stone-100 rounded-xl">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </Link>
        <h1 className="text-xl font-bold text-stone-800 flex-1">Producción - {negocio?.titulo}</h1>

        <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1">
          <button onClick={() => setTab("ordenes")} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === "ordenes" ? "bg-white shadow-sm text-stone-800" : "text-stone-600"}`}>Órdenes</button>
          {esRestaurante && <button onClick={() => setTab("jornada")} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === "jornada" ? "bg-white shadow-sm text-stone-800" : "text-stone-600"}`}>Jornada</button>}
        </div>

        {tab === "ordenes" && (
          <>
            <div className="flex items-center gap-2">
              <button onClick={() => setVista("admin")} className={`px-3 py-1 rounded-xl text-sm font-medium ${vista === "admin" ? "bg-emerald-500 text-white" : "bg-stone-200"}`}>Admin</button>
              <button onClick={() => setVista("productor")} className={`px-3 py-1 rounded-xl text-sm font-medium ${vista === "productor" ? "bg-blue-500 text-white" : "bg-stone-200"}`}>Productor</button>
            </div>
            <button onClick={cargarOrdenes} className="p-2 hover:bg-stone-100 rounded-xl"><RefreshCw className="w-5 h-5" /></button>
            <button onClick={() => setShowModalOrden(true)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"><Plus className="w-4 h-4" /> Nueva Orden</button>
            <div className="relative">
              <Bell className={`w-6 h-6 ${contadorNuevas > 0 ? "text-red-500" : "text-stone-400"}`} />
              {contadorNuevas > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">{contadorNuevas}</span>}
            </div>
          </>
        )}
      </header>

      {notificacion && <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 text-emerald-700 font-medium">{notificacion}</div>}

      <div className="p-4 max-w-7xl mx-auto">
        {tab === "ordenes" && (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setFiltroEstado("todos")} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filtroEstado === "todos" ? "bg-stone-800 text-white" : "bg-white border"}`}>Todos</button>
              {ESTADOS_ORDEN.map(e => {
                const info = ESTADOS[e as keyof typeof ESTADOS];
                return <button key={e} onClick={() => setFiltroEstado(e)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filtroEstado === e ? `${info.color} border-2 border-current` : "bg-white border"}`}>{info.label}</button>;
              })}
            </div>

            {loadingOrdenes ? (
              <div className="text-center py-12">Cargando...</div>
            ) : ordenesFiltradas.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border"><ClipboardList className="w-16 h-16 text-stone-300 mx-auto mb-4" /><p>Sin órdenes.</p></div>
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
                      {/* ===== MEJORA 2: ID + Nombre del producto ===== */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <button onClick={() => abrirModalDetalles(orden)} className="font-bold text-emerald-700 hover:text-emerald-900 hover:underline text-sm">
                            #{orden.id.slice(0, 8)}
                          </button>
                          {orden.pedido_id && <span className="text-xs text-stone-400 ml-2">Ped: {orden.pedido_id.slice(0, 6)}</span>}
                          <div className="text-base font-semibold text-stone-800 mt-1 truncate">{nombreProd}</div>
                          <div className="text-xs text-stone-500">× {orden.cantidad_producida || 1}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${tipoInfo.color}`}>
                          <TipoIcon className="w-3 h-3 inline mr-1" />{tipoInfo.label}
                        </span>
                      </div>

                      {orden.nota && <p className="text-xs text-stone-500 mb-2 truncate">📝 {orden.nota}</p>}

                      {/* Aviso si está pausada */}
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

                      <div className="flex items-center justify-between text-xs text-stone-400 mb-3">
                        <span>📅 {new Date(orden.creado_en).toLocaleString()}</span>
                        <span className={`px-2 py-0.5 rounded-full ${estadoInfo.color}`}>
                          <EstadoIcon className="w-3 h-3 inline mr-1" />{estadoInfo.label}
                        </span>
                      </div>

                      {/* ===== ACCIONES ===== */}
                      <div className="flex flex-wrap gap-2">
                        {/* Botón ver detalles */}
                        <button onClick={() => abrirModalDetalles(orden)} className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Detalles
                        </button>

                        {/* Productor: botones de transición + Cerrar */}
                        {vista === "productor" && orden.estado !== "entregado" && orden.estado !== "cerrada" && orden.estado !== "pausada_por_produccion" && (
                          <>
                            {["pendiente","en_produccion","finalizado","entregado"].filter(e => ESTADOS_ORDEN.indexOf(e) > ESTADOS_ORDEN.indexOf(orden.estado)).map(e => {
                              const info = ESTADOS[e as keyof typeof ESTADOS];
                              return <button key={e} onClick={() => cambiarEstado(orden.id, e as any)} className={`text-xs px-2 py-1 rounded-full ${info.color}`}>{info.label}</button>;
                            })}
                            <button onClick={() => abrirModalCierre(orden)} className="text-xs px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1 ml-auto">
                              <XCircle className="w-3 h-3" /> Cerrar
                            </button>
                          </>
                        )}

                        {/* Admin: Confirmar cierre cuando está pausada */}
                        {vista === "admin" && orden.estado === "pausada_por_produccion" && (
                          <button onClick={() => confirmarCierreDefinitivo(orden)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center gap-1 ml-auto font-semibold">
                            <CheckCircle className="w-3 h-3" /> Confirmar Cierre
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
                {nuevaOrden.insumos.map((ins, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <select value={ins.insumo_id} onChange={(e) => actualizarInsumo(idx, "insumo_id", e.target.value)} className="flex-1 border rounded-xl p-2 text-sm">
                      <option value="">Insumo</option>
                      {productos.filter(p => p.tipo_producto === "insumo").map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                    <input type="number" min="0.1" step="0.1" value={ins.cantidad} onChange={(e) => actualizarInsumo(idx, "cantidad", parseFloat(e.target.value) || 0)} className="w-20 border rounded-xl p-2" />
                    <button onClick={() => eliminarInsumo(idx)} className="text-red-500 p-2" disabled={nuevaOrden.insumos.length <= 1}><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={agregarInsumo} className="text-sm text-emerald-600">+ Agregar insumo</button>
              </div>
              <textarea value={nuevaOrden.nota} onChange={(e) => setNuevaOrden({ ...nuevaOrden, nota: e.target.value })} className="w-full border rounded-xl p-2" placeholder="Nota..." rows={2} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModalOrden(false)} className="flex-1 py-2 border rounded-xl">Cancelar</button>
              <button onClick={crearOrden} className="flex-1 py-2 bg-emerald-500 text-white rounded-xl">Crear Orden</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MEJORA 1: MODAL DE CIERRE ===== */}
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
              <button onClick={confirmarPausaProduccion} className="flex-1 py-2 bg-orange-500 text-white rounded-xl flex items-center justify-center gap-2">
                <XCircle className="w-4 h-4" /> Pausar Orden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MEJORA 3: MODAL DE DETALLES ===== */}
      {showModalDetalles && ordenDetalles && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">Orden #{ordenDetalles.id.slice(0, 8)}</h3>
                <p className="text-sm text-stone-500">{getNombreProducto(ordenDetalles)} × {ordenDetalles.cantidad_producida || 1}</p>
              </div>
              <button onClick={() => setShowModalDetalles(false)} className="p-2 hover:bg-stone-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-50 p-3 rounded-xl">
                  <div className="text-xs text-stone-500">Estado</div>
                  <div className={`inline-block mt-1 px-2 py-0.5 rounded-full text-sm font-medium ${ESTADOS[ordenDetalles.estado]?.color}`}>{ESTADOS[ordenDetalles.estado]?.label}</div>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl">
                  <div className="text-xs text-stone-500">Tipo</div>
                  <div className="text-sm font-medium mt-1">{TIPOS_ORDEN[ordenDetalles.tipo]?.label}</div>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl">
                  <div className="text-xs text-stone-500">Creada</div>
                  <div className="text-sm mt-1">{new Date(ordenDetalles.creado_en).toLocaleString()}</div>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl">
                  <div className="text-xs text-stone-500">Creada por</div>
                  <div className="text-sm mt-1">{ordenDetalles.creado_por}</div>
                </div>
              </div>

              {ordenDetalles.nota && (
                <div className="bg-blue-50 p-3 rounded-xl">
                  <div className="text-xs text-blue-700 font-semibold mb-1">📝 Nota</div>
                  <div className="text-sm text-blue-900">{ordenDetalles.nota}</div>
                </div>
              )}

              {/* Insumos (ingredientes) */}
              <div>
                <h4 className="font-semibold text-stone-800 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Ingredientes / Insumos
                </h4>
                {ordenDetalles.insumos && ordenDetalles.insumos.length > 0 ? (
                  <div className="bg-stone-50 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-stone-100">
                        <tr>
                          <th className="text-left p-2 font-medium">Insumo</th>
                          <th className="text-right p-2 font-medium">Cantidad</th>
                          <th className="text-right p-2 font-medium">P. Unit.</th>
                          <th className="text-right p-2 font-medium">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordenDetalles.insumos.map((ins, i) => (
                          <tr key={i} className="border-t border-stone-200">
                            <td className="p-2">{ins.insumo?.nombre || ins.insumo_id.slice(0, 8)}</td>
                            <td className="p-2 text-right font-medium">{ins.cantidad}</td>
                            <td className="p-2 text-right text-stone-600">${(ins.precio_unitario || 0).toLocaleString()}</td>
                            <td className="p-2 text-right font-semibold">${(ins.subtotal || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-stone-300 bg-stone-100">
                          <td colSpan={3} className="p-2 font-semibold text-right">TOTAL:</td>
                          <td className="p-2 text-right font-bold text-emerald-700">
                            ${ordenDetalles.insumos.reduce((s, i) => s + (i.subtotal || 0), 0).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-stone-500 italic">Sin insumos registrados.</p>
                )}
              </div>

              {/* Info de pausa si aplica */}
              {(ordenDetalles.estado === "pausada_por_produccion" || ordenDetalles.estado === "cerrada") && (
                <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl">
                  <div className="font-semibold text-orange-800 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Información de Cierre</div>
                  <div className="text-sm space-y-1">
                    <div><strong>Motivo:</strong> {ordenDetalles.motivo_cierre}</div>
                    <div><strong>Pausada por:</strong> {ordenDetalles.pausado_por}</div>
                    <div><strong>Fecha de pausa:</strong> {new Date(ordenDetalles.pausado_en || ordenDetalles.creado_en).toLocaleString()}</div>
                    {ordenDetalles.cerrado_por && <div><strong>Cerrada definitivamente por:</strong> {ordenDetalles.cerrado_por}</div>}
                    {ordenDetalles.fecha_cierre && <div><strong>Fecha de cierre:</strong> {new Date(ordenDetalles.fecha_cierre).toLocaleString()}</div>}
                  </div>
                </div>
              )}

              {/* IDs completos (debug) */}
              <details className="text-xs text-stone-500">
                <summary className="cursor-pointer">Ver IDs técnicos</summary>
                <div className="mt-2 p-2 bg-stone-50 rounded font-mono break-all">
                  <div>Orden: {ordenDetalles.id}</div>
                  <div>Producto: {ordenDetalles.producto_id || "N/A"}</div>
                  <div>Pedido: {ordenDetalles.pedido_id || "N/A"}</div>
                </div>
              </details>
            </div>

            <button onClick={() => setShowModalDetalles(false)} className="w-full mt-6 py-2 bg-stone-800 text-white rounded-xl">Cerrar</button>
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
