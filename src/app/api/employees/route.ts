export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Listar empleados por tenant
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenant');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Falta tenant_id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error GET employees:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Crear empleado (con nuevos campos)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tenant_id, nombre, apellido, telefono, email, rol, salario_base,
      fecha_contratacion, activo,
      // Nuevos campos
      tipo_contrato, salario_integral, riesgo_arl,
      aplica_comision, porcentaje_comision,
      documento_identidad, fecha_nacimiento, direccion,
      cuenta_bancaria, banco
    } = body;

    if (!tenant_id || !nombre) {
      return NextResponse.json({
        success: false,
        error: 'tenant_id y nombre son obligatorios'
      }, { status: 400 });
    }

    // Validar porcentaje de comisión
    if (porcentaje_comision !== undefined && porcentaje_comision !== null) {
      const pct = Number(porcentaje_comision);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        return NextResponse.json({
          success: false,
          error: 'porcentaje_comision debe estar entre 0 y 100'
        }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from('employees')
      .insert([{
        tenant_id,
        nombre,
        apellido: apellido || null,
        telefono: telefono || null,
        email: email || null,
        rol: rol || 'empleado',
        cargo: rol || 'empleado',
        salario_base: salario_base || 0,
        fecha_contratacion: fecha_contratacion || new Date().toISOString().split('T')[0],
        activo: activo !== undefined ? activo : true,
        // Nuevos campos
        tipo_contrato: tipo_contrato || 'tiempo_completo',
        salario_integral: salario_integral === true,
        riesgo_arl: riesgo_arl || 'I',
        aplica_comision: aplica_comision === true,
        porcentaje_comision: porcentaje_comision || 0,
        documento_identidad: documento_identidad || null,
        fecha_nacimiento: fecha_nacimiento || null,
        direccion: direccion || null,
        cuenta_bancaria: cuenta_bancaria || null,
        banco: banco || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error POST employees:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Actualizar empleado
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, tenant_id, ...campos } = body;

    if (!id || !tenant_id) {
      return NextResponse.json({
        success: false,
        error: 'id y tenant_id son obligatorios'
      }, { status: 400 });
    }

    // Validar porcentaje de comisión si viene
    if (campos.porcentaje_comision !== undefined) {
      const pct = Number(campos.porcentaje_comision);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        return NextResponse.json({
          success: false,
          error: 'porcentaje_comision debe estar entre 0 y 100'
        }, { status: 400 });
      }
    }

    // Convertir booleanos
    if (campos.salario_integral !== undefined) {
      campos.salario_integral = campos.salario_integral === true;
    }
    if (campos.aplica_comision !== undefined) {
      campos.aplica_comision = campos.aplica_comision === true;
    }

    const { data, error } = await supabase
      .from('employees')
      .update({ ...campos, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .select()
      .single();

    if (error) {
      console.error('Error PUT employees:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminar empleado
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const tenantId = url.searchParams.get('tenant');

    if (!id || !tenantId) {
      return NextResponse.json({
        success: false,
        error: 'id y tenant son obligatorios'
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('Error DELETE employees:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}