export const dynamic = 'force-dynamic';
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
      .from("premios")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("activo", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, premios: data || [] });
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
    const { tenant_id, nombre, descripcion, tipo, producto_id, costo_sellos, costo_puntos, stock } = b;
    if (!tenant_id || !nombre) {
      return NextResponse.json({ success: false, error: "Faltan datos" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("premios")
      .insert({ 
        tenant_id, nombre, descripcion, 
        tipo: tipo || "producto", 
        producto_id: producto_id || null,
        costo_sellos: costo_sellos || 10,
        costo_puntos: costo_puntos || 100,
        stock: stock || 999
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, premio: data });
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
    const { data, error } = await supabase.from("premios").update(upd).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, premio: data });
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
    const { error } = await supabase.from("premios").update({ activo: false }).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
