"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation"; import BackButton from "@/components/BackButton";
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

interface PedidoItem {
  product_id: string;
  quantity: number;
  price: number;
  productos?: { id: string; nombre: string; precio: number };
}

interface Pedido {
  id: string;
  customer_id: string;
  customer_name?: string;
  status: string;
  subtotal: number;
  total: number;
  metodo_pago: string;
  direccion_entrega: string;
  created_at: string;
  order_items: PedidoItem[];
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
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Pedido | null>(null);
  const [form, setForm] = useState<{
    customer_name: string;
    metodo_pago: string;
    direccion_entrega: string;
    items: { product_id: string; quantity: number }[];
  }>({
    customer_name: "",
    metodo_pago: "Efectivo",
    direccion_entrega: "",
    items: [],
  });
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [detallePedido, setdetallePedido] = useState<Pedido | null>(null);
  const [mensaje, setMensaje] = useState("");

  // Cargar productos para el modal
  const cargarProductos = async () => {
    try {
      const res = await fetch(`/api/products?tenant=${tenantId}`);
      const data = await res.json();
      if (data.success) setProductos(data.data || []);
    } catch (e) {
      setProductos([]);
    }
  };

  // Cargar pedidos desde Supabase
  const cargarPedidos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?tenant=${tenantId}`);
      const data = await res.json();
      if (data.success) {
        setPedidos(data.data || []);
      } else {
        setPedidos([]);
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

  // Cambiar estado del pedido y, si es confirmado, crear orden de producción
  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido) return;

    const idxActual = LISTA_ESTADOS.indexOf(pedido.status);
    const idxNuevo = LISTA_ESTADOS.indexOf(nuevoEstado);
    if (idxNuevo <= idxActual) return;

    try {
      // 1. Actualizar estado en customer_orders
      const resUpdate = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nuevoEstado }),
      });
      const dataUpdate = await resUpdate.json();
      if (!dataUpdate.success) {
        alert("Error al actualizar estado: " + dataUpdate.error);
        return;
      }

      // 2. Si el nuevo estado es "confirmado" o "preparando", crear orden de producción
      if (nuevoEstado === "confirmado" || nuevoEstado === "preparando") {
        // Mapear items del pedido a productos con nombre y unidad (por defecto 'unidad')
        const productosOrden = pedido.order_items.map((item) => ({
          nombre: item.productos?.nombre || "Producto",
          cantidad: item.quantity,
          unidad: "unidad", // Podríamos obtenerlo de productos si existe
        }));

        const resProd = await fetch("/api/ordenes-produccion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pedido_id: pedido.id,
            tenant_id: tenantId,
            tipo: "pedido_tienda",
            productos: productosOrden,
            nota: `Pedido de ${pedido.customer_name || "Cliente"}`,
            creado_por: "Sistema (Pedidos)",
          }),
        });
        const dataProd = await resProd.json();
        if (dataProd.success) {
          setMensaje(`✅ Orden de producción creada para pedido #${pedido.id.slice(0, 6)}`);
          setTimeout(() => setMensaje(""), 5000);
        } else {
          alert("Error al crear orden de producción: " + dataProd.error);
        }
      }

      // Recargar pedidos
      cargarPedidos();
    } catch (error) {
      alert("Error de conexión");
    }
  };

  // Guardar pedido (POST a /api/orders)
  const guardarPedido = async () => {
    if (!form.customer_name || form.items.length === 0) {
      alert("Cliente y al menos un producto son obligatorios");
      return;
    }

    // Preparar items
    const items = form.items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: productos.find((p) => p.id === item.product_id)?.precio || 0,
    }));

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const body = {
      customer_id: null, // Podríamos crear o buscar cliente
      tenant_id: tenantId,
      items,
      direccion_entrega: form.direccion_entrega || "Pendiente",
      metodo_pago: form.metodo_pago,
      total,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setMensaje(`✅ Pedido #${data.data.id.slice(0, 6)} creado`);
        setTimeout(() => setMensaje(""), 5000);
        setShowModal(false);
        setForm({ customer_name: "", metodo_pago: "Efectivo", direccion_entrega: "", items: [] });
        cargarPedidos();
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) {
      alert("Error de conexión");
    }
  };

  // Eliminar pedido (solo si está pendiente)
  const eliminarPedido = async (id: string) => {
    if (!confirm("¿Eliminar este pedido?")) return;
    // No implementamos DELETE en API, pero se puede agregar
    alert("Eliminación no implementada en API.");
  };

  // Agregar item al formulario
  const agregarItem = () => {
    setForm({
      ...form,
      items: [...form.items, { product_id: "", quantity: 1 }],
    });
  };

  const actualizarItem = (idx: number, campo: string, valor: any) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [campo]: valor };
    setForm({ ...form, items });
  };

  const eliminarItem = (idx: number) => {
    if (form.items.length <= 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  // Filtrar pedidos
  const pedidosFiltrados = pedidos.filter((p) => {
    if (filtroEstado === "todos") return true;
    return p.status === filtroEstado;
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <BackButton />
        <h1 className="text-xl font-bold text-stone-800 flex-1">Pedidos - {negocio?.titulo}</h1>
        <div className="flex items-center gap-2">
          <button onClick={cargarPedidos} className="p-2 hover:bg-stone-100 rounded-xl">
            <RefreshCw className="w-5 h-5 text-stone-700" />
          </button>
          <button
            onClick={() => {
              setEditando(null);
              setForm({ customer_name: "", metodo_pago: "Efectivo", direccion_entrega: "", items: [] });
              setShowModal(true);
            }}
            className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Nuevo Pedido
          </button>
        </div>
      </header>

      {mensaje && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 text-emerald-700 font-medium">
          {mensaje}
        </div>
      )}

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
            const count = pedidos.filter((p) => p.status === estado).length;
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
              const estadoInfo = ESTADOS[pedido.status as keyof typeof ESTADOS] || ESTADOS.pendiente;
              return (
                <div key={pedido.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-stone-800">#{pedido.id.slice(0, 6)}</span>
                      <span className="text-xs text-stone-400 ml-2">{new Date(pedido.created_at).toLocaleString()}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoInfo.color}`}>
                      {estadoInfo.label}
                    </span>
                  </div>
                  <p className="text-sm text-stone-700 font-medium">{pedido.customer_name || "Cliente"}</p>
                  <p className="text-sm text-stone-500">📦 {pedido.order_items?.length || 0} productos</p>
                  <p className="text-sm text-stone-500">💰 ${pedido.total?.toLocaleString()}</p>
                  <p className="text-xs text-stone-400">Pago: {pedido.metodo_pago}</p>
                  {pedido.direccion_entrega && <p className="text-xs text-stone-400">📍 {pedido.direccion_entrega}</p>}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setdetallePedido(pedido)}
                      className="text-xs bg-stone-200 text-stone-700 px-2 py-1 rounded-full hover:bg-stone-300"
                    >
                      <Eye className="w-3 h-3 inline mr-1" /> Detalle
                    </button>
                    {LISTA_ESTADOS.map((estado) => {
                      const idxActual = LISTA_ESTADOS.indexOf(pedido.status);
                      const idxNuevo = LISTA_ESTADOS.indexOf(estado);
                      if (idxNuevo <= idxActual) return null;
                      const info = ESTADOS[estado as keyof typeof ESTADOS];
                      return (
                        <button
                          key={estado}
                          onClick={() => cambiarEstado(pedido.id, estado)}
                          className={`text-xs px-2 py-1 rounded-full ${info.color} hover:opacity-80 transition`}
                        >
                          {info.label}
                        </button>
                      );
                    })}
                    {pedido.status === "pendiente" && (
                      <button
                        onClick={() => eliminarPedido(pedido.id)}
                        className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full hover:bg-red-200"
                      >
                        <Trash2 className="w-3 h-3 inline mr-1" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Nuevo Pedido */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-stone-800 mb-4">Nuevo Pedido</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700">Cliente</label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Método de Pago</label>
                <select
                  value={form.metodo_pago}
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
                  value={form.direccion_entrega}
                  onChange={(e) => setForm({ ...form, direccion_entrega: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Productos</label>
                {form.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <select
                      value={item.product_id}
                      onChange={(e) => {
                        const prodId = e.target.value;
                        actualizarItem(idx, "product_id", prodId);
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
                      value={item.quantity}
                      onChange={(e) => actualizarItem(idx, "quantity", parseInt(e.target.value) || 1)}
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

      {/* Modal Detalle */}
      {detallePedido && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-800">Detalle Pedido #{detallePedido.id.slice(0, 6)}</h3>
              <button onClick={() => setdetallePedido(null)}><X className="w-5 h-5 text-stone-700" /></button>
            </div>
            <p className="text-sm text-stone-600">Cliente: {detallePedido.customer_name || "Cliente"}</p>
            <p className="text-sm text-stone-600">Fecha: {new Date(detallePedido.created_at).toLocaleString()}</p>
            <p className="text-sm text-stone-600">Pago: {detallePedido.metodo_pago}</p>
            <p className="text-sm text-stone-600">Estado: {ESTADOS[detallePedido.status as keyof typeof ESTADOS]?.label || detallePedido.status}</p>
            {detallePedido.direccion_entrega && <p className="text-sm text-stone-600">Dirección: {detallePedido.direccion_entrega}</p>}
            <div className="mt-3 border-t pt-3">
              <h4 className="font-semibold text-stone-700">Productos</h4>
              <ul className="space-y-1 mt-1">
                {detallePedido.order_items?.map((item, i) => (
                  <li key={i} className="text-sm text-stone-700 flex justify-between">
                    <span>{item.quantity} × {item.productos?.nombre || "Producto"}</span>
                    <span>${(item.quantity * item.price).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between font-bold mt-2 text-stone-800">
                <span>Total</span>
                <span>${detallePedido.total?.toLocaleString()}</span>
              </div>
            </div>
            <button onClick={() => setdetallePedido(null)} className="w-full border border-stone-300 py-2 rounded-xl mt-4 text-stone-700">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}





