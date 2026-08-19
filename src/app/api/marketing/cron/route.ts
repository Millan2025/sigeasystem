import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const secreto = process.env.CRON_SECRET || "sigea-cron-2026";
  if (key !== secreto) return NextResponse.json({ ok: false }, { status: 403 });

  const now = new Date().toISOString();
  const { data: vencidas } = await supabase
    .from("publicaciones_whatsapp")
    .select("*")
    .eq("estado", "pendiente")
    .lte("fecha_programada", now);

  const resultados = [];
  for (const pub of vencidas || []) {
    const r = await fetch(`${url.origin}/api/marketing/enviar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicacionId: pub.id }),
    });
    resultados.push({ id: pub.id, detalle: await r.json() });
  }
  return NextResponse.json({ ok: true, procesadas: resultados.length, resultados });
}
