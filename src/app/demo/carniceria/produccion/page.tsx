"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  X,
} from "lucide-react";

// ============================================
// CONFIGURACIÓN
// ============================================
const NEGOCIOS = {
  panaderia: { titulo: "Panadería Doña Rosa", categoria: "Panaderia", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  restaurante: { titulo: "Restaurante Caribe", categoria: "Restaurante", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  carniceria: { titulo: "Carnicería El Buen Sabor", categoria: "Carniceria", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  salsamentaria: { titulo: "Salsamentaria La Especial", categoria: "Salsamentaria", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  ferreteria: { titulo: "Ferretería El Tornillo", categoria: "Ferreteria", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  tienda: { titulo: "Tienda La Esquina De Calidad", categoria: "Tienda", tenantId: "58d06407-6d1c-4beb-acee-8965001fbbee" },
};

export default function ProduccionPage() {
  const pathname = usePathname();
  const pathParts = pathname?.split("/") || [];
  const negocioSlug = pathParts[2] || "restaurante";
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const tenantId = negocio?.tenantId || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";

  const [jornada, setJornada] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [form, setForm] = useState<{ producto_id: string; cantidad: number }[]>([]);
  const [resumen, setResumen] = useState({ planificado: 0, vendido: 0, restante: 0 });

  const esRestaurante = negocioSlug === "restaurante"; // Simplificado; en producción usar business_config.tipo_negocio

  const cargarDatos = async () => {
    setLoading(true);
    // Obtener productos (solo los que son platos o todos)
    const prodRes = await fetch(`/api/products?tenant=${tenantId}`);
    const prodData = await prodRes.json();
    if (prodData.success) setProductos(prodData.data || []);

    // Obtener jornada del día
    const jornadaRes = await fetch(`/api/produccion-jornada?tenant=${tenantId}&fecha=${fecha}`);
    const jornadaData = await jornadaRes.json();
    if (jornadaData.success) {
      setJornada(jornadaData.data || []);
      const planificado = jornadaData.data.reduce((s: number, j: any) => s + j.cantidad_planificada, 0);
      const vendido = jornadaData.data.reduce((s: number, j: any) => s + j.cantidad_vendida, 0);
      setResumen({ planificado, vendido, restante: planificado - vendido });
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantId, fecha]);

  const guardarJornada = async () => {
    if (form.length === 0) return;
    const body = {
      tenant_id: tenantId,
      fecha,
      items: form.map((f) => ({ producto_id: f.producto_id, cantidad: f.cantidad })),
    };
    const res = await fetch("/api/produccion-jornada", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      setShowModal(false);
      setForm([]);
      cargarDatos();
    } else {
      alert(data.error || "Error al guardar");
    }
  };

  const agregarProductoForm = () => {
    setForm([...form, { producto_id: "", cantidad: 1 }]);
  };

  const actualizarForm = (idx: number, campo: string, valor: any) => {
    const nuevo = [...form];
    nuevo[idx] = { ...nuevo[idx], [campo]: valor };
    setForm(nuevo);
  };

  const eliminarForm = (idx: number) => {
    setForm(form.filter((_, i) => i !== idx));
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href={`/demo/${negocioSlug}`} className="p-2 hover:bg-stone-100 rounded-xl">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </Link>
        <h1 className="text-xl font-bold text-stone-800 flex-1">
          Producción {esRestaurante ? "- Jornada" : ""} · {negocio?.titulo}
        </h1>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border border-stone-300 rounded-xl px-3 py-1 text-sm"
          />
          <button onClick={cargarDatos} className="p-2 hover:bg-stone-100 rounded-xl">
            <RefreshCw className="w-5 h-5 text-stone-700" />
          </button>
          {esRestaurante && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Planificar Jornada
            </button>
          )}
        </div>
      </header>

      <div className="p-4 max-w-7xl mx-auto">
        {esRestaurante && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
              <p className="text-sm text-stone-500">Planificado</p>
              <p className="text-2xl font-bold text-blue-600">{resumen.planificado}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
              <p className="text-sm text-stone-500">Vendido</p>
              <p className="text-2xl font-bold text-emerald-600">{resumen.vendido}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
              <p className="text-sm text-stone-500">Restante</p>
              <p className={`text-2xl font-bold ${resumen.restante > 0 ? "text-amber-600" : "text-stone-400"}`}>
                {resumen.restante}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
          <h3 className="font-semibold text-stone-800 mb-3">
            {esRestaurante ? "Detalle de Jornada" : "Producción (vista general)"}
          </h3>
          {loading ? (
            <div className="text-center py-8 text-stone-500">Cargando...</div>
          ) : jornada.length === 0 ? (
            <div className="text-center py-8 text-stone-500">Sin producción para esta fecha</div>
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
                    const color = restante === 0 ? "text-red-600" : restante < 5 ? "text-amber-600" : "text-emerald-600";
                    return (
                      <tr key={j.id} className="border-b border-stone-100">
                        <td className="p-2 text-stone-800">{j.productos?.nombre || "Producto"}</td>
                        <td className="p-2 text-stone-800">{j.cantidad_planificada}</td>
                        <td className="p-2 text-stone-800">{j.cantidad_vendida}</td>
                        <td className={`p-2 font-medium ${color}`}>{restante}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${restante === 0 ? "bg-red-100 text-red-700" : restante < 5 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
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
      </div>

      {/* Modal Planificar Jornada */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-800">Planificar Jornada</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-stone-700" /></button>
            </div>
            <div className="space-y-3">
              {form.map((f, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    value={f.producto_id}
                    onChange={(e) => actualizarForm(idx, "producto_id", e.target.value)}
                    className="flex-1 border border-stone-300 rounded-xl p-2 text-sm"
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
                    onChange={(e) => actualizarForm(idx, "cantidad", parseInt(e.target.value) || 1)}
                    className="w-16 border border-stone-300 rounded-xl p-2 text-sm"
                  />
                  <button onClick={() => eliminarForm(idx)} className="text-red-500">×</button>
                </div>
              ))}
              <button onClick={agregarProductoForm} className="text-emerald-600 text-sm font-medium">+ Agregar plato</button>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-stone-300 rounded-xl">Cancelar</button>
              <button onClick={guardarJornada} className="flex-1 py-2 bg-emerald-500 text-white rounded-xl">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
