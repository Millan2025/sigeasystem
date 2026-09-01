import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, nombre_organizacion } = body;
    if (!tenant_id) return NextResponse.json({ success: false, error: "Falta tenant_id" }, { status: 400 });
    const { data: org, error: orgErr } = await supabase
      .from("organizaciones")
      .insert({ nombre: nombre_organizacion || "Central Master", tenant_central_id: tenant_id })
      .select().single();
    if (orgErr) throw orgErr;
    const { error: upErr } = await supabase
      .from("business_config")
      .update({ organizacion_id: org.id, tipo_sede: "central" })
      .eq("id", tenant_id);
    if (upErr) throw upErr;
    return NextResponse.json({ success: true, organizacion: org });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
