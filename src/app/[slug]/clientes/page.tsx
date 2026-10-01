"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Users, Star, AlertTriangle, Gift, Plus, Search } from "lucide-react";

export default function ClientesDashboard() {
  const params = useParams();
  const slug = params.slug as string;
  const [tenantId, setTenantId] = useState("");
  const [clientes, setClientes] = useState<any[]>([]);
  const [premios, setPremios] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [showNuevo, setShowNuevo] = useState(false);
  const [form, setForm] = useState({ nombre: "", telefono: "" });

  useEffect(() => {
    fetch("/api/admin/tenants").then(r => r.json()).then(d => {
      if (d.data) {
        const t = d.data.find((x: any) => x.id === slug || x.slug === slug ||
          (x.nombre_negocio || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === slug);
        if (t) { setTenantId(t.id); cargar(t.id); }
      }
    }).catch(() => {});
  }, [slug]);

  const cargar = (tid: string) => {
    fetch("/api/clientes?tenant_id=" + tid).then(r => r.json()).then(d => {
      if (d.success) setClientes(d.clientes || []);
    });
    fetch("/api/clientes/premios?tenant_id=" + tid).then(r => r.json()).then(d => {
      if (d.success) setPremios(d.premios || []);
    });
  };

  const crearCliente = async () => {
    if (!form.telefono) { alert("El telefono es obligatorio"); return; }
    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId, nombre: form.nombre, telefono: form.telefono })
    });
    const d = await res.json();
    if (d.success) { setShowNuevo(false); setForm({ nombre: "", telefono: "" }); cargar(tenantId); }
    else alert("Error: " + d.error);
  };

  const hoy = new Date();
  const diasSinVisitar = (c: any) => {
    if (!c.ultima_visita) return 999;
    return Math.floor((hoy.getTime() - new Date(c.ultima_visita).getTime()) / 86400000);
  };
  const vip = clientes.filter(c => (c.total_visitas || 0) >= 5).length;
  const enRiesgo = clientes.filter(c => diasSinVisitar(c) >= 21).length;
  const filtrados = clientes.filter(c =>
    (c.nombre || "").toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.telefono || "").includes(busqueda)
  );

  const inp = "w-full px-3 py-2.5 border border-stone-300 rounded-lg text-sm text-stone-900 placeholder-stone-400";

  return (
    <div className="min-h-screen bg-stone-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-500 rounded-xl"><Users className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-2xl font-extrabold text-stone-900">Clientes y Fidelizacion</h1>
              <p className="text-sm text-stone-600">Sellos, puntos y campanas para hacer volver a tus clientes</p>
            </div>
          </div>
          <button onClick={() => setShowNuevo(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#fdb813] text-stone-900 rounded-xl font-bold">
            <Plus className="w-5 h-5" /> Nuevo cliente
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-stone-200">
            <p className="text-xs font-bold text-stone-500">TOTAL CLIENTES</p>
            <p className="text-3xl font-extrabold text-stone-900">{clientes.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-stone-200">
            <p className="text-xs font-bold text-stone-500 flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" /> VIP</p>
            <p className="text-3xl font-extrabold text-yellow-600">{vip}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-stone-200">
            <p className="text-xs font-bold text-stone-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-500" /> EN RIESGO</p>
            <p className="text-3xl font-extrabold text-red-600">{enRiesgo}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-stone-200">
            <p className="text-xs font-bold text-stone-500 flex items-center gap-1"><Gift className="w-3 h-3 text-pink-500" /> PREMIOS</p>
            <p className="text-3xl font-extrabold text-pink-600">{premios.length}</p>
          </div>
        </div>

        {enRiesgo > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="font-extrabold text-red-700 mb-1">🚨 {enRiesgo} clientes a punto de perderse (21+ dias sin visitar)</p>
            <p className="text-sm text-red-600">Enviales un WhatsApp: "te tenemos sellos esperandote". (Campanas automaticas: proxima fase)</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 border border-stone-200 mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input className={inp + " pl-10"} value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre o telefono..." />
          </div>
          {filtrados.length === 0 ? (
            <p className="text-stone-500 text-sm text-center py-8">Aun no hay clientes registrados. Crea el primero o registra ventas con telefono en el POS.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold text-stone-500 border-b border-stone-200">
                    <th className="py-2 pr-3">NOMBRE</th>
                    <th className="py-2 pr-3">TELEFONO</th>
                    <th className="py-2 pr-3">SELLOS</th>
                    <th className="py-2 pr-3">PUNTOS</th>
                    <th className="py-2">ULTIMA VISITA</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.slice(0, 30).map(c => (
                    <tr key={c.id} className="border-b border-stone-100">
                      <td className="py-2.5 pr-3 font-semibold text-stone-900">{c.nombre || "Sin nombre"}</td>
                      <td className="py-2.5 pr-3 text-stone-700">{c.telefono}</td>
                      <td className="py-2.5 pr-3 font-bold text-amber-600">{c.sellos_acumulados || 0}/10</td>
                      <td className="py-2.5 pr-3 font-bold text-pink-600">{c.puntos_acumulados || 0}</td>
                      <td className="py-2.5 text-stone-600">
                        {c.ultima_visita ? `Hace ${diasSinVisitar(c)} dias` : "Nunca"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200">
          <h2 className="font-extrabold text-stone-900 mb-3 flex items-center gap-2"><Gift className="w-5 h-5 text-pink-500" />Catalogo de premios</h2>
          {premios.length === 0 ? (
            <p className="text-stone-500 text-sm text-center py-6">Sin premios. Proxima fase: crear premios canjeables por sellos/puntos.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {premios.map(p => (
                <div key={p.id} className="border border-stone-200 rounded-xl p-3">
                  <p className="font-bold text-stone-900">{p.nombre}</p>
                  <p className="text-xs text-stone-600">{p.costo_sellos} sellos o {p.costo_puntos} puntos</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showNuevo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <h2 className="text-xl font-extrabold text-stone-900 mb-4">Nuevo cliente</h2>
            <label className="block text-xs font-bold text-stone-700 mb-1">Nombre</label>
            <input className={inp + " mb-3"} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del cliente" />
            <label className="block text-xs font-bold text-stone-700 mb-1">Telefono (WhatsApp) *</label>
            <input className={inp + " mb-4"} value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="300 000 0000" />
            <div className="flex gap-2">
              <button onClick={crearCliente} className="flex-1 py-3 bg-[#fdb813] text-stone-900 rounded-xl font-extrabold">Guardar</button>
              <button onClick={() => setShowNuevo(false)} className="px-4 py-3 border border-stone-300 text-stone-700 rounded-xl font-bold">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}