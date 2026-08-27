"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const TENANT = "demo-rest-001";
const DEFAULTS = ["A1","A2","A3","A4","A5","A6","A7","A8"];

export default function MesasQR() {
  const [codigos, setCodigos] = useState<string[]>(DEFAULTS);
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
    (async () => {
      try {
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { data } = await sb.from("mesas").select("codigo").eq("tenant_id", TENANT).order("codigo");
        if (data && data.length > 0) setCodigos(data.map((d: any) => d.codigo));
      } catch (e) {}
    })();
  }, []);
  return (
    <div className="min-h-screen bg-white text-stone-800 p-6">
      <div className="flex items-center justify-between max-w-5xl mx-auto no-print">
        <h1 className="text-xl font-extrabold">🍽️ Mesas · QR para imprimir y pegar</h1>
        <button onClick={() => window.print()} className="bg-stone-900 text-white rounded-lg px-4 py-2 font-bold">🖨️ Imprimir / Guardar PDF</button>
      </div>
      <p className="text-center text-sm text-stone-500 mt-2">Restaurante demo · cada QR abre el menú de su mesa</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-5xl mx-auto mt-6">
        {codigos.map((c) => (
          <div key={c} className="border-2 border-stone-800 rounded-xl p-3 text-center bg-white">
            <p className="font-extrabold text-lg">MESA {c}</p>
            <img src={"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(origin + "/demo/restaurante/mesa?m=" + c)} alt={"QR Mesa " + c} className="w-40 h-40 mx-auto mt-2" />
            <p className="text-[10px] text-stone-500 mt-2">Escanea · pide desde tu celular</p>
          </div>
        ))}
      </div>
      <style>{"@media print { .no-print { display:none } }"}</style>
    </div>
  );
}
