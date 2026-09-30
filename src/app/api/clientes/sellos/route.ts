import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const url = new URL(request.url);
    const clienteId = url.searchParams.get("cliente_id");
    if (!clienteId) return NextResponse.json({ success: false, error: "Falta cliente_id" }, { status: 400 });
    const { data, error } = await supabase
      .from("sellos")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, sellos: data || [] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const b = await request.json();
    const { tenant_id, cliente_id, venta_id, motivo, valor } = b;
    if (!tenant_id || !cliente_id) {
      return NextResponse.json({ success: false, error: "Faltan datos" }, { status: 400 });
    }

    const v = valor || 1;
    const { data: sello, error: sErr } = await supabase
      .from("sellos")
      .insert({ tenant_id, cliente_id, venta_id, motivo: motivo || "venta_pos", valor: v })
      .select()
      .single();
    if (sErr) throw sErr;

    const { error: updErr } = await supabase.rpc("actualizar_estadisticas_cliente", {
      p_cliente_id: cliente_id,
      p_sellos: v,
      p_puntos: 0,
      p_nueva_visita: true
    }).then(() => ({ error: null })).catch((e) => ({ error: e }));

    const { data: cliente } = await supabase
      .from("clientes_fidelizados")
      .select("*")
      .eq("id", cliente_id)
      .single();

    return NextResponse.json({ success: true, sello, cliente });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
