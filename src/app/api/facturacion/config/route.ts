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
      .from("config_facturacion")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    
    if (error) throw error;
    return NextResponse.json({ success: true, config: data || null });
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
    const { tenant_id, ...datos } = b;
    if (!tenant_id) return NextResponse.json({ success: false, error: "Falta tenant_id" }, { status: 400 });
    
    // Verificar si ya existe
    const { data: existente } = await supabase
      .from("config_facturacion")
      .select("id")
      .eq("tenant_id", tenant_id)
      .maybeSingle();
    
    let result;
    if (existente) {
      const { data, error } = await supabase
        .from("config_facturacion")
        .update({ ...datos, updated_at: new Date().toISOString() })
        .eq("id", existente.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from("config_facturacion")
        .insert({ tenant_id, ...datos })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }
    
    return NextResponse.json({ success: true, config: result });
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
      .from("config_facturacion")
      .update({ ...upd, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    
    return NextResponse.json({ success: true, config: data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
