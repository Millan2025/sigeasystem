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
    const clienteId = url.searchParams.get("cliente_id");
    if (!clienteId) return NextResponse.json({ success: false, error: "Falta cliente_id" }, { status: 400 });
    const { data, error } = await supabase
      .from("puntos_movimientos")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, movimientos: data || [] });
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
    const { tenant_id, cliente_id, tipo, cantidad, descripcion, venta_id } = b;
    if (!tenant_id || !cliente_id || cantidad === undefined) {
      return NextResponse.json({ success: false, error: "Faltan datos" }, { status: 400 });
    }

    const { data: mov, error: mErr } = await supabase
      .from("puntos_movimientos")
      .insert({ tenant_id, cliente_id, tipo: tipo || "ganado", cantidad, descripcion, venta_id })
      .select()
      .single();
    if (mErr) throw mErr;

    // Leer cliente actual y actualizar puntos
    const { data: clienteActual } = await supabase
      .from("clientes_fidelizados")
      .select("*")
      .eq("id", cliente_id)
      .single();

    if (clienteActual) {
      const nuevosPuntos = (clienteActual.puntos_acumulados || 0) + (tipo === "canjeado" ? -cantidad : cantidad);
      await supabase
        .from("clientes_fidelizados")
        .update({
          puntos_acumulados: Math.max(0, nuevosPuntos),
          ultima_visita: new Date().toISOString()
        })
        .eq("id", cliente_id);
    }

    const { data: cliente } = await supabase
      .from("clientes_fidelizados")
      .select("*")
      .eq("id", cliente_id)
      .single();

    return NextResponse.json({ success: true, movimiento: mov, cliente });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
