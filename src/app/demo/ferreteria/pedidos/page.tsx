"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  Truck,
  ShoppingBag,
  X,
} from "lucide-react";

const NEGOCIOS = {
  panaderia: { titulo: "Panadería Doña Rosa", categoria: "Panaderia", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  restaurante: { titulo: "Restaurante Caribe", categoria: "Restaurante", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  carniceria: { titulo: "Carnicería El Buen Sabor", categoria: "Carniceria", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  salsamentaria: { titulo: "Salsamentaria La Especial", categoria: "Salsamentaria", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  ferreteria: { titulo: "Ferretería El Tornillo", categoria: "Ferreteria", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  tienda: { titulo: "Tienda La Esquina De Calidad", categoria: "Tienda", tenantId: "58d06407-6d1c-4beb-acee-8965001fbbee" },
};

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
}

interface PedidoItem {
  producto_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
}

interface Pedido {
  id: string;
  cliente: string;
  fecha: string;
  total: number;
  estado: "pendiente" | "confirmado" | "preparando" | "en_camino" | "entregado";
  metodo_pago: string;
  items: PedidoItem[];
  direccion?: string;
}

const ESTADOS = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
  confirmado: { label: "Confirmado", color: "bg-blue-100 text-blue-700" },
  preparando: { label: "Preparando", color: "bg-purple-100 text-purple-700" },
  en_camino: { label: "En camino", color: "bg-cyan-100 text-cyan-700" },
  entregado: { label: "Entregado", color: "bg-emerald-100 text-emerald-700" },
};

const LISTA_ESTADOS = ["pendiente", "confirmado", "preparando", "en_camino", "entregado"];

export default function PedidosPage() {
  const pathname = usePathname();
  const pathParts = pathname?.split("/") || [];
  const negocioSlug = pathParts[2] || "restaurante";
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const tenantId = negocio?.tenantId || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Pedido | null>(null);
  const [form, setForm] = useState<Partial<Pedido>>({
    cliente: "",
    metodo_pago: "Efectivo",
    items: [],
    direccion: "",
  });
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [detallePedido, setDetallePedido] = useState<Pedido | null>(null);

  // Cargar productos desde API
  const cargarProductos = async () => {
    try {
      const res = await fetch(`/api/products?tenant=${tenantId}`);
      const data = await res.json();
      if (data.success) setProductos(data.data || []);
    } catch (e) {
      setProductos([]);
    }
  };

  // Cargar pedidos desde localStorage
  const cargarPedidos = () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem(`pedidos_${tenantId}`);
      if (stored) {
        setPedidos(JSON.parse(stored));
      } else {
        // Datos de ejemplo
        const ejemplos: Pedido[] = [
          {
            id: "PED-001",
            cliente: "Carlos López",
            fecha: new Date().toISOString(),
            total: 45000,
            estado: "pendiente",
            metodo_pago: "Efectivo",
            items: [{ producto_id: "prod1", nombre: "Pan de Sal", cantidad: 5, precio_unitario: 2500 }],
            direccion: "Calle 123",
          },
          {
            id: "PED-002",
            cliente: "Ana Martínez",
            fecha: new Date(Date.now() - 3600000).toISOString(),
            total: 72000,
            estado: "confirmado",
            metodo_pago: "Nequi",
            items: [{ producto_id: "prod2", nombre: "Croissant", cantidad: 4, precio_unitario: 1800 }],
            direccion: "Carrera 8",
          },
        ];
        setPedidos(ejemplos);
        localStorage.setItem(`pedidos_${tenantId}`, JSON.stringify(ejemplos));
      }
    } catch (e) {
      setPedidos([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarProductos();
    cargarPedidos();
  }, [tenantId]);

  const guardarPedidos = (nuevos: Pedido[]) => {
    setPedidos(nuevos);
    localStorage.setItem(`pedidos_${tenantId}`, JSON.stringify(nuevos));
  };

  // CRUD Pedidos
  const guardarPedido = () => {
    if (!form.cliente || !form.items || form.items.length === 0) {
      alert("Cliente y al menos un producto son obligatorios");
      return;
    }
    const total = form.items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
    const nuevo: Pedido = {
      id: editando ? editando.id : `PED-${String(pedidos.length + 1).padStart(3, "0")}`,
      cliente: form.cliente!,
      fecha: new Date().toISOString(),
      total: total,
      estado: "pendiente",
      metodo_pago: form.metodo_pago || "Efectivo",
      items: form.items.map((item) => ({
        ...item,
        producto_id: item.producto_id,
        nombre: item.nombre || "Producto",
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
      })),
      direccion: form.direccion || "",
    };
    let nuevos: Pedido[];
    if (editando) {
      nuevos = pedidos.map((p) => (p.id === editando.id ? nuevo : p));
    } else {
      nuevos = [...pedidos, nuevo];
    }
    guardarPedidos(nuevos);
    setShowModal(false);
    setEditando(null);
    setForm({ cliente: "", metodo_pago: "Efectivo", items: [], direccion: "" });
  };

  const eliminarPedido = (id: string) => {
    if (!confirm("¿Eliminar este pedido?")) return;
    guardarPedidos(pedidos.filter((p) => p.id !== id));
  };

  const cambiarEstado = (id: string, nuevoEstado: Pedido["estado"]) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido) return;
    const idxActual = LISTA_ESTADOS.indexOf(pedido.estado);
    const idxNuevo = LISTA_ESTADOS.indexOf(nuevoEstado);
    if (idxNuevo <= idxActual) return;
    const actualizados = pedidos.map((p) =>
      p.id === id ? { ...p, estado: nuevoEstado } : p
    );
    guardarPedidos(actualizados);
  };

  const agregarItem = () => {
    setForm({
      ...form,
      items: [...(form.items || []), { producto_id: "", nombre: "", cantidad: 1, precio_unitario: 0 }],
    });
  };

  const actualizarItem = (idx: number, campo: string, valor: any) => {
    const items = form.items || [];
    items[idx] = { ...items[idx], [campo]: valor };
    setForm({ ...form, items });
  };

  const eliminarItem = (idx: number) => {
    const items = form.items || [];
    if (items.length <= 1) return;
    setForm({ ...form, items: items.filter((_, i) => i !== idx) });
  };

  const pedidosFiltrados = pedidos.filter((p) => {
    if (filtroEstado === "todos") return true;
    return p.estado === filtroEstado;
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href={`/demo/${negocioSlug}`} className="p-2 hover:bg-stone-100 rounded-xl">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </Link>
        <h1 className="text-xl font-bold text-stone-800 flex-1">Pedidos - {negocio?.titulo}</h1>
        <div className="flex items-center gap-2">
          <button onClick={cargarPedidos} className="p-2 hover:bg-stone-100 rounded-xl">
            <RefreshCw className="w-5 h-5 text-stone-700" />
          </button>
          <button
            onClick={() => {
              setEditando(null);
              setForm({ cliente: "", metodo_pago: "Efectivo", items: [], direccion: "" });
              setShowModal(true);
            }}
            className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Nuevo Pedido
          </button>
        </div>
      </header>

      <div className="p-4 max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFiltroEstado("todos")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${filtroEstado === "todos" ? "bg-stone-800 text-white" : "bg-white text-stone-700 border border-stone-300"}`}
          >
            Todos ({pedidos.length})
          </button>
          {LISTA_ESTADOS.map((estado) => {
            const info = ESTADOS[estado as keyof typeof ESTADOS];
            const count = pedidos.filter((p) => p.estado === estado).length;
            return (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${filtroEstado === estado ? `${info.color} border-2 border-current` : "bg-white text-stone-700 border border-stone-300"}`}
              >
                {info.label} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-12 text-stone-500">Cargando...</div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
            <ShoppingBag className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No hay pedidos en este estado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pedidosFiltrados.map((pedido) => {
              const estadoInfo = ESTADOS[pedido.estado];
              return (
                <div key={pedido.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-stone-800">#{pedido.id}</span>
                      <span className="text-xs text-stone-400 ml-2">{new Date(pedido.fecha).toLocaleString()}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoInfo.color}`}>
                      {estadoInfo.label}
                    </span>
                  </div>
                  <p className="text-sm text-stone-700 font-medium">{pedido.cliente}</p>
                  <p className="text-sm text-stone-500">📦 {pedido.items.length} productos</p>
                  <p className="text-sm text-stone-500">💰 ${pedido.total.toLocaleString()}</p>
                  <p className="text-xs text-stone-400">Pago: {pedido.metodo_pago}</p>
                  {pedido.direccion && <p className="text-xs text-stone-400">📍 {pedido.direccion}</p>}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setDetallePedido(pedido)}
                      className="text-xs bg-stone-200 text-stone-700 px-2 py-1 rounded-full hover:bg-stone-300"
                    >
                      <Eye className="w-3 h-3 inline mr-1" /> Detalle
                    </button>
                    {LISTA_ESTADOS.map((estado) => {
                      const idxActual = LISTA_ESTADOS.indexOf(pedido.estado);
                      const idxNuevo = LISTA_ESTADOS.indexOf(estado);
                      if (idxNuevo <= idxActual) return null;
                      const info = ESTADOS[estado as keyof typeof ESTADOS];
                      return (
                        <button
                          key={estado}
                          onClick={() => cambiarEstado(pedido.id, estado as Pedido["estado"])}
                          className={`text-xs px-2 py-1 rounded-full ${info.color} hover:opacity-80 transition`}
                        >
                          {info.label}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => eliminarPedido(pedido.id)}
                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full hover:bg-red-200"
                    >
                      <Trash2 className="w-3 h-3 inline mr-1" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Nuevo/Editar Pedido */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-stone-800 mb-4">{editando ? "Editar Pedido" : "Nuevo Pedido"}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700">Cliente *</label>
                <input
                  type="text"
                  value={form.cliente || ""}
                  onChange={(e) => setForm({ ...form, cliente: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Método de Pago</label>
                <select
                  value={form.metodo_pago || "Efectivo"}
                  onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Nequi">Nequi</option>
                  <option value="Bancolombia">Bancolombia</option>
                  <option value="Daviplata">Daviplata</option>
                  <option value="Crédito">Crédito</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Dirección (opcional)</label>
                <input
                  type="text"
                  value={form.direccion || ""}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Productos</label>
                {(form.items || []).map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <select
                      value={item.producto_id}
                      onChange={(e) => {
                        const prodId = e.target.value;
                        const prod = productos.find((p) => p.id === prodId);
                        actualizarItem(idx, "producto_id", prodId);
                        actualizarItem(idx, "nombre", prod?.nombre || "");
                        actualizarItem(idx, "precio_unitario", prod?.precio || 0);
                      }}
                      className="flex-1 border border-stone-300 rounded-xl p-2 text-sm text-stone-800"
                    >
                      <option value="">Seleccionar</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => actualizarItem(idx, "cantidad", parseInt(e.target.value) || 1)}
                      className="w-16 border border-stone-300 rounded-xl p-2 text-sm text-stone-800"
                    />
                    <button onClick={() => eliminarItem(idx)} className="text-red-500 hover:bg-red-50 rounded-xl p-2">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={agregarItem} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  + Agregar producto
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-stone-300 rounded-xl text-stone-700">
                Cancelar
              </button>
              <button onClick={guardarPedido} className="flex-1 py-2 bg-emerald-500 text-white rounded-xl">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle Pedido */}
      {detallePedido && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-800">Detalle Pedido #{detallePedido.id}</h3>
              <button onClick={() => setDetallePedido(null)}><X className="w-5 h-5 text-stone-700" /></button>
            </div>
            <p className="text-sm text-stone-600">Cliente: {detallePedido.cliente}</p>
            <p className="text-sm text-stone-600">Fecha: {new Date(detallePedido.fecha).toLocaleString()}</p>
            <p className="text-sm text-stone-600">Método Pago: {detallePedido.metodo_pago}</p>
            <p className="text-sm text-stone-600">Estado: {ESTADOS[detallePedido.estado].label}</p>
            {detallePedido.direccion && <p className="text-sm text-stone-600">Dirección: {detallePedido.direccion}</p>}
            <div className="mt-3 border-t pt-3">
              <h4 className="font-semibold text-stone-700">Productos</h4>
              <ul className="space-y-1 mt-1">
                {detallePedido.items.map((item, i) => (
                  <li key={i} className="text-sm text-stone-700 flex justify-between">
                    <span>{item.cantidad} × {item.nombre}</span>
                    <span>${(item.cantidad * item.precio_unitario).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between font-bold mt-2 text-stone-800">
                <span>Total</span>
                <span>${detallePedido.total.toLocaleString()}</span>
              </div>
            </div>
            <button onClick={() => setDetallePedido(null)} className="w-full border border-stone-300 py-2 rounded-xl mt-4 text-stone-700">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
