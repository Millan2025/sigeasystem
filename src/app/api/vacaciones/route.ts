export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calcularDiasHabiles } from '@/lib/calculosNomina';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Listar vacaciones/permisos por tenant
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenant');
    const empleadoId = url.searchParams.get('empleado_id');
    const estado = url.searchParams.get('estado');
    const tipo = url.searchParams.get('tipo');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Falta tenant_id' }, { status: 400 });
    }

    let query = supabase
      .from('vacaciones_permisos')
      .select('*, employees(id, nombre, apellido, rol, salario_base)')
      .eq('tenant_id', tenantId);

    if (empleadoId) query = query.eq('empleado_id', empleadoId);
    if (estado) query = query.eq('estado', estado);
    if (tipo) query = query.eq('tipo', tipo);

    const { data, error } = await query.order('fecha_inicio', { ascending: false });

    if (error) {
      console.error('Error GET vacaciones:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Crear solicitud de vacaciones/permiso
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tenant_id, empleado_id, tipo, fecha_inicio, fecha_fin,
      motivo, notas
    } = body;

    if (!tenant_id || !empleado_id || !tipo || !fecha_inicio || !fecha_fin) {
      return NextResponse.json({
        success: false,
        error: 'Faltan campos obligatorios'
      }, { status: 400 });
    }

    // Validar tipo
    const tiposValidos = [
      'vacaciones', 'permiso_remunerado', 'permiso_no_remunerado',
      'incapacidad', 'licencia_maternidad', 'licencia_paternidad'
    ];
    if (!tiposValidos.includes(tipo)) {
      return NextResponse.json({
        success: false,
        error: `Tipo inválido. Válidos: ${tiposValidos.join(', ')}`
      }, { status: 400 });
    }

    // Validar fechas
    const inicio = new Date(fecha_inicio);
    const fin = new Date(fecha_fin);
    if (fin < inicio) {
      return NextResponse.json({
        success: false,
        error: 'fecha_fin debe ser posterior a fecha_inicio'
      }, { status: 400 });
    }

    // Calcular días hábiles y calendario
    const diasHabiles = calcularDiasHabiles(fecha_inicio, fecha_fin);
    const diasCalendario = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Validar que empleado no tenga otra solicitud activa en esas fechas
    const { data: solapadas } = await supabase
      .from('vacaciones_permisos')
      .select('id')
      .eq('empleado_id', empleado_id)
      .eq('tenant_id', tenant_id)
      .in('estado', ['pendiente', 'aprobado'])
      .or(`and(fecha_inicio.gte.${fecha_inicio},fecha_inicio.lte.${fecha_fin}),and(fecha_fin.gte.${fecha_inicio},fecha_fin.lte.${fecha_fin})`)
      .limit(1);

    if (solapadas && solapadas.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Ya existe una solicitud aprobada o pendiente en esas fechas'
      }, { status: 409 });
    }

    // Verificar si el empleado tiene días de vacaciones disponibles (solo para tipo "vacaciones")
    let diasDisponibles: number | null = null;
    if (tipo === 'vacaciones') {
      const { data: empleado } = await supabase
        .from('employees')
        .select('fecha_contratacion')
        .eq('id', empleado_id)
        .single();

      if (empleado) {
        const fechaContratacion = new Date(empleado.fecha_contratacion);
        const hoy = new Date();
        const aniosTrabajados = (hoy.getTime() - fechaContratacion.getTime()) / (1000 * 60 * 60 * 24 * 365);
        const diasAcumulados = Math.floor(aniosTrabajados * 15); // 15 días hábiles por año

        // Contar días ya tomados
        const { data: tomadas } = await supabase
          .from('vacaciones_permisos')
          .select('dias_habiles')
          .eq('empleado_id', empleado_id)
          .eq('tenant_id', tenant_id)
          .eq('tipo', 'vacaciones')
          .eq('estado', 'aprobado');

        const diasTomados = (tomadas || []).reduce((sum: number, v: any) => sum + (v.dias_habiles || 0), 0);
        diasDisponibles = diasAcumulados - diasTomados;

        if (diasHabiles > diasDisponibles) {
          return NextResponse.json({
            success: false,
            error: `Solo tienes ${diasDisponibles} días de vacaciones disponibles. Solicitaste ${diasHabiles}`,
            dias_disponibles: diasDisponibles,
          }, { status: 400 });
        }
      }
    }

    const { data, error } = await supabase
      .from('vacaciones_permisos')
      .insert([{
        tenant_id,
        empleado_id,
        tipo,
        fecha_inicio,
        fecha_fin,
        dias_habiles: diasHabiles,
        dias_calendario: diasCalendario,
        motivo: motivo || null,
        notas: notas || null,
        estado: 'pendiente',
      }])
      .select('*, employees(id, nombre, apellido, rol)')
      .single();

    if (error) {
      console.error('Error POST vacaciones:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      calculos: {
        dias_habiles: diasHabiles,
        dias_calendario: diasCalendario,
        dias_disponibles: diasDisponibles,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Aprobar o rechazar solicitud
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, tenant_id, estado, aprobado_por, notas } = body;

    if (!id || !tenant_id || !estado) {
      return NextResponse.json({
        success: false,
        error: 'id, tenant_id y estado son obligatorios'
      }, { status: 400 });
    }

    const estadosValidos = ['pendiente', 'aprobado', 'rechazado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json({
        success: false,
        error: `Estado inválido. Válidos: ${estadosValidos.join(', ')}`
      }, { status: 400 });
    }

    const updateData: any = {
      estado,
      notas: notas || null,
      updated_at: new Date().toISOString(),
    };

    if (estado === 'aprobado') {
      updateData.aprobado_por = aprobado_por || 'admin';
      updateData.aprobado_en = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('vacaciones_permisos')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .select('*, employees(id, nombre, apellido, rol)')
      .single();

    if (error) {
      console.error('Error PUT vacaciones:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminar solicitud (solo si está pendiente)
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

    // Verificar estado antes de eliminar
    const { data: solicitud } = await supabase
      .from('vacaciones_permisos')
      .select('estado')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (!solicitud) {
      return NextResponse.json({ success: false, error: 'Solicitud no encontrada' }, { status: 404 });
    }

    if (solicitud.estado !== 'pendiente' && solicitud.estado !== 'rechazado') {
      return NextResponse.json({
        success: false,
        error: 'Solo se pueden eliminar solicitudes pendientes o rechazadas'
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('vacaciones_permisos')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('Error DELETE vacaciones:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}