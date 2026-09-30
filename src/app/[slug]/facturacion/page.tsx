"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FileText, Save, Building2, Plug, Receipt } from "lucide-react";

export default function FacturacionConfig() {
  const params = useParams();
  const slug = params.slug as string;
  const [tenantId, setTenantId] = useState("");
  const [facturas, setFacturas] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    nit: "", razon_social: "", direccion_fiscal: "", telefono_fiscal: "", correo_fiscal: "",
    regimen: "simple", resolucion_numero: "", resolucion_fecha: "", resolucion_vencimiento: "",
    prefijo_factura: "FV", mensaje_pie: "Gracias por su compra",
    integracion_activa: false, integracion_proveedor: "ninguno", integracion_api_key: "", integracion_api_secret: ""
  });

  useEffect(() => {
    fetch("/api/admin/tenants").then(r => r.json()).then(d => {
      if (d.data) {
        const t = d.data.find((x: any) => x.id === slug || x.slug === slug);
        if (t) { setTenantId(t.id); cargar(t.id); }
      }
    }).catch(() => {});
  }, [slug]);

  const cargar = (tid: string) => {
    fetch("/api/facturacion/config?tenant_id=" + tid).then(r => r.json()).then(d => {
      if (d.success && d.config) setForm({ ...form, ...d.config });
    });
    fetch("/api/facturacion/emitir?tenant_id=" + tid).then(r => r.json()).then(d => {
      if (d.success) setFacturas(d.facturas || []);
    });
  };

  const guardar = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/facturacion/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, ...form })
      });
      const d = await res.json();
      setMsg(d.success ? "Configuracion guardada" : "Error: " + d.error);
      setTimeout(() => setMsg(""), 3000);
    } finally { setSaving(false); }
  };

  const inp = "w-full px-3 py-2.5 border border-stone-300 rounded-lg text-sm text-stone-800 placeholder-stone-400";
  const lbl = "block text-xs font-semibold text-stone-500 mb-1";

  return (
    <div className="min-h-screen bg-stone-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#fdb813] rounded-xl"><Receipt className="w-6 h-6 text-stone-900" /></div>
          <div>
            <h1 className="text-2xl font-extrabold text-stone-900">Facturacion y Recibos</h1>
            <p className="text-sm text-stone-600">Datos fiscales, resolucion DIAN e integracion contable</p>
          </div>
        </div>

        {msg && <div className="mb-4 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-semibold">{msg}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-stone-200">
            <h2 className="font-bold text-stone-900 mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-[#fdb813]" />Datos del negocio</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className={lbl}>Razon social *</label><input className={inp} value={form.razon_social} onChange={e => setForm({ ...form, razon_social: e.target.value })} placeholder="Nombre legal" /></div>
              <div><label className={lbl}>NIT</label><input className={inp} value={form.nit} onChange={e => setForm({ ...form, nit: e.target.value })} placeholder="901.234.567-8" /></div>
              <div className="md:col-span-2"><label className={lbl}>Direccion fiscal</label><input className={inp} value={form.direccion_fiscal} onChange={e => setForm({ ...form, direccion_fiscal: e.target.value })} placeholder="Calle 15 # 7-20" /></div>
              <div><label className={lbl}>Telefono</label><input className={inp} value={form.telefono_fiscal} onChange={e => setForm({ ...form, telefono_fiscal: e.target.value })} placeholder="313 000 0000" /></div>
              <div><label className={lbl}>Correo fiscal</label><input className={inp} value={form.correo_fiscal} onChange={e => setForm({ ...form, correo_fiscal: e.target.value })} placeholder="correo@negocio.com" /></div>
              <div><label className={lbl}>Regimen</label>
                <select className={inp} value={form.regimen} onChange={e => setForm({ ...form, regimen: e.target.value })}>
                  <option value="simple">Simple / No responsable IVA</option>
                  <option value="comun">Responsable IVA</option>
                  <option value="especial">Especial</option>
                </select>
              </div>
              <div><label className={lbl}>Prefijo recibo</label><input className={inp} value={form.prefijo_factura} onChange={e => setForm({ ...form, prefijo_factura: e.target.value })} placeholder="FV" /></div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-stone-200">
              <h2 className="font-bold text-stone-900 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-[#fdb813]" />Resolucion de numeracion</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2"><label className={lbl}>No. resolucion</label><input className={inp} value={form.resolucion_numero} onChange={e => setForm({ ...form, resolucion_numero: e.target.value })} placeholder="18762000123456" /></div>
                <div><label className={lbl}>Fecha resolucion</label><input type="date" className={inp} value={form.resolucion_fecha ? form.resolucion_fecha.substring(0, 10) : ""} onChange={e => setForm({ ...form, resolucion_fecha: e.target.value })} /></div>
                <div><label className={lbl}>Vence</label><input type="date" className={inp} value={form.resolucion_vencimiento ? form.resolucion_vencimiento.substring(0, 10) : ""} onChange={e => setForm({ ...form, resolucion_vencimiento: e.target.value })} /></div>
                <div className="md:col-span-2"><label className={lbl}>Mensaje pie del recibo</label><input className={inp} value={form.mensaje_pie} onChange={e => setForm({ ...form, mensaje_pie: e.target.value })} /></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200">
              <h2 className="font-bold text-stone-900 mb-3 flex items-center gap-2"><Plug className="w-5 h-5 text-[#fdb813]" />Modo 2: software contable</h2>
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input type="checkbox" checked={form.integracion_activa} onChange={e => setForm({ ...form, integracion_activa: e.target.checked })} className="w-4 h-4" />
                <span className="text-sm font-semibold text-stone-700">Conectar con mi software de facturacion electronica</span>
              </label>
              {form.integracion_activa && (
                <div className="space-y-3">
                  <select className={inp} value={form.integracion_proveedor} onChange={e => setForm({ ...form, integracion_proveedor: e.target.value })}>
                    <option value="ninguno">Selecciona proveedor</option>
                    <option value="siigo">Siigo</option>
                    <option value="alegra">Alegra</option>
                  </select>
                  <input className={inp} value={form.integracion_api_key} onChange={e => setForm({ ...form, integracion_api_key: e.target.value })} placeholder="API Key" />
                  <input className={inp} type="password" value={form.integracion_api_secret} onChange={e => setForm({ ...form, integracion_api_secret: e.target.value })} placeholder="API Secret" />
                  <p className="text-xs text-stone-500">SIGEA enviara cada venta a tu contador automaticamente.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <button onClick={guardar} disabled={saving || !tenantId} className="mt-4 w-full md:w-auto px-8 py-3 bg-[#fdb813] text-stone-900 rounded-xl font-extrabold flex items-center justify-center gap-2 disabled:opacity-50">
          <Save className="w-5 h-5" />{saving ? "Guardando..." : "Guardar configuracion"}
        </button>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 mt-6">
          <h2 className="font-bold text-stone-900 mb-3">Recibos emitidos ({facturas.length})</h2>
          {facturas.length === 0 ? (
            <p className="text-stone-500 text-sm text-center py-6">Aun no hay recibos. Se generan al cobrar en el POS.</p>
          ) : (
            <div className="space-y-2">
              {facturas.slice(0, 15).map(fc => (
                <div key={fc.id} className="flex items-center justify-between border border-stone-200 rounded-xl px-4 py-2.5 text-sm">
                  <span className="font-bold text-stone-900">{fc.numero_factura}</span>
                  <span className="text-stone-600">{fc.cliente_nombre}</span>
                  <span className="font-semibold text-emerald-600">${Number(fc.total).toLocaleString("es-CO")}</span>
                  <span className="text-xs text-stone-400">{new Date(fc.created_at).toLocaleDateString("es-CO")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
