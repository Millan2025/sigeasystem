"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
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
  Users,
  Store,
  ClipboardList,
} from "lucide-react";

// ============================================
// CONFIGURACIÓN DE NEGOCIOS
// ============================================
const NEGOCIOS = {
  panaderia: { titulo: "Panadería Doña Rosa", categoria: "Panaderia", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  restaurante: { titulo: "Restaurante Caribe", categoria: "Restaurante", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  carniceria: { titulo: "Carnicería El Buen Sabor", categoria: "Carniceria", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  salsamentaria: { titulo: "Salsamentaria La Especial", categoria: "Salsamentaria", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  ferreteria: { titulo: "Ferretería El Tornillo", categoria: "Ferreteria", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  tienda: { titulo: "Tienda La Esquina De Calidad", categoria: "Tienda", tenantId: "58d06407-6d1c-4beb-acee-8965001fbbee" },
};

// ============================================
// TIPOS DE ORDEN Y ESTADOS
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

// ============================================
// INTERFACES
// ============================================
interface Orden {
  id: string;
  tipo: keyof typeof TIPOS_ORDEN;
  estado: keyof typeof ESTADOS;
  productos: { nombre: string; cantidad: number; unidad: string }[];
  nota: string;
  creado_por: string;
  creado_en: string;
  actualizado_en: string;
  producido_por?: string;
  numero_orden: number;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function ProduccionPage() {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const pathParts = pathname?.split("/") || [];
  const negocioSlug = pathParts[2] || "restaurante";
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const tenantId = negocio?.tenantId || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";

  // Estado
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [nuevaOrden, setNuevaOrden] = useState<Partial<Orden>>({
    tipo: "pedido_pos",
    productos: [{ nombre: "", cantidad: 1, unidad: "unidad" }],
    nota: "",
  });
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [vista, setVista] = useState<"admin" | "productor">("admin");
  const [notificacion, setNotificacion] = useState<string | null>(null);
  const [contadorNuevas, setContadorNuevas] = useState(0);

  // Referencia para sonido
  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Cargar órdenes desde localStorage (simulación)
  const cargarOrdenes = () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem(`ordenes_${tenantId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setOrdenes(parsed);
        // Contar nuevas (pendientes recientes)
        const nuevas = parsed.filter(
          (o: Orden) => o.estado === "pendiente" && new Date(o.creado_en) > new Date(Date.now() - 60000)
        ).length;
        setContadorNuevas(nuevas);
      } else {
        // Datos de ejemplo
        const ejemplos: Orden[] = [
          {
            id: "ORD-001",
            tipo: "pedido_pos",
            estado: "pendiente",
            productos: [{ nombre: "Pan de Sal", cantidad: 10, unidad: "unidad" }],
            nota: "Para el desayuno",
            creado_por: "Admin",
            creado_en: new Date().toISOString(),
            actualizado_en: new Date().toISOString(),
            numero_orden: 1,
          },
          {
            id: "ORD-002",
            tipo: "pedido_tienda",
            estado: "en_produccion",
            productos: [{ nombre: "Croissant", cantidad: 5, unidad: "unidad" }],
            nota: "Pedido especial",
            creado_por: "Admin",
            creado_en: new Date(Date.now() - 3600000).toISOString(),
            actualizado_en: new Date(Date.now() - 1800000).toISOString(),
            numero_orden: 2,
          },
        ];
        setOrdenes(ejemplos);
        localStorage.setItem(`ordenes_${tenantId}`, JSON.stringify(ejemplos));
      }
    } catch (e) {
      setOrdenes([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarOrdenes();
  }, [tenantId]);

  // Guardar órdenes en localStorage
  const guardarOrdenes = (nuevasOrdenes: Orden[]) => {
    setOrdenes(nuevasOrdenes);
    localStorage.setItem(`ordenes_${tenantId}`, JSON.stringify(nuevasOrdenes));
  };

  // ============================================
  // CREAR NUEVA ORDEN
  // ============================================
  const crearOrden = () => {
    if (!nuevaOrden.productos || nuevaOrden.productos.length === 0) {
      alert("Agrega al menos un producto.");
      return;
    }

    const orden: Orden = {
      id: `ORD-${String(ordenes.length + 1).padStart(3, "0")}`,
      tipo: nuevaOrden.tipo as keyof typeof TIPOS_ORDEN,
      estado: "pendiente",
      productos: nuevaOrden.productos.map((p) => ({
        nombre: p.nombre || "Producto",
        cantidad: p.cantidad || 1,
        unidad: p.unidad || "unidad",
      })),
      nota: nuevaOrden.nota || "",
      creado_por: "Admin",
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
      numero_orden: ordenes.length + 1,
    };

    const nuevas = [...ordenes, orden];
    guardarOrdenes(nuevas);

    // Notificación sonora
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    setContadorNuevas((prev) => prev + 1);
    setNotificacion(`📢 Nueva orden #${orden.numero_orden}`);
    setTimeout(() => setNotificacion(null), 5000);

    setShowModal(false);
    setNuevaOrden({
      tipo: "pedido_pos",
      productos: [{ nombre: "", cantidad: 1, unidad: "unidad" }],
      nota: "",
    });
  };

  // ============================================
  // ACTUALIZAR ESTADO DE ORDEN
  // ============================================
  const cambiarEstado = (id: string, nuevoEstado: keyof typeof ESTADOS) => {
    const orden = ordenes.find((o) => o.id === id);
    if (!orden) return;

    // Solo puede pasar al siguiente estado
    const idxActual = ESTADOS_ORDEN.indexOf(orden.estado);
    const idxNuevo = ESTADOS_ORDEN.indexOf(nuevoEstado);
    if (idxNuevo <= idxActual) return;

    const actualizadas = ordenes.map((o) => {
      if (o.id === id) {
        return {
          ...o,
          estado: nuevoEstado,
          actualizado_en: new Date().toISOString(),
          producido_por: nuevoEstado === "entregado" ? "Productor" : o.producido_por,
        };
      }
      return o;
    });
    guardarOrdenes(actualizadas);
  };

  // ============================================
  // AGREGAR PRODUCTO AL MODAL
  // ============================================
  const agregarProducto = () => {
    setNuevaOrden({
      ...nuevaOrden,
      productos: [...(nuevaOrden.productos || []), { nombre: "", cantidad: 1, unidad: "unidad" }],
    });
  };

  const eliminarProducto = (index: number) => {
    const productos = nuevaOrden.productos || [];
    if (productos.length <= 1) return;
    setNuevaOrden({
      ...nuevaOrden,
      productos: productos.filter((_, i) => i !== index),
    });
  };

  const actualizarProducto = (index: number, campo: string, valor: any) => {
    const productos = nuevaOrden.productos || [];
    productos[index] = { ...productos[index], [campo]: valor };
    setNuevaOrden({ ...nuevaOrden, productos });
  };

  // ============================================
  // FILTRADO
  // ============================================
  const ordenesFiltradas = ordenes.filter((o) => {
    if (filtroEstado === "todos") return true;
    return o.estado === filtroEstado;
  });

  // ============================================
  // NOTIFICACIONES BADGE
  // ============================================
  const badgeColor =
    contadorNuevas > 0
      ? "bg-red-500 text-white animate-pulse"
      : "bg-stone-200 text-stone-600";

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

        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-500">Vista:</span>
          <button
            onClick={() => setVista("admin")}
            className={`px-3 py-1 rounded-xl text-sm font-medium ${
              vista === "admin"
                ? "bg-emerald-500 text-white"
                : "bg-stone-200 text-stone-700 hover:bg-stone-300"
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => setVista("productor")}
            className={`px-3 py-1 rounded-xl text-sm font-medium ${
              vista === "productor"
                ? "bg-blue-500 text-white"
                : "bg-stone-200 text-stone-700 hover:bg-stone-300"
            }`}
          >
            Productor
          </button>
        </div>

        <button
          onClick={cargarOrdenes}
          className="p-2 hover:bg-stone-100 rounded-xl"
          title="Recargar"
        >
          <RefreshCw className="w-5 h-5 text-stone-700" />
        </button>

        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Nueva Orden
        </button>

        <div className="relative">
          <Bell className={`w-6 h-6 ${contadorNuevas > 0 ? "text-red-500" : "text-stone-400"}`} />
          {contadorNuevas > 0 && (
            <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${badgeColor}`}>
              {contadorNuevas}
            </span>
          )}
        </div>
      </header>

      {/* Notificación */}
      {notificacion && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 text-emerald-700 font-medium animate-pulse">
          {notificacion}
        </div>
      )}

      <div className="p-4 max-w-7xl mx-auto">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFiltroEstado("todos")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              filtroEstado === "todos"
                ? "bg-stone-800 text-white"
                : "bg-white text-stone-700 border border-stone-300"
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

        {/* Tabla de órdenes */}
        {loading ? (
          <div className="text-center py-12 text-stone-500">Cargando órdenes...</div>
        ) : ordenesFiltradas.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
            <ClipboardList className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No hay órdenes en este estado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                        <span className="font-bold text-stone-800">#{orden.numero_orden}</span>
                        <span className="text-xs text-stone-400 ml-2">{orden.id}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipoInfo.color}`}>
                        <TipoIcon className="w-3 h-3 inline mr-1" />
                        {tipoInfo.label}
                      </span>
                    </div>

                    <div className="space-y-1 mb-2">
                      {orden.productos.map((p, i) => (
                        <div key={i} className="text-sm text-stone-700">
                          {p.cantidad} × {p.nombre} {p.unidad !== "unidad" ? `(${p.unidad})` : ""}
                        </div>
                      ))}
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

                    {/* Acciones para productor */}
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

                    {/* Información para admin */}
                    {vista === "admin" && (
                      <div className="mt-3 text-xs text-stone-400">
                        {orden.producido_por && <span>👤 {orden.producido_por}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal Nueva Orden */}
      {showModal && (
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
                <label className="block text-sm font-medium text-stone-700 mb-1">Productos</label>
                {(nuevaOrden.productos || []).map((p, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Nombre"
                      value={p.nombre}
                      onChange={(e) => actualizarProducto(idx, "nombre", e.target.value)}
                      className="flex-1 border border-stone-300 rounded-xl p-2 text-sm text-stone-800"
                    />
                    <input
                      type="number"
                      placeholder="Cant."
                      value={p.cantidad}
                      onChange={(e) =>
                        actualizarProducto(idx, "cantidad", parseInt(e.target.value) || 1)
                      }
                      className="w-16 border border-stone-300 rounded-xl p-2 text-sm text-stone-800"
                    />
                    <input
                      type="text"
                      placeholder="Unidad"
                      value={p.unidad}
                      onChange={(e) => actualizarProducto(idx, "unidad", e.target.value)}
                      className="w-20 border border-stone-300 rounded-xl p-2 text-sm text-stone-800"
                    />
                    <button
                      onClick={() => eliminarProducto(idx)}
                      className="text-red-500 hover:bg-red-50 rounded-xl p-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={agregarProducto}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  + Agregar producto
                </button>
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
                onClick={() => setShowModal(false)}
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

      {/* Audio de notificación (se crea un elemento HTML) */}
      <audio ref={audioRef} src="/notification.mp3" />
    </div>
  );
}
