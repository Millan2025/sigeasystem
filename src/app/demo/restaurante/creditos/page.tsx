"use client";

`nimport { useTenant } from "@/hooks/useTenant";`nimport { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import BackButton from "@/components/BackButton";
import Link from "next/link";
import { ArrowLeft, RefreshCw, CheckCircle, Edit, X } from "lucide-react";

interface Credito {
  id: string;
  responsable: string;
  valor_total: number;
  valor_pagado: number;
  saldo_pendiente: number;
  estado: string;
  fecha_inicio: string;
  observaciones: string;
  telefono?: string;
  direccion?: string;
  tenant_id: string;
}

export default function CreditosPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { tenant: tenantId } = useTenant();
  const negocioSlug = searchParams.get("slug") || "restaurante";
  const categoriaNegocio = "";
  const [creditos, setCreditos] = useState<Credito[]>([]);
  const [loading, setLoading] = useState(true);
  const [abono, setAbono] = useState<{ id: string; monto: number } | null>(null);
  const [editando, setEditando] = useState<Credito | null>(null);
  const [editData, setEditData] = useState({ observaciones: "", telefono: "", direccion: "" });
  const [showEditModal, setShowEditModal] = useState(false);

  const cargarCreditos = () => {
    setLoading(true);
    fetch(`/api/creditos?tenant=${tenantId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCreditos(d.data || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    cargarCreditos();
  }, [tenantId]);

  const registrarAbono = async (id: string) => {
    if (!abono || abono.monto <= 0) {
      alert("Ingrese un monto válido");
      return;
    }
    const res = await fetch("/api/creditos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, monto_abono: abono.monto }),
    });
    const data = await res.json();
    if (data.success) {
      setAbono(null);
      cargarCreditos();
    } else {
      alert(data.error);
    }
  };

  const abrirEdicion = (credito: Credito) => {
    setEditando(credito);
    setEditData({
      observaciones: credito.observaciones || "",
      telefono: credito.telefono || "",
      direccion: credito.direccion || "",
    });
    setShowEditModal(true);
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    try {
      const res = await fetch("/api/creditos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editando.id,
          observaciones: editData.observaciones,
          telefono: editData.telefono,
          direccion: editData.direccion,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        setEditando(null);
        cargarCreditos();
        alert("✅ Datos actualizados");
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) {
      alert("Error de conexión");
    }
  };

  const totalPendiente = creditos
    .filter((c) => c.estado === "pendiente")
    .reduce((sum, c) => sum + c.saldo_pendiente, 0);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <BackButton />
        <h1 className="text-xl font-bold text-stone-800">Créditos - {negocioSlug || "negocioSlug"}</h1>
        <div className="flex-1"></div>
        <button onClick={cargarCreditos} className="p-2 hover:bg-stone-100 rounded-xl">
          <RefreshCw className="w-5 h-5 text-stone-700" />
        </button>
      </header>

      <div className="p-4 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 mb-6">
          <p className="text-sm text-stone-600">Total pendiente</p>
          <p className="text-2xl font-bold text-red-600">${totalPendiente.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
          <h3 className="font-semibold text-stone-800 mb-3">Listado de créditos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left p-2 text-stone-700">Cliente</th>
                  <th className="text-left p-2 text-stone-700">Teléfono</th>
                  <th className="text-left p-2 text-stone-700">Dirección</th>
                  <th className="text-left p-2 text-stone-700">Total</th>
                  <th className="text-left p-2 text-stone-700">Pagado</th>
                  <th className="text-left p-2 text-stone-700">Saldo</th>
                  <th className="text-left p-2 text-stone-700">Estado</th>
                  <th className="text-left p-2 text-stone-700">Fecha</th>
                  <th className="text-left p-2 text-stone-700">Observaciones</th>
                  <th className="text-left p-2 text-stone-700">Acción</th>
                </tr>
              </thead>
              <tbody>
                {creditos.map((c) => (
                  <tr key={c.id} className="border-b border-stone-100">
                    <td className="p-2 text-stone-800">{c.responsable}</td>
                    <td className="p-2 text-stone-600">{c.telefono || "-"}</td>
                    <td className="p-2 text-stone-600">{c.direccion || "-"}</td>
                    <td className="p-2 text-stone-800">${c.valor_total.toLocaleString()}</td>
                    <td className="p-2 text-stone-800">${c.valor_pagado.toLocaleString()}</td>
                    <td className="p-2 font-medium text-stone-800">${c.saldo_pendiente.toLocaleString()}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.estado === 'pagado' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="p-2 text-stone-600">{c.fecha_inicio}</td>
                    <td className="p-2 text-stone-600">{c.observaciones || "-"}</td>
                    <td className="p-2 flex gap-2">
                      <button
                        onClick={() => abrirEdicion(c)}
                        className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        title="Editar datos"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {c.estado === "pendiente" && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            placeholder="$"
                            className="w-12 border border-stone-300 rounded p-0.5 text-xs text-stone-800"
                            onChange={(e) => setAbono({ id: c.id, monto: parseFloat(e.target.value) || 0 })}
                          />
                          <button
                            onClick={() => registrarAbono(c.id)}
                            className="p-0.5 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {creditos.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-4 text-center text-stone-500">
                      No hay créditos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Editar */}
      {showEditModal && editando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-800">Editar datos de {editando.responsable}</h3>
              <button onClick={() => setShowEditModal(false)}><X className="w-5 h-5 text-stone-700" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700">Teléfono</label>
                <input
                  type="text"
                  value={editData.telefono}
                  onChange={(e) => setEditData({ ...editData, telefono: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Dirección</label>
                <input
                  type="text"
                  value={editData.direccion}
                  onChange={(e) => setEditData({ ...editData, direccion: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Observaciones</label>
                <textarea
                  value={editData.observaciones}
                  onChange={(e) => setEditData({ ...editData, observaciones: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  rows={3}
                  placeholder="Observaciones adicionales"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2 border border-stone-300 rounded-xl text-stone-700"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicion}
                className="flex-1 py-2 bg-emerald-500 text-white rounded-xl"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




