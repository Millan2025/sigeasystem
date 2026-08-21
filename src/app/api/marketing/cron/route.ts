import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const secreto = process.env.CRON_SECRET || "sigea-cron-2026";
  if (key !== secreto) return NextResponse.json({ ok: false }, { status: 403 });

  const { data: pendientes } = await supabase
    .from("publicaciones_whatsapp")
    .select("*")
    .eq("estado", "pendiente");

  const ahora = new Date();
  const vencidas = (pendientes || []).filter((p: any) => new Date(p.fecha_programada) <= ahora);

  const resultados = [];
  for (const pub of vencidas) {
    if (!pub.numero_whatsapp) {
      const { data: cfg } = await supabase.from("config_whatsapp").select("numero_negocio").eq("tenant_id", pub.tenant_id).maybeSingle();
      if (cfg?.numero_negocio) {
        await supabase.from("publicaciones_whatsapp").update({ numero_whatsapp: cfg.numero_negocio }).eq("id", pub.id);
        pub.numero_whatsapp = cfg.numero_negocio;
      }
    }
    const r = await fetch(`${url.origin}/api/marketing/enviar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicacionId: pub.id }),
    });
    resultados.push({ id: pub.id, nombre: pub.nombre_pieza, detalle: await r.json() });
  }
  return NextResponse.json({ ok: true, pendientesTotal: (pendientes || []).length, procesadas: resultados.length, resultados });
}
