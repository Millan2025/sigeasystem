import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// Caption LIMPIO: solo mensaje + hashtags (SIN url)
function caption(pub: any) {
  const tags = pub.hashtag ? "#" + String(pub.hashtag).replace(/#/g, "").split(",").map((h: string) => h.trim()).filter(Boolean).join(" #") : "";
  return `${pub.texto_mensaje || ""}${tags ? "\n\n" + tags : ""}`.trim() || pub.nombre_pieza;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const publicacionId = body.publicacionId;
    if (!publicacionId) return NextResponse.json({ ok: false, error: "falta publicacionId" }, { status: 400 });

    const { data: pub } = await supabase.from("publicaciones_whatsapp").select("*").eq("id", publicacionId).single();
    if (!pub) return NextResponse.json({ ok: false, error: "no encontrada" }, { status: 404 });

    const destino = String(pub.numero_whatsapp || "").replace(/\D/g, "");
    if (!destino) return NextResponse.json({ ok: false, error: "sin numero del dueno" }, { status: 400 });
    const texto = caption(pub);

    // PROVIDER 1: META OFICIAL
    const metaToken = process.env.WHATSAPP_META_TOKEN;
    const metaPhoneId = process.env.WHATSAPP_META_PHONE_NUMBER_ID;
    if (metaToken && metaPhoneId) {
      const r = await fetch(`https://graph.facebook.com/v20.0/${metaPhoneId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${metaToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to: destino, type: "image", image: { link: pub.url_archivo, caption: texto } }),
      });
      if (r.ok) {
        await supabase.from("publicaciones_whatsapp").update({ estado: "publicado", fecha_publicacion_real: new Date().toISOString(), enlace_compartido: "meta-api" }).eq("id", pub.id);
        return NextResponse.json({ ok: true, provider: "meta" });
      }
    }

    // PROVIDER 2: PUENTE (imagen + caption limpio)
    const bridge = process.env.BAILEYS_BRIDGE_URL;
    if (bridge) {
      const r = await fetch(`${bridge}/enviar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.BAILEYS_API_KEY || "" },
        body: JSON.stringify({ to: destino, text: texto, image: pub.url_archivo }),
      });
      if (r.ok) {
        await supabase.from("publicaciones_whatsapp").update({ estado: "publicado", fecha_publicacion_real: new Date().toISOString(), enlace_compartido: "puente" }).eq("id", pub.id);
        return NextResponse.json({ ok: true, provider: "puente" });
      }
    }

    return NextResponse.json({ ok: false, provider: "ninguno", nota: "Configura Meta o el Puente" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
