"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation"
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  Calendar,
  Clock,
  CheckCircle,
  Truck,
  Bell,
  RefreshCw,
  Plus,
  Store,
  ClipboardList,
  TrendingUp,
  X,
  Trash2,
} from "lucide-react";
import { NEGOCIOS } from "@/config/negocios";

// ============================================
// TIPOS Y ESTADOS
// ============================================
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
};

const ESTADOS_ORDEN = ["pendiente", "en_produccion", "finalizado", "entregado"];

interface Orden {
  id: string;
  pedido_id?: string;
  producto_id?: string;
  cantidad_producida?: number;
  tipo: keyof typeof TIPOS_ORDEN;
  estado: keyof typeof ESTADOS;
  productos: { nombre: string; cantidad: number; unidad: string }[];
  insumos?: { insumo_id: string; cantidad: number }[];
  nota: string;
  creado_por: string;
  creado_en: string;
  actualizado_en: string;
  producido_por?: string;
}

export default function ProduccionPage() {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const pathParts = pathname?.split("/") || [];
  const negocioSlug = pathParts[1] || "restaurante";
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const searchParams = useSearchParams();
  const tenantFromUrl = searchParams.get("tenant");
  const tenantId = tenantFromUrl || negocio?.tenantId || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";

  const esRestaurante = negocioSlug === "restaurante";

  // ========== ESTADO DE ÓRDENES ==========
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loadingOrdenes, setLoadingOrdenes] = useState(true);
  const [showModalOrden, setShowImportModalOrden] = useState(false);
  const [nuevaOrden, setNuevaOrden] = useState<{
    tipo: keyof typeof TIPOS_ORDEN;
    producto_id: string;
    cantidad_producida: number;
    insumos: { insumo_id: string; cantidad: number }[];
    nota: string;
  }>({
    tipo: "pedido_pos",
    producto_id: "",
    cantidad_producida: 1,
    insumos: [{ insumo_id: "", cantidad: 1 }],
    nota: "",
  });
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [vista, setVista] = useState<"admin" | "productor">("admin");
  const [notificacion, setNotificacion] = useState<string | null>(null);
  const [contadorNuevas, setContadorNuevas] = useState(0);

  // ========== PRODUCTOS (para selectores) ==========
  const [productos, setProductos] = useState<any[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);

  // ========== JORNADA (localStorage) ==========
  const [jornada, setJornada] = useState<any[]>([]);
  const [loadingJornada, setLoadingJornada] = useState(true);
  const [fechaJornada, setFechaJornada] = useState(new Date().toISOString().split("T")[0]);
  const [showModalJornada, setShowImportModalJornada] = useState(false);
  const [formJornada, setFormJornada] = useState<{ producto_id: string; cantidad: number }[]>([]);
  const [resumenJornada, setResumenJornada] = useState({ planificado: 0, vendido: 0, restante: 0 });

  const [tab, setTab] = useState<"ordenes" | "jornada">("ordenes");

  // ============================================
  // CARGA DE PRODUCTOS
  // ============================================
  const cargarProductos = async () => {
    setLoadingProductos(true);
    try {
      const res = await fetch(`/api/products?tenant=${tenantId}`);
      const data = await res.json();
      if (data.success) setProductos(data.data || []);
    } catch (e) {
      console.error("Error cargando productos:", e);
    }
    setLoadingProductos(false);
  };

  // ============================================
  // CARGA DE ÓRDENES (desde Supabase)
  // ============================================
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
    } catch (e) {
      setOrdenes([]);
    }
    setLoadingOrdenes(false);
  };

  // ============================================
  // CARGA DE JORNADA (localStorage)
  // ============================================
  const cargarJornada = () => {
    if (!esRestaurante) return;
    setLoadingJornada(true);
    try {
      const key = `jornada_${tenantId}_${fechaJornada}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        setJornada(parsed);
        const planificado = parsed.reduce((s: number, j: any) => s + j.cantidad_planificada, 0);
        const vendido = parsed.reduce((s: number, j: any) => s + j.cantidad_vendida, 0);
        setResumenJornada({ planificado, vendido, restante: planificado - vendido });
      } else {
        setJornada([]);
        setResumenJornada({ planificado: 0, vendido: 0, restante: 0 });
      }
    } catch (e) {
      setJornada([]);
    }
    setLoadingJornada(false);
  };

  // ============================================
  // EFECTOS
  // ============================================
  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
    cargarProductos();
    cargarOrdenes();
    if (esRestaurante) cargarJornada();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [tenantId]);

  useEffect(() => {
    if (esRestaurante) cargarJornada();
  }, [fechaJornada]);

  // ============================================
  // CREAR ORDEN (POST a Supabase)
  // ============================================
  const crearOrden = async () => {
    if (!nuevaOrden.producto_id) {
      alert("Selecciona un producto a producir.");
      return;
    }
    if (nuevaOrden.insumos.some(i => !i.insumo_id)) {
      alert("Completa todos los insumos.");
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

    try {
      const res = await fetch("/api/ordenes-produccion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
        setContadorNuevas((prev) => prev + 1);
        setNotificacion(`📢 Nueva orden #${data.data.id.slice(0, 6)}`);
        setTimeout(() => setNotificacion(null), 5000);
        setShowImportModalOrden(false);
        setNuevaOrden({
          tipo: "pedido_pos",
          producto_id: "",
          cantidad_producida: 1,
          insumos: [{ insumo_id: "", cantidad: 1 }],
          nota: "",
        });
        cargarOrdenes();
      } else {
        alert("Error al crear orden: " + data.error);
      }
    } catch (e) {
      alert("Error de conexión");
    }
  };

  // ============================================
  // CAMBIAR ESTADO (PUT a Supabase)
  // ============================================
  const cambiarEstado = async (id: string, nuevoEstado: keyof typeof ESTADOS) => {
    const orden = ordenes.find((o) => o.id === id);
    if (!orden) return;

    const idxActual = ESTADOS_ORDEN.indexOf(orden.estado);
    const idxNuevo = ESTADOS_ORDEN.indexOf(nuevoEstado);
    if (idxNuevo <= idxActual) return;

    try {
      const res = await fetch("/api/ordenes-produccion", {
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
        cargarOrdenes();
      } else {
        alert("Error al actualizar estado: " + data.error);
      }
    } catch (e) {
      alert("Error de conexión");
    }
  };

  // ============================================
  // JORNADA
  // ============================================
  const guardarJornada = (nuevaJornada: any[]) => {
    const key = `jornada_${tenantId}_${fechaJornada}`;
    localStorage.setItem(key, JSON.stringify(nuevaJornada));
    setJornada(nuevaJornada);
    const planificado = nuevaJornada.reduce((s: number, j: any) => s + j.cantidad_planificada, 0);
    const vendido = nuevaJornada.reduce((s: number, j: any) => s + j.cantidad_vendida, 0);
    setResumenJornada({ planificado, vendido, restante: planificado - vendido });
  };

  const agregarProductoJornada = () => {
    setFormJornada([...formJornada, { producto_id: "", cantidad: 1 }]);
  };

  const actualizarJornada = (idx: number, campo: string, valor: any) => {
    const nuevo = [...formJornada];
    nuevo[idx] = { ...nuevo[idx], [campo]: valor };
    setFormJornada(nuevo);
  };

  const eliminarJornada = (idx: number) => {
    setFormJornada(formJornada.filter((_, i) => i !== idx));
  };

  const guardarPlanificacion = () => {
    if (formJornada.length === 0) return;
    const nuevaJornada = formJornada.map((f) => ({
      producto_id: f.producto_id,
      cantidad_planificada: f.cantidad,
      cantidad_vendida: 0,
    }));
    guardarJornada(nuevaJornada);
    setShowImportModalJornada(false);
    setFormJornada([]);
  };

  // ============================================
  // FILTROS
  // ============================================
  const ordenesFiltradas = ordenes.filter((o) => {
    if (filtroEstado === "todos") return true;
    return o.estado === filtroEstado;
  });

  // ============================================
  // MANEJO DE INSUMOS EN MODAL
  // ============================================
  const agregarInsumo = () => {
    setNuevaOrden({
      ...nuevaOrden,
      insumos: [...nuevaOrden.insumos, { insumo_id: "", cantidad: 1 }],
    });
  };

  const actualizarInsumo = (idx: number, campo: string, valor: any) => {
    const nuevos = [...nuevaOrden.insumos];
    nuevos[idx] = { ...nuevos[idx], [campo]: valor };
    setNuevaOrden({ ...nuevaOrden, insumos: nuevos });
  };

  const eliminarInsumo = (idx: number) => {
    if (nuevaOrden.insumos.length <= 1) return;
    setNuevaOrden({
      ...nuevaOrden,
      insumos: nuevaOrden.insumos.filter((_, i) => i !== idx),
    });
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Cabecera */}
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-20">
        <Link href={`/demo/${negocioSlug}`} className="p-2 hover:bg-stone-100 rounded-xl">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </Link>
        <h1 className="text-xl font-bold text-stone-800 flex-1">
          Producción - {negocio?.titulo}
        </h1>

        <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1">
          <button
            onClick={() => setTab("ordenes")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              tab === "ordenes" ? "bg-white shadow-sm text-stone-800" : "text-stone-600 hover:bg-stone-200"
            }`}
          >
            Órdenes
          </button>
          {esRestaurante && (
            <button
              onClick={() => setTab("jornada")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                tab === "jornada" ? "bg-white shadow-sm text-stone-800" : "text-stone-600 hover:bg-stone-200"
              }`}
            >
              Jornada
            </button>
          )}
        </div>

        {tab === "ordenes" && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm text-stone-500">Vista:</span>
              <button
                onClick={() => setVista("admin")}
                className={`px-3 py-1 rounded-xl text-sm font-medium ${
                  vista === "admin" ? "bg-emerald-500 text-white" : "bg-stone-200 text-stone-700"
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setVista("productor")}
                className={`px-3 py-1 rounded-xl text-sm font-medium ${
                  vista === "productor" ? "bg-blue-500 text-white" : "bg-stone-200 text-stone-700"
                }`}
              >
                Productor
              </button>
            </div>
            <button onClick={cargarOrdenes} className="p-2 hover:bg-stone-100 rounded-xl">
              <RefreshCw className="w-5 h-5 text-stone-700" />
            </button>
            <button
              onClick={() => setShowImportModalOrden(true)}
              className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Nueva Orden
            </button>
            <div className="relative">
              <Bell className={`w-6 h-6 ${contadorNuevas > 0 ? "text-red-500" : "text-stone-400"}`} />
              {contadorNuevas > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-pulse">
                  {contadorNuevas}
                </span>
              )}
            </div>
          </>
        )}

        {tab === "jornada" && (
          <>
            <input
              type="date"
              value={fechaJornada}
              onChange={(e) => setFechaJornada(e.target.value)}
              className="border border-stone-300 rounded-xl px-3 py-1 text-sm"
            />
            <button
              onClick={() => {
                setFormJornada([]);
                setShowImportModalJornada(true);
              }}
              className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Planificar
            </button>
          </>
        )}
      </header>

      {notificacion && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 text-emerald-700 font-medium animate-pulse">
          {notificacion}
        </div>
      )}

      <div className="p-4 max-w-7xl mx-auto">
        {tab === "ordenes" && (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setFiltroEstado("todos")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  filtroEstado === "todos" ? "bg-stone-800 text-white" : "bg-white text-stone-700 border border-stone-300"
                }`}
              >
                Todos
              </button>
              {ESTADOS_ORDEN.map((estado) => {
                const info = ESTADOS[estado as keyof typeof ESTADOS];
                return (
                  <button
                    key={estado}
                    onClick={() => setFiltroEstado(estado)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      filtroEstado === estado
                        ? `${info.color} border-2 border-current`
                        : "bg-white text-stone-700 border border-stone-300"
                    }`}
                  >
                    {info.label}
                  </button>
                );
              })}
            </div>

            {loadingOrdenes ? (
              <div className="text-center py-12 text-stone-500">Cargando órdenes...</div>
            ) : ordenesFiltradas.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
                <ClipboardList className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500">No hay órdenes en este estado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ordenesFiltradas.map((orden) => {
                  const TipoIcon = TIPOS_ORDEN[orden.tipo].icon;
                  const EstadoIcon = ESTADOS[orden.estado].icon;
                  const estadoInfo = ESTADOS[orden.estado];
                  const tipoInfo = TIPOS_ORDEN[orden.tipo];

                  return (
                    <div
                      key={orden.id}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-bold text-stone-800">#{orden.id.slice(0, 6)}</span>
                          {orden.pedido_id && (
                            <span className="text-xs text-stone-400 ml-2">Pedido: {orden.pedido_id.slice(0, 6)}</span>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipoInfo.color}`}>
                          <TipoIcon className="w-3 h-3 inline mr-1" />
                          {tipoInfo.label}
                        </span>
                      </div>

                      <div className="space-y-1 mb-2">
                        {orden.productos?.map((p, i) => (
                          <div key={i} className="text-sm text-stone-700">
                            {p.cantidad} × {p.nombre} {p.unidad !== "unidad" ? `(${p.unidad})` : ""}
                          </div>
                        ))}
                        {!orden.productos && orden.producto_id && (
                          <div className="text-sm text-stone-700">
                            Producto: {productos.find(p => p.id === orden.producto_id)?.nombre || "Desconocido"} × {orden.cantidad_producida || 1}
                          </div>
                        )}
                      </div>

                      {orden.nota && (
                        <p className="text-xs text-stone-500 mb-2">📝 {orden.nota}</p>
                      )}

                      <div className="flex items-center justify-between text-xs text-stone-400">
                        <span>📅 {new Date(orden.creado_en).toLocaleString()}</span>
                        <span className={`px-2 py-0.5 rounded-full ${estadoInfo.color}`}>
                          <EstadoIcon className="w-3 h-3 inline mr-1" />
                          {estadoInfo.label}
                        </span>
                      </div>

                      {vista === "productor" && orden.estado !== "entregado" && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {ESTADOS_ORDEN.map((estado) => {
                            const idxActual = ESTADOS_ORDEN.indexOf(orden.estado);
                            const idxNuevo = ESTADOS_ORDEN.indexOf(estado);
                            if (idxNuevo <= idxActual) return null;
                            const info = ESTADOS[estado as keyof typeof ESTADOS];
                            return (
                              <button
                                key={estado}
                                onClick={() => cambiarEstado(orden.id, estado as keyof typeof ESTADOS)}
                                className={`text-xs px-2 py-1 rounded-full ${info.color} hover:opacity-80 transition`}
                              >
                                {info.label}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {vista === "admin" && (
                        <div className="mt-3 text-xs text-stone-400">
                          {orden.producido_por && <span>👤 {orden.producido_por}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "jornada" && esRestaurante && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
                <p className="text-sm text-stone-500">Planificado</p>
                <p className="text-2xl font-bold text-blue-600">{resumenJornada.planificado}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
                <p className="text-sm text-stone-500">Vendido</p>
                <p className="text-2xl font-bold text-emerald-600">{resumenJornada.vendido}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
                <p className="text-sm text-stone-500">Restante</p>
                <p className={`text-2xl font-bold ${resumenJornada.restante > 0 ? "text-amber-600" : "text-stone-400"}`}>
                  {resumenJornada.restante}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
              <h3 className="font-semibold text-stone-800 mb-3">Detalle de Jornada</h3>
              {loadingJornada ? (
                <div className="text-center py-8 text-stone-500">Cargando...</div>
              ) : jornada.length === 0 ? (
                <div className="text-center py-8 text-stone-500">No hay producción planificada para esta fecha</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50">
                      <tr>
                        <th className="text-left p-2 text-stone-700">Producto</th>
                        <th className="text-left p-2 text-stone-700">Planificado</th>
                        <th className="text-left p-2 text-stone-700">Vendido</th>
                        <th className="text-left p-2 text-stone-700">Restante</th>
                        <th className="text-left p-2 text-stone-700">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jornada.map((j: any) => {
                        const restante = j.cantidad_planificada - j.cantidad_vendida;
                        const estado = restante === 0 ? "Agotado" : restante < 5 ? "Poco" : "Disponible";
                        const color =
                          restante === 0 ? "text-red-600" : restante < 5 ? "text-amber-600" : "text-emerald-600";
                        return (
                          <tr key={j.producto_id} className="border-b border-stone-100">
                            <td className="p-2 text-stone-800">
                              {productos.find((p) => p.id === j.producto_id)?.nombre || "Producto"}
                            </td>
                            <td className="p-2 text-stone-800">{j.cantidad_planificada}</td>
                            <td className="p-2 text-stone-800">{j.cantidad_vendida}</td>
                            <td className={`p-2 font-medium ${color}`}>{restante}</td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  restante === 0
                                    ? "bg-red-100 text-red-700"
                                    : restante < 5
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {estado}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal Nueva Orden (mejorado) */}
      {showModalOrden && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-stone-800 mb-4">Nueva Orden de Producción</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700">Tipo de orden</label>
                <select
                  value={nuevaOrden.tipo}
                  onChange={(e) =>
                    setNuevaOrden({ ...nuevaOrden, tipo: e.target.value as keyof typeof TIPOS_ORDEN })
                  }
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                >
                  {Object.entries(TIPOS_ORDEN).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700">Producto a producir</label>
                <select
                  value={nuevaOrden.producto_id}
                  onChange={(e) => setNuevaOrden({ ...nuevaOrden, producto_id: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                >
                  <option value="">Seleccionar producto terminado</option>
                  {productos
                    .filter(p => p.es_producido === true)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (Stock: {p.stock || 0})
                      </option>
                    ))}
                </select>
                {productos.filter(p => p.es_producido === true).length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No hay productos marcados como "Producido". Edita un producto y marca "es_producido".</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700">Cantidad a producir</label>
                <input
                  type="number"
                  min="1"
                  value={nuevaOrden.cantidad_producida}
                  onChange={(e) => setNuevaOrden({ ...nuevaOrden, cantidad_producida: parseInt(e.target.value) || 1 })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Insumos (ingredientes)</label>
                {nuevaOrden.insumos.map((ins, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <select
                      value={ins.insumo_id}
                      onChange={(e) => actualizarInsumo(idx, "insumo_id", e.target.value)}
                      className="flex-1 border border-stone-300 rounded-xl p-2 text-sm text-stone-800"
                    >
                      <option value="">Seleccionar insumo</option>
                      {productos
                        .filter(p => p.es_insumo === true)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} (Stock: {p.stock || 0})
                          </option>
                        ))}
                    </select>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="Cant."
                      value={ins.cantidad}
                      onChange={(e) => actualizarInsumo(idx, "cantidad", parseFloat(e.target.value) || 0)}
                      className="w-20 border border-stone-300 rounded-xl p-2 text-sm text-stone-800"
                    />
                    <button
                      onClick={() => eliminarInsumo(idx)}
                      className="text-red-500 hover:bg-red-50 rounded-xl p-2"
                      disabled={nuevaOrden.insumos.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={agregarInsumo}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  + Agregar insumo
                </button>
                {productos.filter(p => p.es_insumo === true).length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No hay insumos marcados. Edita un producto y marca "es_insumo".</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700">Nota</label>
                <textarea
                  value={nuevaOrden.nota}
                  onChange={(e) => setNuevaOrden({ ...nuevaOrden, nota: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  rows={2}
                  placeholder="Instrucciones adicionales..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowImportModalOrden(false)}
                className="flex-1 py-2 border border-stone-300 rounded-xl text-stone-700"
              >
                Cancelar
              </button>
              <button
                onClick={crearOrden}
                className="flex-1 py-2 bg-emerald-500 text-white rounded-xl"
              >
                Crear Orden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Jornada (sin cambios) */}
      {showModalJornada && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-800">Planificar Jornada</h3>
              <button onClick={() => setShowImportModalJornada(false)}><X className="w-5 h-5 text-stone-700" /></button>
            </div>
            <div className="space-y-3">
              {formJornada.map((f, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    value={f.producto_id}
                    onChange={(e) => actualizarJornada(idx, "producto_id", e.target.value)}
                    className="flex-1 border border-stone-300 rounded-xl p-2 text-sm text-stone-800"
                  >
                    <option value="">Seleccionar plato</option>
                    {productos.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={f.cantidad}
                    onChange={(e) => actualizarJornada(idx, "cantidad", parseInt(e.target.value) || 1)}
                    className="w-16 border border-stone-300 rounded-xl p-2 text-sm text-stone-800"
                  />
                  <button onClick={() => eliminarJornada(idx)} className="text-red-500 hover:bg-red-50 rounded-xl p-2">
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={agregarProductoJornada}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                + Agregar plato
              </button>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowImportModalJornada(false)} className="flex-1 py-2 border border-stone-300 rounded-xl">
                Cancelar
              </button>
              <button onClick={guardarPlanificacion} className="flex-1 py-2 bg-emerald-500 text-white rounded-xl">
                Guardar Jornada
              </button>
            </div>
          </div>
        </div>
      )}

      <audio ref={audioRef} src="/notification.mp3" />
    </div>
  );
}





