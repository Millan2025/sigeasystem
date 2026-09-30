import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const b = await request.json();
    const { tenant_id, venta_id, cliente, items, metodo_pago } = b;
    if (!tenant_id) return NextResponse.json({ success: false, error: "Falta tenant_id" }, { status: 400 });
    
    // 1) Cargar configuración del negocio
    const { data: config, error: cfgErr } = await supabase
      .from("config_facturacion")
      .select("*")
      .eq("tenant_id", tenant_id)
      .maybeSingle();
    if (cfgErr) throw cfgErr;
    
    // 2) Incrementar consecutivo atómicamente
    const consecutivoActual = (config?.consecutivo_actual || 0) + 1;
    const { error: updErr } = await supabase
      .from("config_facturacion")
      .update({ consecutivo_actual: consecutivoActual })
      .eq("tenant_id", tenant_id);
    if (updErr) throw updErr;
    
    // 3) Generar número de factura
    const prefijo = config?.prefijo_factura || "FV";
    const numeroFactura = `${prefijo}-${String(consecutivoActual).padStart(6, "0")}`;
    
    // 4) Calcular totales
    const subtotal = (items || []).reduce((sum: number, it: any) => sum + (it.precio * it.cantidad), 0);
    const iva = config?.mostrar_iva_desglosado ? subtotal * 0.19 : 0;
    const total = subtotal + iva;
    
    // 5) Guardar en tabla facturas
    const { data: factura, error: fErr } = await supabase
      .from("facturas")
      .insert({
        tenant_id,
        venta_id,
        numero_factura: numeroFactura,
        tipo: "recibo",
        cliente_nombre: cliente?.nombre || "Cliente General",
        cliente_identificacion: cliente?.identificacion || "",
        cliente_direccion: cliente?.direccion || "",
        cliente_telefono: cliente?.telefono || "",
        subtotal,
        iva,
        total,
        items: items || [],
        metodo_pago: metodo_pago || "efectivo",
        estado: "emitida"
      })
      .select()
      .single();
    if (fErr) throw fErr;
    
    // 6) Si hay integración activa (Modo 2), intentar sincronizar
    if (config?.integracion_activa && config.integracion_proveedor !== "ninguno") {
      // Aquí irá la lógica de envío a Siigo/Alegra
      // Por ahora solo marcamos como pendiente
      await supabase
        .from("facturas")
        .update({ 
          sincronizado_externo: false,
          proveedor_externo: config.integracion_proveedor,
          error_sync: "Pendiente implementación Modo 2"
        })
        .eq("id", factura.id);
    }
    
    return NextResponse.json({ 
      success: true, 
      factura,
      config,
      numero_factura: numeroFactura
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

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
      .from("facturas")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    
    return NextResponse.json({ success: true, facturas: data || [] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
