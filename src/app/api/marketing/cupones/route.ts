export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Listar cupones del tenant
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenant');
    const codigo = url.searchParams.get('codigo');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Falta tenant' }, { status: 400 });
    }

    let query = supabase
      .from('cupones_campana')
      .select('*')
      .eq('tenant_id', tenantId);

    if (codigo) {
      query = query.eq('codigo', codigo.toUpperCase());
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Crear cupón
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tenant_id, nombre_campana, codigo, tipo_descuento,
      valor_descuento, usos_maximos, segmento_destino,
      fecha_inicio, fecha_expiracion
    } = body;

    if (!tenant_id || !codigo || !valor_descuento) {
      return NextResponse.json({
        success: false,
        error: 'Faltan: tenant_id, codigo, valor_descuento'
      }, { status: 400 });
    }

    const codigoUpper = codigo.toUpperCase().replace(/\s/g, '');

    // Verificar que no exista
    const { data: existente } = await supabase
      .from('cupones_campana')
      .select('id')
      .eq('codigo', codigoUpper)
      .maybeSingle();

    if (existente) {
      return NextResponse.json({
        success: false,
        error: 'Ya existe un cupón con ese código'
      }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('cupones_campana')
      .insert({
        tenant_id,
        nombre_campana: nombre_campana || 'Campaña sin nombre',
        codigo: codigoUpper,
        tipo_descuento: tipo_descuento || 'porcentaje',
        valor_descuento: Number(valor_descuento),
        usos_maximos: usos_maximos || 100,
        usos_actuales: 0,
        segmento_destino: segmento_destino || 'todos',
        fecha_inicio: fecha_inicio || new Date().toISOString().split('T')[0],
        fecha_expiracion: fecha_expiracion || null,
        estado: 'activo',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Validar y redimir cupón (llamado por POS/Domicilio/Mesas)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, codigo, monto_compra } = body;

    if (!tenant_id || !codigo) {
      return NextResponse.json({
        success: false,
        error: 'Faltan tenant_id y codigo'
      }, { status: 400 });
    }

    const { data: cupon, error } = await supabase
      .from('cupones_campana')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('codigo', codigo.toUpperCase())
      .maybeSingle();

    if (error) throw error;

    if (!cupon) {
      return NextResponse.json({
        success: false,
        valido: false,
        error: 'Cupón no encontrado'
      }, { status: 404 });
    }

    // Validaciones
    if (cupon.estado !== 'activo') {
      return NextResponse.json({
        success: false,
        valido: false,
        error: 'Cupón no está activo'
      });
    }

    if (cupon.fecha_expiracion && new Date(cupon.fecha_expiracion) < new Date()) {
      await supabase.from('cupones_campana').update({ estado: 'expirado' }).eq('id', cupon.id);
      return NextResponse.json({
        success: false,
        valido: false,
        error: 'Cupón expirado'
      });
    }

    if (cupon.usos_actuales >= cupon.usos_maximos) {
      await supabase.from('cupones_campana').update({ estado: 'agotado' }).eq('id', cupon.id);
      return NextResponse.json({
        success: false,
        valido: false,
        error: 'Cupón agotado'
      });
    }

    // Calcular descuento
    const monto = Number(monto_compra) || 0;
    let descuento = 0;
    if (cupon.tipo_descuento === 'porcentaje') {
      descuento = monto * (Number(cupon.valor_descuento) / 100);
    } else {
      descuento = Math.min(Number(cupon.valor_descuento), monto);
    }

    return NextResponse.json({
      success: true,
      valido: true,
      cupon: {
        id: cupon.id,
        codigo: cupon.codigo,
        campana: cupon.nombre_campana,
        tipo_descuento: cupon.tipo_descuento,
        valor_descuento: cupon.valor_descuento,
        descuento_aplicado: Math.round(descuento),
        monto_final: Math.round(monto - descuento),
        usos_restantes: cupon.usos_maximos - cupon.usos_actuales - 1,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}