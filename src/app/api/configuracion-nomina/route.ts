export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CONFIG_DEFAULT } from '@/lib/calculosNomina';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Obtener configuración del tenant
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenant');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Falta tenant_id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('configuracion_nomina')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) {
      console.error('Error GET config:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Si no existe, crear con valores default
    if (!data) {
      const { data: nueva, error: insErr } = await supabase
        .from('configuracion_nomina')
        .insert([{ tenant_id: tenantId, ...CONFIG_DEFAULT }])
        .select()
        .single();

      if (insErr) throw insErr;
      return NextResponse.json({ success: true, data: nueva, creada: true });
    }

    return NextResponse.json({ success: true, data, creada: false });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Actualizar configuración del tenant
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, ...campos } = body;

    if (!tenant_id) {
      return NextResponse.json({ success: false, error: 'Falta tenant_id' }, { status: 400 });
    }

    // Validar que los porcentajes sean razonables
    const validaciones = [
      { campo: 'porcentaje_cesantias', min: 0, max: 0.20 },
      { campo: 'porcentaje_prima', min: 0, max: 0.20 },
      { campo: 'porcentaje_vacaciones', min: 0, max: 0.10 },
      { campo: 'porcentaje_salud_empleador', min: 0, max: 0.15 },
      { campo: 'porcentaje_pension_empleador', min: 0, max: 0.20 },
      { campo: 'salario_minimo', min: 500000, max: 5000000 },
      { campo: 'auxilio_transporte', min: 0, max: 1000000 },
    ];

    for (const v of validaciones) {
      if (campos[v.campo] !== undefined) {
        const valor = Number(campos[v.campo]);
        if (isNaN(valor) || valor < v.min || valor > v.max) {
          return NextResponse.json({
            success: false,
            error: `${v.campo} debe estar entre ${v.min} y ${v.max}`
          }, { status: 400 });
        }
      }
    }

    // Verificar si existe
    const { data: existente } = await supabase
      .from('configuracion_nomina')
      .select('id')
      .eq('tenant_id', tenant_id)
      .maybeSingle();

    let resultado;
    if (existente) {
      const { data, error } = await supabase
        .from('configuracion_nomina')
        .update({ ...campos, updated_at: new Date().toISOString() })
        .eq('tenant_id', tenant_id)
        .select()
        .single();

      if (error) throw error;
      resultado = data;
    } else {
      const { data, error } = await supabase
        .from('configuracion_nomina')
        .insert([{ tenant_id, ...CONFIG_DEFAULT, ...campos }])
        .select()
        .single();

      if (error) throw error;
      resultado = data;
    }

    return NextResponse.json({ success: true, data: resultado });
  } catch (error: any) {
    console.error('Error PUT config:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}