"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const TENANT_DEMO = "11111111-1111-1111-1111-111111111111";

export default function AdminMesas() {
  const [mesas, setMesas] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [tenantSel, setTenantSel] = useState(TENANT_DEMO);
  const [config, setConfig] = useState<any>({});
  const [codigo, setCodigo] = useState("");
  const [pref, setPref] = useState("A");
  const [desde, setDesde] = useState(1);
  const [hasta, setHasta] = useState(8);
  const [msg, setMsg] = useState("");

  const cargar = async () => {
    const { data } = await sb.from("mesas").select("*").eq("tenant_id", tenantSel).order("codigo");
    setMesas(data || []);
  };

  const cargarTenants = async () => {
    try {
      const r = await fetch("/api/admin/tenants");
      const j = await r.json();
      const arr = j.data || j || [];
      setTenants(arr);
    } catch {}
  };

  const cargarConfig = async () => {
    try {
      const r = await fetch(`/api/tenant-config?tenant=${tenantSel}`);
      const j = await r.json();
      if (j.success && j.data) setConfig(j.data);
      else setConfig({});
    } catch {}
  };

  useEffect(() => { cargarTenants(); }, []);
  useEffect(() => { cargar(); cargarConfig(); }, [tenantSel]);

  const agregar = async (c: string) => {
    const codigoUp = c.toUpperCase().trim();
    if (!codigoUp) return;
    const { error } = await sb.from("mesas").insert({ tenant_id: tenantSel, codigo: codigoUp });
    if (error) setMsg("⚠️ " + error.message);
    else { setMsg("✅ Mesa " + codigoUp + " creada"); setCodigo(""); }
    cargar();
  };

  const generarRango = async () => {
    let creadas = 0;
    for (let i = desde; i <= hasta; i++) {
      const { error } = await sb.from("mesas").insert({ tenant_id: tenantSel, codigo: (pref + i).toUpperCase() });
      if (!error) creadas++;
    }
    setMsg("✅ " + creadas + " mesas creadas (" + pref + desde + " a " + pref + hasta + ")");
    cargar();
  };

  const eliminar = async (id: string) => { await sb.from("mesas").delete().eq("id", id); cargar(); };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const lbl = (x: string) => { const u = x.trim().toUpperCase(); return u.startsWith("MESA") ? u : "MESA " + u; };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h1 className="text-2xl font-extrabold text-[#fdb813]">🪑 Admin Master · Mesas y QR</h1>
          <Link href="/admin" className="bg-stone-700 text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-stone-600">← Volver</Link>
        </div>

        {/* Selector de negocio */}
        <div className="bg-stone-800 rounded-xl p-4 mb-4">
          <p className="font-bold mb-2 text-sm">Selecciona el negocio</p>
          <select value={tenantSel} onChange={(e) => setTenantSel(e.target.value)} className="w-full bg-stone-700 rounded-lg px-3 py-2 outline-none">
            {tenants.length === 0 && <option value={TENANT_DEMO}>Restaurante Demo SIGEA</option>}
            {tenants.map((t: any) => (
              <option key={t.id} value={t.id}>{t.nombre || t.slug || t.id}</option>
            ))}
          </select>
        </div>

        {/* Identidad del negocio (se muestra en el QR) */}
        {config.nombre_negocio && (
          <div className="bg-gradient-to-r from-[#fdb813] to-[#e8a800] text-stone-900 rounded-xl p-4 mb-4 shadow-lg">
            <p className="text-xs font-bold uppercase tracking-wider opacity-70">Identidad del negocio (se imprime en el QR)</p>
            <p className="font-extrabold text-xl mt-1">{config.nombre_negocio}</p>
            {config.slogan && <p className="text-sm italic mt-0.5">"{config.slogan}"</p>}
            <div className="flex flex-wrap gap-3 mt-2 text-sm">
              {config.direccion && <span>📍 {config.direccion}</span>}
              {config.telefono && <span>📞 {config.telefono}</span>}
              {config.whatsapp && <span>💬 {config.whatsapp}</span>}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-stone-800 rounded-xl p-4">
            <p className="font-bold mb-2">Agregar mesa personalizada</p>
            <div className="flex gap-2">
              <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej: TERRAZA1 / VIP2" className="flex-1 bg-stone-700 rounded-lg px-3 py-2 outline-none" />
              <button onClick={() => agregar(codigo)} className="bg-emerald-600 rounded-lg px-4 font-bold">+ Añadir</button>
            </div>
          </div>

          <div className="bg-stone-800 rounded-xl p-4">
            <p className="font-bold mb-2">Generar rango automático</p>
            <div className="flex gap-2 items-center flex-wrap">
              <input value={pref} onChange={(e) => setPref(e.target.value)} className="w-16 bg-stone-700 rounded-lg px-2 py-2 outline-none text-center font-bold" />
              <input type="number" value={desde} onChange={(e) => setDesde(parseInt(e.target.value || "1"))} className="w-20 bg-stone-700 rounded-lg px-2 py-2 outline-none text-center" />
              <span>→</span>
              <input type="number" value={hasta} onChange={(e) => setHasta(parseInt(e.target.value || "8"))} className="w-20 bg-stone-700 rounded-lg px-2 py-2 outline-none text-center" />
              <button onClick={generarRango} className="bg-[#fdb813] text-stone-900 rounded-lg px-4 font-bold">Generar</button>
            </div>
          </div>
        </div>

        {msg && <p className="text-sm text-emerald-300 mt-3">{msg}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-6">
          {mesas.map((m) => (
            <div key={m.id} className="bg-stone-800 border border-stone-700 rounded-lg p-3 text-center">
              <p className="font-bold text-[#fdb813] text-lg">{lbl(m.codigo)}</p>
              <button onClick={() => eliminar(m.id)} className="text-xs text-rose-400 mt-2">Eliminar</button>
            </div>
          ))}
          {mesas.length === 0 && <p className="text-stone-400 text-sm col-span-full text-center">Sin mesas aún para este negocio.</p>}
        </div>

        {/* HOJA DE QR IMPRIMIBLE */}
        {mesas.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3 no-print">
              <h2 className="text-xl font-extrabold text-[#fdb813]">🖨️ Hoja de QR para imprimir</h2>
              <button onClick={() => window.print()} className="bg-[#fdb813] text-stone-900 rounded-lg px-4 py-2 font-bold">Imprimir / Guardar PDF</button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 print:grid-cols-3">
              {mesas.map((m) => (
                <div key={m.id} className="bg-white text-stone-900 rounded-xl p-3 text-center border-2 border-stone-800 print:border-black print:break-inside-avoid">
                  <p className="font-extrabold text-base leading-tight">{config.nombre_negocio || "Restaurante"}</p>
                  {config.slogan && <p className="text-[9px] italic text-stone-500 mt-0.5">"{config.slogan}"</p>}
                  <img src={"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(origin + "/demo/restaurante/mesa?m=" + m.codigo)} alt={m.codigo} className="w-36 h-36 mx-auto mt-2" />
                  <p className="font-extrabold text-2xl text-[#fdb813] mt-1">{lbl(m.codigo)}</p>
                  {config.telefono && <p className="text-[10px] text-stone-600 mt-1">📞 {config.telefono}</p>}
                  {config.direccion && <p className="text-[9px] text-stone-500 mt-0.5">{config.direccion}</p>}
                  <p className="text-[9px] text-stone-400 mt-1">Escanea para pedir desde tu celular</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-stone-500 text-xs mt-6 text-center no-print">Total: <b className="text-[#fdb813]">{mesas.length}</b> mesas · Tenant: <code className="text-[10px]">{tenantSel}</code></p>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .min-h-screen { min-height: auto !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
