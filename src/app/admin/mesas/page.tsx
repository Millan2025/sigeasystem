"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const lbl = (x: string) => { const u = x.trim().toUpperCase(); return u.startsWith("MESA") ? u : "MESA " + u; };
const TENANT = "11111111-1111-1111-1111-111111111111";

export default function AdminMesas() {
  const [sb] = useState(() => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!));
  const [mesas, setMesas] = useState<any[]>([]);
  const [codigo, setCodigo] = useState("");
  const [pref, setPref] = useState("A");
  const [desde, setDesde] = useState(1);
  const [hasta, setHasta] = useState(8);
  const [msg, setMsg] = useState("");

  const cargar = async () => {
    const { data } = await sb.from("mesas").select("*").eq("tenant_id", TENANT).order("codigo");
    setMesas(data || []);
  };
  useEffect(() => { cargar(); }, []);

  const agregar = async (c: string) => {
    const codigoUp = c.toUpperCase().trim();
    if (!codigoUp) return;
    const { error } = await sb.from("mesas").insert({ tenant_id: TENANT, codigo: codigoUp });
    if (error) setMsg("⚠️ " + error.message);
    else { setMsg("✅ Mesa " + codigoUp + " creada"); setCodigo(""); }
    cargar();
  };

  const generarRango = async () => {
    let creadas = 0;
    for (let i = desde; i <= hasta; i++) {
      const { error } = await sb.from("mesas").insert({ tenant_id: TENANT, codigo: (pref + i).toUpperCase() });
      if (!error) creadas++;
    }
    setMsg("✅ " + creadas + " mesas creadas (" + pref + desde + " a " + pref + hasta + ")");
    cargar();
  };

  const eliminar = async (id: string) => { await sb.from("mesas").delete().eq("id", id); cargar(); };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-extrabold text-[#fdb813]">🪑 Admin Master · Mesas y QR</h1>
          <Link href="/demo/restaurante/mesas" className="bg-[#fdb813] text-stone-900 rounded-lg px-4 py-2 font-bold">🖨️ Hoja QR / Imprimir</Link>
        </div>
        <p className="text-stone-400 text-sm mt-1">Crea los códigos alfanuméricos de las mesas y genera el QR para imprimir.</p>

        <div className="bg-stone-800 rounded-xl p-4 mt-6">
          <p className="font-bold mb-2">Agregar mesa personalizada</p>
          <div className="flex gap-2">
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej: TERRAZA1 / VIP2 / BAR3" className="flex-1 bg-stone-700 rounded-lg px-3 py-2 outline-none" />
            <button onClick={() => agregar(codigo)} className="bg-emerald-600 rounded-lg px-4 font-bold">+ Añadir</button>
          </div>
        </div>

        <div className="bg-stone-800 rounded-xl p-4 mt-4">
          <p className="font-bold mb-2">Generar rango automático</p>
          <div className="flex gap-2 items-center flex-wrap">
            <input value={pref} onChange={(e) => setPref(e.target.value)} className="w-16 bg-stone-700 rounded-lg px-2 py-2 outline-none text-center font-bold" placeholder="Pref" />
            <input type="number" value={desde} onChange={(e) => setDesde(parseInt(e.target.value || "1"))} className="w-20 bg-stone-700 rounded-lg px-2 py-2 outline-none text-center" />
            <span>→</span>
            <input type="number" value={hasta} onChange={(e) => setHasta(parseInt(e.target.value || "8"))} className="w-20 bg-stone-700 rounded-lg px-2 py-2 outline-none text-center" />
            <button onClick={generarRango} className="bg-[#fdb813] text-stone-900 rounded-lg px-4 font-bold">Generar</button>
          </div>
        </div>

        {msg && <p className="text-sm text-emerald-300 mt-3">{msg}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6">
          {mesas.map((m) => (
            <div key={m.id} className="bg-stone-800 border border-stone-700 rounded-lg p-3 text-center">
              <p className="font-bold text-[#fdb813] text-lg">{lbl(m.codigo)}</p>
              <button onClick={() => eliminar(m.id)} className="text-xs text-rose-400 mt-2">Eliminar</button>
            </div>
          ))}
          {mesas.length === 0 && <p className="text-stone-400 text-sm col-span-4">Sin mesas aún: genera un rango (ej: A 1→8) o añade personalizadas.</p>}
        </div>

        <p className="text-stone-500 text-xs mt-6 text-center">Total: <b className="text-[#fdb813]">{mesas.length}</b> mesas creadas</p>
      </div>
    </div>
  );
}
