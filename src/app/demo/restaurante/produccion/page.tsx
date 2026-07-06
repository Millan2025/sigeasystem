"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Package,
  User,
  Calendar,
  Bell,
  PlayCircle,
  Check,
  X,
} from "lucide-react";

const NEGOCIOS = {
  panaderia: { titulo: "Panadería Doña Rosa", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  restaurante: { titulo: "Restaurante Caribe", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  carniceria: { titulo: "Carnicería El Buen Sabor", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  salsamentaria: { titulo: "Salsamentaria La Especial", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  ferreteria: { titulo: "Ferretería El Tornillo", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  tienda: { titulo: "Tienda La Esquina De Calidad", tenantId: "58d06407-6d1c-4beb-acee-8965001fbbee" },
};

// Estados posibles con colores
const ESTADOS = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  recibido: { label: "Recibido", color: "bg-blue-100 text-blue-800 border-blue-300" },
  en_produccion: { label: "En Producción", color: "bg-purple-100 text-purple-800 border-purple-300" },
  finalizado: { label: "Finalizado", color: "bg-green-100 text-green-800 border-green-300" },
  entregado: { label: "Entregado", color: "bg-gray-100 text-gray-800 border-gray-300" },
};

// Tipos de orden
const TIPOS = {
  pedido_tienda: { label: "Pedido Tienda", icon: ShoppingCart },
  pedido_pos: { label: "Pedido POS", icon: ShoppingCart },
  surtir_vitrina: { label: "Surtir Vitrina", icon: Package },
  produccion_planificada: { label: "Producción Planificada", icon: Calendar },
};

export default function ProduccionPage() {
  const pathname = usePathname();
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [productos, setProductos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [notificacion, setNotificacion] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const audioRef = useRef(null);

  // Datos del negocio
  const pathParts = pathname?.split("/") || [];
  const negocioSlug = pathParts[2] || "restaurante";
  const negocio = NEGOCIOS[negocioSlug];
  const tenantId = negocio?.tenantId || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";

  // Formulario para nueva orden
  const [form, setForm] = useState({
    tipo: "produccion_planificada",
    descripcion: "",
    fecha_entrega: "",
    prioridad: 0,
    productor_asignado: "",
    productos: [],
    observaciones: "",
  });

  // Cargar datos iniciales
  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Obtener órdenes
      const resOrdenes = await fetch(`/api/ordenes-produccion?tenant=${tenantId}`);
      const dataOrdenes = await resOrdenes.json();
      if (dataOrdenes.success) setOrdenes(dataOrdenes.data || []);

      // Obtener productos para el selector
      const resProductos = await fetch(`/api/products?tenant=${tenantId}`);
      const dataProductos = await resProductos.json();
      if (dataProductos.success) setProductos(dataProductos.data || []);

      // Obtener usuarios (productores potenciales)
      const resUsuarios = await fetch(`/api/usuarios?tenant=${tenantId}`);
      const dataUsuarios = await resUsuarios.json();
      if (dataUsuarios.success) setUsuarios(dataUsuarios.data || []);
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
    // Reproducir sonido de notificación si hay nuevas órdenes
    const interval = setInterval(() => {
      // Podrías hacer polling cada 30s para detectar nuevas órdenes
      // Por ahora, solo al cargar
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reproducir sonido de notificación
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  // Crear orden
  const crearOrden = async () => {
    const res = await fetch("/api/ordenes-produccion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tenant_id: tenantId }),
    });
    const data = await res.json();
    if (data.success) {
      setShowModal(false);
      setForm({
        tipo: "produccion_planificada",
        descripcion: "",
        fecha_entrega: "",
        prioridad: 0,
        productor_asignado: "",
        productos: [],
        observaciones: "",
      });
      cargarDatos();
      playNotificationSound();
      setNotificacion("✅ Orden creada exitosamente");
      setTimeout(() => setNotificacion(null), 3000);
    } else {
      alert("Error: " + data.error);
    }
  };

  // Actualizar estado de una orden
  const actualizarEstado = async (id: string, nuevoEstado: string) => {
    const res = await fetch(`/api/ordenes-produccion/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    const data = await res.json();
    if (data.success) {
      cargarDatos();
      playNotificationSound();
      setNotificacion(`✅ Estado actualizado a "${ESTADOS[nuevoEstado].label}"`);
      setTimeout(() => setNotificacion(null), 3000);
    } else {
      alert("Error: " + data.error);
    }
  };

  // Eliminar orden (solo si está pendiente)
  const eliminarOrden = async (id: string) => {
    if (!confirm("¿Eliminar esta orden?")) return;
    const res = await fetch(`/api/ordenes-produccion/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      cargarDatos();
      setNotificacion("🗑️ Orden eliminada");
      setTimeout(() => setNotificacion(null), 3000);
    } else {
      alert("Error: " + data.error);
    }
  };

  // Filtrar órdenes
  const ordenesFiltradas = ordenes.filter((o: any) => {
    if (filtroEstado === "todos") return true;
    return o.estado === filtroEstado;
  });

  // Contar órdenes pendientes para badge
  const pendientes = ordenes.filter((o: any) => o.estado === "pendiente" || o.estado === "recibido").length;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Sonido de notificación (se ejecuta al recibir nueva orden) */}
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {/* Cabecera */}
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-4 flex items-center gap-3 sticky top-0 z-10 shadow-lg">
        <Link href={`/demo/${negocioSlug}`} className="p-2 hover:bg-white/10 rounded-xl transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Producción - {negocio?.titulo}</h1>
          <p className="text-stone-300 text-sm">{ordenes.length} órdenes totales</p>
        </div>
        <div className="relative">
          <button onClick={cargarDatos} className="p-2 hover:bg-white/10 rounded-xl transition">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition shadow-md"
        >
          <Plus className="w-4 h-4" /> Nueva Orden
        </button>
        {/* Badge de notificaciones */}
        {pendientes > 0 && (
          <div className="relative">
            <Bell className="w-5 h-5 text-yellow-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {pendientes}
            </span>
          </div>
        )}
      </header>

      {/* Notificación temporal */}
      {notificacion && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-xl px-6 py-3 z-50 border border-emerald-200 flex items-center gap-2 animate-fade-in">
          <span className="text-emerald-500">{notificacion}</span>
        </div>
      )}

      <div className="p-4 max-w-7xl mx-auto">
        {/* Filtro de estado */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFiltroEstado("todos")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filtroEstado === "todos" ? "bg-stone-800 text-white" : "bg-white text-stone-700 hover:bg-stone-100"
            }`}
          >
            Todos
          </button>
          {Object.entries(ESTADOS).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setFiltroEstado(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                filtroEstado === key ? "bg-stone-800 text-white" : "bg-white text-stone-700 hover:bg-stone-100"
              }`}
            >
              {val.label}
            </button>
          ))}
        </div>

        {/* Lista de órdenes */}
        {loading ? (
          <div className="text-center py-12 text-stone-500">Cargando órdenes...</div>
        ) : ordenesFiltradas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200">
            <Package className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No hay órdenes {filtroEstado !== "todos" && `con estado "${ESTADOS[filtroEstado]?.label}"`}</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 bg-emerald-500 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-emerald-600 transition"
            >
              Crear primera orden
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ordenesFiltradas.map((orden: any) => {
              const estadoInfo = ESTADOS[orden.estado] || ESTADOS.pendiente;
              const tipoInfo = TIPOS[orden.tipo] || { label: orden.tipo };
              const IconoTipo = tipoInfo.icon || Package;
              return (
                <div
                  key={orden.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <IconoTipo className="w-5 h-5 text-stone-600" />
                      <span className="text-sm font-medium text-stone-600">{tipoInfo.label}</span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${estadoInfo.color}`}
                    >
                      {estadoInfo.label}
                    </span>
                  </div>
                  <h3 className="font-semibold text-stone-800 text-lg truncate">{orden.descripcion || "Orden sin descripción"}</h3>
                  <div className="mt-2 space-y-1 text-sm text-stone-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Entrega: {orden.fecha_entrega ? new Date(orden.fecha_entrega).toLocaleDateString() : "No definida"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Productor: {orden.productor_asignado ? "Asignado" : "Sin asignar"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span>{orden.productos?.length || 0} productos</span>
                    </div>
                    {orden.observaciones && (
                      <p className="text-stone-400 text-xs italic">{orden.observaciones}</p>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {/* Botones según estado */}
                    {orden.estado === "pendiente" && (
                      <>
                        <button
                          onClick={() => actualizarEstado(orden.id, "recibido")}
                          className="bg-blue-500 text-white px-3 py-1 rounded-xl text-xs hover:bg-blue-600 transition flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Recibir
                        </button>
                        <button
                          onClick={() => eliminarOrden(orden.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded-xl text-xs hover:bg-red-600 transition flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Eliminar
                        </button>
                      </>
                    )}
                    {orden.estado === "recibido" && (
                      <button
                        onClick={() => actualizarEstado(orden.id, "en_produccion")}
                        className="bg-purple-500 text-white px-3 py-1 rounded-xl text-xs hover:bg-purple-600 transition flex items-center gap-1"
                      >
                        <PlayCircle className="w-3 h-3" /> Iniciar
                      </button>
                    )}
                    {orden.estado === "en_produccion" && (
                      <button
                        onClick={() => actualizarEstado(orden.id, "finalizado")}
                        className="bg-green-500 text-white px-3 py-1 rounded-xl text-xs hover:bg-green-600 transition flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" /> Finalizar
                      </button>
                    )}
                    {orden.estado === "finalizado" && (
                      <button
                        onClick={() => actualizarEstado(orden.id, "entregado")}
                        className="bg-stone-500 text-white px-3 py-1 rounded-xl text-xs hover:bg-stone-600 transition flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Entregar
                      </button>
                    )}
                    {/* Botón de editar siempre visible */}
                    <button
                      onClick={() => {
                        setEditando(orden);
                        setForm({
                          tipo: orden.tipo,
                          descripcion: orden.descripcion,
                          fecha_entrega: orden.fecha_entrega || "",
                          prioridad: orden.prioridad || 0,
                          productor_asignado: orden.productor_asignado || "",
                          productos: orden.productos || [],
                          observaciones: orden.observaciones || "",
                        });
                        setShowModal(true);
                      }}
                      className="bg-stone-200 text-stone-700 px-3 py-1 rounded-xl text-xs hover:bg-stone-300 transition flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" /> Editar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para crear/editar orden */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-800">
                {editando ? "Editar Orden" : "Nueva Orden"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditando(null);
                  setForm({
                    tipo: "produccion_planificada",
                    descripcion: "",
                    fecha_entrega: "",
                    prioridad: 0,
                    productor_asignado: "",
                    productos: [],
                    observaciones: "",
                  });
                }}
                className="p-2 hover:bg-stone-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                >
                  <option value="pedido_tienda">Pedido Tienda</option>
                  <option value="pedido_pos">Pedido POS</option>
                  <option value="surtir_vitrina">Surtir Vitrina</option>
                  <option value="produccion_planificada">Producción Planificada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Descripción</label>
                <input
                  type="text"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  placeholder="Ej. Pedido #123 - 5 baguettes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Fecha de entrega</label>
                <input
                  type="date"
                  value={form.fecha_entrega}
                  onChange={(e) => setForm({ ...form, fecha_entrega: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Prioridad</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={form.prioridad}
                  onChange={(e) => setForm({ ...form, prioridad: parseInt(e.target.value) || 0 })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Productor asignado</label>
                <select
                  value={form.productor_asignado}
                  onChange={(e) => setForm({ ...form, productor_asignado: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                >
                  <option value="">Sin asignar</option>
                  {usuarios.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.nombre || u.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Productos (JSON)</label>
                <textarea
                  value={JSON.stringify(form.productos, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setForm({ ...form, productos: parsed });
                    } catch {
                      // Si no es JSON válido, no actualizar
                    }
                  }}
                  rows={3}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800 font-mono text-sm"
                  placeholder='[{"nombre":"Pan de Sal","cantidad":10}]'
                />
                <p className="text-xs text-stone-500 mt-1">Ingresa un array de objetos con "nombre" y "cantidad"</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Observaciones</label>
                <input
                  type="text"
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditando(null);
                }}
                className="flex-1 py-2 border border-stone-300 rounded-xl text-stone-700"
              >
                Cancelar
              </button>
              <button
                onClick={crearOrden}
                className="flex-1 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition"
              >
                {editando ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos adicionales */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
