import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const org = url.searchParams.get("org");
  if (!org) return NextResponse.json({ success: false, error: "Falta org" }, { status: 400 });
  const { data, error } = await supabase
    .from("business_config").select("*")
    .eq("organizacion_id", org).neq("tipo_sede", "central")
    .order("created_at");
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, sedes: data || [] });
}

export async function POST(request: Request) {
  try {
    const b = await request.json();
    const { central_id, nombre, zona, responsable, telefono, direccion, modulos } = b;
    if (!central_id || !nombre) return NextResponse.json({ success: false, error: "Faltan central_id y nombre" }, { status: 400 });
    const { data: central, error: cErr } = await supabase.from("business_config").select("*").eq("id", central_id).single();
    if (cErr || !central) return NextResponse.json({ success: false, error: "Central no encontrada" }, { status: 404 });
    const base: any = { ...central };
    delete base.id; delete base.created_at;
    const sede = { ...base,
      nombre_negocio: nombre, tipo_sede: "punto_venta", sede_padre_id: central_id,
      organizacion_id: central.organizacion_id,
      zona: zona || "", responsable: responsable || "", telefono: telefono || "", direccion: direccion || "",
      modulos_activos: modulos || "pos,pedidos,reportes" };
    const { data: nueva, error: iErr } = await supabase.from("business_config").insert(sede).select().single();
    if (iErr) throw iErr;
    const { data: prods } = await supabase.from("productos").select("*").eq("tenant_id", central_id);
    let clonados = 0;
    if (prods && prods.length) {
      const clones = prods.map((p: any) => { const { id, created_at, ...rest } = p; return { ...rest, tenant_id: nueva.id }; });
      const { error: pErr } = await supabase.from("productos").insert(clones);
      if (!pErr) clonados = clones.length;
    }
    return NextResponse.json({ success: true, sede: nueva, productos_clonados: clonados });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  try {
    const b = await request.json();
    const { sede_id, ...upd } = b;
    if (!sede_id) return NextResponse.json({ success: false, error: "Falta sede_id" }, { status: 400 });
    const allowed: any = {};
    ["nombre_negocio", "zona", "responsable", "telefono", "direccion", "modulos_activos"].forEach((k) => { if (upd[k] !== undefined) allowed[k] = upd[k]; });
    const { data, error } = await supabase.from("business_config").update(allowed).eq("id", sede_id).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, sede: data });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "Falta id" }, { status: 400 });
  const { error } = await supabase.from("business_config").delete().eq("id", id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
