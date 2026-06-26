"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Plus } from "lucide-react";

const NEGOCIOS = {
  panaderia: { titulo: "Panadería Doña Rosa", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  restaurante: { titulo: "Restaurante Caribe", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  carniceria: { titulo: "Carnicería El Buen Sabor", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  salsamentaria: { titulo: "Salsamentaria La Especial", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  ferreteria: { titulo: "Ferretería El Tornillo", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  tienda: { titulo: "Tienda Surtimax", tenantId: "58d06407-6d1c-4beb-acee-8965001fbbee" },
};

export default function FinanzasPage() {
  const pathname = usePathname();
  const [transacciones, setTransacciones] = useState([]);
  const [resumen, setResumen] = useState({ ingresos: 0, egresos: 0, saldo: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ tipo: 'ingreso', monto: 0, categoria: '', descripcion: '', fecha: '' });

  const pathParts = pathname?.split('/') || [];
  const negocioSlug = pathParts[2] || 'restaurante';
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const tenantId = negocio?.tenantId || '7e045520-5e36-4e3f-a39f-10ea7d6dce76';

  const cargarDatos = () => {
    setLoading(true);
    fetch(`/api/finanzas?tenant=${tenantId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setTransacciones(d.data || []);
          setResumen(d.resumen || { ingresos: 0, egresos: 0, saldo: 0 });
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantId]);

  const guardarTransaccion = async () => {
    const res = await fetch('/api/finanzas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tenant_id: tenantId })
    });
    const data = await res.json();
    if (data.success) {
      setShowModal(false);
      setForm({ tipo: 'ingreso', monto: 0, categoria: '', descripcion: '', fecha: '' });
      cargarDatos();
    } else {
      alert(data.error || 'Error al guardar');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href={`/demo/${negocioSlug}`} className="p-2 hover:bg-stone-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Finanzas - {negocio?.titulo || 'Negocio'}</h1>
        <div className="flex-1"></div>
        <button onClick={cargarDatos} className="p-2 hover:bg-stone-100 rounded-xl">
          <RefreshCw className="w-5 h-5" />
        </button>
        <button onClick={() => setShowModal(true)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1">
          <Plus className="w-4 h-4" /> Registrar
        </button>
      </header>

      <div className="p-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-500">Ingresos</p>
            <p className="text-2xl font-bold text-emerald-600">${resumen.ingresos.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-500">Egresos</p>
            <p className="text-2xl font-bold text-red-600">${resumen.egresos.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-500">Saldo</p>
            <p className={`text-2xl font-bold ${resumen.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ${resumen.saldo.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
          <h3 className="font-semibold mb-3">Movimientos recientes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Categoría</th>
                  <th className="text-left p-2">Descripción</th>
                  <th className="text-left p-2">Monto</th>
                </tr>
              </thead>
              <tbody>
                {transacciones.map((t: any) => (
                  <tr key={t.id} className="border-b border-stone-100">
                    <td className="p-2">{new Date(t.fecha).toLocaleDateString()}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.tipo === 'ingreso' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {t.tipo}
                      </span>
                    </td>
                    <td className="p-2">{t.categoria}</td>
                    <td className="p-2 text-stone-500">{t.descripcion || '-'}</td>
                    <td className="p-2 font-medium">${t.monto.toLocaleString()}</td>
                  </tr>
                ))}
                {transacciones.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-stone-400">No hay movimientos</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Registrar Transacción</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700">Tipo</label>
                <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="w-full border border-stone-300 rounded-xl p-2">
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Monto</label>
                <input type="number" step="0.01" value={form.monto} onChange={e => setForm({...form, monto: parseFloat(e.target.value) || 0})} className="w-full border border-stone-300 rounded-xl p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Categoría</label>
                <input type="text" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} className="w-full border border-stone-300 rounded-xl p-2" placeholder="Ej. Ventas, Compras, Servicios" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Descripción</label>
                <input type="text" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} className="w-full border border-stone-300 rounded-xl p-2" placeholder="Opcional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Fecha</label>
                <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} className="w-full border border-stone-300 rounded-xl p-2" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-stone-300 rounded-xl">Cancelar</button>
              <button onClick={guardarTransaccion} className="flex-1 py-2 bg-emerald-500 text-white rounded-xl">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
