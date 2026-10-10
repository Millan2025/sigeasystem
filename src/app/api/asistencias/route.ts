export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { detectarTipoHora, calcularDistanciaMetros, FESTIVOS_COLOMBIA_2026 } from '@/lib/calculosNomina';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DISTANCIA_MAXIMA_METROS = 200;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenant');
    const empleadoId = url.searchParams.get('empleado_id');
    const fecha = url.searchParams.get('fecha');
    const fechaInicio = url.searchParams.get('start');
    const fechaFin = url.searchParams.get('end');
    const conEmpleado = url.searchParams.get('con_empleado') === 'true';

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Falta tenant_id' }, { status: 400 });
    }

    const selectQuery = conEmpleado
      ? '*, employees(id, nombre, apellido, rol, salario_base)'
      : '*';

    let query = supabase
      .from('asistencias')
      .select(selectQuery)
      .eq('tenant_id', tenantId);

    if (empleadoId) query = query.eq('empleado_id', empleadoId);
    if (fecha) query = query.eq('fecha', fecha);
    if (fechaInicio) query = query.gte('fecha', fechaInicio);
    if (fechaFin) query = query.lte('fecha', fechaFin);

    const { data, error } = await query
      .order('fecha', { ascending: false })
      .order('hora_entrada', { ascending: false });

    if (error) {
      console.error('Error GET asistencias:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tenant_id, empleado_id, fecha, hora_entrada,
      hora_entrada_programada, hora_salida_programada,
      latitud, longitud, direccion_check_in,
      biometric_token, notas,
      negocio_latitud, negocio_longitud
    } = body;

    if (!tenant_id || !empleado_id || !hora_entrada) {
      return NextResponse.json({
        success: false,
        error: 'tenant_id, empleado_id y hora_entrada son obligatorios'
      }, { status: 400 });
    }

    const fechaStr = fecha || new Date().toISOString().split('T')[0];
    const { data: existente } = await supabase
      .from('asistencias')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('empleado_id', empleado_id)
      .eq('fecha', fechaStr)
      .is('hora_salida', null)
      .maybeSingle();

    if (existente) {
      return NextResponse.json({
        success: false,
        error: 'Ya existe un check-in abierto hoy. Marca la salida primero.'
      }, { status: 409 });
    }

    const { esNocturno, esDominical } = detectarTipoHora(fechaStr, hora_entrada);
    const esFestivo = FESTIVOS_COLOMBIA_2026.includes(fechaStr);

    let distanciaMetros: number | null = null;
    let validacionGeo = 'no_aplica';

    if (latitud && longitud && negocio_latitud && negocio_longitud) {
      distanciaMetros = calcularDistanciaMetros(
        Number(latitud), Number(longitud),
        Number(negocio_latitud), Number(negocio_longitud)
      );

      if (distanciaMetros > DISTANCIA_MAXIMA_METROS) {
        validacionGeo = 'rechazado';
        return NextResponse.json({
          success: false,
          error: 'Debes estar en el local para marcar asistencia. Distancia: ' + Math.round(distanciaMetros) + 'm',
          distancia_metros: Math.round(distanciaMetros),
          distancia_maxima: DISTANCIA_MAXIMA_METROS
        }, { status: 403 });
      } else {
        validacionGeo = 'validado';
      }
    }

    const { data, error } = await supabase
      .from('asistencias')
      .insert([{
        tenant_id,
        empleado_id,
        fecha: fechaStr,
        hora_entrada,
        hora_salida: null,
        hora_entrada_programada: hora_entrada_programada || null,
        hora_salida_programada: hora_salida_programada || null,
        es_nocturno: esNocturno,
        es_dominical: esDominical,
        es_festivo: esFestivo,
        latitud: latitud || null,
        longitud: longitud || null,
        direccion_check_in: direccion_check_in || null,
        distancia_local_metros: distanciaMetros ? Math.round(distanciaMetros) : null,
        biometric_token: biometric_token || null,
        notas: notas || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error POST asistencias:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      detecciones: {
        es_nocturno: esNocturno,
        es_dominical: esDominical,
        es_festivo: esFestivo,
        validacion_geo: validacionGeo,
        distancia_metros: distanciaMetros ? Math.round(distanciaMetros) : null
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id, tenant_id, hora_salida, notas,
      latitud_salida, longitud_salida, direccion_salida
    } = body;

    if (!id || !tenant_id || !hora_salida) {
      return NextResponse.json({
        success: false,
        error: 'id, tenant_id y hora_salida son obligatorios'
      }, { status: 400 });
    }

    const { data: asistencia, error: getErr } = await supabase
      .from('asistencias')
      .select('fecha, hora_entrada')
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .single();

    if (getErr || !asistencia) {
      return NextResponse.json({ success: false, error: 'Asistencia no encontrada' }, { status: 404 });
    }

    const { esNocturno: salidaNocturna } = detectarTipoHora(asistencia.fecha, hora_salida);

    const updateData: Record<string, any> = {
      hora_salida,
      notas: notas || null,
      updated_at: new Date().toISOString()
    };

    if (latitud_salida) updateData.latitud_salida = latitud_salida;
    if (longitud_salida) updateData.longitud_salida = longitud_salida;
    if (direccion_salida) updateData.direccion_salida = direccion_salida;

    const { data, error } = await supabase
      .from('asistencias')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .select()
      .single();

    if (error) {
      console.error('Error PUT asistencias:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      horas_extra_calculadas: {
        horas_diurnas: data.horas_extra_diurnas || 0,
        horas_nocturnas: data.horas_extra_nocturnas || 0,
        horas_dominicales: data.horas_extra_dominicales || 0,
        valor_total: data.valor_horas_extra || 0
      },
      salida_nocturna: salidaNocturna
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

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
      .from('asistencias')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('Error DELETE asistencias:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}