import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenant_id");
    if (!tenantId) return NextResponse.json({ success: false, error: "Falta tenant_id" }, { status: 400 });

    const { data, error } = await supabase
      .from("clientes_fidelizados")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("ultima_visita", { ascending: false, nullsFirst: false });
    if (error) throw error;

    const { data: config } = await supabase
      .from("config_fidelizacion")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    return NextResponse.json({ success: true, clientes: data || [], config: config || null });
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
    const { tenant_id, nombre, telefono, email, fecha_cumpleanos } = b;
    if (!tenant_id || !telefono) {
      return NextResponse.json({ success: false, error: "Faltan tenant_id y telefono" }, { status: 400 });
    }
    const digits = String(telefono).replace(/\D/g, "");
    const { data, error } = await supabase
      .from("clientes_fidelizados")
      .insert({ tenant_id, nombre, telefono: digits, email, fecha_cumpleanos, segmento: "nuevo" })
      .select()
      .single();
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: false, error: "Cliente con ese telefono ya existe" }, { status: 409 });
      }
      throw error;
    }
    return NextResponse.json({ success: true, cliente: data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const b = await request.json();
    const { id, ...upd } = b;
    if (!id) return NextResponse.json({ success: false, error: "Falta id" }, { status: 400 });
    const { data, error } = await supabase
      .from("clientes_fidelizados")
      .update(upd)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, cliente: data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Falta id" }, { status: 400 });
    const { error } = await supabase.from("clientes_fidelizados").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
