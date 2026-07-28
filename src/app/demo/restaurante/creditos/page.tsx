"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation"; import BackButton from "@/components/BackButton";
import Link from "next/link";
import { ArrowLeft, RefreshCw, CheckCircle } from "lucide-react";

interface Credito {
  id: string;
  responsable: string;
  valor_total: number;
  valor_pagado: number;
  saldo_pendiente: number;
  estado: string;
  fecha_inicio: string;
  observaciones: string;
  tenant_id: string;
}

export default function CreditosPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenant") || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";
  const negocioSlug = searchParams.get("slug") || "restaurante";
  const categoriaNegocio = "";
  const [creditos, setCreditos] = useState<Credito[]>([]);
  const [loading, setLoading] = useState(true);
  const [abono, setAbono] = useState<{ id: string; monto: number } | null>(null);

  

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
                {transacciones.map((t: any) => (
                  <tr key={t.id} className="border-b border-stone-100">
                    <td className="p-2 text-stone-600 text-center">{t.item || '-'}</td>
                    <td className="p-2 text-stone-800">{formatDate(t.fecha)}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.tipo === 'ingreso' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {t.tipo}
                      </span>
                    </td>
                    <td className="p-2 text-stone-600">{t.categorias_contables?.nombre || '-'}</td>
                    <td className="p-2 text-stone-600">{t.descripcion || '-'}</td>
                    <td className="p-2 text-stone-600">{t.metodo_pago || '-'}</td>
                    <td className="p-2 text-stone-800 font-medium">{t.cantidad || 1}</td>
                    <td className="p-2 text-stone-800 font-medium">${(t.precio_unitario || 0).toLocaleString()}</td>
                    <td className="p-2 text-stone-800 font-medium">${(t.subtotal || 0).toLocaleString()}</td>
                    <td className="p-2 text-stone-600">${(t.iva || 0).toLocaleString()}</td>
                    <td className="p-2 text-stone-600">${(t.retencion || 0).toLocaleString()}</td>
                    <td className="p-2 text-stone-600">${(t.ica || 0).toLocaleString()}</td>
                    <td className="p-2 text-stone-800 font-bold">${(t.total || t.total_con_impuestos || 0).toLocaleString()}</td>
                    <td className="p-2 flex gap-2">
                      <button onClick={() => editarTransaccion(t)} className="p-1 hover:bg-stone-100 rounded"><Edit className="w-4 h-4 text-stone-600" /></button>
                      <button onClick={() => eliminarTransaccion(t.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </td>
                  </tr>
                ))}
                {transacciones.length === 0 && <tr><td colSpan={14} className="p-4 text-center text-stone-500">No hay movimientos</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}










