"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, CheckCircle } from "lucide-react";

const NEGOCIOS = {
  panaderia: { titulo: "Panadería Doña Rosa", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  restaurante: { titulo: "Restaurante Caribe", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  carniceria: { titulo: "Carnicería El Buen Sabor", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  salsamentaria: { titulo: "Salsamentaria La Especial", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  ferreteria: { titulo: "Ferretería El Tornillo", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  tienda: { titulo: "Tienda Surtimax", tenantId: "58d06407-6d1c-4beb-acee-8965001fbbee" },
};

export default function CreditosPage() {
  const pathname = usePathname();
  const [creditos, setCreditos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abono, setAbono] = useState<{ id: string, monto: number } | null>(null);

  const pathParts = pathname?.split('/') || [];
  const negocioSlug = pathParts[2] || 'restaurante';
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const tenantId = negocio?.tenantId || '7e045520-5e36-4e3f-a39f-10ea7d6dce76';

  const cargarCreditos = () => {
    setLoading(true);
    fetch(`/api/creditos?tenant=${tenantId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setCreditos(d.data || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    cargarCreditos();
  }, [tenantId]);

  const registrarAbono = async (id: string) => {
    if (!abono || abono.monto <= 0) {
      alert('Ingrese un monto válido');
      return;
    }
    const res = await fetch('/api/creditos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, monto_abono: abono.monto })
    });
    const data = await res.json();
    if (data.success) {
      setAbono(null);
      cargarCreditos();
    } else {
      alert(data.error);
    }
  };

  const totalPendiente = creditos.filter(c => c.estado === 'pendiente').reduce((sum, c) => sum + c.saldo, 0);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href={`/demo/${negocioSlug}`} className="p-2 hover:bg-stone-100 rounded-xl">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </Link>
        <h1 className="text-xl font-bold text-stone-800">Créditos - {negocio?.titulo || 'Negocio'}</h1>
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
                  <th className="text-left p-2 text-stone-700">Monto</th>
                  <th className="text-left p-2 text-stone-700">Saldo</th>
                  <th className="text-left p-2 text-stone-700">Estado</th>
                  <th className="text-left p-2 text-stone-700">Fecha</th>
                  <th className="text-left p-2 text-stone-700">Acción</th>
                </tr>
              </thead>
              <tbody>
                {creditos.map((c: any) => (
                  <tr key={c.id} className="border-b border-stone-100">
                    <td className="p-2 text-stone-800">{c.cliente}</td>
                    <td className="p-2 text-stone-700">{c.telefono || '-'}</td>
                    <td className="p-2 text-stone-800">${c.monto.toLocaleString()}</td>
                    <td className="p-2 font-medium text-stone-800">${c.saldo.toLocaleString()}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.estado === 'pagado' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="p-2 text-stone-600">{new Date(c.fecha).toLocaleDateString()}</td>
                    <td className="p-2">
                      {c.estado === 'pendiente' && (
                        <div className="flex items-center gap-2">
                          <input type="number" placeholder="Abono" className="w-20 border border-stone-300 rounded p-1 text-sm text-stone-800" onChange={e => setAbono({ id: c.id, monto: parseFloat(e.target.value) || 0 })} />
                          <button onClick={() => registrarAbono(c.id)} className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600"><CheckCircle className="w-4 h-4" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {creditos.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-stone-500">No hay créditos</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
