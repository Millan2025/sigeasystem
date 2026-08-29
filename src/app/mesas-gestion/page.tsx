"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { NEGOCIOS } from "@/config/negocios";
import PageHeader from "@/components/PageHeader";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const TENANT_DEMO = "11111111-1111-1111-1111-111111111111";
const nombreDe = (t: any) => t.nombre_negocio || t.nombre || t.slug || t.id;

export default function AdminMesas() {
  const [mesas, setMesas] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [tenantSel, setTenantSel] = useState(TENANT_DEMO);
  const [config, setConfig] = useState<any>({});
  const [busqueda, setBusqueda] = useState("");
  const [codigo, setCodigo] = useState("");
  const [pref, setPref] = useState("A");
  const [desde, setDesde] = useState(1);
  const [hasta, setHasta] = useState(8);
  const [msg, setMsg] = useState("");
  const [bloqueado, setBloqueado] = useState(false);
  const [negDemo, setNegDemo] = useState<any>(null);
  const [slugOrig, setSlugOrig] = useState("");

  const cargar = async () => {
    const { data } = await sb.from("mesas").select("*").eq("tenant_id", tenantSel).order("codigo");
    setMesas(data || []);
  };
  const cargarTenants = async () => {
    try {
      const r = await fetch("/api/tenant-config?tenant=" + tenantSel);
      const j = await r.json();
      // Para /mesas-gestion, solo mostramos el tenant actual (no lista completa)
      if (j.success && j.data) {
        setTenants([j.data]);
      }
    } catch {}
  };
  const cargarConfig = async () => {
    try {
      const r = await fetch(`/api/tenant-config?tenant=${tenantSel}`);
      const j = await r.json();
      setConfig(j.success && j.data ? j.data : {});
    } catch {}
  };

  useEffect(() => {
    const tParam = new URLSearchParams(window.location.search).get("tenant");
    if (tParam) { setTenantSel(tParam); setBloqueado(true); }
    const origen = new URLSearchParams(window.location.search).get("origen") || "";
    const slug = decodeURIComponent(origen).split("/").filter(Boolean).pop() || "";
    const neg = (NEGOCIOS as any)[slug];
    if (neg && neg.tenantId) { setTenantSel(neg.tenantId); setBloqueado(true); setNegDemo(neg); setSlugOrig(slug); }
    cargarTenants();
  }, []);
  useEffect(() => { cargar(); cargarConfig(); }, [tenantSel]);

  const tenantsFiltrados = tenants.filter((t) => nombreDe(t).toLowerCase().includes(busqueda.toLowerCase()));

  const DEMO_IDENTIDAD: any = {
    panaderia: { slogan: "Pan fresco cada maÃ±ana", direccion: "Cra 8 #45-12, Barranquilla" },
    carniceria: { slogan: "La mejor carne del barrio", direccion: "Calle 30 #18-05, Barranquilla" },
    salsamentaria: { slogan: "Sabor especial para tu mesa", direccion: "Cra 21 #68-40, Barranquilla" },
    ferreteria: { slogan: "Todo para tu hogar y obra", direccion: "Av. Boyaca #106-15, Barranquilla" },
    tienda: { slogan: "Tu esquina de confianza", direccion: "Calle 106 #8-52, Barranquilla" },
  };
  const nombreShow = negDemo?.titulo || config.nombre_negocio || "Tu Negocio";
  const sloganShow = DEMO_IDENTIDAD[slugOrig]?.slogan || config.slogan;
  const dirShow = DEMO_IDENTIDAD[slugOrig]?.direccion || config.direccion;

  const agregar = async (c: string) => {
    const codigoUp = c.toUpperCase().trim();
    if (!codigoUp) return;
    const { error } = await sb.from("mesas").insert({ tenant_id: tenantSel, codigo: codigoUp });
    if (error) setMsg("âš ï¸ " + error.message);
    else { setMsg("âœ… Mesa " + codigoUp + " creada"); setCodigo(""); }
    cargar();
  };
  const generarRango = async () => {
    let creadas = 0;
    for (let i = desde; i <= hasta; i++) {
      const { error } = await sb.from("mesas").insert({ tenant_id: tenantSel, codigo: (pref + i).toUpperCase() });
      if (!error) creadas++;
    }
    setMsg("âœ… " + creadas + " mesas creadas (" + pref + desde + " a " + pref + hasta + ")");
    cargar();
  };
  const eliminar = async (id: string) => { await sb.from("mesas").delete().eq("id", id); cargar(); };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const lbl = (x: string) => { const u = x.trim().toUpperCase(); return u.startsWith("MESA") ? u : "MESA " + u; };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
        <PageHeader negocioSlug={slugOrig || "restaurante"} titulo="Mesas y QR" icono="ðŸª‘" subtitulo="GestiÃ³n de mesas y cÃ³digos QR" tenantId={tenantSel} />
      </div>

        {!bloqueado && (
        <div className="bg-white border border-stone-200 rounded-xl p-4 mb-4">
          <p className="font-bold mb-2 text-sm">ðŸ”Ž Busca y selecciona el negocio (por nombre)</p>
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Escribe el nombre: Pollo, Casa, Restaurante..." className="w-full bg-white border border-stone-300 text-stone-800 placeholder-stone-500 rounded-lg px-3 py-2 outline-none mb-2" />
          <select value={tenantSel} onChange={(e) => setTenantSel(e.target.value)} className="w-full bg-white border border-stone-200 text-white rounded-lg px-3 py-2 outline-none">
            <option value={TENANT_DEMO} className="bg-white border border-stone-200 text-white">Restaurante Demo SIGEA</option>
            {tenantsFiltrados.filter((t) => t.id !== TENANT_DEMO).map((t) => (
              <option key={t.id} value={t.id} className="bg-white border border-stone-200 text-white">{nombreDe(t)}</option>
            ))}
          </select>
        </div>
        )}


        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <p className="font-bold mb-2">Agregar mesa personalizada</p>
            <div className="flex gap-2">
              <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej: TERRAZA1 / VIP2" className="flex-1 bg-white border border-stone-300 text-stone-800 placeholder-stone-500 rounded-lg px-3 py-2 outline-none" />
              <button onClick={() => agregar(codigo)} className="bg-emerald-600 rounded-lg px-4 font-bold">+ AÃ±adir</button>
            </div>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <p className="font-bold mb-2">Generar rango automÃ¡tico</p>
            <div className="flex gap-2 items-center flex-wrap">
              <input value={pref} onChange={(e) => setPref(e.target.value)} className="w-16 bg-white border border-stone-200 text-white rounded-lg px-2 py-2 outline-none text-center font-bold" />
              <input type="number" value={desde} onChange={(e) => setDesde(parseInt(e.target.value || "1"))} className="w-20 bg-white border border-stone-200 text-white rounded-lg px-2 py-2 outline-none text-center" />
              <span>â†’</span>
              <input type="number" value={hasta} onChange={(e) => setHasta(parseInt(e.target.value || "8"))} className="w-20 bg-white border border-stone-200 text-white rounded-lg px-2 py-2 outline-none text-center" />
              <button onClick={generarRango} className="bg-[#fdb813] text-stone-900 rounded-lg px-4 font-bold">Generar</button>
            </div>
          </div>
        </div>

        {msg && <p className="text-sm text-emerald-300 mt-3">{msg}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-6">
          {mesas.map((m) => (
            <div key={m.id} className="bg-white border border-stone-200 border border-stone-300 rounded-lg p-3 text-center">
              <p className="font-bold text-amber-600 text-lg">{lbl(m.codigo)}</p>
              <a href={origin + "/mesa?m=" + encodeURIComponent(m.codigo) + "&t=" + tenantSel + (slugOrig ? "&neg=" + slugOrig : "")} className="block bg-[#fdb813] text-stone-900 rounded-lg px-2 py-1 text-xs font-extrabold mt-2">ðŸ½ï¸ Entrar</a>
              <button onClick={() => eliminar(m.id)} className="text-xs text-rose-400 mt-2">Eliminar</button>
            </div>
          ))}
          {mesas.length === 0 && <p className="text-stone-700 text-sm col-span-full text-center">Sin mesas aÃºn para este negocio.</p>}
        </div>

        {mesas.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3 no-print">
              <h2 className="text-xl font-extrabold text-amber-600">ðŸ–¨ï¸ Hoja de QR para imprimir</h2>
              <button onClick={() => window.print()} className="bg-[#fdb813] text-stone-900 rounded-lg px-4 py-2 font-bold">Imprimir / Guardar PDF</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {mesas.map((m) => (
                <div key={m.id} className="bg-white text-stone-900 rounded-xl p-3 text-center border-2 border-stone-800">
                  <p className="font-extrabold text-base leading-tight">{nombreShow || "Restaurante"}</p>
                  {sloganShow && <p className="text-[9px] italic text-stone-600 mt-0.5">"{sloganShow}"</p>}
                  <img src={"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(origin + "/mesa?m=" + m.codigo + "&t=" + tenantSel + (slugOrig ? "&neg=" + slugOrig : ""))} alt={m.codigo} className="w-36 h-36 mx-auto mt-2" />
                  <p className="font-extrabold text-2xl text-amber-600 mt-1">{lbl(m.codigo)}</p>
                  {config.telefono && <p className="text-[10px] text-stone-600 mt-1">ðŸ“ž {config.telefono}</p>}
                  {dirShow && <p className="text-[9px] text-stone-600 mt-0.5">{dirShow}</p>}
                  <p className="text-[9px] text-stone-600 mt-1">Escanea para pedir desde tu celular</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-stone-700 text-xs mt-6 text-center no-print">Total: <b className="text-amber-600">{mesas.length}</b> mesas</p>
      </div>
      <style>{"@media print { .no-print { display:none !important } body { background:white !important } }"}</style>
    </div>
  );
}