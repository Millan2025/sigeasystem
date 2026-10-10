export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Listar evaluaciones por tenant
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenant');
    const empleadoId = url.searchParams.get('empleado_id');
    const fechaInicio = url.searchParams.get('start');
    const fechaFin = url.searchParams.get('end');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Falta tenant_id' }, { status: 400 });
    }

    let query = supabase
      .from('evaluaciones')
      .select('*, employees(id, nombre, apellido, rol)')
      .eq('tenant_id', tenantId);

    if (empleadoId) query = query.eq('empleado_id', empleadoId);
    if (fechaInicio) query = query.gte('fecha', fechaInicio);
    if (fechaFin) query = query.lte('fecha', fechaFin);

    const { data, error } = await query.order('fecha', { ascending: false });

    if (error) {
      console.error('Error GET evaluaciones:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Calcular promedios por empleado (si se pide con ?con_promedios=true)
    const conPromedios = url.searchParams.get('con_promedios') === 'true';
    let promedios: any[] = [];

    if (conPromedios && data && data.length > 0) {
      const porEmpleado: Record<string, any[]> = {};
      for (const ev of data) {
        if (!porEmpleado[ev.empleado_id]) porEmpleado[ev.empleado_id] = [];
        porEmpleado[ev.empleado_id].push(ev);
      }

      promedios = Object.entries(porEmpleado).map(([empId, evals]) => {
        const n = evals.length;
        const promPuntualidad = evals.reduce((s, e) => s + (e.puntualidad || 0), 0) / n;
        const promProductividad = evals.reduce((s, e) => s + (e.productividad || 0), 0) / n;
        const promEquipo = evals.reduce((s, e) => s + (e.trabajo_equipo || 0), 0) / n;
        const promCliente = evals.reduce((s, e) => s + (e.atencion_cliente || 0), 0) / n;
        const promGeneral = (promPuntualidad + promProductividad + promEquipo + promCliente) / 4;

        return {
          empleado_id: empId,
          nombre: evals[0].employees?.nombre || '',
          evaluaciones_count: n,
          promedios: {
            puntualidad: Math.round(promPuntualidad * 10) / 10,
            productividad: Math.round(promProductividad * 10) / 10,
            trabajo_equipo: Math.round(promEquipo * 10) / 10,
            atencion_cliente: Math.round(promCliente * 10) / 10,
            general: Math.round(promGeneral * 10) / 10,
          },
        };
      });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      promedios: conPromedios ? promedios : undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Crear evaluación
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tenant_id, empleado_id, fecha, evaluado_por,
      puntualidad, productividad, trabajo_equipo, atencion_cliente,
      comentarios, plan_mejora
    } = body;

    if (!tenant_id || !empleado_id || !fecha) {
      return NextResponse.json({
        success: false,
        error: 'Faltan: tenant_id, empleado_id, fecha'
      }, { status: 400 });
    }

    // Validar calificaciones (1-5)
    const campos = { puntualidad, productividad, trabajo_equipo, atencion_cliente };
    for (const [campo, valor] of Object.entries(campos)) {
      if (valor !== undefined && valor !== null) {
        const num = Number(valor);
        if (isNaN(num) || num < 1 || num > 5) {
          return NextResponse.json({
            success: false,
            error: `${campo} debe estar entre 1 y 5`
          }, { status: 400 });
        }
      }
    }

    // Verificar que el empleado existe
    const { data: empleado } = await supabase
      .from('employees')
      .select('id, nombre')
      .eq('id', empleado_id)
      .eq('tenant_id', tenant_id)
      .maybeSingle();

    if (!empleado) {
      return NextResponse.json({
        success: false,
        error: 'Empleado no encontrado en este tenant'
      }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('evaluaciones')
      .insert([{
        tenant_id,
        empleado_id,
        fecha,
        evaluado_por: evaluado_por || 'admin',
        puntualidad: puntualidad || null,
        productividad: productividad || null,
        trabajo_equipo: trabajo_equipo || null,
        atencion_cliente: atencion_cliente || null,
        comentarios: comentarios || null,
        plan_mejora: plan_mejora || null,
      }])
      .select('*, employees(id, nombre, apellido, rol)')
      .single();

    if (error) {
      console.error('Error POST evaluaciones:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Actualizar evaluación
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

    // Validar calificaciones si vienen
    const camposCalif = ['puntualidad', 'productividad', 'trabajo_equipo', 'atencion_cliente'];
    for (const campo of camposCalif) {
      if (campos[campo] !== undefined) {
        const num = Number(campos[campo]);
        if (isNaN(num) || num < 1 || num > 5) {
          return NextResponse.json({
            success: false,
            error: `${campo} debe estar entre 1 y 5`
          }, { status: 400 });
        }
      }
    }

    const { data, error } = await supabase
      .from('evaluaciones')
      .update(campos)
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .select('*, employees(id, nombre, apellido, rol)')
      .single();

    if (error) {
      console.error('Error PUT evaluaciones:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminar evaluación
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
      .from('evaluaciones')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('Error DELETE evaluaciones:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}