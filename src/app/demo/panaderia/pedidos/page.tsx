"use client";
import { NEGOCIOS } from "@/config/negocios";
import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  ShoppingBag,
  X,
} from "lucide-react";

interface PedidoItem {
  producto_id: string;
  cantidad: number;
  precio: number;
  nombre: string;
}

interface Pedido {
  id: string;
  cliente: string;
  direccion: string;
  telefono: string;
  metodo_pago: string;
  total: number;
  items: PedidoItem[];
  estado: string;
  observaciones?: string;
  created_at: string;
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
  const negocioSlug = pathParts[1] || "restaurante";
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const searchParams = useSearchParams();
  const tenantFromUrl = searchParams.get("tenant");
  const tenantId = tenantFromUrl || negocio?.tenantId || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [detallePedido, setDetallePedido] = useState<Pedido | null>(null);
  const [mensaje, setMensaje] = useState("");

  const cargarPedidos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pedidos?tenant=${tenantId}`);
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
    cargarPedidos();
  }, [tenantId]);

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido) return;

    const idxActual = LISTA_ESTADOS.indexOf(pedido.estado);
    const idxNuevo = LISTA_ESTADOS.indexOf(nuevoEstado);
    if (idxNuevo <= idxActual) return;

    try {
      const resUpdate = await fetch("/api/pedidos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, estado: nuevoEstado }),
      });
      const dataUpdate = await resUpdate.json();
      if (!dataUpdate.success) {
        alert("Error al actualizar estado: " + dataUpdate.error);
        return;
      }

      setMensaje(`✅ Pedido #${id.slice(0, 6)} actualizado a ${ESTADOS[nuevoEstado as keyof typeof ESTADOS]?.label}`);
      setTimeout(() => setMensaje(""), 5000);
      cargarPedidos();
    } catch (error) {
      alert("Error de conexión");
    }
  };

  const eliminarPedido = async (id: string) => {
    if (!confirm("¿Eliminar este pedido?")) return;
    alert("Eliminación no implementada en API.");
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
              const estadoInfo = ESTADOS[pedido.estado as keyof typeof ESTADOS] || ESTADOS.pendiente;
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
                  <p className="text-sm text-stone-700 font-medium">{pedido.cliente || "Cliente"}</p>
                  {pedido.telefono && <p className="text-sm text-stone-500">📞 {pedido.telefono}</p>}
                  {pedido.direccion && <p className="text-sm text-stone-500">📍 {pedido.direccion}</p>}
                  <p className="text-sm text-stone-500">💳 {pedido.metodo_pago}</p>
                  <p className="text-sm text-stone-500">📦 {pedido.items?.length || 0} productos</p>
                  <p className="text-sm text-stone-500 font-semibold">💰 ${pedido.total?.toLocaleString()}</p>

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
                          onClick={() => cambiarEstado(pedido.id, estado)}
                          className={`text-xs px-2 py-1 rounded-full ${info.color} hover:opacity-80 transition`}
                        >
                          {info.label}
                        </button>
                      );
                    })}
                    {pedido.estado === "pendiente" && (
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

      {detallePedido && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-800">Detalle Pedido #{detallePedido.id.slice(0, 6)}</h3>
              <button onClick={() => setDetallePedido(null)}><X className="w-5 h-5 text-stone-700" /></button>
            </div>
            <p className="text-sm text-stone-600">Cliente: {detallePedido.cliente || "Cliente"}</p>
            <p className="text-sm text-stone-600">Teléfono: {detallePedido.telefono || "N/A"}</p>
            <p className="text-sm text-stone-600">Dirección: {detallePedido.direccion || "N/A"}</p>
            <p className="text-sm text-stone-600">Fecha: {new Date(detallePedido.created_at).toLocaleString()}</p>
            <p className="text-sm text-stone-600">Pago: {detallePedido.metodo_pago}</p>
            <p className="text-sm text-stone-600">Estado: {ESTADOS[detallePedido.estado as keyof typeof ESTADOS]?.label || detallePedido.estado}</p>
            <div className="mt-3 border-t pt-3">
              <h4 className="font-semibold text-stone-700">Productos</h4>
              <ul className="space-y-1 mt-1">
                {detallePedido.items?.map((item, i) => (
                  <li key={i} className="text-sm text-stone-700 flex justify-between">
                    <span>{item.cantidad} x {item.nombre || "Producto"}</span>
                    <span>${(item.cantidad * item.precio).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between font-bold mt-2 text-stone-800">
                <span>Total</span>
                <span>${detallePedido.total?.toLocaleString()}</span>
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
