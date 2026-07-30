"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import BackButton from "@/components/BackButton";
import { RefreshCw, Eye, ShoppingBag, X, CheckCircle, Trash2 } from "lucide-react";

interface PedidoItem {
  producto_id: string;
  cantidad: number;
  precio: number;
  nombre: string;
}

interface Pedido {
  id: string;
  cliente: string;
  total: number;
  metodo_pago: string;
  estado: string;
  items: PedidoItem[];
  created_at: string;
  direccion?: string;
  telefono?: string;
  observaciones?: string;
}

const ESTADOS = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
  pagado: { label: "Pagado", color: "bg-green-100 text-green-700" },
  confirmado: { label: "Confirmado", color: "bg-blue-100 text-blue-700" },
  preparando: { label: "Preparando", color: "bg-purple-100 text-purple-700" },
  en_camino: { label: "En camino", color: "bg-cyan-100 text-cyan-700" },
  entregado: { label: "Entregado", color: "bg-emerald-100 text-emerald-700" },
};

const LISTA_ESTADOS = ["pendiente", "pagado", "confirmado", "preparando", "en_camino", "entregado"];

export default function PedidosPage() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenant") || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [detallePedido, setDetallePedido] = useState<Pedido | null>(null);
  const [mensaje, setMensaje] = useState("");

  const cargarPedidos = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`/api/pedidos?tenant=${tenantId}`);
      const data = await res.json();
      if (data.success) setPedidos(data.data || []);
      else setPedidos([]);
    } catch (e) {
      setPedidos([]);
    }
    if (showLoading) setLoading(false);
  };

  useEffect(() => {
    cargarPedidos(true);
    const interval = setInterval(() => cargarPedidos(false), 10000);
    return () => clearInterval(interval);
  }, [tenantId]);

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido) return;
    const idxActual = LISTA_ESTADOS.indexOf(pedido.estado);
    const idxNuevo = LISTA_ESTADOS.indexOf(nuevoEstado);
    if (idxNuevo <= idxActual) return;

    try {
      const res = await fetch("/api/pedidos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, estado: nuevoEstado })
      });
      const data = await res.json();
      if (data.success) {
        setMensaje(`✅ Estado actualizado a ${ESTADOS[nuevoEstado as keyof typeof ESTADOS]?.label || nuevoEstado}`);
        setTimeout(() => setMensaje(""), 5000);
        cargarPedidos(true);
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) {
      alert("Error de conexión");
    }
  };

  const confirmarPedido = async (id: string) => {
    if (!confirm("¿Confirmar este pedido? Se descontará stock y se registrará en finanzas.")) return;
    try {
      const res = await fetch(`/api/pedidos/${id}/confirmar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metodo_pago: "Confirmado" })
      });
      const data = await res.json();
      if (data.success) {
        setMensaje("✅ Pedido confirmado correctamente.");
        setTimeout(() => setMensaje(""), 5000);
        cargarPedidos(true);
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) {
      alert("Error de conexión");
    }
  };
  const cancelarPedido = async (id: string) => {
    if (!confirm('¿Estás seguro de cancelar este pedido? Se revertirá inventario y finanzas.')) return;
    
    try {
      const res = await fetch(`/api/pedidos/${id}/cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motivo: 'Cancelado por usuario',
          usuario_id: 'sistema'
        })
      });
      const data = await res.json();
      if (data.success) {
        setMensaje('✅ Pedido cancelado exitosamente');
        setTimeout(() => setMensaje(''), 5000);
        cargarPedidos(true);
      } else {
        alert('❌ Error: ' + (data.error || 'Error al cancelar'));
      }
    } catch (error) {
      console.error(error);
      alert('❌ Error al cancelar pedido');
    }
  };

  const getEstadoInfo = (estado: string) => {
    return ESTADOS[estado as keyof typeof ESTADOS] || ESTADOS.pendiente;
  };

  const pedidosFiltrados = pedidos.filter(p => {
    if (filtroEstado === "todos") return true;
    return p.estado === filtroEstado;
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <BackButton />
        <h1 className="text-xl font-bold text-stone-800 flex-1">Pedidos</h1>
        <button onClick={() => cargarPedidos(true)} className="p-2 hover:bg-stone-100 rounded-xl">
          <RefreshCw className="w-5 h-5 text-stone-700" />
        </button>
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
            const count = pedidos.filter(p => p.estado === estado).length;
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
              const estadoInfo = getEstadoInfo(pedido.estado);
              return (
                <div key={pedido.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:shadow-md transition flex flex-col">
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
                  <p className="text-sm text-stone-500">📦 {pedido.items?.length || 0} productos</p>
                  <p className="text-sm text-stone-500">💰 ${pedido.total?.toLocaleString()}</p>
                  <p className="text-xs text-stone-400">Pago: {pedido.metodo_pago}</p>
                  {pedido.direccion && <p className="text-xs text-stone-400">📍 {pedido.direccion}</p>}
                  {pedido.observaciones && <p className="text-xs text-stone-400">📝 {pedido.observaciones}</p>}

                  <div className="mt-2 text-xs text-stone-600 border-t pt-2">
                    {pedido.items?.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{item.cantidad} × {item.nombre}</span>
                        <span>${(item.cantidad * item.precio).toLocaleString()}</span>
                      </div>
                    ))}
                    {pedido.items?.length > 2 && (
                      <div className="text-stone-400 text-xs mt-1">+ {pedido.items.length - 2} más</div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setDetallePedido(pedido)}
                      className="text-xs bg-stone-200 text-stone-700 px-2 py-1 rounded-full hover:bg-stone-300"
                    >
                      <Eye className="w-3 h-3 inline mr-1" /> Detalle
                    </button>
			                    {(pedido.estado === 'pendiente' || pedido.estado === 'pagado') && (
                      <button
                        onClick={() => cancelarPedido(pedido.id)}
                        className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full hover:bg-red-200"
                      >
                        <X className="w-3 h-3 inline mr-1" /> Cancelar
                      </button>
                    )}

                    {/* Botón Marcar como Pagado (solo si está pendiente) */}
                    {pedido.estado === 'pendiente' && (
                      <button
                        onClick={() => cambiarEstado(pedido.id, 'pagado')}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200"
                      >
                        <CheckCircle className="w-3 h-3 inline mr-1" /> Marcar como Pagado
                      </button>
                    )}

                    {/* Botón Confirmar (solo si está pagado) */}
                    {pedido.estado === 'pagado' && (
                      <button
                        onClick={() => confirmarPedido(pedido.id)}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200"
                      >
                        <CheckCircle className="w-3 h-3 inline mr-1" /> Confirmar
                      </button>
                    )}

                    {/* Botones de estados futuros (excepto pagado y confirmado) */}
                    {LISTA_ESTADOS.map((estado) => {
                      const idxActual = LISTA_ESTADOS.indexOf(pedido.estado);
                      const idxNuevo = LISTA_ESTADOS.indexOf(estado);
                      if (idxNuevo <= idxActual) return null;
                      if (estado === 'pagado') return null;
                      if (estado === 'confirmado') return null; // Confirmado se maneja con el botón especial
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Detalle */}
      {detallePedido && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-800">Detalle Pedido #{detallePedido.id.slice(0, 6)}</h3>
              <button onClick={() => setDetallePedido(null)}><X className="w-5 h-5 text-stone-700" /></button>
            </div>
            <p className="text-sm text-stone-600">Cliente: {detallePedido.cliente || "Cliente"}</p>
            <p className="text-sm text-stone-600">Fecha: {new Date(detallePedido.created_at).toLocaleString()}</p>
            <p className="text-sm text-stone-600">Pago: {detallePedido.metodo_pago}</p>
            <p className="text-sm text-stone-600">Estado: {ESTADOS[detallePedido.estado as keyof typeof ESTADOS]?.label || detallePedido.estado}</p>
            {detallePedido.direccion && <p className="text-sm text-stone-600">Dirección: {detallePedido.direccion}</p>}
            {detallePedido.telefono && <p className="text-sm text-stone-600">Teléfono: {detallePedido.telefono}</p>}
            {detallePedido.observaciones && <p className="text-sm text-stone-600">Observaciones: {detallePedido.observaciones}</p>}

            <div className="mt-3 border-t pt-3">
              <h4 className="font-semibold text-stone-700">Productos</h4>
              <div className="space-y-1 mt-1">
                {detallePedido.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm border-b border-stone-100 py-1 items-center">
                    <span>{item.cantidad} × {item.nombre}</span>
                    <span className="text-xs">Unit: ${item.precio?.toLocaleString()}</span>
                    <span className="font-bold">Subtotal: ${(item.cantidad * item.precio).toLocaleString()}</span>
                  </div>
                ))}
                {(!detallePedido.items || detallePedido.items.length === 0) && (
                  <p className="text-sm text-stone-500">Sin productos</p>
                )}
              </div>
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











